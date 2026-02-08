<script lang="ts">
	import Menu from '../components/menu/Menu.svelte';
	import { appState } from '$lib/store/appState';
	import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
</script>

<div class="flex flex-col h-full justify-between">
	<div
		class="flex flex-col gap-2 bg-black sticky bottom-0 pb-2"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-full">
				<PlayerVertical orientation="down" layout="one-two-one" id={4} />
			</div>
		</div>
	</div>
	<div
		class="flex flex-col gap-2 bg-black sticky bottom-0 pb-2"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-full">
				<PlayerHorizontal orientation="right" layout="one-two-one" id={2} />
				<PlayerHorizontal orientation="left" layout="one-two-one" id={6} />
			</div>
		</div>
	</div>
	<div class="flex-grow">
		<Menu />
	</div>
	<div
		class="flex flex-col gap-2 bg-black sticky bottom-0 pb-2"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-full">
				<PlayerHorizontal orientation="right" layout="one-two-one" id={2} />
				<PlayerHorizontal orientation="left" layout="one-two-one" id={6} />
			</div>
		</div>
	</div>
	<div
		class="flex flex-col gap-2 bg-black sticky bottom-0 pb-2"
		class:h-[24%]={!$appState.isMenuOpen}
		class:pt-2={$appState.isMenuOpen}
	>
		<div class="h-full w-full flex justify-between gap-2">
			<div class="w-full">
				<PlayerVertical orientation="up" layout="one-two-one" id={1} />
			</div>
		</div>
	</div>
</div>
