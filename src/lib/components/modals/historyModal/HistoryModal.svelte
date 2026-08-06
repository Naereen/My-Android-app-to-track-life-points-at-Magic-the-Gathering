<script lang="ts">
	import { appSettings } from '$lib/store/appSettings';
	import LifeChart from './LifeChart.svelte';
	import { closeHistoryModal } from '$lib/store/modal';
	import { lifeHistory } from '$lib/store/lifeHistory';
	import { _ } from 'svelte-i18n';

	$: latestSnapshot = $lifeHistory[$lifeHistory.length - 1];
	$: legendEntries = [...(latestSnapshot?.players ?? [])].sort((left, right) => left.id - right.id);
	$: chartTitle = String($_('history_life_chart_title') || 'Life total history');
	$: emptyState = String($_('history_life_chart_empty') || 'No life snapshots recorded yet.');
	$: closeLabel = String($_('close') || 'Close');
	$: snapshotCountSuffix = String($_('history_life_chart_snapshot_count') || 'snapshots captured');
	$: startedOnLabel = String($_('history_life_chart_started_on') || 'Started');

	const legendMarkerStroke = '#e5e7eb';

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

	const formatStartDate = (timestamp: number | undefined, locale: string) => {
		if (!timestamp) return '';
		try {
			return new Intl.DateTimeFormat(locale || undefined, {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(timestamp));
		} catch {
			return new Date(timestamp).toLocaleString();
		}
	};

	$: startDateText = formatStartDate($lifeHistory[0]?.timestamp, $appSettings.locale);
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
	role="presentation"
>
	<button
		type="button"
		class="absolute inset-0 h-full w-full cursor-default bg-transparent"
		on:click={closeHistoryModal}
		aria-label={closeLabel}
	></button>
	<div
		class="relative z-10 flex max-h-[92vh] w-[95%] max-w-5xl flex-col overflow-hidden rounded-2xl bg-gray-800 shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-label={chartTitle}
	>
		<button
			type="button"
			class="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-fuchsia-600 text-2xl text-white shadow-lg transition-colors hover:bg-fuchsia-500"
			on:click={closeHistoryModal}
			aria-label={closeLabel}
		>
			×
		</button>

		<div class="border-b border-gray-700 px-6 pb-4 pt-6">
			<h2 class="pr-14 text-2xl font-semibold text-white">{chartTitle}</h2>
			<p class="mt-2 text-sm text-gray-400">
				{#if $lifeHistory.length > 1}
					{$lifeHistory.length}
					{snapshotCountSuffix}
					{#if startDateText}
						· {startedOnLabel} {startDateText}
					{/if}
				{:else}
					{emptyState}
				{/if}
			</p>
		</div>

		<div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
			<div class="w-full max-w-full">
				<LifeChart
					snapshots={$lifeHistory}
					defaultStartingLife={$appSettings.startingLifeTotal}
					emptyStateText={emptyState}
				/>
			</div>

			{#if legendEntries.length > 0}
				<div class="mt-5 border-t border-gray-700 pt-4">
					<div class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
						{$_('history_life_chart_legend') || 'Legend'}
					</div>
					<div class="flex flex-wrap gap-3">
						{#each legendEntries as player, index (player.id)}
							<div
								class="flex items-center gap-2 rounded-full bg-gray-900/70 px-3 py-1.5 text-sm text-gray-100"
							>
								<svg
									viewBox="0 0 16 16"
									class="h-4 w-4 shrink-0 overflow-visible"
									aria-hidden="true"
								>
									<g transform="translate(8 8)">
										{#if index % 8 === 0}
											<circle
												r="4.6"
												fill={player.color}
												stroke={legendMarkerStroke}
												stroke-width="1.4"
											/>
										{:else if index % 8 === 1}
											<rect
												x="-4.25"
												y="-4.25"
												width="8.5"
												height="8.5"
												fill={player.color}
												stroke={legendMarkerStroke}
												stroke-width="1.4"
												rx="1.5"
											/>
										{:else}
											<polygon
												points={markerPolygonPoints(index, 5)}
												fill={player.color}
												stroke={legendMarkerStroke}
												stroke-width="1.4"
											/>
										{/if}
									</g>
								</svg>
									<span class="font-medium" style={`color: ${player.color};`}
										>{player.name} ({player.life})</span
									>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
