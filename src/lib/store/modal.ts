import { get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { appSettings } from './appSettings';
import { addGameHistoryEntry } from './gameHistory';
import { appState } from './appState';
import { players } from './player';
import { vibrate } from '../utils/haptics';
import { persist } from './persist';
import { pickWeightedIndex } from '$lib/utils/weightedRandom';
import { primeGameplayAudio } from '$lib/utils/gameplaySound';

type RandomizerModalState = {
	isOpen: boolean;
	result: number;
	type: string;
	playerId: number | null;
	playerName: string | null;
	backgroundImage?: string | string[] | null;
};

type ReplayableRandomizerType =
	| 'd2'
	| 'd4'
	| 'd6'
	| 'd8'
	| 'd10'
	| 'd12'
	| 'd20'
	| 'dplanar'
	| 'custom';

const initialRandomizerModalState: RandomizerModalState = {
	isOpen: false,
	result: 0,
	type: '',
	playerId: null,
	playerName: null,
	backgroundImage: null
};

export const randomizerModalData = writable<RandomizerModalState>(initialRandomizerModalState);

const replayableRandomizerTypes: ReplayableRandomizerType[] = [
	'd2',
	'd4',
	'd6',
	'd8',
	'd10',
	'd12',
	'd20',
	'dplanar',
	'custom'
];

const isReplayableRandomizerType = (type: string): type is ReplayableRandomizerType => {
	return replayableRandomizerTypes.includes(type as ReplayableRandomizerType);
};

const isPersistedReplayableRandomizerType = (value: unknown): value is ReplayableRandomizerType => {
	return typeof value === 'string' && isReplayableRandomizerType(value);
};

export const lastReplayableRandomizerType = persist<ReplayableRandomizerType | null>(
	'lastReplayableRandomizerType',
	null
);

const restoredLastType = get(lastReplayableRandomizerType);
if (restoredLastType !== null && !isPersistedReplayableRandomizerType(restoredLastType)) {
	lastReplayableRandomizerType.set(null);
}

/**
 * Simulates a planar die roll with canonical distribution (blank/planeswalk/chaos).
 * @returns {0 | 1 | 2} `0` blank, `1` planeswalk, `2` chaos.
 */
const rollPlanarDie = () => {
	const roll = Math.floor(Math.random() * 6) + 1;
	if (roll <= 4) return 0;
	if (roll === 5) return 1;
	return 2;
};

/**
 * Executes a randomizer action (standard dice, planar die, or custom range).
 * Persists replayable dice type and logs dice outcomes into game history.
 * @param {string} type Randomizer mode key (`d6`, `d20`, `dplanar`, `custom`, ...).
 * @returns {number} Numeric roll result (or planar encoded value).
 */
export const generateRandomNumber = (type: string) => {
	vibrate(20);
	// Prime audio while we're still inside the click/gesture event that triggered the roll.
	// This prevents delayed end-of-roll cues from being dropped on stricter mobile browsers.
	primeGameplayAudio();
	const dieTypes: { [key: string]: number | null } = {
		d2: 2,
		d4: 4,
		d6: 6,
		dplanar: 6,
		d8: 8,
		d10: 10,
		d12: 12,
		d20: 20,
		custom: get(appSettings).customRandomNumber
	};

	const max = dieTypes[type] || 0;
	const result =
		type === 'dplanar' ? rollPlanarDie() : max > 0 ? Math.floor(Math.random() * max) + 1 : 0;

	if (max > 0 && isReplayableRandomizerType(type)) {
		lastReplayableRandomizerType.set(type);
	}

	if (max > 0) {
		const t = get(_);
		const diceResult =
			type === 'dplanar'
				? result === 0
					? String(t('planar_result_blank'))
					: result === 1
						? String(t('planar_result_planeswalk'))
						: String(t('planar_result_chaos'))
				: result;

		addGameHistoryEntry({
			playerId: 0,
			playerName: '',
			kind: 'diceRoll',
			payload: {
				diceSides: max,
				diceResult
			}
		});
	}

	if (type === 'custom') {
		randomizerModalData.set({
			isOpen: true,
			result,
			type,
			playerId: null,
			playerName: null,
			backgroundImage: null
		});
	} else {
		randomizerModalData.set({
			isOpen: true,
			result,
			type,
			playerId: null,
			playerName: null,
			backgroundImage: null
		});
	}

	return result;
};

/**
 * Replays the last persisted replayable randomizer type.
 * @returns {boolean} `true` when a previous type existed and was replayed.
 */
export const replayLastRandomizerRoll = () => {
	const lastType = get(lastReplayableRandomizerType);
	if (!lastType) return false;
	generateRandomNumber(lastType);
	return true;
};

/**
 * Selects one active player at random (or via weighted probabilities when enabled).
 * Opens randomizer modal with the selected player's name and background.
 * @param {number | null} [randomIndex] Optional deterministic index for testing/scripting.
 * @returns {void}
 */
export const selectRandomPlayer = (randomIndex: number | null = null) => {
	vibrate(20);
	const currentPlayers = get(players);
	const playerCount = get(appSettings).playerCount;
	const settings = get(appSettings);

	// Get only active players (up to playerCount)
	const activePlayers = currentPlayers.slice(0, playerCount);

	if (activePlayers.length === 0) return;

	const index =
		randomIndex !== null
			? randomIndex
			: settings.useWeightedStartingPlayer
				? pickWeightedIndex(settings.startingPlayerProbabilities ?? [], activePlayers.length)
				: Math.floor(Math.random() * activePlayers.length);
	const selectedPlayer = activePlayers[index];

	randomizerModalData.set({
		isOpen: true,
		result: 0,
		type: 'randomPlayer',
		playerId: selectedPlayer.id,
		playerName: selectedPlayer.playerName,
		backgroundImage: selectedPlayer.backgroundImage
	});
};

/**
 * Selects a random opponent among active players excluding the current player.
 * @param {number} activePlayerId Player id that must be excluded from candidates.
 * @returns {void}
 */
export const selectRandomOpponent = (activePlayerId: number) => {
	vibrate(20);
	const currentPlayers = get(players);
	const playerCount = get(appSettings).playerCount;

	// Get only active players (up to playerCount), excluding the active player
	const activePlayers = currentPlayers.slice(0, playerCount).filter((p) => p.id !== activePlayerId);

	if (activePlayers.length === 0) return;

	const randomIndex = Math.floor(Math.random() * activePlayers.length);
	const selectedPlayer = activePlayers[randomIndex];

	randomizerModalData.set({
		isOpen: true,
		result: 0,
		type: 'randomOpponent',
		playerId: selectedPlayer.id,
		playerName: selectedPlayer.playerName,
		backgroundImage: selectedPlayer.backgroundImage
	});
};

/**
 * Resets randomizer modal state to its closed default.
 * @returns {void}
 */
export const resetRandomizer = () => {
	randomizerModalData.set(initialRandomizerModalState);
};

const initialPlayerModalData = {
	isOpen: false,
	playerId: 0,
	mode: 'status_effects' as 'background' | 'commander' | 'status_effects'
};

export const playerModalData = writable(initialPlayerModalData);

export const openPlayerModal = (
	playerId: number,
	mode: 'background' | 'commander' | 'status_effects' = 'status_effects'
) => {
	playerModalData.set({ isOpen: true, playerId, mode });
};

/**
 * Closes the player data modal and restores its default mode/id payload.
 * @returns {void}
 */
export const resetPlayerModalData = () => {
	playerModalData.set(initialPlayerModalData);
};

const initialHistoryModalState = { isOpen: false, tab: 'life' as 'life' | 'turnTime' | 'stats' };

export const historyModalData = writable(initialHistoryModalState);

let hasHistoryModalHistoryEntry = false;
let isSyncingHistoryModalHistory = false;

export const pushHistoryModalHistoryEntry = () => {
	if (typeof window === 'undefined' || hasHistoryModalHistoryEntry) return;
	try {
		const currentState =
			window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
		window.history.pushState(
			{ ...currentState, __mtgHistoryModalOpen: true },
			'',
			window.location.href
		);
		hasHistoryModalHistoryEntry = true;
	} catch {
		// ignore
	}
};

const resetHistoryModalState = () => {
	historyModalData.set(initialHistoryModalState);
	appState.update((state) => {
		if (state.isMenuOpen && state.activeMenu === 'history') {
			return {
				...state,
				isMenuOpen: false,
				activeMenu: ''
			};
		}
		return state;
	});
};

/**
 * Opens the global game history modal.
 * @param {'life' | 'turnTime' | 'stats'} [tab] Which tab to show initially (defaults to 'life').
 * @returns {void}
 */
export const openHistoryModal = (tab: 'life' | 'turnTime' | 'stats' = 'life') => {
	historyModalData.set({ isOpen: true, tab });
	pushHistoryModalHistoryEntry();
};

/**
 * Closes game history modal and collapses history menu when it is the active panel.
 * @returns {void}
 */
export const closeHistoryModal = () => {
	if (
		typeof window !== 'undefined' &&
		hasHistoryModalHistoryEntry &&
		!isSyncingHistoryModalHistory
	) {
		isSyncingHistoryModalHistory = true;
		window.history.back();
		return;
	}

	resetHistoryModalState();
};

/**
 * Handles `popstate` to map browser Back events to history-modal close semantics.
 * @returns {void}
 */
export const handleHistoryModalBackNavigation = () => {
	if (!get(historyModalData).isOpen) {
		if (isSyncingHistoryModalHistory) {
			hasHistoryModalHistoryEntry = false;
			isSyncingHistoryModalHistory = false;
		}
		return;
	}

	hasHistoryModalHistoryEntry = false;
	isSyncingHistoryModalHistory = true;
	resetHistoryModalState();
};

// Confirm modal store: holds a message and a resolver function for promise-based API
type ConfirmModalState = {
	isOpen: boolean;
	message: string;
	resolve:
		| ((
				value:
					| boolean
					| { confirmed: boolean; checkboxValue?: boolean | boolean[]; radioValue?: number }
		  ) => void)
		| null;
	checkboxLabel?: string | string[];
	checkboxDefaultValue?: boolean | boolean[];
	radioGroupLabel?: string;
	radioOptions?: string[];
	radioDefaultValue?: number;
};

const initialConfirmModalState: ConfirmModalState = { isOpen: false, message: '', resolve: null };

export const confirmModalData = writable<ConfirmModalState>(initialConfirmModalState);

export const showConfirm = (
	message: string,
	options?: {
		checkboxLabel?: string | string[];
		checkboxDefaultValue?: boolean | boolean[];
		radioGroupLabel?: string;
		radioOptions?: string[];
		radioDefaultValue?: number;
	}
) => {
	return new Promise<
		boolean | { confirmed: boolean; checkboxValue?: boolean | boolean[]; radioValue?: number }
	>((resolve) => {
		confirmModalData.set({
			isOpen: true,
			message,
			resolve,
			checkboxLabel: options?.checkboxLabel,
			checkboxDefaultValue: options?.checkboxDefaultValue ?? false,
			radioGroupLabel: options?.radioGroupLabel,
			radioOptions: options?.radioOptions,
			radioDefaultValue: options?.radioDefaultValue ?? 0
		});
	});
};

// Scryfall card search modal
type ScryfallModalState = { isOpen: boolean };
const initialScryfallModalState: ScryfallModalState = { isOpen: false };
export const scryfallModalData = writable<ScryfallModalState>(initialScryfallModalState);
export const openScryfallModal = () => scryfallModalData.set({ isOpen: true });
export const closeScryfallModal = () => scryfallModalData.set({ isOpen: false });

export const respondConfirm = (
	value: boolean,
	checkboxValue?: boolean | boolean[],
	radioValue?: number
) => {
	const current = get(confirmModalData);
	if (current && current.resolve) {
		try {
			if (current.checkboxLabel !== undefined || current.radioOptions !== undefined) {
				current.resolve({ confirmed: value, checkboxValue, radioValue });
			} else {
				current.resolve(value);
			}
		} catch (e) {
			// ignore
		}
	}
	confirmModalData.set(initialConfirmModalState);
};
