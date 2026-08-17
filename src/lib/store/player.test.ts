import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as cryptoRandom from '$lib/utils/cryptoRandom';

const { playGameplaySound, playLifeLongStepSound, playLifeTapBurstSound } = vi.hoisted(() => ({
	playGameplaySound: vi.fn(),
	playLifeLongStepSound: vi.fn(),
	playLifeTapBurstSound: vi.fn()
}));
const fetchMock = vi.fn();

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
vi.stubGlobal('fetch', fetchMock);

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
import { lifeHistory } from './lifeHistory';
import {
	applyCommanderCombatDamage,
	assignRandomTreacheryForGame,
	dismissFirstPlayerTouchSelection,
	firstPlayerTouchSelection,
	players,
	registerFirstPlayerSelectionTouch,
	releaseFirstPlayerSelectionTouch,
	resetLifeTotals,
	startFirstPlayerTouchSelectionRound,
	setCommanderDamage
} from './player';
import { savedGames } from './savedGames';
import { resetTurnTimeStats, turnTimeStats } from './turnTimeStats';

describe('game reset state', () => {
	beforeEach(() => {
		dismissFirstPlayerTouchSelection();
		localStorage.clear();
		fetchMock.mockReset();
		clearGameHistory();
		lifeHistory.set([]);
		savedGames.set([]);
		resetTurnTimeStats();
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
			showPlanechaseMenu: false,
			showArchenemyMenu: false,
			enableAcornMode: false,
			enableTicketMode: false,
			underlineSixAndNine: false,
			turnTimerEnabled: false,
			turnTimerDuration: 120,
			turnTimerSound: false,
			globalGameTimerEnabled: false,
			globalGameTimerDuration: 0,
			isStreamMode: false,
			remoteServerUrl: '',
			useWeightedStartingPlayer: false,
			requireTouchBeforeRandomStart: false,
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

	it('still assigns treachery roles when the catalog request fails', async () => {
		fetchMock.mockRejectedValueOnce(new Error('network down'));
		appSettings.update((settings) => ({
			...settings,
			playerCount: 4,
			treacheryModeEnabled: true
		}));
		players.set(
			Array.from({ length: 4 }, (_, index) => ({
				id: index + 1,
				lifeTotal: 20,
				playerName: `Player ${index + 1}`,
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
			}))
		);

		await assignRandomTreacheryForGame();

		for (const player of get(players).slice(0, 4)) {
			expect(player.treacheryRole).toBeTruthy();
			expect(player.treacheryCard).toBeNull();
			expect(player.treacherySeen).toBe(false);
		}
	});

	it('records the ending turn count for completed games when turns were tracked', async () => {
		lifeHistory.set([
			{
				timestamp: 1_000,
				players: [
					{ id: 1, name: 'Player 1', color: '#38bdf8', life: 20 },
					{ id: 2, name: 'Player 2', color: '#f472b6', life: 20 }
				]
			},
			{
				timestamp: 9_000,
				players: [
					{ id: 1, name: 'Player 1', color: '#38bdf8', life: 12 },
					{ id: 2, name: 'Player 2', color: '#f472b6', life: 0 }
				]
			}
		]);
		turnTimeStats.set({
			playerSeconds: [34, 21, 0, 0, 0, 0, 0, 0],
			currentTurnStartMs: null,
			currentPlayerIndex: null
		});
		appState.set({
			...get(appState),
			currentTurn: 0,
			turnCount: 4,
			startingPlayerIndex: 0
		});

		await resetLifeTotals(true);

		expect(get(savedGames)).toHaveLength(1);
		expect(get(savedGames)[0]).toMatchObject({
			durationSeconds: 8,
			startingPlayerIndex: 0,
			endingTurnCount: 4,
			winnerIndex: 0,
			playerStats: [
				{ name: 'Player 1', lifeAtEnd: 12, turnSeconds: 34 },
				{ name: 'Player 2', lifeAtEnd: 0, turnSeconds: 21 }
			]
		});
	});

	it('does not record an ending turn count when the next turn button was never used', async () => {
		lifeHistory.set([
			{
				timestamp: 2_000,
				players: [
					{ id: 1, name: 'Player 1', color: '#38bdf8', life: 20 },
					{ id: 2, name: 'Player 2', color: '#f472b6', life: 20 }
				]
			},
			{
				timestamp: 6_000,
				players: [
					{ id: 1, name: 'Player 1', color: '#38bdf8', life: 0 },
					{ id: 2, name: 'Player 2', color: '#f472b6', life: 7 }
				]
			}
		]);

		await resetLifeTotals(true);

		expect(get(savedGames)).toHaveLength(1);
		expect(get(savedGames)[0]?.endingTurnCount).toBeNull();
	});

	it('resets the simultaneous first-player touch round when a touch is released early', () => {
		appSettings.update((settings) => ({
			...settings,
			playerCount: 3,
			requireTouchBeforeRandomStart: true
		}));
		startFirstPlayerTouchSelectionRound();

		registerFirstPlayerSelectionTouch(1, 11);
		expect(Object.keys(get(firstPlayerTouchSelection).activePointersByPlayerId)).toHaveLength(1);

		releaseFirstPlayerSelectionTouch(11);
		expect(get(firstPlayerTouchSelection).activePointersByPlayerId).toEqual({});
		expect(get(firstPlayerTouchSelection).phase).toBe('collecting');

		dismissFirstPlayerTouchSelection();
	});

	it('does not start the touch round when touch confirmation is disabled', () => {
		appSettings.update((settings) => ({
			...settings,
			playerCount: 3,
			requireTouchBeforeRandomStart: false
		}));

		const started = startFirstPlayerTouchSelectionRound();

		expect(started).toBe(false);
		expect(get(firstPlayerTouchSelection).phase).toBe('idle');
	});

	it('selects exactly one winner after all required simultaneous touches are registered', () => {
		vi.useFakeTimers();
		const randomIntSpy = vi
			.spyOn(cryptoRandom, 'secureRandomInt')
			.mockImplementation((min, max) => {
				if (min === 0 && max === 2) return 0;
				if (min === 0 && max === 2500) return 0;
				return min;
			});

		appSettings.update((settings) => ({
			...settings,
			playerCount: 3,
			requireTouchBeforeRandomStart: true
		}));
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
				color: 'blue',
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
				id: 3,
				lifeTotal: 20,
				playerName: 'Player 3',
				color: 'red',
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

		startFirstPlayerTouchSelectionRound();
		registerFirstPlayerSelectionTouch(1, 101);
		registerFirstPlayerSelectionTouch(2, 102);
		registerFirstPlayerSelectionTouch(3, 103);

		expect(get(firstPlayerTouchSelection).phase).toBe('animating');

		vi.advanceTimersByTime(3000);

		const selectionState = get(firstPlayerTouchSelection);
		expect(selectionState.phase).toBe('winner');
		expect(selectionState.winnerPlayerId).toBe(1);
		expect(get(players).filter((player) => player.isFirst)).toHaveLength(1);
		expect(get(players)[0].isFirst).toBe(true);

		randomIntSpy.mockRestore();
		vi.useRealTimers();
		dismissFirstPlayerTouchSelection();
	});
});
