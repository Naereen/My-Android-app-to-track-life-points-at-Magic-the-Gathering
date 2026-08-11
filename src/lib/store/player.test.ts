import { beforeEach, describe, expect, it, vi } from 'vitest';

const { playGameplaySound, playLifeLongStepSound, playLifeTapBurstSound } = vi.hoisted(() => ({
	playGameplaySound: vi.fn(),
	playLifeLongStepSound: vi.fn(),
	playLifeTapBurstSound: vi.fn()
}));

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

vi.mock('svelte-i18n', () => {
	const createStore = <T>(value: T) => ({
		subscribe: (run: (value: T) => void) => {
			run(value);
			return () => undefined;
		}
	});

	return {
		__esModule: true,
		_: createStore((key: string) => key),
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
import { appSettings } from './appSettings';
import { appState, setDayNightCycleEnabled } from './appState';
import { clearGameHistory, gameHistory } from './gameHistory';
import { applyCommanderCombatDamage, players, resetLifeTotals, setCommanderDamage } from './player';

describe('game reset state', () => {
	beforeEach(() => {
		localStorage.clear();
		clearGameHistory();
		appSettings.set({
			playerCount: 2,
			startingLifeTotal: 20,
			customStartingLifeTotal: 60,
			customRandomNumber: 20,
			allowNegativeLife: false,
			preventScreenSleep: true,
			fourPlayerLayout: 'matrix',
			threePlayerLayout: 'classic',
			sixPlayerLayout: 'one',
			eightPlayerLayout: 'classic',
			hapticsEnabled: false,
			soundEffectsEnabled: true,
			showLifeChangeHistory: true,
			locale: 'en',
			enableCurrentPlayerGlow: true,
			showNextPlayerButton: true,
			showResourcesButton: true,
			showRandomizerButton: true,
			showEmblemMenu: true,
			showVanguardMenu: true,
			showTreacheryMenu: true,
			vanguardModeEnabled: false,
			treacheryModeEnabled: false,
			shogunVariantEnabled: false,
			showBountyMenu: false,
			bountyModeEnabled: false,
			vanguardDraftThree: false,
			showGameHistoryMenu: true,
			enableAcornMode: false,
			enableTicketMode: false,
			turnTimerEnabled: false,
			turnTimerDuration: 120,
			turnTimerSound: false,
			globalGameTimerEnabled: false,
			globalGameTimerDuration: 0,
			isStreamMode: false,
			remoteServerUrl: '',
			useWeightedStartingPlayer: false,
			startingPlayerProbabilities: [50, 50, 0, 0, 0, 0, 0, 0]
		});
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
			},
			{
				id: 2,
				lifeTotal: 20,
				playerName: 'Player 2',
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

	it('applies manual commander edits to both counters and life total', () => {
		setCommanderDamage(1, 2, 3);

		const [player] = get(players);
		expect(player.lifeTotal).toBe(17);
		expect(player.tempLifeDiff).toBe(-3);
		expect(player.statusEffects?.commanderDamageBySource?.[1]).toEqual([3, 0]);

		const history = get(gameHistory);
		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({
			playerId: 1,
			kind: 'commanderDamage',
			payload: {
				fromPlayerId: 2,
				sourceIndex: 1,
				from: 0,
				to: 3,
				lifeDelta: -3
			}
		});
	});

	it('restores life when manual commander edits reduce tracked damage', () => {
		setCommanderDamage(1, 2, 5);
		setCommanderDamage(1, 2, 2);

		const [player] = get(players);
		expect(player.lifeTotal).toBe(18);
		expect(player.tempLifeDiff).toBe(-2);
		expect(player.statusEffects?.commanderDamageBySource?.[1]).toEqual([2, 0]);
	});

	it('applies commander combat damage to both commander counters and life total', () => {
		applyCommanderCombatDamage(1, 2, 1);
		applyCommanderCombatDamage(1, 2, 1);

		const [player] = get(players);
		expect(player.lifeTotal).toBe(18);
		expect(player.tempLifeDiff).toBe(-2);
		expect(player.statusEffects?.commanderDamageBySource?.[1]).toEqual([2, 0]);

		const history = get(gameHistory);
		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({
			playerId: 1,
			kind: 'commanderDamage',
			payload: {
				fromPlayerId: 2,
				sourceIndex: 1,
				from: 0,
				to: 2,
				lifeDelta: -2
			}
		});
	});
});
