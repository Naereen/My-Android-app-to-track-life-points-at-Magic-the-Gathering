<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { appSettings } from '$lib/store/appSettings';
	import { clearGameHistory, gameHistory, type GameHistoryEntry } from '$lib/store/gameHistory';
	import { _ } from 'svelte-i18n';

	$: innerHeight = 0;

	const formatTime = (timestamp: number) => {
		try {
			return new Date(timestamp).toLocaleTimeString($appSettings.locale || undefined, {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch (e) {
			return '';
		}
	};

	const statusLabel = (statusKey: string | undefined) => {
		if (!statusKey) return '';

		if (statusKey === 'monarch') return String($_('monarch'));
		if (statusKey === 'initiative') return String($_('initiative'));
		if (statusKey === 'ascend') return String($_('ascend'));
		if (statusKey === 'dayNight') return String($_('day_night'));
		if (statusKey === 'ko') return String($_('ko'));
		if (statusKey === 'energy') return String($_('energy'));
		if (statusKey === 'experience') return String($_('experience'));
		if (statusKey === 'rad') return String($_('rad'));
		if (statusKey === 'acorn') return String($_('acorn'));
		if (statusKey === 'ticket') return String($_('ticket'));
		if (statusKey === 'commandTax') return String($_('command_tax'));
		if (statusKey === 'ringBearer') return String($_('ring_bearer'));
		if (statusKey === 'startYourEngineSpeed') return String($_('start_your_engine_speed'));

		return statusKey;
	};

	const formatEntry = (entry: GameHistoryEntry) => {
		const fromValue = entry.payload.from ?? 0;
		const toValue = entry.payload.to ?? 0;

		if (entry.kind === 'positiveLife' || entry.kind === 'negativeLife') {
			return `${entry.playerName} · ${$_('life')}: ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'poison') {
			return `${entry.playerName} · ${$_('poison')}: ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'statusBoolean') {
			return `${entry.playerName} · ${statusLabel(entry.payload.key)}: ${entry.payload.to ? $_('history_state_on') : $_('history_state_off')}`;
		}

		if (entry.kind === 'statusNumeric') {
			return `${entry.playerName} · ${statusLabel(entry.payload.key)}: ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'commanderDamage') {
			const lifePart =
				typeof entry.payload.lifeDelta === 'number' && entry.payload.lifeDelta !== 0
					? ` · ${$_('life')} ${entry.payload.lifeDelta > 0 ? '+' : ''}${entry.payload.lifeDelta}`
					: '';
			return `${entry.playerName} · ${$_('commander_damage')} (${$_('history_from_player')} #${entry.payload.fromPlayerId ?? '-' }): ${fromValue} → ${toValue}${lifePart}`;
		}

		return '';
	};

	const iconForEntry = (entry: GameHistoryEntry) => {
		if (entry.kind === 'positiveLife') {
			return { glyph: '❤', className: 'text-green-300' };
		}

		if (entry.kind === 'negativeLife') {
			return { glyph: '❤', className: 'text-red-300' };
			// return { glyph: '💔', className: 'text-red-300' };
		}

		if (entry.kind === 'poison') {
			return { glyph: '☠', className: 'text-lime-300' };
		}

		if (entry.kind === 'statusBoolean' || entry.kind === 'statusNumeric') {
			return { glyph: '◉', className: 'text-sky-300' };
		}

		if (entry.kind === 'commanderDamage') {
			return { glyph: '⚔', className: 'text-amber-300' };
		}

		return { glyph: '•', className: 'text-gray-300' };
	};

	const iconGlyph = (entry: GameHistoryEntry) => iconForEntry(entry).glyph;
	const iconClassName = (entry: GameHistoryEntry) => iconForEntry(entry).className;
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-scroll scrollbar-hidden h-full"
	style="max-height: {innerHeight - ($appSettings.playerCount >= 5 ? 110 : 80)}px;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black z-10"
		>
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('game_history')}</span>
		</div>

		<div class="w-full px-4 pb-5 text-white">
			{#if $gameHistory.length === 0}
				<div class="text-center text-gray-300">{$_('game_history_empty') || 'No changes recorded yet.'}</div>
			{:else}
				<ul class="space-y-1.5 space-y-reverse flex flex-col-reverse">
					{#each $gameHistory as entry (entry.id)}
						<li class="bg-gray-900/95 border border-gray-800 rounded-lg px-2.5 py-2 text-sm">
							<div class="flex gap-2">
								<div class={`mt-auto mb-auto w-8 text-center text-3xl select-none ${iconClassName(entry)}`}>{iconGlyph(entry)}</div>
								<div class="min-w-0 flex-1">
									<div class="text-gray-400 text-1.25rem">{formatTime(entry.timestamp)}</div>
									<div class="break-words text-1.75rem">{formatEntry(entry)}</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="mt-4 flex justify-center">
				<button
					on:click={clearGameHistory}
					disabled={$gameHistory.length === 0}
					class="px-3 py-1 rounded-full border border-gray-700 text-gray-300 text-xs bg-black/30 hover:bg-black/50 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{$_('game_history_clear_button') || 'Clear current history'}
				</button>
			</div>
		</div>
	</div>
</div>
