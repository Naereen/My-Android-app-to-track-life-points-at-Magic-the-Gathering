<script lang="ts">
	import FirstPlace from '$lib/assets/icons/FirstPlace.svelte';
	import Minus from '$lib/assets/icons/Minus.svelte';
	import Plus from '$lib/assets/icons/Plus.svelte';
	import Skull from '$lib/assets/icons/Skull.svelte';
	import StatusSkull from '$lib/assets/icons/StatusSkull.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import Storied from '$lib/assets/icons/Storied.svelte';
	import Acorn from '$lib/assets/icons/Acorn.svelte';
	import Ticket from '$lib/assets/icons/Ticket.svelte';
	import Paws from '$lib/assets/icons/Paws.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import { _, number } from 'svelte-i18n';
	import { appSettings } from '$lib/store/appSettings';
	import { appState } from '$lib/store/appState';
    import { turnTimer } from '$lib/store/turnTimer';
	import { openPlayerModal } from '$lib/store/modal';
	import {
		getCommandTaxBySourceForPlayer,
		getCommandTaxTotalForPlayer,
		getCommanderDamageTotalsForPlayer,
		getMaxCommanderDamageSingleSource,
		lifeChangeHistoryResetKey,
		manageLifeTotal,
		players,
		setPlayerLifeAbsolute,
		setPlayerHighlighted,
		spinning
	} from '$lib/store/player';
	import { tick } from 'svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import Minimap from './Minimap.svelte';
	import LifeChangeHistory from './LifeChangeHistory.svelte';
	import { vibrate } from '$lib/utils/haptics';
	import { isMobileDevice } from '$lib/utils/detectMobile';

	export let doNotShowMinimap: boolean = false; // for testing purposes, to hide the minimap in the player component
	export let orientation: App.Player.Orientation = 'up';
	export let id: number;
	export let layout: 'two-by-two' | 'one-two-one' | '' = '';

	let interval: ReturnType<typeof setInterval> | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let isHolding = false;
	let holdingType: App.Player.LifeMoveType | null = null;
	const MOUSE_AFTER_TOUCH_GUARD_MS = 1000;
	let lastTouchAt = 0;

	/**
	 * Filters ghost mouse events emitted right after touch events on mobile browsers.
	 * @returns {unknown} Result produced by isLikelySyntheticMouseEvent.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const isLikelySyntheticMouseEvent = () =>
		(Date.now() - lastTouchAt) < MOUSE_AFTER_TOUCH_GUARD_MS;
	$: innerWidth = 0;
	$: isMobile = isMobileDevice(innerWidth);
	$: numberOfPlayers = $appSettings.playerCount;
	$: index = id - 1;
	$: isDead =
		($players[index].lifeTotal <= 0 &&
			!($appSettings.allowNegativeLife || $players[index].allowNegativeLife)) ||
		($players[index].poison ?? 0) >= 10 ||
		status?.ko === true ||
		$players[index].isDead === true ||
		maxCommanderDamage >= 21;
	$: bg = colorToBg($players[index].color ?? 'white');

	type BackgroundFrame = {
		rotation: string;
		positionX: string;
		positionY: string;
		width: string;
		height: string;
		top: string;
		left: string;
		bottom: string;
		right: string;
		size: string;
		splitTop: string;
		splitBottom: string;
	};

	const getHorizontalBackgroundFrame = (
		playerCount: number,
		mobile: boolean,
		seatOrientation: App.Player.Orientation
	): BackgroundFrame => {
		const isCompactTable = playerCount >= 5;
		const isDuel = playerCount <= 2;
		const isCrowdedSideSeat =
			(playerCount === 6 || playerCount === 7 || playerCount === 8) &&
			(seatOrientation === 'left' || seatOrientation === 'right');
		const isVeryCrowdedSideSeat =
			(playerCount === 8) && (seatOrientation === 'left' || seatOrientation === 'right');
		const width = !mobile
			? '200%'
			: isDuel
				? '160%'
				: isVeryCrowdedSideSeat
					? '220%'
				: isCrowdedSideSeat
					? '210%'
				: isCompactTable
					? '175%'
					: '210%';
		const height = !mobile
			? '260%'
			: isDuel
				? '160%'
				: isVeryCrowdedSideSeat
					? '200%'
				: isCrowdedSideSeat
					? '185%'
				: isCompactTable
					? '145%'
					: '125%';

		return {
			rotation: seatOrientation === 'left' ? '-90deg' : seatOrientation === 'right' ? '90deg' : '0deg',
			positionX: 'center',
			positionY: 'center',
			width,
			height,
			top: '50%',
			bottom: '50%',
			left: '50%',
			right: '50%',
			size: 'contain',  // FIXME: chose between 'cover' and 'contain', and then commit to that choice...
			splitTop: '25%',
			splitBottom: '75%',
		};
	};

	$: horizontalBackgroundFrame = getHorizontalBackgroundFrame(numberOfPlayers, isMobile, orientation);

	// Combine all these background-related variables into a single style string for easier application to the player container
	$: styleVars = (() => {
		const bgValue = $players[index].backgroundImage;
		// default no-image behavior
		if (!bgValue) {
			return `--bg-rotation: ${horizontalBackgroundFrame.rotation}; --bg-image: none; --bg-positionx: none; --bg-positiony: none; --bg-width: ${horizontalBackgroundFrame.width}; --bg-height: ${horizontalBackgroundFrame.height}; --bg-top: ${horizontalBackgroundFrame.top}; --bg-left: ${horizontalBackgroundFrame.left}; --bg-size: ${horizontalBackgroundFrame.size};`;
		}
		// support array of images (e.g. partners / double commanders)
		if (Array.isArray(bgValue) && bgValue.length > 1) {
			const two = bgValue.slice(0, 2);
			const images = two.map((u: string) => `url('${u}')`).join(', ');
			const image_left = `url('${two[0]}')`;
			const image_right = `url('${two[1]}')`;
			const bgBottom = '100%';

			return `--bg-image: ${images}; --bg-image-left: ${image_left}; --bg-image-right: ${image_right}; --bg-rotation: ${horizontalBackgroundFrame.rotation}; --bg-top: ${horizontalBackgroundFrame.top}; --bg-bottom: ${bgBottom}; --bg-left: ${horizontalBackgroundFrame.left}; --bg-right: ${horizontalBackgroundFrame.left}; --bg-left-top: ${horizontalBackgroundFrame.splitTop}; --pos-bottom: ${horizontalBackgroundFrame.splitBottom}; --bg-width: ${horizontalBackgroundFrame.width}; --bg-height: ${horizontalBackgroundFrame.height}; --bg-size: ${horizontalBackgroundFrame.size};`;
		}

		// single string image
		return `--bg-image: url('${bgValue}'); --bg-rotation: ${horizontalBackgroundFrame.rotation}; --bg-positionx: ${horizontalBackgroundFrame.positionX}; --bg-positiony: ${horizontalBackgroundFrame.positionY}; --bg-width: ${horizontalBackgroundFrame.width}; --bg-height: ${horizontalBackgroundFrame.height}; --bg-top: ${horizontalBackgroundFrame.top}; --bg-left: ${horizontalBackgroundFrame.left}; --bg-size: ${horizontalBackgroundFrame.size};`;
	})();

	$: status = $players[index].statusEffects ?? {};
	$: booleanStatuses = ['monarch', 'initiative', 'ascend', 'storied', 'ko'].filter(
		(k) => status[k]
	);
	$: poisonCount = $players[index].poison ?? 0;
	$: energyCount = status.energy ?? 0;
	$: experienceCount = status.experience ?? 0;
	$: radCount = status.rad ?? 0;
	$: acornCount = status.acorn ?? 0;
	$: ticketCount = status.ticket ?? 0;
	$: visibleAcornCount = $appSettings.enableAcornMode ? acornCount : 0;
	$: visibleTicketCount = $appSettings.enableTicketMode ? ticketCount : 0;
	$: commandTaxBySource = getCommandTaxBySourceForPlayer($players[index]);
	$: commandTaxCount = getCommandTaxTotalForPlayer($players[index]);
	$: commandTaxDisplay = status.partnerMode
		? `${commandTaxBySource[0]}/${commandTaxBySource[1]}`
		: `${commandTaxCount}`;
	$: ringBearerCount = status.ringBearer ?? 0;
	$: startYourEngineSpeedCount = status.startYourEngineSpeed ?? 0;
	$: commanderDamageArray = getCommanderDamageTotalsForPlayer($players[index], $appSettings.playerCount);
	$: commanderDamageVisibleCount = doNotShowMinimap
		? commanderDamageArray.filter((dmg) => dmg > 0).length
		: 0;
	$: statusEffectItemCount =
		[
			poisonCount,
			energyCount,
			experienceCount,
			radCount,
			visibleAcornCount,
			visibleTicketCount,
			commandTaxCount,
			ringBearerCount,
			startYourEngineSpeedCount
		].filter((count) => count > 0).length + commanderDamageVisibleCount;
	$: shouldWrapStatusEffects = statusEffectItemCount > 5;
	$: maxCommanderDamage = getMaxCommanderDamageSingleSource($players[index], $appSettings.playerCount);

	$: statusRotation =
		orientation === 'down' ? '180deg'
		: orientation === 'left' ? '-90deg'
		: orientation === 'right' ? '90deg'
		: '0deg';

	// Text rotation should be different for players on the right side (facing left)
	// Players 4, 5, 6 with orientation="left" should have text rotated to face right (90deg)
	$: statusTextRotation =
		orientation === 'left' ? '-180deg'
		: orientation === 'right' ? '0deg'
		: statusRotation;

	// Determine players that are physically on the right side in each player-count layout
	$: isRightFacingPlayer =
		($appSettings.playerCount === 3 && id === 3) ||
		($appSettings.playerCount === 4 && (id === 3 || id === 4)) ||
		($appSettings.playerCount >= 5 && id >= 3);

	/**
	 * Starts hold-to-repeat life adjustment using mouse input.
	 * @param {App.Player.LifeMoveType} type - Parameter used by handleMouseDown.
	 * @returns {unknown} Result produced by handleMouseDown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleMouseDown = (type: App.Player.LifeMoveType) => {
		if (isLikelySyntheticMouseEvent()) {
			return;
		}
		isHolding = true;
		holdingType = type;
		setPlayerHighlighted(id, true);

		timeout = setTimeout(() => {
			manageLifeTotal(type, id, 10);
			if (isHolding) {
				interval = setInterval(() => {
					vibrate(10);
					manageLifeTotal(type, id, 10);
				}, 1000);
			}
		}, 1000);
	};

	/**
	 * Stops hold-to-repeat sequence or applies single-step life change on click release.
	 * @param {App.Player.LifeMoveType} type - Parameter used by handleMouseUp.
	 * @returns {unknown} Result produced by handleMouseUp.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleMouseUp = (type: App.Player.LifeMoveType) => {
		if (isLikelySyntheticMouseEvent()) {
			return;
		}
		if (interval) {
			clearInterval(interval);
			interval = undefined;
		} else {
			manageLifeTotal(type, id);
		}
		clearTimeout(timeout);
		timeout = undefined;
		isHolding = false;
		holdingType = null;
		setPlayerHighlighted(id, false);
	};

	/**
	 * Starts hold-to-repeat life adjustment using touch input.
	 * @param {App.Player.LifeMoveType} type - Parameter used by handleTouchStart.
	 * @returns {unknown} Result produced by handleTouchStart.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTouchStart = (type: App.Player.LifeMoveType) => {
		lastTouchAt = Date.now();
		isHolding = true;
		holdingType = type;
		setPlayerHighlighted(id, true);

		timeout = setTimeout(() => {
			manageLifeTotal(type, id, 10);
			if (isHolding) {
				interval = setInterval(() => {
					vibrate(10);
					manageLifeTotal(type, id, 10);
				}, 1000);
			}
		}, 1000);
	};

	/**
	 * Ends touch hold interaction and applies either repeated or single-step life change.
	 * @param {App.Player.LifeMoveType} type - Parameter used by handleTouchEnd.
	 * @returns {unknown} Result produced by handleTouchEnd.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleTouchEnd = (type: App.Player.LifeMoveType) => {
		lastTouchAt = Date.now();
		if (interval) {
			clearInterval(interval);
			interval = undefined;
		} else {
			manageLifeTotal(type, id);
		}
		clearTimeout(timeout);
		timeout = undefined;
		isHolding = false;
		holdingType = null;
		setPlayerHighlighted(id, false);
	};

	/**
	 * Cancels pending hold operation on pointer leave/touch cancel without extra life mutation.
	 * @returns {unknown} Result produced by handleCancelHold.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleCancelHold = () => {
		lastTouchAt = Date.now();
		// Called on mouseleave / touchcancel — stop repeating and remove highlight without applying a final single change
		if (interval) {
			clearInterval(interval);
			interval = undefined;
		}
		clearTimeout(timeout);
		timeout = undefined;
		isHolding = false;
		holdingType = null;
		setPlayerHighlighted(id, false);
	};

	let editing = false;
	let editValue = '';

	/**
	 * Opens fallback prompt to set absolute life total directly.
	 * @returns {unknown} Result produced by openPromptSetLife.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const openPromptSetLife = () => {
		const current = $players[index].lifeTotal;
		const input = prompt($_('set_life_total') ?? 'Set life total', String(current));
		if (input === null) return;
		const val = Number(input);
		if (!Number.isNaN(val)) {
			setPlayerLifeAbsolute(id, val);
		}
	};

	/**
	 * Starts inline life editor and focuses/selects the input value.
	 * @returns {unknown} Result produced by startEdit.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const startEdit = async () => {
		editing = true;
		editValue = String($players[index].lifeTotal);
		await tick();
		const el = document.getElementById(`life-input-${id}`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	/**
	 * Saves inline life editor numeric value.
	 * @returns {unknown} Result produced by saveEdit.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const saveEdit = () => {
		const val = Number(editValue);
		if (!Number.isNaN(val)) {
			setPlayerLifeAbsolute(id, val);
		}
		editing = false;
	};

	/**
	 * Cancels inline life editor mode.
	 * @returns {unknown} Result produced by cancelEdit.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const cancelEdit = () => {
		editing = false;
	};

	$: timerFraction = $turnTimer.total ? ($turnTimer.remaining / $turnTimer.total) : 0;
	$: timerElapsed = Math.max(0, ($turnTimer.total || 0) - ($turnTimer.remaining || 0));
	$: isTimerOvertime = ($turnTimer.remaining || 0) < 0;
	$: overtimeElapsed = isTimerOvertime ? Math.abs($turnTimer.remaining || 0) : 0;
	$: timerDisplayElapsed = isTimerOvertime ? overtimeElapsed : timerElapsed;
	$: timerMinutes = Math.floor(timerDisplayElapsed / 60);
	$: timerSeconds = timerDisplayElapsed % 60;
	$: timerPrefix = isTimerOvertime ? '+' : '';

	// circumference for the timer circle (radius = 18 from the SVG)
	$: timerCircumference = 2 * Math.PI * 18;
	// dash offset based on fraction (0..1)
	$: dashOffset = timerCircumference * (1 - Math.max(0, Math.min(1, timerFraction)));

	$: if ($appSettings.turnTimerEnabled && index === $appState.currentTurn) {
		// start or reset timer for this player only when currentTurn or setting changes
		try { turnTimer.startForPlayer(index); } catch (e) {}
	}

	// stop the timer for this player when the store indicates it's running for them but they're no longer the current turn
	$: if ($appSettings.turnTimerEnabled && $turnTimer?.playerIndex === index && index !== $appState.currentTurn) {
		try { turnTimer.stop(); } catch (e) {}
	}
</script>

<svelte:window bind:innerWidth />

<div
	class="relative isolate flex w-full rounded-3xl flex-grow h-6"
	class:player--active={index === $appState.currentTurn && $appSettings.enableCurrentPlayerGlow && !$spinning && !$appState.isMenuOpen && timerFraction > 0.03}
	class:player--active-timer-over={index === $appState.currentTurn && $appSettings.enableCurrentPlayerGlow && !$spinning && !$appState.isMenuOpen && timerFraction <= 0.03}
	class:bg-rotated-horizontal={!!$players[index].backgroundImage}
	class:overflow-hidden={!!$players[index].backgroundImage}
	style={styleVars}
	style:background={!$players[index].backgroundImage ? bg : undefined}
	class:h-full={!$appState.isMenuOpen}
	class:opacity-75={$players[index].highlighted}
>
	<!-- Overlay au-dessus du background (non-interactif) -->
	<div
		class="bg-rotated-horizontal-overlay"
		class:highlight={$players[index].highlighted}
		class:dead={isDead}
	></div>
	<div
		class="relative z-20 flex w-full rounded-2xl flex-grow h-6"
		class:h-full={!$appState.isMenuOpen}
		class:opacity-75={$players[index].highlighted}
	>
		{#if !$appState.isMenuOpen}
			<div class="flex flex-col w-full relative">
				<div class="h-full flex flex-col" class:flex-col-reverse={orientation === 'left'}>
					{#if $appSettings.turnTimerEnabled && index === $appState.currentTurn}
						<div class="absolute z-30 pointer-events-auto cursor-pointer status-rotate-wrapper"
							class:bottom-2={orientation === 'left'}
							class:left-2={orientation === 'left'}
							class:right-2={orientation === 'right'}
							class:top-2={orientation === 'right'}
							on:click={() => {
								try {
									if ($turnTimer?.remaining <= 0) {
										turnTimer.resetForCurrent();
									}
								} catch (e) { console.log(e); }
							}}
							style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
						>
							<div class="w-10 h-10 flex items-center justify-center bg-black/40 rounded-full text-white text-sm">
								<svg viewBox="0 0 40 40" class="w-10 h-10">
									<circle cx="20" cy="20" r="18" stroke="#444" stroke-width="3" fill="none" />
									<circle cx="20" cy="20" r="18" stroke="#ffd54a" stroke-width="3" fill="none"
										transform="rotate(-90 20 20)"
										stroke-dasharray={timerCircumference} stroke-dashoffset={dashOffset}
										stroke-linecap="round"
									/>
								</svg>
								<div class="absolute text-xs">{timerPrefix}{String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}</div>
							</div>
						</div>
					{/if}
					<button
						on:mousedown={() => handleMouseDown('subtract')}
						on:mouseup={() => handleMouseUp('subtract')}
						on:touchstart={() => handleTouchStart('subtract')}
						on:touchend={() => handleTouchEnd('subtract')}
						on:contextmenu|preventDefault
						draggable="false"
						class="minus w-full h-1/2 flex justify-center {orientation === 'left'
							? 'items-end rounded-b-3xl'
							: 'items-start rounded-t-3xl'} active:bg-player-light select-none"
						on:mouseleave={handleCancelHold}
						on:touchcancel={handleCancelHold}
					>
						<div class="rotate-90">
							<Minus />
						</div>
					</button>
					<button
						on:mousedown={() => handleMouseDown('add')}
						on:mouseup={() => handleMouseUp('add')}
						on:touchstart={() => handleTouchStart('add')}
						on:touchend={() => handleTouchEnd('add')}
						on:contextmenu|preventDefault
						draggable="false"
						class="plus w-full h-1/2 flex justify-center {orientation === 'left'
							? 'items-start rounded-t-3xl'
							: 'items-end rounded-b-3xl'} active:bg-player-light select-none"
						on:mouseleave={handleCancelHold}
						on:touchcancel={handleCancelHold}
					>
						<Plus />
					</button>
				</div>
				<div
					class="absolute top-0 bottom-0 w-full -translate-x-1/2 cursor-pointer pointer-events-none flex items-center"
					class:flex-row={orientation === 'left'}
					class:left-[42%]={orientation === 'left'}
					class:left-[58%]={orientation === 'right'}
					class:flex-row-reverse={orientation === 'right'}
				>
					<div class="grow w-1/3 text-center flex justify-center items-center">
						<button
							on:click={() => openPlayerModal(id)}
							on:contextmenu|preventDefault
							draggable="false"
							class="py-2 px-1 rounded-lg mt-1 text-lg pointer-events-auto whitespace-nowrap vert shadow-lg"
							class:rotate-180={orientation === 'left'}
							style="background-color: {isDead ? 'black' : 'rgb(36, 36, 36, 0.9)'}"
						>
							<div class="flex items-center">
								<!--
								{#if !doNotShowMinimap }
									<div class="flex justify-center items-center mb-3 rotate-90">
										<div class="flex justify-center items-center mr-1">
											<CommanderDamage playerIndex={index} color="white" />
										</div>
									</div>
								{/if}
								-->
								{#if $players[index].isFirst}
									<div class="flex justify-center items-center mb-1 rotate-90">
										<FirstPlace />
									</div>
								{/if}
								<span
									class="beleren mr-1"
									style="font-size: x-large; color: white;"
									style:text-decoration={isDead ? 'line-through' : ''}
									class:overline={!$appSettings.enableCurrentPlayerGlow && $appSettings.showNextPlayerButton && index === $appState.currentTurn}
									>{$players[index].playerName}</span>
								<!-- Use the class:overline only if the glowing gold animation is disabled and if the next player button is enabled -->
								{#each booleanStatuses as s}
									{#if s === 'monarch'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<Crown />
										</div>
									{:else if s === 'initiative'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<Initiative />
										</div>
									{:else if s === 'ascend'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<Ascend />
										</div>
									{:else if s === 'storied'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<Storied />
										</div>
									{:else if s === 'ko'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<StatusSkull />
										</div>
									{/if}
								{/each}
							</div>
						</button>
					</div>
					<div class="w-1/3 flex justify-center items-center vert">
						<div class="relative flex items-center justify-center w-full h-full">
							<div
								class="absolute h-16 w-24 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white pointer-events-none"
								style="text-shadow: 0 0 20px black;"
								class:rotate-180={orientation === 'left'}
								class:h-8={$appSettings.playerCount >= 5}
								class:top-0={orientation === 'left'}
								class:top-[0%]={orientation === 'right'}
								class:translate-x-[0%]={orientation === 'left'}
								class:-translate-x-[25%]={orientation === 'right'}
								class:left-[50%]={orientation === 'left'}
								class:-left-[50%]={orientation === 'right'}
								class:translate-y-[75%]={orientation === 'left'}
								class:-translate-y-[175%]={orientation === 'right'}
								>
								{$players[index].tempLifeDiff < 0 ? `${$players[index].tempLifeDiff}` : ''}
							</div>
							{#if orientation === 'left'}
								<div
									class="absolute left-1/2 top-1/2 -translate-x-[50%] h-16 w-24 rotate-180 flex justify-start items-center pointer-events-none pl-2"
									class:h-8={$appSettings.playerCount >= 5}
									class:translate-y-[125%]={$appSettings.playerCount <= 4}
									class:translate-y-[100%]={$appSettings.playerCount > 4}
									class:text-xl={$appSettings.playerCount === 2}
									class:text-lg={$appSettings.playerCount > 2}
								>
									{#if $appSettings.showLifeChangeHistory }
										<LifeChangeHistory
											score={$players[index].lifeTotal}
											maxLines={6}
											resetToken={$lifeChangeHistoryResetKey}
										/>
									{/if}
								</div>
							{/if}
							{#if orientation === 'right'}
								<div
									class="absolute right-0 top-1/2 -translate-x-0 h-16 w-24 flex justify-start items-center pointer-events-none pl-2"
									class:h-8={$appSettings.playerCount >= 5}
									class:-translate-y-[225%]={$appSettings.playerCount <= 4}
									class:-translate-y-[100%]={$appSettings.playerCount > 4}
								>
									{#if $appSettings.showLifeChangeHistory }
										<LifeChangeHistory
											score={$players[index].lifeTotal}
											maxLines={6}
											resetToken={$lifeChangeHistoryResetKey}
										/>
									{/if}
								</div>
							{/if}
							{#if isDead}
								<div
									class="z-10 text-black"
									class:rotate-90={orientation === 'right'}
									class:-rotate-90={orientation === 'left'}
									class:-translate-x-0={orientation === 'right'}
									class:translate-x-0={orientation === 'left'}
									style="width: {$appSettings.playerCount >= 5 ? '2.5rem' : '3.25rem'}; height: {$appSettings.playerCount >= 5 ? '2.5rem' : '3.25rem'}; opacity: 1;"
								>
									<Skull />
									<br />
								</div>
							{/if}
							<div class="absolute left-1/2 top-1/2  -translate-y-1/2 flex items-center justify-center pointer-events-none"
								class:-translate-x-[33%]={orientation === 'left'}
								class:-translate-x-[67%]={orientation === 'right'}
							>
								{#if !editing}
									<button
										on:dblclick={startEdit}
										on:contextmenu|preventDefault={openPromptSetLife}
										class="bg-transparent border-none p-0 m-0 pointer-events-auto"
									>
										<span
											class="text-shadow-black text-shadow-xl/100 text-white font-bold flex items-center text-center leading-none"
											class:text-9xl={$appSettings.playerCount === 2}
											class:text-8xl={$appSettings.playerCount >= 3 && $appSettings.playerCount <= 4}
											class:text-6xl={$appSettings.playerCount >= 5}
											class:-rotate-180={orientation === 'left'}
											class:opacity-25={isDead}
											style="text-shadow: 0 0 40px black;">{$players[index].lifeTotal}</span
										>
									</button>
								{:else}
									<div class="pointer-events-auto">
										<input
											id={`life-input-${id}`}
											type="number"
											bind:value={editValue}
											on:keydown={(e) => {
												if (e.key === 'Enter') saveEdit();
												if (e.key === 'Escape') cancelEdit();
											}}
											class="max-w-16 max-h-14 center text-center rounded-md px-2 py-1 text-3xl text-black"
											class:-rotate-180={orientation === 'left'}
											placeholder={$_('enter_life_total_placeholder')}
										/>
										<div class="flex gap-2 mt-1 justify-center">
											<button on:click={saveEdit}
												class="px-2 py-1 bg-green-600 text-white rounded"
												class:-rotate-180={orientation === 'left'}
												>{$_('set_life_total_save')}</button
											>
											<button on:click={cancelEdit}
												class="px-2 py-1 bg-gray-600 text-white rounded"
												class:-rotate-180={orientation === 'left'}
												>{$_('set_life_total_cancel')}</button
											>
										</div>
									</div>
								{/if}
							</div>
							<div
								class="absolute top-1/2 right-1/2 h-16 w-24 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white pointer-events-none"
								style="text-shadow: 0 0 20px black;"
								class:rotate-180={orientation === 'left'}
								class:h-8={$appSettings.playerCount >= 5}
								class:-translate-y-[175%]={orientation === 'left'}
								class:translate-y-[75%]={orientation === 'right'}
								class:translate-x-[100%]={orientation === 'left'}
								class:-translate-x-[0%]={orientation === 'right'}
								>
								{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}
							</div>
						</div>
					</div>

					<div class="grow w-1/3 vert"></div>
				</div>
				<!-- Minimap & Status effects bar -->
				<div
					class="absolute z-20 top-0 bottom-0 flex justify-center pointer-events-none"
					class:vert-left={orientation === 'left'}
					class:vert-right={orientation === 'right'}
					class:left-1={orientation === 'right'}
					class:right-1={orientation === 'left'}
					class:hidden={$appState.isMenuOpen}
				>
					<div
						class="text-white text-xs rounded-full px-0 py-0 flex gap-0.5 items-center pointer-events-auto"
						class:flex-row={orientation === 'left'}
						class:flex-row-reverse={orientation === 'left'}
						class:flex-wrap={shouldWrapStatusEffects}
						class:gap-y-0={shouldWrapStatusEffects}
						class:justify-center={shouldWrapStatusEffects}
						class:max-h-[28rem]={shouldWrapStatusEffects}
					>
						{#if numberOfPlayers >= 3 && doNotShowMinimap === false }
							<div
								class:mr-1={orientation === 'right'}
								class:ml-1={orientation === 'left'}
							>
								<Minimap playerIndex={index} orientation={orientation} layout={layout} />
							</div>
						{/if}
						{#if commandTaxCount > 0}
							<div
								title={$_('tooltip_status_command_tax')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{commandTaxDisplay}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<CommandTax />
								</div>
							</div>
						{/if}
						{#if poisonCount > 0}
							<div
								title={$_('tooltip_status_poison')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{poisonCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<PoisonIcon />
								</div>
							</div>
						{/if}
						{#if energyCount > 0}
							<div
								title={$_('tooltip_status_energy')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{energyCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<Energy />
								</div>
							</div>
						{/if}
						{#if experienceCount > 0}
							<div
								title={$_('tooltip_status_experience')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{experienceCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<Experience />
								</div>
							</div>
						{/if}
						{#if radCount > 0}
							<div
								title={$_('tooltip_status_rad')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{radCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<Rad />
								</div>
							</div>
						{/if}
					{#if visibleAcornCount > 0}
						<div
							title={$_('tooltip_status_acorn')}
							class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
							on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
						>
							<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{visibleAcornCount}</span>
							<div
								class="status-rotate-wrapper"
								style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
							>
								<Acorn />
							</div>
						</div>
					{/if}
					{#if visibleTicketCount > 0}
						<div
							title={$_('tooltip_status_tickets')}
							class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
							on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
						>
							<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{visibleTicketCount}</span>
							<div
								class="status-rotate-wrapper"
								style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
							>
								<Ticket />
							</div>
						</div>
					{/if}
						{#if ringBearerCount > 0}
							<div
								title={$_('tooltip_status_ring_bearer')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{ringBearerCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<TheRingerBearer isMax={ringBearerCount === 4} />
								</div>
							</div>
						{/if}
						{#if startYourEngineSpeedCount > 0}
							<div
								title={$_('tooltip_status_start_your_engine_speed')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0"
								on:click={() => openPlayerModal(id, 'status_effects')} role="button" tabindex="0"
							>
								<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base leading-none">{startYourEngineSpeedCount}</span>
								<div
									class="status-rotate-wrapper"
									style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
								>
									<StartYourEngineSpeed isMax={startYourEngineSpeedCount === 4} />
								</div>
							</div>
						{/if}
						{#if doNotShowMinimap}
							<!-- If the minimap is disabled, show a placeholder icon to indicate CommanderDamage (like before) -->
							{#each commanderDamageArray as dmg, i}
								{#if dmg > 0}
									<div
										title={$_('tooltip_commander_damage')}
										class="px-0.5 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5"
										on:click={() => openPlayerModal(id, 'commander')} role="button" tabindex="0"
									>
										{#if isRightFacingPlayer}
											<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base">{dmg}</span>
											<div
												class="status-rotate-wrapper"
												style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
											>
												<!-- <CommanderDamage playerIndex={i} color="white" /> -->
											</div>
										{:else}
											<div
												class="status-rotate-wrapper"
												style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
											>
												<!-- <CommanderDamage playerIndex={i} color="white" /> -->
											</div>
											<span style="transform: rotate({statusTextRotation}); display: inline-flex;" class="text-base">{dmg}</span>
										{/if}
									</div>
								{/if}
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
