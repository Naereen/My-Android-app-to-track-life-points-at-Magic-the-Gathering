<script lang="ts">
	import FirstPlace from '$lib/assets/icons/FirstPlace.svelte';
	import Minus from '$lib/assets/icons/Minus.svelte';
	import Plus from '$lib/assets/icons/Plus.svelte';
	import Skull from '$lib/assets/icons/Skull.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import DayNight from '$lib/assets/icons/DayNight.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import { appSettings } from '$lib/store/appSettings';
	import { appState } from '$lib/store/appState';
	import { openPlayerModal } from '$lib/store/modal';
	import { manageLifeTotal, players } from '$lib/store/player';
	import { colorToBg } from '$lib/components/colorToBg';

	export let orientation: App.Player.Orientation = 'up';
	export let id: number;

	let interval: number;
	let timeout: number;
	let isHolding = false;
	$: innerWidth = 0;
	$: isMobile = innerWidth < 640;
	$: index = id - 1;
	$: isDead = (($players[index].lifeTotal <= 0) && !($appSettings.allowNegativeLife || $players[index].allowNegativeLife)) || (($players[index].poison ?? 0) >= 10);
	$: bg = colorToBg($players[index].color ?? 'white');
	$: bgStyle = $players[index].backgroundImage
		? `background-image: url('${$players[index].backgroundImage}'); background-size: cover; background-position: top center;`
		: `background: ${bg};`;
	$: bgRotation = orientation === 'left' ? '-90deg' : orientation === 'right' ? '90deg' : '0deg';
	$: styleVars = $players[index].backgroundImage
		? `--bg-image: url('${$players[index].backgroundImage}'); --bg-rotation: ${bgRotation}`
		: `--bg-rotation: ${bgRotation}; --bg-image: none`;
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

			timeout = setTimeout(() => {
				manageLifeTotal(type, id, 10);
				if (isHolding) {
					interval = setInterval(() => {
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
		}
	};

	const handleTouchStart = (type: App.Player.LifeMoveType) => {
		isHolding = true;

		timeout = setTimeout(() => {
			manageLifeTotal(type, id, 10);
			if (isHolding) {
				interval = setInterval(() => {
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
	};
</script>

<svelte:window bind:innerWidth />

<div
  	class="rounded-2xl relative h-full w-full"
 	class:bg-rotated={!!$players[index].backgroundImage}
 	style={styleVars}
 	style:background={!$players[index].backgroundImage ? bg : undefined}
>
	<!-- Overlay au-dessus du background (non-interactif) -->
	<div class="bg-rotated-overlay" class:highlight={$players[index].highlighted} class:dead={isDead}></div>
<div
	class="flex w-full rounded-2xl flex-grow h-6"
	class:h-full={!$appState.isMenuOpen}
	class:opacity-85={$players[index].highlighted}
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
					on:contextmenu|preventDefault draggable="false"
					class="w-full h-1/2 flex justify-center {orientation === 'left'
						? 'items-end rounded-b-3xl'
						: 'items-start rounded-t-3xl'} active:bg-player-light select-none"
				>
					<div class="rotate-90"><Minus /></div>
				</button>
				<button
					on:mousedown={() => handleMouseDown('add')}
					on:mouseup={() => handleMouseUp('add')}
					on:touchstart={() => handleTouchStart('add')}
					on:touchend={() => handleTouchEnd('add')}
					on:contextmenu|preventDefault draggable="false"
					class="w-full h-1/2 flex justify-center {orientation === 'left'
						? 'items-start rounded-t-3xl'
						: 'items-end rounded-b-3xl'} active:bg-player-light select-none"
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
						on:contextmenu|preventDefault draggable="false"
						class="py-2 px-3 rounded-lg mt-1 text-lg pointer-events-auto whitespace-nowrap vert shadow-lg"
						class:rotate-180={orientation === 'left'}
						style="background-color: {isDead ? 'black' : 'rgb(36, 36, 36, 0.9)'}"
					>
						<div class="flex items-center">
							<span style="font-size: xx-large; color: white;" style:text-decoration={isDead ? 'line-through' : 'none'}>{$players[index].playerName}</span>
							{#if $players[index].isFirst}
								<div class="flex justify-center items-center mt-2 rotate-90">
									<FirstPlace />
								</div>
							{/if}
						</div>
					</button>
				</div>
				<div
					class="w-1/3 flex justify-center items-center vert"
					class:flex-row-reverse={orientation === 'left'}
				>
					<span
						class="h-16 text-center"
						class:rotate-180={orientation === 'left'}
						class:h-8={$appSettings.playerCount >= 5}
						>{$players[index].tempLifeDiff < 0 ? `-${$players[index].tempLifeDiff * -1}` : ''}</span
					>
					<div class="relative flex items-center justify-center">
						{#if isDead}
							<div class="z-10 text-black" class:rotate-90={orientation === 'right'} class:-rotate-90={orientation === 'left'} class:-translate-x-0={orientation === 'right'} class:translate-x-0={orientation === 'left'} style="width: {$appSettings.playerCount >= 5 ? '2.5rem' : '3.25rem'}; height: {$appSettings.playerCount >= 5 ? '2.5rem' : '3.25rem'}; opacity: 1;">
								<Skull />
								<br>
							</div>
						{/if}
						<span
							class="text-shadow-white text-shadow-xl text-black text-7xl flex items-center text-center"
							class:text-5xl={$appSettings.playerCount >= 5}
							class:-rotate-180={orientation === 'left'}
							class:opacity-25={isDead}
							>{$players[index].lifeTotal}</span>
					</div>
					<span
						class="h-16 text-center"
						class:rotate-180={orientation === 'left'}
						class:h-8={$appSettings.playerCount >= 5}
						>{$players[index].tempLifeDiff > 0 ? `+${$players[index].tempLifeDiff}` : ''}</span
					>
				</div>

				<div class="grow w-1/3 vert"></div>
			</div>
				<!-- Status effects bar -->
				<div class="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none">
					<div class="bg-black/40 text-white text-xs rounded-full px-2 py-1 flex gap-2 items-center pointer-events-auto">
						{#if poisonCount > 0}
							<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1"><PoisonIcon /> <span> {poisonCount}/10</span></div>
						{/if}
						{#if energyCount > 0}
							<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1"><Energy /> <span>{energyCount}</span></div>
						{/if}
						{#if experienceCount > 0}
							<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1"><Experience /> <span>{experienceCount}</span></div>
						{/if}
						{#if radCount > 0}
							<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1"><Rad /> <span>{radCount}</span></div>
						{/if}
						{#if commandTaxCount > 0}
							<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center gap-1"><CommandTax /> <span>{commandTaxCount}</span></div>
						{/if}
						{#each booleanStatuses as s}
							{#if s === 'monarch'}
								<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center"><Crown /></div>
							{:else if s === 'initiative'}
								<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center"><Initiative /></div>
							{:else if s === 'ascend'}
								<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center"><Ascend /></div>
							{:else if s === 'dayNight'}
								<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center"><DayNight /></div>
							{:else if s === 'ko'}
								<div class="px-2 py-0.5 rounded-full bg-gray-800 text-white flex items-center"><Skull /></div>
							{/if}
						{/each}
					</div>
				</div>
		</div>
	{/if}
</div>
</div>
