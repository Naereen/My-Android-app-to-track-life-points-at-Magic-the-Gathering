<script lang="ts">
	import { appSettings } from '$lib/store/appSettings';
	import LifeChart from './LifeChart.svelte';
	import { closeHistoryModal } from '$lib/store/modal';
	import { lifeHistory } from '$lib/store/lifeHistory';
	import { _ } from 'svelte-i18n';

	$: latestSnapshot = $lifeHistory[$lifeHistory.length - 1];
	$: legendEntries = latestSnapshot?.players ?? [];
	$: chartTitle = String($_('history_life_chart_title') || 'Life total history');
	$: emptyState = String($_('history_life_chart_empty') || 'No life snapshots recorded yet.');
	$: closeLabel = String($_('close') || 'Close');
	$: snapshotCountSuffix = String($_('history_life_chart_snapshot_count') || 'snapshots captured');
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
	role="presentation"
	on:click={closeHistoryModal}
>
	<div
		class="relative flex max-h-[92vh] w-[95%] max-w-5xl flex-col overflow-hidden rounded-2xl bg-gray-800 shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-label={chartTitle}
		on:click|stopPropagation
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
					{$lifeHistory.length} {snapshotCountSuffix}
				{:else}
					{emptyState}
				{/if}
			</p>
		</div>

		<div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
			<div class="h-[28rem] w-full sm:h-[34rem]">
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
						{#each legendEntries as player (player.id)}
							<div
								class="flex items-center gap-2 rounded-full bg-gray-900/70 px-3 py-1.5 text-sm text-gray-100"
							>
								<span class="h-3 w-3 rounded-full" style={`background-color: ${player.color};`}
								></span>
								<span>{player.name}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
