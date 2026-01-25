<script lang="ts">
	import Minus from '$lib/assets/icons/Minus.svelte';
	import Plus from '$lib/assets/icons/Plus.svelte';
	import { resourceCounter, setResource } from '$lib/store/resources';
	import { optimize } from '$lib/utils';
	import CircularButton from '../../../../../shared/circularButton/CircularButton.svelte';

	export let type: App.Resources.Resource;

	const images: { [key in App.Resources.Resource]: string } = {
		white: 'white-mana-symbol.webp',
		blue: 'blue-mana-symbol.webp',
		black: 'black-mana-symbol.webp',
		red: 'red-mana-symbol.webp',
		green: 'green-mana-symbol.webp',
		waste: 'waste-mana-symbol.webp',
		storm: 'storm-counter-symbol.webp'
	};
</script>

<li class="flex flex-row items-center justify-between w-full">
	<div>
		<CircularButton
			on:click={() => setResource(type, --$resourceCounter[type])}
			customText
			highlight
			light
			small><Minus light size="1.25rem" /></CircularButton
		>
	</div>
	<div
		class="h-16 w-16 flex flex-row items-center justify-center flex-grow"
		class:brightness-[25%]={$resourceCounter[type] === 0}
	>
		<img srcset={optimize(images[type])} alt="mana symbol" class="h-16 w-16" /><span
			class="ml-4 text-2xl text-center w-2">{$resourceCounter[type]}</span
		>
	</div>
	<div>
		<CircularButton
			on:click={() => setResource(type, ++$resourceCounter[type])}
			customText
			highlight
			light
			small><Plus light size="1.25rem" /></CircularButton
		>
	</div>
</li>
