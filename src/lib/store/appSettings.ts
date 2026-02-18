import { type Writable } from 'svelte/store';
import { persist } from './persist';
import { locale as i18nLocale } from 'svelte-i18n';

interface AppSettings {
	// default settings values
	// number of players in the game (2, 3, 4, 5 or 6, default is 4)
	playerCount: number;
	// default starting life total for players (20 for 2-players games, 30 for Two-Headed Giant games, 40 for 4/5/6-players games)
	startingLifeTotal: number;
	customStartingLifeTotal: number;
	customRandomNumber: number;
	// whether to allow players to have negative life totals (default is false, meaning that the minimum life total is 0)
	allowNegativeLife: boolean;
	// whether to prevent the device screen from turning off while the app is active (default is true)
	preventScreenSleep: boolean;
	// layout for 4-players games: 'matrix' (2x2) or 'stacked' (1/2/1)
	fourPlayerLayout: 'matrix' | 'stacked';
	// layout for 6-players games: 'one' ("3 x 2") or 'two' ("|::|")
	sixPlayerLayout: 'one' | 'two';
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: boolean;
	// whether to enable gameplay sound effects for major game events (default is true)
	soundEffectsEnabled: boolean;
	// app locale (default is 'fr' for French, but it will be overridden by the device locale if it's supported by the app)
	locale: string;
	// show a glowing border around the current player's panel
	enableCurrentPlayerGlow: boolean;
	// show the next-player button in the main menu
	showNextPlayerButton: boolean;
	// show emblem menu button in the main menu
	showEmblemMenu: boolean;
	// show vanguard menu button in the main menu
	showVanguardMenu: boolean;
	// enable vanguard mode when starting/resetting a game
	vanguardModeEnabled: boolean;
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: boolean;
	// show game history menu button in the main menu
	showGameHistoryMenu: boolean;
	// turn timer: enable per-turn timer (optional)
	turnTimerEnabled: boolean;
	// default per-turn duration in seconds (2 minutes)
	turnTimerDuration: number;
	// play a short sound when timer reaches zero
	turnTimerSound: boolean;
}

export const appSettings: Writable<AppSettings> = persist('appSettings', {
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
	// layout for 6-players games: 'one' ("3 x 2") or 'two' ("|::|")
	sixPlayerLayout: 'one',
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: true,
	// whether to enable gameplay sound effects for major game events (default is true)
	soundEffectsEnabled: true,
	// app locale (default is 'fr' for French, but it will be overridden by the device locale if it's supported by the app)
	locale: 'fr',
	// show a glowing border around the current player's panel
	enableCurrentPlayerGlow: true,
	// show the next-player button in the main menu
	showNextPlayerButton: true,
	// show emblem menu button in the main menu
	showEmblemMenu: false,
	// show vanguard menu button in the main menu
	showVanguardMenu: false,
	// enable vanguard mode when starting/resetting a game
	vanguardModeEnabled: false,
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: false,
	// show game history menu button in the main menu
	showGameHistoryMenu: false,
	// turn timer: enable per-turn timer (optional)
	turnTimerEnabled: false,
	// default per-turn duration in seconds (2 minutes)
	turnTimerDuration: 120,
	// play a short sound when timer reaches zero
	turnTimerSound: false
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

export const setSoundEffectsEnabled = (soundEffectsEnabled: boolean) => {
	appSettings.update((data) => ({ ...data, soundEffectsEnabled }));
};

export const setEnableCurrentPlayerGlow = (enable: boolean) => {
	appSettings.update((data) => ({ ...data, enableCurrentPlayerGlow: enable }));
};

export const setShowNextPlayerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showNextPlayerButton: show }));
};

export const setShowEmblemMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showEmblemMenu: show }));
};

export const setShowVanguardMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showVanguardMenu: show }));
};

export const setVanguardModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardModeEnabled: enabled }));
};

export const setVanguardDraftThree = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardDraftThree: enabled }));
};

export const setShowGameHistoryMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showGameHistoryMenu: show }));
};

export const setTurnTimerEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, turnTimerEnabled: enabled }));
};

export const setTurnTimerDuration = (seconds: number) => {
	appSettings.update((data) => ({ ...data, turnTimerDuration: seconds }));
};

export const setTurnTimerSound = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, turnTimerSound: enabled }));
};

export const setFourPlayerLayout = (layout: 'matrix' | 'stacked') => {
	appSettings.update((data) => ({ ...data, fourPlayerLayout: layout }));
};

export const setSixPlayerLayout = (layout: 'one' | 'two') => {
	appSettings.update((data) => ({ ...data, sixPlayerLayout: layout }));
};

export const setAppLocale = (locale: string) => {
	appSettings.update((data) => ({ ...data, locale }));
	try {
		i18nLocale.set(locale);
	} catch (e) {
		// ignore if i18n not initialized yet
	}
};
