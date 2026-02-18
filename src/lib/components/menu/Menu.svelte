<script lang="ts">
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import ManaPentagon from '$lib/assets/icons/ManaPentagon.svelte';
	import Reset from '$lib/assets/icons/Reset.svelte';
	import { appSettings } from '$lib/store/appSettings';
	import { resetLifeTotals, spinToSelectRandomPlayer } from '$lib/store/player';
	import { appState, toggleIsMenuOpen, nextTurn, prevTurn } from '$lib/store/appState';
	import CircularButton from '../shared/circularButton/CircularButton.svelte';
	import Randomizer from './subcomponents/randomizer/Randomizer.svelte';
	import EmblemMenu from './subcomponents/emblem/EmblemMenu.svelte';
	import Resources from './subcomponents/resources/Resources.svelte';
	import Settings from './subcomponents/settings/Settings.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import { vibrate } from '$lib/utils/haptics';
	import { _ } from 'svelte-i18n';
    import { onMount, onDestroy } from 'svelte';

	// Animation state for turn counter badge
	let prevTurnCount = 0;
	let animateTurn: boolean = false;
	let animateTimeout: ReturnType<typeof setTimeout> | null = null;

	let turnPrevTimeout: ReturnType<typeof setTimeout> | null = null;
	let turnPrevTriggered = false;

	let randomPlayerTimeout: ReturnType<typeof setTimeout> | null = null;
	let randomPlayerTriggered = false;

	const handleTurnDown = () => {
		vibrate(20);
		// start long-press to go to previous player (on Next button)
		if (turnPrevTimeout) clearTimeout(turnPrevTimeout);
		turnPrevTimeout = setTimeout(() => {
			turnPrevTriggered = true;
			prevTurn();
		}, 700);
	};

	const handleTurnUp = () => {
		vibrate(20);
		if (turnPrevTimeout) {
			clearTimeout(turnPrevTimeout);
			turnPrevTimeout = null;
		}
		// reset trigger after a small delay so that click handler can check it
		if (turnPrevTriggered) {
			setTimeout(() => {
				turnPrevTriggered = false;
			}, 50);
		}
	};

	const handleRandomPlayerDown = () => {
		vibrate(20);
		// start long-press to go to previous player (on Next button)
		if (randomPlayerTimeout) clearTimeout(randomPlayerTimeout);
		randomPlayerTimeout = setTimeout(() => {
			randomPlayerTriggered = true;
			spinToSelectRandomPlayer();
		}, 500);
	};

	const handleRandomPlayerUp = () => {
		vibrate(20);
		if (randomPlayerTimeout) {
			clearTimeout(randomPlayerTimeout);
			randomPlayerTimeout = null;
		}
		// reset trigger after a small delay so that click handler can check it
		if (randomPlayerTriggered) {
			setTimeout(() => {
				randomPlayerTriggered = false;
			}, 50);
		}
	};

	const handleManaClick = () => {
		vibrate(20);
		toggleIsMenuOpen('resources');
	};

	const handleNextClick = () => {
		vibrate(20);
		if (turnPrevTriggered) {
			// consumed by long-press
			turnPrevTriggered = false;
			return;
		}
		nextTurn();
	};

	onMount(() => {
		prevTurnCount = $appState.turnCount || 0;
	});

	onDestroy(() => {
		if (animateTimeout) clearTimeout(animateTimeout);
	});

// Watch for changes to the turn count and trigger animation when it changes
$: if ($appState.turnCount !== prevTurnCount) {
	if (prevTurnCount !== 0) {
		animateTurn = true;
		if (animateTimeout) clearTimeout(animateTimeout);
		animateTimeout = setTimeout(() => {
			animateTurn = false;
			animateTimeout = null;
		}, 2000);
	}
	prevTurnCount = $appState.turnCount || 0;
}
</script>

{#if !$appState.isMenuOpen}
	<div class="flex justify-around py-1.5 items-center" class:h-14={!$appState.isMenuOpen}>
		<div class="flex justify-center items-center flex-grow">
			<button
				on:click={() => resetLifeTotals(false)}
				on:contextmenu|preventDefault
				draggable="false"
				class="h-10 w-10"><Reset /></button
			>
		</div>
		<div class="flex justify-center items-center flex-grow">
			<CircularButton
				on:click={() => toggleIsMenuOpen('settings')}
				number={$appSettings.playerCount}
				highlight
			/>
		</div>
		{#if $appSettings.showEmblemMenu}
			<div class="flex justify-center items-center flex-grow">
				<button
					on:click={() => toggleIsMenuOpen('emblem')}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('emblems_and_dungeons')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🗺️</span>
				</button>
			</div>
		{/if}
		<div class="flex justify-center items-center flex-grow">
			<button on:click={handleManaClick} on:contextmenu|preventDefault draggable="false">
				<ManaPentagon />
			</button>
		</div>
		{#if $appSettings.showNextPlayerButton}
			<div class="flex justify-center items-center flex-grow">
				<button
					on:mousedown={handleTurnDown}
					on:mouseup={handleTurnUp}
					on:mouseleave={handleTurnUp}
					on:touchstart={handleTurnDown}
					on:touchend={handleTurnUp}
					on:touchcancel={handleTurnUp}
					on:click={handleNextClick}
					on:contextmenu|preventDefault
					draggable="false"
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white"
					title="Next player"
				>
					<span class="inline-flex items-center">
						<!-- <span>↪</span> -->
						<span>↩</span>
						{#if $appState.turnCount > 0}
							<span class="ml-1 w-6 h-6 rounded-full text-xl flex items-center justify-center turn-badge" class:animate={animateTurn}>#{$appState.turnCount}</span>
						{/if}
					</span>
				</button>
			</div>
		{/if}
		<div class="flex justify-center items-center flex-grow"
		>
			<button
				on:click={() => toggleIsMenuOpen('randomizer')}
				on:mousedown={handleRandomPlayerDown}
				on:mouseup={handleRandomPlayerUp}
				on:mouseleave={handleRandomPlayerUp}
				on:touchstart={handleRandomPlayerDown}
				on:touchend={handleRandomPlayerUp}
				on:touchcancel={handleRandomPlayerUp}
				on:contextmenu|preventDefault
				draggable="false"
			>
				<Dsix />
			</button>
		</div>
	</div>
{:else if $appState.activeMenu === 'settings'}
	<Settings on:resetLifeTotals />
{:else if $appState.activeMenu === 'resources'}
	<Resources />
{:else if $appState.activeMenu === 'randomizer'}
	<Randomizer />
{:else if $appState.activeMenu === 'emblem'}
	<EmblemMenu />
{/if}
