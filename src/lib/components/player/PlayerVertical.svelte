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
	import { _ } from 'svelte-i18n';
	import { appSettings } from '$lib/store/appSettings';
	import { appState } from '$lib/store/appState';
	import { openPlayerModal } from '$lib/store/modal';
	import { manageLifeTotal, players, setPlayerLifeAbsolute, setPlayerHighlighted } from '$lib/store/player';
	import { tick } from 'svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import { haptic, vibrate } from '$lib/utils/haptics';

	export let orientation: App.Player.Orientation = 'up';
	export let id: number;

	let interval: number;
	let timeout: number;
	let isHolding = false;
	let holdingType: App.Player.LifeMoveType | null = null;

	$: innerWidth = 0;
	$: isMobile = false; // Assume mobile by default // FIXME: improve detection if needed
	$: index = id - 1;
	$: isDead = (($players[index].lifeTotal <= 0) && !($appSettings.allowNegativeLife || $players[index].allowNegativeLife)) || (($players[index].poison ?? 0) >= 10);
	$: bg = colorToBg($players[index].color ?? 'white');
	$: bgRotation = '0deg';
	// FIXME: these bgPositionX/Y don't work as intended, I havent't thought this through enough
	$: bgPositionX = orientation === 'up' ? 'center' : orientation === 'right' ? 'center' : 'center';
	$: bgPositionY = orientation === 'up' ? 'top' : orientation === 'down' ? 'bottom' : 'center';
	$: styleVars = $players[index].backgroundImage
		? `--bg-image: url('${$players[index].backgroundImage}'); --bg-rotation: ${bgRotation}; --bg-positionx: ${bgPositionX}; --bg-positiony: ${bgPositionY};`
		: `--bg-rotation: ${bgRotation}; --bg-image: none; --bg-positionx: none; --bg-positiony: none;`;
	$: status = $players[index].statusEffects ?? {};
	$: booleanStatuses = ['monarch', 'initiative', 'ascend', 'dayNight', 'ko'].filter((k) => status[k]);
	$: poisonCount = $players[index].poison ?? 0;
	$: energyCount = status.energy ?? 0;
	$: experienceCount = status.experience ?? 0;
	$: radCount = status.rad ?? 0;
	$: commandTaxCount = status.commandTax ?? 0;

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
</script>

<svelte:window bind:innerWidth />

<div
	class="flex w-full rounded-2xl flex-grow h-6"
	class:bg-rotated={!!$players[index].backgroundImage}
	style={styleVars}
	style:background={!$players[index].backgroundImage ? bg : undefined}
	class:h-full={!$appState.isMenuOpen}
	class:rotate-180={orientation === 'down'}
	class:opacity-35={$players[index].highlighted}
	class:bg-player-dark={isDead}
>
	<!-- Overlay au-dessus du background (non-interactif) -->
	<div class="bg-rotated-overlay" class:highlight={$players[index].highlighted} class:dead={isDead}></div>
	{#if !$appState.isMenuOpen}
		<div class="flex w-full relative">
			<button
				on:mousedown={() => handleMouseDown('subtract')}
				on:mouseup={() => handleMouseUp('subtract')}
				on:touchstart={() => handleTouchStart('subtract')}
				on:touchend={() => handleTouchEnd('subtract')}
				on:contextmenu|preventDefault draggable="false"
				use:haptic={10}
				class="w-1/2 flex justify-start items-center active:bg-player-light rounded-l-2xl select-none"
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
				on:contextmenu|preventDefault draggable="false"
				use:haptic={10}
				class="w-1/2 flex justify-end items-center active:bg-player-light rounded-r-3xl select-none"
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
						on:contextmenu|preventDefault draggable="false"
						class="py-2 px-3 rounded-lg mt-1 text-xl pointer-events-auto shadow-lg"
						style="background-color: {isDead ? 'black' : 'rgb(36, 36, 36, 0.9)'}"
						><div class="flex">
							<span style="font-size: xx-large; color: white;" style:text-decoration={isDead ? 'line-through' : 'none'}>{$players[index].playerName}</span>
							{#if $players[index].isFirst}
								<div class="flex justify-center items-center ml-2">
									<FirstPlace />
								</div>
							{/if}
						</div>
					</button>
				</div>
				<div class="h-1/3 flex justify-center items-center flex-row">
					<span class="w-16 text-center"
						>{$players[index].tempLifeDiff < 0 ? `-${$players[index].tempLifeDiff * -1}` : ''}</span
					>
					<div class="relative flex items-center justify-center">
						{#if isDead}
							<div class="absolute z-10 text-black" style="width: {$appSettings.playerCount >= 5 ? '2.75rem' : '3.5rem'}; height: {$appSettings.playerCount >= 5 ? '2.75rem' : '3.5rem'}; opacity: 1;">
								<Skull />
							</div>
						{/if}
						{#if !editing}
							<button on:dblclick={startEdit} on:contextmenu|preventDefault={openPromptSetLife} class="pointer-events-auto bg-transparent border-none p-0 m-0">
								<span class="text-shadow-xl/120 text-white text-8xl font-bold" class:opacity-25={isDead} style="text-shadow: 0 0 40px black;">
									{$players[index].lifeTotal}</span>
							</button>
						{:else}
							<div class="pointer-events-auto flex flex-col items-center">
								<input id={`life-input-${id}`} type="number" bind:value={editValue} on:keydown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} class="w-20 h-20text-center rounded-md px-2 py-1 text-3xl" placeholder={$_('enter_life_total_placeholder')} />
								<div class="flex gap-2 mt-1">
									<button on:click={saveEdit} class="px-2 py-1 bg-green-600 text-white rounded">{$_('set_life_total_save')}</button>
									<button on:click={cancelEdit} class="px-2 py-1 bg-gray-600 text-white rounded">{$_('set_life_total_cancel')}</button>
								</div>
							</div>
						{/if}
					</div>
					<span class="w-16 text-center"
						>{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}</span
					>
				</div>
				<div class="grow h-1/3"></div>
			</div>
		</div>
	{/if}
		<!-- Status effects bar -->
		<div class="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none">
			<div class="bg-black/40 text-white text-xs rounded-full px-2 py-1 flex gap-2 items-center pointer-events-auto">
				{#if poisonCount > 0}
					<div title={$_('tooltip_status_poison')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1 transition-transform transform hover:scale-105"><PoisonIcon /> <span> {poisonCount}</span></div>
				{/if}
				{#if energyCount > 0}
					<div title={$_('tooltip_status_energy')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1 transition-transform transform hover:scale-105"><Energy /> <span>{energyCount}</span></div>
				{/if}
				{#if experienceCount > 0}
					<div title={$_('tooltip_status_experience')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1 transition-transform transform hover:scale-105"><Experience /> <span>{experienceCount}</span></div>
				{/if}
				{#if radCount > 0}
					<div title={$_('tooltip_status_rad')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1 transition-transform transform hover:scale-105"><Rad /> <span>{radCount}</span></div>
				{/if}
				{#if commandTaxCount > 0}
					<div title={$_('tooltip_status_command_tax')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1 transition-transform transform hover:scale-105"><CommandTax /> <span>{commandTaxCount}</span></div>
				{/if}
				{#each booleanStatuses as s}
					{#if s === 'monarch'}
						<div title={$_('tooltip_status_monarch')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center transition-transform transform hover:scale-105"><Crown /></div>
					{:else if s === 'initiative'}
						<div title={$_('tooltip_status_initiative')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center transition-transform transform hover:scale-105"><Initiative /></div>
					{:else if s === 'ascend'}
						<div title={$_('tooltip_status_ascend')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center transition-transform transform hover:scale-105"><Ascend /></div>
					{:else if s === 'dayNight'}
						<div title={$_('tooltip_status_day_night')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center transition-transform transform hover:scale-105"><DayNight /></div>
					{:else if s === 'ko'}
						<!-- TODO: the corresponding player should actually be counted as KO -->
						<div title={$_('tooltip_status_ko')} class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center transition-transform transform hover:scale-105"><StatusSkull /></div>
					{/if}
				{/each}
			</div>
		</div>
</div>
