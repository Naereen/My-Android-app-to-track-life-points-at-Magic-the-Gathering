<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<div class="flex flex-col justify-between relative h-full" data-dnd-layout>
	<div
		class="w-full flex justify-between gap-2 bg-black sticky top-0"
		class:h-full={!$appState.isMenuOpen}
	>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={2}>
				<PlayerHorizontal orientation="right" layout="two-by-two" id={2} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={3}>
				<PlayerHorizontal orientation="left" layout="two-by-two" id={3} />
			</DraggablePlayerSlot>
		</div>
	</div>

	<div class="flex-grow">
		<Menu />
	</div>

	<div
		class="w-full flex justify-between gap-2 bg-black sticky bottom-0 pb-2"
		class:h-full={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={1}>
				<PlayerHorizontal orientation="right" layout="two-by-two" id={1} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2">
			<DraggablePlayerSlot className="w-full h-full" seatId={4}>
				<PlayerHorizontal orientation="left" layout="two-by-two" id={4} />
			</DraggablePlayerSlot>
		</div>
	</div>
</div>
