<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { archenemyState, loadSchemeDeck, openArchenemyModal } from '$lib/store/archenemy';
	import { searchSchemeCards, type ScryfallEmblemCard } from '$lib/utils/scryfall';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let searchQuery = '';
	let searchResults: ScryfallEmblemCard[] = [];
	let isSearching = false;
	let hasSearched = false;
	let innerHeight = 0;

	/**
	 * Loads the full Scheme card list (no query filter) and opens the modal.
	 */
	const handleLoadAll = async () => {
		vibrate(20);
		isSearching = true;
		try {
			const cards = await searchSchemeCards('', 200);
			if (cards.length > 0) {
				loadSchemeDeck(cards);
				openArchenemyModal();
				toggleIsMenuOpen('');
			}
		} finally {
			isSearching = false;
		}
	};

	const handleLoadPresetSet = async (setCode: string) => {
		vibrate(20);
		isSearching = true;
		try {
			const cards = await searchSchemeCards(`set:${setCode}`, 200);
			if (cards.length > 0) {
				loadSchemeDeck(cards);
				openArchenemyModal();
				toggleIsMenuOpen('');
			}
		} finally {
			isSearching = false;
		}
	};

	/**
	 * Searches Scheme cards with the current query and updates results.
	 */
	const handleSearch = async () => {
		vibrate(20);
		isSearching = true;
		hasSearched = true;
		try {
			searchResults = await searchSchemeCards(searchQuery, 200);
		} finally {
			isSearching = false;
		}
	};

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') handleSearch();
	};

	/**
	 * Loads the given cards as the scheme deck and opens the modal.
	 */
	const handleLoadResults = () => {
		vibrate(20);
		if (searchResults.length === 0) return;
		loadSchemeDeck(searchResults);
		openArchenemyModal();
		toggleIsMenuOpen('');
	};

	/**
	 * Opens the modal with the existing deck (if one is already loaded).
	 */
	const handleOpenExisting = () => {
		vibrate(20);
		openArchenemyModal();
		toggleIsMenuOpen('');
	};

	$: hasDeck = ($archenemyState.deck?.length ?? 0) > 0;
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
			<span class="text-white text-center text-3xl">{$_('archenemy_menu_title')}</span>
			<span class="text-gray-400 text-center text-sm mt-2 w-90">
				{$_('archenemy_menu_explanation')}
			</span>
		</div>

		<div class="w-full px-4 mt-1 mb-4">
			<div class="max-w-4xl mx-auto flex flex-col gap-4">
				<!-- Quick-start: load all schemes -->
				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">{$_('archenemy_quick_start_title')}</div>

					{#if hasDeck}
						<button
							type="button"
							class="w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-base transition-colors disabled:opacity-50"
							on:click={handleOpenExisting}
							disabled={isSearching}
						>
							😈 {$_('archenemy_continue_deck', {
								values: { count: $archenemyState.deck.length }
							})}
						</button>
					{/if}

					<button
						type="button"
						class="w-full py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-base transition-colors disabled:opacity-50"
						on:click={handleLoadAll}
						disabled={isSearching}
					>
						{isSearching ? $_('scryfall_searching') : `😈 ${$_('archenemy_load_all')}`}
					</button>
					<div class="grid grid-cols-3 gap-2">
						<button
							class="rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5"
							on:click={() => handleLoadPresetSet('DSC')}
							disabled={isSearching}>DSC</button
						>
						<button
							class="rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5"
							on:click={() => handleLoadPresetSet('OARC')}
							disabled={isSearching}>OARC</button
						>
						<button
							class="rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5"
							on:click={() => handleLoadPresetSet('OE01')}
							disabled={isSearching}>OE01</button
						>
					</div>
				</div>

				<!-- Search section -->
				<div class="bg-[#2d2f30] rounded-2xl p-4 flex flex-col gap-3">
					<div class="text-white font-semibold text-base">{$_('archenemy_search_title')}</div>
					<div class="flex gap-2">
						<input
							bind:value={searchQuery}
							type="text"
							autocomplete="off"
							class="flex-1 bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none"
							placeholder={$_('archenemy_search_placeholder')}
							on:keypress={handleKeyPress}
						/>
						<button
							type="button"
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50 transition-colors"
							on:click={handleSearch}
							disabled={isSearching}
						>
							{isSearching ? $_('scryfall_searching') : $_('archenemy_search_button')}
						</button>
					</div>

					{#if hasSearched && searchResults.length === 0 && !isSearching}
						<div class="text-gray-300 text-sm">{$_('archenemy_search_noresult')}</div>
					{/if}

					{#if searchResults.length > 0}
						<button
							type="button"
							class="w-full py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold text-sm transition-colors"
							on:click={handleLoadResults}
						>
							🃏 {$_('archenemy_load_results', { values: { count: searchResults.length } })}
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
						>📜 {$_('archenemy_rules_title')}</summary
					>
					<p class="whitespace-pre-line leading-relaxed mt-1">{$_('archenemy_rules_summary')}</p>
					<a
						href="https://mtg.wiki/page/Archenemy"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-2 inline-block text-indigo-400 hover:text-indigo-300 underline text-xs"
					>
						{$_('archenemy_rules_link')}
					</a>
				</details>
			</div>
		</div>
	</div>
</div>
