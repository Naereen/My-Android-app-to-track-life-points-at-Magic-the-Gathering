<script lang="ts">
	import {
		planechaseState,
		closePlanechaseModal,
		rollPlanarDie,
		nextPlane,
		prevPlane,
		reshuffleDeck,
		togglePlanechaseRotation,
		dismissDieResult,
		type PlanarDieResult,
		extractChaosOracleText
	} from '$lib/store/planechase';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let fullscreen = false;
	const PLANECHASE_CARD_BACK_URL =
		'https://backs.scryfall.io/large/7/8/7840c131-f96b-4700-9347-2215c43156e6.jpg?1665006192';

	$: deck = $planechaseState.deck;
	$: currentIndex = $planechaseState.currentIndex;
	$: currentCard = deck[currentIndex] ?? null;
	$: currentFace = currentCard?.faces?.[0] ?? null;
	$: rotated = $planechaseState.rotated;
	$: lastDieResult = $planechaseState.lastDieResult;
	$: isChaos = lastDieResult === 'chaos';
	$: isPlaneswalk = lastDieResult === 'planeswalk';
	$: displayedCardImage = currentFace?.image || PLANECHASE_CARD_BACK_URL;
	$: chaosOracleText = extractChaosOracleText(currentFace?.oracleText ?? '');

	const handleRollDie = () => {
		vibrate(30);
		rollPlanarDie();
	};

	const handleClose = () => {
		fullscreen = false;
		closePlanechaseModal();
	};

	const handleToggleFullscreen = () => {
		fullscreen = !fullscreen;
	};

	const handleNextPlane = () => {
		vibrate(20);
		nextPlane();
	};

	const handlePrevPlane = () => {
		vibrate(20);
		prevPlane();
	};

	const handleReshuffle = () => {
		vibrate(20);
		reshuffleDeck();
	};

	const handleRotate = () => {
		vibrate(20);
		togglePlanechaseRotation();
	};

	const handleDismiss = () => {
		dismissDieResult();
	};

	const dieResultLabel = (result: PlanarDieResult | null): string => {
		if (result === 'blank') return $_('planechase_die_blank');
		if (result === 'planeswalk') return $_('planechase_die_planeswalk');
		if (result === 'chaos') return $_('planechase_die_chaos');
		return '';
	};

	const dieResultEmoji = (result: PlanarDieResult | null): string => {
		if (result === 'blank') return '⬜';
		if (result === 'planeswalk') return '🌀';
		if (result === 'chaos') return '🔥';
		return '';
	};
</script>

<!-- Backdrop -->
<div class="bg-black/80 absolute w-full h-full top-0 left-0 flex justify-center items-center z-50">
	<div
		class="relative bg-[#1a1c2e] rounded-[1.75rem] w-[97vw] max-h-[97vh] overflow-y-auto p-4 flex flex-col items-center gap-3"
		role="dialog"
		aria-label={$_('planechase_modal_title')}
	>
		<!-- Header row -->
		<div class="w-full flex items-center justify-between">
			<span class="text-white text-2xl font-bold">{$_('planechase_modal_title')}</span>
			<div class="flex gap-2 items-center">
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleToggleFullscreen}
					title={fullscreen ? $_('planechase_close') : $_('planechase_modal_title')}
					aria-label={fullscreen ? $_('planechase_close') : $_('planechase_modal_title')}
				>
					{#if fullscreen}🗗{:else}⛶{/if}
				</button>
				<!-- Rotate button -->
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleRotate}
					title={$_('planechase_rotate')}
					aria-label={$_('planechase_rotate')}
				>
					🔄
				</button>
				<!-- Reshuffle button -->
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600/90 text-xl text-white shadow transition-transform hover:scale-105"
					on:click={handleReshuffle}
					title={$_('planechase_reshuffle')}
					aria-label={$_('planechase_reshuffle')}
				>
					🔀
				</button>
				<!-- Close button -->
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/95 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105"
					on:click={handleClose}
					aria-label={$_('planechase_close')}
					title={$_('planechase_close')}
				>
					❌
				</button>
			</div>
		</div>

		{#if deck.length === 0}
			<div class="text-gray-400 text-center py-10 text-base">
				{$_('planechase_no_deck')}
			</div>
		{:else}
			<!-- Card counter -->
			<div class="text-gray-300 text-sm">
				{$_('planechase_card_counter', {
					values: { current: currentIndex + 1, total: deck.length }
				})}
			</div>

			<!-- Card image and oracle text — rotated for opposite-side players -->
			<div
				class="w-full flex flex-col items-center gap-2 transition-transform duration-300"
				style={rotated ? 'transform: rotate(180deg);' : ''}
			>
				<!-- Card image -->
				{#if displayedCardImage}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img
						src={displayedCardImage}
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
						class:rotate-90={!fullscreen}
						on:click={handleToggleFullscreen}
						draggable="false"
					/>
					{#if fullscreen}
						<button
							type="button"
							class="fixed right-4 top-4 z-[61] rounded-full bg-red-600/95 px-3 py-2 text-sm font-bold text-white shadow-xl"
							on:click={handleToggleFullscreen}
						>
							❌
						</button>
					{/if}
				{:else}
					<div class="text-gray-400 text-sm py-4">{$_('planechase_no_image')}</div>
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
			<!-- end rotatable card area -->

			<!-- Navigation row -->
			<div class="flex gap-3 w-full justify-center">
				<button
					type="button"
					class="flex-1 max-w-[8rem] py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors"
					on:click={handlePrevPlane}
				>
					⬅️ {$_('planechase_prev')}
				</button>
				<!-- Roll chaos die -->
				<button
					type="button"
					class="flex-1 max-w-[10rem] py-2 rounded-xl bg-purple-700 text-white text-base font-bold shadow hover:bg-purple-600 transition-colors"
					on:click={handleRollDie}
				>
					🎲 {$_('planechase_roll_die')}
				</button>
				<button
					type="button"
					class="flex-1 max-w-[8rem] py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors"
					on:click={handleNextPlane}
				>
					{$_('planechase_next')} ➡️
				</button>
			</div>

			<!-- Die result notification -->
			{#if lastDieResult}
				<div
					class="w-full rounded-2xl px-4 py-3 text-center text-white font-bold text-lg flex flex-col gap-1"
					class:bg-gray-700={lastDieResult === 'blank'}
					class:bg-purple-800={isPlaneswalk}
					class:bg-red-800={isChaos}
				>
					<div class="text-3xl">{dieResultEmoji(lastDieResult)}</div>
					<div>{dieResultLabel(lastDieResult)}</div>
					{#if isChaos && chaosOracleText}
						<div
							class="text-sm font-normal text-gray-200 mt-1 text-left whitespace-pre-line bg-black/25 rounded-xl px-3 py-2"
						>
							{chaosOracleText}
						</div>
					{/if}
					{#if isPlaneswalk}
						<div class="text-sm font-normal text-gray-200 mt-1">
							{$_('planechase_planeswalk_hint')}
						</div>
					{/if}
					<button
						type="button"
						class="mt-2 text-sm text-gray-300 underline"
						on:click={handleDismiss}
					>
						{$_('planechase_dismiss')}
					</button>
				</div>
			{/if}
		{/if}

		<!-- Rules reminder -->
		<details class="w-full rounded-2xl bg-black/30 px-4 py-3 text-gray-300 text-xs">
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
