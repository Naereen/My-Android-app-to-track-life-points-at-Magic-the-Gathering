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

const createGlobalGameTimer = () => {
	const initialDuration = get(appSettings).globalGameTimerDuration || 5400;
	const { subscribe, set, update } = writable<GlobalGameTimerState>({
		remaining: initialDuration,
		total: initialDuration,
		running: false,
		minutePulseId: 0,
		minutePulseKind: 'positive'
	});

	let state: GlobalGameTimerState = {
		remaining: initialDuration,
		total: initialDuration,
		running: false,
		minutePulseId: 0,
		minutePulseKind: 'positive'
	};
	let interval: number | null = null;
	const isBrowser = typeof window !== 'undefined';

	subscribe((s) => {
		state = s;
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

	const tick = (s: GlobalGameTimerState): GlobalGameTimerState => {
		if (!s.running) return s;

		const nextRemaining = s.remaining - 1;
		const crossedTimeout = s.remaining > 0 && nextRemaining <= 0;
		const shouldPulse = nextRemaining % 60 === 0;

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

	const startInternal = () => {
		if (!isBrowser || interval) return;
		interval = setInterval(() => {
			update((s) => tick(s));
		}, 1000) as unknown as number;
	};

	const start = () => {
		if (!isBrowser) return;
		if (!get(appSettings).globalGameTimerEnabled) return;
		if (state.running) return;
		update((s) => ({ ...s, running: true }));
		startInternal();
	};

	const stop = () => {
		stopInternal();
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
		appSettings.subscribe((settings) => {
			if (!settings.globalGameTimerEnabled) {
				stop();
				return;
			}
			if (!state.running && settings.globalGameTimerEnabled) {
				start();
			}
		});
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
