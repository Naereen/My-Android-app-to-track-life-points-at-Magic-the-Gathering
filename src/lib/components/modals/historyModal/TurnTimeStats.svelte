<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { turnTimeStats, formatDuration } from '$lib/store/turnTimeStats';
	import { players } from '$lib/store/player';
	import { appSettings } from '$lib/store/appSettings';
	import { resolveChartColor } from '$lib/store/lifeHistory';

	// Live tick – refreshes every second so the active player's bar grows in real time
	let liveNow = Date.now();
	let tickInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		tickInterval = setInterval(() => {
			liveNow = Date.now();
		}, 1000);
	});

	onDestroy(() => {
		if (tickInterval !== null) clearInterval(tickInterval);
	});

	// Reactive stats — recomputed whenever the store or liveNow changes
	$: playerCount = $appSettings.playerCount ?? 4;
	$: activePlayers = $players.slice(0, playerCount);

	$: times = activePlayers.map((_, idx) => {
		// Use liveNow to force reactivity on every tick
		void liveNow;
		const committed = $turnTimeStats.playerSeconds[idx] ?? 0;
		if ($turnTimeStats.currentPlayerIndex === idx && $turnTimeStats.currentTurnStartMs !== null) {
			return (
				committed + Math.max(0, Math.floor((liveNow - $turnTimeStats.currentTurnStartMs) / 1000))
			);
		}
		return committed;
	});

	$: totalSeconds = times.reduce((acc, t) => acc + t, 0);

	$: rows = activePlayers.map((player, idx) => ({
		name: player.playerName || `${$_('player') || 'Player'} ${idx + 1}`,
		color: resolveChartColor(player.color, idx),
		seconds: times[idx],
		pct: totalSeconds > 0 ? (times[idx] / totalSeconds) * 100 : 0,
		isActive: $turnTimeStats.currentPlayerIndex === idx
	}));

	$: emptyState = totalSeconds === 0;

	const markerStroke = '#e5e7eb';

	const markerPolygonPoints = (kind: number, size: number) => {
		switch (kind % 8) {
			case 2:
				return `0,-${size} ${size},0 0,${size} -${size},0`;
			case 3:
				return `0,-${size} ${size},${size} -${size},${size}`;
			case 4:
				return `${-size},-${size / 2} ${size},-${size / 2} ${size},${size / 2} ${-size},${size / 2}`;
			case 5:
				return `0,-${size} ${size},-${size / 4} ${size / 2},${size} -${size / 2},${size} -${size},-${size / 4}`;
			case 6:
				return `0,-${size} ${size},-${size / 3} ${size},${size / 3} 0,${size} -${size},${size / 3} -${size},-${size / 3}`;
			case 7:
				return `0,-${size} ${size},0 ${size / 2},${size} -${size / 2},${size} -${size},0`;
			default:
				return '';
		}
	};

	$: titleLabel = String($_('history_turn_time_title') || 'Turn Time Statistics');
	$: emptyLabel = String($_('history_turn_time_empty') || 'No turns tracked yet.');
	$: totalLabel = String($_('history_turn_time_total') || 'Total tracked time');
	$: currentTurnLabel = String($_('history_turn_time_current_turn') || 'Playing');
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<!-- <h3 class="text-lg font-semibold text-white">{titleLabel}</h3> -->
		{#if !emptyState}
			<span class="rounded-full bg-gray-700 px-3 py-1 text-gray-300">
				{totalLabel} :
				<span class="font-mono font-semibold text-white">{formatDuration(totalSeconds)}</span>
			</span>
		{/if}
	</div>

	{#if emptyState}
		<p class="py-8 text-center text-gray-400">{emptyLabel}</p>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each rows as row, idx (idx)}
				<li class="flex flex-col gap-1">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<svg viewBox="0 0 16 16" class="h-4 w-4 shrink-0 overflow-visible" aria-hidden="true">
								<g transform="translate(8 8)">
									{#if idx % 8 === 0}
										<circle r="4.6" fill={row.color} stroke={markerStroke} stroke-width="1.4" />
									{:else if idx % 8 === 1}
										<rect
											x="-4.25"
											y="-4.25"
											width="8.5"
											height="8.5"
											fill={row.color}
											stroke={markerStroke}
											stroke-width="1.4"
											rx="1.5"
										/>
									{:else}
										<polygon
											points={markerPolygonPoints(idx, 5)}
											fill={row.color}
											stroke={markerStroke}
											stroke-width="1.4"
										/>
									{/if}
								</g>
							</svg>
							<span class="font-medium text-white">{row.name}</span>
							{#if row.isActive}
								<span class="rounded-full bg-fuchsia-700/60 px-2 py-0.5 text-xs text-fuchsia-200">
									{currentTurnLabel}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3 font-mono text-gray-300">
							<span class="text-xs">{row.pct.toFixed(1)}%</span>
							<span class="text-sm font-semibold text-white">{formatDuration(row.seconds)}</span>
						</div>
					</div>
					<!-- Progress bar -->
					<div class="h-3 w-full overflow-hidden rounded-full bg-gray-700">
						<div
							class="h-full rounded-full transition-all duration-700"
							style="width:{row.pct}%; background:{row.color}; opacity:{row.isActive ? 1 : 0.7};"
							role="progressbar"
							aria-valuenow={row.pct}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="{row.name}: {row.pct.toFixed(1)}%"
						></div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
