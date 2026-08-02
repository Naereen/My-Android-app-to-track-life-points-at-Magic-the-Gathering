<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<div class="flex flex-col h-full" data-dnd-layout>
	<div class="flex items-start bg-black sticky top-0" class:h-full={!$appState.isMenuOpen}>
		<DraggablePlayerSlot className="w-full h-full" seatId={2}>
			<PlayerVertical orientation="down" id={2} />
		</DraggablePlayerSlot>
	</div>
	<div class="flex-grow">
		<Menu />
	</div>
	<div
		class="flex items-end bg-black sticky bottom-0 pb-2"
		class:h-full={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<DraggablePlayerSlot className="w-full h-full" seatId={1}>
			<PlayerVertical id={1} />
		</DraggablePlayerSlot>
	</div>
</div>
