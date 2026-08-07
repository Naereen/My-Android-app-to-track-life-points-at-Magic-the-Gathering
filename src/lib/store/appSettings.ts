import { type Writable } from 'svelte/store';
import { persist } from './persist';
import { locale as i18nLocale } from 'svelte-i18n';

interface AppSettings {
	// default settings values
	// number of players in the game (from 2 to 8, default is 4)
	playerCount: number;
	// default starting life total for players (20 for 2-players games, 40 otherwise)
	startingLifeTotal: number;
	customStartingLifeTotal: number;
	customRandomNumber: number;
	// whether to allow players to have negative life totals (default is false, meaning that the minimum life total is 0)
	allowNegativeLife: boolean;
	// whether to prevent the device screen from turning off while the app is active (default is true)
	preventScreenSleep: boolean;
	// layout for 4-players games: 'matrix' (2x2) or 'stacked' (1/2/1)
	fourPlayerLayout: 'matrix' | 'stacked';
	// layout for 3-players games: 'classic' (2 on top, 1 bottom) or 'inverted' (1 top, 2 bottom)
	threePlayerLayout: 'classic' | 'inverted';
	// layout for 6-players games: 'one' ("3 x 2") or 'two' ("|::|")
	sixPlayerLayout: 'one' | 'two';
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: boolean;
	// whether to enable gameplay sound effects for major game events (default is true)
	soundEffectsEnabled: boolean;
	// show the life-change history stack near life total
	showLifeChangeHistory: boolean;
	// app locale (default is 'fr' for French, but it will be overridden by the device locale if it's supported by the app)
	locale: string;
	// show a glowing border around the current player's panel
	enableCurrentPlayerGlow: boolean;
	// show the next-player button in the main menu
	showNextPlayerButton: boolean;
	// show the resources button in the main menu
	showResourcesButton: boolean;
	// show the randomizer button in the main menu
	showRandomizerButton: boolean;
	// show emblem menu button in the main menu
	showEmblemMenu: boolean;
	// show vanguard menu button in the main menu
	showVanguardMenu: boolean;
	// show treachery menu button in the main menu
	showTreacheryMenu: boolean;
	// enable vanguard mode when starting/resetting a game
	vanguardModeEnabled: boolean;
	// enable treachery mode when starting/resetting a game
	treacheryModeEnabled: boolean;
	// simpler Treachery variant with hidden roles only (no cards/images)
	shogunVariantEnabled: boolean;
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: boolean;
	// show game history menu button in the main menu
	showGameHistoryMenu: boolean;
	// enable Acorn status effect controls and badges in the UI
	enableAcornMode: boolean;
	// enable Ticket status effect controls and badges in the UI
	enableTicketMode: boolean;
	// turn timer: enable per-turn timer (optional)
	turnTimerEnabled: boolean;
	// default per-turn duration in seconds (2 minutes)
	turnTimerDuration: number;
	// play a short sound when timer reaches zero
	turnTimerSound: boolean;
	// global game timer shown in the central bar
	globalGameTimerEnabled: boolean;
	// default global game timer duration in seconds (depends on player count)
	globalGameTimerDuration: number;
	// stream mode (controller sends game updates to LAN relay)
	isStreamMode: boolean;
	// relay base URL, e.g. http://192.168.1.113:8787
	remoteServerUrl: string;
	// enable weighted random pick for selecting who starts the game
	useWeightedStartingPlayer: boolean;
	// per-seat starting chances in percent-like weights (seat 1..8)
	startingPlayerProbabilities: number[];
}

const MAX_PLAYER_SLOTS = 8;

const getUniformStartingProbabilities = (playerCount: number): number[] => {
	const activeCount = Math.max(2, Math.min(MAX_PLAYER_SLOTS, Math.floor(playerCount || 4)));
	const equalWeight = Number((100 / activeCount).toFixed(2));
	return Array.from({ length: MAX_PLAYER_SLOTS }, (_, index) =>
		index < activeCount ? equalWeight : 0
	);
};

const sanitizeStartingPlayerProbabilities = (
	probabilities: number[] | undefined,
	playerCount: number
): number[] => {
	const fallback = getUniformStartingProbabilities(playerCount);
	const source = Array.isArray(probabilities) ? probabilities : [];
	const normalized = Array.from({ length: MAX_PLAYER_SLOTS }, (_, index) => {
		const raw = source[index];
		if (index >= playerCount && raw === undefined) return 0;
		if (typeof raw !== 'number' || Number.isNaN(raw)) return fallback[index];
		return Math.max(0, Math.min(100, raw));
	});

	const activeSum = normalized.slice(0, playerCount).reduce((sum, value) => sum + value, 0);
	if (activeSum <= 0) {
		return fallback;
	}

	return normalized;
};

export const appSettings: Writable<AppSettings> = persist('appSettings', {
	// default settings values
	// number of players in the game (from 2 to 8, default is 4)
	playerCount: 4,
	// default starting life total for players (20 for 2-players games, 40 otherwise)
	startingLifeTotal: 40,
	customStartingLifeTotal: 60,
	customRandomNumber: 0,
	// whether to allow players to have negative life totals (default is false, meaning that the minimum life total is 0)
	allowNegativeLife: false,
	// whether to prevent the device screen from turning off while the app is active (default is true)
	preventScreenSleep: true,
	// layout for 4-players games: 'matrix' (2x2) or 'stacked' (1/2/1)
	fourPlayerLayout: 'matrix',
	// layout for 3-players games: 'classic' (2 on top, 1 bottom) or 'inverted' (1 top, 2 bottom)
	threePlayerLayout: 'classic',
	// layout for 6-players games: 'one' ("3 x 2") or 'two' ("|::|")
	sixPlayerLayout: 'one',
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: true,
	// whether to enable gameplay sound effects for major game events (default is true)
	soundEffectsEnabled: true,
	// show the life-change history stack near life total
	showLifeChangeHistory: true,
	// app locale (default is 'fr' for French, but it will be overridden by the device locale if it's supported by the app)
	locale: 'fr',
	// show a glowing border around the current player's panel
	enableCurrentPlayerGlow: true,
	// show the next-player button in the main menu
	showNextPlayerButton: true,
	// show the resources button in the main menu
	showResourcesButton: true,
	// show the randomizer button in the main menu
	showRandomizerButton: true,
	// show emblem menu button in the main menu
	showEmblemMenu: false,
	// show vanguard menu button in the main menu
	showVanguardMenu: false,
	// show treachery menu button in the main menu
	showTreacheryMenu: false,
	// enable vanguard mode when starting/resetting a game
	vanguardModeEnabled: false,
	// enable treachery mode when starting/resetting a game
	treacheryModeEnabled: false,
	// simpler Treachery variant with hidden roles only (no cards/images)
	shogunVariantEnabled: false,
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: false,
	// show game history menu button in the main menu
	showGameHistoryMenu: false,
	// Acorn and Ticket are hidden by default
	enableAcornMode: false,
	enableTicketMode: false,
	// turn timer: enable per-turn timer (optional)
	turnTimerEnabled: false,
	// default per-turn duration in seconds (2 minutes)
	turnTimerDuration: 120,
	// play a short sound when timer reaches zero
	turnTimerSound: false,
	// global game timer shown in the central bar
	globalGameTimerEnabled: true,
	// default global game timer duration for 4 players: 90 minutes
	globalGameTimerDuration: 5400,
	// stream mode (controller sends game updates to LAN relay)
	isStreamMode: false,
	// relay base URL, e.g. http://192.168.1.113:8787
	remoteServerUrl: 'http://192.168.1.113:8787',
	// weighted random start disabled by default
	useWeightedStartingPlayer: false,
	startingPlayerProbabilities: getUniformStartingProbabilities(4)
});

export const getDefaultGlobalGameTimerDuration = (playerCount: number): number => {
	return playerCount === 2 ? 3000 : 5400;
};

export const getDefaultStartingLifeTotal = (playerCount: number): number => {
	if (playerCount === 2) return 20;
	// if (playerCount === 3) return 30; // 3-player games are supported, but the default starting life total is NOT 30, it is also 40!
	return 40;
};

export const setPlayerCount = (playerCount: number) => {
	appSettings.update((data) => ({
		...data,
		playerCount,
		startingLifeTotal: getDefaultStartingLifeTotal(playerCount),
		startingPlayerProbabilities: sanitizeStartingPlayerProbabilities(
			data.startingPlayerProbabilities,
			playerCount
		),
		// Default behavior by format size: ON for 2 players, OFF otherwise.
		showLifeChangeHistory: playerCount === 2,
		// Keep custom value, but auto-adjust when the value is still the format default.
		globalGameTimerDuration:
			data.globalGameTimerDuration === getDefaultGlobalGameTimerDuration(data.playerCount)
				? getDefaultGlobalGameTimerDuration(playerCount)
				: data.globalGameTimerDuration
	}));
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

export const setShowLifeChangeHistory = (showLifeChangeHistory: boolean) => {
	appSettings.update((data) => ({ ...data, showLifeChangeHistory }));
};

// Backward compatibility for existing localStorage payloads that predate this option.
appSettings.update((data) => {
	if (data.showLifeChangeHistory === undefined) {
		return {
			...data,
			showLifeChangeHistory: true
		};
	}
	if (data.showResourcesButton === undefined) {
		return {
			...data,
			showResourcesButton: true
		};
	}
	if (data.showRandomizerButton === undefined) {
		return {
			...data,
			showRandomizerButton: true
		};
	}
	return data;
});

export const setEnableCurrentPlayerGlow = (enable: boolean) => {
	appSettings.update((data) => ({ ...data, enableCurrentPlayerGlow: enable }));
};

export const setShowNextPlayerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showNextPlayerButton: show }));
};

export const setShowResourcesButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showResourcesButton: show }));
};

export const setShowRandomizerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showRandomizerButton: show }));
};

export const setShowEmblemMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showEmblemMenu: show }));
};

export const setShowVanguardMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showVanguardMenu: show }));
};

export const setShowTreacheryMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showTreacheryMenu: show }));
};

export const setVanguardModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardModeEnabled: enabled }));
};

export const setTreacheryModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, treacheryModeEnabled: enabled }));
};

export const setShogunVariantEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, shogunVariantEnabled: enabled }));
};

export const setVanguardDraftThree = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardDraftThree: enabled }));
};

export const setShowGameHistoryMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showGameHistoryMenu: show }));
};

export const setEnableAcornMode = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, enableAcornMode: enabled }));
};

export const setEnableTicketMode = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, enableTicketMode: enabled }));
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

export const setGlobalGameTimerEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, globalGameTimerEnabled: enabled }));
};

export const setGlobalGameTimerDuration = (seconds: number) => {
	appSettings.update((data) => ({ ...data, globalGameTimerDuration: seconds }));
};

export const setIsStreamMode = (isStreamMode: boolean) => {
	appSettings.update((data) => ({ ...data, isStreamMode }));
};

export const setRemoteServerUrl = (remoteServerUrl: string) => {
	appSettings.update((data) => ({ ...data, remoteServerUrl: remoteServerUrl.trim() }));
};

export const setUseWeightedStartingPlayer = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, useWeightedStartingPlayer: enabled }));
};

export const setStartingPlayerProbability = (playerIndex: number, probability: number) => {
	appSettings.update((data) => {
		if (playerIndex < 0 || playerIndex >= MAX_PLAYER_SLOTS) return data;
		const next = sanitizeStartingPlayerProbabilities(
			data.startingPlayerProbabilities,
			data.playerCount
		);
		next[playerIndex] = Math.max(0, Math.min(100, Number(probability) || 0));
		return {
			...data,
			startingPlayerProbabilities: next
		};
	});
};

export const setFourPlayerLayout = (layout: 'matrix' | 'stacked') => {
	appSettings.update((data) => ({ ...data, fourPlayerLayout: layout }));
};

export const setThreePlayerLayout = (layout: 'classic' | 'inverted') => {
	appSettings.update((data) => ({ ...data, threePlayerLayout: layout }));
};

// Backward compatibility for localStorage payloads that predate global timer options.
appSettings.update((data) => {
	const withDefaults = {
		...data,
		threePlayerLayout: data.threePlayerLayout ?? 'classic',
		enableAcornMode: data.enableAcornMode ?? false,
		enableTicketMode: data.enableTicketMode ?? false,
		globalGameTimerEnabled: data.globalGameTimerEnabled ?? true,
		globalGameTimerDuration:
			data.globalGameTimerDuration ?? getDefaultGlobalGameTimerDuration(data.playerCount ?? 4),
		useWeightedStartingPlayer: data.useWeightedStartingPlayer ?? false,
		startingPlayerProbabilities: sanitizeStartingPlayerProbabilities(
			data.startingPlayerProbabilities,
			data.playerCount ?? 4
		)
	};
	return withDefaults;
});

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
