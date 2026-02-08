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
	import { openPlayerModal } from '$lib/store/modal';
	import {
		manageLifeTotal,
		players,
		setPlayerLifeAbsolute,
		setPlayerHighlighted
	} from '$lib/store/player';
	import { tick } from 'svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import { haptic, vibrate } from '$lib/utils/haptics';
	import { isMobileDevice } from '$lib/utils/detectMobile';

	export let orientation: App.Player.Orientation = 'up';
	export let id: number;

	let interval: number;
	let timeout: number;
	let isHolding = false;
	let holdingType: App.Player.LifeMoveType | null = null;
	$: innerWidth = 0;
	$: isMobile = isMobileDevice(innerWidth);
	$: index = id - 1;
	$: isDead =
		($players[index].lifeTotal <= 0 &&
			!($appSettings.allowNegativeLife || $players[index].allowNegativeLife)) ||
		($players[index].poison ?? 0) >= 10 ||
		status?.ko === true ||
		$players[index].isDead === true ||
		maxCommanderDamage >= 21;
	$: bg = colorToBg($players[index].color ?? 'white');
	$: bgRotation = orientation === 'left' ? '-90deg' : orientation === 'right' ? '90deg' : '0deg';
	// FIXME: these bgPositionX/Y don't work as intended, I havent't thought this through enough
	$: bgPositionX =
		orientation === 'left' ? 'center' : orientation === 'right' ? 'center' : 'center';
	$: bgPositionY = orientation === 'left' ? 'right' : orientation === 'right' ? 'left' : 'center';
	$: styleVars = $players[index].backgroundImage
		? `--bg-image: url('${$players[index].backgroundImage}'); --bg-rotation: ${bgRotation}; --bg-positionx: ${bgPositionX}; --bg-positiony: ${bgPositionY};`
		: `--bg-rotation: ${bgRotation}; --bg-image: none; --bg-positionx: none; --bg-positiony: none;`;
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
	$: statusRotation =
		orientation === 'down'
			? '180deg'
			: orientation === 'left'
				? '-90deg'
				: orientation === 'right'
					? '90deg'
					: '0deg';

	// Text rotation should be different for players on the right side (facing left)
	// Players 4, 5, 6 with orientation="left" should have text rotated to face right (90deg)
	$: statusTextRotation =
		orientation === 'left' && (id === 4 || id === 5 || id === 6) ? '-180deg' : (orientation === 'right' && (id === 1 || id === 2 || id === 3) ? '0deg' : statusRotation);

	// Determine players that are physically on the right side in each player-count layout
	$: isRightFacingPlayer =
		($appSettings.playerCount === 3 && id === 3) ||
		($appSettings.playerCount === 4 && (id === 3 || id === 4)) ||
		($appSettings.playerCount >= 5 && id >= 3);

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
		// Called on mouseleave / touchcancel — stop repeating and remove highlight without applying a final single change
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
</script>

<svelte:window bind:innerWidth />


<div
	class="rounded-2xl relative h-full w-full"
	class:player--active={index === $appState.currentTurn && $appSettings.enableCurrentPlayerGlow}
	class:bg-rotated={!!$players[index].backgroundImage}
	style={styleVars}
	style:background={!$players[index].backgroundImage ? bg : undefined}
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
			<div class="flex flex-col w-full relative">
				<div class="h-full flex flex-col" class:flex-col-reverse={orientation === 'left'}>
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
						class:holding={holdingType === 'subtract'}
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
						class:holding={holdingType === 'add'}
						on:mouseleave={handleCancelHold}
						on:touchcancel={handleCancelHold}
					>
						<Plus />
					</button>
				</div>
				<div
					class="absolute h-full w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-none flex items-center"
					class:flex-row={orientation === 'left'}
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
								<div class="flex justify-center items-center mb-3 rotate-90">
									<div class="flex justify-center items-center mr-1" style="transform: rotate(-45deg);">
										<CommanderDamage playerIndex={index} />
									</div>
								</div>
								<span
									class="beleren"
									style="font-size: x-large; color: white;"
									style:text-decoration={isDead ? 'line-through' : ''}
									class:overline={index === $appState.currentTurn}
									>{$players[index].playerName}</span
								>
								{#if $players[index].isFirst}
									<div class="flex justify-center items-center mt-2 rotate-90">
										<FirstPlace />
									</div>
								{/if}
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
									{:else if s === 'dayNight'}
										<div class="flex justify-center items-center rotate-90 mt-1 mb-1">
											<DayNight />
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
					<div
						class="w-1/3 flex justify-center items-center vert"
					>
						<span
							class="h-16 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
							class:rotate-180={orientation === 'left'}
							class:h-8={$appSettings.playerCount >= 5}
							>{$players[index].tempLifeDiff < 0
								? `-${$players[index].tempLifeDiff * -1}`
								: ''}</span
						>
						<div class="relative flex items-center justify-center">
							{#if isDead}
								<div
									class="z-10 text-black"
									class:rotate-90={orientation === 'right'}
									class:-rotate-90={orientation === 'left'}
									class:-translate-x-0={orientation === 'right'}
									class:translate-x-0={orientation === 'left'}
									style="width: {$appSettings.playerCount >= 5
										? '2.5rem'
										: '3.25rem'}; height: {$appSettings.playerCount >= 5
										? '2.5rem'
										: '3.25rem'}; opacity: 1;"
								>
									<Skull />
									<br />
								</div>
							{/if}
							{#if !editing}
								<button
									on:dblclick={startEdit}
									on:contextmenu|preventDefault={openPromptSetLife}
									class="bg-transparent border-none p-0 m-0 pointer-events-auto"
								>
									<span
										class="text-shadow-black text-shadow-xl/100 text-white font-bold flex items-center text-center"
										class:text-7xl={$appSettings.playerCount <= 4}
										class:text-5xl={$appSettings.playerCount >= 5}
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
										class="w-20 h-20 center text-center rounded-md px-2 py-1 text-3xl"
										placeholder={$_('enter_life_total_placeholder')}
									/>
									<div class="flex gap-2 mt-1 justify-center">
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
							class="h-16 text-center text-2xl text-shadow-xl/100 text-shadow-black text-white"
							style="text-shadow: 0 0 20px black;"
							class:rotate-180={orientation === 'left'}
							class:h-8={$appSettings.playerCount >= 5}
							>{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}</span
						>
					</div>

					<div class="grow w-1/3 vert"></div>
				</div>
				<!-- Status effects bar -->
				<div
					class="absolute top-0 bottom-0 flex justify-center pointer-events-none"
					class:vert-left={orientation === 'left'}
					class:vert-right={orientation === 'right'}
					class:left-2={orientation === 'right'}
					class:right-2={orientation === 'left'}
					class:hidden={$appState.isMenuOpen}
				>
					<div
						class="bg-black/40 text-white text-xs rounded-full px-0 py-0 flex gap-1 items-center pointer-events-auto"
						class:flex-row={orientation === 'left'}
						class:flex-row-reverse={orientation === 'left'}
					>
						{#if poisonCount > 0}
							<div
								title={$_('tooltip_status_poison')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{poisonCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<PoisonIcon />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<PoisonIcon />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{poisonCount}</span>
								{/if}
							</div>
						{/if}
						{#if energyCount > 0}
							<div
								title={$_('tooltip_status_energy')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{energyCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Energy />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Energy />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{energyCount}</span>
								{/if}
							</div>
						{/if}
						{#if experienceCount > 0}
							<div
								title={$_('tooltip_status_experience')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{experienceCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Experience />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Experience />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{experienceCount}</span>
								{/if}
							</div>
						{/if}
						{#if radCount > 0}
							<div
								title={$_('tooltip_status_rad')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{radCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Rad />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<Rad />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{radCount}</span>
								{/if}
							</div>
						{/if}
						{#if commandTaxCount > 0}
							<div
								title={$_('tooltip_status_command_tax')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{commandTaxCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<CommandTax />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<CommandTax />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{commandTaxCount}</span>
								{/if}
							</div>
						{/if}
						{#if ringBearerCount > 0}
							<div
								title={$_('tooltip_status_ring_bearer')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{ringBearerCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<TheRingerBearer isMax={ringBearerCount === 4} />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<TheRingerBearer isMax={ringBearerCount === 4} />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{ringBearerCount}</span>
								{/if}
							</div>
						{/if}
						{#if startYourEngineSpeedCount > 0}
							<div
								title={$_('tooltip_status_start_your_engine_speed')}
								class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
							>
								{#if isRightFacingPlayer}
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{startYourEngineSpeedCount}</span>
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<StartYourEngineSpeed isMax={startYourEngineSpeedCount === 4} />
									</div>
								{:else}
									<div
										class="status-rotate-wrapper"
										style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
									>
										<StartYourEngineSpeed isMax={startYourEngineSpeedCount === 4} />
									</div>
									<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{startYourEngineSpeedCount}</span>
								{/if}
							</div>
						{/if}
						{#each commanderDamageArray as dmg, i}
							{#if dmg > 0}
								<div
									title={$_('tooltip_commander_damage')}
									class="px-0.5 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-0.5"
								>
									{#if isRightFacingPlayer}
										<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{dmg}</span>
										<div
											class="status-rotate-wrapper"
											style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
										>
											<div style="transform: rotate(-45deg);">
												<CommanderDamage playerIndex={i} />
											</div>
										</div>
									{:else}
										<div
											class="status-rotate-wrapper"
											style="transform: rotate({statusRotation}); transform-origin: center; display: inline-flex;"
										>
											<div style="transform: rotate(-45deg);">
												<CommanderDamage playerIndex={i} />
											</div>
										</div>
										<span style="transform: rotate({statusTextRotation}); display: inline-flex;">{dmg}</span>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
