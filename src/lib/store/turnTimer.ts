import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { appSettings } from './appSettings';
import { appState, nextTurn } from './appState';
import { vibrate } from '$lib/utils/haptics';

type TimerState = {
    remaining: number; // seconds
    total: number; // seconds
    running: boolean;
    playerIndex: number | null;
};

type PersistedTurnTimerState = {
    state: TimerState;
    lastTickEpochMs: number;
};

const STORAGE_KEY = 'turnTimerState';

const createTurnTimer = () => {
    const isBrowser = typeof window !== 'undefined';

    const readPersistedState = (): PersistedTurnTimerState | null => {
        if (!isBrowser) return null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as PersistedTurnTimerState;
            if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
            if (typeof parsed.lastTickEpochMs !== 'number') return null;
            return parsed;
        } catch {
            return null;
        }
    };

    const persisted = readPersistedState();
    let lastTickEpochMs = persisted?.lastTickEpochMs || Date.now();
    let initialState: TimerState = persisted?.state || { remaining: 0, total: 0, running: false, playerIndex: null };

    if (initialState.running) {
        const elapsed = Math.max(0, Math.floor((Date.now() - lastTickEpochMs) / 1000));
        if (elapsed > 0) {
            initialState = {
                ...initialState,
                remaining: initialState.remaining - elapsed
            };
        }
        lastTickEpochMs = Date.now();
    }

    const { subscribe, set, update } = writable<TimerState>(initialState);
    let interval: number | null = null;
    let state: TimerState = initialState;
    // keep local copy in sync
    subscribe((s) => {
        state = s;
        if (isBrowser) {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        state: s,
                        lastTickEpochMs
                    } satisfies PersistedTurnTimerState)
                );
            } catch {
                // ignore storage write errors
            }
        }
    });

    const stopInternal = () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    const notifyTimeoutReached = () => {
        try {
            if (get(appSettings).hapticsEnabled) vibrate(200);
        } catch (e) {
            // ignore
        }
        if (get(appSettings).turnTimerSound) {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 880;
                o.connect(g);
                g.connect(ctx.destination);
                g.gain.value = 0.0001;
                o.start();
                g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
                setTimeout(() => {
                    o.stop();
                    try { ctx.close(); } catch (e) {}
                }, 300);
            } catch (e) {
                // ignore
            }
        }
    };

    const advanceByElapsed = (s: TimerState, elapsedSeconds: number): TimerState => {
        if (!s.running || elapsedSeconds <= 0) return s;

        const nextRemaining = s.remaining - elapsedSeconds;
        const crossedTimeout = s.remaining > 0 && nextRemaining <= 0;
        const next = { ...s, remaining: nextRemaining };
        if (crossedTimeout) {
            notifyTimeoutReached();
        }
        return next;
    };

    const syncWithWallClock = () => {
        if (!state.running) {
            lastTickEpochMs = Date.now();
            return;
        }

        const now = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((now - lastTickEpochMs) / 1000));
        if (elapsedSeconds <= 0) return;

        lastTickEpochMs += elapsedSeconds * 1000;
        update((s) => advanceByElapsed(s, elapsedSeconds));
    };

    const ensureIntervalRunning = () => {
        if (interval) return;
        interval = setInterval(() => {
            syncWithWallClock();
        }, 1000) as unknown as number;
    };

    const startForPlayer = (playerIndex: number, options?: { forceReset?: boolean }) => {
        const forceReset = !!options?.forceReset;
        const duration = get(appSettings).turnTimerDuration || 240;
        // If already running for this player, don't reset
        if (!forceReset && state.playerIndex === playerIndex && state.running) return;
        // If same player but currently paused, resume without resetting
        if (!forceReset && state.playerIndex === playerIndex && !state.running) {
            // start interval without resetting remaining/total (supports overtime too)
            lastTickEpochMs = Date.now();
            ensureIntervalRunning();
            update((s) => ({ ...s, running: true }));
            return;
        }
        // Start fresh for (possibly different) player
        stopInternal();
        lastTickEpochMs = Date.now();
        set({ remaining: duration, total: duration, running: true, playerIndex });
        ensureIntervalRunning();
    };

    const pause = () => {
        // stop interval but keep remaining and playerIndex
        syncWithWallClock();
        stopInternal();
        lastTickEpochMs = Date.now();
        update((s) => ({ ...s, running: false }));
    };

    const resume = () => {
        // resume only if there's an active playerIndex
        if (state.playerIndex === null) return;
        if (state.running) return;
        // start interval if not present
        lastTickEpochMs = Date.now();
        ensureIntervalRunning();
        update((s) => ({ ...s, running: true }));
    };

    const stop = () => {
        syncWithWallClock();
        stopInternal();
        lastTickEpochMs = Date.now();
        update((s) => ({ ...s, running: false }));
    };

    const resetForCurrent = (forceReset = false) => {
        const idx = get(appState).currentTurn;
        if (idx >= 0) startForPlayer(idx, { forceReset });
        else stop();
    };

    if (isBrowser) {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                syncWithWallClock();
            }
        });

        window.addEventListener('focus', () => {
            syncWithWallClock();
        });

        if (state.running) {
            ensureIntervalRunning();
        }
    }

    return {
        subscribe,
        startForPlayer,
        pause,
        resume,
        stop,
        resetForCurrent
    };
};

export const turnTimer = createTurnTimer();

export default turnTimer;
