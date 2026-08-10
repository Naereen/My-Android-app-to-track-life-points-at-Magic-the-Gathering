import { persist } from './persist';
import { get, derived } from 'svelte/store';
import { appSettings, getPoisonLethalLimit } from './appSettings';
import { vibrate } from '$lib/utils/haptics';
import { players } from './player';
import { turnTimer } from './turnTimer';
import { addGameHistoryEntry } from './gameHistory';
import { startTurnFor, endCurrentTurn } from './turnTimeStats';

const MAX_STREAM_PLAYERS = 8;

export interface StreamGameState {
	// `names`/`lifeTotals` are the canonical modern payload fields.
	// Flat `namePlayerX`/`lifePlayerX` fields are kept for backward compatibility
	// with older overlays and external relay consumers.
	playerCount: number;
	currentTurn: number;
	updatedAt: number;
	names: string[];
	lifeTotals: number[];
	namePlayer1: string;
	namePlayer2: string;
	namePlayer3: string;
	namePlayer4: string;
	namePlayer5: string;
	namePlayer6: string;
	namePlayer7: string;
	namePlayer8: string;
	lifePlayer1: number;
	lifePlayer2: number;
	lifePlayer3: number;
	lifePlayer4: number;
	lifePlayer5: number;
	lifePlayer6: number;
	lifePlayer7: number;
	lifePlayer8: number;
}

export const appState = persist('appState', {
	isMenuOpen: false,
	activeMenu: '',
	dayNightCycleEnabled: false,
	dayNightPhase: 'day' as 'day' | 'night',
	// index of the current player's turn (0-based). Default to -1, to indicate no turn yet.
	currentTurn: -1,
	// number of turns played. 0 = not started, otherwise 1..99
	turnCount: 0,
	// index of the starting player for the current round tracking
	startingPlayerIndex: null as number | null
});

/**
 * Opens/closes the global menu and synchronizes turn-timer pause/resume behavior.
 * Also emits short haptic feedback to acknowledge menu toggle on mobile.
 * @param {App.AppState.Menu} menu Menu section to mark as active when opening.
 * @returns {void}
 */
export const toggleIsMenuOpen = (menu: App.AppState.Menu = '') => {
	vibrate(10);
	// Pause/resume timer when opening/closing the global menu to avoid resetting it
	try {
		const wasOpen = get(appState).isMenuOpen;
		if (!wasOpen) {
			// opening
			if ((get(appSettings)?.turnTimerEnabled)) {
				try { (turnTimer as any).pause?.(); } catch (e) {}
			}
		} else {
			// closing
			if ((get(appSettings)?.turnTimerEnabled)) {
				try { (turnTimer as any).resume?.(); } catch (e) {}
			}
		}
	} catch (e) {
		// ignore
	}

	appState.update((data) => ({ ...data, activeMenu: menu, isMenuOpen: !data.isMenuOpen }));
};

/**
 * Enables/disables Day/Night mode tracking for the current match.
 * Disabling the feature resets the phase to `day` to keep UI deterministic.
 * @param {boolean} enabled Whether Day/Night state should be tracked.
 * @returns {void}
 */
export const setDayNightCycleEnabled = (enabled: boolean) => {
	appState.update((data) => ({
		...data,
		dayNightCycleEnabled: enabled,
		dayNightPhase: enabled ? (data.dayNightPhase ?? 'day') : 'day'
	}));
};

/**
 * Switches Day/Night phase only when Day/Night mode is enabled.
 * @returns {void}
 */
export const toggleDayNightPhase = () => {
	appState.update((data) => {
		if (!data.dayNightCycleEnabled) return data;
		return {
			...data,
			dayNightPhase: data.dayNightPhase === 'day' ? 'night' : 'day'
		};
	});
};

/**
 * Sets the active player turn and updates round counter semantics.
 * The round counter increments when cycling back to starting player, decrements on reverse wrap.
 * @param {number} index New active player index (`-1` means no active turn).
 * @param {boolean} updateIsPositive `true` for forward turn progression, `false` for backward.
 * @param {boolean} forceTimerReset Forces turn timer reset even when the same player remains active.
 * @returns {void}
 */
export const setCurrentTurn = (index: number, updateIsPositive: boolean, forceTimerReset = false) => {
	appState.update((data) => {
		const newData = { ...data, currentTurn: index } as any;

		// If index is negative (no active player), keep startingPlayerIndex as-is
		if (index < 0) {
			return newData;
		}

		// If we don't yet have a starting player for the ongoing game, set it
		if (data.startingPlayerIndex === null) {
			newData.startingPlayerIndex = index;
			newData.turnCount = 1;
			return newData;
		}

		// If we moved back to the starting player, increment the turn counter
		if (index === data.startingPlayerIndex && updateIsPositive) {
			vibrate(50);
			const nextCount = Math.max(0, Math.min(99, (data.turnCount || 0) + 1));
			newData.turnCount = nextCount;
			return newData;
		}

		// Reverse navigation semantics: moving "just before" the starting player means
		// crossing a full turn boundary backward, so turnCount must decrease.
		if (index === ((data.startingPlayerIndex - 1 + (get(appSettings).playerCount || 4)) % (get(appSettings).playerCount || 4)) && !updateIsPositive) {
			vibrate(50);
			const nextCount = Math.max(0, Math.min(99, (data.turnCount || 0) - 1));
			newData.turnCount = nextCount;
			return newData;
		}

		return newData;
	});

	// Track cumulative time per player (independent of the turn timer setting)
	try {
		if (index >= 0) {
			startTurnFor(index);
		} else {
			endCurrentTurn();
		}
	} catch (e) {
		// ignore
	}

	// if turn timer enabled, reset/start timer for the new current turn
	try {
		if ((get(appSettings)?.turnTimerEnabled)) {
			turnTimer.resetForCurrent(forceTimerReset);
		}
	} catch (e) {
		// ignore
	}
};

/**
 * Advances to the next alive player and records the transition in game history.
 * Skips KO/eliminated players according to life/poison/status rules.
 * @returns {void}
 */
export const nextTurn = () => {
	vibrate(10);
	const totalPlayers = get(appSettings).playerCount || 4;
	const poisonLethalLimit = getPoisonLethalLimit(get(appSettings).startingLifeTotal);
	// Advance to the next non-dead player. If all players are dead, set to -1.
	const playersList = get(players);
	const current = get(appState).currentTurn;
	const fromPlayer = current >= 0 ? playersList[current] : undefined;
	const fromTurnCount = get(appState).turnCount;
	let nextIndex = (current + 1) % totalPlayers;
	let attempts = 0;
	// Limit search to totalPlayers steps to avoid infinite loop
	while (attempts < totalPlayers) {
		const candidate = playersList[nextIndex];
		const isDead = candidate
			? (candidate.lifeTotal <= 0 &&
					!(get(appSettings).allowNegativeLife || candidate.allowNegativeLife)) ||
				(candidate.poison ?? 0) >= poisonLethalLimit ||
				candidate.statusEffects?.ko === true ||
				candidate.isDead === true
			: true;
		// If the candidate is alive, set as current turn.
		if (candidate && !isDead) {
			setCurrentTurn(nextIndex, true);
			if (fromPlayer) {
				addGameHistoryEntry({
					playerId: fromPlayer.id,
					playerName: fromPlayer.playerName,
					kind: 'turnChange',
					payload: {
						toPlayerName: candidate.playerName,
						fromTurn: fromTurnCount,
						toTurn: get(appState).turnCount
					}
				});
			}
			return;
		}
		// If there's no candidate (defensive), treat as dead and continue
		nextIndex = (nextIndex + 1) % totalPlayers;
		attempts++;
	}
	// No alive player found
	appState.update((data) => ({ ...data, currentTurn: -1 }));
};

/**
 * Moves back to the previous alive player and records the transition in game history.
 * @returns {void}
 */
export const prevTurn = () => {
	vibrate(10);
	const totalPlayers = get(appSettings).playerCount || 4;
	const poisonLethalLimit = getPoisonLethalLimit(get(appSettings).startingLifeTotal);
	// Advance to the next non-dead player. If all players are dead, set to -1.
	const playersList = get(players);
	const current = get(appState).currentTurn;
	const fromPlayer = current >= 0 ? playersList[current] : undefined;
	const fromTurnCount = get(appState).turnCount;
	let nextIndex = (current - 1 + totalPlayers) % totalPlayers;
	let attempts = 0;
	// Limit search to totalPlayers steps to avoid infinite loop
	while (attempts < totalPlayers) {
		const candidate = playersList[nextIndex];
		const isDead = candidate
			? (candidate.lifeTotal <= 0 &&
					!(get(appSettings).allowNegativeLife || candidate.allowNegativeLife)) ||
				(candidate.poison ?? 0) >= poisonLethalLimit ||
				candidate.statusEffects?.ko === true ||
				candidate.isDead === true
			: true;
		// If the candidate is alive, set as current turn.
		if (candidate && !isDead) {
			setCurrentTurn(nextIndex, false);
			if (fromPlayer) {
				addGameHistoryEntry({
					playerId: fromPlayer.id,
					playerName: fromPlayer.playerName,
					kind: 'turnChange',
					payload: {
						toPlayerName: candidate.playerName,
						fromTurn: fromTurnCount,
						toTurn: get(appState).turnCount
					}
				});
			}
			return;
		}
		// If there's no candidate (defensive), treat as dead and continue
		nextIndex = (nextIndex - 1 + totalPlayers) % totalPlayers;
		attempts++;
	}
	// No alive player found
	appState.update((data) => ({ ...data, currentTurn: -1 }));
};

export const gameState = derived([players, appSettings, appState], ([$players, $appSettings, $appState]) => {
	// Stream payload is always normalized to 8 slots. Keeping a fixed width simplifies
	// consumer code and avoids schema churn when player count changes during a session.
	const playerCount = $appSettings.playerCount ?? 4;
	const activePlayers = $players.slice(0, playerCount);

	const names = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
		const player = activePlayers[index];
		return player?.playerName ?? `Player ${index + 1}`;
	});

	const lifeTotals = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
		const player = activePlayers[index];
		return player?.lifeTotal ?? 0;
	});

	return {
		playerCount,
		currentTurn: $appState.currentTurn,
		updatedAt: Date.now(),
		names,
		lifeTotals,
		namePlayer1: names[0] ?? '',
		namePlayer2: names[1] ?? '',
		namePlayer3: names[2] ?? '',
		namePlayer4: names[3] ?? '',
		namePlayer5: names[4] ?? '',
		namePlayer6: names[5] ?? '',
		namePlayer7: names[6] ?? '',
		namePlayer8: names[7] ?? '',
		lifePlayer1: lifeTotals[0] ?? 0,
		lifePlayer2: lifeTotals[1] ?? 0,
		lifePlayer3: lifeTotals[2] ?? 0,
		lifePlayer4: lifeTotals[3] ?? 0,
		lifePlayer5: lifeTotals[4] ?? 0,
		lifePlayer6: lifeTotals[5] ?? 0,
		lifePlayer7: lifeTotals[6] ?? 0,
		lifePlayer8: lifeTotals[7] ?? 0
	} satisfies StreamGameState;
});

// Backward compatibility for existing localStorage payloads.
appState.update((data) => {
	return {
		...data,
		dayNightCycleEnabled: data.dayNightCycleEnabled ?? false,
		dayNightPhase: data.dayNightPhase ?? 'day'
	};
});
