<script>
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import Button from '$lib/components/shared/button/Button.svelte';
	import { appSettings } from '$lib/store/appSettings';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { resetResources } from '$lib/store/resources';
	import ManaCounter from './subcomponents/ManaCounter/ManaCounter.svelte';
	import { _ } from 'svelte-i18n';
	import { haptic } from '$lib/utils/haptics';

	$: innerHeight = 0;
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-scroll scrollbar-hidden h-full"
	style="max-height: {innerHeight -
		($appSettings.playerCount >= 5 ? 110 : 80)}px; font-size: 1.2rem;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black z-10"
		>
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				use:haptic={100}
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('mana_counter')}</span>
		</div>

		<div class="flex flex-col">
			<div class="w-full text-center text-white flex flex-col items-center">
				<div class="w-2/4 flex justify-center">
					<ul class="w-full flex flex-col gap-2">
						<ManaCounter type="white" />
						<ManaCounter type="blue" />
						<ManaCounter type="black" />
						<ManaCounter type="red" />
						<ManaCounter type="green" />
						<ManaCounter type="waste" />
					</ul>
				</div>
			</div>
			<div class="w-full text-center text-white my-2 flex flex-col items-center">
				<span class="text-white text-center text-3xl">{$_('storm_counter')}</span>
				<div class="w-2/4 flex justify-center">
					<ul class="w-full">
						<ManaCounter type="storm" />
					</ul>
				</div>
			</div>
			<div class="flex justify-center gap-2 py-2">
				<Button on:click={() => toggleIsMenuOpen('')} hapticPattern={100}>{$_('close')}</Button>
				<Button on:click={resetResources} hapticPattern={100} type="dark">{$_('clear')}</Button>
			</div>
		</div>
	</div>
</div>
