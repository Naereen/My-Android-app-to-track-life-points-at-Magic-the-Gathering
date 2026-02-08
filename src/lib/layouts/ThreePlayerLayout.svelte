<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import touchDrag from '$lib/actions/touchDrag';
	import { appSettings } from '$lib/store/appSettings';
	import { reorderPlayers } from '$lib/store/player';

	// Only enable the touch drag logic on touch-capable devices
	const isTouchDevice = typeof navigator !== 'undefined' && ((navigator as any).maxTouchPoints > 0 || (matchMedia && matchMedia('(pointer:coarse)').matches));

	function computeIndexFromCoords(x: number, y: number, total: number, container: HTMLElement): number {
		const rect = container.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const angle = Math.atan2(y - cy, x - cx); // -PI..PI
		let deg = (angle * 180) / Math.PI; // -180..180
		deg = (deg + 360) % 360;
		const segment = 360 / Math.max(1, total);
		const index = Math.floor((deg + segment / 2) / segment) % total;
		return index;
	}

	function handleDragEndPlayer2(e: any) {
		const total = $appSettings.playerCount;
		const fromIndex = 2 - 1;
		const currentTarget = e.currentTarget as Element | null;
		const containerEl = currentTarget ? currentTarget.closest('.w-full') as HTMLElement | null : null;
		const container = containerEl ?? (document.body as HTMLElement);
		const toIndex = computeIndexFromCoords(e.detail.x, e.detail.y, total, container);
		reorderPlayers(fromIndex, toIndex);
	}

	function handleDragEndPlayer3(e: any) {
		const total = $appSettings.playerCount;
		const fromIndex = 3 - 1;
		const currentTarget = e.currentTarget as Element | null;
		const containerEl = currentTarget ? currentTarget.closest('.w-full') as HTMLElement | null : null;
		const container = containerEl ?? (document.body as HTMLElement);
		const toIndex = computeIndexFromCoords(e.detail.x, e.detail.y, total, container);
		reorderPlayers(fromIndex, toIndex);
	}

	function handleDragEndPlayer1(e: any) {
		const total = $appSettings.playerCount;
		const fromIndex = 1 - 1;
		const currentTarget = e.currentTarget as Element | null;
		const containerEl = currentTarget ? currentTarget.closest('.flex.flex-col') as HTMLElement | null : null;
		const container = containerEl ?? (document.body as HTMLElement);
		const toIndex = computeIndexFromCoords(e.detail.x, e.detail.y, total, container);
		reorderPlayers(fromIndex, toIndex);
	}

	// Drag state for placeholder animation
	let dragging = false;
	let dragFrom: number | null = null;
	let dragTo: number | null = null;

	function startDrag(fromIndex: number) {
		dragging = true;
		dragFrom = fromIndex;
		dragTo = fromIndex;
	}

	function moveDrag(x: number, y: number) {
		const total = $appSettings.playerCount;
		// container for this layout
		const container = document.querySelector('.flex.flex-col.h-full') as HTMLElement | null || document.body as HTMLElement;
		const idx = computeIndexFromCoords(x, y, total, container);
		if (idx !== dragTo) dragTo = idx;
	}

	function endDragAndReset(fromIndex: number, x?: number, y?: number) {
		if (typeof x === 'number' && typeof y === 'number') {
			const total = $appSettings.playerCount;
			const container = document.querySelector('.flex.flex-col.h-full') as HTMLElement | null || document.body as HTMLElement;
			const to = computeIndexFromCoords(x, y, total, container);
			reorderPlayers(fromIndex, to);
		} else {
			// fallback: no movement
			reorderPlayers(fromIndex, fromIndex);
		}
		dragging = false;
		dragFrom = null;
		dragTo = null;
	}
</script>

<div class="flex flex-col h-full justify-between">
	<div
		class="w-full flex justify-between gap-2 bg-black sticky top-0"
		class:h-[57%]={!$appState.isMenuOpen}
	>
		<div class="w-1/2">
			{#if isTouchDevice}
				<div class="w-full h-full player-slot" class:placeholder={dragging && dragTo === 1} use:touchDrag={{ handle: '.beleren' }} on:dragstart={() => startDrag(1)} on:dragmove={(ev) => moveDrag(ev.detail.x, ev.detail.y)} on:dragend={(e) => { handleDragEndPlayer2(e); endDragAndReset(1, e.detail.x, e.detail.y); }}>
					<PlayerHorizontal orientation="right" id={2} />
				</div>
			{:else}
				<PlayerHorizontal orientation="right" id={2} />
			{/if}
		</div>
		<div class="w-1/2">
			{#if isTouchDevice}
				<div class="w-full h-full player-slot" class:placeholder={dragging && dragTo === 2} use:touchDrag={{ handle: '.beleren' }} on:dragstart={() => startDrag(2)} on:dragmove={(ev) => moveDrag(ev.detail.x, ev.detail.y)} on:dragend={(e) => { handleDragEndPlayer3(e); endDragAndReset(2, e.detail.x, e.detail.y); }}>
					<PlayerHorizontal orientation="left" id={3} />
				</div>
			{:else}
				<PlayerHorizontal orientation="left" id={3} />
			{/if}
		</div>
	</div>
	<div class="flex-grow">
		<Menu />
	</div>
	<div
		class="flex items-end bg-black sticky bottom-0 pb-2"
		class:h-[43%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		{#if isTouchDevice}
			<div class="w-full h-full player-slot" class:placeholder={dragging && dragTo === 0} use:touchDrag={{ handle: '.beleren' }} on:dragstart={() => startDrag(0)} on:dragmove={(ev) => moveDrag(ev.detail.x, ev.detail.y)} on:dragend={(e) => { handleDragEndPlayer1(e); endDragAndReset(0, e.detail.x, e.detail.y); }}>
				<PlayerVertical orientation={'up'} id={1} />
			</div>
		{:else}
			<PlayerVertical orientation={'up'} id={1} />
		{/if}
	</div>
</div>

<style>
/* Placeholder animation for slots during drag */
.player-slot {
	transition: transform 160ms ease, opacity 120ms ease;
}
.player-slot.placeholder {
	transform: translateY(-10px) scale(1.02);
	opacity: 0.95;
}
</style>
