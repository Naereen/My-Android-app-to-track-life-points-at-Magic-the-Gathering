import { beforeEach, describe, expect, it, vi } from 'vitest';

const { playGameplaySound, playLifeLongStepSound, playLifeTapBurstSound } = vi.hoisted(() => ({
	playGameplaySound: vi.fn(),
	playLifeLongStepSound: vi.fn(),
	playLifeTapBurstSound: vi.fn()
}));

vi.mock('svelte-i18n', () => {
	const createStore = (value: string) => ({
		subscribe: (run: (value: string) => void) => {
			run(value);
			return () => undefined;
		}
	});

	return {
		__esModule: true,
		_: (key: string) => createStore(key),
		locale: createStore('en'),
		register: vi.fn(),
		init: vi.fn(),
		getLocaleFromNavigator: vi.fn(() => 'en')
	};
});

vi.mock('$lib/utils/gameplaySound', () => ({
	playGameplaySound,
	playLifeLongStepSound,
	playLifeTapBurstSound
}));

import { get } from 'svelte/store';
import { appState, setDayNightCycleEnabled } from './appState';
import { players, resetLifeTotals } from './player';

describe('game reset state', () => {
	beforeEach(() => {
		localStorage.clear();
		appState.set({
			isMenuOpen: false,
			activeMenu: '',
			dayNightCycleEnabled: false,
			dayNightPhase: 'day',
			currentTurn: -1,
			turnCount: 0,
			startingPlayerIndex: null
		});
		players.set([
			{
				id: 1,
				lifeTotal: 20,
				playerName: 'Player 1',
				color: 'white',
				backgroundImage: null,
				backgroundArtist: null,
				backgroundSet: null,
				tempLifeDiff: 0,
				poison: 0,
				statusEffects: {},
				vanguard: null,
				vanguardChoices: [],
				treacheryRole: null,
				treacheryCard: null,
				treacherySeen: false,
				allowNegativeLife: false,
				isFirst: false,
				highlighted: false,
				isDead: false
			}
		]);
	});

	it('disables day/night cycling when a game is reset', async () => {
		setDayNightCycleEnabled(true);
		expect(get(appState).dayNightCycleEnabled).toBe(true);

		await resetLifeTotals(true);

		expect(get(appState).dayNightCycleEnabled).toBe(false);
		expect(get(appState).dayNightPhase).toBe('day');
	});
});
