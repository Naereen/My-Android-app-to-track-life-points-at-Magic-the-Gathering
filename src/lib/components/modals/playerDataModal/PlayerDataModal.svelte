<script lang="ts">
	import Pen from '$lib/assets/icons/Pen.svelte';
	import X from '$lib/assets/icons/X.svelte';
	import { playerModalData, resetPlayerModalData } from '$lib/store/modal';
	import {
		COMMANDER_DAMAGE_SOURCE_SLOTS,
		getCommandTaxBySourceForPlayer,
		getCommanderDamageSourceValue,
		isPartnerModeEnabledForPlayer,
		players,
		setPlayerColor,
		setPlayerAllowNegative,
		setPlayerPartnerMode,
		setPlayerCommandTax,
		setPlayerStatusBoolean,
		setPlayerStatusNumeric,
		setPlayerPoison,
		setCommanderDamage
	} from '$lib/store/player';
	import StatusSkull from '$lib/assets/icons/StatusSkull.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import DayNight from '$lib/assets/icons/DayNight.svelte';
	import Storied from '$lib/assets/icons/Storied.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
	import Acorn from '$lib/assets/icons/Acorn.svelte';
	import Ticket from '$lib/assets/icons/Ticket.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import Minimap, { getBackgroundViewerRotationInCommanderDamage, getSeatOrientations } from '$lib/components/player/Minimap.svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import { playCommanderDamageBurst } from '$lib/utils/gameplaySound';
	import { _ } from 'svelte-i18n';
	import { appSettings } from '$lib/store/appSettings';
	import { vibrate } from '$lib/utils/haptics';
	import { onDestroy, onMount } from 'svelte';

	type CommanderMinimapBurstState = {
		playerId: number;
		fromPlayerId: number;
		sourceIndex: number;
		deltaTotal: number;
		hitCount: number;
		timer: ReturnType<typeof setTimeout> | null;
	};
	let selectedColors: string[] = [];
	let mode: 'background' | 'commander' | 'status_effects' = 'status_effects';
	let searchQuery = '';
	let searchEdited = false;
	let searchResults: Array<{
		id: string;
		name: string;
		set_name?: string;
		artist?: string;
		cardImage?: string | null | undefined;
		image?: string | null | undefined;
	}> = [];
	let isSearching = false;
	let hasSearched = false;

	// search mode: false = cards (Scryfall), true = GIFs (Klipy)
	let gifMode = false;
	// By default hide the gradient controls (title visible but not bold)
	let searchOptionActive = true;
	let klipyKeyPresent = false;

	/**
	 * Detects whether a Klipy API key is available (env or local key file).
	 * Used to decide if GIF search mode can be exposed meaningfully.
	 * @returns {unknown} Result produced by checkKlipyKey.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const checkKlipyKey = async () => {
		// fast check for Vite env
		try {
			// @ts-ignore
			if (import.meta.env && import.meta.env.VITE_KLIPY_API_KEY) {
				klipyKeyPresent = true;
				return;
			}
		} catch {}

		try {
			const resp = await fetch('klipy_api.key', { method: 'GET' });
			if (resp.ok) {
				const txt = (await resp.text()).trim();
				klipyKeyPresent = txt.length > 0;
				return;
			}
		} catch (e) {}

		klipyKeyPresent = false;
	};

	$: if (gifMode) {
		checkKlipyKey();
	}

	let gradientMode = false;
	// allow choosing two images
	let doubleBackground = false;
	let bgSelections: string[] = [];
	let hasModalHistoryEntry = false;
	let isSyncingModalHistory = false;

	/**
	 * Resolves the player currently edited by the modal.
	 * Falls back to array index lookup for compatibility with older seat/id states.
	 * @returns {unknown} Result produced by getModalPlayer.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const getModalPlayer = () => {
		return (
			$players.find((player) => player.id === $playerModalData.playerId) ??
			$players[$playerModalData.playerId - 1]
		);
	};

	/**
	 * Pushes a synthetic history state when modal opens so browser Back closes the modal first.
	 * @returns {unknown} Result produced by pushModalHistoryEntry.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const pushModalHistoryEntry = () => {
		if (typeof window === 'undefined' || hasModalHistoryEntry) return;
		try {
			const currentState =
				window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
			window.history.pushState({ ...currentState, __mtgPlayerModalOpen: true }, '', window.location.href);
			hasModalHistoryEntry = true;
		} catch {
			// ignore
		}
	};

	/**
	 * Closes modal while synchronizing synthetic history entry when needed.
	 * @returns {unknown} Result produced by closePlayerModal.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const closePlayerModal = () => {
		if (typeof window !== 'undefined' && hasModalHistoryEntry && !isSyncingModalHistory) {
			isSyncingModalHistory = true;
			window.history.back();
			return;
		}

		resetPlayerModalData();
	};

	/**
	 * Handles `popstate` to map browser Back events to modal close semantics.
	 * @returns {unknown} Result produced by handleBackNavigation.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleBackNavigation = () => {
		if (!$playerModalData.isOpen) {
			if (isSyncingModalHistory) {
				hasModalHistoryEntry = false;
				isSyncingModalHistory = false;
			}
			return;
		}

		hasModalHistoryEntry = false;
		isSyncingModalHistory = true;
		resetPlayerModalData();
	};

	// Translation for damage from player label
	// $: damageFromPlayerLabel = String($_('damage_from_player'));
	$: enterLifeTotalPlaceholder = String($_('enter_life_total_placeholder'));
	$: setLifeTotalSave = String($_('set_life_total_save'));
	$: setLifeTotalCancel = String($_('set_life_total_cancel'));
	$: setCommanderDamageString = String($_('set_commander_damage'));

	let commanderMinimapLayout: '' | 'two-by-two' | 'one-two-one' = '';
	$: commanderMinimapLayout =
		$appSettings.playerCount === 4
			? $appSettings.fourPlayerLayout === 'matrix'
				? 'two-by-two'
				: 'one-two-one'
			: $appSettings.playerCount === 6
				? $appSettings.sixPlayerLayout === 'two'
					? 'one-two-one'
					: 'two-by-two'
				: '';
	let commanderMinimapScale = 3.5;
	$: commanderMinimapScale =
		$appSettings.playerCount <= 2 ? 5.5  // FIXME: no Minimap for 2 players!
		: $appSettings.playerCount === 3 ? 3.0
		: $appSettings.playerCount === 4 ? 3.0
		: $appSettings.playerCount === 5 ? 3.75
		: $appSettings.playerCount === 6 ? 3.25
		: 2.25;
	let commanderMinimapHeightRem = 25;
	// $: commanderMinimapHeightRem =
	// 	$appSettings.playerCount <= 2 ? 25
	// 	: $appSettings.playerCount === 3 ? 25
	// 	: $appSettings.playerCount === 4 ? 25
	// 	: $appSettings.playerCount === 5 ? 25
	// 	: $appSettings.playerCount === 6 ? 25
	// 	: 25;
	// The commander minimap is rotated around the selected seat so directional cues
	// stay useful even when the modal itself is opened from another player's perspective.
	let commanderMinimapRotation = '0deg';
	$: commanderMinimapRotation = getBackgroundViewerRotationInCommanderDamage(
		($playerModalData?.playerId ?? 1) - 1,
		$appSettings.playerCount,
		commanderMinimapLayout,
		true
	);

	const orientationToModalRotation = (seatOrientation: App.Player.Orientation): string => {
		if (seatOrientation === 'left') return '-90deg';
		if (seatOrientation === 'right') return '90deg';
		if (seatOrientation === 'down') return '180deg';
		return '0deg';
	};

	$: modalSeatOrientations = getSeatOrientations($appSettings.playerCount, commanderMinimapLayout);
	$: modalPlayerOrientation =
		modalSeatOrientations[($playerModalData?.playerId ?? 1) - 1] ?? 'up';
	$: modalPlayer =
		$players.find((player) => player.id === $playerModalData.playerId) ??
		$players[$playerModalData.playerId - 1];
	$: modalPlayerPartnerMode = !!modalPlayer?.statusEffects?.partnerMode;
	const MOBILE_KEYBOARD_THRESHOLD_PX = 150;
	let isMobileKeyboardOpen = false;
	let hasEditableFocusInModal = false;
	let maxRawViewportHeight = 0;
	let maxVisibleViewportHeight = 0;
	const COMMANDER_MINIMAP_SOUND_DEBOUNCE_MS = 900;
	let commanderMinimapSoundBursts = new Map<string, CommanderMinimapBurstState>();

	const isEditableElement = (element: Element | null): element is HTMLElement => {
		return !!element && element instanceof HTMLElement && (
			element instanceof HTMLInputElement ||
			element instanceof HTMLTextAreaElement ||
			element.isContentEditable
		);
	};

	/**
	 * Help for getVisibleViewportHeight.
	 * This function returns the height of the visible viewport, taking into account the virtual keyboard on mobile devices.
	 * It uses the Visual Viewport API if available, otherwise it falls back to window.innerHeight.
	 *
	 * @returns {number} The height of the visible viewport in pixels.
	*/
	const getVisibleViewportHeight = () => {
		if (typeof window === 'undefined') return 0;
		const viewport = window.visualViewport;
		return viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
	};

	/**
	 * Tracks virtual keyboard open/closed state for rotated modal ergonomics on mobile.
	 * @returns {unknown} Result produced by updateMobileKeyboardState.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const updateMobileKeyboardState = () => {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const viewport = window.visualViewport;
		const rawViewportHeight = viewport ? viewport.height : window.innerHeight;
		const visibleViewportHeight = getVisibleViewportHeight();
		if (rawViewportHeight > maxRawViewportHeight) {
			maxRawViewportHeight = rawViewportHeight;
		}
		if (visibleViewportHeight > maxVisibleViewportHeight) {
			maxVisibleViewportHeight = visibleViewportHeight;
		}

		const activeElement = document.activeElement;
		hasEditableFocusInModal =
			isEditableElement(activeElement) && !!playerModalScrollEl?.contains(activeElement);

		// The neutral rotation fallback only applies when a focused editable element is
		// actually inside this modal; otherwise preserve the seat-specific orientation.
		if (!hasEditableFocusInModal) {
			isMobileKeyboardOpen = false;
			return;
		}

		const heightDropFromRaw = maxRawViewportHeight - rawViewportHeight;
		const heightDropFromVisible = maxVisibleViewportHeight - visibleViewportHeight;
		isMobileKeyboardOpen =
			heightDropFromRaw > MOBILE_KEYBOARD_THRESHOLD_PX ||
			heightDropFromVisible > MOBILE_KEYBOARD_THRESHOLD_PX;
	};

	/**
	 * Reacts to viewport/focus changes and recomputes keyboard visibility state.
	 * @returns {unknown} Result produced by handleViewportKeyboardChange.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleViewportKeyboardChange = () => {
		updateMobileKeyboardState();
	};

	$: shouldNeutralizeModalRotation =
		$playerModalData?.isOpen &&
		modalPlayerOrientation !== 'up' &&
		(isMobileKeyboardOpen || (mode === 'commander' && editingCommanderFrom !== null && hasEditableFocusInModal));
	$: modalRotation = shouldNeutralizeModalRotation
		? '0deg'
		: orientationToModalRotation(modalPlayerOrientation);
	$: isQuarterTurnModal = modalRotation === '90deg' || modalRotation === '-90deg';
	$: modalPanelStyle = `transform: rotate(${modalRotation}); transform-origin: center center; width: ${isQuarterTurnModal ? 'min(75vh, 44rem)' : '80%'}; max-width: ${isQuarterTurnModal ? '84vh' : '48rem'}; max-height: ${isQuarterTurnModal ? '78vw' : '90vh'};`;

	let playerModalScrollEl: HTMLDivElement | null = null;
	let lastAutoScrollKey: string | null = null;

	/**
	 * Resolves on next animation frame; used to wait for DOM layout before scrolling.
	 * @returns {unknown} Result produced by waitForAnimationFrame.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const waitForAnimationFrame = () =>
		new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

	/**
	 * Auto-scrolls commander view to the bottom-right area for side-oriented players.
	 * @param {HTMLDivElement} scrollElement - Parameter used by scrollPlayerModalToBottomRight.
	 * @returns {unknown} Result produced by scrollPlayerModalToBottomRight.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const scrollPlayerModalToBottomRight = async (scrollElement: HTMLDivElement) => {
		await tick();
		await waitForAnimationFrame();
		await waitForAnimationFrame();

		/**
		 * Performs one immediate scroll pass to the desired corner.
		 * @returns {unknown} Result produced by scrollToBottomRight.
		 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
		 */
		const scrollToBottomRight = () => {
			// This corner anchors the commander damage grid where the player expects it,
			// especially after the minimap has rotated away from the default reading order.
			scrollElement.scrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
			scrollElement.scrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth);
		};

		scrollToBottomRight();
		await waitForAnimationFrame();
		scrollToBottomRight();
	};

	$: {
		const shouldAutoScroll =
			$playerModalData?.isOpen && mode === 'commander' &&
			(modalPlayerOrientation === 'left' || modalPlayerOrientation === 'right');
		const autoScrollKey = shouldAutoScroll
			? `${$playerModalData.playerId}:${modalPlayerOrientation}`
			: null;

		if (playerModalScrollEl && autoScrollKey && autoScrollKey !== lastAutoScrollKey) {
			lastAutoScrollKey = autoScrollKey;
			void scrollPlayerModalToBottomRight(playerModalScrollEl);
		} else if (!autoScrollKey) {
			lastAutoScrollKey = null;
		}
	}

	import { searchCards, randomCards } from '$lib/utils/scryfall';
	import { searchGifs } from '$lib/utils/klipy';
	import { setPlayerBackgroundImage } from '$lib/store/player';
	import { tick } from 'svelte';

	// Track previous player ID to detect actual player changes
	let _prevModalPlayerId: number | null = null;

	// initialize selectedColors when modal/player changes
	$: if ($playerModalData && $players) {
		// Only reset search edit flag when the selected player actually changes,
		// NOT on every $players update (which would clear it on every keystroke/life change).
		if (_prevModalPlayerId !== $playerModalData.playerId) {
			_prevModalPlayerId = $playerModalData.playerId;
			searchEdited = false;
		}
		const p = $players[$playerModalData.playerId - 1];
		if (p && typeof p.color === 'string' && p.color.includes(',')) {
			selectedColors = p.color.split(',').map((s) => s.trim());
		} else if (p && p.color) {
			selectedColors = [p.color];
		} else {
			selectedColors = [];
		}
	}

	// When the modal opens, use any requested mode from the store (for example 'commander')
	$: if ($playerModalData && $playerModalData.isOpen) {
		mode = $playerModalData.mode ?? 'status_effects';
	}

	$: if (!$playerModalData?.isOpen) {
		isMobileKeyboardOpen = false;
		hasEditableFocusInModal = false;
		maxRawViewportHeight = 0;
		maxVisibleViewportHeight = 0;
	}

	// Track if background tab has been initialized for the current player
	let _bgInitPlayerId: number | null = null;

	// Reset background tab init tracking when leaving background mode
	$: if (mode !== 'background') {
		_bgInitPlayerId = null;
	}

	// When entering the 'background' tab, run one-time initialization per player.
	// The init logic is inside a regular function so that searchQuery, searchResults,
	// and bgSelections are NOT reactive dependencies of this $: block.
	// This prevents the block from re-running on every keystroke in the search input.
	$: if (mode === 'background' && $playerModalData && _bgInitPlayerId !== $playerModalData.playerId) {
		_bgInitPlayerId = $playerModalData.playerId;
		_initBackgroundTab();
	}

	/**
	 * Initializes background tab state once per player (not on every reactive update).
	 * @returns {unknown} Result produced by _initBackgroundTab.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	function _initBackgroundTab() {
		const p = getModalPlayer();
		if (!p) return;

		// Prefill the search input with the player's name
		if (p.playerName != '' && (!searchQuery || searchQuery.trim().length === 0) && !searchEdited) {
			searchQuery = p.playerName ?? '';
		}
	}

	// Ensure the already chosen background (if any) is visible in the search results
	// so it appears as "chosen" by default when opening the tab.
	$: if (mode === 'background' && $playerModalData) {
		const p = getModalPlayer();
		if (!p) {
			bgSelections = [];
		} else if (p.backgroundImage) {
			const backgroundImage = p.backgroundImage;
			const already = searchResults.find((r) => {
				return isStoredBackgroundInCandidates(backgroundImage, [r.image, r.cardImage]);
			});
			if (!already) {
				// prepend a synthetic result representing the current chosen background (use first image if array)
				const img = Array.isArray(backgroundImage) ? backgroundImage[0] : backgroundImage;
				searchResults = [
					{
						id: 'current-bg',
						name: `${p.playerName ?? 'Current'}'s background`,
						set_name: p.backgroundSet ?? '',
						artist: p.backgroundArtist ?? '',
						cardImage: img,
						image: img
					},
					...searchResults
				];
			}
		}

		// initialize bgSelections from player data (keep first two if array)
		if (!p) bgSelections = [];
		else if (Array.isArray(p.backgroundImage)) bgSelections = p.backgroundImage.slice(0, 2).filter(Boolean) as string[];
		else if (p.backgroundImage) bgSelections = [p.backgroundImage];
		else bgSelections = [];
	}

	/**
	 * Normalizes image URLs to compare selected backgrounds robustly.
	 * @param {string | null | undefined} url - Parameter used by normalizeImageUrl.
	 * @returns {unknown} Result produced by normalizeImageUrl.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const normalizeImageUrl = (url: string | null | undefined) => {
		if (!url) return null;
		const value = String(url).trim();
		if (!value) return null;

		try {
			const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
			const parsed = new URL(value, base);
			return `${parsed.origin}${parsed.pathname}`;
		} catch {
			return value.split('#')[0].split('?')[0];
		}
	};

	const isStoredBackgroundInCandidates = (
		stored: string | string[] | null | undefined,
		candidates: Array<string | null | undefined>
	) => {
		if (!stored) return false;

		const normalizedCandidates = candidates
			.map((candidate) => normalizeImageUrl(candidate))
			.filter(Boolean) as string[];
		if (normalizedCandidates.length === 0) return false;

		if (Array.isArray(stored)) {
			const normalizedStored = stored.map((entry) => normalizeImageUrl(entry)).filter(Boolean) as string[];
			return normalizedStored.some((entry) => normalizedCandidates.includes(entry));
		}

		const normalizedStored = normalizeImageUrl(stored);
		if (!normalizedStored) return false;
		return normalizedCandidates.includes(normalizedStored);
	};

	/**
	 * Picks preferred selectable preview image from a search result entry.
	 * @param {{ image?: string | null; cardImage?: string | null }} result - Parameter used by getSelectableImage.
	 * @returns {unknown} Result produced by getSelectableImage.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const getSelectableImage = (result: { image?: string | null; cardImage?: string | null }) => {
		return result.image ?? result.cardImage ?? null;
	};

	/**
	 * Applies/updates background color selection, including gradient mode multi-selection.
	 * @param {number} playerId - Parameter used by toggleColorSelection.
	 * @param {string} c - Parameter used by toggleColorSelection.
	 * @returns {unknown} Result produced by toggleColorSelection.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const toggleColorSelection = (playerId: number, c: string) => {
		if (!gradientMode) {
			setPlayerColor(playerId, c);
			// when choosing a color, clear any background image so the color is visible
			setPlayerBackgroundImage(playerId, null);
			return;
		}

		const idx = selectedColors.indexOf(c);
		if (idx === -1) {
			selectedColors = [...selectedColors, c];
		} else {
			selectedColors = selectedColors.filter((x) => x !== c);
		}

		// update store with joined comma-separated list (or single color)
		if (selectedColors.length > 0) {
			setPlayerColor(playerId, selectedColors.join(','));
			// clear any previously selected image when using colors
			setPlayerBackgroundImage(playerId, null);
		} else {
			setPlayerColor(playerId, 'white');
			setPlayerBackgroundImage(playerId, null);
		}
	};

	/**
	 * Clears both color and image background selection for the player.
	 * @param {number} playerId - Parameter used by clearSelection.
	 * @returns {unknown} Result produced by clearSelection.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const clearSelection = (playerId: number) => {
		selectedColors = [];
		setPlayerColor(playerId, 'white');
		// also clear any chosen background image
		setPlayerBackgroundImage(playerId, null);
	};

	/**
	 * Handles keyboard shortcuts and max-length guard on player name input.
	 * @param {KeyboardEvent} event - Parameter used by handleOnKeyPress.
	 * @returns {unknown} Result produced by handleOnKeyPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleOnKeyPress = (event: KeyboardEvent) => {
		// ignore IME composition events (mobile/virtual keyboards)
		if ((event as any).isComposing) return;
		if (event.key === 'Enter') {
			resetPlayerModalData();
		}

		if ($players[$playerModalData.playerId - 1].playerName.length >= 26) {
			$players[$playerModalData.playerId - 1].playerName = $players[
				$playerModalData.playerId - 1
			].playerName.slice(0, 25);
		}
	};

	/**
	 * Runs background search when user presses Enter in search field.
	 * @param {KeyboardEvent} event - Parameter used by handleOnKeyPressScryfallSearch.
	 * @returns {unknown} Result produced by handleOnKeyPressScryfallSearch.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleOnKeyPressScryfallSearch = (event: KeyboardEvent) => {
		// ignore IME composition events which may falsely emit Enter on some mobile keyboards
		if ((event as any).isComposing) return;
		if (event.key === 'Enter') {
			doSearch();
		}
	};

	/**
	 * Executes Scryfall/Klipy search for player background candidates.
	 * @returns {unknown} Result produced by doSearch.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const doSearch = async () => {
		vibrate(20);
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
		if (!searchQuery || searchQuery.trim().length === 0) {
			searchResults = [];
			hasSearched = false;
			return;
		}
		isSearching = true;
		if (gifMode) {
			const gifs = await searchGifs(searchQuery);
			searchResults = gifs.map(g => ({
				id: g.id,
				name: g.title,
				cardImage: g.preview ?? null,
				image: g.url ?? null,
				artist: "Klipy GIF"
			}));
		} else {
			searchResults = await searchCards(searchQuery);
		}
		isSearching = false;
		hasSearched = true;
	};

	/**
	 * Picks and applies one random background from current results or remote source.
	 * @param {number} playerId - Parameter used by chooseRandom.
	 * @returns {unknown} Result produced by chooseRandom.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const chooseRandom = async (playerId: number) => {
		// If we already have search results, pick one from them
		if (searchResults && searchResults.length > 0) {
			const withImage = searchResults.filter((r) => r.image);
			const pool = withImage.length > 0 ? withImage : searchResults;
			const pick = pool[Math.floor(Math.random() * pool.length)];
			chooseBackground(playerId, pick.image ?? null, pick.artist ?? null, pick.set_name ?? null);
			return;
		}

		// Otherwise, fetch a random item depending on mode
		try {
			isSearching = true;
			if (gifMode) {
				const gifs = await searchGifs(searchQuery || 'random');
				if (gifs && gifs.length > 0) {
					const g = gifs[Math.floor(Math.random() * gifs.length)];
					chooseBackground(playerId, g.url ?? null, "Klipy GIF", null);
				}
			} else {
				// use a broad query so the util can return a random art card
				const cards = await randomCards('game:paper');
				if (cards && cards.length > 0) {
					const c = cards[0];
					chooseBackground(playerId, c.image ?? null, c.artist ?? null, c.set_name ?? null);
				}
			}
		} catch (err) {
			console.warn('Failed to fetch random resource', err);
		} finally {
			isSearching = false;
		}
	};

	const chooseBackground = (
		playerId: number,
		imageUrl: string | null,
		artist: string | null = null,
		set_name: string | null = null
	) => {
		vibrate(30);

		if (doubleBackground) {
			// toggle selection in bgSelections
			if (!imageUrl) return;
			const idx = bgSelections.indexOf(imageUrl);
			if (idx === -1) {
				// add up to 2
				if (bgSelections.length < 2) bgSelections = [...bgSelections, imageUrl];
				else bgSelections = [bgSelections[1], imageUrl];
			} else {
				bgSelections = bgSelections.filter((x) => x !== imageUrl);
			}

			// persist array or null
			const payload = bgSelections.length > 0 ? bgSelections.slice(0, 2) : null;
			setPlayerBackgroundImage(playerId, payload);
		} else {
			const player = getModalPlayer();
			const isSameAsCurrentSingle = !!imageUrl && isStoredBackgroundInCandidates(player?.backgroundImage, [imageUrl]);

			if (!imageUrl || isSameAsCurrentSingle) {
				bgSelections = [];
				setPlayerBackgroundImage(playerId, null);
			} else {
				bgSelections = [imageUrl];
				setPlayerBackgroundImage(playerId, { imageUrl, artist, set_name });
			}
		}

		// clear color so background shows clearly
		setPlayerColor(playerId, 'white');
	};

	// Inline editor state for commander damage (replaces native prompt)
	let editingCommanderFrom: number | null = null;
	let editingCommanderValuePrimary = '';
	let editingCommanderValueSecondary = '';
	let commanderSaveHandledByPointer = false;

	const syncCommanderEditorValues = (
		playerId: number,
		fromPlayerId: number,
		focusedSource: 0 | 1 | null = null,
		forceSource: 0 | 1 | null = null
	) => {
		const targetPlayer = $players[playerId - 1];
		const primaryValue = String(getCommanderDamageSourceValue(targetPlayer, fromPlayerId, 0));
		const secondaryValue = String(getCommanderDamageSourceValue(targetPlayer, fromPlayerId, 1));

		if (focusedSource !== 0 || forceSource === 0) {
			editingCommanderValuePrimary = primaryValue;
		}
		if (focusedSource !== 1 || forceSource === 1) {
			editingCommanderValueSecondary = secondaryValue;
		}
	};

	const getFocusedCommanderInputSource = (): 0 | 1 | null => {
		if (typeof document === 'undefined' || editingCommanderFrom === null) return null;
		const active = document.activeElement;
		if (!(active instanceof HTMLInputElement)) return null;

		const primaryId = `commander-input-${editingCommanderFrom}-1`;
		const secondaryId = `commander-input-${editingCommanderFrom}-2`;
		if (active.id === primaryId) return 0;
		if (active.id === secondaryId) return 1;
		return null;
	};

	// Keep editor values aligned with store updates (buttons, long-press, or external updates)
	// while avoiding clobbering the currently focused input.
	$: if (editingCommanderFrom !== null) {
		const focusedSource = getFocusedCommanderInputSource();
		if (focusedSource !== null) {
			syncCommanderEditorValues($playerModalData.playerId, editingCommanderFrom, focusedSource);
		}
	}

	// Inline editor state for numeric status effects (poison, energy, etc.)
	let editingStat: string | null = null;
	let editingStatValue = '';

	/**
	 * Opens inline commander-damage editor for one opposing player slot.
	 * @param {number} playerId - Parameter used by startEditCommander.
	 * @param {number} fromPlayerId - Parameter used by startEditCommander.
	 * @returns {unknown} Result produced by startEditCommander.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const startEditCommander = async (playerId: number, fromPlayerId: number) => {
		vibrate(20);
		editingCommanderFrom = fromPlayerId;
		syncCommanderEditorValues(playerId, fromPlayerId);
		await tick();
		const el = document.getElementById(`commander-input-${fromPlayerId}-1`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	/**
	 * Commits commander-damage editor values to store (including partner second source).
	 * @returns {unknown} Result produced by saveEditCommander.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const saveEditCommander = () => {
		if (editingCommanderFrom === null) return;
		const sourceCount = getCommanderSourceCountForPlayer(editingCommanderFrom);
		const primary = parseInt(editingCommanderValuePrimary, 10);
		const secondary = parseInt(editingCommanderValueSecondary, 10);
		if (!Number.isNaN(primary)) {
			setCommanderDamage($playerModalData.playerId, editingCommanderFrom, primary, 0);
		}
		if (sourceCount > 1 && !Number.isNaN(secondary)) {
			setCommanderDamage($playerModalData.playerId, editingCommanderFrom, secondary, 1);
		} else {
			setCommanderDamage($playerModalData.playerId, editingCommanderFrom, 0, 1);
		}
		editingCommanderFrom = null;
	};

	const handleCommanderSavePointerDown = () => {
		commanderSaveHandledByPointer = true;
		saveEditCommander();
	};

	const handleCommanderSaveClick = () => {
		if (commanderSaveHandledByPointer) {
			commanderSaveHandledByPointer = false;
			return;
		}
		saveEditCommander();
	};

	/**
	 * Cancels inline commander-damage edit mode.
	 * @returns {unknown} Result produced by cancelEditCommander.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const cancelEditCommander = () => {
		editingCommanderFrom = null;
	};

	/**
	 * Opens inline numeric status editor (poison/energy/experience/rad/etc.).
	 * @param {string} stat - Parameter used by startEditStat.
	 * @param {number} current - Parameter used by startEditStat.
	 * @returns {unknown} Result produced by startEditStat.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const startEditStat = async (stat: string, current: number) => {
		vibrate(20);
		editingStat = stat;
		editingStatValue = String(current);
		await tick();
		const el = document.getElementById(`stat-input-${stat}`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	/**
	 * Saves inline numeric status value to the corresponding player field.
	 * @returns {unknown} Result produced by saveEditStat.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const saveEditStat = () => {
		if (!editingStat) return;
		const v = parseInt(editingStatValue, 10);
		if (Number.isNaN(v)) {
			editingStat = null;
			return;
		}
		if (editingStat === 'poison') {
			setPlayerPoison($playerModalData.playerId, Math.max(0, v));
		} else {
			setPlayerStatusNumeric($playerModalData.playerId, editingStat, Math.max(0, v));
		}
		editingStat = null;
	};

	/**
	 * Cancels inline numeric status editing.
	 * @returns {unknown} Result produced by cancelEditStat.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const cancelEditStat = () => {
		editingStat = null;
	};

	// Status maxima used by the UI to hide + buttons when reached
	const POISON_MAX = 10;
	const RING_BEARER_MAX = 4;
	const SPEED_MAX = 4;

	// Commander damage long-press behavior: apply +/-10 every 2s while holding.
	const COMMANDER_LONG_PRESS_MS = 1000;
	let commanderLongPressTimeout: ReturnType<typeof setTimeout> | null = null;
	let commanderLongPressInterval: ReturnType<typeof setInterval> | null = null;
	let commanderLongPressConsumedClick = false;

	const getCommanderDamageValue = (
		playerId: number,
		fromPlayerId: number,
		sourceIndex = 0
	): number => {
		return getCommanderDamageSourceValue($players[playerId - 1], fromPlayerId, sourceIndex, $appSettings.playerCount);
	};

	$: getCommanderSourceCountForPlayer = (playerId: number): number => {
		return isPartnerModeEnabledForPlayer(playerId) ? COMMANDER_DAMAGE_SOURCE_SLOTS : 1;
	};

	$: getCommandTaxSourceValue = (playerId: number, sourceIndex = 0): number => {
		const targetPlayer =
			$players.find((player) => player.id === playerId) ?? $players[playerId - 1];
		const pair = getCommandTaxBySourceForPlayer(targetPlayer);
		const slot = sourceIndex === 1 ? 1 : 0;
		return pair[slot] ?? 0;
	};

	/**
	 * Applies one-step delta to command tax for a specific source slot.
	 * @param {number} playerId - Parameter used by setCommandTaxDelta.
	 * @param {0 | 1} sourceIndex - Parameter used by setCommandTaxDelta.
	 * @param {number} delta - Parameter used by setCommandTaxDelta.
	 * @returns {unknown} Result produced by setCommandTaxDelta.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const setCommandTaxDelta = (playerId: number, sourceIndex: 0 | 1, delta: number) => {
		const nextValue = Math.max(0, getCommandTaxSourceValue(playerId, sourceIndex) + delta);
		setPlayerCommandTax(playerId, nextValue, sourceIndex);
	};

	/**
	 * Toggles partner mode for currently edited player.
	 * @returns {unknown} Result produced by toggleModalPartnerMode.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const toggleModalPartnerMode = () => {
		const currentPartnerMode = modalPlayerPartnerMode;
		setPlayerPartnerMode($playerModalData.playerId, !currentPartnerMode);
	};

	const buildCommanderMinimapSoundBurstKey = (
		playerId: number,
		fromPlayerId: number,
		sourceIndex: number
	) => `${playerId}:${fromPlayerId}:${sourceIndex === 1 ? 1 : 0}`;

	const flushCommanderMinimapSoundBurst = (key: string) => {
		const burst = commanderMinimapSoundBursts.get(key);
		if (!burst) return;

		if (burst.timer) {
			clearTimeout(burst.timer);
		}
		commanderMinimapSoundBursts.delete(key);

		if (burst.deltaTotal === 0) return;

		playCommanderDamageBurst(Math.abs(burst.deltaTotal), burst.deltaTotal > 0 ? 'down' : 'up');
	};

	const queueCommanderMinimapBurstSound = (
		playerId: number,
		fromPlayerId: number,
		delta: number,
		sourceIndex: number
	) => {
		const normalizedSourceIndex = sourceIndex === 1 ? 1 : 0;
		const key = buildCommanderMinimapSoundBurstKey(playerId, fromPlayerId, normalizedSourceIndex);
		const existing = commanderMinimapSoundBursts.get(key);
		const next: CommanderMinimapBurstState = existing
			? {
					...existing,
					deltaTotal: existing.deltaTotal + delta,
					hitCount: existing.hitCount + Math.abs(delta)
				}
			: {
					playerId,
					fromPlayerId,
					sourceIndex: normalizedSourceIndex,
					deltaTotal: delta,
					hitCount: Math.abs(delta),
					timer: null
				};

		if (next.timer) {
			clearTimeout(next.timer);
		}

		next.timer = setTimeout(() => {
			flushCommanderMinimapSoundBurst(key);
		}, COMMANDER_MINIMAP_SOUND_DEBOUNCE_MS);

		commanderMinimapSoundBursts.set(key, next);
	};

	const flushAllCommanderMinimapSoundBursts = () => {
		const keys = Array.from(commanderMinimapSoundBursts.keys());
		for (const key of keys) {
			flushCommanderMinimapSoundBurst(key);
		}
	};

	const setCommanderDamageDelta = (
		playerId: number,
		fromPlayerId: number,
		delta: number,
		sourceIndex = 0,
		options?: {
			playSound?: boolean;
		}
	) => {
		const current = getCommanderDamageValue(playerId, fromPlayerId, sourceIndex);
		const nextValue = Math.max(0, current + delta);
		setCommanderDamage(playerId, fromPlayerId, nextValue, sourceIndex, {
			playSound: options?.playSound !== false
		});

		// Keep editor inputs strictly aligned with store updates after button presses,
		// including when one of the inputs is currently focused.
		if (editingCommanderFrom === fromPlayerId && playerId === $playerModalData.playerId) {
			const normalizedSource = sourceIndex === 1 ? 1 : 0;
			syncCommanderEditorValues(playerId, fromPlayerId, null, normalizedSource);
		}
	};

	const startCommanderLongPress = (
		playerId: number,
		fromPlayerId: number,
		delta: number,
		sourceIndex = 0
	) => {
		stopCommanderLongPress();
		commanderLongPressTimeout = setTimeout(() => {
			commanderLongPressConsumedClick = true;
			setCommanderDamageDelta(playerId, fromPlayerId, delta, sourceIndex);
			commanderLongPressInterval = setInterval(() => {
				setCommanderDamageDelta(playerId, fromPlayerId, delta, sourceIndex);
			}, COMMANDER_LONG_PRESS_MS);
		}, COMMANDER_LONG_PRESS_MS);
	};

	/**
	 * Stops commander long-press acceleration timers and clears consumed-click guard.
	 * @returns {unknown} Result produced by stopCommanderLongPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const stopCommanderLongPress = () => {
		if (commanderLongPressTimeout) {
			clearTimeout(commanderLongPressTimeout);
			commanderLongPressTimeout = null;
		}
		if (commanderLongPressInterval) {
			clearInterval(commanderLongPressInterval);
			commanderLongPressInterval = null;
		}
		if (commanderLongPressConsumedClick) {
			setTimeout(() => {
				commanderLongPressConsumedClick = false;
			}, 0);
		}
	};

	const handleCommanderStepClick = (
		playerId: number,
		fromPlayerId: number,
		step: number,
		sourceIndex = 0
	) => {
		if (commanderLongPressConsumedClick) {
			commanderLongPressConsumedClick = false;
			return;
		}
		setCommanderDamageDelta(playerId, fromPlayerId, step, sourceIndex);
	};

	/**
	 * Opens commander editor from minimap seat interaction.
	 * @param {number} targetIndex - Parameter used by startCommanderEditFromMinimap.
	 * @returns {unknown} Result produced by startCommanderEditFromMinimap.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const startCommanderEditFromMinimap = (targetIndex: number) => {
		const fromPlayerId = targetIndex + 1;
		startEditCommander($playerModalData.playerId, fromPlayerId);
	};

	/**
	 * Increments commander damage (+1) for selected minimap attacker.
	 * @param {number} targetIndex - Parameter used by incrementCommanderFromMinimap.
	 * @returns {unknown} Result produced by incrementCommanderFromMinimap.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const incrementCommanderFromMinimap = (targetIndex: number) => {
		const fromPlayerId = targetIndex + 1;
		setCommanderDamageDelta($playerModalData.playerId, fromPlayerId, 1, 0, { playSound: false });
		queueCommanderMinimapBurstSound($playerModalData.playerId, fromPlayerId, 1, 0);
	};

	/**
	 * Increments commander damage by side/source in partner split mode.
	 * @param {number} targetIndex - Parameter used by incrementCommanderFromMinimapByHalf.
	 * @param {'left' | 'right'} side - Parameter used by incrementCommanderFromMinimapByHalf.
	 * @returns {unknown} Result produced by incrementCommanderFromMinimapByHalf.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const incrementCommanderFromMinimapByHalf = (targetIndex: number, side: 'left' | 'right') => {
		const fromPlayerId = targetIndex + 1;
		if (getCommanderSourceCountForPlayer(fromPlayerId) <= 1) {
			setCommanderDamageDelta($playerModalData.playerId, fromPlayerId, 1, 0, { playSound: false });
			queueCommanderMinimapBurstSound($playerModalData.playerId, fromPlayerId, 1, 0);
			return;
		}

		const sourceIndex = side === 'right' ? 1 : 0;
		setCommanderDamageDelta($playerModalData.playerId, fromPlayerId, 1, sourceIndex, {
			playSound: false
		});
		queueCommanderMinimapBurstSound($playerModalData.playerId, fromPlayerId, 1, sourceIndex);
	};

	onMount(() => {
		const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
		window.addEventListener('popstate', handleBackNavigation);
		window.addEventListener('focusin', handleViewportKeyboardChange);
		window.addEventListener('focusout', handleViewportKeyboardChange);
		window.addEventListener('resize', handleViewportKeyboardChange);
		viewport?.addEventListener('resize', handleViewportKeyboardChange);
		viewport?.addEventListener('scroll', handleViewportKeyboardChange);
		updateMobileKeyboardState();
		pushModalHistoryEntry();
	});

	onDestroy(() => {
		const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
		flushAllCommanderMinimapSoundBursts();
		window.removeEventListener('popstate', handleBackNavigation);
		window.removeEventListener('focusin', handleViewportKeyboardChange);
		window.removeEventListener('focusout', handleViewportKeyboardChange);
		window.removeEventListener('resize', handleViewportKeyboardChange);
		viewport?.removeEventListener('resize', handleViewportKeyboardChange);
		viewport?.removeEventListener('scroll', handleViewportKeyboardChange);
		if (isSyncingModalHistory) {
			isSyncingModalHistory = false;
		}
		hasModalHistoryEntry = false;
	});
</script>

<div
	class="bg-black/70 fixed inset-0 flex justify-center items-center flex-col"
	on:click={closePlayerModal}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation
		bind:this={playerModalScrollEl}
		class="bg-[#d8e5f7] max-w-3xl w-11/12 max-h-[85vh] opacity-100 rounded-[1.5rem] flex justify-center items-start text-black p-4 relative mt-4 overflow-auto"
		style={modalPanelStyle}
		role="button"
		on:keydown={() => null}
		tabindex="0"
	>
		<div class="flex flex-col justify-center">
			<div class="flex flex-col justify-center items-center sticky top-0 bg-[#d8e5f7] z-10 pb-0">
				<h2 class="text-2xl font-semibold my-2 relative w-full text-center">
					<!--
						{$_('customize_player')}
						#{$playerModalData.playerId}
					-->
					<!-- {#if $appSettings.playerCount !== 2}
						<span class="inline-flex items-center" title="Commander Damage">
							<CommanderDamage playerIndex={$playerModalData.playerId - 1} />
						</span>
					{/if} -->
					<button
						on:click={closePlayerModal}
						on:contextmenu|preventDefault
						draggable="false"
						class="absolute right-0 -top-2"
					>
						<X />
					</button>
				</h2>
				<div class="relative">
					<span class="font-bold">
						#{$playerModalData.playerId}
					</span>
					<input
						type="text"
						class="beleren py-2 px-3 rounded-lg outline outline-1 outline-black text-black font-semibold bg-[#f1f6fe]"
						bind:value={$players[$playerModalData.playerId - 1].playerName}
						on:keypress={handleOnKeyPress}
						maxlength="25"
					/>
					<div class="absolute right-3 top-3 flex items-center gap-2">
						<div class="pointer-events-none"><Pen /></div>
						<button
							type="button"
							on:click={() => players.update(ps => { ps[$playerModalData.playerId - 1].playerName = ''; return ps; })}
							class="ml-2 px-2 py-1 bg-gray-200 text-black rounded text-sm"
							title="Effacer le nom"
							aria-label="Effacer le nom"
						>
							✕
						</button>
					</div>
				</div>
				<div class="mt-2 flex flex-col justify-center items-center px-2 sm:px-3">
						<div class="w-full flex justify-center gap-1 mb-0">
							<button
								class="px-1 py-1 rounded-full border"
								on:click={() => (mode = 'background')}
								class:underline={mode === 'background'}
								class:font-bold={mode === 'background'}>{$_('open_customize_backgrounds')}</button
							>
							<button
								class="px-1 py-1 rounded-full border"
								on:click={() => (mode = 'status_effects')}
								class:underline={mode === 'status_effects'}
								class:font-bold={mode === 'status_effects'}>{$_('status_effects')}</button
							>
							{#if $appSettings.playerCount !== 2}
								<button
									class="px-1 py-1 rounded-full border"
									on:click={() => (mode = 'commander')}
									class:underline={mode === 'commander'}
									class:font-bold={mode === 'commander'}>{$_('commander_damage_short')}</button
								>
							{/if}
						</div>

					{#if mode === 'background'}
					{#if hasSearched || searchOptionActive}
						<div class="w-8/10 mb-3">
							<div class="gap-4">
								<div class="relative w-full">
									<input
										type="text"
										class="flex-1 py-2 px-3 rounded-lg outline outline-1 outline-black w-full"
										bind:value={searchQuery}
										on:input={() => (searchEdited = true)}
										on:keypress={handleOnKeyPressScryfallSearch}
										placeholder={$_('scryfall_search') + ' (Scryfall)...'}
									/>
									<div class="absolute right-3 top-2 flex items-center">
										<button
											type="button"
											on:click={() => { searchQuery = ''; searchEdited = true; }}
											class="ml-2 px-2 py-1 bg-gray-200 text-black rounded text-sm"
											title="Effacer la recherche"
											aria-label="Effacer la recherche"
										>
											✕
										</button>
									</div>
								</div>
								<button
									class="px-3 py-2 mt-2 bg-blue-500 text-white text-sm rounded-lg"
									on:click={doSearch}
									disabled={isSearching || (gifMode && !klipyKeyPresent)}
									>{isSearching ? $_('scryfall_searching') : gifMode ? $_('klipy_search') : $_('scryfall_search')}</button
								>
								<button
									class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg"
									on:click={() => chooseRandom($playerModalData.playerId)}
									disabled={isSearching || (gifMode && !klipyKeyPresent)}>{gifMode ? $_('klipy_search_choose_random') : $_('scryfall_search_choose_random')}</button
								>
								<button
									class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg"
									on:click={() => { hasSearched = false; searchOptionActive = false; bgSelections = []; setPlayerBackgroundImage($playerModalData.playerId, null); }}
									>{$_('clear_background')}</button
								>
							</div>
							<div class="mt-2">
								<label class="flex items-center gap-2 text-sm">
									<input type="checkbox" bind:checked={doubleBackground} /> {$_('double_background_mode') ?? 'Double background (choose up to 2)'}
								</label>
							</div>
						</div>
						{/if}
						<div class="w-full max-h-60 overflow-auto">
							{#if gifMode && !klipyKeyPresent}
								<div class="text-sm text-red-600">
									No Klipy API key found. Create `static/klipy_api.key` with your key, or set `VITE_KLIPY_API_KEY` in your environment.
									<!-- FIXME: translate this message! -->
								</div>
							{:else}
								{#if searchResults.length === 0}
									<div class="text-sm text-gray-500">{$_('scryfall_search_noresult')}</div>
								{/if}
							{/if}
							{#each searchResults as r (r.id + '|' + (getSelectableImage(r) ?? 'no-image'))}
								{@const imgSelected = isStoredBackgroundInCandidates(bgSelections, [r.image, r.cardImage])}
								<div class="flex gap-2 mb-3 p-2 border rounded-lg bg-white">
									<div class="flex-1 text-left">
										<div class="font-semibold text-xl">{r.name}</div>
										<div class="text-sm text-gray-600">Set: {r.set_name}</div>
										<div class="text-sm text-gray-600">Artist: {r.artist}</div>
										<div class="text-sm text-gray-600">© Wizards of the Coast</div>
										<div class="mt-2">
											<button
												class="px-3 py-1 text-white text-sm rounded"
												class:bg-gray-500={imgSelected}
												class:bg-green-600={!imgSelected}
												on:click={() => { const img = getSelectableImage(r); if (img) chooseBackground($playerModalData.playerId, img, r.artist ?? null, r.set_name ?? null); }}
											>
												{imgSelected ? $_('scryfall_search_chosen') : $_('scryfall_search_choose')}
											</button>
										</div>
									</div>
									<div class="w-32 flex-shrink-0">
										{#if r.cardImage || r.image}
											<img src={r.cardImage ?? r.image} alt={r.name} class="w-full h-auto object-cover" />
										{:else}
											<div class="w-full h-40 bg-gray-200 flex items-center justify-center text-sm">
												No image
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
						{#if doubleBackground && bgSelections.length > 0}
							<div class="mt-3 flex gap-2 items-center">
								<label class="font-semibold">{$_('selected_backgrounds') ?? 'Selected backgrounds:'}</label>
								{#each bgSelections as s, i}
									<div class="w-20 h-28 border rounded overflow-hidden relative">
										{#if s}
											<img src={s} alt={`bg-${i}`} class="w-full h-full object-cover" />
										{/if}
										<button class="absolute top-1 right-1 bg-black/50 text-white rounded px-1 text-xs" on:click={() => { bgSelections = bgSelections.filter((x) => x !== s); setPlayerBackgroundImage($playerModalData.playerId, bgSelections.length ? bgSelections : null); }}>{$_('remove_button') ?? 'Remove'}</button>
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Always show the Gradient title; only hide the controls when a search option is active or search has happened -->
					{#if mode === 'background'}

					<!-- {#if searchOptionActive} -->
						<div class="mt-2 flex gap-2 items-center">
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => { gifMode = false; searchOptionActive = true; }}
								class:font-bold={(searchOptionActive || hasSearched) && !gifMode}
							>
								{$_('scryfall_search')}
							</button>
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => { gifMode = true; searchOptionActive = true; }}
								class:font-bold={(searchOptionActive || hasSearched) && gifMode}
							>
								GIFs
							</button>
						</div>
					<!-- {/if} -->

						<label
							class="block mb-2 rounded-full border"
							class:font-semibold={!searchOptionActive && !hasSearched}
							role="button"
							tabindex="0"
							on:click={() => {
								// show gradient controls, hide search/GIF options and clear previous search
								searchOptionActive = false;
								hasSearched = false;
								gifMode = false;
								searchQuery = '';
								searchResults = [];
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									searchOptionActive = false;
									hasSearched = false;
									gifMode = false;
									searchQuery = '';
									searchResults = [];
								}
							}}
						>{ $_('player_background_color') }</label>

						{#if !hasSearched && !searchOptionActive}
							<div class="flex items-center gap-3 mb-2">
								<label class="flex items-center gap-2 text-sm"
									><input type="checkbox" bind:checked={gradientMode} /> {$_('gradient_mode')}</label
								>
								<button
									on:click={() => clearSelection($playerModalData.playerId)}
									class="ml-2 text-sm underline">{$_('clear_gradient')}</button
								>
							</div>
							<div class="flex flex-wrap justify-center items-center gap-3 m-auto">
								{#each ['white', 'blue', 'black', 'red', 'green', 'mud'] as c}
									<button
										on:click={() => toggleColorSelection($playerModalData.playerId, c)}
										class="w-8 h-8 rounded-square rounded-lg border-2 relative"
										style="background: {colorToBg(c)}"
										aria-label={c}
									>
										{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
											<span
												class="block w-full h-full rounded-square rounded-lg"
												style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"
											></span>
										{/if}
										{#if selectedColors.indexOf(c) !== -1}
											<span
												class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
												>{selectedColors.indexOf(c) + 1}</span
											>
										{/if}
									</button>
								{/each}
								<div class="-h-1" />
								<hr class="w-full" />
								{#each ['metalicgray', 'gold', 'purple', 'pink', 'orange', 'lightgreen'] as c}
									<button
										on:click={() => toggleColorSelection($playerModalData.playerId, c)}
										class="w-8 h-8 rounded-square rounded-lg border-2 relative"
										style="background: {colorToBg(c)}"
										aria-label={c}
									>
										{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
											<span
												class="block w-full h-full rounded-square rounded-lg"
												style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"
											></span>
										{/if}
										{#if selectedColors.indexOf(c) !== -1}
											<span
												class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
												>{selectedColors.indexOf(c) + 1}</span
											>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					{/if}

					{#if mode === 'status_effects'}
						<!-- Status effects controls -->
						<div class="mt-1 w-[95%] flex flex-col items-center text-center text-base">
							<div class="grid grid-cols-2 gap-1 m-1 justify-left">
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.monarch ??
											false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'monarch',
												!($players[$playerModalData.playerId - 1].statusEffects?.monarch ?? false)
											)}
									/>
									<Crown />
									{String($_('monarch'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.initiative ??
											false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'initiative',
												!(
													$players[$playerModalData.playerId - 1].statusEffects?.initiative ?? false
												)
											)}
									/>
									<Initiative />
									{String($_('initiative'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.ascend ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'ascend',
												!($players[$playerModalData.playerId - 1].statusEffects?.ascend ?? false)
											)}
									/>
									<Ascend />
									{String($_('ascend'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.storied ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'storied',
												!($players[$playerModalData.playerId - 1].statusEffects?.storied ?? false)
											)}
									/>
									<Storied />
									{String($_('storied'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.ko ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'ko',
												!($players[$playerModalData.playerId - 1].statusEffects?.ko ?? false)
											)}
									/>
									<StatusSkull />
									{String($_('ko'))}</label
								>
								<label class="flex items-center gap-1"
									title={$_('tooltip_status_day_night') ?? 'Activate Day / Night Cycle'}
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.dayNight ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'dayNight',
												!($players[$playerModalData.playerId - 1].statusEffects?.dayNight ?? false)
											)}
									/>
									<DayNight />
									{String($_('day_night'))}
								</label>
								<label class="flex items-center gap-1"
									title={$_('partner_mode_help') ?? 'Activate two sources of Commander Damage for this player.'}
								>
									<input
										type="checkbox"
										checked={modalPlayerPartnerMode}
										on:change={toggleModalPartnerMode}
									/>
									<span>{$_('partner_mode_label') ?? 'Mode Partner (Commandant)'}</span>
								</label>
							</div>

							<div class="w-full grid grid-cols-1 items-center text-center border-t pt-4">
								{#if modalPlayerPartnerMode}
									<div class="flex items-center gap-2">
										<span class="w-60 text-left"><CommandTax /> {String($_('command_tax'))} #1/2</span>
										{#if getCommandTaxSourceValue($playerModalData.playerId, 0) > 0}
											<button
												class="px-2 py-1 bg-gray-200 rounded"
												on:click={() => setCommandTaxDelta($playerModalData.playerId, 0, -1)}>-</button>
										{/if}
											<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={getCommandTaxSourceValue($playerModalData.playerId, 0) > 0}
												>{getCommandTaxSourceValue($playerModalData.playerId, 0)}</span
											>
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() => setCommandTaxDelta($playerModalData.playerId, 0, 1)}>+</button>
									</div>
									<div class="flex items-center gap-2">
										<span class="w-60 text-left"><CommandTax /> {String($_('command_tax'))} #2/2</span>
										{#if getCommandTaxSourceValue($playerModalData.playerId, 1) > 0}
											<button
												class="px-2 py-1 bg-gray-200 rounded"
												on:click={() => setCommandTaxDelta($playerModalData.playerId, 1, -1)}>-</button>
										{/if}
											<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={getCommandTaxSourceValue($playerModalData.playerId, 1) > 0}
												>{getCommandTaxSourceValue($playerModalData.playerId, 1)}</span
											>
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() => setCommandTaxDelta($playerModalData.playerId, 1, 1)}>+</button>
									</div>
								{:else}
									<div class="flex items-center gap-2">
										<span class="w-60 text-left"><CommandTax /> {String($_('command_tax'))}</span>
										{#if getCommandTaxSourceValue($playerModalData.playerId, 0) > 0}
											<button
												class="px-2 py-1 bg-gray-200 rounded"
												on:click={() => setCommandTaxDelta($playerModalData.playerId, 0, -1)}>-</button>
										{/if}
											<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={getCommandTaxSourceValue($playerModalData.playerId, 0) > 0}
												>{getCommandTaxSourceValue($playerModalData.playerId, 0)}</span
											>
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() => setCommandTaxDelta($playerModalData.playerId, 0, 1)}>+</button>
									</div>
								{/if}
								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><PoisonIcon /> {String($_('poison'))}</span>
									{#if ($players[$playerModalData.playerId - 1].poison ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerPoison(
													$playerModalData.playerId,
													Math.max(0, ($players[$playerModalData.playerId - 1].poison ?? 0) - 1)
													)}>-</button>
									{/if}
									<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].poison ?? 0) > 0}>{$players[$playerModalData.playerId - 1].poison ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].poison ?? 0) < POISON_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerPoison(
													$playerModalData.playerId,
													Math.min(99, ($players[$playerModalData.playerId - 1].poison ?? 0) + 1)
												)}>+</button>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Energy /> {String($_('energy'))}</span
									>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'energy',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'energy'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-energy"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) > 0} on:dblclick={() => startEditStat('energy', $players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'energy',
												($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) + 1
												)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Experience /> {String($_('experience'))}</span
									>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'experience',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) -
															1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'experience'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-experience"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) > 0} on:dblclick={() => startEditStat('experience', $players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'experience',
												($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) + 1
												)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Rad /> {String($_('rad'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'rad',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'rad'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-rad"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) > 0} on:dblclick={() => startEditStat('rad', $players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'rad',
												($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) + 1
											)}>+</button>
								</div>

								{#if $appSettings.enableAcornMode}
								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Acorn /> {String($_('acorn'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'acorn',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'acorn'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-acorn"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) > 0} on:dblclick={() => startEditStat('acorn', $players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'acorn',
												($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) + 1
											)}>+</button>
								</div>
								{/if}

								{#if $appSettings.enableTicketMode}
								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Ticket /> {String($_('ticket'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ticket',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'ticket'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-ticket"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) > 0} on:dblclick={() => startEditStat('ticket', $players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'ticket',
												($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) + 1
											)}>+</button>
								</div>
								{/if}

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><TheRingerBearer isMax={$players[$playerModalData.playerId - 1].statusEffects?.ringBearer === 4} /> {String($_('ring_bearer'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ringBearer',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) -
															1
													)
												)}>-</button>
									{/if}
									<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) > 0}>{$players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) < RING_BEARER_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ringBearer',
													Math.min(
														4,
														($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) +
															1
													)
												)}>+</button>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><StartYourEngineSpeed isMax={$players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed === 4} /> {String($_('start_your_engine_speed'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'startYourEngineSpeed',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects
															?.startYourEngineSpeed ?? 0) - 1
													)
												)}>-</button>
									{/if}
									<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" class:font-bold={($players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0) > 0}>{$players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0) < SPEED_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'startYourEngineSpeed',
													Math.min(
														4,
														($players[$playerModalData.playerId - 1].statusEffects
															?.startYourEngineSpeed ?? 0) + 1
													)
												)}>+</button>
									{/if}
								</div>
							</div>

						<!-- Allow negative life toggle placed after color options -->
						<div class="mt-4 w-full flex flex-col items-center text-center">
							<label class="flex items-center gap-2 justify-center"
								><input
									type="checkbox"
									checked={$players[$playerModalData.playerId - 1].allowNegativeLife}
									on:change={() =>
										setPlayerAllowNegative(
											$playerModalData.playerId,
											!$players[$playerModalData.playerId - 1].allowNegativeLife
										)}
								/>
									<span class="ml-1 block text-center">
										{$_('allow_negative_life')}
									</span>
								</label>
								<div class="mt-2 text-xs text-gray-600 text-center">
									{$_('allow_negative_life_help')}
								</div>
							</div>
						</div>
					{/if}

					{#if mode === 'commander' && $appSettings.playerCount > 2}
						<!-- Commander Damage Section (now its own tab) -->
						<div class="mt-2 flex flex-col items-center justify-center text-center border-t pt-2 pb-[-2] mb-[-2]">
							<div class="flex items-center justify-center overflow-visible" style={`min-height: ${commanderMinimapHeightRem}rem; transform: rotate(${commanderMinimapRotation}); transform-origin: center;`}>
								<div class="origin-center" style={`transform: scale(${commanderMinimapScale}); transform-origin: center;`}>
									<Minimap
										playerIndex={$playerModalData.playerId - 1}
										fromPlayerDataModal={true}
										orientation={getSeatOrientations($appSettings.playerCount, commanderMinimapLayout)[$playerModalData.playerId - 1]}
										layout={commanderMinimapLayout}
										backgroundClass="bg-transparent"
										commanderDamageIndicator="sum"
										rootClickable={false}
										onSeatClick={incrementCommanderFromMinimap}
										onSeatSplitClick={incrementCommanderFromMinimapByHalf}
										onSeatLongPress={startCommanderEditFromMinimap}
										seatLongPressMs={COMMANDER_LONG_PRESS_MS}
									/>
								</div>
							</div>
							{#if editingCommanderFrom !== null}
								{@const editingFrom = editingCommanderFrom}
								{@const editingFromName = $players[editingCommanderFrom - 1]?.playerName ?? `Player ${editingCommanderFrom}`}
								<div class="relative mt-12 mb-2 w-full max-w-xl rounded-lg border border-black/20 bg-white/70 p-3">
									<div class="mb-3 text-xl font-semibold text-center">
										{editingFromName} → {$players[$playerModalData.playerId - 1]?.playerName ?? `Player ${$playerModalData.playerId}`}
										<button
											type="button"
											on:pointerdown|preventDefault={handleCommanderSavePointerDown}
											on:click={handleCommanderSaveClick}
											class="px-2 py-1 bg-green-600 text-white text-sm rounded"
										>{setLifeTotalSave}</button>
										<button type="button" on:click={cancelEditCommander} class="px-2 py-1 bg-gray-500 text-white text-sm rounded">{setLifeTotalCancel}</button>
									</div>
									<div class="flex flex-col items-center justify-center gap-2">
										{#each Array.from({ length: getCommanderSourceCountForPlayer(editingFrom) }) as sourceMarker, sourceIndex}
											<div class="flex flex-wrap items-center justify-center gap-2">
												{#if getCommanderSourceCountForPlayer(editingFrom) >= 2}
												<span class="w-30 text-sm font-semibold text-right">Commander {sourceIndex + 1}</span>
												{/if}
												<button
													class="px-2 py-1 bg-gray-200 rounded"
													on:pointerdown={() =>
														startCommanderLongPress($playerModalData.playerId, editingFrom, -10, sourceIndex)}
													on:pointerup={stopCommanderLongPress}
													on:pointerleave={stopCommanderLongPress}
													on:pointercancel={stopCommanderLongPress}
													on:click={() =>
														handleCommanderStepClick($playerModalData.playerId, editingFrom, -1, sourceIndex)}>-</button
												>
												{#if sourceIndex === 0}
													<input
														id={`commander-input-${editingFrom}-${sourceIndex + 1}`}
														type="number"
														bind:value={editingCommanderValuePrimary}
														on:keydown={(e) => {
															if (e.key === 'Enter') saveEditCommander();
															if (e.key === 'Escape') cancelEditCommander();
														}}
														class="w-24 text-center rounded-md px-2 py-1 border border-black/20"
														placeholder={enterLifeTotalPlaceholder}
														title={setCommanderDamageString}
													/>
												{:else}
													<input
														id={`commander-input-${editingFrom}-${sourceIndex + 1}`}
														type="number"
														bind:value={editingCommanderValueSecondary}
														on:keydown={(e) => {
															if (e.key === 'Enter') saveEditCommander();
															if (e.key === 'Escape') cancelEditCommander();
														}}
														class="w-24 text-center rounded-md px-2 py-1 border border-black/20"
														placeholder={enterLifeTotalPlaceholder}
														title={setCommanderDamageString}
													/>
												{/if}
												<button
													class="px-2 py-1 bg-gray-200 rounded"
													on:pointerdown={() =>
														startCommanderLongPress($playerModalData.playerId, editingFrom, 10, sourceIndex)}
													on:pointerup={stopCommanderLongPress}
													on:pointerleave={stopCommanderLongPress}
													on:pointercancel={stopCommanderLongPress}
													on:click={() =>
														handleCommanderStepClick($playerModalData.playerId, editingFrom, 1, sourceIndex)}>+</button
												>
											</div>
										{/each}
									</div>
								</div>
							{/if}
							<!-- <div class="mt-2 text-sm text-gray-500 mb-1" style="white-space: pre-wrap;">{String($_('commander_damage_help'))}</div> -->
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
