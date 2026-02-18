import { get } from 'svelte/store';
import { appSettings } from '$lib/store/appSettings';

export type GameplaySoundType =
	| 'bigLifeUp'
	| 'bigLifeDown'
	| 'bigCommanderUp'
	| 'bigCommanderDown'
	| 'ko'
	| 'victory';

type Tone = {
	frequency: number;
	duration: number;
	wave: OscillatorType;
	gain: number;
	gap?: number;
};

const SOUND_PATTERNS: Record<GameplaySoundType, Tone[]> = {
	bigLifeUp: [
		{ frequency: 620, duration: 0.07, wave: 'triangle', gain: 0.025, gap: 0.015 },
		{ frequency: 820, duration: 0.1, wave: 'triangle', gain: 0.03 }
	],
	bigLifeDown: [
		{ frequency: 520, duration: 0.07, wave: 'sawtooth', gain: 0.023, gap: 0.015 },
		{ frequency: 310, duration: 0.11, wave: 'sawtooth', gain: 0.028 }
	],
	bigCommanderUp: [
		{ frequency: 780, duration: 0.065, wave: 'square', gain: 0.018, gap: 0.01 },
		{ frequency: 980, duration: 0.065, wave: 'square', gain: 0.02, gap: 0.01 },
		{ frequency: 1180, duration: 0.085, wave: 'square', gain: 0.02 }
	],
	bigCommanderDown: [
		{ frequency: 730, duration: 0.07, wave: 'square', gain: 0.017, gap: 0.01 },
		{ frequency: 560, duration: 0.07, wave: 'square', gain: 0.019, gap: 0.01 },
		{ frequency: 380, duration: 0.09, wave: 'square', gain: 0.021 }
	],
	ko: [
		{ frequency: 300, duration: 0.1, wave: 'sine', gain: 0.03, gap: 0.012 },
		{ frequency: 220, duration: 0.16, wave: 'sine', gain: 0.035 }
	],
	victory: [
		{ frequency: 523.25, duration: 0.09, wave: 'triangle', gain: 0.025, gap: 0.015 },
		{ frequency: 659.25, duration: 0.09, wave: 'triangle', gain: 0.025, gap: 0.015 },
		{ frequency: 783.99, duration: 0.13, wave: 'triangle', gain: 0.028 }
	]
};

let audioContext: AudioContext | null = null;

const canPlaySound = () => {
	if (typeof window === 'undefined') return false;
	if (!get(appSettings).soundEffectsEnabled) return false;
	return !!(window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
};

const getAudioContext = (): AudioContext | null => {
	if (!canPlaySound()) return null;
	if (audioContext && audioContext.state !== 'closed') return audioContext;
	const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctx) return null;
	audioContext = new Ctx();
	return audioContext;
};

const playTone = (ctx: AudioContext, tone: Tone, startAt: number) => {
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.type = tone.wave;
	oscillator.frequency.setValueAtTime(tone.frequency, startAt);
	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	gainNode.gain.setValueAtTime(0.0001, startAt);
	gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, tone.gain), startAt + 0.01);
	gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.duration);

	oscillator.start(startAt);
	oscillator.stop(startAt + tone.duration + 0.02);
};

export const playGameplaySound = (sound: GameplaySoundType) => {
	const ctx = getAudioContext();
	if (!ctx) return;

	if (ctx.state === 'suspended') {
		void ctx.resume();
	}

	const pattern = SOUND_PATTERNS[sound];
	if (!pattern?.length) return;

	let cursor = ctx.currentTime + 0.005;
	for (const tone of pattern) {
		playTone(ctx, tone, cursor);
		cursor += tone.duration + (tone.gap ?? 0);
	}
};