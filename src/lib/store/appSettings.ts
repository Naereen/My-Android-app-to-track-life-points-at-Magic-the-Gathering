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
	// layout for 8-players games: 'classic' (top/bottom + sides) or 'sides' (4 on each side)
	eightPlayerLayout: 'classic' | 'sides';
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
	// show bounty menu button in the main menu
	showBountyMenu: boolean;
	// enable bounty mode (Outlaws of Thunder Junction variant)
	bountyModeEnabled: boolean;
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: boolean;
	// show planechase menu button in the main menu
	showPlanechaseMenu: boolean;
	// show archenemy menu button in the main menu
	showArchenemyMenu: boolean;
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
	// underline the digits 6 and 9 in life totals and life-change diffs for readability
	underlineSixAndNine: boolean;
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
	// Legacy payloads may have too few entries or invalid numeric values.
	// We normalize shape first, then validate active-seat sum.
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
	// layout for 8-players games: 'classic' (top/bottom + sides) or 'sides' (4 on each side)
	eightPlayerLayout: 'sides',
	// whether to enable haptic feedback (vibration) for certain actions like incrementing/decrementing life totals (default is true)
	hapticsEnabled: true,
	// whether to enable gameplay sound effects for major game events (default is true)
	soundEffectsEnabled: true,
	// show the life-change history stack near life total
	showLifeChangeHistory: true,
	// underline the digits 6 and 9 in life totals and life-change diffs for readability
	underlineSixAndNine: true,
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
	// show bounty menu button in the main menu
	showBountyMenu: false,
	// enable bounty mode (Outlaws of Thunder Junction variant)
	bountyModeEnabled: false,
	// optional paper variant: each player gets 3 random vanguards and keeps one
	vanguardDraftThree: false,
	// show game history menu button in the main menu
	showGameHistoryMenu: true,
	// show planechase menu button in the main menu
	showPlanechaseMenu: false,
	// show archenemy menu button in the main menu
	showArchenemyMenu: false,
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

/**
 * Returns the poison-counters defeat threshold for the current format baseline.
 * 30-life restarts are treated as Two-Headed Giant defaults.
 * @param {number} startingLifeTotal Starting life selected for the current game.
 * @returns {number} Poison counters needed to lose.
 */
export const getPoisonLethalLimit = (startingLifeTotal: number): number => {
	return startingLifeTotal === 30 ? 15 : 10;
};

/**
 * Applies a new player count and synchronizes dependent defaults.
 * Recomputes starting life, weighted probabilities, life-history visibility and default global timer.
 * @param {number} playerCount Number of active seats.
 * @returns {void}
 */
export const setPlayerCount = (playerCount: number) => {
	appSettings.update((data) => ({
		...data,
		playerCount,
		startingLifeTotal: getDefaultStartingLifeTotal(playerCount),
		// Product decision: changing the number of seats resets weighted probabilities
		// to a uniform distribution for the new format.
		startingPlayerProbabilities: getUniformStartingProbabilities(playerCount),
		// Default behavior by format size: ON up to 4 players, OFF otherwise.
		showLifeChangeHistory: playerCount <= 4,
		// Keep custom value, but auto-adjust when the value is still the format default.
		globalGameTimerDuration:
			data.globalGameTimerDuration === getDefaultGlobalGameTimerDuration(data.playerCount)
				? getDefaultGlobalGameTimerDuration(playerCount)
				: data.globalGameTimerDuration
	}));
};

/**
 * Sets the currently selected starting life total preset.
 * @param {number} startingLifeTotal Life value used by game reset.
 * @returns {void}
 */
export const setStartingLifeTotal = (startingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, startingLifeTotal }));
};

/**
 * Persists custom life total value entered in settings.
 * @param {number} customStartingLifeTotal User-defined life total.
 * @returns {void}
 */
export const setCustomStartingLifeTotal = (customStartingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, customStartingLifeTotal }));
};

/**
 * Sets the upper bound used by the custom randomizer mode.
 * @param {number} customRandomNumber Maximum roll value for custom die mode.
 * @returns {void}
 */
export const setCustomRandomNumber = (customRandomNumber: number) => {
	appSettings.update((data) => ({ ...data, customRandomNumber }));
};

/**
 * Toggles global negative-life support for elimination rules.
 * @param {boolean} allowNegativeLife Whether players can stay alive below 0 life.
 * @returns {void}
 */
export const setAllowNegativeLife = (allowNegativeLife: boolean) => {
	appSettings.update((data) => ({ ...data, allowNegativeLife }));
};

/**
 * Toggles wake-lock preference to keep the display on during matches.
 * @param {boolean} preventScreenSleep Whether wake-lock should be requested when possible.
 * @returns {void}
 */
export const setPreventScreenSleep = (preventScreenSleep: boolean) => {
	appSettings.update((data) => ({ ...data, preventScreenSleep }));
};

/**
 * Enables or disables vibration-based feedback globally.
 * @param {boolean} hapticsEnabled Haptics preference.
 * @returns {void}
 */
export const setHapticsEnabled = (hapticsEnabled: boolean) => {
	appSettings.update((data) => ({ ...data, hapticsEnabled }));
};

/**
 * Enables/disables synthesized gameplay sound effects.
 * @param {boolean} soundEffectsEnabled Audio feedback preference.
 * @returns {void}
 */
export const setSoundEffectsEnabled = (soundEffectsEnabled: boolean) => {
	appSettings.update((data) => ({ ...data, soundEffectsEnabled }));
};

/**
 * Toggles per-player floating life-change history display.
 * @param {boolean} showLifeChangeHistory Whether transient life delta markers are rendered.
 * @returns {void}
 */
export const setShowLifeChangeHistory = (showLifeChangeHistory: boolean) => {
	appSettings.update((data) => ({ ...data, showLifeChangeHistory }));
};

/**
 * Toggles underline decoration on digits 6 and 9 in life totals and diffs.
 * @param {boolean} underlineSixAndNine Whether 6/9 digits are underlined.
 * @returns {void}
 */
export const setUnderlineSixAndNine = (underlineSixAndNine: boolean) => {
	appSettings.update((data) => ({ ...data, underlineSixAndNine }));
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
	if (data.showGameHistoryMenu === undefined) {
		return {
			...data,
			showGameHistoryMenu: true
		};
	}
	return data;
});

/**
 * Toggles glow/highlight effect around current active player.
 * @param {boolean} enable Whether current-turn glow is enabled.
 * @returns {void}
 */
export const setEnableCurrentPlayerGlow = (enable: boolean) => {
	appSettings.update((data) => ({ ...data, enableCurrentPlayerGlow: enable }));
};

/**
 * Shows or hides quick-access "next player" controls.
 * @param {boolean} show Whether next-player controls are visible.
 * @returns {void}
 */
export const setShowNextPlayerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showNextPlayerButton: show }));
};

/**
 * Shows or hides the resources modal/menu entry.
 * @param {boolean} show Whether resources button is visible.
 * @returns {void}
 */
export const setShowResourcesButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showResourcesButton: show }));
};

/**
 * Shows or hides randomizer access in the menu.
 * @param {boolean} show Whether randomizer button is visible.
 * @returns {void}
 */
export const setShowRandomizerButton = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showRandomizerButton: show }));
};

/**
 * Controls visibility of the emblem menu section.
 * @param {boolean} show Whether emblem menu entry is displayed.
 * @returns {void}
 */
export const setShowEmblemMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showEmblemMenu: show }));
};

/**
 * Controls visibility of the Vanguard menu section.
 * @param {boolean} show Whether Vanguard menu entry is displayed.
 * @returns {void}
 */
export const setShowVanguardMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showVanguardMenu: show }));
};

/**
 * Controls visibility of the Treachery menu section.
 * @param {boolean} show Whether Treachery menu entry is displayed.
 * @returns {void}
 */
export const setShowTreacheryMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showTreacheryMenu: show }));
};

/**
 * Legacy Bounty menu visibility toggle.
 * Kept for backward compatibility, now synchronized with bountyModeEnabled.
 * @param {boolean} show Whether Bounty mode is enabled.
 * @returns {void}
 */
export const setShowBountyMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showBountyMenu: show, bountyModeEnabled: show }));
};

/**
 * Enables/disables Bounty mode (Outlaws of Thunder Junction variant).
 * Also synchronizes legacy menu visibility flag.
 * @param {boolean} enabled Whether Bounty mode is active.
 * @returns {void}
 */
export const setBountyModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, bountyModeEnabled: enabled, showBountyMenu: enabled }));
};

/**
 * Enables/disables Vanguard game mode for resets/new games.
 * @param {boolean} enabled Whether Vanguard rules are active.
 * @returns {void}
 */
export const setVanguardModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardModeEnabled: enabled }));
};

/**
 * Enables/disables Treachery mode assignment at game start.
 * @param {boolean} enabled Whether Treachery mode is active.
 * @returns {void}
 */
export const setTreacheryModeEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, treacheryModeEnabled: enabled }));
};

/**
 * Enables the simplified hidden-role Treachery variant (Shogun style).
 * @param {boolean} enabled Whether Shogun variant is active.
 * @returns {void}
 */
export const setShogunVariantEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, shogunVariantEnabled: enabled }));
};

/**
 * Enables "draft three vanguards, keep one" setup flow.
 * @param {boolean} enabled Whether draft-three variant is active.
 * @returns {void}
 */
export const setVanguardDraftThree = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, vanguardDraftThree: enabled }));
};

/**
 * Shows or hides the game-history menu entry.
 * @param {boolean} show Whether history menu entry is visible.
 * @returns {void}
 */
export const setShowGameHistoryMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showGameHistoryMenu: show }));
};

/**
 * Shows or hides the Planechase menu entry.
 * @param {boolean} show Whether Planechase menu entry is visible.
 * @returns {void}
 */
export const setShowPlanechaseMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showPlanechaseMenu: show }));
};

/**
 * Shows or hides the Archenemy menu entry.
 * @param {boolean} show Whether Archenemy menu entry is visible.
 * @returns {void}
 */
export const setShowArchenemyMenu = (show: boolean) => {
	appSettings.update((data) => ({ ...data, showArchenemyMenu: show }));
};

/**
 * Enables Acorn status/counter support in the UI and stores.
 * @param {boolean} enabled Whether Acorn mode is available.
 * @returns {void}
 */
export const setEnableAcornMode = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, enableAcornMode: enabled }));
};

/**
 * Enables Ticket status/counter support in the UI and stores.
 * @param {boolean} enabled Whether Ticket mode is available.
 * @returns {void}
 */
export const setEnableTicketMode = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, enableTicketMode: enabled }));
};

/**
 * Enables/disables per-turn player timer.
 * @param {boolean} enabled Whether turn timer is active.
 * @returns {void}
 */
export const setTurnTimerEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, turnTimerEnabled: enabled }));
};

/**
 * Sets per-turn timer duration in seconds.
 * @param {number} seconds Turn duration for each player.
 * @returns {void}
 */
export const setTurnTimerDuration = (seconds: number) => {
	appSettings.update((data) => ({ ...data, turnTimerDuration: seconds }));
};

/**
 * Enables/disables timeout sound cue for per-turn timer.
 * @param {boolean} enabled Whether timeout beep is played.
 * @returns {void}
 */
export const setTurnTimerSound = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, turnTimerSound: enabled }));
};

/**
 * Enables/disables the global match timer displayed in the center bar.
 * @param {boolean} enabled Whether global timer is active.
 * @returns {void}
 */
export const setGlobalGameTimerEnabled = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, globalGameTimerEnabled: enabled }));
};

/**
 * Sets the base duration for the global match timer.
 * @param {number} seconds Match duration in seconds before overtime.
 * @returns {void}
 */
export const setGlobalGameTimerDuration = (seconds: number) => {
	appSettings.update((data) => ({ ...data, globalGameTimerDuration: seconds }));
};

/**
 * Enables controller->relay streaming mode.
 * @param {boolean} isStreamMode Whether state updates are posted to remote relay.
 * @returns {void}
 */
export const setIsStreamMode = (isStreamMode: boolean) => {
	appSettings.update((data) => ({ ...data, isStreamMode }));
};

/**
 * Sets relay server base URL used by stream mode.
 * @param {string} remoteServerUrl Relay origin/base URL (trimmed before persistence).
 * @returns {void}
 */
export const setRemoteServerUrl = (remoteServerUrl: string) => {
	appSettings.update((data) => ({ ...data, remoteServerUrl: remoteServerUrl.trim() }));
};

/**
 * Toggles weighted random selection for starting player.
 * @param {boolean} enabled Whether weighted probabilities should be used.
 * @returns {void}
 */
export const setUseWeightedStartingPlayer = (enabled: boolean) => {
	appSettings.update((data) => ({ ...data, useWeightedStartingPlayer: enabled }));
};

/**
 * Resets per-seat starting-player probabilities to a uniform distribution.
 * @returns {void}
 */
export const resetStartingPlayerProbabilities = () => {
	appSettings.update((data) => ({
		...data,
		startingPlayerProbabilities: getUniformStartingProbabilities(data.playerCount)
	}));
};

/**
 * Updates one player's weighted start probability (clamped to 0..100).
 * @param {number} playerIndex Zero-based player slot index.
 * @param {number} probability Desired probability percentage.
 * @returns {void}
 */
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

/**
 * Selects the 4-player board layout variant.
 * @param {'matrix' | 'stacked'} layout 4-player layout key.
 * @returns {void}
 */
export const setFourPlayerLayout = (layout: 'matrix' | 'stacked') => {
	appSettings.update((data) => ({ ...data, fourPlayerLayout: layout }));
};

/**
 * Selects the 3-player board layout variant.
 * @param {'classic' | 'inverted'} layout 3-player layout key.
 * @returns {void}
 */
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
		eightPlayerLayout: data.eightPlayerLayout ?? 'classic',
		useWeightedStartingPlayer: data.useWeightedStartingPlayer ?? false,
		startingPlayerProbabilities: sanitizeStartingPlayerProbabilities(
			data.startingPlayerProbabilities,
			data.playerCount ?? 4
		),
		underlineSixAndNine: data.underlineSixAndNine ?? true
	};
	return withDefaults;
});

/**
 * Selects the 6-player board layout variant.
 * @param {'one' | 'two'} layout 6-player layout key.
 * @returns {void}
 */
export const setSixPlayerLayout = (layout: 'one' | 'two') => {
	appSettings.update((data) => ({ ...data, sixPlayerLayout: layout }));
};

/**
 * Selects the 8-player board layout variant.
 * @param {'classic' | 'sides'} layout 8-player layout key.
 * @returns {void}
 */
export const setEightPlayerLayout = (layout: 'classic' | 'sides') => {
	appSettings.update((data) => ({ ...data, eightPlayerLayout: layout }));
};

/**
 * Persists application locale and forwards it to `svelte-i18n` runtime.
 * @param {string} locale Locale code (e.g. `en`, `fr`, `es`).
 * @returns {void}
 */
export const setAppLocale = (locale: string) => {
	appSettings.update((data) => ({ ...data, locale }));
	try {
		i18nLocale.set(locale);
	} catch (e) {
		// ignore if i18n not initialized yet
	}
};
