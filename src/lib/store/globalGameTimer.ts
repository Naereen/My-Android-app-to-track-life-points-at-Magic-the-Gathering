import { get, writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { vibrate } from '$lib/utils/haptics';

type MinutePulseKind = 'positive' | 'negative';

type GlobalGameTimerState = {
	remaining: number; // seconds, can be negative after timeout
	total: number; // seconds
	running: boolean;
	minutePulseId: number;
	minutePulseKind: MinutePulseKind;
};

type PersistedGlobalGameTimerState = {
	state: GlobalGameTimerState;
	lastTickEpochMs: number;
};

const STORAGE_KEY = 'globalGameTimerState';

const createGlobalGameTimer = () => {
	const isBrowser = typeof window !== 'undefined';
	const initialDuration = get(appSettings).globalGameTimerDuration || 5400;

	const readPersistedState = (): PersistedGlobalGameTimerState | null => {
		if (!isBrowser) return null;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as PersistedGlobalGameTimerState;
			if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
			if (typeof parsed.lastTickEpochMs !== 'number') return null;
			return parsed;
		} catch {
			return null;
		}
	};

	const persisted = readPersistedState();
	let lastTickEpochMs = persisted?.lastTickEpochMs || Date.now();
	let initialState: GlobalGameTimerState =
		persisted?.state || {
			remaining: initialDuration,
			total: initialDuration,
			running: false,
			minutePulseId: 0,
			minutePulseKind: 'positive'
		};

	if (initialState.running) {
		const elapsed = Math.max(0, Math.floor((Date.now() - lastTickEpochMs) / 1000));
		if (elapsed > 0) {
			const nextRemaining = initialState.remaining - elapsed;
			initialState = {
				...initialState,
				remaining: nextRemaining,
				minutePulseKind: nextRemaining < 0 ? 'negative' : 'positive'
			};
		}
		lastTickEpochMs = Date.now();
	}

	const { subscribe, set, update } = writable<GlobalGameTimerState>({
		...initialState
	});

	let state: GlobalGameTimerState = initialState;
	let interval: number | null = null;

	subscribe((s) => {
		state = s;
		if (isBrowser) {
			try {
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({
						state: s,
						lastTickEpochMs
					} satisfies PersistedGlobalGameTimerState)
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

	const playTimeoutAlert = () => {
		const settings = get(appSettings);
		if (settings.hapticsEnabled) {
			try {
				vibrate(1000);
			} catch {
				// ignore
			}
		}

		if (settings.soundEffectsEnabled && isBrowser) {
			try {
				const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
				const o = ctx.createOscillator();
				const g = ctx.createGain();
				o.type = 'sawtooth';
				o.frequency.value = 220;
				o.connect(g);
				g.connect(ctx.destination);
				g.gain.value = 0.0001;
				o.start();
				g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
				g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
				setTimeout(() => {
					o.stop();
					try {
						ctx.close();
					} catch {
						// ignore
					}
				}, 1900);
			} catch {
				// ignore
			}
		}
	};

	const advanceByElapsed = (s: GlobalGameTimerState, elapsedSeconds: number): GlobalGameTimerState => {
		if (!s.running || elapsedSeconds <= 0) return s;

		const nextRemaining = s.remaining - elapsedSeconds;
		const crossedTimeout = s.remaining > 0 && nextRemaining <= 0;
		const shouldPulse = Math.trunc(s.remaining / 60) !== Math.trunc(nextRemaining / 60);

		if (crossedTimeout) {
			playTimeoutAlert();
		}

		return {
			...s,
			remaining: nextRemaining,
			minutePulseId: shouldPulse ? s.minutePulseId + 1 : s.minutePulseId,
			minutePulseKind: nextRemaining < 0 ? 'negative' : 'positive'
		};
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

	const startInternal = () => {
		if (!isBrowser || interval) return;
		interval = setInterval(() => {
			syncWithWallClock();
		}, 1000) as unknown as number;
	};

	const start = () => {
		if (!isBrowser) return;
		if (!get(appSettings).globalGameTimerEnabled) return;
		if (state.running) return;
		lastTickEpochMs = Date.now();
		update((s) => ({ ...s, running: true }));
		startInternal();
	};

	const stop = () => {
		syncWithWallClock();
		stopInternal();
		lastTickEpochMs = Date.now();
		update((s) => ({ ...s, running: false }));
	};

	const togglePause = () => {
		if (state.running) {
			stop();
			return;
		}
		start();
	};

	const resetForNewGame = () => {
		const duration = Math.max(1, Math.round(get(appSettings).globalGameTimerDuration || 5400));
		lastTickEpochMs = Date.now();
		set({
			remaining: duration,
			total: duration,
			running: false,
			minutePulseId: state.minutePulseId,
			minutePulseKind: 'positive'
		});
		if (get(appSettings).globalGameTimerEnabled) {
			start();
		}
	};

	const applyDuration = (durationSeconds: number) => {
		const duration = Math.max(1, Math.round(durationSeconds));
		lastTickEpochMs = Date.now();
		set({
			remaining: duration,
			total: duration,
			running: false,
			minutePulseId: state.minutePulseId,
			minutePulseKind: 'positive'
		});
		if (get(appSettings).globalGameTimerEnabled) {
			start();
		}
	};

	if (isBrowser) {
		let previousEnabled = get(appSettings).globalGameTimerEnabled;

		appSettings.subscribe((settings) => {
			if (!settings.globalGameTimerEnabled) {
				stop();
				previousEnabled = false;
				return;
			}
			if (!previousEnabled && settings.globalGameTimerEnabled) {
				start();
			}
			previousEnabled = settings.globalGameTimerEnabled;
		});

		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) {
				syncWithWallClock();
			}
		});

		window.addEventListener('focus', () => {
			syncWithWallClock();
		});

		if (state.running) {
			startInternal();
		}
	}

	return {
		subscribe,
		start,
		stop,
		togglePause,
		resetForNewGame,
		applyDuration
	};
};

export const globalGameTimer = createGlobalGameTimer();

export default globalGameTimer;
