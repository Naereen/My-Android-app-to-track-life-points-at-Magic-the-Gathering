import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { appSettings, getPoisonLethalLimit, setEightPlayerLayout } from './appSettings';

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
