<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<!-- The inverted three-player layout gives the upper player a vertical slot and keeps
     the lower pair horizontal, which is useful when the table is read from the opposite side. -->

<div class="flex flex-col h-full justify-between" data-dnd-layout>
		<div
			class="flex items-start bg-black sticky top-0 pt-2"
			class:h-[43%]={!$appState.isMenuOpen}
		>
			<DraggablePlayerSlot className="w-full h-full" seatId={2}>
				<PlayerVertical orientation={'down'} id={2} />
			</DraggablePlayerSlot>
		</div>
	<div class="flex-grow">
		<Menu />
	</div>
	{#if !$appState.isMenuOpen}
	<div
		class="w-full flex justify-between gap-2 bg-black sticky bottom-0"
		class:h-[57%]={!$appState.isMenuOpen}
		class:pb-2={$appState.isMenuOpen}
	>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={1}>
				<PlayerHorizontal orientation="right" id={1} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={3}>
				<PlayerHorizontal orientation="left" id={3} />
			</DraggablePlayerSlot>
		</div>
	</div>
    {/if}
</div>
