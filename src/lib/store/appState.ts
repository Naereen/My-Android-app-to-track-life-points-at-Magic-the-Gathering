import { persist } from './persist';
import { get } from 'svelte/store';
import { appSettings } from './appSettings';
import { vibrate } from '$lib/utils/haptics';
import { players } from './player';

export const appState = persist('appState', {
	isMenuOpen: false,
	activeMenu: '',
	// index of the current player's turn (0-based). Default to -1, to indicate no turn yet.
	currentTurn: -1,
	// number of turns played. 0 = not started, otherwise 1..99
	turnCount: 0,
	// index of the starting player for the current round tracking
	startingPlayerIndex: null as number | null
});

export const toggleIsMenuOpen = (menu: App.AppState.Menu = '') => {
	vibrate(10);
	appState.update((data) => ({ ...data, activeMenu: menu, isMenuOpen: !data.isMenuOpen }));
};

export const setCurrentTurn = (index: number, updateIsPositive: boolean) => {
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
		if (index === data.startingPlayerIndex) {
			vibrate(50);
			const nextCount = Math.max(0, Math.min(99, (data.turnCount || 0) + (updateIsPositive ? 1 : -1)));
			newData.turnCount = nextCount;
			return newData;
		}

		return newData;
	});
};

export const nextTurn = () => {
	vibrate(10);
	const totalPlayers = get(appSettings).playerCount || 4;
	// Advance to the next non-dead player. If all players are dead, set to -1.
	const playersList = get(players);
	const current = get(appState).currentTurn;
	let nextIndex = (current + 1) % totalPlayers;
	let attempts = 0;
	// Limit search to totalPlayers steps to avoid infinite loop
	while (attempts < totalPlayers) {
		const candidate = playersList[nextIndex];
		const isDead = candidate
			? (candidate.lifeTotal <= 0 &&
					!(get(appSettings).allowNegativeLife || candidate.allowNegativeLife)) ||
				(candidate.poison ?? 0) >= 10 ||
				candidate.statusEffects?.ko === true ||
				candidate.isDead === true
			: true;
		// If there's no candidate (defensive), treat as dead and continue
		if (candidate && !isDead) {
			setCurrentTurn(nextIndex, true);
			return;
		}
		nextIndex = (nextIndex + 1) % totalPlayers;
		attempts++;
	}
	// No alive player found
	appState.update((data) => ({ ...data, currentTurn: -1 }));
};

export const prevTurn = () => {
	vibrate(10);
	const totalPlayers = get(appSettings).playerCount || 4;
	// Advance to the next non-dead player. If all players are dead, set to -1.
	const playersList = get(players);
	const current = get(appState).currentTurn;
	let nextIndex = (current - 1 + totalPlayers) % totalPlayers;
	let attempts = 0;
	// Limit search to totalPlayers steps to avoid infinite loop
	while (attempts < totalPlayers) {
		const candidate = playersList[nextIndex];
		const isDead = candidate
			? (candidate.lifeTotal <= 0 &&
					!(get(appSettings).allowNegativeLife || candidate.allowNegativeLife)) ||
				(candidate.poison ?? 0) >= 10 ||
				candidate.statusEffects?.ko === true ||
				candidate.isDead === true
			: true;
		// If there's no candidate (defensive), treat as dead and continue
		if (candidate && !isDead) {
			setCurrentTurn(nextIndex, false);
			return;
		}
		nextIndex = (nextIndex - 1 + totalPlayers) % totalPlayers;
		attempts++;
	}
	// No alive player found
	appState.update((data) => ({ ...data, currentTurn: -1 }));
};
