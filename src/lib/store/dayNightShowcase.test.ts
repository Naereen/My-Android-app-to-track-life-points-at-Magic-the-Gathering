import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import '../utils/i18n.js';
import {
	dayNightShowcase,
	dayNightShowcaseDurationMs,
	resetDayNightShowcase
} from './dayNightShowcase';
import { appState, setDayNightCycleEnabled, toggleDayNightPhase } from './appState';

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value);
	},
	removeItem: (key: string) => {
		storage.delete(key);
	},
	clear: () => {
		storage.clear();
	}
});

describe('day/night showcase overlay', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();
		resetDayNightShowcase();
		appState.set({
			isMenuOpen: false,
			activeMenu: '',
			dayNightCycleEnabled: false,
			dayNightPhase: 'day',
			currentTurn: -1,
			turnCount: 0,
			startingPlayerIndex: null
		});
	});

	it('shows the day showcase the first time day/night tracking is enabled', () => {
		setDayNightCycleEnabled(true);

		expect(get(dayNightShowcase)).toMatchObject({
			visible: true,
			phase: 'day'
		});
	});

	it('shows the new phase and refreshes the dismissal timer when the phase changes', () => {
		setDayNightCycleEnabled(true);
		vi.advanceTimersByTime(dayNightShowcaseDurationMs - 100);
		toggleDayNightPhase();

		expect(get(dayNightShowcase)).toMatchObject({
			visible: true,
			phase: 'night'
		});

		vi.advanceTimersByTime(150);
		expect(get(dayNightShowcase).visible).toBe(true);

		vi.advanceTimersByTime(dayNightShowcaseDurationMs);
		expect(get(dayNightShowcase).visible).toBe(false);
	});

	it('hides the showcase immediately when day/night tracking is disabled', () => {
		setDayNightCycleEnabled(true);
		setDayNightCycleEnabled(false);

		expect(get(dayNightShowcase).visible).toBe(false);
		expect(get(appState).dayNightPhase).toBe('day');
	});
});
