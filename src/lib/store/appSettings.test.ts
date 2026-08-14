import { beforeEach, describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	appSettings,
	getDangerLifeThreshold,
	getDangerPoisonThreshold,
	getDefaultGlobalGameTimerDuration,
	getDefaultStartingLifeTotal,
	getPoisonLethalLimit,
	isPlayerInDanger,
	setPlayerCount,
	setRequireTouchBeforeRandomStart,
	setBountyModeEnabled,
	setEightPlayerLayout,
	setShowBountyMenu
} from './appSettings';

const defaultSettings = structuredClone(get(appSettings));

describe('app settings defaults', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	it('uses 20 life and a 50-minute timer for duels', () => {
		expect(getDefaultStartingLifeTotal(2)).toBe(20);
		expect(getDefaultGlobalGameTimerDuration(2)).toBe(3000);
	});

	it('uses multiplayer defaults for three or more players', () => {
		expect(getDefaultStartingLifeTotal(3)).toBe(40);
		expect(getDefaultStartingLifeTotal(8)).toBe(40);
		expect(getDefaultGlobalGameTimerDuration(4)).toBe(5400);
	});

	it('keeps first-player touch confirmation disabled by default', () => {
		expect(get(appSettings).requireTouchBeforeRandomStart).toBe(false);
	});
});

describe('eight-player layout settings', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	it('updates the selected 8-player layout preference', () => {
		setEightPlayerLayout('sides');

		expect(get(appSettings).eightPlayerLayout).toBe('sides');
	});
});

describe('poison lethal limit', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	it('uses 15 poison for 30-life starts (Two-Headed Giant default)', () => {
		expect(getPoisonLethalLimit(30)).toBe(15);
	});

	it('keeps 10 poison for other life totals', () => {
		expect(getPoisonLethalLimit(20)).toBe(10);
		expect(getPoisonLethalLimit(40)).toBe(10);
	});
});

describe('danger thresholds', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	it('matches the requested danger life thresholds for standard starts', () => {
		expect(getDangerLifeThreshold(20)).toBe(8);
		expect(getDangerLifeThreshold(21)).toBe(6);
		expect(getDangerLifeThreshold(30)).toBe(8);
		expect(getDangerLifeThreshold(40)).toBe(10);
		expect(getDangerLifeThreshold(60)).toBe(15);
	});

	it('warns at 80% of the poison lethal limit', () => {
		expect(getDangerPoisonThreshold(10)).toBe(8);
		expect(getDangerPoisonThreshold(15)).toBe(12);
	});

	it('flags danger when life or poison reaches the threshold', () => {
		expect(isPlayerInDanger(8, 0, 20)).toBe(true);
		expect(isPlayerInDanger(9, 8, 20)).toBe(true);
		expect(isPlayerInDanger(10, 0, 40)).toBe(true);
		expect(isPlayerInDanger(11, 7, 40)).toBe(false);
	});
});

describe('player-count derived settings', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	describe('first-player touch confirmation setting', () => {
		beforeEach(() => {
			appSettings.set(structuredClone(defaultSettings));
		});

		it('updates touch confirmation preference', () => {
			setRequireTouchBeforeRandomStart(true);

			expect(get(appSettings).requireTouchBeforeRandomStart).toBe(true);
		});
	});

	it('resets dependent defaults when the player count changes', () => {
		setPlayerCount(2);

		expect(get(appSettings)).toMatchObject({
			playerCount: 2,
			startingLifeTotal: 20,
			showLifeChangeHistory: true,
			globalGameTimerDuration: 3000
		});
		expect(get(appSettings).startingPlayerProbabilities).toEqual([50, 50, 0, 0, 0, 0, 0, 0]);
	});

	it('preserves a custom global timer duration when switching formats', () => {
		appSettings.update((settings) => ({
			...settings,
			playerCount: 4,
			globalGameTimerDuration: 7777
		}));

		setPlayerCount(6);

		expect(get(appSettings)).toMatchObject({
			playerCount: 6,
			startingLifeTotal: 40,
			showLifeChangeHistory: false,
			globalGameTimerDuration: 7777
		});
		expect(get(appSettings).startingPlayerProbabilities).toEqual([
			16.67, 16.67, 16.67, 16.67, 16.67, 16.67, 0, 0
		]);
	});
});

describe('bounty settings sync', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
	});

	it('enabling bounty mode also enables bounty menu visibility', () => {
		setBountyModeEnabled(true);

		expect(get(appSettings).bountyModeEnabled).toBe(true);
		expect(get(appSettings).showBountyMenu).toBe(true);
	});

	it('legacy menu toggle updates bounty mode too', () => {
		setShowBountyMenu(false);
		expect(get(appSettings).bountyModeEnabled).toBe(false);
		expect(get(appSettings).showBountyMenu).toBe(false);
	});
});
