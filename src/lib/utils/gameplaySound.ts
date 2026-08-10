import { get } from 'svelte/store';
import { appSettings } from '$lib/store/appSettings';

export type GameplaySoundType =
	| 'bigLifeUp'
	| 'bigLifeDown'
	| 'bigCommanderUp'
	| 'bigCommanderDown'
	| 'statusUp'
	| 'statusDown'
	| 'randomNeutral'
	| 'randomSuccess'
	| 'randomFail'
	| 'randomJackpot'
	| 'gameReset'
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
type LifeSoundDirection = 'heal' | 'damage';

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
	statusUp: [
		{ frequency: 680, duration: 0.055, wave: 'triangle', gain: 0.013, gap: 0.01 },
		{ frequency: 910, duration: 0.07, wave: 'triangle', gain: 0.014 }
	],
	statusDown: [
		{ frequency: 640, duration: 0.055, wave: 'square', gain: 0.012, gap: 0.01 },
		{ frequency: 430, duration: 0.075, wave: 'square', gain: 0.014 }
	],
	randomNeutral: [
		{
			frequency: 540,
			toFrequency: 620,
			duration: 0.09,
			wave: 'triangle',
			gain: 0.015,
			filterStartHz: 2100,
			filterEndHz: 1500,
			detuneCents: -2
		}
	],
	randomSuccess: [
		{ frequency: 700, duration: 0.055, wave: 'triangle', gain: 0.015, gap: 0.01 },
		{ frequency: 960, duration: 0.065, wave: 'triangle', gain: 0.016, gap: 0.01 },
		{ frequency: 1280, duration: 0.085, wave: 'triangle', gain: 0.017 }
	],
	randomFail: [
		{
			frequency: 520,
			toFrequency: 380,
			duration: 0.1,
			wave: 'sawtooth',
			gain: 0.016,
			filterStartHz: 1900,
			filterEndHz: 700,
			detuneCents: 4
		},
		{
			frequency: 300,
			duration: 0.07,
			wave: 'square',
			gain: 0.012,
			filterStartHz: 1200,
			filterEndHz: 520
		}
	],
	randomJackpot: [
		{ frequency: 784, duration: 0.05, wave: 'triangle', gain: 0.016, gap: 0.008 },
		{ frequency: 988, duration: 0.05, wave: 'triangle', gain: 0.017, gap: 0.008 },
		{ frequency: 1318, duration: 0.06, wave: 'triangle', gain: 0.017, gap: 0.008 },
		{
			frequency: 1661,
			toFrequency: 1760,
			duration: 0.1,
			wave: 'triangle',
			gain: 0.018,
			filterStartHz: 3200,
			filterEndHz: 2200,
			detuneCents: -3
		}
	],
	gameReset: [
		{
			frequency: 260,
			toFrequency: 350,
			duration: 0.14,
			wave: 'triangle',
			gain: 0.018,
			gap: 0.02,
			filterStartHz: 1200,
			filterEndHz: 1800
		},
		{
			frequency: 392,
			toFrequency: 523,
			duration: 0.16,
			wave: 'triangle',
			gain: 0.02,
			filterStartHz: 1700,
			filterEndHz: 2500,
			detuneCents: -2
		}
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
 * Primes WebAudio during a trusted user gesture so delayed cues can play later.
 * Useful for flows where the audible cue occurs after async animations.
 * @returns {void}
 */
export const primeGameplayAudio = (options?: PlaySoundOptions) => {
	const ctx = getAudioContext(options);
	if (!ctx) return;
	if (ctx.state === 'suspended') {
		void ctx.resume();
	}
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
	const burstTailPulses = cappedHits >= 12 ? 3 : cappedHits >= 8 ? 2 : cappedHits >= 5 ? 1 : 0;

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

	for (let i = 0; i < burstTailPulses; i += 1) {
		const tailStart = startAt + primaryDuration * 0.7 + i * 0.09;
		const tailAttenuation = 1 - i * 0.22;
		playTone(
			ctx,
			{
				frequency: isDown ? 340 - i * 28 : 520 + i * 32,
				toFrequency: isDown ? 250 - i * 20 : 680 + i * 40,
				duration: 0.09 + intensity * 0.06,
				wave: 'square',
				gain: primaryGain * 0.36 * tailAttenuation,
				filterStartHz: 1800,
				filterEndHz: isDown ? 620 : 1300,
				attack: 0.009,
				release: 0.11 + intensity * 0.08
			},
			tailStart
		);
	}
};

/**
 * Plays one stronger synthesized pulse for long-press life steps (typically +/-10).
 * Damage is intentionally harsher; heal is intentionally softer.
 * @param {LifeSoundDirection} direction Life change semantic.
 * @param {PlaySoundOptions} [options] Sound playback options.
 * @returns {void}
 */
export const playLifeLongStepSound = (
	direction: LifeSoundDirection,
	options?: PlaySoundOptions
) => {
	const ctx = getAudioContext(options);
	if (!ctx) return;

	if (ctx.state === 'suspended') {
		void ctx.resume();
	}

	const isDamage = direction === 'damage';
	const startAt = ctx.currentTime + 0.005;

	playTone(
		ctx,
		{
			frequency: isDamage ? 690 : 460,
			toFrequency: isDamage ? 260 : 620,
			duration: isDamage ? 0.3 : 0.24,
			wave: isDamage ? 'sawtooth' : 'triangle',
			gain: isDamage ? 0.032 : 0.016,
			filterStartHz: isDamage ? 2600 : 1900,
			filterEndHz: isDamage ? 700 : 1300,
			detuneCents: isDamage ? 4 : -3,
			attack: 0.012,
			release: isDamage ? 0.26 : 0.18
		},
		startAt
	);

	if (isDamage) {
		playTone(
			ctx,
			{
				frequency: 330,
				toFrequency: 210,
				duration: 0.18,
				wave: 'square',
				gain: 0.015,
				filterStartHz: 1700,
				filterEndHz: 580,
				attack: 0.01,
				release: 0.19
			},
			startAt + 0.07
		);
	}
};

/**
 * Plays one compact cue after a burst of rapid +/-1 life taps.
 * Higher tap counts produce slightly longer/louder cues.
 * @param {number} tapCount Number of taps merged in the burst.
 * @param {LifeSoundDirection} direction Life change semantic.
 * @param {PlaySoundOptions} [options] Sound playback options.
 * @returns {void}
 */
export const playLifeTapBurstSound = (
	tapCount: number,
	direction: LifeSoundDirection,
	options?: PlaySoundOptions
) => {
	const ctx = getAudioContext(options);
	if (!ctx) return;

	if (ctx.state === 'suspended') {
		void ctx.resume();
	}

	const cappedTaps = Math.max(1, Math.min(18, Math.round(tapCount)));
	const intensity = Math.min(1, (cappedTaps - 1) / 10);
	const isDamage = direction === 'damage';
	const startAt = ctx.currentTime + 0.005;
	const isSmallBurst = cappedTaps <= 3;
	const pulseCount =
		cappedTaps >= 16 ? 5 : cappedTaps >= 12 ? 4 : cappedTaps >= 8 ? 3 : cappedTaps >= 5 ? 2 : 1;
	const pulseSpacing = 0.055;

	if (isSmallBurst) {
		// Arcade-like tiny chirps for single taps and very small bursts.
		playTone(
			ctx,
			{
				frequency: isDamage ? 700 : 820,
				toFrequency: isDamage ? 520 : 980,
				duration: 0.05,
				wave: 'square',
				gain: isDamage ? 0.015 : 0.013,
				filterStartHz: 2600,
				filterEndHz: isDamage ? 1100 : 1700,
				detuneCents: isDamage ? 2 : -2,
				attack: 0.006,
				release: 0.07
			},
			startAt
		);

		if (cappedTaps >= 2) {
			playTone(
				ctx,
				{
					frequency: isDamage ? 560 : 980,
					toFrequency: isDamage ? 460 : 1100,
					duration: 0.045,
					wave: 'square',
					gain: isDamage ? 0.012 : 0.011,
					filterStartHz: 2400,
					filterEndHz: isDamage ? 980 : 1800,
					attack: 0.005,
					release: 0.06
				},
				startAt + pulseSpacing
			);
		}

		if (cappedTaps >= 3) {
			playTone(
				ctx,
				{
					frequency: isDamage ? 500 : 1160,
					toFrequency: isDamage ? 420 : 1240,
					duration: 0.045,
					wave: 'square',
					gain: isDamage ? 0.011 : 0.01,
					filterStartHz: 2200,
					filterEndHz: isDamage ? 900 : 1900,
					attack: 0.005,
					release: 0.06
				},
				startAt + pulseSpacing * 2
			);
		}

		return;
	}

	for (let i = 0; i < pulseCount; i += 1) {
		const pulseIntensity = Math.max(0.35, 1 - i * 0.12);
		const pulseStart = startAt + i * pulseSpacing;
		playTone(
			ctx,
			{
				frequency: (isDamage ? 560 : 500) + (isDamage ? -22 : 28) * i,
				toFrequency:
					(isDamage ? 320 - intensity * 70 : 640 + intensity * 140) + (isDamage ? -16 : 22) * i,
				duration: 0.085 + intensity * 0.11,
				wave: isDamage ? 'square' : 'triangle',
				gain:
					((isDamage ? 0.014 : 0.011) + intensity * (isDamage ? 0.015 : 0.011)) * pulseIntensity,
				filterStartHz: isDamage ? 2100 : 2000,
				filterEndHz: isDamage ? 700 : 1350,
				detuneCents: isDamage ? 3 : -2,
				attack: 0.009,
				release: 0.11 + intensity * 0.14
			},
			pulseStart
		);
	}

	if (cappedTaps >= 7) {
		playTone(
			ctx,
			{
				frequency: isDamage ? 280 : 760,
				toFrequency: isDamage ? 210 : 980,
				duration: 0.1 + intensity * 0.12,
				wave: isDamage ? 'sawtooth' : 'triangle',
				gain: (isDamage ? 0.01 : 0.008) + intensity * 0.01,
				filterStartHz: 1800,
				filterEndHz: isDamage ? 560 : 1500,
				attack: 0.008,
				release: 0.13 + intensity * 0.14
			},
			startAt + pulseCount * pulseSpacing * 0.7
		);
	}
};
