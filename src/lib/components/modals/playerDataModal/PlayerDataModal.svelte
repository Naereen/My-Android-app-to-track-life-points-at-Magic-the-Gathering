<script lang="ts">
	import Pen from '$lib/assets/icons/Pen.svelte';
	import X from '$lib/assets/icons/X.svelte';
	import { playerModalData, resetPlayerModalData } from '$lib/store/modal';
	import { players, setPlayerColor, setPlayerAllowNegative } from '$lib/store/player';
	import { colorToBg } from '$lib/components/colorToBg';
	import { _ } from 'svelte-i18n';

	let gradientMode = false;
	let selectedColors: string[] = [];
	let mode: 'colors' | 'backgrounds' = 'colors';
	let searchQuery = '';
	let searchResults: Array<{ id: string; name: string; set_name?: string; artist?: string; image?: string | null | undefined }> = [];
	let isSearching = false;

	import { searchCards } from '$lib/utils/scryfall';
	import { setPlayerBackgroundImage } from '$lib/store/player';

	// initialize selectedColors when modal/player changes
	$: if ($playerModalData && $players) {
		const p = $players[$playerModalData.playerId - 1];
		if (p && typeof p.color === 'string' && p.color.includes(',')) {
			selectedColors = p.color.split(',').map((s) => s.trim());
		} else if (p && p.color) {
			selectedColors = [p.color];
		} else {
			selectedColors = [];
		}
	}

	const toggleColorSelection = (playerId: number, c: string) => {
		if (!gradientMode) {
			setPlayerColor(playerId, c);
			return;
		}

		const idx = selectedColors.indexOf(c);
		if (idx === -1) {
			selectedColors = [...selectedColors, c];
		} else {
			selectedColors = selectedColors.filter((x) => x !== c);
		}

		// update store with joined comma-separated list (or single color)
		if (selectedColors.length > 0) {
			setPlayerColor(playerId, selectedColors.join(','));
		} else {
			setPlayerColor(playerId, 'white');
		}
	};

	const clearSelection = (playerId: number) => {
		selectedColors = [];
		setPlayerColor(playerId, 'white');
	};

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


	const doSearch = async () => {
		if (!searchQuery || searchQuery.trim().length === 0) {
			searchResults = [];
			return;
		}
		isSearching = true;
		searchResults = await searchCards(searchQuery);
		isSearching = false;
	};

	const chooseBackground = (playerId: number, imageUrl: string | null) => {
		setPlayerBackgroundImage(playerId, imageUrl);
		// clear color so background shows clearly
		setPlayerColor(playerId, 'white');
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
		class="bg-[#d8e5f7] max-w-3xl w-11/12 max-h-[90vh] h-auto opacity-100 rounded-[1.5rem] flex justify-center items-start text-black p-4 relative"
		role="button"
		on:keydown={() => null}
		tabindex="0"
	>
		<div class="flex flex-col justify-center">
			<div class="flex flex-col justify-center items-center">
				<h2 class="text-lg font-semibold my-2 relative w-full text-center">
					{ $_('customize_player') }<button on:click={resetPlayerModalData} on:contextmenu|preventDefault draggable="false" class="absolute -right-0 top-0"
						><X /></button>
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
				<div class="mt-4 flex flex-col justify-center items-center w-full px-6 sm:px-10">
					<div class="w-full flex justify-center gap-4 mb-3">
						<button class="px-3 py-1 rounded-full border" on:click={() => mode = 'backgrounds'} class:font-semibold={mode === 'backgrounds'}>{ $_('open_customize_backgrounds') }</button>
						<button class="px-3 py-1 rounded-full border" on:click={() => mode = 'colors'} class:font-semibold={mode === 'colors'}>{ $_('player_background_color') }</button>
					</div>
					{#if mode === 'backgrounds'}
						<div class="w-full mb-3">
							<div class="flex gap-2">
								<input type="text" class="flex-1 py-2 px-3 rounded-lg outline outline-1 outline-black" bind:value={searchQuery} placeholder="Search card name..." />
								<button class="px-3 py-2 bg-blue-500 text-white rounded-lg" on:click={doSearch} disabled={isSearching}>{isSearching ? 'Searching...' : 'Search'}</button>
							</div>
						</div>
						<div class="w-full max-h-60 overflow-auto">
							{#if searchResults.length === 0}
								<div class="text-sm text-gray-500">No results</div>
							{/if}
							{#each searchResults as r}
								<div class="flex gap-2 mb-3 p-2 border rounded-lg bg-white">
									<div class="flex-1 text-left">
										<div class="font-semibold text-xl">{r.name}</div>
										<div class="text-sm text-gray-600">{r.set_name}</div>
										<div class="text-sm text-gray-600">Artist: {r.artist}</div>
										<div class="text-sm text-gray-600">© Wizards of the Coast</div>
										<div class="mt-2">
											<button class="px-3 py-1 bg-green-600 text-white rounded" on:click={() => r.image && chooseBackground($playerModalData.playerId, r.image)}>Choose</button>
										</div>
									</div>
									<div class="w-32 flex-shrink-0">
										{#if r.image}
											<img src={r.image} alt={r.name} class="w-full h-auto object-cover" />
										{:else}
											<div class="w-full h-40 bg-gray-200 flex items-center justify-center text-sm">No image</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if mode === 'colors'}
						<!-- <label class="block mb-2 font-semibold">{ $_('player_background_color') }</label> -->
						<div class="flex items-center gap-3 mb-2">
							<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={gradientMode} /> { $_('gradient_mode') }</label>
							<button on:click={() => clearSelection($playerModalData.playerId)} class="ml-2 text-sm underline">{ $_('clear_gradient') }</button>
						</div>
						<div class="flex flex-wrap justify-center items-center gap-3 m-auto">
							{#each ['white','blue','black','red','green'] as c}
								<button
									on:click={() => toggleColorSelection($playerModalData.playerId, c)}
									class="w-8 h-8 rounded-square rounded-lg border-2 relative"
									style="background: {colorToBg(c)}"
									aria-label={c}
								>
									{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
										<span class="block w-full h-full rounded-square rounded-lg" style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"></span>
									{/if}
									{#if selectedColors.indexOf(c) !== -1}
										<span class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">{selectedColors.indexOf(c) + 1}</span>
									{/if}
								</button>
							{/each}
							<hr class="w-full" />
							<div class="h-1" />
							{#each ['mud', 'metalicgray'] as c}
								<button
									on:click={() => toggleColorSelection($playerModalData.playerId, c)}
									class="w-8 h-8 rounded-square rounded-lg border-2 relative"
									style="background: {colorToBg(c)}"
									aria-label={c}
								>
									{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
										<span class="block w-full h-full rounded-square rounded-lg" style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"></span>
									{/if}
									{#if selectedColors.indexOf(c) !== -1}
										<span class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">{selectedColors.indexOf(c) + 1}</span>
									{/if}
								</button>
							{/each}
							<hr class="w-full" />
							<div class="h-1" />
							{#each ['gold', 'purple', 'pink', 'orange', 'lightgreen'] as c}
								<button
									on:click={() => toggleColorSelection($playerModalData.playerId, c)}
									class="w-8 h-8 rounded-square rounded-lg border-2 relative"
									style="background: {colorToBg(c)}"
									aria-label={c}
								>
									{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
										<span class="block w-full h-full rounded-square rounded-lg" style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"></span>
									{/if}
									{#if selectedColors.indexOf(c) !== -1}
										<span class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">{selectedColors.indexOf(c) + 1}</span>
									{/if}
								</button>
							{/each}
						</div>
						{/if}

						<!-- Allow negative life toggle placed after color options -->
						<div class="mt-4 w-full flex flex-col items-center text-center">
							<label class="flex items-center gap-2 justify-center"><input type="checkbox" checked={$players[$playerModalData.playerId - 1].allowNegativeLife} on:change={() => setPlayerAllowNegative($playerModalData.playerId, !$players[$playerModalData.playerId - 1].allowNegativeLife)} /> <span class="ml-2 block mb-2 font-semibold text-center">{ $_('allow_negative_life') }</span></label>
							<div class="mt-2 text-sm text-gray-600 text-center">{ $_('allow_negative_life_help') }</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
<!-- </div> -->
