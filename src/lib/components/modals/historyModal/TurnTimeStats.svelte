<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { turnTimeStats, formatDuration } from '$lib/store/turnTimeStats';
	import { players } from '$lib/store/player';
	import { appSettings } from '$lib/store/appSettings';

	const namedPlayerColors: Record<string, string> = {
		mud: '#704214',
		metalicgray: '#6e7f80',
		gold: '#ffb700',
		purple: '#6600ff',
		pink: '#ff69b4',
		orange: '#ff8c00',
		lightgreen: '#90ee90',
		blue: '#0000bb',
		black: '#202020',
		red: '#bb0000',
		green: '#00bb00',
		white: '#e8e8e8'
	};

	const fallbackPalette = [
		'#38bdf8',
		'#f472b6',
		'#f59e0b',
		'#34d399',
		'#a78bfa',
		'#f87171',
		'#facc15',
		'#22d3ee'
	];

	const resolveColor = (colorToken: string | undefined, playerIdx: number): string => {
		if (!colorToken) return fallbackPalette[playerIdx % fallbackPalette.length];
		const named = namedPlayerColors[colorToken];
		if (named) return named;
		// Already a CSS color value (hex, rgb, etc.)
		if (colorToken.startsWith('#') || colorToken.startsWith('rgb')) return colorToken;
		return fallbackPalette[playerIdx % fallbackPalette.length];
	};

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
			return committed + Math.max(0, Math.floor((liveNow - $turnTimeStats.currentTurnStartMs) / 1000));
		}
		return committed;
	});

	$: totalSeconds = times.reduce((acc, t) => acc + t, 0);

	$: rows = activePlayers.map((player, idx) => ({
		name: player.playerName || `${$_('player') || 'Player'} ${idx + 1}`,
		color: resolveColor(player.color, idx),
		seconds: times[idx],
		pct: totalSeconds > 0 ? (times[idx] / totalSeconds) * 100 : 0,
		isActive: $turnTimeStats.currentPlayerIndex === idx
	}));

	$: emptyState = totalSeconds === 0;

	$: titleLabel = String($_('history_turn_time_title') || 'Turn Time Statistics');
	$: emptyLabel = String($_('history_turn_time_empty') || 'No turns tracked yet.');
	$: totalLabel = String($_('history_turn_time_total') || 'Total tracked time');
	$: currentTurnLabel = String($_('history_turn_time_current_turn') || 'Playing');
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-white">{titleLabel}</h3>
		{#if !emptyState}
			<span class="rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-300">
				{totalLabel}: <span class="font-mono font-semibold text-white">{formatDuration(totalSeconds)}</span>
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
							<span
								class="inline-block h-3 w-3 shrink-0 rounded-full"
								style="background:{row.color};"
								aria-hidden="true"
							></span>
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
