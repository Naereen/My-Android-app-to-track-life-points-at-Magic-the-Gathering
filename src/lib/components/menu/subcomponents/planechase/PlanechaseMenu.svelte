<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import {
		deletePlanarSelection,
		loadPlanarDeck,
		openPlanechaseModal,
		planechaseState,
		savePlanarSelection,
		setSelectedPlanarSetCodes
	} from '$lib/store/planechase';
	import { planechaseOfficialPresets } from '$lib/utils/officialDeckPresets';
	import { searchPlaneCards, type ScryfallEmblemCard } from '$lib/utils/scryfall';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	const officialPresets = planechaseOfficialPresets;

	let searchQuery = '';
	let searchResults: ScryfallEmblemCard[] = [];
	let isSearching = false;
	let hasSearched = false;
	let innerHeight = 0;
	let savedSelectionName = '';

	/**
	 * Loads the full Plane/Phenomenon card list (no query filter) and opens the modal.
	 */
	const handleLoadAll = async () => {
		vibrate(20);
		isSearching = true;
		try {
			const cards = await searchPlaneCards('', 200);
			if (cards.length > 0) {
				loadPlanarDeck(cards);
				openPlanechaseModal();
				toggleIsMenuOpen('');
			}
		} finally {
			isSearching = false;
		}
	};

	const loadSelectedSets = async (setCodes: string[]) => {
		const selectedSetCodes = Array.from(new Set(setCodes));
		if (selectedSetCodes.length === 0) return;

		vibrate(20);
		isSearching = true;
		try {
			const query = selectedSetCodes.map((setCode) => `set:${setCode}`).join(' or ');
			const cards = await searchPlaneCards(query, 200);
			if (cards.length > 0) {
				loadPlanarDeck(cards);
				openPlanechaseModal();
				toggleIsMenuOpen('');
			}
		} finally {
			isSearching = false;
		}
	};

	/**
	 * Searches Plane/Phenomenon cards with the current query and updates results.
	 */
	const handleSearch = async () => {
		vibrate(20);
		isSearching = true;
		hasSearched = true;
		try {
			searchResults = await searchPlaneCards(searchQuery, 200);
		} finally {
			isSearching = false;
		}
	};

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') handleSearch();
	};

	/**
	 * Loads the given cards as the planar deck and opens the modal.
	 */
	const handleLoadResults = () => {
		vibrate(20);
		if (searchResults.length === 0) return;
		loadPlanarDeck(searchResults);
		openPlanechaseModal();
		toggleIsMenuOpen('');
	};

	/**
	 * Opens the modal with the existing deck (if one is already loaded).
	 */
	const handleOpenExisting = () => {
		vibrate(20);
		openPlanechaseModal();
		toggleIsMenuOpen('');
	};

	const handleTogglePreset = (setCode: string) => {
		vibrate(10);
		const nextCodes = selectedSetCodes.includes(setCode)
			? selectedSetCodes.filter((code) => code !== setCode)
			: [...selectedSetCodes, setCode];
		setSelectedPlanarSetCodes(nextCodes);
	};

	const handleToggleAllPresets = () => {
		vibrate(10);
		setSelectedPlanarSetCodes(areAllPresetsSelected ? [] : officialPresets.map(({ code }) => code));
	};

	const handleSaveSelection = () => {
		vibrate(20);
		savePlanarSelection(savedSelectionName, selectedSetCodes);
		if (savedSelectionName.trim() && selectedSetCodes.length > 0) {
			savedSelectionName = '';
		}
	};

	const handleDeleteSavedSelection = (name: string) => {
		vibrate(20);
		deletePlanarSelection(name);
	};

	const handleLoadSavedSelection = async (setCodes: string[]) => {
		setSelectedPlanarSetCodes(setCodes);
		await loadSelectedSets(setCodes);
	};

	const getSelectionCardCount = (setCodes: string[]) =>
		officialPresets.reduce(
			(total, preset) => total + (setCodes.includes(preset.code) ? preset.cardCount : 0),
			0
		);

	$: hasDeck = ($planechaseState.deck?.length ?? 0) > 0;
	$: selectedSetCodes = $planechaseState.selectedSetCodes ?? [];
	$: savedSelections = $planechaseState.savedSelections ?? [];
	$: allPresetCodes = officialPresets.map(({ code }) => code);
	$: areAllPresetsSelected = allPresetCodes.every((code) => selectedSetCodes.includes(code));
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-auto h-full"
	style="max-height: {innerHeight - 50}px; -webkit-overflow-scrolling: touch;"
>
	<div class="flex flex-col">
		<!-- Title bar -->
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
			<span class="text-white text-center text-3xl">🌀 {$_('planechase_menu_title')}</span>
			<span class="text-gray-400 text-center text-sm mt-2 w-90">
				{$_('planechase_menu_explanation')}
			</span>
		</div>

		<div class="w-full px-4 mt-1 mb-4">
			<div class="max-w-4xl mx-auto flex flex-col gap-4">
				<!-- Quick-start: load all planes -->
				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">{$_('planechase_quick_start_title')}</div>

					{#if hasDeck}
						<button
							type="button"
							class="w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-base transition-colors disabled:opacity-50"
							on:click={handleOpenExisting}
							disabled={isSearching}
						>
							🗺️ {$_('planechase_continue_deck', {
								values: { count: $planechaseState.deck.length }
							})}
						</button>
					{/if}

					<button
						type="button"
						class="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-base transition-colors disabled:opacity-50"
						on:click={handleLoadAll}
						disabled={isSearching}
					>
						{isSearching ? $_('scryfall_searching') : `🌐 ${$_('planechase_load_all')}`}
					</button>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">
						{$_('custom_deck_official_sets_title')}
					</div>
					<button
						type="button"
						class="w-full rounded-xl bg-black/40 px-3 py-3 text-left text-white flex items-center justify-between gap-3"
						on:click={handleToggleAllPresets}
						disabled={isSearching}
					>
						<div class="min-w-0">
							<div class="text-sm font-semibold">{$_('custom_deck_select_all_sets')}</div>
							<div class="text-xs text-gray-400">
								{selectedSetCodes.length} / {officialPresets.length}
							</div>
						</div>
						<div
							class={`h-8 w-8 rounded-lg border-2 flex items-center justify-center text-lg ${
								areAllPresetsSelected
									? 'border-cyan-400 text-white'
									: 'border-gray-500 text-transparent'
							}`}
						>
							✓
						</div>
					</button>

					<div class="flex flex-col gap-2">
						{#each officialPresets as preset}
							<button
								type="button"
								class="w-full rounded-xl bg-black/40 px-3 py-3 text-left text-white flex items-center justify-between gap-3"
								on:click={() => handleTogglePreset(preset.code)}
								disabled={isSearching}
							>
								<div class="min-w-0">
									<div class="text-sm font-semibold truncate">{preset.name}</div>
									<div class="text-xs text-gray-400">
										{$_('custom_deck_cards_count', { values: { count: preset.cardCount } })}
									</div>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									<div class="text-sm text-gray-300">
										{selectedSetCodes.includes(preset.code)
											? preset.cardCount
											: 0}/{preset.cardCount}
									</div>
									<div
										class={`h-8 w-8 rounded-lg border-2 flex items-center justify-center text-lg ${
											selectedSetCodes.includes(preset.code)
												? 'border-cyan-400 text-white'
												: 'border-gray-500 text-transparent'
										}`}
									>
										✓
									</div>
								</div>
							</button>
						{/each}
					</div>

					<button
						type="button"
						class="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-base transition-colors disabled:opacity-50"
						on:click={() => loadSelectedSets(selectedSetCodes)}
						disabled={isSearching || selectedSetCodes.length === 0}
					>
						{isSearching ? $_('scryfall_searching') : $_('custom_deck_load_selected')}
					</button>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">{$_('custom_deck_saved_title')}</div>
					<div class="flex gap-2">
						<input
							bind:value={savedSelectionName}
							type="text"
							autocomplete="off"
							class="flex-1 bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none"
							placeholder={$_('custom_deck_name_placeholder')}
						/>
						<button
							type="button"
							class="bg-emerald-700 hover:bg-emerald-600 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50 transition-colors"
							on:click={handleSaveSelection}
							disabled={selectedSetCodes.length === 0 || !savedSelectionName.trim()}
						>
							{$_('custom_deck_save_current')}
						</button>
					</div>

					{#if savedSelections.length === 0}
						<div class="text-gray-300 text-sm">{$_('custom_deck_saved_empty')}</div>
					{:else}
						<div class="flex flex-col gap-2">
							{#each savedSelections as selection (selection.name)}
								<div class="rounded-xl bg-black/40 px-3 py-3 flex items-center gap-3">
									<button
										type="button"
										class="flex-1 min-w-0 text-left"
										on:click={() => handleLoadSavedSelection(selection.setCodes)}
									>
										<div class="text-white text-sm font-semibold truncate">{selection.name}</div>
										<div class="text-xs text-gray-400 truncate">
											{getSelectionCardCount(selection.setCodes)} • {selection.setCodes.join(', ')}
										</div>
									</button>
									<button
										type="button"
										class="shrink-0 rounded-full border border-pink-500/70 px-3 py-2 text-pink-300 text-xs"
										on:click={() => handleDeleteSavedSelection(selection.name)}
									>
										{$_('custom_deck_delete')}
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Search section -->
				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">{$_('planechase_search_title')}</div>
					<div class="flex gap-2">
						<input
							bind:value={searchQuery}
							type="text"
							autocomplete="off"
							class="flex-1 bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none"
							placeholder={$_('planechase_search_placeholder')}
							on:keypress={handleKeyPress}
						/>
						<button
							type="button"
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50 transition-colors"
							on:click={handleSearch}
							disabled={isSearching}
						>
							{isSearching ? $_('scryfall_searching') : $_('planechase_search_button')}
						</button>
					</div>

					{#if hasSearched && searchResults.length === 0 && !isSearching}
						<div class="text-gray-300 text-sm">{$_('planechase_search_noresult')}</div>
					{/if}

					{#if searchResults.length > 0}
						<button
							type="button"
							class="w-full py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm transition-colors"
							on:click={handleLoadResults}
						>
							🃏 {$_('planechase_load_results', { values: { count: searchResults.length } })}
						</button>

						<div class="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
							{#each searchResults as card (card.id)}
								<div class="bg-black/40 rounded-xl p-2 flex flex-col items-center gap-1">
									{#if card.faces[0]?.image}
										<img
											src={card.faces[0].image}
											alt={card.name}
											class="w-full rounded object-contain max-h-36"
											draggable="false"
										/>
									{/if}
									<div class="text-white text-xs font-semibold text-center truncate w-full">
										{card.name}
									</div>
									{#if card.set_name}
										<div class="text-gray-400 text-[10px] truncate w-full text-center">
											{card.set_name}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Rules reminder -->
				<details class="bg-[#2d2f30] rounded-2xl p-4 text-gray-300 text-xs">
					<summary class="cursor-pointer font-bold text-white text-sm"
						>📜 {$_('planechase_rules_title')}</summary
					>
					<p class="whitespace-pre-line leading-relaxed mt-1">{$_('planechase_rules_summary')}</p>
					<a
						href="https://mtg.wiki/page/Planechase_(format)"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-2 inline-block text-indigo-400 hover:text-indigo-300 underline text-xs"
					>
						{$_('planechase_rules_link')}
					</a>
				</details>
			</div>
		</div>
	</div>
</div>
