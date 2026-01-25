<script lang="ts">
	import Pen from '$lib/assets/icons/Pen.svelte';
	import X from '$lib/assets/icons/X.svelte';
	import { playerModalData, resetPlayerModalData } from '$lib/store/modal';
	import { players, setPlayerColor } from '$lib/store/player';
	import { colorToBg } from '$lib/components/colorToBg';
	import { _ } from 'svelte-i18n';

	const handleOnKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			resetPlayerModalData();
		}

		if ($players[$playerModalData.playerId - 1].playerName.length >= 20) {
			$players[$playerModalData.playerId - 1].playerName = $players[
				$playerModalData.playerId - 1
			].playerName.slice(0, 19);
		}
	};
</script>

<div
	class="bg-black/70 absolute w-full h-full top-0 left-0 flex justify-center items-center"
	on:click={resetPlayerModalData}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation
		class="bg-[#d8e5f7] max-w-80 max-h-80 w-full h-full opacity-100 rounded-[2rem] flex justify-center items-start text-black p-2 relative"
		role="button"
		on:keydown={() => null}
		tabindex="0"
	>
		<div class="flex flex-col justify-center">
			<div class="flex flex-col justify-center items-center">
				<h2 class="text-lg font-semibold my-2 relative w-full text-center">
					{ $_('customize_player') }<button on:click={resetPlayerModalData} on:contextmenu|preventDefault draggable="false" class="absolute -right-0 top-0"
						><X /></button
					>
				</h2>
				<div class="relative">
					<input
						type="text"
						class="py-2 px-3 rounded-lg outline outline-1 outline-black text-black font-semibold bg-[#f1f6fe]"
						bind:value={$players[$playerModalData.playerId - 1].playerName}
						on:keypress={handleOnKeyPress}
					/>
					<div class="absolute right-3 top-2 pointer-events-none"><Pen /></div>
				</div>
				<div class="mt-4">
					<label class="block mb-2 font-semibold">{ $_('player_background_color') }</label>
					<div class="flex gap-2">
						{#each ['mud', 'metalicgray', 'gold', 'purple', 'pink', 'orange', 'lightgreen', 'white','blue','black','red','green'] as c}
							<button
								on:click={() => setPlayerColor($playerModalData.playerId, c)}
								class="w-8 h-8 rounded-square rounded-lg border-2"
								style="background: {colorToBg(c)}"
								aria-label={c}
							>
								{#if $players[$playerModalData.playerId - 1].color === c}
									<span class="block w-full h-full rounded-square rounded-lg" style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"></span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
