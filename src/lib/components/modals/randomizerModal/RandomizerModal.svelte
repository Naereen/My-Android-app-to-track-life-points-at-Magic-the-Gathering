<script lang="ts">
	import { onDestroy } from 'svelte';
	// Icons are rendered dynamically via dicefont classes so the face can change during the rolling animation.
	import Dplanar from '$lib/assets/icons/Dplanar.svelte';
	import { resetRandomizer, randomizerModalData } from '$lib/store/modal';
	import { appSettings } from '$lib/store/appSettings';
	import { playGameplaySound } from '$lib/utils/gameplaySound';
	import { getRandomizerResultTranslationKey } from '$lib/utils/randomizer';
	import { rollDie, secureRandomInt } from '$lib/utils/cryptoRandom';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	let displayResult = 0;
	let rolling = false;
	let abort = false;
	let iconSize = '6rem';
	let rollingMs = 0;

	/**
	 * Simulates planar die probabilities (blank/planeswalk/chaos) for animation frames.
	 * @returns {unknown} Result produced by rollPlanarFace.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const rollPlanarFace = () => {
		const roll = rollDie(6);
		if (roll <= 4) return 0;
		if (roll === 5) return 1;
		return 2;
	};

	/**
	 * Maps die type to dicefont class prefix used for icon glyph rendering.
	 * @param {string} type - Parameter used by getPrefix.
	 * @returns {unknown} Result produced by getPrefix.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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
	$: resultTranslationKey = getRandomizerResultTranslationKey(
		$randomizerModalData.type,
		displayResult
	);

	/**
	 * Returns number of sides for predefined and custom dice modes.
	 * @param {string} type - Parameter used by getMaxSides.
	 * @returns {unknown} Result produced by getMaxSides.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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

	/**
	 * Plays a short semantic cue once the roll animation settles.
	 * Higher rolls are treated as positive outcomes, low rolls as negative.
	 * @param {string} type Die type key.
	 * @param {number} result Final rolled value.
	 * @param {number} max Die max value (for normalization).
	 * @returns {void}
	 */
	const playRandomizerCompletionCue = (type: string, result: number, max: number) => {
		if (type === 'dplanar') {
			if (result === 2) {
				playGameplaySound('randomJackpot');
				return;
			}
			if (result === 1) {
				playGameplaySound('randomSuccess');
				return;
			}
			playGameplaySound('randomFail');
			return;
		}

		if (max <= 0) return;
		const ratio = result / max;

		if (result === max || ratio >= 0.9) {
			playGameplaySound('randomJackpot');
			return;
		}
		if (ratio >= 0.6) {
			playGameplaySound('randomSuccess');
			return;
		}
		if (ratio <= 0.2) {
			playGameplaySound('randomFail');
			return;
		}

		playGameplaySound('randomNeutral');
	};

	/**
	 * Runs timed rolling animation and lands on precomputed randomizer result.
	 * @returns {unknown} Result produced by startRollAnimation.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	async function startRollAnimation() {
		const type = $randomizerModalData.type;
		const max = getMaxSides(type);
		abort = false;
		rolling = true;
		if (type === 'dplanar') {
			// Planar dice are animated through semantic faces rather than numeric pips so the
			// user sees the magic-specific state transitions before the final result settles.
			const final = $randomizerModalData.result;
			const rounds = secureRandomInt(5, 9);
			const totalMs = 1000;
			rollingMs = totalMs;
			const step = Math.max(50, Math.floor(totalMs / rounds));

			for (let i = 0; i < rounds; i++) {
				if (abort) {
					rollingMs = 0;
					return;
				}
				displayResult = rollPlanarFace();
				vibrate(10);
				await new Promise((r) => setTimeout(r, step));
			}

			if (!abort) {
				displayResult = final;
				playRandomizerCompletionCue(type, final, 6);
			}
			rolling = false;
			rollingMs = 0;
			return;
		}

		const final = $randomizerModalData.result;
		const rounds = secureRandomInt(5, 9); // Number of times the face changes during the animation
		const totalMs = 1000;
		rollingMs = totalMs;
		const step = Math.max(50, Math.floor(totalMs / rounds));

		for (let i = 0; i < rounds; i++) {
			if (abort) {
				rollingMs = 0;
				return;
			}
			displayResult = max > 0 ? rollDie(max) : 0;
			vibrate(10);
			await new Promise((r) => setTimeout(r, step));
		}

		if (!abort) {
			displayResult = final;
			playRandomizerCompletionCue(type, final, max);
		}
		rolling = false;
		rollingMs = 0;
	}

	$: if (
		$randomizerModalData.isOpen &&
		$randomizerModalData.type !== 'randomPlayer' &&
		$randomizerModalData.type !== 'randomOpponent'
	) {
		// Re-entering the modal should restart the visual suspense effect from a clean state.
		// When modal opens for a die, start the rolling animation
		startRollAnimation();
	} else if ($randomizerModalData.type === 'custom') {
		// For custom random number, show the final value directly without animation
		abort = true;
		displayResult = $randomizerModalData.result;
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
		class="bg-[#2d2f30] opacity-100 rounded-[2.5rem] flex justify-center items-center"
		class:w-40={$randomizerModalData.type !== 'randomPlayer' &&
			$randomizerModalData.type !== 'randomOpponent'}
		class:h-40={$randomizerModalData.type !== 'randomPlayer' &&
			$randomizerModalData.type !== 'randomOpponent'}
		class:w-80={$randomizerModalData.type === 'randomPlayer' ||
			$randomizerModalData.type === 'randomOpponent'}
		class:h-60={$randomizerModalData.type === 'randomPlayer' ||
			$randomizerModalData.type === 'randomOpponent'}
		role="button"
		on:keydown={() => null}
		tabindex="0"
		style="background-image: url({$randomizerModalData.backgroundImage}); background-size: cover; background-position: center;"
	>
		<!-- FIXME: this style above should also include the backgroundGratient if the player has no backgroundImage but has an active backgroundGradient! -->
		<div class="flex flex-col justify-center items-center">
			{#if $randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
				<div class="flex flex-col items-center p-4">
					<span class="text-white text-5xl font-bold text-center mt-24 mb-0 beleren">
						<!-- Show the commanderDamage icon (one of the six set icons showing a random weapon) -->
						<!-- {#if $randomizerModalData.playerId !== null}
							<div class="mb-14 scale-[6]">
								<CommanderDamage playerIndex={$randomizerModalData.playerId - 1} color="inherit" extraEffects="ss-mythic ss-grad" extraRotationEffect="transform: rotate(0deg);" />
							</div>
						{/if} -->
						{$randomizerModalData.playerName}
					</span>
				</div>
			{:else}
				<div class="h-[49px] items-center flex justify-center">
					{#if $randomizerModalData.type === 'custom'}
						<div class="grid grid-cols-1 items-center justify-items-center">
							<div class="text-large text-white relative -mt-8">
								{$_('sided_die_before')}
								{$appSettings.customRandomNumber || 0}
								{$_('sided_die')}
							</div>
							<div class="text-5xl text-white mt-6 relative -bottom-2">
								{$randomizerModalData.result}
							</div>
						</div>
					{:else if $randomizerModalData.type === 'dplanar'}
						<div class="h-[132px] w-[120px] flex flex-col items-center justify-center gap-2">
							<div
								class="h-[96px] w-[96px] rounded-2xl border border-white/20 bg-black/35 flex items-center justify-center"
								class:dice-rolling={rolling}
								class:dice-final={!rolling && displayResult > 0}
								style="--dice-rolling-duration: {rollingMs}ms;"
							>
								{#if displayResult === 1}
									<Dplanar size={iconSize} finalGlow={!rolling} />
								{:else if displayResult === 2}
									<i
										class="mi mi-chaos mi-3x text-white"
										class:dice-final={!rolling}
										style="font-size: {iconSize};"
									></i>
								{:else}
									<span class="text-white text-5xl leading-none">-</span>
								{/if}
							</div>
							<div class="text-white text-sm text-center">
								{#if displayResult === 1}
									{$_('planar_result_planeswalk')}
								{:else if displayResult === 2}
									{$_('planar_result_chaos')}
								{:else}
									{$_('planar_result_blank')}
								{/if}
							</div>
						</div>
					{:else if $randomizerModalData.type === 'd2'}
						<div class="h-[132px] w-[120px] flex flex-col items-center justify-center gap-2">
							<div class="h-[96px] w-[96px] flex items-center justify-center">
								<i
									class="{diceClass} text-white"
									class:dice-rolling={rolling}
									class:dice-final={!rolling && displayResult > 0}
									style="font-size: {iconSize}; --dice-rolling-duration: {rollingMs}ms;"
								></i>
							</div>
							<div class="text-white text-sm text-center min-h-[20px]">
								{#if resultTranslationKey}
									{$_(resultTranslationKey)}
								{/if}
							</div>
						</div>
					{:else}
						<i
							class="{diceClass} text-white"
							class:dice-rolling={rolling}
							class:dice-final={!rolling &&
								displayResult > 0 &&
								$randomizerModalData.type !== 'custom'}
							style="font-size: {iconSize}; --dice-rolling-duration: {rollingMs}ms;"
						></i>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
