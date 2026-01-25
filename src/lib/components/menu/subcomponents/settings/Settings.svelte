<script lang="ts">
	import {
		appSettings,
		setCustomStartingLifeTotal,
		setPlayerCount,
		setStartingLifeTotal
	} from '$lib/store/appSettings';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import CircularButton from '../../../shared/circularButton/CircularButton.svelte';
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { resetLifeTotals } from '$lib/store/player';
	import { _ } from 'svelte-i18n';

	const isCustomStartingLife = () => {
		return (
			$appSettings.startingLifeTotal !== 20 &&
			$appSettings.startingLifeTotal !== 25 &&
			$appSettings.startingLifeTotal !== 30 &&
			$appSettings.startingLifeTotal !== 40
		);
	};

	const handleCustomLifeTotalKeyPress = (event: KeyboardEvent) => {
		const { key } = event;

		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter'];

		if (!allowedKeys.includes(key) && !/^\d$/.test(key)) {
			event.preventDefault();
		}

		if ($appSettings.customStartingLifeTotal < 0) {
			setCustomStartingLifeTotal(1);
		} else if ($appSettings.customStartingLifeTotal > 999) {
			setCustomStartingLifeTotal(999);
		}

		if (key === 'Enter') {
			setLifeTotal($appSettings.customStartingLifeTotal);
		}
	};

	const setLifeTotal = (startingLifeTotal: number) => {
		// TODO: Add clean modal popup
		const confirm = window.confirm($_('window_confirm_change_life_total'));
		if (confirm) {
			setStartingLifeTotal(startingLifeTotal);
			if (!isCustomStartingLife()) {
				setCustomStartingLifeTotal(60);
			}
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	const setNewPlayerCount = (playerCount: number) => {
		// TODO: Add clean modal popup
		const confirm = window.confirm($_('window_confirm_change_player_count'));
		if (confirm) {
			setPlayerCount(playerCount);
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	$: innerHeight = 0;
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-scroll scrollbar-hidden h-full"
	style="max-height: {innerHeight - 80}px;"
>
	<div
		class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black"
	>
		<button on:click={() => toggleIsMenuOpen('')} on:contextmenu|preventDefault draggable="false" class="text-white absolute left-0 pl-4"
			><Arrow /></button
		>
		<span class="text-gray-400 text-center" style="font-size: xxx-large;">{ $_('settings') }</span>
	</div>

	<div class="w-full text-center text-white mt-4 flex flex-col items-center">
		<!-- Player Count -->
		<div class="w-3/4">
			<div><span style="font-size: xx-large;">{ $_('players') }</span></div>
			<div class="flex flex-row justify-between mt-3">
				{#each [2, 3, 4, 5, 6] as playerCount}
					{#key $appSettings.playerCount}
						<div>
							<CircularButton
								on:click={() => setNewPlayerCount(playerCount)}
								number={playerCount}
								highlight={$appSettings.playerCount === playerCount}
							/>
						</div>
					{/key}
				{/each}
			</div>
		</div>

		<!-- Starting Life Total -->
		<div class="mt-6 w-3/4">
			<div><span style="font-size: xx-large;">{ $_('starting_life') }</span></div>
			<div class="flex flex-row justify-between mt-3">
				{#each [20, 25, 30, 40, 'custom'] as lifeTotal}
					{#key $appSettings.startingLifeTotal}
						{#if typeof lifeTotal === 'number'}
							<div>
								<CircularButton
									on:click={() => setLifeTotal(lifeTotal)}
									number={lifeTotal}
									highlight={lifeTotal === 60
										? isCustomStartingLife()
										: $appSettings.startingLifeTotal === lifeTotal}
								/>
							</div>
						{:else}
							<div>
								<CircularButton
									number={$appSettings.customStartingLifeTotal}
									customText
									highlight={isCustomStartingLife()}
								>
									<input
										bind:value={$appSettings.customStartingLifeTotal}
										on:keypress={handleCustomLifeTotalKeyPress}
										type="number"
										class="bg-transparent w-8 h-8 overflow-hidden rounded-full text-center outline-none"
										max="999"
									/>
								</CircularButton>
							</div>
						{/if}
					{/key}
				{/each}
			</div>
		</div>
	</div>
</div>
