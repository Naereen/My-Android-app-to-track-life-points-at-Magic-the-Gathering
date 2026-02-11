<script lang="ts">
	import FirstPlace from '$lib/assets/icons/FirstPlace.svelte';
	import Minus from '$lib/assets/icons/Minus.svelte';
	import Plus from '$lib/assets/icons/Plus.svelte';
	import Skull from '$lib/assets/icons/Skull.svelte';
	import StatusSkull from '$lib/assets/icons/StatusSkull.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import DayNight from '$lib/assets/icons/DayNight.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import { _ } from 'svelte-i18n';
	import { appSettings } from '$lib/store/appSettings';
	import { appState } from '$lib/store/appState';
    import { turnTimer } from '$lib/store/turnTimer';
	import { openPlayerModal } from '$lib/store/modal';
	import {
		manageLifeTotal,
		players,
		setPlayerLifeAbsolute,
		setPlayerHighlighted,
		spinning
	} from '$lib/store/player';
	import { tick } from 'svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import Minimap from './Minimap.svelte';
	const doNotShowMinimap: boolean = false; // FIXME: for testing purposes, to hide the minimap in the player component
	import { vibrate } from '$lib/utils/haptics';
	import { isMobileDevice } from '$lib/utils/detectMobile';

	export let orientation: App.Player.Orientation = 'up';
	export let id: number;
	export let layout: 'two-by-two' | 'one-two-one' | '' = '';

	let interval: number;
	let timeout: number;
	let isHolding = false;
	let holdingType: App.Player.LifeMoveType | null = null;

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

	$: bgRotation = '0deg';
	$: bgPositionX = (orientation === 'up') ? 'center' : ((orientation === 'down') ? 'center' : 'center');
	$: bgPositionY = (orientation === 'up') ? 'top' : ((orientation === 'down') ? 'top' : 'center');

	$: bgWidth = (layout === 'two-by-two') ? '100%' : '100%';
	// $: bgWidth = '50%';
	$: bgHeight = (numberOfPlayers <= 4) ? (orientation === 'up' ? '100%' : '100%') : '100%';

	$: bgTop = (numberOfPlayers <= 4) ? (orientation === 'up' ? '50%' : '50%') : (orientation === 'up' ? '50%' : '50%');
	$: bgLeft = (numberOfPlayers <= 4) ? (orientation === 'up' ? '50%' : '50%') : (orientation === 'up' ? '50%' : '50%');

	// $: bgSize = 'contain';
	$: bgSize = 'cover';

	// Combine all these background-related variables into a single style string for easier application to the player container
	$: styleVars = (() => {
		const bgValue = $players[index].backgroundImage;
		// default no-image behavior
		if (!bgValue) {
			return `--bg-image: none; --bg-rotation: ${bgRotation}; --bg-positionx: ${bgPositionX}; --bg-positiony: ${bgPositionY}; --bg-width: ${bgWidth}; --bg-height: ${bgHeight}; --bg-top: ${bgTop}; --bg-left: ${bgLeft}; --bg-size: ${bgSize};`;
		}
		if (Array.isArray(bgValue) && bgValue.length > 1) {
			const two = bgValue.slice(0, 2);
			const images = two.map((u: string) => `url('${u}')`).join(', ');
			const image_left = `url('${two[0]}')`;
			const image_right = `url('${two[1]}')`;
			// // position first image left, second image right; both centered vertically
			// const posx = '0%, 100%';
			// const posy = 'center, center';
			// // use contain or percentage sizes so both images display side-by-side
			// const size = '50% 100%, 50% 100%';
			// const size = 'contain';
			return `--bg-image: ${images}; --bg-image-left: ${image_left}; --bg-image-right: ${image_right}; --bg-rotation: ${bgRotation}; --bg-top: 50%; --bg-left: 100%; --bg-right: 25%; --pos-left: 50%; --pos-right: 50%; --bg-width: 100%; --bg-height: 100%; --bg-size: auto 105%;`;
		}

		// single string image
		return `--bg-image: url('${bgValue}'); --bg-rotation: ${bgRotation}; --bg-positionx: ${bgPositionX}; --bg-positiony: ${bgPositionY}; --bg-width: ${bgWidth}; --bg-height: ${bgHeight}; --bg-top: ${bgTop}; --bg-left: ${bgLeft}; --bg-size: ${bgSize};`;
	})();

	$: status = $players[index].statusEffects ?? {};
	$: booleanStatuses = ['monarch', 'initiative', 'ascend', 'dayNight', 'ko'].filter(
		(k) => status[k]
	);
	$: poisonCount = $players[index].poison ?? 0;
	$: energyCount = status.energy ?? 0;
	$: experienceCount = status.experience ?? 0;
	$: radCount = status.rad ?? 0;
	$: commandTaxCount = status.commandTax ?? 0;
	$: ringBearerCount = status.ringBearer ?? 0;
	$: startYourEngineSpeedCount = status.startYourEngineSpeed ?? 0;
	$: commanderDamageArray = status.commanderDamage ?? [];
	$: maxCommanderDamage = Math.max(0, ...commanderDamageArray);

	const handleMouseDown = (type: App.Player.LifeMoveType) => {
		if (!isMobile) {
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
		}
	};

	const handleMouseUp = (type: App.Player.LifeMoveType) => {
		if (!isMobile) {
			if (interval) {
				clearInterval(interval);
				interval = 0;
			} else {
				manageLifeTotal(type, id);
			}
			clearTimeout(timeout);
			timeout = 0;
			isHolding = false;
			holdingType = null;
			setPlayerHighlighted(id, false);
		}
	};

	const handleTouchStart = (type: App.Player.LifeMoveType) => {
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

	const handleTouchEnd = (type: App.Player.LifeMoveType) => {
		if (interval) {
			clearInterval(interval);
			interval = 0;
		} else {
			manageLifeTotal(type, id);
		}
		clearTimeout(timeout);
		timeout = 0;
		isHolding = false;
		holdingType = null;
		setPlayerHighlighted(id, false);
	};

	const handleCancelHold = () => {
		if (interval) {
			clearInterval(interval);
			interval = 0;
		}
		clearTimeout(timeout);
		timeout = 0;
		isHolding = false;
		holdingType = null;
		setPlayerHighlighted(id, false);
	};

	let editing = false;
	let editValue = '';

	const openPromptSetLife = () => {
		const current = $players[index].lifeTotal;
		const input = prompt($_('set_life_total') ?? 'Set life total', String(current));
		if (input === null) return;
		const val = Number(input);
		if (!Number.isNaN(val)) {
			setPlayerLifeAbsolute(id, val);
		}
	};

	const startEdit = async () => {
		editing = true;
		editValue = String($players[index].lifeTotal);
		await tick();
		const el = document.getElementById(`life-input-${id}`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	const saveEdit = () => {
		const val = Number(editValue);
		if (!Number.isNaN(val)) {
			setPlayerLifeAbsolute(id, val);
		}
		editing = false;
	};

	const cancelEdit = () => {
		editing = false;
	};

$: timerFraction = $turnTimer.total ? ($turnTimer.remaining / $turnTimer.total) : 0;
$: timerMinutes = Math.floor(($turnTimer.remaining || 0) / 60);
$: timerSeconds = ($turnTimer.remaining || 0) % 60;

// circumference for the timer circle (radius = 18 from the SVG)
$: timerCircumference = 2 * Math.PI * 18;
// dash offset based on fraction (0..1)
$: dashOffset = timerCircumference * (1 - Math.max(0, Math.min(1, timerFraction)));

$: if ($appSettings.turnTimerEnabled && index === $appState.currentTurn) {
	try { turnTimer.startForPlayer(index); }
	catch (e) { console.log(e); }
}

// stop timer for this player when the store indicates it's running for them but they're no longer the current turn
$: if ($appSettings.turnTimerEnabled && $turnTimer?.playerIndex === index && index !== $appState.currentTurn) {
	try { turnTimer.stop(); }
	catch (e) { console.log(e); }
}
</script>

<svelte:window bind:innerWidth />

<div
	class="flex w-full rounded-3xl flex-grow h-6"
	class:player--active={index === $appState.currentTurn && $appSettings.enableCurrentPlayerGlow && !$spinning && !$appState.isMenuOpen && timerFraction > 0.03}
	class:player--active-timer-over={index === $appState.currentTurn && $appSettings.enableCurrentPlayerGlow && !$spinning && !$appState.isMenuOpen && timerFraction <= 0.03}
	class:bg-rotated={!!$players[index].backgroundImage}
	class:overflow-hidden={!!$players[index].backgroundImage}
	style={styleVars}
	style:background={!$players[index].backgroundImage ? bg : undefined}
	class:h-full={!$appState.isMenuOpen}
	class:rotate-180={orientation === 'down'}
	class:opacity-35={$players[index].highlighted}
	class:bg-player-dark={isDead}
>
	<!-- Overlay au-dessus du background (non-interactif) -->
	<div
		class="bg-rotated-overlay"
		class:highlight={$players[index].highlighted}
		class:dead={isDead}
	></div>
	<div
		class="flex w-full rounded-2xl flex-grow h-6"
		class:h-full={!$appState.isMenuOpen}
		class:opacity-35={$players[index].highlighted}
		class:bg-player-dark={isDead}
		style="background: ${bg};"
	>
		{#if !$appState.isMenuOpen}
			<div class="flex w-full relative">
				{#if $appSettings.turnTimerEnabled && index === $appState.currentTurn}
					<div class="absolute top-2 left-2 z-30 pointer-events-auto cursor-pointer"
						on:click={() => {
							try {
								// If the timer is finished (no remaining seconds), reset/start it for the current player
								if ($turnTimer?.remaining <= 0) {
									turnTimer.resetForCurrent();
								}
							} catch (e) { console.log(e); }
						}}
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
							<div class="absolute text-xs">{timerMinutes}:{String(timerSeconds).padStart(2, '0')}</div>
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
					class:holding={holdingType === 'subtract'}
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
					class:holding={holdingType === 'add'}
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
								{#if doNotShowMinimap}
									<div class="flex justify-center items-center mr-1">
										<CommanderDamage playerIndex={index} color="white" />
									</div>
								{/if}
								<span
									class="beleren"
									style="font-size: x-large; color: white;"
									style:text-decoration={isDead ? 'line-through' : ''}
									class:overline={!$appSettings.enableCurrentPlayerGlow && $appSettings.showNextPlayerButton && index === $appState.currentTurn}>{$players[index].playerName}</span
								>
								{#if $players[index].isFirst}
									<div class="flex justify-center items-center ml-2">
										<FirstPlace />
									</div>
								{/if}
								{#each booleanStatuses as s}
									{#if s === 'monarch'}
										<Crown />
									{:else if s === 'initiative'}
										<Initiative />
									{:else if s === 'ascend'}
										<Ascend />
									{:else if s === 'dayNight'}
										<DayNight />
									{:else if s === 'ko'}
										<StatusSkull />
									{/if}
								{/each}
							</div>
						</button>
					</div>
					<div class="h-1/3 flex justify-center items-center flex-row">
						<span
							class="w-16 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
							>{$players[index].tempLifeDiff < 0 ? `-${$players[index].tempLifeDiff * -1}` : ''}</span
						>
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
										class:text-7xl={$appSettings.playerCount <= 4}
										class:text-5xl={$appSettings.playerCount >= 5}
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
						<span
							class="w-16 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
							>{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}</span
						>
					</div>
					<div class="grow h-1/3"></div>
				</div>
			</div>
		{/if}
	</div>
	<!-- Status effects bar -->
	<div class="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none" class:hidden={$appState.isMenuOpen}>
		<div
			class="bg-black/40 text-white text-xs rounded-full px-1 py-0 flex gap-0.5 items-center pointer-events-auto"
		>
			{#if numberOfPlayers >= 3}
				<div class="mr-2">
					<Minimap playerIndex={index} orientation={orientation} layout={layout} />
				</div>
			{/if}
			{#if poisonCount > 0}
				<div
					title={$_('tooltip_status_poison')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0 text-base"
				>
					<PoisonIcon /> <span>{poisonCount}</span>
				</div>
			{/if}
			{#if energyCount > 0}
				<div
					title={$_('tooltip_status_energy')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
				>
					<Energy /> <span>{energyCount}</span>
				</div>
			{/if}
			{#if experienceCount > 0}
				<div
					title={$_('tooltip_status_experience')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
				>
					<Experience /> <span>{experienceCount}</span>
				</div>
			{/if}
			{#if radCount > 0}
				<div
					title={$_('tooltip_status_rad')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
				>
					<Rad /> <span>{radCount}</span>
				</div>
			{/if}
			{#if commandTaxCount > 0}
				<div
					title={$_('tooltip_status_command_tax')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0 text-base"
				>
					<CommandTax /> <span>{commandTaxCount}</span>
				</div>
			{/if}
				{#if ringBearerCount > 0}
				<div
					title={$_('tooltip_status_ring_bearer')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
				>
						<TheRingerBearer isMax={ringBearerCount === 4} /> <span>{ringBearerCount}</span>
				</div>
			{/if}
			{#if startYourEngineSpeedCount > 0}
				<div
					title={$_('tooltip_status_start_your_engine_speed')}
					class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
				>
						<StartYourEngineSpeed isMax={startYourEngineSpeedCount === 4} /> <span>{startYourEngineSpeedCount}</span>
				</div>
			{/if}
			{#if doNotShowMinimap}
				<!-- If the minimap is disabled, show a placeholder icon to indicate CommanderDamage (like before) -->
				{#each commanderDamageArray as dmg, i}
					{#if dmg > 0}
						<div
							title={$_('tooltip_commander_damage')}
							class="px-1 py-0.5 rounded-full bg-gray-800/50 text-white flex items-center gap-0.5 text-base"
						>
							<CommanderDamage playerIndex={i} color="white" />
							<span>{dmg}</span>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>
