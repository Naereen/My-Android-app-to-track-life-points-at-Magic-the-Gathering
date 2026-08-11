<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import Deight from '$lib/assets/icons/Deight.svelte';
	import Dfour from '$lib/assets/icons/Dfour.svelte';
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import Dplanar from '$lib/assets/icons/Dplanar.svelte';
	import Dten from '$lib/assets/icons/Dten.svelte';
	import Dtwelve from '$lib/assets/icons/Dtwelve.svelte';
	import Dtwenty from '$lib/assets/icons/Dtwenty.svelte';
	import Dtwo from '$lib/assets/icons/Dtwo.svelte';
	import RandomPlayer from '$lib/assets/icons/RandomPlayer.svelte';
	import { appSettings, setCustomRandomNumber } from '$lib/store/appSettings';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { generateRandomNumber, selectRandomPlayer, selectRandomOpponent } from '$lib/store/modal';
	import { players } from '$lib/store/player';
	import DiceCard from './subcomponents/diceCard/RandomizerButton.svelte';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	$: innerHeight = 0;
	let selectedActivePlayer: number | null = null;
	let showOpponentSelector = false;

	// The randomizer menu combines several independent mini-tools in one place, so the
	// state is intentionally local and simple rather than delegated to a heavier store.

	/**
	 * Restricts custom randomizer input to numeric/edit keys and clamps range.
	 * @param {KeyboardEvent} event - Parameter used by handleCustomRandomizerKeyPress.
	 * @returns {unknown} Result produced by handleCustomRandomizerKeyPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleCustomRandomizerKeyPress = (event: KeyboardEvent) => {
		// Prevent non-numeric keystrokes from corrupting the custom random number field.
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

	/**
	 * Opens the opponent selector flow used before choosing a random opponent.
	 * @returns {unknown} Result produced by handleRandomOpponent.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleRandomOpponent = () => {
		// Random opponent selection is a two-step flow: choose the active player, then roll.
		vibrate(20);
		showOpponentSelector = true;
	};

	/**
	 * Sets the active player reference and immediately rolls a random opponent.
	 * @param {number} playerId - Parameter used by selectPlayerAsActive.
	 * @returns {unknown} Result produced by selectPlayerAsActive.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const selectPlayerAsActive = (playerId: number) => {
		// The chosen active player becomes the reference for the next opponent roll.
		vibrate(20);
		selectedActivePlayer = playerId;
		selectRandomOpponent(playerId);
		showOpponentSelector = false;
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
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('dice_misc')}</span>
			<span class="text-gray-400 text-center text-sm mt-2 w-80"
				>{$_('long_click_random_player')}</span
			>
			<!-- <span class="text-gray-400 text-center text-base mt-2 w-80"></span> -->
		</div>

		<div class="w-full flex justify-center">
			<div class="grid grid-rows-4 grid-cols-6 gap-y-8 gap-x-4">
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d2');
						}}
						text={$_('flip_coin')}><Dtwo size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('custom');
						}}
						text={$_('custom_number')}
						><div class="px-2 rounded flex flex-col items-start gap-1">
							<div class="w-full">
								<p class="ml-1 mr-1 text-white text-sm">{$_('set_dice')}</p>
								<input
									on:click|stopPropagation
									bind:value={$appSettings.customRandomNumber}
									type="number"
									name="customNumber"
									id="customNumber"
									autocomplete="off"
									class="w-12 bg-black rounded-xl grow h-[36px] text-right px-2 text-white text-lg outline-none"
									on:keyup={(e) => handleCustomRandomizerKeyPress(e)}
									max="999"
									min="0"
								/>
							</div>
							<p class="text-white text-base mb-1 mt-0">{$_('roll')}</p>
						</div></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('dplanar');
						}}
						text={$_('roll-planar-die')}><Dplanar size="5rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d4');
						}}
						text="{$_('roll')} d4"><Dfour size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d6');
						}}
						text="{$_('roll')} d6"><Dsix size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d8');
						}}
						text="{$_('roll')} d8"><Deight size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d10');
						}}
						text="{$_('roll')} d10"><Dten size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d12');
						}}
						text="{$_('roll')} d12"><Dtwelve size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2">
					<DiceCard
						on:click={() => {
							generateRandomNumber('d20');
						}}
						text="{$_('roll')} d20"><Dtwenty size="4rem" /></DiceCard
					>
				</div>
				<div class="col-span-2 col-start-2">
					<DiceCard
						on:click={() => {
							selectRandomPlayer();
						}}
						text={$_('random_player')}><RandomPlayer size="4rem" /></DiceCard
					>
				</div>
				{#if $appSettings.playerCount > 2}
					<div class="col-span-2">
						<DiceCard
							on:click={() => {
								handleRandomOpponent();
							}}
							text={$_('random_opponent')}><RandomPlayer size="4rem" /></DiceCard
						>
					</div>
				{/if}
			</div>
		</div>

		{#if showOpponentSelector}
			<div
				class="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
				on:click={() => {
					vibrate(20);
					showOpponentSelector = false;
				}}
				role="button"
				on:keydown={() => null}
				tabindex="0"
			>
				<div
					class="bg-[#2d2f30] rounded-[2rem] p-6 max-w-md"
					on:click|stopPropagation
					role="button"
					on:keydown={() => null}
					tabindex="0"
				>
					<h2 class="text-white text-2xl mb-4 text-center">{$_('select_active_player')}</h2>
					<div class="grid grid-cols-2 gap-4">
						{#each $players.slice(0, $appSettings.playerCount) as player}
							<button
								class="bg-black/50 text-white p-4 rounded-xl hover:bg-black/70 transition-colors"
								on:click={() => selectPlayerAsActive(player.id)}
							>
								<div class="text-lg font-bold">{player.playerName}</div>
							</button>
						{/each}
					</div>
					<button
						class="mt-4 w-full bg-red-600 text-white p-2 rounded-xl"
						on:click={() => {
							vibrate(20);
							showOpponentSelector = false;
						}}
					>
						{$_('set_life_total_cancel')}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
