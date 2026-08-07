<script lang="ts">
	import {
		appSettings,
		setIsStreamMode,
		setRemoteServerUrl,
		setCustomStartingLifeTotal,
		setPlayerCount,
		setStartingLifeTotal,
		setThreePlayerLayout,
		setFourPlayerLayout,
		setSixPlayerLayout,
		setShowEmblemMenu,
		setShowVanguardMenu,
		setShowTreacheryMenu,
		setShowLifeChangeHistory,
		setVanguardModeEnabled,
		setTreacheryModeEnabled,
		setShogunVariantEnabled,
		setVanguardDraftThree,
		setShowGameHistoryMenu,
		setShowResourcesButton,
		setShowRandomizerButton,
		setAppLocale
	} from '$lib/store/appSettings';
	import {
	    setTurnTimerEnabled,
	    setTurnTimerDuration,
	    setTurnTimerSound,
		setGlobalGameTimerEnabled,
		setGlobalGameTimerDuration
	} from '$lib/store/appSettings';
	import { globalGameTimer } from '$lib/store/globalGameTimer';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import CircularButton from '../../../shared/circularButton/CircularButton.svelte';
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { resetLifeTotals } from '$lib/store/player';
	import { showConfirm } from '$lib/store/modal';
	import {
		setAllowNegativeLife,
		setPreventScreenSleep,
		setHapticsEnabled,
		setSoundEffectsEnabled
	} from '$lib/store/appSettings';
	import { setEnableCurrentPlayerGlow, setShowNextPlayerButton } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';

	type RelayHealthStatus = 'idle' | 'testing' | 'ok' | 'ko';

	let relayHealthStatus: RelayHealthStatus = 'idle';
	let relayHealthMessage = '';

	const resetLocalStorage = async () => {
		const confirmReset = await showConfirm($_('window_confirm_reset_local_storage'));
		if (!confirmReset) return;
		try {
			['appSettings', 'resourceCounter', 'appState', 'players', 'emblemState', 'vanguardState', 'gameHistory'].forEach((k) =>
				localStorage.removeItem(k)
			);
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

	const handleSoundEffectsChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setSoundEffectsEnabled(!!target.checked);
	};

	const handleShowLifeChangeHistoryChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowLifeChangeHistory(!!target.checked);
	};

	const handleEnableGlowChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// Ne pas permettre d'activer le glow si le bouton "next player" est désactivé
		if (!$appSettings.showNextPlayerButton) {
			setEnableCurrentPlayerGlow(false);
			return;
		}
		setEnableCurrentPlayerGlow(!!target.checked);
	};

	const handleShowNextButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		const checked = !!target.checked;
		setShowNextPlayerButton(checked);
		if (!checked) {
			// si on désactive le bouton next-player, forcer aussi la désactivation du glow
			setEnableCurrentPlayerGlow(false);
		} else {
			// si on active le bouton next-player, réactiver le glow par défaut
			setEnableCurrentPlayerGlow(true);
		}
	};

	const handleShowEmblemMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowEmblemMenu(!!target.checked);
	};

	const handleShowResourcesButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowResourcesButton(!!target.checked);
	};

	const handleShowRandomizerButtonChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowRandomizerButton(!!target.checked);
	};

	const handleShowVanguardMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowVanguardMenu(!!target.checked);
	};

	const handleShowTreacheryMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowTreacheryMenu(!!target.checked);
	};

	const handleVanguardModeEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setVanguardModeEnabled(!!target.checked);
	};

	const handleTreacheryModeEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTreacheryModeEnabled(!!target.checked);
	};

	const handleShogunVariantEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShogunVariantEnabled(!!target.checked);
	};

	const handleVanguardDraftThreeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setVanguardDraftThree(!!target.checked);
	};

	const handleShowGameHistoryMenuChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setShowGameHistoryMenu(!!target.checked);
	};

	const handleTurnTimerEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTurnTimerEnabled(!!target.checked);
	};

	const handleTurnTimerDurationChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// input is minutes; enforce integer between 1 and 10
		let minutes = Math.round(Number(target.value) || 1);
		minutes = Math.max(1, Math.min(10, minutes));


		if (typeof document !== 'undefined') {
			const ae = document.activeElement as HTMLElement | null;
			if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
				ae.blur();
			}
			// try Virtual Keyboard API if available
			const nav = navigator as any;
			if (nav.virtualKeyboard && typeof nav.virtualKeyboard.hide === 'function') {
				try {
					nav.virtualKeyboard.hide();
				} catch {}
			}
		}

		setTurnTimerDuration(minutes * 60);
	};

	const handleTurnTimerSoundChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setTurnTimerSound(!!target.checked);
	};

	const handleGlobalGameTimerEnabledChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setGlobalGameTimerEnabled(!!target.checked);
		if (target.checked) {
			globalGameTimer.resetForNewGame();
		}
	};

	const handleGlobalGameTimerDurationChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		// input is minutes; enforce integer between 1 and 300
		let minutes = Math.round(Number(target.value) || 1);
		minutes = Math.max(1, Math.min(300, minutes));

		if (typeof document !== 'undefined') {
			const ae = document.activeElement as HTMLElement | null;
			if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
				ae.blur();
			}
			const nav = navigator as any;
			if (nav.virtualKeyboard && typeof nav.virtualKeyboard.hide === 'function') {
				try {
					nav.virtualKeyboard.hide();
				} catch {}
			}
		}

		setGlobalGameTimerDuration(minutes * 60);
		globalGameTimer.applyDuration(minutes * 60);
	};

	const handleStreamModeChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setIsStreamMode(!!target.checked);
	};

	const handleStreamRemoteServerUrlChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setRemoteServerUrl(target.value || '');
		relayHealthStatus = 'idle';
		relayHealthMessage = '';
	};

	const getSanitizedRelayBaseUrl = (rawUrl: string) => {
		const trimmed = (rawUrl || '').trim();
		if (!trimmed) return '';
		try {
			const url = new URL(trimmed);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
			return trimmed.replace(/\/$/, '');
		} catch {
			return '';
		}
	};

	$: relayBaseUrl = getSanitizedRelayBaseUrl($appSettings.remoteServerUrl);
	$: relayHealthUrl = relayBaseUrl ? `${relayBaseUrl}/health` : '';

	const testRelayHealth = async () => {
		relayHealthMessage = '';
		const baseUrl = getSanitizedRelayBaseUrl($appSettings.remoteServerUrl);
		if (!baseUrl) {
			relayHealthStatus = 'ko';
			relayHealthMessage = $_('stream_mode_status_invalid_url') || 'Invalid relay URL';
			return;
		}

		relayHealthStatus = 'testing';
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);

		try {
			const response = await fetch(`${baseUrl}/health`, {
				method: 'GET',
				signal: controller.signal
			});

			if (!response.ok) {
				relayHealthStatus = 'ko';
				relayHealthMessage = `HTTP ${response.status}`;
				return;
			}

			relayHealthStatus = 'ok';
			relayHealthMessage = '';
		} catch (error) {
			relayHealthStatus = 'ko';
			relayHealthMessage = (error as Error).name === 'AbortError'
				? $_('stream_mode_status_timeout') || 'Connection timeout'
				: $_('stream_mode_status_unreachable') || 'Server unreachable';
		} finally {
			clearTimeout(timeoutId);
		}
	};

	const handleOpenRelayHealthClick = (event: MouseEvent) => {
		if (!relayHealthUrl) {
			event.preventDefault();
		}
	};

	const languages = [
		{ code: 'en', label: 'English', emoji: '🇬🇧' },
		{ code: 'fr', label: 'Français', emoji: '🇫🇷' },
		{ code: 'es', label: 'Español', emoji: '🇪🇸' },
		{ code: 'de', label: 'Deutsch', emoji: '🇩🇪' },
		{ code: 'it', label: 'Italiano', emoji: '🇮🇹' },
		{ code: 'pt', label: 'Português', emoji: '🇵🇹' }
	];

	const handleChangeLocale = (code: string) => {
		setAppLocale(code);
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-auto h-full"
	style="max-height: {innerHeight - 50}px; -webkit-overflow-scrolling: touch;"
	tabindex="-1"
	role="region"
	aria-label={$_('settings')}
>
	<div
		class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black"
	>
		<button
			on:click={() => toggleIsMenuOpen('')}
			on:contextmenu|preventDefault
			draggable="false"
			class="text-white absolute left-0 pl-4"><Arrow /></button
		>
		<span class="text-white text-center" style="font-size: 2rem;">{$_('settings')}</span>
	</div>

	<div class="w-full text-center text-white mt-2 flex flex-col items-center">
		<!-- Player Count -->
		<div class="w-3/4">
			<div><span style="font-size: 1.5rem;" class="font-bold">{$_('players')}</span></div>
			<div class="grid grid-cols-4 justify-items-center justify-center mt-3 gap-2">
				{#each [2, 3, 4, 5] as playerCount}
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
			<div class="grid grid-cols-3 justify-items-center justify-center mt-2">
				{#each [6, 7, 8] as playerCount}
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
			{#if $appSettings.playerCount === 3}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_3players_layout')}</div>
					<div class="flex gap-3 justify-center">
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.threePlayerLayout === 'classic'}
							on:click={() => setThreePlayerLayout('classic')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="flex gap-1 h-1/2">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
								<div class="bg-gray-700 h-1/2 w-1/2 mx-auto" />
							</div>
							<div class="mt-1 text-sm">2 / 1</div>
						</button>
						<button
							class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
							class:border-blue-400={$appSettings.threePlayerLayout === 'inverted'}
							on:click={() => setThreePlayerLayout('inverted')}
						>
							<div class="w-full h-full flex flex-col gap-1">
								<div class="bg-gray-700 h-1/2 w-1/2 mx-auto" />
								<div class="flex gap-1 h-1/2">
									<div class="bg-gray-700 w-1/2" />
									<div class="bg-gray-700 w-1/2" />
								</div>
							</div>
							<div class="mt-1 text-sm">1 / 2</div>
						</button>
					</div>
				</div>
			{/if}

			{#if $appSettings.playerCount === 4}
				<div class="mt-4">
					<div class="text-lg mb-2">{$_('choose_4players_layout')}</div>
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

				{#if $appSettings.playerCount === 6}
					<div class="mt-4">
						<div class="text-lg mb-2">{$_('choose_6players_layout')}</div>
						<div class="flex gap-3 justify-center">
							<button
								class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
								class:border-blue-400={$appSettings.sixPlayerLayout === 'one'}
								on:click={() => setSixPlayerLayout('one')}
							>
								<div class="w-full h-full grid grid-rows-3 grid-cols-2 gap-1">
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
								</div>
								<div class="mt-1 text-sm">3 x 2</div>
							</button>
							<button
								class="w-36 h-28 p-2 rounded-lg border-2 flex flex-col items-center justify-center"
								class:border-blue-400={$appSettings.sixPlayerLayout === 'two'}
								on:click={() => setSixPlayerLayout('two')}
							>
								<div class="w-full h-full grid grid-rows-4 grid-cols-2 gap-1">
									<div class="bg-gray-700 col-span-2" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700" />
									<div class="bg-gray-700 col-span-2" />
								</div>
								<div class="mt-1 text-sm">1 / 2 / 2 / 1</div>
							</button>
						</div>
					</div>
				{/if}
		</div>

		<!-- Starting Life Total -->
		<div class="mt-6 w-3/4">
			<div><span style="font-size: 1.5rem;" class="font-bold">{$_('starting_life')}</span></div>
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

		<!-- All the main checkboxes -->
		<div class="w-full flex justify-center mt-6 mb-2">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('main_checkboxes_settings')}</div>
			</div>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.allowNegativeLife}
					on:change={handleGlobalAllowChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('allow_negative_life_global') || 'Allow negative life (global)'}</span>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.preventScreenSleep}
					on:change={handlePreventSleepChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('prevent_screen_sleep') || 'Prevent screen sleep'}</span>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.hapticsEnabled}
					on:change={handleHapticsChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('haptic_feedback') || 'Enable haptic feedback'}</span>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.soundEffectsEnabled}
					on:change={handleSoundEffectsChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('sound_effects') || 'Sound effects'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showLifeChangeHistory}
					on:change={handleShowLifeChangeHistoryChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_life_change_history') || 'Show life change history'}</span>
			</label>
		</div>

		<!-- Main optional buttons -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('main_optional_buttons_settings_title') || 'Main Optional Buttons'}</div>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showNextPlayerButton}
					on:change={handleShowNextButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_next_player_button') || 'Show next-player button'}</span>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.enableCurrentPlayerGlow}
					on:change={handleEnableGlowChange}
					class="h-5 w-5"
					disabled={!$appSettings.showNextPlayerButton}
				/>
				<span class="ml-2 text-lg font-semibold">{$_('enable_current_player_glow') || 'Enable current player glow'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showResourcesButton}
					on:change={handleShowResourcesButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_resources_button') || 'Show resources button'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showRandomizerButton}
					on:change={handleShowRandomizerButtonChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_randomizer_button') || 'Show randomizer button'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showEmblemMenu}
					on:change={handleShowEmblemMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_emblem_menu_button') || 'Show emblem menu button'}</span>
			</label>
		</div>
		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showGameHistoryMenu}
					on:change={handleShowGameHistoryMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_game_history_menu_button') || 'Show game history menu button'}</span>
			</label>
		</div>

		<!-- EDH variants settings -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('edh_variants_settings_title') || 'EDH Variants (experimental)'}</div>
			</div>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showVanguardMenu}
					on:change={handleShowVanguardMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_vanguard_menu_button') || 'Show Vanguard menu button'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.vanguardModeEnabled}
					on:change={handleVanguardModeEnabledChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('vanguard_mode_enabled') || 'Enable Vanguard mode on new game'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.vanguardDraftThree}
					on:change={handleVanguardDraftThreeChange}
					class="h-5 w-5"
					disabled={!$appSettings.vanguardModeEnabled}
				/>
				<span class="ml-2 text-lg font-semibold">{$_('vanguard_draft_three') || 'Variant: 3 Vanguard cards then keep one'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.showTreacheryMenu}
					on:change={handleShowTreacheryMenuChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('show_treachery_menu_button') || 'Show Treachery menu button'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.treacheryModeEnabled}
					on:change={handleTreacheryModeEnabledChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('treachery_mode_enabled') || 'Enable Treachery mode on new game'}</span>
			</label>
		</div>

		<div class="w-full flex justify-start mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.shogunVariantEnabled}
					on:change={handleShogunVariantEnabledChange}
					class="h-5 w-5"
					disabled={!$appSettings.treacheryModeEnabled}
				/>
				<span class="ml-2 text-lg font-semibold">{$_('shogun_variant_enabled') || 'Enable Shogun variant (simpler)'}</span>
			</label>
		</div>

		<!-- Timers settings -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('timers_settings_title') || 'Timers'}</div>
			</div>
		</div>

		<div class="w-full flex text-left justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<div class="ml-2">
					<div class="text-lg font-semibold">
						<input
							type="checkbox"
							checked={$appSettings.globalGameTimerEnabled}
							on:change={handleGlobalGameTimerEnabledChange}
							class="h-5 w-5"
						/>
						{$_('global_game_timer_enabled') || 'Enable global game timer'}
					</div>
					<div class="text-sm text-gray-400">{$_('global_game_timer_enabled_help') || 'When enabled, a game-wide countdown appears in the center menu bar.'}</div>
				</div>
			</label>
		</div>

		{#if $appSettings.globalGameTimerEnabled}
			<div class="w-full flex justify-end mt-0 mb-0">
				<label
					class="flex gap-2 text-sm px-4 py-2 rounded-full"
					style="min-width: 12rem;"
				>
					<span class="ml-2 text-lg font-semibold">{$_('global_game_timer_duration') || 'Global timer duration (minutes)'}</span>
					<input
						type="number"
						min="1"
						max="300"
						step="1"
						value={Math.round($appSettings.globalGameTimerDuration / 60)}
						on:change={handleGlobalGameTimerDurationChange}
						class="bg-gray-600 w-24 h-8 rounded text-center text-xl ml-3"
					/>
				</label>
			</div>
		{/if}

		<!-- Turn timer settings -->
		<div class="w-full flex text-left justify-start mt-0 mb-0">
			<label
				class="flex gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<div class="ml-2">
					<div class="text-lg font-semibold">
						<input
							type="checkbox"
							checked={$appSettings.turnTimerEnabled}
							on:change={handleTurnTimerEnabledChange}
							class="h-5 w-5"
						/>
						{$_('turn_timer_enabled') || 'Enable per-turn timer'}
					</div>
					<div class="text-sm text-gray-400">{$_('turn_timer_enabled_help') || 'When enabled, a per-turn countdown is shown for the active player.'}</div>
				</div>
			</label>
		</div>

		{#if $appSettings.turnTimerEnabled}
			<div class="w-full flex justify-end mt-0 mb-0">
				<label
					class="flex gap-2 text-sm px-4 py-2 rounded-full"
					style="min-width: 12rem;"
				>
					<span class="ml-2 text-lg font-semibold">{$_('turn_timer_duration') || 'Turn duration (minutes)'}</span>
					<input
						type="number"
						min="1"
						max="10"
						step="1"
						value={Math.round($appSettings.turnTimerDuration / 60)}
						on:change={handleTurnTimerDurationChange}
						class="bg-gray-600 w-20 h-8 rounded text-center text-xl ml-3"
					/>
				</label>
			</div>

			<div class="w-full flex justify-center mt-0 mb-0">
				<label
					class="flex gap-2 text-sm px-4 py-2 rounded-full"
					style="min-width: 12rem;"
				>
					<input
						type="checkbox"
						checked={$appSettings.turnTimerSound}
						on:change={handleTurnTimerSoundChange}
						class="h-5 w-5"
					/>
					<span class="ml-2 text-lg font-semibold">{$_('turn_timer_sound') || 'Play sound on timeout'}</span>
				</label>
			</div>
		{/if}

		<!-- Stream mode settings (LAN relay) -->
		<div class="w-full flex justify-center mt-2 mb-0">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl font-bold">{$_('stream_mode_title') || 'Experimental Stream Mode (LAN relay)'}</div>
			</div>
		</div>
		<div class="w-full flex justify-center mt-0 mb-0">
			<label
				class="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
				style="min-width: 12rem;"
			>
				<input
					type="checkbox"
					checked={$appSettings.isStreamMode}
					on:change={handleStreamModeChange}
					class="h-5 w-5"
				/>
				<span class="ml-2 text-lg font-semibold">{$_('stream_mode_enable') || 'Enable stream mode'}</span>
			</label>
		</div>
		{#if $appSettings.isStreamMode}
		<div class="w-full flex justify-start mt-0 mb-0 px-8">
			<div style="min-width: 12rem; max-width: 32rem;" class="w-full">
				<div class="text-sm text-gray-400 mb-1">{$_('stream_mode_help') || 'Use the local relay URL, e.g. http://192.168.1.113:8787'}</div>
				<input
					type="url"
					value={$appSettings.remoteServerUrl}
					on:change={handleStreamRemoteServerUrlChange}
					placeholder={$_('stream_mode_server_url_placeholder') || 'http://192.168.1.113:8787'}
					class="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none border border-gray-500"
				/>
				<div class="text-sm mt-1">{$_('stream_mode_server_url') || 'Relay server URL'}</div>
				<div class="mt-2 flex items-center gap-3">
					<button
						on:click={testRelayHealth}
						class="px-3 py-1 rounded bg-gray-700 border border-gray-500"
						disabled={relayHealthStatus === 'testing'}
					>
						{$_('stream_mode_test_button') || 'Test relay'}
					</button>
					<a
						href={relayHealthUrl || '#'}
						target="_blank"
						rel="noreferrer"
						class="px-3 py-1 rounded border border-gray-500"
						class:text-blue-300={!!relayHealthUrl}
						class:text-gray-500={!relayHealthUrl}
						on:click={handleOpenRelayHealthClick}
					>
						{$_('stream_mode_open_health_link') || 'Open /health'}
					</a>
					<span
						class:text-gray-400={relayHealthStatus === 'idle'}
						class:text-yellow-300={relayHealthStatus === 'testing'}
						class:text-green-300={relayHealthStatus === 'ok'}
						class:text-red-300={relayHealthStatus === 'ko'}
					>
						{#if relayHealthStatus === 'testing'}
							{$_('stream_mode_status_testing') || 'Testing...'}
						{:else if relayHealthStatus === 'ok'}
							{$_('stream_mode_status_ok') || 'Relay OK'}
						{:else if relayHealthStatus === 'ko'}
							{$_('stream_mode_status_ko') || 'Relay KO'}{relayHealthMessage ? ` (${relayHealthMessage})` : ''}
						{:else}
							{$_('stream_mode_status_idle') || 'Not tested'}
						{/if}
					</span>
				</div>
			</div>
		</div>
		{/if}

		<!-- Language selection -->
		<div class="w-full flex justify-center mt-6 mb-4">
			<div style="min-width: 12rem;" class="px-4 py-2 rounded-full">
				<div class="text-2xl mb-2 font-bold">{$_('choose_your_language')}</div>
				<div class="grid grid-cols-3 gap-2 justify-center w-full">
					{#each languages as lang}
						<button
							class="px-3 py-1 rounded-full text-xl"
							class:bg-blue-500={$appSettings.locale === lang.code}
							class:text-white={$appSettings.locale === lang.code}
							on:click={() => handleChangeLocale(lang.code)}
						>
							{lang.emoji} {lang.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Reset local storage placed at the bottom so user can scroll to it -->
		<div class="w-full flex justify-center mt-2 mb-2">
			<button class="bg-red-900 text-white px-4 py-1 rounded-full" on:click={resetLocalStorage}>
				{$_('reset_local_storage')}
			</button>
		</div>

		<!-- About section (larger text per request) -->
		<div class="w-full text-center text-gray-300 mt-4 mb-8 px-6">
			<div class="text-white text-2xl mb-2 font-bold">{$_('about_title')}</div>
			<div class="text-base mb-1">
				{$_('about_version')}: {import.meta.env.VITE_APP_VERSION || '0.4.11'}
			</div>
			<div class="text-base mb-1">{$_('about_author')}: <a class="text-blue-400 underline text-base" href="https://github.com/Naereen" target="_blank" rel="noreferrer">Lilian Besson (Naereen)</a></div>
			<div class="text-base mb-2">{$_('about_license')}: <a class="text-blue-400 underline text-base" href="https://naereen.mit-license.org" target="_blank" rel="noreferrer">MIT</a></div>
			<div class="text-base mb-2">{$_('about_thanks')}</div>
			<div class="flex justify-center gap-4 mt-2">
				<a
					class="text-blue-400 underline text-base"
					href="https://github.com/Naereen/My-Android-app-to-track-life-points-at-Magic-the-Gathering"
					target="_blank"
					rel="noreferrer">{$_('about_github')}</a
				>
				<!-- TODO: Optional links: Play Store direct link -->
				<!-- <a class="text-blue-400 underline text-base" href="#" on:click|preventDefault={() => null}>{ $_('about_playstore') }</a> -->
				<!-- Additional links: Feedback form or feedback email -->
				<a class="text-blue-400 underline text-base" href="mailto:naereen@crans.org?Subject=Feedback%20for%20Magic%20Life%20Points%20Tracker" target="_blank" rel="noreferrer">{ $_('about_feedback') }</a>
			</div>
		</div>
	</div>
</div>
