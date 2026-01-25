import { persist } from './persist';

export const appState = persist('appState', {
	isMenuOpen: false,
	activeMenu: ''
});

export const toggleIsMenuOpen = (menu: App.AppState.Menu = '') => {
	appState.update((data) => ({ activeMenu: menu, isMenuOpen: !data.isMenuOpen }));
};
