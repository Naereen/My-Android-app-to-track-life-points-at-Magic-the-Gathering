<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<div class="flex flex-col gap-0 h-full justify-between" data-dnd-layout>
	<div
		class="flex flex-col gap-2 bg-black sticky top-0 pb-2"
		class:h-[23%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-1/2">
				<DraggablePlayerSlot className="w-full h-full" seatId={4}>
					<PlayerHorizontal doNotShowMinimap={true} orientation="right" layout="one-two-one" id={4} />
				</DraggablePlayerSlot>
			</div>
			<div class="w-1/2">
				<DraggablePlayerSlot className="w-full h-full" seatId={5}>
					<PlayerHorizontal doNotShowMinimap={true} orientation="left" layout="one-two-one" id={5} />
				</DraggablePlayerSlot>
			</div>
		</div>
	</div>

	<div
		class="pt-2 flex gap-2 bg-black sticky top-0"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={3}>
				<PlayerHorizontal doNotShowMinimap={true} orientation="right" layout="one-two-one" id={3} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={6}>
				<PlayerHorizontal doNotShowMinimap={true} orientation="left" layout="one-two-one" id={6} />
			</DraggablePlayerSlot>
		</div>
	</div>

	<div class="flex-grow gap-2 bg-black sticky top-0">
		<Menu />
	</div>

	<div
		class="pt-2 flex gap-2 bg-black sticky top-0"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={2}>
				<PlayerHorizontal doNotShowMinimap={true} orientation="right" layout="one-two-one" id={2} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={7}>
				<PlayerHorizontal doNotShowMinimap={true} orientation="left" layout="one-two-one" id={7} />
			</DraggablePlayerSlot>
		</div>
	</div>

	<div
		class="flex flex-col gap-2 bg-black sticky bottom-0"
		class:h-[23%]={!$appState.isMenuOpen}
		class:pt-2={!$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-full">
				<DraggablePlayerSlot className="w-full h-full" seatId={1}>
					<PlayerVertical doNotShowMinimap={true} orientation="up" layout="one-two-one" id={1} />
				</DraggablePlayerSlot>
			</div>
		</div>
	</div>
</div>
