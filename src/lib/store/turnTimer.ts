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

const createTurnTimer = () => {
    const { subscribe, set, update } = writable<TimerState>({ remaining: 0, total: 0, running: false, playerIndex: null });
    let interval: number | null = null;
    let state: TimerState = { remaining: 0, total: 0, running: false, playerIndex: null };
    // keep local copy in sync
    subscribe((s) => (state = s));

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

    const tickTimer = (s: TimerState): TimerState => {
        if (!s.running) return s;
        const nextRemaining = s.remaining - 1;
        const crossedTimeout = s.remaining > 0 && nextRemaining <= 0;
        const next = { ...s, remaining: nextRemaining };
        if (crossedTimeout) {
            notifyTimeoutReached();
        }
        return next;
    };

    const startForPlayer = (playerIndex: number, options?: { forceReset?: boolean }) => {
        const forceReset = !!options?.forceReset;
        const duration = get(appSettings).turnTimerDuration || 240;
        // If already running for this player, don't reset
        if (!forceReset && state.playerIndex === playerIndex && state.running) return;
        // If same player but currently paused, resume without resetting
        if (!forceReset && state.playerIndex === playerIndex && !state.running) {
            // start interval without resetting remaining/total (supports overtime too)
            if (!interval) {
                interval = setInterval(() => {
                    update((s) => tickTimer(s));
                }, 1000) as unknown as number;
            }
            update((s) => ({ ...s, running: true }));
            return;
        }
        // Start fresh for (possibly different) player
        stopInternal();
        set({ remaining: duration, total: duration, running: true, playerIndex });
        interval = setInterval(() => {
            update((s) => tickTimer(s));
        }, 1000) as unknown as number;
    };

    const pause = () => {
        // stop interval but keep remaining and playerIndex
        stopInternal();
        update((s) => ({ ...s, running: false }));
    };

    const resume = () => {
        // resume only if there's an active playerIndex
        if (state.playerIndex === null) return;
        if (state.running) return;
        // start interval if not present
        if (!interval) {
            interval = setInterval(() => {
                update((s) => tickTimer(s));
            }, 1000) as unknown as number;
        }
        update((s) => ({ ...s, running: true }));
    };

    const stop = () => {
        stopInternal();
        update((s) => ({ ...s, running: false }));
    };

    const resetForCurrent = (forceReset = false) => {
        const idx = get(appState).currentTurn;
        if (idx >= 0) startForPlayer(idx, { forceReset });
        else stop();
    };

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
