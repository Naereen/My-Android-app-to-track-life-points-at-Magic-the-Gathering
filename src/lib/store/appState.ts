import { persist } from './persist';
import { get } from 'svelte/store';
import { appSettings } from './appSettings';
import { vibrate } from '$lib/utils/haptics';
import { players } from './player';

export const appState = persist('appState', {
	isMenuOpen: false,
	activeMenu: '',
	// index of the current player's turn (0-based). Default to -1, to indicate no turn yet.
	currentTurn: -1
});

export const toggleIsMenuOpen = (menu: App.AppState.Menu = '') => {
	vibrate(10);
	appState.update((data) => ({ ...data, activeMenu: menu, isMenuOpen: !data.isMenuOpen }));
};

export const setCurrentTurn = (index: number) => {
	appState.update((data) => ({ ...data, currentTurn: index }));
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
			appState.update((data) => ({ ...data, currentTurn: nextIndex }));
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
			appState.update((data) => ({ ...data, currentTurn: nextIndex }));
			return;
		}
		nextIndex = (nextIndex - 1 + totalPlayers) % totalPlayers;
		attempts++;
	}
	// No alive player found
	appState.update((data) => ({ ...data, currentTurn: -1 }));
};
