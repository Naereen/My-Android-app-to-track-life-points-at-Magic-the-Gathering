<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { emblemState, openSelectedEmblem } from '$lib/store/emblem';
	import {
		fetchCardBySetCollector,
		searchEmblemCards,
		type ScryfallEmblemCard
	} from '$lib/utils/scryfall';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let emblemQuery = '';
	let emblemResults: ScryfallEmblemCard[] = [];
	let isSearchingEmblems = false;
	let hasSearchedEmblems = false;

	$: innerHeight = 0;

	const openEmblem = (emblem: ScryfallEmblemCard | null) => {
		if (!emblem) return;
		openSelectedEmblem(emblem);
		toggleIsMenuOpen('');
	};

	const openPresetEmblem = async (setCode: string, collectorNumber: string) => {
		vibrate(20);
		isSearchingEmblems = true;
		try {
			const emblem = await fetchCardBySetCollector(setCode, collectorNumber);
			openEmblem(emblem);
		} finally {
			isSearchingEmblems = false;
		}
	};

	const handleEmblemSearchKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			runEmblemSearch('emblem');
		}
	};

	const runEmblemSearch = async (filter: 'emblem' | 'dungeon') => {
		vibrate(20);
		isSearchingEmblems = true;
		hasSearchedEmblems = true;
		try {
			emblemResults = await searchEmblemCards(emblemQuery, 48, filter);
		} finally {
			isSearchingEmblems = false;
		}
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-auto h-full"
	style="max-height: {innerHeight - 50}px; -webkit-overflow-scrolling: touch;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-2 py-2 sticky top-[-1px] bg-black"
		>
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('emblems_and_dungeons')}</span>
			<span class="text-gray-400 text-center text-base mt-2 w-90">{$_('explanation_emblems_and_dungeons')}</span>
		</div>

		<div class="w-full px-4 mt-1 mb-1">
			<div class="max-w-4xl mx-auto">
				<div class="bg-[#2d2f30] rounded-2xl p-3 mb-4">
					<div class="text-white text-sm font-semibold mb-2">{$_('emblem_recent_title')}</div>
					{#if ($emblemState.recent?.length ?? 0) > 0}
						<div class="flex flex-wrap gap-2">
							{#each $emblemState.recent as recentEmblem}
								<button
									class="bg-black/40 text-white text-xs px-3 py-1.5 rounded-full max-w-full truncate"
									title={recentEmblem.name}
									on:click={() => openEmblem(recentEmblem)}
								>
									{recentEmblem.name}
								</button>
							{/each}
						</div>
					{:else}
						<div class="text-gray-400 text-xs">{$_('emblem_recent_empty')}</div>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
					<button
						class="bg-[#2d2f30] rounded-2xl px-4 py-3 text-white flex flex-col items-center"
						on:click={() => openPresetEmblem('tltr', 'H13')}
						disabled={isSearchingEmblems}
					>
						<span class="mt-1 text-base text-center">
                            <TheRingerBearer />
                            {$_('emblem_ring_preset')}
                        </span>
					</button>
					<button
						class="bg-[#2d2f30] rounded-2xl px-4 py-3 text-white flex flex-col items-center"
						on:click={() => openPresetEmblem('tclb', '20')}
						disabled={isSearchingEmblems}
					>
						<span class="mt-1 text-base text-center">
                            <Initiative />
                            {$_('emblem_initiative_preset')}
                        </span>
					</button>
					<button
						class="bg-[#2d2f30] rounded-2xl px-4 py-3 text-white flex flex-col items-center"
						on:click={() => openPresetEmblem('tdft', '14')}
						disabled={isSearchingEmblems}
					>
						<span class="mt-1 text-base text-center">
                            <StartYourEngineSpeed />
                            {$_('emblem_speed_preset')}
                        </span>
					</button>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="flex flex-col md:flex-row gap-2 mb-1">
						<input
							bind:value={emblemQuery}
							type="text"
							autocomplete="off"
							class="flex-1 bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none"
							placeholder={$_('emblem_search_placeholder')}
							on:keypress={handleEmblemSearchKeyPress}
						/>
						<button
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50"
							on:click={() => runEmblemSearch('emblem')}
							disabled={isSearchingEmblems}
						>
							{isSearchingEmblems ? $_('scryfall_searching') : $_('emblem_search_button')}
						</button>
						<button
							class="bg-purple-700 hover:bg-purple-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50"
							on:click={() => runEmblemSearch('dungeon')}
							disabled={isSearchingEmblems}
						>
							{$_('emblem_search_dungeon_button')}
						</button>
					</div>

					{#if hasSearchedEmblems && emblemResults.length === 0 && !isSearchingEmblems}
						<div class="text-gray-300 text-sm">{$_('emblem_search_noresult')}</div>
					{/if}

					{#if emblemResults.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
							{#each emblemResults as emblem}
								<button
									class="bg-black/40 rounded-xl p-3 text-left text-white flex items-center gap-3"
									on:click={() => openEmblem(emblem)}
								>
									{#if emblem.faces[0]?.image}
										<img
											src={emblem.faces[0].image}
											alt={emblem.name}
											class="w-16 h-24 object-cover rounded"
										/>
									{/if}
									<div class="min-w-0">
										<div class="text-sm font-semibold truncate">{emblem.name}</div>
										{#if emblem.set_name}
											<div class="text-xs text-gray-300 truncate">{emblem.set_name}</div>
										{/if}
										<div class="text-xs text-gray-400 mt-1">
											{$_('emblem_faces_count')}: {emblem.faces.length}
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
