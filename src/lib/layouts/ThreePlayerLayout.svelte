<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<!-- The classic three-player layout reserves the lower seat for the active player and
    spreads the two top seats laterally so the triangle formation stays readable. -->

<div class="flex flex-col h-full justify-between" data-dnd-layout>
	{#if !$appState.isMenuOpen}
		<div
			class="w-full flex justify-between gap-2 bg-black sticky top-0"
			class:h-[57%]={!$appState.isMenuOpen}
		>
			<div class="w-1/2">
				<DraggablePlayerSlot className="w-full h-full" seatId={2}>
					<PlayerHorizontal orientation="right" id={2} />
				</DraggablePlayerSlot>
			</div>
			<div class="w-1/2">
				<DraggablePlayerSlot className="w-full h-full" seatId={3}>
					<PlayerHorizontal orientation="left" id={3} />
				</DraggablePlayerSlot>
			</div>
		</div>
	{/if}
	<div class="flex-grow">
		<Menu />
	</div>
	<div
		class="flex items-end bg-black sticky bottom-0 pb-2"
		class:h-[43%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<DraggablePlayerSlot className="w-full h-full" seatId={1}>
			<PlayerVertical orientation={'up'} id={1} />
		</DraggablePlayerSlot>
	</div>
</div>
