<script lang="ts">
	import { appSettings } from '$lib/store/appSettings';
	import { appState, gameState, toggleIsMenuOpen, type StreamGameState } from '$lib/store/appState';
	import { derived, get } from 'svelte/store';
	import TwoPlayerLayout from '$lib/layouts/TwoPlayerLayout.svelte';
	import ThreePlayerLayout from '$lib/layouts/ThreePlayerLayout.svelte';
	import ThreePlayerLayoutTwo from '$lib/layouts/ThreePlayerLayoutTwo.svelte';
	import FourPlayerLayoutOne from '$lib/layouts/FourPlayerLayoutOne.svelte';
	import FourPlayerLayoutTwo from '$lib/layouts/FourPlayerLayoutTwo.svelte';
	import FivePlayerLayout from '$lib/layouts/FivePlayerLayout.svelte';
	import SixPlayerLayoutOne from '$lib/layouts/SixPlayerLayoutOne.svelte';
	import SixPlayerLayoutTwo from '$lib/layouts/SixPlayerLayoutTwo.svelte';
	import SevenPlayerLayout from '$lib/layouts/SevenPlayerLayout.svelte';
	import EightPlayerLayout from '$lib/layouts/EightPlayerLayout.svelte';
	import EightPlayerLayoutSides from '$lib/layouts/EightPlayerLayoutSides.svelte';
	import {
		playerModalData,
		randomizerModalData,
		confirmModalData,
		historyModalData
	} from '$lib/store/modal';
	import { emblemModalOpen, emblemState } from '$lib/store/emblem';
	import RandomizerModal from '$lib/components/modals/randomizerModal/RandomizerModal.svelte';
	import FirstPlayerTouchSelectionModal from '$lib/components/modals/firstPlayerTouchSelectionModal/FirstPlayerTouchSelectionModal.svelte';
	import PlayerDataModal from '$lib/components/modals/playerDataModal/PlayerDataModal.svelte';
	import ConfirmModal from '$lib/components/modals/confirmModal/ConfirmModal.svelte';
	import EmblemModal from '$lib/components/modals/emblemModal/EmblemModal.svelte';
	import HistoryModal from '$lib/components/modals/historyModal/HistoryModal.svelte';
	import PlanechaseModal from '$lib/components/modals/planechaseModal/PlanechaseModal.svelte';
	import { planechaseState } from '$lib/store/planechase';
	import ArchenemyModal from '$lib/components/modals/archenemyModal/ArchenemyModal.svelte';
	import { archenemyState } from '$lib/store/archenemy';
	import DayNightShowcase from '$lib/components/menu/subcomponents/dayNight/DayNightShowcase.svelte';

	$: innerWidth = 0;
	import { onMount, onDestroy } from 'svelte';

	import '../lib/utils/i18n.js'; // Importation pour initialiser i18n
	import { _ } from 'svelte-i18n'; // i18n language toggle

	import { initWakeLock, setKeepAwake, stopWakeLockManager } from '$lib/utils/wakeLock';

	let unsubscribeAppSettings: (() => void) | null = null;
	let unsubscribeStreamSync: (() => void) | null = null;
	let unsubscribeBackButtonMenuHandler: (() => void) | null = null;
	let streamDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let streamSyncAbortController: AbortController | null = null;
	let lastSentSignature = '';
	let hasMenuHistoryEntry = false;
	let isSyncingMenuHistory = false;

	// This derived store is intentionally minimal: only setting/game fragments needed
	// for relay sync are observed, which avoids accidental network chatter from unrelated UI updates.

	const streamSyncState = derived([appSettings, gameState], ([$appSettings, $gameState]) => ({
		appSettings: $appSettings,
		gameState: $gameState
	}));

	/**
	 * Resolves the relay endpoint used to publish game state updates.
	 * Falls back to the local SvelteKit endpoint when no remote URL is configured.
	 * @param {string} remoteServerUrl Base relay URL from settings (with or without trailing slash).
	 * @returns {string} Absolute relay endpoint or local `/api/stream` path.
	 */
	const getStreamEndpoint = (remoteServerUrl: string) => {
		const trimmedUrl = (remoteServerUrl || '').trim();
		if (!trimmedUrl) return '/api/stream';
		return `${trimmedUrl.replace(/\/$/, '')}/api/stream`;
	};

	/**
	 * Builds a stable signature to detect meaningful stream state changes.
	 * Only fields relevant to remote overlays are included to avoid redundant POSTs.
	 * @param {StreamGameState} state Current aggregated game state snapshot.
	 * @returns {string} JSON signature used by the debounce/deduplication layer.
	 */
	const getGameStateSignature = (state: StreamGameState) => {
		return JSON.stringify({
			playerCount: state.playerCount,
			currentTurn: state.currentTurn,
			names: state.names,
			lifeTotals: state.lifeTotals
		});
	};

	/**
	 * Pushes a synthetic history entry when the side menu opens.
	 * This lets Android/browser Back close the menu first instead of leaving the page.
	 * @returns {void}
	 */
	const pushMenuHistoryEntry = () => {
		if (typeof window === 'undefined' || hasMenuHistoryEntry) return;
		try {
			// We inject a synthetic browser history entry so Android/back gesture closes
			// the in-app menu first, instead of immediately leaving/reloading the app shell.
			const currentState =
				window.history.state && typeof window.history.state === 'object'
					? window.history.state
					: {};
			window.history.pushState({ ...currentState, __mtgMenuOpen: true }, '', window.location.href);
			hasMenuHistoryEntry = true;
		} catch {
			// ignore
		}
	};

	/**
	 * Pops the synthetic menu history entry previously inserted by `pushMenuHistoryEntry`.
	 * Uses a guard flag to distinguish intentional history sync from real user navigation.
	 * @returns {void}
	 */
	const popMenuHistoryEntry = () => {
		if (typeof window === 'undefined' || !hasMenuHistoryEntry) return;
		isSyncingMenuHistory = true;
		window.history.back();
	};

	/**
	 * Handles `popstate` and maps Back behavior to menu state transitions.
	 * If menu is open, closes it; otherwise only clears internal sync flags.
	 * @returns {void}
	 */
	const handleBackNavigation = () => {
		if (!get(appState).isMenuOpen) {
			if (isSyncingMenuHistory) {
				hasMenuHistoryEntry = false;
				isSyncingMenuHistory = false;
			}
			return;
		}

		isSyncingMenuHistory = true;
		hasMenuHistoryEntry = false;
		toggleIsMenuOpen('');
	};

	/**
	 * Attempts to lock the app in portrait mode on supported browsers/WebViews.
	 * Failures are intentionally swallowed because support depends on install/fullscreen context.
	 * @returns {Promise<void>}
	 */
	const lockPortraitOrientation = async () => {
		if (typeof window === 'undefined') return;
		const orientationApi = window.screen?.orientation as
			| ScreenOrientation
			| (ScreenOrientation & { lock?: (orientation: string) => Promise<void> });
		if (!orientationApi?.lock) return;

		try {
			await orientationApi.lock('portrait-primary');
		} catch {
			// Some browsers/WebViews only allow this in installed or fullscreen contexts.
		}
	};

	/**
	 * Sends the latest game snapshot to the configured relay server.
	 * Aborts any in-flight request so only the most recent state is delivered.
	 * @param {string} remoteServerUrl Base relay URL selected in settings.
	 * @param {StreamGameState} payload Serialized game payload consumed by stream clients.
	 * @returns {Promise<void>} Resolves when the request completes or is intentionally aborted.
	 * @throws {Error} Throws on non-OK HTTP responses before being handled by the local catch block.
	 */
	const postStreamUpdate = async (remoteServerUrl: string, payload: StreamGameState) => {
		const endpoint = getStreamEndpoint(remoteServerUrl);

		if (streamSyncAbortController) {
			streamSyncAbortController.abort();
		}

		streamSyncAbortController = new AbortController();

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				signal: streamSyncAbortController.signal
			});

			if (!response.ok) {
				throw new Error(`Stream sync failed with status ${response.status}`);
			}
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				lastSentSignature = '';
				console.error('Stream sync error:', error);
			}
		}
	};

	onMount(() => {
		initWakeLock();
		void lockPortraitOrientation();
		window.addEventListener('popstate', handleBackNavigation);
		// subscribe to appSettings.preventScreenSleep and apply
		unsubscribeAppSettings = appSettings.subscribe((s) => {
			setKeepAwake(!!(s as any).preventScreenSleep);
		});

		unsubscribeBackButtonMenuHandler = appState.subscribe((state) => {
			if (state.isMenuOpen) {
				if (!isSyncingMenuHistory) {
					pushMenuHistoryEntry();
				}
				return;
			}

			if (isSyncingMenuHistory) {
				isSyncingMenuHistory = false;
				return;
			}

			if (hasMenuHistoryEntry) {
				popMenuHistoryEntry();
			}
		});

		unsubscribeStreamSync = streamSyncState.subscribe(({ appSettings, gameState }) => {
			if (!appSettings.isStreamMode) return;
			if (!appSettings.remoteServerUrl?.trim()) return;

			const signature = getGameStateSignature(gameState);
			if (signature === lastSentSignature) return;

			if (streamDebounceTimer) {
				clearTimeout(streamDebounceTimer);
			}

			// Debounce + signature dedupe protects the relay from bursts when multiple stores
			// update during one user gesture (life, turn and history updates can happen together).
			streamDebounceTimer = setTimeout(() => {
				lastSentSignature = signature;
				void postStreamUpdate(appSettings.remoteServerUrl, gameState);
			}, 250);
		});
	});

	onDestroy(() => {
		unsubscribeAppSettings?.();
		unsubscribeStreamSync?.();
		unsubscribeBackButtonMenuHandler?.();
		window.removeEventListener('popstate', handleBackNavigation);
		if (streamDebounceTimer) {
			clearTimeout(streamDebounceTimer);
		}
		streamSyncAbortController?.abort();
		stopWakeLockManager();
	});
</script>

<svelte:window bind:innerWidth />

<div class="w-full bg-black px-1 pt-2 relative" style="max-width: {innerWidth}px;">
	{#if $appSettings.playerCount === 2}
		<TwoPlayerLayout />
	{:else if $appSettings.playerCount === 3}
		{#if $appSettings.threePlayerLayout === 'inverted'}
			<ThreePlayerLayoutTwo />
		{:else}
			<ThreePlayerLayout />
		{/if}
	{:else if $appSettings.playerCount === 4}
		{#if $appSettings.fourPlayerLayout === 'stacked'}
			<FourPlayerLayoutTwo />
		{:else}
			<FourPlayerLayoutOne />
		{/if}
	{:else if $appSettings.playerCount === 5}
		<FivePlayerLayout />
	{:else if $appSettings.playerCount === 6}
		{#if $appSettings.sixPlayerLayout === 'two'}
			<SixPlayerLayoutTwo />
		{:else}
			<SixPlayerLayoutOne />
		{/if}
	{:else if $appSettings.playerCount === 7}
		<SevenPlayerLayout />
	{:else if $appSettings.playerCount === 8}
		{#if $appSettings.eightPlayerLayout === 'sides'}
			<EightPlayerLayoutSides />
		{:else}
			<EightPlayerLayout />
		{/if}
	{/if}
	{#if $randomizerModalData.isOpen}
		<RandomizerModal />
	{/if}
	{#if $playerModalData.isOpen}
		<PlayerDataModal />
	{/if}
	{#if $confirmModalData.isOpen}
		<ConfirmModal />
	{/if}
	{#if $emblemModalOpen && $emblemState.selected}
		<EmblemModal />
	{/if}
	{#if $historyModalData.isOpen}
		<HistoryModal />
	{/if}
	{#if $planechaseState.isOpen}
		<PlanechaseModal />
	{/if}
	{#if $archenemyState.isOpen}
		<ArchenemyModal />
	{/if}
	<DayNightShowcase />
	<FirstPlayerTouchSelectionModal />
</div>
