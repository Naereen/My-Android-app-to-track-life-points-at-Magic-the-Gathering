import { persist } from './persist';
import { get } from 'svelte/store';
import { appSettings } from './appSettings';

export const appState = persist('appState', {
	isMenuOpen: false,
	activeMenu: '',
	// index of the current player's turn (0-based). Default to -1, to indicate no turn yet.
	currentTurn: -1
});

export const toggleIsMenuOpen = (menu: App.AppState.Menu = '') => {
	appState.update((data) => ({ ...data, activeMenu: menu, isMenuOpen: !data.isMenuOpen }));
};

export const setCurrentTurn = (index: number) => {
	appState.update((data) => ({ ...data, currentTurn: index }));
};

export const nextTurn = () => {
	const totalPlayers = get(appSettings).playerCount || 4;
	appState.update((data) => ({ ...data, currentTurn: (data.currentTurn + 1) % totalPlayers }));
};

export const prevTurn = () => {
	const totalPlayers = get(appSettings).playerCount || 4;
	appState.update((data) => ({ ...data, currentTurn: (data.currentTurn - 1 + totalPlayers) % totalPlayers }));
};
