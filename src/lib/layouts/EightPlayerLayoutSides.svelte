<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import DraggablePlayerSlot from '$lib/components/player/DraggablePlayerSlot.svelte';
</script>

<div class="flex flex-col gap-0 h-full justify-between" data-dnd-layout>
	{#if !$appState.isMenuOpen}
	<div class="flex gap-2 bg-black sticky top-0 pb-2" class:h-[25%]={!$appState.isMenuOpen}>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={4}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="right" layout="two-by-two" id={4} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={5}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="left" layout="two-by-two" id={5} />
			</DraggablePlayerSlot>
		</div>
	</div>

	<div class="flex gap-2 bg-black sticky top-0 pb-2" class:h-[25%]={!$appState.isMenuOpen}>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={3}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="right" layout="two-by-two" id={3} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={6}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="left" layout="two-by-two" id={6} />
			</DraggablePlayerSlot>
		</div>
	</div>
	{/if}

	<div class="flex-grow gap-2 bg-black sticky top-0">
		<Menu />
	</div>

	{#if !$appState.isMenuOpen}
	<div class="flex gap-2 bg-black sticky top-0 pb-2" class:h-[25%]={!$appState.isMenuOpen}>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={2}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="right" layout="two-by-two" id={2} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={7}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="left" layout="two-by-two" id={7} />
			</DraggablePlayerSlot>
		</div>
	</div>

	<div class="flex gap-2 bg-black sticky top-0 pb-2" class:h-[25%]={!$appState.isMenuOpen}>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={1}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="right" layout="two-by-two" id={1} />
			</DraggablePlayerSlot>
		</div>
		<div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
			<DraggablePlayerSlot className="w-full h-full" seatId={8}>
				<PlayerHorizontal doNotShowMinimap={false} orientation="left" layout="two-by-two" id={8} />
			</DraggablePlayerSlot>
		</div>
	</div>
	{/if}
</div>
