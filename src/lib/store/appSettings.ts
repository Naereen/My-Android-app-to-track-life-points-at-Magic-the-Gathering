import { type Writable } from 'svelte/store';
import { persist } from './persist';
import { locale as i18nLocale } from 'svelte-i18n';

export const appSettings: Writable<App.Settings> = persist('appSettings', {
	// default settings values
	// number of players in the game (2, 3, 4, 5 or 6, default is 4)
	playerCount: 4,
	// default starting life total for players (20 for 2-players games, 30 for Two-Headed Giant games, 40 for 4/5/6-players games)
	startingLifeTotal: 40,
	customStartingLifeTotal: 60,
	customRandomNumber: 0,
	// whether to allow players to have negative life totals (default is false, meaning that the minimum life total is 0)
	allowNegativeLife: false,
	// whether to prevent the device screen from turning off while the app is active (default is true)
	preventScreenSleep: true,
	// layout for 4-players games: 'matrix' (2x2) or 'stacked' (1/2/1)
	fourPlayerLayout: 'matrix',
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: true,
	// app locale (default is 'fr' for French, but it will be overridden by the device locale if it's supported by the app)
	locale: 'fr',
	// show a glowing border around the current player's panel
	enableCurrentPlayerGlow: true,
	// show the next-player button in the main menu
	showNextPlayerButton: true
});

export const setPlayerCount = (playerCount: number) => {
	appSettings.update((data) => ({ ...data, playerCount }));
};

export const setStartingLifeTotal = (startingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, startingLifeTotal }));
};

export const setCustomStartingLifeTotal = (customStartingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, customStartingLifeTotal }));
};

export const setCustomRandomNumber = (customRandomNumber: number) => {
	appSettings.update((data) => ({ ...data, customRandomNumber }));
};

export const setAllowNegativeLife = (allowNegativeLife: boolean) => {
	appSettings.update((data) => ({ ...data, allowNegativeLife }));
};

export const setPreventScreenSleep = (preventScreenSleep: boolean) => {
	appSettings.update((data) => ({ ...data, preventScreenSleep }));
};

export const setHapticsEnabled = (hapticsEnabled: boolean) => {
	appSettings.update((data) => ({ ...data, hapticsEnabled }));
};

export const setEnableCurrentPlayerGlow = (enable: boolean) => {
	appSettings.update((data) => ({ ...data, enableCurrentPlayerGlow: enable }));
};

export const setShowNextPlayerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showNextPlayerButton: show }));
};

export const setFourPlayerLayout = (layout: 'matrix' | 'stacked') => {
	appSettings.update((data) => ({ ...data, fourPlayerLayout: layout }));
};

export const setAppLocale = (locale: string) => {
	appSettings.update((data) => ({ ...data, locale }));
	try {
		i18nLocale.set(locale);
	} catch (e) {
		// ignore if i18n not initialized yet
	}
};
