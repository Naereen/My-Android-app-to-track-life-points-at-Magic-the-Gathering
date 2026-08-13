<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { savedGames, clearSavedGames } from '$lib/store/savedGames';
	import { formatDuration } from '$lib/store/turnTimeStats';
	import { showConfirm } from '$lib/store/modal';

	// ── Derived statistics ──────────────────────────────────────────────────────

	$: games = $savedGames;
	$: totalGames = games.length;

	$: totalDurationSeconds = games.reduce((acc, g) => acc + g.durationSeconds, 0);
	$: avgDurationSeconds = totalGames > 0 ? Math.round(totalDurationSeconds / totalGames) : 0;
	$: maxDurationSeconds = totalGames > 0 ? Math.max(...games.map((g) => g.durationSeconds)) : 0;
	$: minDurationSeconds = totalGames > 0 ? Math.min(...games.map((g) => g.durationSeconds)) : 0;

	// Player count distribution
	$: playerCountMap = games.reduce<Record<number, number>>((acc, g) => {
		acc[g.playerCount] = (acc[g.playerCount] ?? 0) + 1;
		return acc;
	}, {});
	$: playerCounts = Object.entries(playerCountMap)
		.map(([count, freq]) => ({ count: Number(count), freq }))
		.sort((a, b) => a.count - b.count);

	// Starting life distribution
	$: startingLifeMap = games.reduce<Record<number, number>>((acc, g) => {
		acc[g.startingLife] = (acc[g.startingLife] ?? 0) + 1;
		return acc;
	}, {});
	$: startingLifeTotals = Object.entries(startingLifeMap)
		.map(([life, freq]) => ({ life: Number(life), freq }))
		.sort((a, b) => a.life - b.life);

	// Outcome distribution
	$: wins = games.filter((g) => g.winnerIndex !== null).length;
	$: draws = games.filter((g) => g.winnerIndex === null).length;

	// Starting player advantage: for each position (0-based), count how many
	// times that position won, out of all games where that position was the first player.
	$: maxPlayerCount = totalGames > 0 ? Math.max(...games.map((g) => g.playerCount)) : 0;
	$: positionWins = (() => {
		const result: { position: number; wins: number; total: number }[] = [];
		for (let pos = 0; pos < maxPlayerCount; pos++) {
			const gamesWithPos = games.filter((g) => g.startingPlayerIndex === pos);
			const posWins = gamesWithPos.filter((g) => g.winnerIndex === pos).length;
			if (gamesWithPos.length > 0) {
				result.push({ position: pos, wins: posWins, total: gamesWithPos.length });
			}
		}
		return result;
	})();

	// ── i18n ────────────────────────────────────────────────────────────────────

	$: emptyLabel = String($_('history_stats_empty') || 'No completed games recorded yet.');
	$: totalGamesLabel = String($_('history_stats_total_games') || 'Games');
	$: totalTimeLabel = String($_('history_stats_total_time') || 'Total time');
	$: avgGameLabel = String($_('history_stats_avg_game') || 'Avg. game');
	$: durationSectionLabel = String($_('history_stats_duration_section') || 'Duration');
	$: avgLabel = String($_('history_stats_avg') || 'Avg. game');
	$: longestLabel = String($_('history_stats_longest') || 'Longest');
	$: shortestLabel = String($_('history_stats_shortest') || 'Shortest');
	$: playerCountSectionLabel = String($_('history_stats_player_count_section') || 'Player count');
	$: startingLifeSectionLabel = String(
		$_('history_stats_starting_life_section') || 'Starting life'
	);
	$: outcomeSectionLabel = String($_('history_stats_outcome_section') || 'Outcomes');
	$: winsLabel = String($_('history_stats_wins') || 'Games with a winner');
	$: drawsLabel = String($_('history_stats_draws') || 'Draws');
	$: turnOrderSectionLabel = String(
		$_('history_stats_turn_order_section') || 'Turn order advantage'
	);
	$: positionLabels = [
		String($_('history_stats_position_1') || 'Goes first'),
		String($_('history_stats_position_2') || 'Position 2'),
		String($_('history_stats_position_3') || 'Position 3'),
		String($_('history_stats_position_4') || 'Position 4'),
		String($_('history_stats_position_5') || 'Position 5'),
		String($_('history_stats_position_6') || 'Position 6'),
		String($_('history_stats_position_7') || 'Position 7'),
		String($_('history_stats_position_8') || 'Position 8')
	];
	$: clearButtonLabel = String($_('history_stats_clear_button') || 'Clear all game records');
	$: gamesCountSuffix = (n: number) =>
		n === 1
			? String($_('history_stats_game_singular') || 'game')
			: String($_('history_stats_game_plural') || 'games');

	// ── helpers ─────────────────────────────────────────────────────────────────

	const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

	const handleClear = async () => {
		const confirmed = await showConfirm(
			String(
				$_('history_stats_clear_confirm') || 'Clear all saved game records? This cannot be undone.'
			)
		);
		if (confirmed) clearSavedGames();
	};
</script>

<div class="flex flex-col gap-5 pb-2">
	{#if totalGames === 0}
		<p class="py-8 text-center text-gray-400">{emptyLabel}</p>
	{:else}
		<!-- Summary row -->
		<div class="grid grid-cols-3 gap-3 text-center">
			<div class="rounded-xl bg-gray-900/70 px-3 py-3">
				<div class="text-2xl font-bold text-white">{totalGames}</div>
				<div class="mt-0.5 text-xs text-gray-400">{totalGamesLabel}</div>
			</div>
			<div class="rounded-xl bg-gray-900/70 px-3 py-3">
				<div class="text-2xl font-bold text-white">{formatDuration(totalDurationSeconds)}</div>
				<div class="mt-0.5 text-xs text-gray-400">{totalTimeLabel}</div>
			</div>
			<div class="rounded-xl bg-gray-900/70 px-3 py-3">
				<div class="text-2xl font-bold text-white">{formatDuration(avgDurationSeconds)}</div>
				<div class="mt-0.5 text-xs text-gray-400">{avgGameLabel}</div>
			</div>
		</div>

		<!-- Duration section -->
		<section>
			<h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
				{durationSectionLabel}
			</h3>
			<ul class="space-y-1">
				<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
					<span class="text-sm text-gray-200">{avgLabel}</span>
					<span class="font-mono text-sm font-semibold text-white"
						>{formatDuration(avgDurationSeconds)}</span
					>
				</li>
				<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
					<span class="text-sm text-gray-200">{longestLabel}</span>
					<span class="font-mono text-sm font-semibold text-white"
						>{formatDuration(maxDurationSeconds)}</span
					>
				</li>
				<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
					<span class="text-sm text-gray-200">{shortestLabel}</span>
					<span class="font-mono text-sm font-semibold text-white"
						>{formatDuration(minDurationSeconds)}</span
					>
				</li>
			</ul>
		</section>

		<!-- Turn order advantage -->
		{#if positionWins.length > 0}
			<section>
				<h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
					{turnOrderSectionLabel}
				</h3>
				<ul class="space-y-1">
					{#each positionWins as row (row.position)}
						<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
							<span class="text-sm text-gray-200"
								>{positionLabels[row.position] ?? `Position ${row.position + 1}`}</span
							>
							<span class="font-mono text-sm text-gray-400"
								>{row.wins}/{row.total}
								<span class="ml-2 font-semibold text-white">{pct(row.wins, row.total)}%</span></span
							>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Outcomes -->
		<section>
			<h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
				{outcomeSectionLabel}
			</h3>
			<ul class="space-y-1">
				<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
					<span class="text-sm text-gray-200">{winsLabel}</span>
					<span class="font-mono text-sm text-gray-400"
						>{wins}/{totalGames}
						<span class="ml-2 font-semibold text-white">{pct(wins, totalGames)}%</span></span
					>
				</li>
				<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
					<span class="text-sm text-gray-200">{drawsLabel}</span>
					<span class="font-mono text-sm text-gray-400"
						>{draws}/{totalGames}
						<span class="ml-2 font-semibold text-white">{pct(draws, totalGames)}%</span></span
					>
				</li>
			</ul>
		</section>

		<!-- Player count distribution -->
		{#if playerCounts.length > 1}
			<section>
				<h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
					{playerCountSectionLabel}
				</h3>
				<ul class="space-y-1">
					{#each playerCounts as row (row.count)}
						<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
							<span class="text-sm text-gray-200">{row.count} 👤</span>
							<span class="font-mono text-sm text-gray-400"
								>{row.freq}
								{gamesCountSuffix(row.freq)}
								<span class="ml-2 font-semibold text-white">{pct(row.freq, totalGames)}%</span
								></span
							>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Starting life distribution -->
		{#if startingLifeTotals.length > 1}
			<section>
				<h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
					{startingLifeSectionLabel}
				</h3>
				<ul class="space-y-1">
					{#each startingLifeTotals as row (row.life)}
						<li class="flex items-center justify-between rounded-lg bg-gray-900/70 px-4 py-2.5">
							<span class="text-sm text-gray-200">♥ {row.life}</span>
							<span class="font-mono text-sm text-gray-400"
								>{row.freq}
								{gamesCountSuffix(row.freq)}
								<span class="ml-2 font-semibold text-white">{pct(row.freq, totalGames)}%</span
								></span
							>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}

	<!-- Clear button -->
	<div class="mt-2 flex justify-center">
		<button
			type="button"
			on:click={handleClear}
			disabled={totalGames === 0}
			class="rounded-full border border-gray-700 bg-black/30 px-4 py-1.5 text-xs text-gray-300 hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{clearButtonLabel}
		</button>
	</div>
</div>
