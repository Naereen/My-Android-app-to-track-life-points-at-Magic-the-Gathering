import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	appSettings,
	getPoisonLethalLimit,
	setBountyModeEnabled,
	setEightPlayerLayout,
	setShowBountyMenu
} from './appSettings';

describe('eight-player layout settings', () => {
	it('updates the selected 8-player layout preference', () => {
		setEightPlayerLayout('sides');

		expect(get(appSettings).eightPlayerLayout).toBe('sides');
	});
});

describe('poison lethal limit', () => {
	it('uses 15 poison for 30-life starts (Two-Headed Giant default)', () => {
		expect(getPoisonLethalLimit(30)).toBe(15);
	});

	it('keeps 10 poison for other life totals', () => {
		expect(getPoisonLethalLimit(20)).toBe(10);
		expect(getPoisonLethalLimit(40)).toBe(10);
	});
});

describe('bounty settings sync', () => {
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
