<script lang="ts">
	import { scryfallModalData, closeScryfallModal } from '$lib/store/modal';
	import { _ } from 'svelte-i18n';

	type ScryfallCard = {
		id: string;
		name: string;
		set_name: string;
		artist: string;
		image_uris?: { normal?: string; large?: string; png?: string };
		card_faces?: Array<{ image_uris?: { normal?: string; large?: string; png?: string } }>;
		oracle_text?: string;
		rulings_uri: string;
		prints_search_uri: string;
	};

	type Ruling = {
		published_at: string;
		comment: string;
	};

	let query = '';
	let isSearching = false;
	let results: ScryfallCard[] = [];
	let totalCards = 0;
	let searchError = false;

	// Per-card expanded state: 'rulings' | 'printings' | null
	let expandedCard: string | null = null;
	let expandedMode: 'rulings' | 'printings' | null = null;
	let rulings: Ruling[] = [];
	let printings: ScryfallCard[] = [];
	let isLoadingExpanded = false;

	// Fullscreen image overlay
	let fullscreenImageUrl: string | null = null;

	function getCardImage(card: ScryfallCard): string | null {
		if (card.image_uris?.normal) return card.image_uris.normal;
		if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
		return null;
	}

	function getLargeCardImage(card: ScryfallCard): string | null {
		if (card.image_uris?.large) return card.image_uris.large;
		if (card.image_uris?.png) return card.image_uris.png;
		if (card.image_uris?.normal) return card.image_uris.normal;
		if (card.card_faces?.[0]?.image_uris?.large) return card.card_faces[0].image_uris.large;
		if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
		return null;
	}

	async function doSearch() {
		if (!query.trim()) return;
		isSearching = true;
		searchError = false;
		results = [];
		totalCards = 0;
		expandedCard = null;
		expandedMode = null;
		rulings = [];
		printings = [];
		try {
			const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query.trim())}&unique=cards`;
			const resp = await fetch(url);
			if (!resp.ok) {
				searchError = true;
			} else {
				const data = await resp.json();
				results = data.data ?? [];
				totalCards = data.total_cards ?? results.length;
			}
		} catch {
			searchError = true;
		} finally {
			isSearching = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') doSearch();
	}

	async function toggleRulings(card: ScryfallCard) {
		if (expandedCard === card.id && expandedMode === 'rulings') {
			expandedCard = null;
			expandedMode = null;
			return;
		}
		expandedCard = card.id;
		expandedMode = 'rulings';
		rulings = [];
		printings = [];
		isLoadingExpanded = true;
		try {
			const resp = await fetch(card.rulings_uri);
			if (resp.ok) {
				const data = await resp.json();
				rulings = data.data ?? [];
			}
		} catch {
			// ignore
		} finally {
			isLoadingExpanded = false;
		}
	}

	async function togglePrintings(card: ScryfallCard) {
		if (expandedCard === card.id && expandedMode === 'printings') {
			expandedCard = null;
			expandedMode = null;
			return;
		}
		expandedCard = card.id;
		expandedMode = 'printings';
		rulings = [];
		printings = [];
		isLoadingExpanded = true;
		try {
			const printsUrl = new URL(card.prints_search_uri);
			printsUrl.searchParams.set('unique', 'prints');
			const resp = await fetch(printsUrl.toString());
			if (resp.ok) {
				const data = await resp.json();
				printings = data.data ?? [];
			}
		} catch {
			// ignore
		} finally {
			isLoadingExpanded = false;
		}
	}

	function openFullscreen(card: ScryfallCard) {
		const large = getLargeCardImage(card);
		if (large) fullscreenImageUrl = large;
	}

	function openFullscreenUrl(url: string) {
		fullscreenImageUrl = url;
	}

	function closeFullscreen() {
		fullscreenImageUrl = null;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
			closeScryfallModal();
		}
	}

	function handleFullscreenKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
			closeFullscreen();
		}
	}
</script>

{#if $scryfallModalData.isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[300] flex items-center justify-center bg-black/80"
		role="button"
		tabindex="0"
		aria-label={$_('close_modal') || 'Close'}
		on:click={closeScryfallModal}
		on:keydown={handleBackdropKeydown}
	>
		<!-- Modal panel -->
		<div
			class="relative bg-gray-900 text-white w-full max-w-lg mx-2 rounded-2xl flex flex-col overflow-hidden"
			style="max-height: 90vh;"
			role="dialog"
			aria-modal="true"
			on:click|stopPropagation
			on:keydown={(e) => {
				if (e.key === 'Escape') closeScryfallModal();
			}}
			tabindex="0"
		>
			<!-- Close button -->
			<button
				class="absolute right-3 top-3 z-10 text-white text-2xl leading-none"
				on:click={closeScryfallModal}
				on:contextmenu|preventDefault
				draggable="false"
				aria-label={$_('close_modal') || 'Close'}
			>
				✕
			</button>

			<!-- Search bar -->
			<div class="px-4 pt-4 pb-3 flex-shrink-0">
				<div class="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
					<div class="flex flex-col flex-1 min-w-0">
						<span class="text-xs text-gray-400 leading-none mb-0.5"
							>{$_('search_scryfall_title') || 'Search Scryfall'}</span
						>
						<input
							class="bg-transparent text-white text-lg outline-none w-full placeholder-gray-500"
							placeholder={$_('scryfall_search') || 'Search card name'}
							bind:value={query}
							on:keydown={handleKeydown}
							aria-label={$_('scryfall_search') || 'Search card name'}
						/>
					</div>
					<button
						class="flex-shrink-0 text-2xl"
						on:click={doSearch}
						aria-label={$_('search_scryfall_title') || 'Search'}
					>
						🔍
					</button>
				</div>
			</div>

			<!-- Status line -->
			{#if isSearching}
				<p class="text-center text-sm text-gray-400 py-2 flex-shrink-0">
					{$_('scryfall_searching') || 'Searching Scryfall...'}
				</p>
			{:else if searchError}
				<p class="text-center text-sm text-yellow-400 py-2 px-4 flex-shrink-0">
					{$_('scryfall_search_noresult') ||
						'Scryfall syntax is supported. No result. Offline? Try another search?'}
				</p>
			{:else if results.length > 0}
				<p class="text-center text-sm text-gray-400 py-1 flex-shrink-0">
					{totalCards}
					{$_('scryfall_results') || 'results'}
				</p>
			{/if}

			<!-- Results list -->
			<div class="overflow-y-auto flex-1 px-3 pb-4 space-y-3">
				{#each results as card (card.id)}
					{@const thumb = getCardImage(card)}
					<div class="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
						<div class="flex gap-3 items-start">
							<!-- Card info -->
							<div class="flex-1 min-w-0">
								<div class="text-base font-bold leading-tight">{card.name}</div>
								<div class="text-sm text-gray-300">{card.set_name}</div>
								<div class="text-sm text-gray-400">{card.artist}</div>
								<div class="text-xs text-gray-500 mt-0.5">© Wizards of the Coast</div>
								<!-- Rulings / Printings buttons -->
								<div class="flex gap-2 mt-2 flex-wrap">
									<button
										class="px-3 py-1 rounded-full text-sm font-medium border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors"
										class:bg-blue-700={expandedCard === card.id && expandedMode === 'rulings'}
										class:border-blue-500={expandedCard === card.id && expandedMode === 'rulings'}
										on:click={() => toggleRulings(card)}
									>
										{$_('scryfall_rulings') || 'Rulings'}
									</button>
									<button
										class="px-3 py-1 rounded-full text-sm font-medium border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors"
										class:bg-blue-700={expandedCard === card.id && expandedMode === 'printings'}
										class:border-blue-500={expandedCard === card.id && expandedMode === 'printings'}
										on:click={() => togglePrintings(card)}
									>
										{$_('scryfall_printings') || 'Printings'}
									</button>
								</div>
							</div>
							<!-- Card thumbnail -->
							{#if thumb}
								<button
									class="flex-shrink-0 w-20 rounded-lg overflow-hidden focus:outline-none"
									on:click={() => openFullscreen(card)}
									title={$_('scryfall_fullscreen') || 'View fullscreen'}
									aria-label={$_('scryfall_fullscreen') || 'View fullscreen'}
								>
									<img
										src={thumb}
										alt={card.name}
										class="w-full h-auto object-cover"
										loading="lazy"
									/>
								</button>
							{/if}
						</div>

						<!-- Expanded rulings/printings panel -->
						{#if expandedCard === card.id}
							<div class="mt-1">
								{#if isLoadingExpanded}
									<p class="text-xs text-gray-400 text-center py-2">
										{$_('scryfall_loading') || 'Loading...'}
									</p>
								{:else if expandedMode === 'rulings'}
									{#if card.oracle_text}
										<div class="bg-gray-900 rounded-lg p-2 mb-2">
											<p class="text-xs text-gray-400 text-center mb-1">
												{$_('scryfall_oracle_text') || 'Oracle Text'}
											</p>
											<hr class="border-gray-700 mb-1" />
											<p class="text-sm text-gray-200 whitespace-pre-line">{card.oracle_text}</p>
										</div>
									{/if}
									{#each rulings as ruling}
										<div class="bg-gray-900 rounded-lg p-2 mb-2">
											<p class="text-xs text-gray-400 text-center mb-1">
												{$_('scryfall_ruling') || 'Ruling'} ({ruling.published_at})
											</p>
											<hr class="border-gray-700 mb-1" />
											<p class="text-sm text-gray-200">{ruling.comment}</p>
										</div>
									{/each}
									{#if !card.oracle_text && rulings.length === 0}
										<p class="text-xs text-gray-400 text-center py-1">
											{$_('scryfall_no_rulings') || 'No rulings available.'}
										</p>
									{/if}
								{:else if expandedMode === 'printings'}
									<div class="grid grid-cols-3 gap-2">
										{#each printings as printing}
											{@const pThumb = getCardImage(printing)}
											{#if pThumb}
												<button
													class="rounded-lg overflow-hidden focus:outline-none"
													on:click={() => {
														const large = getLargeCardImage(printing);
														if (large) openFullscreenUrl(large);
													}}
													title={printing.set_name}
													aria-label={printing.set_name}
												>
													<img
														src={pThumb}
														alt={printing.name}
														class="w-full h-auto object-cover"
														loading="lazy"
													/>
												</button>
											{/if}
										{/each}
									</div>
									{#if printings.length === 0}
										<p class="text-xs text-gray-400 text-center py-1">
											{$_('scryfall_no_printings') || 'No other printings found.'}
										</p>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Fullscreen image overlay -->
	{#if fullscreenImageUrl}
		<div
			class="fixed inset-0 z-[400] flex items-center justify-center bg-black/90"
			role="button"
			tabindex="0"
			aria-label={$_('close_modal') || 'Close'}
			on:click={closeFullscreen}
			on:keydown={handleFullscreenKeydown}
		>
			<button
				class="absolute top-4 right-4 text-white text-3xl z-10 leading-none"
				on:click={closeFullscreen}
				aria-label={$_('close_modal') || 'Close'}
			>
				❌
			</button>
			<img
				src={fullscreenImageUrl}
				alt="Card fullscreen"
				class="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
				on:click|stopPropagation
			/>
		</div>
	{/if}
{/if}
