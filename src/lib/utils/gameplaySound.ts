import { get } from 'svelte/store';
import { appSettings } from '$lib/store/appSettings';

export type GameplaySoundType =
	| 'bigLifeUp'
	| 'bigLifeDown'
	| 'bigCommanderUp'
	| 'bigCommanderDown'
	| 'ko'
	| 'victory'
	| 'timerTimeout'
	| 'matchTimeout';

type Tone = {
	frequency: number;
	duration: number;
	wave: OscillatorType;
	gain: number;
	gap?: number;
	toFrequency?: number;
	filterStartHz?: number;
	filterEndHz?: number;
	detuneCents?: number;
	attack?: number;
	release?: number;
};

type PlaySoundOptions = {
	ignoreSoundEffectsSetting?: boolean;
};

type CommanderBurstDirection = 'up' | 'down';

const SOUND_PATTERNS: Record<GameplaySoundType, Tone[]> = {
	// The tone recipes intentionally map game semantics to distinct timbres so players can
	// recognize what happened without looking directly at the screen.
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
	],
	timerTimeout: [
		{
			frequency: 932.33,
			toFrequency: 783.99,
			duration: 0.12,
			wave: 'triangle',
			gain: 0.022,
			gap: 0.02,
			filterStartHz: 3200,
			filterEndHz: 1800,
			detuneCents: 5
		},
		{
			frequency: 698.46,
			toFrequency: 523.25,
			duration: 0.18,
			wave: 'triangle',
			gain: 0.024,
			filterStartHz: 2200,
			filterEndHz: 1200,
			detuneCents: -6
		}
	],
	matchTimeout: [
		{
			frequency: 246.94,
			toFrequency: 220,
			duration: 0.5,
			wave: 'sawtooth',
			gain: 0.026,
			gap: 0.045,
			filterStartHz: 1900,
			filterEndHz: 850,
			detuneCents: 4,
			attack: 0.015,
			release: 0.28
		},
		{
			frequency: 220,
			toFrequency: 196,
			duration: 1.1,
			wave: 'sawtooth',
			gain: 0.03,
			filterStartHz: 1200,
			filterEndHz: 450,
			detuneCents: -5,
			attack: 0.02,
			release: 0.8
		}
	]
};

let audioContext: AudioContext | null = null;

/**
 * Checks runtime support and user preference before creating or using WebAudio.
 * @returns {boolean} `true` when sound effects are enabled and an audio context implementation exists.
 */
const canPlaySound = (options?: PlaySoundOptions) => {
	if (typeof window === 'undefined') return false;
	if (!options?.ignoreSoundEffectsSetting && !get(appSettings).soundEffectsEnabled) return false;
	// WebAudio support is checked lazily because some browsers expose the API only after
	// user interaction or in a partially suspended state.
	return !!(
		window.AudioContext ||
		(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	);
};

const getAudioContext = (options?: PlaySoundOptions): AudioContext | null => {
	if (!canPlaySound(options)) return null;
	if (audioContext && audioContext.state !== 'closed') return audioContext;
	const Ctx =
		window.AudioContext ||
		(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctx) return null;
	audioContext = new Ctx();
	return audioContext;
};

/**
 * Schedules one synthesized tone with fade-in/fade-out envelope in the audio graph.
 * @param {AudioContext} ctx Active audio context.
 * @param {Tone} tone Frequency, duration, oscillator waveform and gain parameters.
 * @param {number} startAt AudioContext timeline position (in seconds).
 * @returns {void}
 */
const playTone = (ctx: AudioContext, tone: Tone, startAt: number) => {
	const oscillator = ctx.createOscillator();
	const supportingOscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();
	const filter = ctx.createBiquadFilter();

	const attack = Math.max(0.005, tone.attack ?? 0.01);
	const release = Math.max(0.01, tone.release ?? Math.max(0.02, tone.duration * 0.7));
	const peakGain = Math.max(0.0001, tone.gain);
	const endAt = startAt + tone.duration;

	oscillator.type = tone.wave;
	supportingOscillator.type = tone.wave;
	oscillator.frequency.setValueAtTime(tone.frequency, startAt);
	supportingOscillator.frequency.setValueAtTime(tone.frequency, startAt);
	oscillator.detune.setValueAtTime(tone.detuneCents ?? 0, startAt);
	supportingOscillator.detune.setValueAtTime((tone.detuneCents ?? 0) * -0.6, startAt);

	if (tone.toFrequency) {
		oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, tone.toFrequency), endAt);
		supportingOscillator.frequency.exponentialRampToValueAtTime(
			Math.max(40, tone.toFrequency),
			endAt
		);
	}

	filter.type = 'lowpass';
	const filterStartHz = Math.max(160, tone.filterStartHz ?? tone.frequency * 2.8);
	const filterEndHz = Math.max(120, tone.filterEndHz ?? Math.max(180, tone.frequency * 1.2));
	filter.frequency.setValueAtTime(filterStartHz, startAt);
	filter.frequency.exponentialRampToValueAtTime(filterEndHz, endAt);
	filter.Q.setValueAtTime(0.8, startAt);

	oscillator.connect(filter);
	supportingOscillator.connect(filter);
	filter.connect(gainNode);
	gainNode.connect(ctx.destination);

	gainNode.gain.setValueAtTime(0.0001, startAt);
	gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + attack);
	gainNode.gain.exponentialRampToValueAtTime(
		0.0001,
		Math.max(startAt + attack + 0.01, endAt + release)
	);

	oscillator.start(startAt);
	supportingOscillator.start(startAt);
	oscillator.stop(endAt + release + 0.02);
	supportingOscillator.stop(endAt + release + 0.02);
};

/**
 * Plays one predefined gameplay sound sequence (life swings, commander swings, KO, victory).
 * @param {GameplaySoundType} sound Symbolic key for the tone pattern to schedule.
 * @returns {void}
 */
export const playGameplaySound = (sound: GameplaySoundType, options?: PlaySoundOptions) => {
	const ctx = getAudioContext(options);
	if (!ctx) return;

	if (ctx.state === 'suspended') {
		void ctx.resume();
	}

	const pattern = SOUND_PATTERNS[sound];
	if (!pattern?.length) return;

	let cursor = ctx.currentTime + 0.005;
	for (const tone of pattern) {
		// Schedule each tone slightly after the previous one so the melody feels intentional
		// instead of like a raw, overlapping oscillator burst.
		playTone(ctx, tone, cursor);
		cursor += tone.duration + (tone.gap ?? 0);
	}
};

/**
 * Plays one aggregated commander-damage cue after a burst of quick taps.
 * The cue gets louder/longer as hit count grows, but remains a single audio event.
 * @param {number} hitCount Number of taps merged in the burst.
 * @param {CommanderBurstDirection} direction Damage direction semantic (`down` for adding damage taken).
 * @param {PlaySoundOptions} [options] Sound playback options.
 * @returns {void}
 */
export const playCommanderDamageBurst = (
	hitCount: number,
	direction: CommanderBurstDirection,
	options?: PlaySoundOptions
) => {
	const ctx = getAudioContext(options);
	if (!ctx) return;

	if (ctx.state === 'suspended') {
		void ctx.resume();
	}

	const cappedHits = Math.max(1, Math.min(20, Math.round(hitCount)));
	const intensity = Math.min(1, (cappedHits - 1) / 11);
	const isDown = direction === 'down';
	const startAt = ctx.currentTime + 0.005;

	const primaryStart = isDown ? 760 : 430;
	const primaryEnd = isDown ? 360 - intensity * 70 : 780 + intensity * 180;
	const primaryDuration = 0.16 + intensity * 0.28;
	const primaryGain = 0.022 + intensity * 0.028;

	playTone(
		ctx,
		{
			frequency: primaryStart,
			toFrequency: primaryEnd,
			duration: primaryDuration,
			wave: isDown ? 'square' : 'triangle',
			gain: primaryGain,
			filterStartHz: 2800 - intensity * 900,
			filterEndHz: 900 + intensity * 500,
			detuneCents: isDown ? 4 : -4,
			attack: 0.01,
			release: 0.2 + intensity * 0.25
		},
		startAt
	);

	if (cappedHits >= 4) {
		playTone(
			ctx,
			{
				frequency: isDown ? primaryEnd * 1.05 : primaryEnd * 0.82,
				toFrequency: isDown ? primaryEnd * 0.75 : primaryEnd * 1.18,
				duration: 0.1 + intensity * 0.18,
				wave: isDown ? 'sawtooth' : 'triangle',
				gain: primaryGain * 0.58,
				filterStartHz: 2200,
				filterEndHz: 700,
				detuneCents: isDown ? -6 : 6,
				attack: 0.01,
				release: 0.16 + intensity * 0.2
			},
			startAt + primaryDuration * 0.45
		);
	}
};
