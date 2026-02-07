<script lang="ts">
	import TwoPlayerLayout from '$lib/layouts/TwoPlayerLayout.svelte';
	import ThreePlayerLayout from '$lib/layouts/ThreePlayerLayout.svelte';
	import { appSettings } from '$lib/store/appSettings';
	import FourPlayerLayoutOne from '$lib/layouts/FourPlayerLayoutOne.svelte';
	import FourPlayerLayoutTwo from '$lib/layouts/FourPlayerLayoutTwo.svelte';
	import FivePlayerLayout from '$lib/layouts/FivePlayerLayout.svelte';
	import SixPlayerLayoutOne from '$lib/layouts/SixPlayerLayoutOne.svelte';
	import { playerModalData, randomizerModalData, confirmModalData } from '$lib/store/modal';
	import RandomizerModal from '$lib/components/modals/randomizerModal/RandomizerModal.svelte';
	import PlayerDataModal from '$lib/components/modals/playerDataModal/PlayerDataModal.svelte';
	import ConfirmModal from '$lib/components/modals/confirmModal/ConfirmModal.svelte';

	$: innerWidth = 0;
	import { onMount, onDestroy } from 'svelte';

	import '../lib/utils/i18n.js'; // Importation pour initialiser i18n
	import { _ } from 'svelte-i18n'; // i18n language toggle

	import { initWakeLock, setKeepAwake, stopWakeLockManager } from '$lib/utils/wakeLock';

	let unsubscribeAppSettings: (() => void) | null = null;

	onMount(() => {
		initWakeLock();
		// subscribe to appSettings.preventScreenSleep and apply
		unsubscribeAppSettings = appSettings.subscribe((s) => {
			setKeepAwake(!!(s as any).preventScreenSleep);
		});
	});

	onDestroy(() => {
		unsubscribeAppSettings?.();
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
		<SixPlayerLayoutOne />
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
</div>
