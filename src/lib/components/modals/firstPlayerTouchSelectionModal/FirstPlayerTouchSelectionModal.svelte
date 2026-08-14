<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		dismissFirstPlayerTouchSelection,
		firstPlayerTouchSelection,
		skipFirstPlayerTouchSelection
	} from '$lib/store/player';

	$: registeredCount = Object.keys($firstPlayerTouchSelection.activePointersByPlayerId).length;
</script>

{#if $firstPlayerTouchSelection.phase !== 'idle'}
	<div
		class="fixed inset-0 z-[220] pointer-events-none flex flex-col justify-between p-4"
		class:pointer-events-auto={$firstPlayerTouchSelection.phase === 'winner'}
		on:click={() => {
			if ($firstPlayerTouchSelection.phase === 'winner') {
				dismissFirstPlayerTouchSelection();
			}
		}}
		role="button"
		tabindex="-1"
		on:keydown={() => null}
	>
		<div class="w-full flex justify-center">
			<div class="rounded-2xl bg-black/65 text-white px-4 py-3 text-center">
				<div class="text-lg font-semibold">{$_('reset_game_who_starts')}</div>
				{#if $firstPlayerTouchSelection.phase === 'collecting'}
					<div class="text-sm opacity-90 mt-1">
						{registeredCount}/{Math.max(0, $firstPlayerTouchSelection.requiredPlayers)} ✋
					</div>
				{:else if $firstPlayerTouchSelection.phase === 'animating'}
					<div class="text-sm opacity-90 mt-1">✨ ✨ ✨</div>
				{:else}
					<div class="text-sm opacity-90 mt-1">🏆</div>
				{/if}
			</div>
		</div>

		{#if $firstPlayerTouchSelection.phase !== 'winner'}
			<div class="w-full flex justify-center pointer-events-auto">
				<button
					class="rounded-full bg-white/90 text-black px-6 py-2 font-semibold shadow-lg"
					on:click={skipFirstPlayerTouchSelection}
				>
					{$_('reset_game_random_start')}
				</button>
			</div>
		{/if}
	</div>
{/if}
