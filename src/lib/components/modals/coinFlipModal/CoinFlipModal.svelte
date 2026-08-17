<script lang="ts">
	import X from '$lib/assets/icons/X.svelte';
	import {
		MAX_COINS_TO_FLIP,
		MAX_KRARK_THUMBS,
		type CoinSide,
		closeCoinFlipModal,
		coinFlipStore,
		formatFlipGroups,
		formatFlipHistory,
		getCoinFlipStatistics,
		getCoinsPerGroup,
		getTotalCoinsPerFlip
	} from '$lib/store/coinFlipStore';
	import { getCoinResultShortLabel } from '$lib/utils/coinFlipResultLabel';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let showHelp = false;

	const formatCoinSide = (result: CoinSide, headLabel: string, tailLabel: string) =>
		result === 'H' ? headLabel : tailLabel;

	$: coinStats = getCoinFlipStatistics($coinFlipStore);
	$: coinsPerGroup = getCoinsPerGroup($coinFlipStore.krarkThumbs);
	$: totalCoins = getTotalCoinsPerFlip($coinFlipStore);
	$: previewCoinIndices = Array.from({ length: Math.min(totalCoins, 8) }, (_, index) => index);
	$: headResultLabel = getCoinResultShortLabel(
		$_('coin_result_head_short'),
		$_('coin_result_head'),
		'Head'
	);
	$: tailResultLabel = getCoinResultShortLabel(
		$_('coin_result_tail_short'),
		$_('coin_result_tail'),
		'Tail'
	);
	$: lastResultText = formatFlipGroups($coinFlipStore.lastResults, (result) =>
		formatCoinSide(result, headResultLabel, tailResultLabel)
	);
	$: flipHistoryText = formatFlipHistory($coinFlipStore.flipHistory, {
		head: headResultLabel,
		tail: tailResultLabel
	});

	const adjustKrarkThumbs = (delta: number) => {
		vibrate(10);
		coinFlipStore.setKrarkThumbs($coinFlipStore.krarkThumbs + delta);
	};

	const adjustCoinsToFlip = (delta: number) => {
		vibrate(10);
		coinFlipStore.setCoinsToFlip($coinFlipStore.coinsToFlip + delta);
	};

	const flipCoins = () => {
		vibrate(20);
		coinFlipStore.flipCoins();
	};

	const flipUntilLose = (call: 'H' | 'T') => {
		vibrate(20);
		coinFlipStore.flipUntilLose(call);
	};

	const resetStats = () => {
		vibrate(20);
		coinFlipStore.resetStats();
	};
</script>

<div class="fixed inset-0 z-[240] flex items-center justify-center p-3 backdrop-blur-sm sm:p-6">
	<button
		class="absolute inset-0 bg-black/80"
		on:click={closeCoinFlipModal}
		on:contextmenu|preventDefault
		draggable="false"
		aria-label={$_('coin_flip_tracker_close') || 'Close coin flip tracker'}
	></button>
	<div
		class="relative z-10 flex max-h-[96vh] w-full max-w-[28rem] flex-col overflow-hidden rounded-[2rem] border border-amber-200/20 bg-slate-950 text-white shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.22),_transparent_45%),linear-gradient(135deg,_rgba(127,29,29,0.35),_rgba(6,78,59,0.3))] px-5 pb-4 pt-5"
		>
			<button
				class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
				on:click={closeCoinFlipModal}
				on:contextmenu|preventDefault
				draggable="false"
				aria-label={$_('coin_flip_tracker_close') || 'Close coin flip tracker'}
			>
				<X />
			</button>

			<div class="pr-12">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/75">
					{$_('dice_misc') || 'Dice & Misc'}
				</p>
				<h2 class="mt-2 text-3xl font-black text-white">
					{$_('coin_flip_tracker') || 'Coin Flip Tracker'}
				</h2>
				<p class="mt-2 text-sm text-slate-300">
					{$_('coin_flip_tracker_subtitle') ||
						'Track Krark’s Thumb flips, streaks, and coin-flip luck during the game.'}
				</p>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-4 pb-5 pt-4">
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-[1.6rem] border border-white/10 bg-white/5 p-3">
					<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						{$_('krarks_thumbs') || "Krark's Thumbs"}
					</p>
					<div class="mt-3 flex items-center justify-between gap-2">
						<button
							class="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-2xl text-white transition hover:bg-black/55 disabled:opacity-40"
							on:click={() => adjustKrarkThumbs(-1)}
							disabled={$coinFlipStore.krarkThumbs <= 0}>−</button
						>
						<div class="flex min-w-[4.5rem] flex-col items-center">
							<span class="text-3xl font-black text-amber-200">{$coinFlipStore.krarkThumbs}</span>
							<span class="text-xs text-slate-400">🪙 × {coinsPerGroup}</span>
						</div>
						<button
							class="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-2xl text-white transition hover:bg-black/55 disabled:opacity-40"
							on:click={() => adjustKrarkThumbs(1)}
							disabled={$coinFlipStore.krarkThumbs >= MAX_KRARK_THUMBS}>+</button
						>
					</div>
				</div>

				<div class="rounded-[1.6rem] border border-white/10 bg-white/5 p-3">
					<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
						{$_('coins_to_flip') || 'Coins to Flip'}
					</p>
					<div class="mt-3 flex items-center justify-between gap-2">
						<button
							class="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-2xl text-white transition hover:bg-black/55 disabled:opacity-40"
							on:click={() => adjustCoinsToFlip(-1)}
							disabled={$coinFlipStore.coinsToFlip <= 1}>−</button
						>
						<div class="flex min-w-[4.5rem] flex-col items-center">
							<span class="text-3xl font-black text-cyan-200">{$coinFlipStore.coinsToFlip}</span>
							<span class="text-xs text-slate-400">{coinsPerGroup} / flip</span>
						</div>
						<button
							class="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-2xl text-white transition hover:bg-black/55 disabled:opacity-40"
							on:click={() => adjustCoinsToFlip(1)}
							disabled={$coinFlipStore.coinsToFlip >= MAX_COINS_TO_FLIP}>+</button
						>
					</div>
				</div>
			</div>

			<div
				class="mt-4 rounded-[1.8rem] border border-amber-200/15 bg-[linear-gradient(180deg,_rgba(250,204,21,0.16),_rgba(15,23,42,0.88))] p-4"
			>
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/75">
							{$_('total_number_of_coins') || 'Total Number of Coins'}
						</p>
						<p class="mt-2 text-3xl font-black text-white">{totalCoins}</p>
					</div>
					<div class="grid grid-cols-4 gap-2">
						{#each previewCoinIndices as index}
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/25 bg-amber-300/20 text-lg shadow-[inset_0_1px_6px_rgba(255,255,255,0.22)]"
								aria-hidden="true"
							>
								{index % 2 === 0 ? 'H' : 'T'}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
				<button
					class="min-h-[3.5rem] rounded-[1.5rem] bg-amber-400 px-4 py-3 text-base font-black text-slate-950 shadow-lg transition hover:bg-amber-300"
					on:click={flipCoins}
				>
					{$_('flip_coin') || 'Flip coin'}
				</button>
				<button
					class="flex min-h-[3.5rem] items-center justify-center rounded-[1.5rem] bg-slate-900 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-slate-800"
					on:click={() => (showHelp = !showHelp)}
				>
					{showHelp ? '×' : '?'}
				</button>
				<div class="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-2">
					<button
						class="min-h-[3.5rem] rounded-full bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-emerald-400"
						on:click={() => flipUntilLose('H')}
					>
						{$_('call_heads') || 'Call Heads'}
					</button>
					<button
						class="min-h-[3.5rem] rounded-full bg-rose-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-rose-400"
						on:click={() => flipUntilLose('T')}
					>
						{$_('call_tails') || 'Call Tails'}
					</button>
				</div>
			</div>

			{#if showHelp}
				<div
					class="mt-4 rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
				>
					<p class="font-semibold text-amber-200">
						{$_('flip_until_you_lose') || 'Flip Until You Lose'}
					</p>
					<p class="mt-2">
						{$_('coin_flip_tracker_help_krark') ||
							"Krark's Thumb doubles your coin options for each thumb: 1, 2, 4, 8, 16, 32, then 64."}
					</p>
					<p class="mt-2">
						{$_('coin_flip_tracker_help_until_lose') ||
							'Call Heads or Call Tails keeps flipping full rounds until that called side no longer appears in the round.'}
					</p>
					<p class="mt-2">
						{$_('coin_flip_tracker_help_cards') ||
							'Useful for cards like Krark’s Thumb, Zndrsplt, and Yusri while still keeping track of your full streak.'}
					</p>
					{#if $coinFlipStore.lastRunWasCapped}
						<p class="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-amber-100">
							{$_('coin_flip_tracker_cap_notice') ||
								'The latest “until you lose” run hit the visual safety cap to keep the app responsive.'}
						</p>
					{/if}
				</div>
			{/if}

			<div class="mt-4 grid grid-cols-2 gap-3">
				<div class="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-500/10 p-3">
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
						{$_('total_heads') || 'Total Heads'}
					</p>
					<p class="mt-2 text-3xl font-black text-emerald-300">{$coinFlipStore.totalHeads}</p>
					<p class="mt-2 text-xs text-emerald-100/75">
						{$_('longest_head_streak') || 'Longest Heads Streak'}: {coinStats.longestHeadsStreak}
					</p>
				</div>

				<div class="rounded-[1.5rem] border border-rose-300/15 bg-rose-500/10 p-3">
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200/80">
						{$_('total_tails') || 'Total Tails'}
					</p>
					<p class="mt-2 text-3xl font-black text-rose-300">{$coinFlipStore.totalTails}</p>
					<p class="mt-2 text-xs text-rose-100/75">
						{$_('longest_tail_streak') || 'Longest Tails Streak'}: {coinStats.longestTailsStreak}
					</p>
				</div>
			</div>

			<button
				class="mt-4 min-h-[3.2rem] w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10"
				on:click={resetStats}
			>
				{$_('reset') || 'Reset'}
			</button>

			<div class="mt-4 space-y-3">
				<div class="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4">
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
							{$_('last_result') || 'Last Result'}
						</p>
						<span class="text-xs text-slate-500">{lastResultText}</span>
					</div>

					{#if $coinFlipStore.lastResults.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each $coinFlipStore.lastResults as group}
								<div class="rounded-2xl border border-white/8 bg-black/25 px-3 py-2">
									<div class="flex flex-wrap gap-1">
										{#each group.results as result}
											<div
												class:text-emerald-300={result === 'H'}
												class:text-rose-300={result === 'T'}
												class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-black"
											>
												{formatCoinSide(result, headResultLabel, tailResultLabel)}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-sm text-slate-500">—</p>
					{/if}
				</div>

				<div class="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4">
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
							{$_('flip_history') || 'Flip History'}
						</p>
						<span class="text-xs text-slate-500">{flipHistoryText}</span>
					</div>
					<div class="mt-3 max-h-36 space-y-2 overflow-y-auto pr-1 text-sm text-slate-200">
						{#if $coinFlipStore.flipHistory.length > 0}
							{#each [...$coinFlipStore.flipHistory].reverse() as entry}
								<div class="rounded-2xl bg-white/5 px-3 py-2">
									<p class="font-semibold text-white">
										{entry.mode === 'untilLose'
											? `${$_(entry.call === 'H' ? 'call_heads' : 'call_tails') || (entry.call === 'H' ? 'Call Heads' : 'Call Tails')}`
											: `${$_('flip_coin') || 'Flip coin'}`}
									</p>
									<p class="mt-1 text-slate-300">
										( {entry.heads}{headResultLabel} & {entry.tails}{tailResultLabel} )
									</p>
								</div>
							{/each}
						{:else}
							<p class="text-slate-500">—</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
