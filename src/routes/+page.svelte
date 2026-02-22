<script lang="ts">
	import { appSettings } from '$lib/store/appSettings';
	import { gameState, type StreamGameState } from '$lib/store/appState';
	import { derived } from 'svelte/store';
	import TwoPlayerLayout from '$lib/layouts/TwoPlayerLayout.svelte';
	import ThreePlayerLayout from '$lib/layouts/ThreePlayerLayout.svelte';
	import FourPlayerLayoutOne from '$lib/layouts/FourPlayerLayoutOne.svelte';
	import FourPlayerLayoutTwo from '$lib/layouts/FourPlayerLayoutTwo.svelte';
	import FivePlayerLayout from '$lib/layouts/FivePlayerLayout.svelte';
	import SixPlayerLayoutOne from '$lib/layouts/SixPlayerLayoutOne.svelte';
	import SixPlayerLayoutTwo from '$lib/layouts/SixPlayerLayoutTwo.svelte';
	import { playerModalData, randomizerModalData, confirmModalData } from '$lib/store/modal';
	import { emblemModalOpen, emblemState } from '$lib/store/emblem';
	import RandomizerModal from '$lib/components/modals/randomizerModal/RandomizerModal.svelte';
	import PlayerDataModal from '$lib/components/modals/playerDataModal/PlayerDataModal.svelte';
	import ConfirmModal from '$lib/components/modals/confirmModal/ConfirmModal.svelte';
	import EmblemModal from '$lib/components/modals/emblemModal/EmblemModal.svelte';

	$: innerWidth = 0;
	import { onMount, onDestroy } from 'svelte';

	import '../lib/utils/i18n.js'; // Importation pour initialiser i18n
	import { _ } from 'svelte-i18n'; // i18n language toggle

	import { initWakeLock, setKeepAwake, stopWakeLockManager } from '$lib/utils/wakeLock';

	let unsubscribeAppSettings: (() => void) | null = null;
	let unsubscribeStreamSync: (() => void) | null = null;
	let streamDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let streamSyncAbortController: AbortController | null = null;
	let lastSentSignature = '';

	const streamSyncState = derived([appSettings, gameState], ([$appSettings, $gameState]) => ({
		appSettings: $appSettings,
		gameState: $gameState
	}));

	const getStreamEndpoint = (remoteServerUrl: string) => {
		const trimmedUrl = (remoteServerUrl || '').trim();
		if (!trimmedUrl) return '/api/stream';
		return `${trimmedUrl.replace(/\/$/, '')}/api/stream`;
	};

	const getGameStateSignature = (state: StreamGameState) => {
		return JSON.stringify({
			playerCount: state.playerCount,
			currentTurn: state.currentTurn,
			names: state.names,
			lifeTotals: state.lifeTotals
		});
	};

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
		// subscribe to appSettings.preventScreenSleep and apply
		unsubscribeAppSettings = appSettings.subscribe((s) => {
			setKeepAwake(!!(s as any).preventScreenSleep);
		});

		unsubscribeStreamSync = streamSyncState.subscribe(({ appSettings, gameState }) => {
			if (!appSettings.isStreamMode) return;
			if (!appSettings.remoteServerUrl?.trim()) return;

			const signature = getGameStateSignature(gameState);
			if (signature === lastSentSignature) return;

			if (streamDebounceTimer) {
				clearTimeout(streamDebounceTimer);
			}

			streamDebounceTimer = setTimeout(() => {
				lastSentSignature = signature;
				void postStreamUpdate(appSettings.remoteServerUrl, gameState);
			}, 250);
		});
	});

	onDestroy(() => {
		unsubscribeAppSettings?.();
		unsubscribeStreamSync?.();
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
		<ThreePlayerLayout />
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
</div>
