<script lang="ts">
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import ManaPentagon from '$lib/assets/icons/ManaPentagon.svelte';
	import Reset from '$lib/assets/icons/Reset.svelte';
	import {
		appSettings,
		setShowArchenemyMenu,
		setShowEmblemMenu,
		setShowGameHistoryMenu,
		setBountyModeEnabled,
		setShowPlanechaseMenu,
		setShowResourcesButton,
		setShowTreacheryMenu,
		setShowVanguardMenu
	} from '$lib/store/appSettings';
	import { resetLifeTotals, spinToSelectRandomPlayer } from '$lib/store/player';
	import { appState, toggleIsMenuOpen, nextTurn, prevTurn } from '$lib/store/appState';
	import { replayLastRandomizerRoll } from '$lib/store/modal';
	import CircularButton from '../shared/circularButton/CircularButton.svelte';
	import Randomizer from './subcomponents/randomizer/Randomizer.svelte';
	import EmblemMenu from './subcomponents/emblem/EmblemMenu.svelte';
	import VanguardMenu from './subcomponents/vanguard/VanguardMenu.svelte';
	import TreacheryMenu from './subcomponents/treachery/TreacheryMenu.svelte';
	import BountyMenu from './subcomponents/bounty/BountyMenu.svelte';
	import HistoryMenu from './subcomponents/history/HistoryMenu.svelte';
	import PlanechaseMenu from './subcomponents/planechase/PlanechaseMenu.svelte';
	import ArchenemyMenu from './subcomponents/archenemy/ArchenemyMenu.svelte';
	import DayNightCycle from './subcomponents/dayNight/DayNightCycle.svelte';
	import Resources from './subcomponents/resources/Resources.svelte';
	import Settings from './subcomponents/settings/Settings.svelte';
	import { vibrate } from '$lib/utils/haptics';
	import { _ } from 'svelte-i18n';
	import { onMount, onDestroy } from 'svelte';
	import { globalGameTimer } from '$lib/store/globalGameTimer';

	// Animation state for turn counter badge
	let prevTurnCount = 0;
	let animateTurn: boolean = false;
	let animateTimeout: ReturnType<typeof setTimeout> | null = null;

	let turnPrevTimeout: ReturnType<typeof setTimeout> | null = null;
	let turnPrevTriggered = false;

	let randomPlayerTimeout: ReturnType<typeof setTimeout> | null = null;
	let randomPlayerTriggered = false;
	let menuButtonHideTimeout: ReturnType<typeof setTimeout> | null = null;
	let menuButtonHideTriggered = false;
	let timerGlowTimeout: ReturnType<typeof setTimeout> | null = null;
	let previousMinutePulseId = 0;
	let timerGlowClass = '';

	const startMenuButtonHideLongPress =
		(hideFn: () => void, delayMs = 700) =>
		() => {
			if (menuButtonHideTimeout) clearTimeout(menuButtonHideTimeout);
			menuButtonHideTimeout = setTimeout(() => {
				menuButtonHideTriggered = true;
				hideFn();
				vibrate(24);
			}, delayMs);
		};

	const endMenuButtonHideLongPress = () => {
		if (menuButtonHideTimeout) {
			clearTimeout(menuButtonHideTimeout);
			menuButtonHideTimeout = null;
		}
		if (menuButtonHideTriggered) {
			setTimeout(() => {
				menuButtonHideTriggered = false;
			}, 50);
		}
	};

	const consumeMenuButtonLongPress = () => {
		if (!menuButtonHideTriggered) return false;
		menuButtonHideTriggered = false;
		return true;
	};

	const startHideResourcesButton = startMenuButtonHideLongPress(() =>
		setShowResourcesButton(false)
	);
	const startHideEmblemButton = startMenuButtonHideLongPress(() => setShowEmblemMenu(false));
	const startHideVanguardButton = startMenuButtonHideLongPress(() => setShowVanguardMenu(false));
	const startHideTreacheryButton = startMenuButtonHideLongPress(() => setShowTreacheryMenu(false));
	const startHidePlanechaseButton = startMenuButtonHideLongPress(() =>
		setShowPlanechaseMenu(false)
	);
	const startHideArchenemyButton = startMenuButtonHideLongPress(() => setShowArchenemyMenu(false));
	const startHideHistoryButton = startMenuButtonHideLongPress(() => setShowGameHistoryMenu(false));
	const startHideBountyButton = startMenuButtonHideLongPress(() => setBountyModeEnabled(false));

	/**
	 * Starts long-press detection on the Next button to trigger previous-turn navigation.
	 * @returns {unknown} Result produced by handleTurnDown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTurnDown = () => {
		vibrate(20);
		// start long-press to go to previous player (on Next button)
		if (turnPrevTimeout) clearTimeout(turnPrevTimeout);
		turnPrevTimeout = setTimeout(() => {
			turnPrevTriggered = true;
			prevTurn();
		}, 700);
	};

	/**
	 * Ends long-press tracking on the Next button and resets trigger state.
	 * @returns {unknown} Result produced by handleTurnUp.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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

	/**
	 * Starts long-press detection for random-player button (replay last roll or random seat).
	 * @returns {unknown} Result produced by handleRandomPlayerDown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleRandomPlayerDown = () => {
		vibrate(20);
		// Long press: replay last randomizer die roll, or fallback to random player selection.
		if (randomPlayerTimeout) clearTimeout(randomPlayerTimeout);
		randomPlayerTimeout = setTimeout(() => {
			randomPlayerTriggered = true;
			const replayedLastRoll = replayLastRandomizerRoll();
			if (!replayedLastRoll) {
				spinToSelectRandomPlayer();
			}
		}, 500);
	};

	/**
	 * Ends random-player long-press tracking and clears delayed trigger state.
	 * @returns {unknown} Result produced by handleRandomPlayerUp.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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

	/**
	 * Opens randomizer menu unless the click was consumed by long-press behavior.
	 * @returns {unknown} Result produced by handleRandomizerClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleRandomizerClick = () => {
		if (randomPlayerTriggered) {
			// consumed by long-press
			randomPlayerTriggered = false;
			return;
		}
		toggleIsMenuOpen('randomizer');
	};

	/**
	 * Opens resources menu from the mana button.
	 * @returns {unknown} Result produced by handleManaClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleManaClick = () => {
		if (consumeMenuButtonLongPress()) return;
		vibrate(20);
		toggleIsMenuOpen('resources');
	};

	const handleEmblemClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('emblem');
	};

	const handleVanguardClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('vanguard');
	};

	const handleTreacheryClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('treachery');
	};

	const handlePlanechaseClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('planechase');
	};

	const handleArchenemyClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('archenemy');
	};

	const handleHistoryClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('history');
	};

	const handleBountyClick = () => {
		if (consumeMenuButtonLongPress()) return;
		toggleIsMenuOpen('bounty');
	};

	/**
	 * Advances turn unless the click was consumed by previous-turn long-press.
	 * @returns {unknown} Result produced by handleNextClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleNextClick = () => {
		vibrate(20);
		if (turnPrevTriggered) {
			// consumed by long-press
			turnPrevTriggered = false;
			return;
		}
		nextTurn();
	};

	/**
	 * Toggles pause/resume for the global match timer.
	 * @returns {unknown} Result produced by handleGlobalGameTimerClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleGlobalGameTimerClick = () => {
		vibrate(20);
		globalGameTimer.togglePause();
	};

	onMount(() => {
		prevTurnCount = $appState.turnCount || 0;
	});

	onDestroy(() => {
		if (animateTimeout) clearTimeout(animateTimeout);
		if (timerGlowTimeout) clearTimeout(timerGlowTimeout);
		if (menuButtonHideTimeout) clearTimeout(menuButtonHideTimeout);
	});

	const formatGlobalTimer = (seconds: number): string => {
		const isNegative = seconds < 0;
		const absSeconds = Math.abs(seconds);
		const hours = Math.floor(absSeconds / 3600);
		const minutes = Math.floor((absSeconds % 3600) / 60);
		const remainingSeconds = absSeconds % 60;
		const core =
			hours > 0
				? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
				: `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
		return `${isNegative ? '-' : ''}${core}`;
	};

	$: if ($globalGameTimer.minutePulseId !== previousMinutePulseId) {
		previousMinutePulseId = $globalGameTimer.minutePulseId;
		timerGlowClass =
			$globalGameTimer.minutePulseKind === 'negative'
				? 'global-timer-glow-negative'
				: 'global-timer-glow-positive';
		if (timerGlowTimeout) clearTimeout(timerGlowTimeout);
		timerGlowTimeout = setTimeout(() => {
			timerGlowClass = '';
			timerGlowTimeout = null;
		}, 2800);
	}

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
	<div class="flex py-1.5 items-center overflow-x-auto scrollbar-hidden" class:h-14={!$appState.isMenuOpen}>
		<div class="flex justify-center items-center flex-shrink-0 px-1">
			<button
				on:click={() => resetLifeTotals(false)}
				on:contextmenu|preventDefault
				draggable="false"
				class="h-10 w-10"><Reset /></button
			>
		</div>
		<div class="flex justify-center items-center flex-shrink-0 px-1">
			<CircularButton
				on:click={() => toggleIsMenuOpen('settings')}
				number={$appSettings.playerCount}
				highlight
			/>
		</div>
		{#if $appSettings.globalGameTimerEnabled}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					type="button"
					on:click={handleGlobalGameTimerClick}
					class={`global-game-timer-box ${timerGlowClass}`}
					title={$globalGameTimer.running ? 'Pause timer' : 'Resume timer'}
				>
					{#if $globalGameTimer.running}
						<span class="global-game-timer-text"
							>{formatGlobalTimer($globalGameTimer.remaining)}</span
						>
					{:else}
						<span class="global-game-timer-overlay" aria-hidden="true">
							⏯️
							{formatGlobalTimer($globalGameTimer.remaining)}
						</span>
					{/if}
				</button>
			</div>
		{/if}
		{#if $appSettings.showEmblemMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleEmblemClick}
					on:mousedown={startHideEmblemButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideEmblemButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('emblems_and_dungeons')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🗺️</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showVanguardMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleVanguardClick}
					on:mousedown={startHideVanguardButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideVanguardButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('vanguard_menu')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🛡️</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showTreacheryMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleTreacheryClick}
					on:mousedown={startHideTreacheryButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideTreacheryButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('treachery_menu')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🕵️</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showBountyMenu || $appSettings.bountyModeEnabled}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleBountyClick}
					on:mousedown={startHideBountyButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideBountyButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('bounty_menu')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🎯</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showPlanechaseMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handlePlanechaseClick}
					on:mousedown={startHidePlanechaseButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHidePlanechaseButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('planechase_menu_title')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<i class="mi mi-chaos mi-1x text-white"></i>
				</button>
			</div>
		{/if}
		{#if $appSettings.showArchenemyMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleArchenemyClick}
					on:mousedown={startHideArchenemyButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideArchenemyButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('archenemy_menu_title')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">😈</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showGameHistoryMenu}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleHistoryClick}
					on:mousedown={startHideHistoryButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideHistoryButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
					title={$_('game_history')}
					class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center"
				>
					<span class="text-large">🕘</span>
				</button>
			</div>
		{/if}
		{#if $appState.dayNightCycleEnabled}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<DayNightCycle />
			</div>
		{/if}
		{#if $appSettings.showResourcesButton}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
				<button
					on:click={handleManaClick}
					on:mousedown={startHideResourcesButton}
					on:mouseup={endMenuButtonHideLongPress}
					on:mouseleave={endMenuButtonHideLongPress}
					on:touchstart={startHideResourcesButton}
					on:touchend={endMenuButtonHideLongPress}
					on:touchcancel={endMenuButtonHideLongPress}
					on:contextmenu|preventDefault
					draggable="false"
				>
					<ManaPentagon />
				</button>
			</div>
		{/if}
		{#if $appSettings.showNextPlayerButton}
			<div class="flex justify-center items-center flex-shrink-0 px-1">
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
						<!-- <span>↩</span> -->
						<span>🔂</span>
						{#if $appState.turnCount > 0}
							<span
								class="ml-1 w-6 h-6 rounded-full text-xl flex items-center justify-center turn-badge"
								class:animate={animateTurn}>T{$appState.turnCount}</span
							>
						{/if}
					</span>
				</button>
			</div>
		{/if}
		{#if $appSettings.showRandomizerButton}
			<div class="flex justify-center items-center flex-grow text-sm">
				<button
					on:click={handleRandomizerClick}
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
		{/if}
	</div>
{:else if $appState.activeMenu === 'settings'}
	<Settings on:resetLifeTotals />
{:else if $appState.activeMenu === 'resources'}
	<Resources />
{:else if $appState.activeMenu === 'randomizer'}
	<Randomizer />
{:else if $appState.activeMenu === 'emblem'}
	<EmblemMenu />
{:else if $appState.activeMenu === 'vanguard'}
	<VanguardMenu />
{:else if $appState.activeMenu === 'treachery'}
	<TreacheryMenu />
{:else if $appState.activeMenu === 'bounty'}
	<BountyMenu />
{:else if $appState.activeMenu === 'planechase'}
	<PlanechaseMenu />
{:else if $appState.activeMenu === 'archenemy'}
	<ArchenemyMenu />
{:else if $appState.activeMenu === 'history'}
	<HistoryMenu />
{/if}
