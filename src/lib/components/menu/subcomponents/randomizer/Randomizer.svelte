<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import Deight from '$lib/assets/icons/Deight.svelte';
	import Dfour from '$lib/assets/icons/Dfour.svelte';
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import Dten from '$lib/assets/icons/Dten.svelte';
	import Dtwelve from '$lib/assets/icons/Dtwelve.svelte';
	import Dtwenty from '$lib/assets/icons/Dtwenty.svelte';
	import Dtwo from '$lib/assets/icons/Dtwo.svelte';
	import { appSettings, setCustomRandomNumber } from '$lib/store/appSettings';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { generateRandomNumber } from '$lib/store/modal';
	import DiceCard from './subcomponents/diceCard/RandomizerButton.svelte';
	import { _ } from 'svelte-i18n';

	$: innerHeight = 0;

	const handleCustomRandomizerKeyPress = (event: KeyboardEvent) => {
		const { key } = event;

		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter'];

		if (!allowedKeys.includes(key) && !/^\d$/.test(key)) {
			event.preventDefault();
		}

		if ($appSettings.customRandomNumber < 0) {
			setCustomRandomNumber(0);
		} else if ($appSettings.customRandomNumber > 999) {
			setCustomRandomNumber(999);
		}
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-scroll scrollbar-hidden h-full"
	style="max-height: {innerHeight - ($appSettings.playerCount >= 5 ? 110 : 80)}px;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black"
		>
			<button on:click={() => toggleIsMenuOpen('')} on:contextmenu|preventDefault draggable="false" class="text-white absolute left-0 pl-4">
				<Arrow />
			</button>
			<span class="text-gray-400 text-center" style="font-size: xxx-large;">{ $_('dice_misc') }</span>
		</div>

		<div class="w-full flex justify-center">
			<div class="grid grid-rows-3 grid-cols-6 gap-y-8 gap-x-4">
				<div class="col-span-2 col-start-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d2');
						}}
						text="{ $_('flip_coin') }"><Dtwo size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('custom');
						}}
						text="{ $_('custom_number') }"
						><div class="px-2 rounded flex flex-col">
							<div class="relative">
								<input
									on:click|stopPropagation
									bind:value={$appSettings.customRandomNumber}
									type="number"
									name="customNumber"
									id="customNumber"
									autocomplete="off"
									class="w-20 bg-black rounded-xl grow h-[36px] text-right px-2 text-white text-lg outline-none"
									on:keyup={(e) => handleCustomRandomizerKeyPress(e)}
									max="999"
									min="0"
								/>
								<p class="absolute top-2 left-2 text-white text-sm">{ $_('set_dice') }</p>
							</div>
							<div class="text-white text-xl mb-2 mt-2">{ $_('roll') }</div>
						</div></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d4');
						}}
						text="{ $_('roll') } d4"><Dfour size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d6');
						}}
						text="{ $_('roll') } d6"><Dsix size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d8');
						}}
						text="{ $_('roll') } d8"><Deight size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d10');
						}}
						text="{ $_('roll') } d10"><Dten size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d12');
						}}
						text="{ $_('roll') } d12"><Dtwelve size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d20');
						}}
						text="{ $_('roll') } d20"><Dtwenty size="4rem" /></DiceCard
					>
				</div>
			</div>
		</div>
	</div>
</div>
