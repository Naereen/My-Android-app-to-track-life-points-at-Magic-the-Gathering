<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
</script>

<div class="flex flex-col h-full justify-between">
	<div
		class="w-full flex justify-between gap-2 bg-black sticky top-0"
		class:h-[57%]={!$appState.isMenuOpen}
	>
		<div class="w-1/2">
			<PlayerHorizontal orientation="right" id={2} />
		</div>
		<div class="w-1/2">
			<PlayerHorizontal orientation="left" id={3} />
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
		<PlayerVertical orientation={'up'} id={1} />
	</div>
</div>
