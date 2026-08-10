import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { appSettings, setEightPlayerLayout } from './appSettings';

describe('eight-player layout settings', () => {
	it('updates the selected 8-player layout preference', () => {
		setEightPlayerLayout('sides');

		expect(get(appSettings).eightPlayerLayout).toBe('sides');
	});
});
