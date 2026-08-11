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
	import { _ } from 'svelte-i18n';
	import { appSettings, getPoisonLethalLimit } from '$lib/store/appSettings';
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

	// Vertical cards are the canonical single-seat shape; the background logic is kept here
	// because it differs from the horizontal component in coverage and image splitting.

	/**
	 * Detects synthetic mouse events fired after touch to avoid duplicate life updates.
	 * @returns {unknown} Result produced by isLikelySyntheticMouseEvent.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const isLikelySyntheticMouseEvent = () => Date.now() - lastTouchAt < MOUSE_AFTER_TOUCH_GUARD_MS;

	$: innerWidth = 0;
	$: isMobile = isMobileDevice(innerWidth);
	$: numberOfPlayers = $appSettings.playerCount;
	$: poisonLethalLimit = getPoisonLethalLimit($appSettings.startingLifeTotal);
	$: index = id - 1;
	$: hasSplitBackground =
		Array.isArray($players[index].backgroundImage) && $players[index].backgroundImage.length > 1;
	$: isDead =
		($players[index].lifeTotal <= 0 &&
			!($appSettings.allowNegativeLife || $players[index].allowNegativeLife)) ||
		($players[index].poison ?? 0) >= poisonLethalLimit ||
		status?.ko === true ||
		$players[index].isDead === true ||
		maxCommanderDamage >= 21;
	$: bg = colorToBg($players[index].color ?? 'white');

	const verticalBackgroundFrame = {
		rotation: '0deg',
		positionX: 'center',
		positionY: 'center',
		width: '100%',
		height: '100%',
		top: '50%',
		bottom: '50%',
		left: '50%',
		right: '50%',
		size: 'cover' // FIXME: chose between 'cover' and 'contain', and then commit to that choice...
	};

	// Combine all these background-related variables into a single style string for easier application to the player container
	$: styleVars = (() => {
		const bgValue = $players[index].backgroundImage;
		// The full style string avoids a pile of conditional class bindings in the template,
		// which would be harder to keep aligned with the split-image rules.
		// default no-image behavior
		if (!bgValue) {
			return `--bg-image: none; --bg-rotation: ${verticalBackgroundFrame.rotation}; --bg-positionx: ${verticalBackgroundFrame.positionX}; --bg-positiony: ${verticalBackgroundFrame.positionY}; --bg-width: ${verticalBackgroundFrame.width}; --bg-height: ${verticalBackgroundFrame.height}; --bg-top: ${verticalBackgroundFrame.top}; --bg-left: ${verticalBackgroundFrame.left}; --bg-size: ${verticalBackgroundFrame.size};`;
		}
		if (Array.isArray(bgValue) && bgValue.length > 1) {
			const two = bgValue.slice(0, 2);
			const imageLeft = `url('${two[0]}')`;
			const imageRight = `url('${two[1]}')`;

			return `--bg-fallback-color: ${bg}; --bg-image-left: ${imageLeft}; --bg-image-right: ${imageRight}; --bg-rotation: ${verticalBackgroundFrame.rotation}; --bg-top: 50%; --bg-left: 25%; --bg-right: 75%; --pos-left: 50%; --pos-right: 50%; --bg-width: 50%; --bg-height: 100%; --bg-size: cover; --bg-positionx: center; --bg-positiony: center; --bg-repeat: no-repeat; --bg-clip: padding-box; --bg-origin: padding-box;`;
		}

		// single string image
		return `--bg-image: url('${bgValue}'); --bg-rotation: ${verticalBackgroundFrame.rotation}; --bg-positionx: ${verticalBackgroundFrame.positionX}; --bg-positiony: ${verticalBackgroundFrame.positionY}; --bg-width: ${verticalBackgroundFrame.width}; --bg-height: ${verticalBackgroundFrame.height}; --bg-top: ${verticalBackgroundFrame.top}; --bg-left: ${verticalBackgroundFrame.left}; --bg-size: ${verticalBackgroundFrame.size};`;
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
	$: commanderDamageArray = getCommanderDamageTotalsForPlayer(
		$players[index],
		$appSettings.playerCount
	);
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
	$: shouldWrapStatusEffects = statusEffectItemCount > 10;
	$: maxCommanderDamage = getMaxCommanderDamageSingleSource(
		$players[index],
		$appSettings.playerCount
	);

	// Vertical slots can hold more content before wrapping, so the threshold is higher than
	// on horizontal seats.

	/**
	 * Begins mouse hold-to-repeat life adjustment for vertical player card.
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
	 * Finalizes mouse hold interaction and applies either repeated or click-based delta.
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
	 * Begins touch hold-to-repeat life adjustment.
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
	 * Ends touch interaction and commits appropriate life delta.
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
	 * Cancels active hold sequence without adding an extra tap-based change.
	 * @returns {unknown} Result produced by handleCancelHold.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleCancelHold = () => {
		lastTouchAt = Date.now();
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
	 * Opens prompt fallback to set an absolute life total.
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
	 * Enables inline life editing and focuses the numeric field.
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
	 * Saves inline life edit value to player store.
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
	 * Exits inline life edit mode without applying changes.
	 * @returns {unknown} Result produced by cancelEdit.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const cancelEdit = () => {
		editing = false;
	};

	$: timerFraction = $turnTimer.total ? $turnTimer.remaining / $turnTimer.total : 0;
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
		try {
			turnTimer.startForPlayer(index);
		} catch (e) {
			console.log(e);
		}
	}

	// stop timer for this player when the store indicates it's running for them but they're no longer the current turn
	$: if (
		$appSettings.turnTimerEnabled &&
		$turnTimer?.playerIndex === index &&
		index !== $appState.currentTurn
	) {
		try {
			turnTimer.stop();
		} catch (e) {
			console.log(e);
		}
	}
</script>

<svelte:window bind:innerWidth />

<div
	class="relative isolate flex w-full rounded-3xl flex-grow h-6"
	class:player--active={index === $appState.currentTurn &&
		$appSettings.enableCurrentPlayerGlow &&
		!$spinning &&
		!$appState.isMenuOpen &&
		timerFraction > 0.03}
	class:player--active-timer-over={index === $appState.currentTurn &&
		$appSettings.enableCurrentPlayerGlow &&
		!$spinning &&
		!$appState.isMenuOpen &&
		timerFraction <= 0.03}
	class:bg-rotated={!!$players[index].backgroundImage}
	class:bg-split={hasSplitBackground}
	class:overflow-hidden={!!$players[index].backgroundImage}
	style={styleVars}
	style:background={!$players[index].backgroundImage ? bg : undefined}
	class:h-full={!$appState.isMenuOpen}
	class:rotate-180={orientation === 'down'}
	class:opacity-75={$players[index].highlighted}
>
	<!-- Overlay au-dessus du background (non-interactif) -->
	<div
		class="bg-rotated-overlay"
		class:highlight={$players[index].highlighted}
		class:dead={isDead}
	></div>
	<div
		class="relative z-20 flex w-full rounded-2xl flex-grow h-6"
		class:h-full={!$appState.isMenuOpen}
		class:opacity-75={$players[index].highlighted}
	>
		{#if !$appState.isMenuOpen}
			<div class="flex w-full relative">
				{#if $appSettings.turnTimerEnabled && index === $appState.currentTurn}
					<div
						class="absolute top-2 left-2 z-30 pointer-events-auto cursor-pointer"
						on:click={() => {
							try {
								// If the timer is finished (no remaining seconds), reset/start it for the current player
								if ($turnTimer?.remaining <= 0) {
									turnTimer.resetForCurrent();
								}
							} catch (e) {
								console.log(e);
							}
						}}
					>
						<div
							class="w-10 h-10 flex items-center justify-center bg-black/40 rounded-full text-white text-sm"
						>
							<svg viewBox="0 0 40 40" class="w-10 h-10">
								<circle cx="20" cy="20" r="18" stroke="#444" stroke-width="3" fill="none" />
								<circle
									cx="20"
									cy="20"
									r="18"
									stroke="#ffd54a"
									stroke-width="3"
									fill="none"
									transform="rotate(-90 20 20)"
									stroke-dasharray={timerCircumference}
									stroke-dashoffset={dashOffset}
									stroke-linecap="round"
								/>
							</svg>
							<div class="absolute text-xs">
								{timerPrefix}{String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(
									2,
									'0'
								)}
							</div>
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
					class="minus w-1/2 flex justify-start items-center active:bg-player-light rounded-l-2xl select-none"
					on:mouseleave={handleCancelHold}
					on:touchcancel={handleCancelHold}
				>
					<Minus />
				</button>
				<button
					on:mousedown={() => handleMouseDown('add')}
					on:mouseup={() => handleMouseUp('add')}
					on:touchstart={() => handleTouchStart('add')}
					on:touchend={() => handleTouchEnd('add')}
					on:contextmenu|preventDefault
					draggable="false"
					class="plus w-1/2 flex justify-end items-center active:bg-player-light rounded-r-3xl select-none"
					on:mouseleave={handleCancelHold}
					on:touchcancel={handleCancelHold}
				>
					<Plus />
				</button>
				<div
					class="absolute w-full h-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-none flex flex-col justify-between"
				>
					<div class="grow h-1/3 text-center">
						<button
							on:click={() => openPlayerModal(id)}
							on:contextmenu|preventDefault
							draggable="false"
							class="py-1 px-2 rounded-lg mt-1 text-xl pointer-events-auto shadow-lg"
							style="background-color: {isDead ? 'black' : 'rgb(36, 36, 36, 0.9)'}"
							><div class="flex">
								<!--
								{#if !doNotShowMinimap}
									<div class="flex justify-center items-center mr-1">
										<CommanderDamage playerIndex={index} color="white" />
									</div>
								{/if}
								-->
								{#if $players[index].isFirst}
									<div class="flex justify-center items-center mr-1">
										<FirstPlace />
									</div>
								{/if}
								<span
									class="beleren mt-1"
									style="font-size: x-large; color: white;"
									style:text-decoration={isDead ? 'line-through' : ''}
									class:overline={!$appSettings.enableCurrentPlayerGlow &&
										$appSettings.showNextPlayerButton &&
										index === $appState.currentTurn}>{$players[index].playerName}</span
								>
								{#each booleanStatuses as s}
									{#if s === 'monarch'}
										<Crown />
									{:else if s === 'initiative'}
										<Initiative />
									{:else if s === 'ascend'}
										<Ascend />
									{:else if s === 'storied'}
										<Storied />
									{:else if s === 'ko'}
										<StatusSkull />
									{/if}
								{/each}
							</div>
						</button>
					</div>
					<div class="h-1/3 w-full relative flex items-center justify-center">
						<div
							class="absolute left-0 top-1/2 translate-x-[33%] -translate-y-1/2 w-24 text-center text-3xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
						>
							{$players[index].tempLifeDiff < 0 ? `${$players[index].tempLifeDiff}` : ''}
						</div>
						{#if $appSettings.showLifeChangeHistory}
							<div
								class="absolute left-0 top-1/2 -translate-y-1/2 w-24 flex justify-start items-center pointer-events-none pl-2"
								class:translate-x-28={numberOfPlayers >= 3}
								class:translate-x-20={numberOfPlayers === 2}
							>
								<LifeChangeHistory
									score={$players[index].lifeTotal}
									maxLines={numberOfPlayers >= 3 ? 6 : 12}
									resetToken={$lifeChangeHistoryResetKey}
								/>
							</div>
						{/if}
						<div class="relative flex items-center justify-center">
							{#if isDead}
								<div
									class="z-10 text-black"
									style="width: {$appSettings.playerCount >= 5
										? '2.75rem'
										: '3.5rem'}; height: {$appSettings.playerCount >= 5
										? '2.75rem'
										: '3.5rem'}; opacity: 1;"
								>
									<Skull />
								</div>
							{/if}
							{#if !editing}
								<button
									on:dblclick={startEdit}
									on:contextmenu|preventDefault={openPromptSetLife}
									class="pointer-events-auto bg-transparent border-none p-0 m-0"
								>
									<span
										class="flex items-center text-center text-shadow-xl/120 text-white font-bold"
										class:opacity-25={isDead}
										class:text-9xl={$appSettings.playerCount === 2}
										class:text-8xl={$appSettings.playerCount >= 3 && $appSettings.playerCount <= 4}
										class:text-6xl={$appSettings.playerCount === 5}
										class:text-5xl={$appSettings.playerCount >= 6}
										class:-translate-y-5={$appSettings.playerCount === 6 ||
											$appSettings.playerCount === 5}
										class:-translate-y-4={$appSettings.playerCount === 4}
										style="text-shadow: 0 0 40px black;">{$players[index].lifeTotal}</span
									>
								</button>
							{:else}
								<div class="pointer-events-auto flex flex-col items-center">
									<input
										id={`life-input-${id}`}
										type="number"
										bind:value={editValue}
										on:keydown={(e) => {
											if (e.key === 'Enter') saveEdit();
											if (e.key === 'Escape') cancelEdit();
										}}
										class="max-w-16 max-h-14 text-center rounded-md px-2 py-1 text-3xl text-black"
										placeholder={$_('enter_life_total_placeholder')}
									/>
									<div class="flex gap-2 mt-1">
										<button on:click={saveEdit} class="px-2 py-1 bg-green-600 text-white rounded"
											>{$_('set_life_total_save')}</button
										>
										<button on:click={cancelEdit} class="px-2 py-1 bg-gray-600 text-white rounded"
											>{$_('set_life_total_cancel')}</button
										>
									</div>
								</div>
							{/if}
						</div>
						<div
							class="absolute right-0 top-1/2 -translate-x-[33%] -translate-y-1/2 w-24 text-center text-4xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
						>
							{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}
						</div>
					</div>
					<div class="grow h-1/3"></div>
				</div>
			</div>
		{/if}
	</div>
	<!-- Minimap & Status effects bar -->
	<div
		class="absolute z-20 left-0 right-0 bottom-1 flex justify-center pointer-events-none"
		class:hidden={$appState.isMenuOpen}
	>
		<div
			class="text-white text-xs rounded-full px-1 py-0 flex gap-0.5 items-center pointer-events-auto"
			class:flex-wrap={shouldWrapStatusEffects}
			class:gap-y-0={shouldWrapStatusEffects}
			class:justify-center={shouldWrapStatusEffects}
			class:max-w-[17rem]={shouldWrapStatusEffects}
		>
			{#if numberOfPlayers >= 3 && doNotShowMinimap === false}
				<div class="mr-2">
					<Minimap playerIndex={index} {orientation} {layout} fromPlayerDataModal={false} />
				</div>
			{/if}
			{#if commandTaxCount > 0}
				<div
					title={$_('tooltip_status_command_tax')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<CommandTax />
					<span class="leading-none">{commandTaxDisplay}</span>
				</div>
			{/if}
			{#if poisonCount > 0}
				<div
					title={$_('tooltip_status_poison')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<PoisonIcon />
					<span class="leading-none">{poisonCount}</span>
				</div>
			{/if}
			{#if energyCount > 0}
				<div
					title={$_('tooltip_status_energy')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<Energy />
					<span class="leading-none">{energyCount}</span>
				</div>
			{/if}
			{#if experienceCount > 0}
				<div
					title={$_('tooltip_status_experience')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<Experience />
					<span class="leading-none">{experienceCount}</span>
				</div>
			{/if}
			{#if radCount > 0}
				<div
					title={$_('tooltip_status_rad')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<Rad />
					<span class="leading-none">{radCount}</span>
				</div>
			{/if}
			{#if visibleAcornCount > 0}
				<div
					title={$_('tooltip_status_acorn')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<Acorn />
					<span class="leading-none">{visibleAcornCount}</span>
				</div>
			{/if}
			{#if visibleTicketCount > 0}
				<div
					title={$_('tooltip_status_tickets')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<Ticket />
					<span class="leading-none">{visibleTicketCount}</span>
				</div>
			{/if}
			{#if ringBearerCount > 0}
				<div
					title={$_('tooltip_status_ring_bearer')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<TheRingerBearer isMax={ringBearerCount === 4} />
					<span class="leading-none">{ringBearerCount}</span>
				</div>
			{/if}
			{#if startYourEngineSpeedCount > 0}
				<div
					title={$_('tooltip_status_start_your_engine_speed')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex flex-col items-center justify-center gap-0 text-base"
					on:click={() => openPlayerModal(id, 'status_effects')}
					role="button"
					tabindex="0"
				>
					<StartYourEngineSpeed isMax={startYourEngineSpeedCount === 4} />
					<span class="leading-none">{startYourEngineSpeedCount}</span>
				</div>
			{/if}
			{#if doNotShowMinimap}
				<!-- If the minimap is disabled, show a placeholder icon to indicate CommanderDamage (like before) -->
				{#each commanderDamageArray as dmg, i}
					{#if dmg > 0}
						<div
							title={$_('tooltip_commander_damage')}
							class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
							on:click={() => openPlayerModal(id, 'commander')}
							role="button"
							tabindex="0"
						>
							<!-- <CommanderDamage playerIndex={i} color="white" /> -->
							<span>{dmg}</span>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>
