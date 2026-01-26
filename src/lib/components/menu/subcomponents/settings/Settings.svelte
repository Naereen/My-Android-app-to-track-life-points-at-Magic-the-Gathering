<script lang="ts">
	import {
		appSettings,
		setCustomStartingLifeTotal,
		setPlayerCount,
		setStartingLifeTotal,
		setFourPlayerLayout,
		setAppLocale
	} from '$lib/store/appSettings';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import CircularButton from '../../../shared/circularButton/CircularButton.svelte';
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { resetLifeTotals } from '$lib/store/player';
	import { showConfirm } from '$lib/store/modal';
	import { setAllowNegativeLife, setPreventScreenSleep, setHapticsEnabled } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';

	const resetLocalStorage = async () => {
		const confirmReset = await showConfirm($_('window_confirm_reset_local_storage'));
		if (!confirmReset) return;
		try {
			['appSettings', 'resourceCounter', 'appState', 'players'].forEach((k) => localStorage.removeItem(k));
		} catch (e) {
			// ignore
		}
		window.location.reload();
	};

	const isCustomStartingLife = () => {
		return (
			$appSettings.startingLifeTotal !== 20 &&
			$appSettings.startingLifeTotal !== 25 &&
			$appSettings.startingLifeTotal !== 30 &&
			$appSettings.startingLifeTotal !== 40
		);
	};

	const handleCustomLifeTotalKeyPress = (event: KeyboardEvent) => {
		const { key } = event;

		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter'];

		if (!allowedKeys.includes(key) && !/^\d$/.test(key)) {
			event.preventDefault();
		}

		if ($appSettings.customStartingLifeTotal < 0) {
			setCustomStartingLifeTotal(1);
		} else if ($appSettings.customStartingLifeTotal > 999) {
			setCustomStartingLifeTotal(999);
		}

		if (key === 'Enter') {
			setLifeTotal($appSettings.customStartingLifeTotal);
		}
	};

	const setLifeTotal = async (startingLifeTotal: number) => {
		const confirm = await showConfirm($_('window_confirm_change_life_total'));
		if (confirm) {
			setStartingLifeTotal(startingLifeTotal);
			if (!isCustomStartingLife()) {
				setCustomStartingLifeTotal(60);
			}
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	const setNewPlayerCount = async (playerCount: number) => {
		const confirm = await showConfirm($_('window_confirm_change_player_count'));
		if (confirm) {
			setPlayerCount(playerCount);
			toggleIsMenuOpen('');
			resetLifeTotals(true);
		}
	};

	$: innerHeight = 0;

	const handleScrollKeydown = (event: KeyboardEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!target) return;
		if (event.key === 'ArrowDown') {
			target.scrollBy({ top: 48, behavior: 'smooth' });
			event.preventDefault();
		} else if (event.key === 'ArrowUp') {
			target.scrollBy({ top: -48, behavior: 'smooth' });
			event.preventDefault();
		}
	};

	const handleGlobalAllowChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setAllowNegativeLife(!!target.checked);
	};

	const handlePreventSleepChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setPreventScreenSleep(!!target.checked);
	};

	const handleHapticsChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setHapticsEnabled(!!target.checked);
	};

	const languages = [
		{ code: 'en', label: 'English' },
		{ code: 'fr', label: 'Français' },
		{ code: 'es', label: 'Español' },
		{ code: 'de', label: 'Deutsch' },
		{ code: 'it', label: 'Italiano' }
	];

	const handleChangeLocale = (code: string) => {
		setAppLocale(code);
	};
</script>

<svelte:window bind:innerHeight />


<div
	class="w-full overflow-y-auto scrollbar-hidden h-full"
	style="max-height: {innerHeight - 80}px; -webkit-overflow-scrolling: touch;"
	tabindex="-1"
	role="region"
	aria-label={$_('settings')}
>
	<div class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black">
		<button on:click={() => toggleIsMenuOpen('')} on:contextmenu|preventDefault draggable="false" class="text-white absolute left-0 pl-4"
			><Arrow /></button>
		<span class="text-gray-400 text-center" style="font-size: xxx-large;">{ $_('settings') }</span>
	</div>

	<div class="w-full text-center text-white mt-4 flex flex-col items-center">
		<!-- Player Count -->
		<div class="w-3/4">
			<div><span style="font-size: xx-large;">{ $_('players') }</span></div>
			<div class="flex flex-row justify-between mt-3">
				{#each [2, 3, 4, 5, 6] as playerCount}
					{#key $appSettings.playerCount}
						<div>
							<CircularButton
								on:click={() => setNewPlayerCount(playerCount)}
								number={playerCount}
								highlight={$appSettings.playerCount === playerCount}
							/>
						</div>
					{/key}
				{/each}
			</div>
			{#if $appSettings.playerCount === 4}
				<div class="mt-4">
					<div class="text-lg mb-2">{ $_('choose_4players_layout') }</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.fourPlayerLayout === 'matrix'}
							on:click={() => setFourPlayerLayout('matrix')}
						>
							<div class="w-full h-full grid grid-rows-2 grid-cols-2 gap-1">
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
								<div class="bg-gray-700" />
							</div>
							<div class="mt-1 text-sm">2 x 2</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.fourPlayerLayout === 'stacked'}
							on:click={() => setFourPlayerLayout('stacked')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="bg-gray-700 h-1/3" />
								<div class="flex gap-1 h-1/3">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
								<div class="bg-gray-700 h-1/3" />
							</div>
							<div class="mt-1 text-sm">1 / 2 / 1</div>
						</button>
					</div>
				</div>
			{/if}

				<!-- reset button moved to bottom of menu -->
		</div>

		<!-- Starting Life Total -->
		<div class="mt-6 w-3/4">
			<div><span style="font-size: xx-large;">{ $_('starting_life') }</span></div>
			<div class="flex flex-row justify-between mt-3">
				{#each [20, 25, 30, 40, 'custom'] as lifeTotal}
					{#key $appSettings.startingLifeTotal}
						{#if typeof lifeTotal === 'number'}
							<div>
								<CircularButton
									on:click={() => setLifeTotal(lifeTotal)}
									number={lifeTotal}
									highlight={lifeTotal === 60
										? isCustomStartingLife()
										: $appSettings.startingLifeTotal === lifeTotal}
								/>
							</div>
						{:else}
							<div>
								<CircularButton
									number={$appSettings.customStartingLifeTotal}
									customText
									highlight={isCustomStartingLife()}
								>
									<input
										bind:value={$appSettings.customStartingLifeTotal}
										on:keypress={handleCustomLifeTotalKeyPress}
										type="number"
										class="bg-transparent w-8 h-8 overflow-hidden rounded-full text-center outline-none"
										max="999"
									/>
								</CircularButton>
							</div>
						{/if}
					{/key}
				{/each}
			</div>
		</div>

		<!-- Language selection -->
		<div class="w-full flex justify-center mt-6 mb-4">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl mb-2">{ $_('choose_your_language') }</div>
				<div class="flex gap-2 justify-center">
					{#each languages as lang}
						<button
							class="px-3 py-1 rounded-full"
							class:bg-blue-500={$appSettings.locale === lang.code}
							class:text-white={$appSettings.locale === lang.code}
							on:click={() => handleChangeLocale(lang.code)}
						>
							{lang.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
		<!-- Reset local storage placed at the bottom so user can scroll to it -->
		<div class="w-full flex justify-center mt-4 mb-4">
				<label class="flex items-center gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.allowNegativeLife}
					on:change={handleGlobalAllowChange}
					class="h-5 w-5"
				/>
					<span class="ml-2 text-lg font-semibold">{ $_('allow_negative_life_global') }</span>
			</label>
		</div>
		<div class="w-full flex justify-center mt-2 mb-4">
			<label class="flex items-center gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.preventScreenSleep}
					on:change={handlePreventSleepChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{ $_('prevent_screen_sleep') }</span>
			</label>
		</div>
		<div class="w-full flex justify-center mt-2 mb-4">
			<label class="flex items-center gap-2 text-sm px-4 py-2 rounded-full" style="min-width: 12rem;">
				<input
					type="checkbox"
					checked={$appSettings.hapticsEnabled}
					on:change={handleHapticsChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">Haptic feedback</span>
			</label>
		</div>
		<div class="w-full flex justify-center mt-8 mb-8">
			<button
				class="bg-red-900 text-white px-4 py-2 rounded-full"
				on:click={resetLocalStorage}
			>
				{ $_('reset_local_storage') }
			</button>
		</div>

		<!-- About section (larger text per request) -->
		<div class="w-full text-center text-gray-400 mt-4 mb-8 px-6">
			<div class="text-white text-2xl mb-2 font-semibold">{ $_('about_title') }</div>
			<div class="text-base mb-1">{ $_('about_version') }: {import.meta.env.VITE_APP_VERSION || '0.2.0'}</div>
			<div class="text-base mb-1">{ $_('about_author') }: Naereen</div>
			<div class="text-base mb-2">{ $_('about_license') }: MIT</div>
			<div class="text-base mb-2">{ $_('about_thanks') }</div>
			<div class="flex justify-center gap-4 mt-2">
				<a class="text-blue-400 underline text-base" href="https://github.com/Naereen/My-Android-app-to-track-life-points-at-Magic-the-Gathering" target="_blank" rel="noreferrer">{ $_('about_github') }</a>
				<!-- TODO: Optional links: Play Store / Feedback - shown as placeholders -->
				<!-- <a class="text-blue-400 underline text-base" href="#" on:click|preventDefault={() => null}>{ $_('about_playstore') }</a> -->
				<!-- <a class="text-blue-400 underline text-base" href="#" on:click|preventDefault={() => null}>{ $_('about_feedback') }</a> -->
			</div>
		</div>
	</div>
</div>
