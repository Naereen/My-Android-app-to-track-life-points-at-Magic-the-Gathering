<script lang="ts">
	import { onDestroy } from 'svelte';
	// Icons are rendered dynamically via dicefont classes so the face can change during the rolling animation.
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import { resetRandomizer, randomizerModalData } from '$lib/store/modal';
	import { appSettings } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let displayResult = 0;
	let rolling = false;
	let abort = false;
	let iconSize = '6rem';
	let rollingMs = 0;

	function getPrefix(type?: string) {
		if (!type || type === '') return null;
		const map: Record<string, string> = {
			d2: 'df-d2',
			d4: 'df-d4',
			d6: 'df-small-dot-d6',
			d8: 'df-d8',
			d10: 'df-d10',
			d12: 'df-d12',
			d20: 'df-d20'
		};
		return map[type] || null;
	}

	$: face = displayResult || getMaxSides($randomizerModalData.type);
	$: prefix = getPrefix($randomizerModalData.type);
	$: diceClass = prefix && face ? `${prefix}-${face}` : '';

	function getMaxSides(type?: string) {
		if (!type || type === '') return 0;
		const map: Record<string, number> = {
			d2: 2,
			d4: 4,
			d6: 6,
			d8: 8,
			d10: 10,
			d12: 12,
			d20: 20
		};
		if (type === 'custom') return $appSettings.customRandomNumber || 0;
		return map[type] || 0;
	}

	async function startRollAnimation() {
		abort = false;
		rolling = true;
		const max = getMaxSides($randomizerModalData.type);
		const final = $randomizerModalData.result;
		const rounds = Math.floor(Math.random() * 5 + 5); // Number of times the face changes during the animation
		const totalMs = 1000;
		rollingMs = totalMs;
		const step = Math.max(50, Math.floor(totalMs / rounds));

		for (let i = 0; i < rounds; i++) {
			if (abort) {
				rollingMs = 0;
				return;
			}
			displayResult = max > 0 ? Math.floor(Math.random() * max) + 1 : 0;
			vibrate(10);
			await new Promise((r) => setTimeout(r, step));
		}

		if (!abort) displayResult = final;
		rolling = false;
		rollingMs = 0;
	}

	$: if ($randomizerModalData.isOpen && $randomizerModalData.type !== 'randomPlayer' && $randomizerModalData.type !== 'randomOpponent') {
		// When modal opens for a die, start the rolling animation
		startRollAnimation();
	} else if (!$randomizerModalData.isOpen) {
		// reset when modal closed
		abort = true;
		displayResult = 0;
	} else {
		// For player/opponent or other states, show final value
		displayResult = $randomizerModalData.result;
	}

	onDestroy(() => {
		abort = true;
	});
</script>

<div
	class="bg-black/70 absolute w-full h-full top-0 left-0 flex justify-center items-center"
	on:click={resetRandomizer}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation
		class="bg-[#2d2f30] opacity-100 rounded-[2rem] flex justify-center items-center"
		class:w-40={$randomizerModalData.type !== 'randomPlayer' && $randomizerModalData.type !== 'randomOpponent'}
		class:h-40={$randomizerModalData.type !== 'randomPlayer' && $randomizerModalData.type !== 'randomOpponent'}
		class:w-80={$randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
		class:h-60={$randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
		role="button"
		on:keydown={() => null}
		tabindex="0"
		style="background-image: url({$randomizerModalData.backgroundImage}); background-size: cover; background-position: center;"
	>
		<!-- FIXME: this style above should also include the backgroundGratient if the player has no backgroundImage but has an active backgroundGradient! -->
		<div
			class="flex flex-col justify-center items-center"
		>
			{#if $randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
				<div
					class="flex flex-col items-center p-4"
					>
					<span class="text-white text-5xl font-bold text-center mt-16 beleren">
						<!-- Uncomment to show the commanderDamage icon (one of the six set icons showing a random weapon) -->
						{#if $randomizerModalData.playerId !== null}
							<div class="scale-[3]">
								<CommanderDamage playerIndex={$randomizerModalData.playerId - 1} />
							</div>
						{/if}
						{$randomizerModalData.playerName}
					</span>
				</div>
			{:else}
				<div class="h-[49px] items-center flex justify-center">
					{#if $randomizerModalData.type === 'custom'}
						{$appSettings.customRandomNumber || 0} - { $_('sided_die') }
					{:else}
						<i
							class="{diceClass} text-white"
							class:dice-rolling={rolling}
							class:dice-final={!rolling && displayResult > 0 && $randomizerModalData.type !== 'custom'}
							style="font-size: {iconSize}; --dice-rolling-duration: {rollingMs}ms;"
						></i>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
