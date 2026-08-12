import { beforeEach, describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	appSettings,
	getDefaultGlobalGameTimerDuration,
	getDefaultStartingLifeTotal,
	getPoisonLethalLimit,
	setPlayerCount,
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

describe('player-count derived settings', () => {
	beforeEach(() => {
		appSettings.set(structuredClone(defaultSettings));
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
