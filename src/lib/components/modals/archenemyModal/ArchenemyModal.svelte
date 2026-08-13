<script lang="ts">
	import {
		archenemyState,
		closeArchenemyModal,
		revealNextScheme,
		nextScheme,
		prevScheme,
		reshuffleSchemeDeck,
		abandonOngoingScheme,
		abandonOngoingSchemeByIndex
	} from '$lib/store/archenemy';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let fullscreen = false;
	let rotated = false;

	$: deck = $archenemyState.deck;
	$: currentIndex = $archenemyState.currentIndex;
	$: currentCard = deck[currentIndex] ?? null;
	$: currentFace = currentCard?.faces?.[0] ?? null;
	$: isOngoing = $archenemyState.isOngoing;
	$: activeOngoingSchemes = $archenemyState.activeOngoingSchemes ?? [];

	const handleReveal = () => {
		vibrate(30);
		revealNextScheme();
	};

	const handleClose = () => {
		fullscreen = false;
		closeArchenemyModal();
	};

	const handleToggleFullscreen = () => {
		fullscreen = !fullscreen;
	};

	const handleRotate = () => {
		vibrate(20);
		rotated = !rotated;
	};

	const handleNextScheme = () => {
		vibrate(20);
		nextScheme();
	};

	const handlePrevScheme = () => {
		vibrate(20);
		prevScheme();
	};

	const handleReshuffle = () => {
		vibrate(20);
		reshuffleSchemeDeck();
	};

	const handleAbandon = () => {
		vibrate(20);
		abandonOngoingScheme();
	};

	const handleAbandonByIndex = (index: number) => {
		vibrate(20);
		abandonOngoingSchemeByIndex(index);
	};
</script>

<!-- Backdrop -->
<div class="bg-black/80 absolute w-full h-full top-0 left-0 flex justify-center items-center z-50">
	<div
		class="relative bg-[#1a0a0a] rounded-[1.75rem] w-[97vw] max-h-[97vh] overflow-y-auto p-4 flex flex-col items-center gap-3"
		role="dialog"
		aria-label={$_('archenemy_modal_title')}
	>
		<!-- Header row -->
		<div class="w-full flex items-center justify-between">
			<span class="text-white text-2xl font-bold">😈 {$_('archenemy_modal_title')}</span>
			<div class="flex gap-2 items-center">
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleToggleFullscreen}
					title={fullscreen ? $_('archenemy_close') : $_('archenemy_modal_title')}
					aria-label={fullscreen ? $_('archenemy_close') : $_('archenemy_modal_title')}
				>
					{#if fullscreen}🗗{:else}⛶{/if}
				</button>
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleRotate}
					title={$_('archenemy_rotate')}
					aria-label={$_('archenemy_rotate')}
				>
					🔄
				</button>
				<!-- Reshuffle button -->
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleReshuffle}
					title={$_('archenemy_reshuffle')}
					aria-label={$_('archenemy_reshuffle')}
				>
					🔀
				</button>
				<!-- Close button -->
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/95 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105"
					on:click={handleClose}
					aria-label={$_('archenemy_close')}
					title={$_('archenemy_close')}
				>
					❌
				</button>
			</div>
		</div>

		{#if deck.length === 0}
			<div class="text-gray-400 text-center py-10 text-base">
				{$_('archenemy_no_deck')}
			</div>
		{:else}
			<!-- Card counter -->
			<div class="text-gray-300 text-sm">
				{$_('archenemy_card_counter', {
					values: { current: currentIndex + 1, total: deck.length }
				})}
			</div>

			<!-- Ongoing schemes horizontal scrollable list -->
			{#if activeOngoingSchemes.length > 0}
				<div class="w-full flex flex-col gap-1">
					<div class="text-yellow-200 text-xs font-semibold px-1">
						⚠️ {$_('archenemy_ongoing_schemes_title')}
					</div>
					<div class="flex flex-row gap-2 overflow-x-auto pb-1" style="scroll-snap-type: x mandatory;">
						{#each activeOngoingSchemes as ongoingCard, i}
							<div
								class="relative flex-shrink-0 rounded-xl overflow-hidden border border-yellow-500/60"
								style="width: 7rem; scroll-snap-align: start;"
							>
								{#if ongoingCard.faces?.[0]?.image}
									<img
										src={ongoingCard.faces[0].image}
										alt={ongoingCard.name ?? ''}
										class="w-full h-auto object-contain block"
										draggable="false"
									/>
								{:else}
									<div
										class="w-full h-24 flex items-center justify-center bg-black/50 text-gray-400 text-xs text-center px-1"
									>
										{ongoingCard.name ?? ''}
									</div>
								{/if}
								<button
									type="button"
									class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 text-white text-xs font-black flex items-center justify-center shadow"
									on:click={() => handleAbandonByIndex(i)}
									aria-label={$_('archenemy_abandon_ongoing')}
									title={$_('archenemy_abandon_ongoing')}
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Card image and oracle text -->
			<div
				class="w-full flex flex-col items-center gap-2 transition-transform duration-300"
				style={rotated ? 'transform: rotate(180deg);' : ''}
			>
				<!-- Card image -->
				{#if currentFace?.image}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img
						src={currentFace.image}
						alt={currentCard?.name ?? ''}
						class="rounded-xl object-contain cursor-pointer transition-all"
						class:w-full={!fullscreen}
						class:max-h-80={!fullscreen}
						class:fixed={fullscreen}
						class:inset-0={fullscreen}
						class:z-60={fullscreen}
						class:w-screen={fullscreen}
						class:h-screen={fullscreen}
						class:max-h-screen={fullscreen}
						class:bg-black={fullscreen}
						on:click={handleToggleFullscreen}
						draggable="false"
					/>
					{#if fullscreen}
						<button
							type="button"
							class="fixed right-4 top-4 z-[61] rounded-full bg-red-600/95 px-3 py-2 text-sm font-bold text-white shadow-xl"
							on:click={handleToggleFullscreen}
							aria-label={$_('archenemy_close')}
							title={$_('archenemy_close')}
						>
							❌
						</button>
					{/if}
				{:else}
					<div class="text-gray-400 text-sm py-4">{$_('archenemy_no_image')}</div>
				{/if}

				<!-- Card name and oracle text -->
				{#if currentCard}
					<div class="w-full text-center">
						<div class="text-white font-bold text-lg">{currentCard.name}</div>
						{#if currentFace?.typeLine}
							<div class="text-gray-400 text-xs mt-0.5">{currentFace.typeLine}</div>
						{/if}
						{#if currentFace?.oracleText}
							<div
								class="text-gray-200 text-sm mt-1 text-left bg-black/30 rounded-xl px-3 py-2 whitespace-pre-line"
							>
								{currentFace.oracleText}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Action buttons -->
			<div class="flex gap-3 w-full justify-center flex-wrap">
				<button
					type="button"
					class="flex-1 max-w-[7rem] py-2 rounded-xl bg-red-900/70 text-white text-sm font-semibold hover:bg-red-800/80 transition-colors"
					on:click={handlePrevScheme}
				>
					⬅️ {$_('archenemy_prev')}
				</button>

				<!-- Reveal / activate scheme -->
				<button
					type="button"
					class="flex-1 max-w-[12rem] py-2 rounded-xl bg-red-800 text-white text-base font-bold shadow hover:bg-red-700 transition-colors"
					on:click={handleReveal}
				>
					😈 {$_('archenemy_activate')}
				</button>

				<button
					type="button"
					class="flex-1 max-w-[7rem] py-2 rounded-xl bg-green-900/70 text-white text-sm font-semibold hover:bg-green-800/80 transition-colors"
					on:click={handleNextScheme}
				>
					{$_('archenemy_next')} ➡️
				</button>
			</div>

			<!-- Abandon ongoing scheme button (for current card if ongoing) -->
			{#if isOngoing}
				<button
					type="button"
					class="w-full max-w-xs py-2 rounded-xl bg-orange-700 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
					on:click={handleAbandon}
				>
					🗑️ {$_('archenemy_abandon_ongoing')}
				</button>
			{/if}
		{/if}

		<!-- Rules reminder -->
		<details class="w-full rounded-2xl bg-black/30 px-4 py-3 text-gray-300 text-xs">
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
