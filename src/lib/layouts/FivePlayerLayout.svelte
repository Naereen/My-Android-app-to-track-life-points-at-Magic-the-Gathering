<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
</script>

<div class="flex flex-col h-full justify-between">
	<div class="flex flex-col gap-2 bg-black sticky top-0" class:h-[70%]={!$appState.isMenuOpen}>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-1/2">
				<PlayerHorizontal orientation="right" id={3} />
			</div>
			<div class="w-1/2">
				<PlayerHorizontal orientation="left" id={4} />
			</div>
		</div>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-1/2">
				<PlayerHorizontal orientation="right" id={2} />
			</div>
			<div class="w-1/2">
				<PlayerHorizontal orientation="left" id={5} />
			</div>
		</div>
	</div>
	<div class="flex-grow">
		<Menu />
	</div>
	<div
		class="flex items-end bg-black sticky bottom-0 pb-2"
		class:h-[30%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<PlayerVertical orientation="up" id={1} />
	</div>
</div>
