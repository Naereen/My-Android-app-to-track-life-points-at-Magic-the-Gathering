<script lang="ts">
	import {
		appSettings,
		setIsStreamMode,
		setRemoteServerUrl,
		setCustomStartingLifeTotal,
		setPlayerCount,
		setStartingLifeTotal,
		setThreePlayerLayout,
		setFourPlayerLayout,
		setSixPlayerLayout,
		setEightPlayerLayout,
		setShowEmblemMenu,
		setShowVanguardMenu,
		setShowTreacheryMenu,
		setBountyModeEnabled,
		setShowLifeChangeHistory,
		setVanguardModeEnabled,
		setTreacheryModeEnabled,
		setShogunVariantEnabled,
		setVanguardDraftThree,
		setShowGameHistoryMenu,
		setShowResourcesButton,
		setShowRandomizerButton,
		setEnableAcornMode,
		setEnableTicketMode,
		setUseWeightedStartingPlayer,
		setStartingPlayerProbability,
		resetStartingPlayerProbabilities,
		setAppLocale,
		setShowPlanechaseMenu,
		setShowArchenemyMenu
	} from '$lib/store/appSettings';
	import {
		setTurnTimerEnabled,
		setTurnTimerDuration,
		setTurnTimerSound,
		setGlobalGameTimerEnabled,
		setGlobalGameTimerDuration
	} from '$lib/store/appSettings';
	import { globalGameTimer } from '$lib/store/globalGameTimer';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import CircularButton from '../../../shared/circularButton/CircularButton.svelte';
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { resetLifeTotals } from '$lib/store/player';
	import { showConfirm } from '$lib/store/modal';
	import {
		setAllowNegativeLife,
		setPreventScreenSleep,
		setHapticsEnabled,
		setSoundEffectsEnabled
	} from '$lib/store/appSettings';
	import { setEnableCurrentPlayerGlow, setShowNextPlayerButton } from '$lib/store/appSettings';
	import Acorn from '$lib/assets/icons/Acorn.svelte';
	import Ticket from '$lib/assets/icons/Ticket.svelte';
	import { players } from '$lib/store/player';
	import { _ } from 'svelte-i18n';

	type RelayHealthStatus = 'idle' | 'testing' | 'ok' | 'ko';

	let relayHealthStatus: RelayHealthStatus = 'idle';
	let relayHealthMessage = '';

	// The settings menu intentionally acts as the control hub for the whole app, so it
	// centralizes store mutations that would otherwise be scattered across several views.

	/**
	 * Clears persisted app stores after user confirmation, then reloads the page.
	 * @returns {unknown} Result produced by resetLocalStorage.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const resetLocalStorage = async () => {
		const confirmReset = await showConfirm($_('window_confirm_reset_local_storage'));
		if (!confirmReset) return;
		try {
			[
				'appSettings',
				'resourceCounter',
				'appState',
				'players',
				'emblemState',
				'vanguardState',
				'gameHistory'
			].forEach((k) => localStorage.removeItem(k));
		} catch (e) {
			// ignore
		}
		window.location.reload();
	};

	/**
	 * Checks whether the selected starting life is outside standard preset buttons.
	 * @returns {unknown} Result produced by isCustomStartingLife.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const isCustomStartingLife = () => {
		// Treat anything outside the standard presets as a custom value, which keeps the UI
		// in sync even when data was loaded from an older persistence snapshot.
		return (
			$appSettings.startingLifeTotal !== 20 &&
			$appSettings.startingLifeTotal !== 25 &&
			$appSettings.startingLifeTotal !== 30 &&
			$appSettings.startingLifeTotal !== 40
		);
	};

	/**
	 * Normalizes custom life input to an integer value accepted by the app.
	 * @param {number} value - Parameter used by clampCustomStartingLifeTotal.
	 * @returns {unknown} Result produced by clampCustomStartingLifeTotal.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const clampCustomStartingLifeTotal = (value: number) => {
		if (!Number.isFinite(value)) return 1;
		return Math.max(1, Math.min(999, Math.round(value)));
	};

	/**
	 * Persists live value typed in the custom life input field.
	 * @param {Event} event - Parameter used by handleCustomLifeTotalInput.
	 * @returns {unknown} Result produced by handleCustomLifeTotalInput.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleCustomLifeTotalInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		setCustomStartingLifeTotal(clampCustomStartingLifeTotal(Number(target.value)));
	};

	/**
	 * Applies custom life value by reusing the same flow as preset buttons.
	 * @returns {unknown} Result produced by applyCustomStartingLifeTotal.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const applyCustomStartingLifeTotal = () => {
		setLifeTotal(clampCustomStartingLifeTotal($appSettings.customStartingLifeTotal));
	};

	/**
	 * Submits custom life value when the user presses Enter.
	 * @param {KeyboardEvent} event - Parameter used by handleCustomLifeTotalKeydown.
	 * @returns {unknown} Result produced by handleCustomLifeTotalKeydown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleCustomLifeTotalKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			applyCustomStartingLifeTotal();
		}
	};

	/**
	 * Expands the custom starting-life editor controls.
	 * @returns {unknown} Result produced by openCustomStartingLifeEditor.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const openCustomStartingLifeEditor = () => {
		showCustomStartingLifeEditor = true;
	};

	/**
	 * Confirms and applies a new starting life total, then resets the match.
	 * @param {number} startingLifeTotal - Parameter used by setLifeTotal.
	 * @returns {unknown} Result produced by setLifeTotal.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const setLifeTotal = async (startingLifeTotal: number) => {
		// Changing starting life resets the board because most game-state calculations derive
		// from that baseline and would otherwise remain inconsistent.
		const confirm = await showConfirm(
			`${$_('window_confirm_change_life_total').replace('{lifeTotal}', startingLifeTotal.toString())}`
		);
		if (confirm) {
			const nextLife = clampCustomStartingLifeTotal(startingLifeTotal);
			setStartingLifeTotal(nextLife);
			if (![20, 25, 30, 40].includes(nextLife)) {
				setCustomStartingLifeTotal(nextLife);
			}
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	/**
	 * Confirms and applies a new player count, then resets the match state.
	 * @param {number} playerCount - Parameter used by setNewPlayerCount.
	 * @returns {unknown} Result produced by setNewPlayerCount.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const setNewPlayerCount = async (playerCount: number) => {
		// Player count is one of the most structurally important settings, so the app asks for
		// confirmation before reshaping seat layout and dependent defaults.
		const confirm = await showConfirm(
			$_('window_confirm_change_player_count').replace('{playerCount}', playerCount.toString())
		);
		if (confirm) {
			setPlayerCount(playerCount);
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	$: innerHeight = 0;
	let showCustomStartingLifeEditor = false;

	$: if (isCustomStartingLife()) {
		showCustomStartingLifeEditor = true;
	}

	/**
	 * Adds keyboard scrolling support for the settings panel.
	 * @param {KeyboardEvent} event - Parameter used by handleScrollKeydown.
	 * @returns {unknown} Result produced by handleScrollKeydown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleScrollKeydown = (event: KeyboardEvent) => {
		// Keyboard scrolling preserves accessibility on desktop when the settings panel is long.
		const target = event.currentTarget as HTMLElement;
		if (!target) return;
		if (event.key === 'ArrowDown') {
			target.scrollBy({ top: 48, behavior: 'smooth' });
			event.preventDefault();
		} else if (event.key === 'ArrowUp') {
			target.scrollBy({ top: -48, behavior: 'smooth' });
			event.preventDefault();
		}
	};

	/**
	 * Persists the global "allow negative life" checkbox value.
	 * @param {Event} e - Parameter used by handleGlobalAllowChange.
	 * @returns {unknown} Result produced by handleGlobalAllowChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleGlobalAllowChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setAllowNegativeLife(!!target.checked);
	};

	/**
	 * Persists the screen wake-lock preference from settings UI.
	 * @param {Event} e - Parameter used by handlePreventSleepChange.
	 * @returns {unknown} Result produced by handlePreventSleepChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handlePreventSleepChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setPreventScreenSleep(!!target.checked);
	};

	/**
	 * Persists haptics toggle from settings UI.
	 * @param {Event} e - Parameter used by handleHapticsChange.
	 * @returns {unknown} Result produced by handleHapticsChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleHapticsChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setHapticsEnabled(!!target.checked);
	};

	/**
	 * Persists gameplay sound toggle from settings UI.
	 * @param {Event} e - Parameter used by handleSoundEffectsChange.
	 * @returns {unknown} Result produced by handleSoundEffectsChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleSoundEffectsChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setSoundEffectsEnabled(!!target.checked);
	};

	/**
	 * Persists visibility of floating life change history badges.
	 * @param {Event} e - Parameter used by handleShowLifeChangeHistoryChange.
	 * @returns {unknown} Result produced by handleShowLifeChangeHistoryChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowLifeChangeHistoryChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowLifeChangeHistory(!!target.checked);
	};

	/**
	 * Persists Acorn counter mode toggle.
	 * @param {Event} e - Parameter used by handleEnableAcornModeChange.
	 * @returns {unknown} Result produced by handleEnableAcornModeChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleEnableAcornModeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setEnableAcornMode(!!target.checked);
	};

	/**
	 * Persists Ticket counter mode toggle.
	 * @param {Event} e - Parameter used by handleEnableTicketModeChange.
	 * @returns {unknown} Result produced by handleEnableTicketModeChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleEnableTicketModeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setEnableTicketMode(!!target.checked);
	};

	/**
	 * Enables/disables weighted start-player randomization from checkbox state.
	 * @param {Event} e - Parameter used by handleUseWeightedStartingPlayerChange.
	 * @returns {unknown} Result produced by handleUseWeightedStartingPlayerChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleUseWeightedStartingPlayerChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setUseWeightedStartingPlayer(!!target.checked);
	};

	/**
	 * Restores uniform probabilities for all active players.
	 * @returns {unknown} Result produced by handleResetStartingPlayerProbabilities.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleResetStartingPlayerProbabilities = () => {
		resetStartingPlayerProbabilities();
	};

	/**
	 * Returns player name label used in weighted-probability settings rows.
	 * @param {number} index - Parameter used by getDisplayedPlayerName.
	 * @returns {unknown} Result produced by getDisplayedPlayerName.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const getDisplayedPlayerName = (index: number) => {
		const fallback = `Player ${index + 1}`;
		return $players[index]?.playerName?.trim() || fallback;
	};

	/**
	 * Parses and clamps one probability input before persisting it.
	 * @param {number} index - Parameter used by handleStartingPlayerProbabilityChange.
	 * @param {string} value - Parameter used by handleStartingPlayerProbabilityChange.
	 * @returns {unknown} Result produced by handleStartingPlayerProbabilityChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleStartingPlayerProbabilityChange = (index: number, value: string) => {
		let parsed = Number(value);
		if (!Number.isFinite(parsed)) parsed = 0;
		parsed = Math.max(0, Math.min(100, parsed));
		setStartingPlayerProbability(index, parsed);
	};

	/**
	 * Bridges raw DOM input events to probability parsing routine.
	 * @param {number} index - Parameter used by handleStartingPlayerProbabilityInput.
	 * @param {Event} event - Parameter used by handleStartingPlayerProbabilityInput.
	 * @returns {unknown} Result produced by handleStartingPlayerProbabilityInput.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleStartingPlayerProbabilityInput = (index: number, event: Event) => {
		const target = event.currentTarget as HTMLInputElement | null;
		handleStartingPlayerProbabilityChange(index, target?.value ?? '0');
	};

	$: weightedStartSum = ($appSettings.startingPlayerProbabilities || [])
		.slice(0, $appSettings.playerCount)
		.reduce((sum, p) => sum + (Number.isFinite(Number(p)) ? Number(p) : 0), 0);

	/**
	 * Updates current-player glow preference while enforcing dependency on next-player button.
	 * @param {Event} e - Parameter used by handleEnableGlowChange.
	 * @returns {unknown} Result produced by handleEnableGlowChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleEnableGlowChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// Ne pas permettre d'activer le glow si le bouton "next player" est désactivé
		if (!$appSettings.showNextPlayerButton) {
			setEnableCurrentPlayerGlow(false);
			return;
		}
		setEnableCurrentPlayerGlow(!!target.checked);
	};

	/**
	 * Toggles next-player controls and keeps glow setting consistent with availability.
	 * @param {Event} e - Parameter used by handleShowNextButtonChange.
	 * @returns {unknown} Result produced by handleShowNextButtonChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowNextButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		const checked = !!target.checked;
		setShowNextPlayerButton(checked);
		if (!checked) {
			// si on désactive le bouton next-player, forcer aussi la désactivation du glow
			setEnableCurrentPlayerGlow(false);
		} else {
			// si on active le bouton next-player, réactiver le glow par défaut
			setEnableCurrentPlayerGlow(true);
		}
	};

	/**
	 * Persists emblem menu visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowEmblemMenuChange.
	 * @returns {unknown} Result produced by handleShowEmblemMenuChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowEmblemMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowEmblemMenu(!!target.checked);
	};

	/**
	 * Persists resources-button visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowResourcesButtonChange.
	 * @returns {unknown} Result produced by handleShowResourcesButtonChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowResourcesButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowResourcesButton(!!target.checked);
	};

	/**
	 * Persists randomizer-button visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowRandomizerButtonChange.
	 * @returns {unknown} Result produced by handleShowRandomizerButtonChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowRandomizerButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowRandomizerButton(!!target.checked);
	};

	/**
	 * Persists Vanguard menu visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowVanguardMenuChange.
	 * @returns {unknown} Result produced by handleShowVanguardMenuChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowVanguardMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowVanguardMenu(!!target.checked);
	};

	/**
	 * Persists Treachery menu visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowTreacheryMenuChange.
	 * @returns {unknown} Result produced by handleShowTreacheryMenuChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowTreacheryMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowTreacheryMenu(!!target.checked);
	};

	/**
	 * Persists Vanguard mode activation toggle.
	 * @param {Event} e - Parameter used by handleVanguardModeEnabledChange.
	 * @returns {unknown} Result produced by handleVanguardModeEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleVanguardModeEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setVanguardModeEnabled(!!target.checked);
	};

	/**
	 * Persists Treachery mode activation toggle.
	 * @param {Event} e - Parameter used by handleTreacheryModeEnabledChange.
	 * @returns {unknown} Result produced by handleTreacheryModeEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTreacheryModeEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTreacheryModeEnabled(!!target.checked);
	};

	/**
	 * Persists Shogun Treachery variant toggle.
	 * @param {Event} e - Parameter used by handleShogunVariantEnabledChange.
	 * @returns {unknown} Result produced by handleShogunVariantEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShogunVariantEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShogunVariantEnabled(!!target.checked);
	};

	/**
	 * Persists the unified Bounty mode toggle.
	 * @param {Event} e - Parameter used by handleBountyModeEnabledChange.
	 * @returns {unknown} Result produced by handleBountyModeEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleBountyModeEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setBountyModeEnabled(!!target.checked);
	};

	/**
	 * Persists Vanguard draft-three setup toggle.
	 * @param {Event} e - Parameter used by handleVanguardDraftThreeChange.
	 * @returns {unknown} Result produced by handleVanguardDraftThreeChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleVanguardDraftThreeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setVanguardDraftThree(!!target.checked);
	};

	/**
	 * Persists game-history menu visibility checkbox.
	 * @param {Event} e - Parameter used by handleShowGameHistoryMenuChange.
	 * @returns {unknown} Result produced by handleShowGameHistoryMenuChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleShowGameHistoryMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowGameHistoryMenu(!!target.checked);
	};

	const handleShowPlanechaseMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowPlanechaseMenu(!!target.checked);
	};

	const handleShowArchenemyMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowArchenemyMenu(!!target.checked);
	};

	/**
	 * Persists per-turn timer activation toggle.
	 * @param {Event} e - Parameter used by handleTurnTimerEnabledChange.
	 * @returns {unknown} Result produced by handleTurnTimerEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTurnTimerEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTurnTimerEnabled(!!target.checked);
	};

	/**
	 * Parses turn-timer minutes input, normalizes bounds, and applies converted seconds.
	 * @param {Event} e - Parameter used by handleTurnTimerDurationChange.
	 * @returns {unknown} Result produced by handleTurnTimerDurationChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTurnTimerDurationChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// input is minutes; enforce integer between 1 and 10
		let minutes = Math.round(Number(target.value) || 1);
		minutes = Math.max(1, Math.min(10, minutes));

		if (typeof document !== 'undefined') {
			const ae = document.activeElement as HTMLElement | null;
			if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
				ae.blur();
			}
			// try Virtual Keyboard API if available
			const nav = navigator as any;
			if (nav.virtualKeyboard && typeof nav.virtualKeyboard.hide === 'function') {
				try {
					nav.virtualKeyboard.hide();
				} catch {}
			}
		}

		setTurnTimerDuration(minutes * 60);
	};

	/**
	 * Persists timeout sound toggle for turn timer.
	 * @param {Event} e - Parameter used by handleTurnTimerSoundChange.
	 * @returns {unknown} Result produced by handleTurnTimerSoundChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTurnTimerSoundChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTurnTimerSound(!!target.checked);
	};

	/**
	 * Persists global timer toggle and resets timer when enabling it.
	 * @param {Event} e - Parameter used by handleGlobalGameTimerEnabledChange.
	 * @returns {unknown} Result produced by handleGlobalGameTimerEnabledChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleGlobalGameTimerEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setGlobalGameTimerEnabled(!!target.checked);
		if (target.checked) {
			globalGameTimer.resetForNewGame();
		}
	};

	/**
	 * Parses global timer minutes input and propagates duration to both settings and live timer.
	 * @param {Event} e - Parameter used by handleGlobalGameTimerDurationChange.
	 * @returns {unknown} Result produced by handleGlobalGameTimerDurationChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleGlobalGameTimerDurationChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// input is minutes; enforce integer between 1 and 300
		let minutes = Math.round(Number(target.value) || 1);
		minutes = Math.max(1, Math.min(300, minutes));

		if (typeof document !== 'undefined') {
			const ae = document.activeElement as HTMLElement | null;
			if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
				ae.blur();
			}
			const nav = navigator as any;
			if (nav.virtualKeyboard && typeof nav.virtualKeyboard.hide === 'function') {
				try {
					nav.virtualKeyboard.hide();
				} catch {}
			}
		}

		setGlobalGameTimerDuration(minutes * 60);
		globalGameTimer.applyDuration(minutes * 60);
	};

	/**
	 * Persists stream-mode activation toggle.
	 * @param {Event} e - Parameter used by handleStreamModeChange.
	 * @returns {unknown} Result produced by handleStreamModeChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleStreamModeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setIsStreamMode(!!target.checked);
	};

	/**
	 * Persists relay base URL and clears previous health-check state.
	 * @param {Event} e - Parameter used by handleStreamRemoteServerUrlChange.
	 * @returns {unknown} Result produced by handleStreamRemoteServerUrlChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleStreamRemoteServerUrlChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setRemoteServerUrl(target.value || '');
		relayHealthStatus = 'idle';
		relayHealthMessage = '';
	};

	/**
	 * Validates and normalizes relay base URL to http(s) origin/path without trailing slash.
	 * @param {string} rawUrl - Parameter used by getSanitizedRelayBaseUrl.
	 * @returns {unknown} Result produced by getSanitizedRelayBaseUrl.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const getSanitizedRelayBaseUrl = (rawUrl: string) => {
		const trimmed = (rawUrl || '').trim();
		if (!trimmed) return '';
		try {
			const url = new URL(trimmed);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
			return trimmed.replace(/\/$/, '');
		} catch {
			return '';
		}
	};

	$: relayBaseUrl = getSanitizedRelayBaseUrl($appSettings.remoteServerUrl);
	$: relayHealthUrl = relayBaseUrl ? `${relayBaseUrl}/health` : '';

	/**
	 * Probes relay `/health` endpoint with timeout and updates UI health status.
	 * @returns {unknown} Result produced by testRelayHealth.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const testRelayHealth = async () => {
		relayHealthMessage = '';
		const baseUrl = getSanitizedRelayBaseUrl($appSettings.remoteServerUrl);
		if (!baseUrl) {
			relayHealthStatus = 'ko';
			relayHealthMessage = $_('stream_mode_status_invalid_url') || 'Invalid relay URL';
			return;
		}

		relayHealthStatus = 'testing';
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);

		try {
			const response = await fetch(`${baseUrl}/health`, {
				method: 'GET',
				signal: controller.signal
			});

			if (!response.ok) {
				relayHealthStatus = 'ko';
				relayHealthMessage = `HTTP ${response.status}`;
				return;
			}

			relayHealthStatus = 'ok';
			relayHealthMessage = '';
		} catch (error) {
			relayHealthStatus = 'ko';
			relayHealthMessage =
				(error as Error).name === 'AbortError'
					? $_('stream_mode_status_timeout') || 'Connection timeout'
					: $_('stream_mode_status_unreachable') || 'Server unreachable';
		} finally {
			clearTimeout(timeoutId);
		}
	};

	/**
	 * Prevents opening health URL when no valid relay endpoint is available.
	 * @param {MouseEvent} event - Parameter used by handleOpenRelayHealthClick.
	 * @returns {unknown} Result produced by handleOpenRelayHealthClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleOpenRelayHealthClick = (event: MouseEvent) => {
		if (!relayHealthUrl) {
			event.preventDefault();
		}
	};

	const languages = [
		{ code: 'en', label: 'English', emoji: '🇬🇧' },
		{ code: 'fr', label: 'Français', emoji: '🇫🇷' },
		{ code: 'es', label: 'Español', emoji: '🇪🇸' },
		{ code: 'de', label: 'Deutsch', emoji: '🇩🇪' },
		{ code: 'it', label: 'Italiano', emoji: '🇮🇹' },
		{ code: 'pt', label: 'Português', emoji: '🇵🇹' }
	];

	/**
	 * Persists locale selection and triggers runtime i18n language switch.
	 * @param {string} code - Parameter used by handleChangeLocale.
	 * @returns {unknown} Result produced by handleChangeLocale.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleChangeLocale = (code: string) => {
		setAppLocale(code);
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-auto h-full"
	style="max-height: {innerHeight - 50}px; -webkit-overflow-scrolling: touch;"
	tabindex="-1"
	role="region"
	aria-label={$_('settings')}
>
	<div
		class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black"
	>
		<button
			on:click={() => toggleIsMenuOpen('')}
			on:contextmenu|preventDefault
			draggable="false"
			class="text-white absolute left-0 pl-4"><Arrow /></button
		>
		<span class="text-white text-center" style="font-size: 2rem;">{$_('settings')}</span>
	</div>

	<div class="w-full text-center text-white mt-2 flex flex-col items-center">
		<!-- Player Count -->
		<div class="w-3/4">
			<div><span style="font-size: 1.5rem;" class="font-bold">{$_('players')}</span></div>
			<div class="grid grid-cols-4 justify-items-center justify-center mt-3 gap-2">
				{#each [2, 3, 4, 5] as playerCount}
					{#key $appSettings.playerCount}
						<div>
							<CircularButton
								on:click={() => setNewPlayerCount(playerCount)}
								number={playerCount}
								highlight={$appSettings.playerCount === playerCount}
							/>
						</div>
					{/key}
				{/each}
			</div>
			<div class="grid grid-cols-3 justify-items-center justify-center mt-2">
				{#each [6, 7, 8] as playerCount}
					{#key $appSettings.playerCount}
						<div>
							<CircularButton
								on:click={() => setNewPlayerCount(playerCount)}
								number={playerCount}
								highlight={$appSettings.playerCount === playerCount}
							/>
						</div>
					{/key}
				{/each}
			</div>
			{#if $appSettings.playerCount === 3}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_3players_layout')}</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.threePlayerLayout === 'classic'}
							on:click={() => setThreePlayerLayout('classic')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="flex gap-1 h-1/2">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
								<div class="bg-gray-700 h-1/2 w-1/2 mx-auto" />
							</div>
							<div class="mt-1 text-sm">2 / 1</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.threePlayerLayout === 'inverted'}
							on:click={() => setThreePlayerLayout('inverted')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="bg-gray-700 h-1/2 w-1/2 mx-auto" />
								<div class="flex gap-1 h-1/2">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
							</div>
							<div class="mt-1 text-sm">1 / 2 (experimental)</div>
						</button>
					</div>
				</div>
			{/if}

			{#if $appSettings.playerCount === 4}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_4players_layout')}</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.fourPlayerLayout === 'matrix'}
							on:click={() => setFourPlayerLayout('matrix')}
						>
							<div class="w-full h-full grid grid-rows-2 grid-cols-2 gap-1">
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
							</div>
							<div class="mt-1 text-sm">2 x 2</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.fourPlayerLayout === 'stacked'}
							on:click={() => setFourPlayerLayout('stacked')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="bg-gray-700 h-1/3" />
								<div class="flex gap-1 h-1/3">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
								<div class="bg-gray-700 h-1/3" />
							</div>
							<div class="mt-1 text-sm">1 / 2 / 1</div>
						</button>
					</div>
				</div>
			{/if}

			{#if $appSettings.playerCount === 6}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_6players_layout')}</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.sixPlayerLayout === 'one'}
							on:click={() => setSixPlayerLayout('one')}
						>
							<div class="w-full h-full grid grid-rows-3 grid-cols-2 gap-1">
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
							</div>
							<div class="mt-1 text-sm">3 x 2</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.sixPlayerLayout === 'two'}
							on:click={() => setSixPlayerLayout('two')}
						>
							<div class="w-full h-full grid grid-rows-4 grid-cols-2 gap-1">
								<div class="bg-gray-700 col-span-2" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700 col-span-2" />
							</div>
							<div class="mt-1 text-sm">1 / 2 / 2 / 1</div>
						</button>
					</div>
				</div>
			{/if}

			{#if $appSettings.playerCount === 8}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_8players_layout')}</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.eightPlayerLayout === 'classic'}
							on:click={() => setEightPlayerLayout('classic')}
						>
							<div class="w-full h-full grid grid-rows-5 grid-cols-2 gap-1">
								<div class="bg-gray-700 col-span-2" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700 col-span-2" />
							</div>
							<div class="mt-1 text-sm">1 / 2 / 2 / 2 / 1</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.eightPlayerLayout === 'sides'}
							on:click={() => setEightPlayerLayout('sides')}
						>
							<div class="w-full h-full flex gap-1">
								<div class="flex w-1/2 flex-col gap-1">
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
								</div>
								<div class="flex w-1/2 flex-col gap-1">
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
									<div class="bg-gray-700 h-1/4" />
								</div>
							</div>
							<div class="mt-1 text-sm">4 | 4</div>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Starting Life Total -->
		<div class="mt-6 w-2/3">
			<div><span style="font-size: 1.5rem;" class="font-bold">{$_('starting_life')}</span></div>
			<div class="flex flex-row justify-between mt-3">
				{#each [20, 25, 30, 40, 'custom'] as lifeTotal}
					{#key $appSettings.startingLifeTotal}
						{#if typeof lifeTotal === 'number'}
							<div>
								<CircularButton
									on:click={() => setLifeTotal(lifeTotal)}
									number={lifeTotal}
									highlight={$appSettings.startingLifeTotal === lifeTotal}
								/>
							</div>
						{:else}
							<div>
								<CircularButton
									customText
									highlight={showCustomStartingLifeEditor || isCustomStartingLife()}
									on:click={openCustomStartingLifeEditor}
								>
									?
								</CircularButton>
								<span style="font-size: 0.75rem;">{$_('starting_life_custom_label_short')}</span>
							</div>
						{/if}
					{/key}
				{/each}
			</div>

			{#if showCustomStartingLifeEditor || isCustomStartingLife()}
				<div class="mt-4 p-3 rounded-xl bg-[#2d2f30] border border-gray-600">
					<div class="text-sm text-gray-300 mb-2">
						{$_('starting_life_custom_label') || 'Custom starting life total'}
					</div>
					<div class="flex items-center gap-2">
						<input
							type="number"
							min="1"
							max="999"
							step="1"
							value={$appSettings.customStartingLifeTotal}
							on:input={handleCustomLifeTotalInput}
							on:keydown={handleCustomLifeTotalKeydown}
							class="bg-gray-700 rounded-lg h-10 w-28 px-3 text-right text-white outline-none"
						/>
						<button
							on:click={applyCustomStartingLifeTotal}
							class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 h-10 rounded-lg"
						>
							{$_('starting_life_custom_apply') || 'Apply'}
						</button>
					</div>
					<div class="text-xs text-gray-400 mt-2">
						{#if isCustomStartingLife()}
							{$_('starting_life_current_custom') || 'Current starting life: custom'}
							{$appSettings.startingLifeTotal}
						{:else}
							{$_('starting_life_current_preset') || 'Current starting life: preset'}
							{$appSettings.startingLifeTotal}
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- All the main checkboxes -->
		<div class="w-full flex justify-center mt-6 mb-2">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('main_checkboxes_settings')}</div>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.preventScreenSleep}
					on:change={handlePreventSleepChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('prevent_screen_sleep') || 'Prevent screen sleep'}</span
				>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.hapticsEnabled}
					on:change={handleHapticsChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('haptic_feedback') || 'Enable haptic feedback'}</span
				>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.soundEffectsEnabled}
					on:change={handleSoundEffectsChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('sound_effects') || 'Sound effects'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showLifeChangeHistory}
					on:change={handleShowLifeChangeHistoryChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_life_change_history') || 'Show life change history'}</span
				>
			</label>
		</div>

		<!-- Main optional buttons -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">
					{$_('main_optional_buttons_settings_title') || 'Main Optional Buttons'}
				</div>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showNextPlayerButton}
					on:change={handleShowNextButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_next_player_button') || 'Show next-player button'}</span
				>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.enableCurrentPlayerGlow}
					on:change={handleEnableGlowChange}
					class="h-5 w-5"
					disabled={!$appSettings.showNextPlayerButton}
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('enable_current_player_glow') || 'Enable current player glow'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showResourcesButton}
					on:change={handleShowResourcesButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_resources_button') || 'Show resources button'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showRandomizerButton}
					on:change={handleShowRandomizerButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_randomizer_button') || 'Show randomizer button'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showEmblemMenu}
					on:change={handleShowEmblemMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_emblem_menu_button') || 'Show emblem menu button'}</span
				>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showGameHistoryMenu}
					on:change={handleShowGameHistoryMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_game_history_menu_button') || 'Show game history menu button'}</span
				>
			</label>
		</div>

		<!-- EDH variants settings -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">
					{$_('edh_variants_settings_title') || 'EDH Variants (experimental)'}
				</div>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.showVanguardMenu}
					on:change={handleShowVanguardMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_vanguard_menu_button') || 'Show Vanguard menu button'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.vanguardModeEnabled}
					on:change={handleVanguardModeEnabledChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('vanguard_mode_enabled') || 'Enable Vanguard mode on new game'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.vanguardDraftThree}
					on:change={handleVanguardDraftThreeChange}
					class="h-5 w-5"
					disabled={!$appSettings.vanguardModeEnabled}
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('vanguard_draft_three') || 'Variant: 3 Vanguard cards then keep one'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.showTreacheryMenu}
					on:change={handleShowTreacheryMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_treachery_menu_button') || 'Show Treachery menu button'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.treacheryModeEnabled}
					on:change={handleTreacheryModeEnabledChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('treachery_mode_enabled') || 'Enable Treachery mode on new game'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.shogunVariantEnabled}
					on:change={handleShogunVariantEnabledChange}
					class="h-5 w-5"
					disabled={!$appSettings.treacheryModeEnabled}
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('shogun_variant_enabled') || 'Enable Shogun variant (simpler)'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.bountyModeEnabled || $appSettings.showBountyMenu}
					on:change={handleBountyModeEnabledChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('bounty_mode_enabled') || '🎯 Turn on the « Bounty mode »'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.showPlanechaseMenu}
					on:change={handleShowPlanechaseMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_planechase_menu_button') || '🌀 Show Planechase menu button'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.showArchenemyMenu}
					on:change={handleShowArchenemyMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('show_archenemy_menu_button') || '😈 Show Archenemy menu button'}</span
				>
			</label>
		</div>

		<!-- Timers settings -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('timers_settings_title') || 'Timers'}</div>
			</div>
		</div>

		<div class="w-full flex text-left justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<div class="ml-2">
					<div class="text-lg font-semibold">
						<input
							type="checkbox"
							checked={$appSettings.globalGameTimerEnabled}
							on:change={handleGlobalGameTimerEnabledChange}
							class="h-5 w-5"
						/>
						{$_('global_game_timer_enabled') || 'Enable global game timer'}
					</div>
					<div class="text-sm text-gray-400">
						{$_('global_game_timer_enabled_help') ||
							'When enabled, a game-wide countdown appears in the center menu bar.'}
					</div>
				</div>
			</label>
		</div>

		{#if $appSettings.globalGameTimerEnabled}
			<div class="w-full flex justify-end mt-0 mb-0">
				<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
					<span class="ml-2 text-lg font-semibold"
						>{$_('global_game_timer_duration') || 'Global timer duration (minutes)'}</span
					>
					<input
						type="number"
						min="1"
						max="300"
						step="1"
						value={Math.round($appSettings.globalGameTimerDuration / 60)}
						on:change={handleGlobalGameTimerDurationChange}
						class="bg-gray-600 w-24 h-8 rounded text-center text-xl ml-3"
					/>
				</label>
			</div>
		{/if}

		<!-- Turn timer settings -->
		<div class="w-full flex text-left justify-start mt-0 mb-0">
			<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<div class="ml-2">
					<div class="text-lg font-semibold">
						<input
							type="checkbox"
							checked={$appSettings.turnTimerEnabled}
							on:change={handleTurnTimerEnabledChange}
							class="h-5 w-5"
						/>
						{$_('turn_timer_enabled') || 'Enable per-turn timer'}
					</div>
					<div class="text-sm text-gray-400">
						{$_('turn_timer_enabled_help') ||
							'When enabled, a per-turn countdown is shown for the active player.'}
					</div>
				</div>
			</label>
		</div>

		{#if $appSettings.turnTimerEnabled}
			<div class="w-full flex justify-end mt-0 mb-0">
				<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
					<span class="ml-2 text-lg font-semibold"
						>{$_('turn_timer_duration') || 'Turn duration (minutes)'}</span
					>
					<input
						type="number"
						min="1"
						max="10"
						step="1"
						value={Math.round($appSettings.turnTimerDuration / 60)}
						on:change={handleTurnTimerDurationChange}
						class="bg-gray-600 w-20 h-8 rounded text-center text-xl ml-3"
					/>
				</label>
			</div>

			<div class="w-full flex justify-center mt-0 mb-0">
				<label class="flex gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
					<input
						type="checkbox"
						checked={$appSettings.turnTimerSound}
						on:change={handleTurnTimerSoundChange}
						class="h-5 w-5"
					/>
					<span class="ml-2 text-lg font-semibold"
						>{$_('turn_timer_sound') || 'Play sound on timeout'}</span
					>
				</label>
			</div>
		{/if}

		<!-- All the additional checkboxes -->
		<div class="w-full flex justify-center mt-6 mb-2">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('additional_checkboxes_settings')}</div>
			</div>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.allowNegativeLife}
					on:change={handleGlobalAllowChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('allow_negative_life_global') || 'Allow negative life (global)'}</span
				>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.enableAcornMode}
					on:change={handleEnableAcornModeChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold inline-flex items-center gap-2">
					<Acorn />
					{$_('enable_acorn_mode') || 'Enable Acorn mode?'}
				</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.enableTicketMode}
					on:change={handleEnableTicketModeChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold inline-flex items-center gap-2">
					<Ticket />
					{$_('enable_ticket_mode') || 'Enable Ticket mode?'}
				</span>
			</label>
		</div>

		<!-- Custom starting probabilities for various players -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<span class="text-2xl font-bold">
					{$_('starting_player_probabilities_title') || 'Starting Player Probabilities'}
				</span>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.useWeightedStartingPlayer}
					on:change={handleUseWeightedStartingPlayerChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">
					{$_('starting_player_probabilities_enable') ||
						'Enable custom probabilities for who starts'}
				</span>
			</label>
		</div>

		{#if $appSettings.useWeightedStartingPlayer}
			<div class="w-full px-6 mt-1 mb-2 text-left">
				<div class="text-sm text-gray-300 mb-2">
					<p>
						{$_('starting_player_probabilities_caption') ||
							'This experimental option lets you customize who is more likely to start the game.'}
					</p>
				</div>
			</div>
			<div class="w-full flex justify-start mt-0 mb-1 pl-12">
				<button
					on:click={handleResetStartingPlayerProbabilities}
					class="px-3 py-1 rounded bg-blue-900 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					disabled={!$appSettings.useWeightedStartingPlayer}
				>
					{$_('starting_player_probabilities_reset') || 'Reset starting player probabilities'}
				</button>
			</div>
			<div class="w-full px-6 mt-1 mb-2 text-left">
				<div class="text-sm text-gray-300 mb-2">
					<p>
						{$_('starting_player_probabilities_help') ||
							'Values are treated as weights. They do not need to sum exactly to 100.'}
					</p>
				</div>
			</div>
			<div class="w-full px-6 mt-1 mb-2 text-left">
				{#each Array.from({ length: $appSettings.playerCount }) as slot, index}
					<div
						class="flex items-center justify-between gap-3 mb-2 bg-gray-800/70 rounded-xl px-3 py-2"
					>
						<div class="text-base text-gray-100">
							{$_('starting_player_probabilities_change_for') || 'Chance for'}
							"{getDisplayedPlayerName(index)}"
						</div>
						<div class="flex items-center gap-2">
							<input
								type="number"
								min="0"
								max="100"
								step="1"
								value={(() =>
									Math.round(($appSettings.startingPlayerProbabilities?.[index] ?? 0) * 100) /
									100)()}
								on:change={(e) => handleStartingPlayerProbabilityInput(index, e)}
								class="bg-gray-600 w-20 h-8 rounded text-center text-lg"
							/>
							<span class="text-gray-100 font-semibold">%</span>
						</div>
					</div>
				{/each}
				<div class="text-xs text-gray-400 mt-1">
					{$_('starting_player_probabilities_sum') || 'Current total'}: {Math.round(
						weightedStartSum * 100
					) / 100}%
				</div>
			</div>
		{/if}

		<!-- Stream mode settings (LAN relay) -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">
					{$_('stream_mode_title') || 'Experimental Stream Mode (LAN relay)'}
				</div>
			</div>
		</div>
		<div class="w-full flex justify-left mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.isStreamMode}
					on:change={handleStreamModeChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold"
					>{$_('stream_mode_enable') || 'Enable stream mode'}</span
				>
			</label>
		</div>
		{#if $appSettings.isStreamMode}
			<div class="w-full flex justify-start mt-0 mb-0 px-8">
				<div style="min-width: 12rem; max-width: 32rem;" class="w-full">
					<div class="text-sm text-gray-400 mb-1">
						{$_('stream_mode_help') || 'Use the local relay URL, e.g. http://192.168.1.113:8787'}
					</div>
					<input
						type="url"
						value={$appSettings.remoteServerUrl}
						on:change={handleStreamRemoteServerUrlChange}
						placeholder={$_('stream_mode_server_url_placeholder') || 'http://192.168.1.113:8787'}
						class="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none border border-gray-500"
					/>
					<div class="text-sm mt-1">{$_('stream_mode_server_url') || 'Relay server URL'}</div>
					<div class="mt-2 flex items-center gap-3">
						<button
							on:click={testRelayHealth}
							class="px-3 py-1 rounded bg-gray-700 border border-gray-500"
							disabled={relayHealthStatus === 'testing'}
						>
							{$_('stream_mode_test_button') || 'Test relay'}
						</button>
						<a
							href={relayHealthUrl || '#'}
							target="_blank"
							rel="noreferrer"
							class="px-3 py-1 rounded border border-gray-500"
							class:text-blue-300={!!relayHealthUrl}
							class:text-gray-500={!relayHealthUrl}
							on:click={handleOpenRelayHealthClick}
						>
							{$_('stream_mode_open_health_link') || 'Open /health'}
						</a>
						<span
							class:text-gray-400={relayHealthStatus === 'idle'}
							class:text-yellow-300={relayHealthStatus === 'testing'}
							class:text-green-300={relayHealthStatus === 'ok'}
							class:text-red-300={relayHealthStatus === 'ko'}
						>
							{#if relayHealthStatus === 'testing'}
								{$_('stream_mode_status_testing') || 'Testing...'}
							{:else if relayHealthStatus === 'ok'}
								{$_('stream_mode_status_ok') || 'Relay OK'}
							{:else if relayHealthStatus === 'ko'}
								{$_('stream_mode_status_ko') || 'Relay KO'}{relayHealthMessage
									? ` (${relayHealthMessage})`
									: ''}
							{:else}
								{$_('stream_mode_status_idle') || 'Not tested'}
							{/if}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Language selection -->
		<div class="w-full flex justify-center mt-6 mb-4">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl mb-2 font-bold">{$_('choose_your_language')}</div>
				<div class="grid grid-cols-3 gap-2 justify-center w-full">
					{#each languages as lang}
						<button
							class="px-3 py-1 rounded-full text-xl"
							class:bg-blue-500={$appSettings.locale === lang.code}
							class:text-white={$appSettings.locale === lang.code}
							on:click={() => handleChangeLocale(lang.code)}
						>
							{lang.emoji}
							{lang.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Reset local storage placed at the bottom so user can scroll to it -->
		<div class="w-full flex justify-center mt-2 mb-2">
			<button class="bg-red-900 text-white px-4 py-1 rounded-full" on:click={resetLocalStorage}>
				{$_('reset_local_storage')}
			</button>
		</div>

		<!-- About section (larger text per request) -->
		<div class="w-full text-center text-gray-300 mt-4 mb-8 px-6">
			<div class="text-white text-2xl mb-2 font-bold">{$_('about_title')}</div>
			<div class="text-base mb-1">
				{$_('about_version')}: {import.meta.env.VITE_APP_VERSION || '0.4.12'}
			</div>
			<div class="text-base mb-1">
				{$_('about_author')}:
				<a
					class="text-blue-400 underline text-base"
					href="https://github.com/Naereen"
					target="_blank"
					rel="noreferrer">Lilian Besson (Naereen)</a
				>
			</div>
			<div class="text-base mb-2">
				{$_('about_license')}:
				<a
					class="text-blue-400 underline text-base"
					href="https://naereen.mit-license.org"
					target="_blank"
					rel="noreferrer">MIT</a
				>
			</div>
			<div class="text-base mb-2">{$_('about_thanks')}</div>
			<div class="flex justify-center gap-4 mt-2">
				<a
					class="text-blue-400 underline text-base"
					href="https://github.com/Naereen/My-Android-app-to-track-life-points-at-Magic-the-Gathering"
					target="_blank"
					rel="noreferrer">{$_('about_github')}</a
				>
				<!-- TODO: Optional links: Play Store direct link -->
				<!-- <a class="text-blue-400 underline text-base" href="#" on:click|preventDefault={() => null}>{ $_('about_playstore') }</a> -->
				<!-- Additional links: Feedback form or feedback email -->
				<a
					class="text-blue-400 underline text-base"
					href="mailto:naereen@crans.org?Subject=Feedback%20for%20Magic%20Life%20Points%20Tracker"
					target="_blank"
					rel="noreferrer">{$_('about_feedback')}</a
				>
			</div>
		</div>
	</div>
</div>
