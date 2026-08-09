<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<!-- This stacked variant compresses the board into taller bands so the menu can stay
     readable while still giving each seat a stable, touch-friendly target. -->

<div class="flex flex-col justify-between w-full h-full relative" data-dnd-layout>
	<div
		class="w-full pt-2 bg-black sticky top-0"
		class:h-[32%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<DraggablePlayerSlot className="w-full h-full" seatId={3}>
			<PlayerVertical orientation="down" layout="one-two-one" id={3} />
		</DraggablePlayerSlot>
	</div>

	{#if !$appState.isMenuOpen}
	<div class="pt-2 flex gap-2 bg-black sticky top-0 h-[32%]">
		<div class="w-1/2 h-full">
			<DraggablePlayerSlot className="w-full h-full" seatId={2}>
				<PlayerHorizontal orientation="right" layout="one-two-one" id={2} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2 h-full">
			<DraggablePlayerSlot className="w-full h-full" seatId={4}>
				<PlayerHorizontal orientation="left" layout="one-two-one" id={4} />
			</DraggablePlayerSlot>
		</div>
	</div>
	{/if}

	<div class="flex-grow">
		<Menu />
	</div>

	<div
		class="flex items-end bg-black sticky bottom-0 pb-2"
		class:h-[32%]={!$appState.isMenuOpen}
		class:pt-3={$appState.isMenuOpen}
	>
		<DraggablePlayerSlot className="w-full h-full" seatId={1}>
			<PlayerVertical orientation="up" layout="one-two-one" id={1} />
		</DraggablePlayerSlot>
	</div>
</div>
