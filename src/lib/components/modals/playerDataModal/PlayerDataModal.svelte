<script lang="ts">
	import Pen from '$lib/assets/icons/Pen.svelte';
	import X from '$lib/assets/icons/X.svelte';
	import { playerModalData, resetPlayerModalData } from '$lib/store/modal';
	import {
		players,
		setPlayerColor,
		setPlayerAllowNegative,
		setPlayerStatusBoolean,
		setPlayerStatusNumeric,
		setPlayerPoison,
		setCommanderDamage
	} from '$lib/store/player';
	import StatusSkull from '$lib/assets/icons/StatusSkull.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import DayNight from '$lib/assets/icons/DayNight.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
 	import Acorn from '$lib/assets/icons/Acorn.svelte';
 	import Ticket from '$lib/assets/icons/Ticket.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import { colorToBg } from '$lib/components/colorToBg';
	import { _ } from 'svelte-i18n';
	import { appSettings } from '$lib/store/appSettings';
	import { vibrate } from '$lib/utils/haptics';

	let gradientMode = false;
	let selectedColors: string[] = [];
	let mode: 'background' | 'commander' | 'status_effects' = 'status_effects';
	let searchQuery = '';
	let searchEdited = false;
	let searchResults: Array<{
		id: string;
		name: string;
		set_name?: string;
		artist?: string;
		cardImage?: string | null | undefined;
		image?: string | null | undefined;
	}> = [];
	let isSearching = false;
	let hasSearched = false;

	// search mode: false = cards (Scryfall), true = GIFs (Klipy)
	let gifMode = false;
	// By default hide the gradient controls (title visible but not bold)
	let searchOptionActive = true;
	let klipyKeyPresent = false;

	const checkKlipyKey = async () => {
		// fast check for Vite env
		try {
			// @ts-ignore
			if (import.meta.env && import.meta.env.VITE_KLIPY_API_KEY) {
				klipyKeyPresent = true;
				return;
			}
		} catch {}

		try {
			const resp = await fetch('klipy_api.key', { method: 'GET' });
			if (resp.ok) {
				const txt = (await resp.text()).trim();
				klipyKeyPresent = txt.length > 0;
				return;
			}
		} catch (e) {}

		klipyKeyPresent = false;
	};

	$: if (gifMode) {
		checkKlipyKey();
	}

	// allow choosing two images
	let doubleBackground = false;
	let bgSelections: string[] = [];

	const getModalPlayer = () => {
		return (
			$players.find((player) => player.id === $playerModalData.playerId) ??
			$players[$playerModalData.playerId - 1]
		);
	};

	// Translation for damage from player label
	$: damageFromPlayerLabel = String($_('damage_from_player'));
	$: enterLifeTotalPlaceholder = String($_('enter_life_total_placeholder'));
	$: setLifeTotalSave = String($_('set_life_total_save'));
	$: setLifeTotalCancel = String($_('set_life_total_cancel'));
	$: setCommanderDamageString = String($_('set_commander_damage'));

	import { searchCards, randomCards } from '$lib/utils/scryfall';
	import { searchGifs } from '$lib/utils/klipy';
	import { setPlayerBackgroundImage } from '$lib/store/player';
	import { tick } from 'svelte';

	// Track previous player ID to detect actual player changes
	let _prevModalPlayerId: number | null = null;

	// initialize selectedColors when modal/player changes
	$: if ($playerModalData && $players) {
		// Only reset search edit flag when the selected player actually changes,
		// NOT on every $players update (which would clear it on every keystroke/life change).
		if (_prevModalPlayerId !== $playerModalData.playerId) {
			_prevModalPlayerId = $playerModalData.playerId;
			searchEdited = false;
		}
		const p = $players[$playerModalData.playerId - 1];
		if (p && typeof p.color === 'string' && p.color.includes(',')) {
			selectedColors = p.color.split(',').map((s) => s.trim());
		} else if (p && p.color) {
			selectedColors = [p.color];
		} else {
			selectedColors = [];
		}
	}

	// When the modal opens, use any requested mode from the store (for example 'commander')
	$: if ($playerModalData && $playerModalData.isOpen) {
		mode = $playerModalData.mode ?? 'status_effects';
	}

	// Track if background tab has been initialized for the current player
	let _bgInitPlayerId: number | null = null;

	// Reset background tab init tracking when leaving background mode
	$: if (mode !== 'background') {
		_bgInitPlayerId = null;
	}

	// When entering the 'background' tab, run one-time initialization per player.
	// The init logic is inside a regular function so that searchQuery, searchResults,
	// and bgSelections are NOT reactive dependencies of this $: block.
	// This prevents the block from re-running on every keystroke in the search input.
	$: if (mode === 'background' && $playerModalData && _bgInitPlayerId !== $playerModalData.playerId) {
		_bgInitPlayerId = $playerModalData.playerId;
		_initBackgroundTab();
	}

	function _initBackgroundTab() {
		const p = getModalPlayer();
		if (!p) return;

		// Prefill the search input with the player's name
		if (p.playerName != '' && (!searchQuery || searchQuery.trim().length === 0) && !searchEdited) {
			searchQuery = p.playerName ?? '';
		}
	}

	// Ensure the already chosen background (if any) is visible in the search results
	// so it appears as "chosen" by default when opening the tab.
	$: if (mode === 'background' && $playerModalData) {
		const p = getModalPlayer();
		if (!p) {
			bgSelections = [];
		} else if (p.backgroundImage) {
			const backgroundImage = p.backgroundImage;
			const already = searchResults.find((r) => {
				return isStoredBackgroundInCandidates(backgroundImage, [r.image, r.cardImage]);
			});
			if (!already) {
				// prepend a synthetic result representing the current chosen background (use first image if array)
				const img = Array.isArray(backgroundImage) ? backgroundImage[0] : backgroundImage;
				searchResults = [
					{
						id: 'current-bg',
						name: `${p.playerName ?? 'Current'}'s background`,
						set_name: p.backgroundSet ?? '',
						artist: p.backgroundArtist ?? '',
						cardImage: img,
						image: img
					},
					...searchResults
				];
			}
		}

		// initialize bgSelections from player data (keep first two if array)
		if (!p) bgSelections = [];
		else if (Array.isArray(p.backgroundImage)) bgSelections = p.backgroundImage.slice(0, 2).filter(Boolean) as string[];
		else if (p.backgroundImage) bgSelections = [p.backgroundImage];
		else bgSelections = [];
	}

	// helper to compare stored background (string or array) to a single image url
	const isSameBackground = (stored: string | string[] | null | undefined, candidate: string | null | undefined) => {
		if (!stored) return false;
		if (Array.isArray(stored)) return candidate ? stored.includes(candidate) : false;
		return stored === candidate;
	};

	const normalizeImageUrl = (url: string | null | undefined) => {
		if (!url) return null;
		const value = String(url).trim();
		if (!value) return null;

		try {
			const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
			const parsed = new URL(value, base);
			return `${parsed.origin}${parsed.pathname}`;
		} catch {
			return value.split('#')[0].split('?')[0];
		}
	};

	const isStoredBackgroundInCandidates = (
		stored: string | string[] | null | undefined,
		candidates: Array<string | null | undefined>
	) => {
		if (!stored) return false;

		const normalizedCandidates = candidates
			.map((candidate) => normalizeImageUrl(candidate))
			.filter(Boolean) as string[];
		if (normalizedCandidates.length === 0) return false;

		if (Array.isArray(stored)) {
			const normalizedStored = stored.map((entry) => normalizeImageUrl(entry)).filter(Boolean) as string[];
			return normalizedStored.some((entry) => normalizedCandidates.includes(entry));
		}

		const normalizedStored = normalizeImageUrl(stored);
		if (!normalizedStored) return false;
		return normalizedCandidates.includes(normalizedStored);
	};

	const isResultSelected = (result: { image?: string | null; cardImage?: string | null }) => {
		const player = getModalPlayer();
		const stored = player?.backgroundImage;
		return isStoredBackgroundInCandidates(stored, [result.image, result.cardImage]);
	};

	const getSelectableImage = (result: { image?: string | null; cardImage?: string | null }) => {
		return result.image ?? result.cardImage ?? null;
	};

	const toggleColorSelection = (playerId: number, c: string) => {
		if (!gradientMode) {
			setPlayerColor(playerId, c);
			// when choosing a color, clear any background image so the color is visible
			setPlayerBackgroundImage(playerId, null);
			return;
		}

		const idx = selectedColors.indexOf(c);
		if (idx === -1) {
			selectedColors = [...selectedColors, c];
		} else {
			selectedColors = selectedColors.filter((x) => x !== c);
		}

		// update store with joined comma-separated list (or single color)
		if (selectedColors.length > 0) {
			setPlayerColor(playerId, selectedColors.join(','));
			// clear any previously selected image when using colors
			setPlayerBackgroundImage(playerId, null);
		} else {
			setPlayerColor(playerId, 'white');
			setPlayerBackgroundImage(playerId, null);
		}
	};

	const clearSelection = (playerId: number) => {
		selectedColors = [];
		setPlayerColor(playerId, 'white');
		// also clear any chosen background image
		setPlayerBackgroundImage(playerId, null);
	};

	const handleOnKeyPress = (event: KeyboardEvent) => {
		// ignore IME composition events (mobile/virtual keyboards)
		if ((event as any).isComposing) return;
		if (event.key === 'Enter') {
			resetPlayerModalData();
		}

		if ($players[$playerModalData.playerId - 1].playerName.length >= 26) {
			$players[$playerModalData.playerId - 1].playerName = $players[
				$playerModalData.playerId - 1
			].playerName.slice(0, 25);
		}
	};

	const handleOnKeyPressScryfallSearch = (event: KeyboardEvent) => {
		// ignore IME composition events which may falsely emit Enter on some mobile keyboards
		if ((event as any).isComposing) return;
		if (event.key === 'Enter') {
			doSearch();
		}
	};

	const doSearch = async () => {
		vibrate(20);
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
		if (!searchQuery || searchQuery.trim().length === 0) {
			searchResults = [];
			hasSearched = false;
			return;
		}
		isSearching = true;
		if (gifMode) {
			const gifs = await searchGifs(searchQuery);
			searchResults = gifs.map(g => ({
				id: g.id,
				name: g.title,
				cardImage: g.preview ?? null,
				image: g.url ?? null,
				artist: "Klipy GIF"
			}));
		} else {
			searchResults = await searchCards(searchQuery);
		}
		isSearching = false;
		hasSearched = true;
	};

	const chooseRandom = async (playerId: number) => {
		// If we already have search results, pick one from them
		if (searchResults && searchResults.length > 0) {
			const withImage = searchResults.filter((r) => r.image);
			const pool = withImage.length > 0 ? withImage : searchResults;
			const pick = pool[Math.floor(Math.random() * pool.length)];
			chooseBackground(playerId, pick.image ?? null, pick.artist ?? null, pick.set_name ?? null);
			return;
		}

		// Otherwise, fetch a random item depending on mode
		try {
			isSearching = true;
			if (gifMode) {
				const gifs = await searchGifs(searchQuery || 'random');
				if (gifs && gifs.length > 0) {
					const g = gifs[Math.floor(Math.random() * gifs.length)];
					chooseBackground(playerId, g.url ?? null, "Klipy GIF", null);
				}
			} else {
				// use a broad query so the util can return a random art card
				const cards = await randomCards('game:paper');
				if (cards && cards.length > 0) {
					const c = cards[0];
					chooseBackground(playerId, c.image ?? null, c.artist ?? null, c.set_name ?? null);
				}
			}
		} catch (err) {
			console.warn('Failed to fetch random resource', err);
		} finally {
			isSearching = false;
		}
	};

	const chooseBackground = (
		playerId: number,
		imageUrl: string | null,
		artist: string | null = null,
		set_name: string | null = null
	) => {
		vibrate(30);

		if (doubleBackground) {
			// toggle selection in bgSelections
			if (!imageUrl) return;
			const idx = bgSelections.indexOf(imageUrl);
			if (idx === -1) {
				// add up to 2
				if (bgSelections.length < 2) bgSelections = [...bgSelections, imageUrl];
				else bgSelections = [bgSelections[1], imageUrl];
			} else {
				bgSelections = bgSelections.filter((x) => x !== imageUrl);
			}

			// persist array or null
			const payload = bgSelections.length > 0 ? bgSelections.slice(0, 2) : null;
			setPlayerBackgroundImage(playerId, payload);
		} else {
			const player = getModalPlayer();
			const isSameAsCurrentSingle = !!imageUrl && isStoredBackgroundInCandidates(player?.backgroundImage, [imageUrl]);

			if (!imageUrl || isSameAsCurrentSingle) {
				bgSelections = [];
				setPlayerBackgroundImage(playerId, null);
			} else {
				bgSelections = [imageUrl];
				setPlayerBackgroundImage(playerId, { imageUrl, artist, set_name });
			}
		}

		// clear color so background shows clearly
		setPlayerColor(playerId, 'white');
	};

	// Inline editor state for commander damage (replaces native prompt)
	let editingCommanderFrom: number | null = null;
	let editingCommanderValue = '';

	// Inline editor state for numeric status effects (poison, energy, etc.)
	let editingStat: string | null = null;
	let editingStatValue = '';

	const startEditCommander = async (playerId: number, fromPlayerId: number, current: number) => {
		vibrate(20);
		editingCommanderFrom = fromPlayerId;
		editingCommanderValue = String(current);
		await tick();
		const el = document.getElementById(`commander-input-${fromPlayerId}`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	const saveEditCommander = () => {
		if (editingCommanderFrom === null) return;
		const v = parseInt(editingCommanderValue, 10);
		if (!Number.isNaN(v)) {
			setCommanderDamage($playerModalData.playerId, editingCommanderFrom, v);
		}
		editingCommanderFrom = null;
	};

	const cancelEditCommander = () => {
		editingCommanderFrom = null;
	};

	const startEditStat = async (stat: string, current: number) => {
		vibrate(20);
		editingStat = stat;
		editingStatValue = String(current);
		await tick();
		const el = document.getElementById(`stat-input-${stat}`) as HTMLInputElement | null;
		el?.focus();
		el?.select();
	};

	const saveEditStat = () => {
		if (!editingStat) return;
		const v = parseInt(editingStatValue, 10);
		if (Number.isNaN(v)) {
			editingStat = null;
			return;
		}
		if (editingStat === 'poison') {
			setPlayerPoison($playerModalData.playerId, Math.max(0, v));
		} else {
			setPlayerStatusNumeric($playerModalData.playerId, editingStat, Math.max(0, v));
		}
		editingStat = null;
	};

	const cancelEditStat = () => {
		editingStat = null;
	};

	// Status maxima used by the UI to hide + buttons when reached
	const POISON_MAX = 10;
	const RING_BEARER_MAX = 4;
	const SPEED_MAX = 4;
</script>

<div
	class="bg-black/70 fixed inset-0 flex justify-center items-start"
	on:click={resetPlayerModalData}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation
		class="bg-[#d8e5f7] max-w-3xl w-11/12 max-h-[90vh] h-auto opacity-100 rounded-[1.5rem] flex justify-center items-start text-black p-4 relative mt-8 overflow-auto"
		role="button"
		on:keydown={() => null}
		tabindex="0"
	>
		<div class="flex flex-col justify-center w-full">
			<div class="flex flex-col justify-center items-center sticky top-0 bg-[#d8e5f7] z-10 pb-4">
				<h2 class="text-2xl font-semibold my-2 relative w-full text-center">
					{$_('customize_player')}
					{$playerModalData.playerId}
					{#if $appSettings.playerCount !== 2}
						<span class="inline-flex items-center" title="Commander Damage">
							<CommanderDamage playerIndex={$playerModalData.playerId - 1} />
						</span>
					{/if}
					<button
						on:click={resetPlayerModalData}
						on:contextmenu|preventDefault
						draggable="false"
						class="absolute -right-0 top-0"
					>
						<X />
					</button>
				</h2>
				<div class="relative">
					<input
						type="text"
						class="beleren py-2 px-3 rounded-lg outline outline-1 outline-black text-black font-semibold bg-[#f1f6fe]"
						bind:value={$players[$playerModalData.playerId - 1].playerName}
						on:keypress={handleOnKeyPress}
						maxlength="25"
					/>
					<div class="absolute right-3 top-3 flex items-center gap-2">
						<div class="pointer-events-none"><Pen /></div>
						<button
							type="button"
							on:click={() => players.update(ps => { ps[$playerModalData.playerId - 1].playerName = ''; return ps; })}
							class="ml-2 px-2 py-1 bg-gray-200 text-black rounded text-sm"
							title="Effacer le nom"
							aria-label="Effacer le nom"
						>
							✕
						</button>
					</div>
				</div>
				<div class="mt-4 flex flex-col justify-center items-center w-full px-6 sm:px-10">
						<div class="w-full flex justify-center gap-4 mb-3">
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => (mode = 'background')}
								class:underline={mode === 'background'}
								class:font-bold={mode === 'background'}>{$_('open_customize_backgrounds')}</button
							>
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => (mode = 'status_effects')}
								class:underline={mode === 'status_effects'}
								class:font-bold={mode === 'status_effects'}>{$_('status_effects')}</button
							>
							{#if $appSettings.playerCount !== 2}
								<button
									class="px-3 py-1 rounded-full border"
									on:click={() => (mode = 'commander')}
									class:underline={mode === 'commander'}
									class:font-bold={mode === 'commander'}>{$_('commander_damage_short')}</button
								>
							{/if}
						</div>

					{#if mode === 'background'}
					{#if hasSearched || searchOptionActive}
						<div class="w-8/10 mb-3">
							<div class="gap-4">
								<div class="relative w-full">
									<input
										type="text"
										class="flex-1 py-2 px-3 rounded-lg outline outline-1 outline-black w-full"
										bind:value={searchQuery}
										on:input={() => (searchEdited = true)}
										on:keypress={handleOnKeyPressScryfallSearch}
										placeholder={$_('scryfall_search') + ' (Scryfall)...'}
									/>
									<div class="absolute right-3 top-2 flex items-center">
										<button
											type="button"
											on:click={() => { searchQuery = ''; searchEdited = true; }}
											class="ml-2 px-2 py-1 bg-gray-200 text-black rounded text-sm"
											title="Effacer la recherche"
											aria-label="Effacer la recherche"
										>
											✕
										</button>
									</div>
								</div>
								<button
									class="px-3 py-2 mt-2 bg-blue-500 text-white text-sm rounded-lg"
									on:click={doSearch}
									disabled={isSearching || (gifMode && !klipyKeyPresent)}
									>{isSearching ? $_('scryfall_searching') : gifMode ? $_('klipy_search') : $_('scryfall_search')}</button
								>
								<button
									class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg"
									on:click={() => chooseRandom($playerModalData.playerId)}
									disabled={isSearching || (gifMode && !klipyKeyPresent)}>{gifMode ? $_('klipy_search_choose_random') : $_('scryfall_search_choose_random')}</button
								>
								<button
									class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg"
									on:click={() => { hasSearched = false; searchOptionActive = false; bgSelections = []; setPlayerBackgroundImage($playerModalData.playerId, null); }}
									>{$_('clear_background')}</button
								>
							</div>
							<div class="mt-2">
								<label class="flex items-center gap-2 text-sm">
									<input type="checkbox" bind:checked={doubleBackground} /> {$_('double_background_mode') ?? 'Double background (choose up to 2)'}
								</label>
							</div>
						</div>
						{/if}
						<div class="w-full max-h-60 overflow-auto">
							{#if gifMode && !klipyKeyPresent}
								<div class="text-sm text-red-600">
									No Klipy API key found. Create `static/klipy_api.key` with your key, or set `VITE_KLIPY_API_KEY` in your environment.
									<!-- FIXME: translate this message! -->
								</div>
							{:else}
								{#if searchResults.length === 0}
									<div class="text-sm text-gray-500">{$_('scryfall_search_noresult')}</div>
								{/if}
							{/if}
							{#each searchResults as r (r.id + '|' + (getSelectableImage(r) ?? 'no-image'))}
								<div class="flex gap-2 mb-3 p-2 border rounded-lg bg-white">
									<div class="flex-1 text-left">
										<div class="font-semibold text-xl">{r.name}</div>
										<div class="text-sm text-gray-600">Set: {r.set_name}</div>
										<div class="text-sm text-gray-600">Artist: {r.artist}</div>
										<div class="text-sm text-gray-600">© Wizards of the Coast</div>
										<div class="mt-2">
											<button
												class="px-3 py-1 text-white text-sm rounded"
												class:bg-gray-500={isResultSelected(r)}
												class:bg-green-600={!isResultSelected(r)}
												on:click={() => { const img = getSelectableImage(r); if (img) chooseBackground($playerModalData.playerId, img, r.artist ?? null, r.set_name ?? null); }}
											>
												{isResultSelected(r) ? $_('scryfall_search_chosen') : $_('scryfall_search_choose')}
											</button>
										</div>
									</div>
									<div class="w-32 flex-shrink-0">
										{#if r.cardImage || r.image}
											<img src={r.cardImage ?? r.image} alt={r.name} class="w-full h-auto object-cover" />
										{:else}
											<div class="w-full h-40 bg-gray-200 flex items-center justify-center text-sm">
												No image
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
						{#if doubleBackground && bgSelections.length > 0}
							<div class="mt-3 flex gap-2 items-center">
								<label class="font-semibold">{$_('selected_backgrounds') ?? 'Selected backgrounds:'}</label>
								{#each bgSelections as s, i}
									<div class="w-20 h-28 border rounded overflow-hidden relative">
										{#if s}
											<img src={s} alt={`bg-${i}`} class="w-full h-full object-cover" />
										{/if}
										<button class="absolute top-1 right-1 bg-black/50 text-white rounded px-1 text-xs" on:click={() => { bgSelections = bgSelections.filter((x) => x !== s); setPlayerBackgroundImage($playerModalData.playerId, bgSelections.length ? bgSelections : null); }}>{$_('remove_button') ?? 'Remove'}</button>
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Always show the Gradient title; only hide the controls when a search option is active or search has happened -->
					{#if mode === 'background'}

					<!-- {#if searchOptionActive} -->
						<div class="mt-2 flex gap-2 items-center">
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => { gifMode = false; searchOptionActive = true; }}
								class:font-bold={(searchOptionActive || hasSearched) && !gifMode}
							>
								{$_('scryfall_search')}
							</button>
							<button
								class="px-3 py-1 rounded-full border"
								on:click={() => { gifMode = true; searchOptionActive = true; }}
								class:font-bold={(searchOptionActive || hasSearched) && gifMode}
							>
								GIFs
							</button>
						</div>
					<!-- {/if} -->

						<label
							class="block mb-2 rounded-full border"
							class:font-semibold={!searchOptionActive && !hasSearched}
							role="button"
							tabindex="0"
							on:click={() => {
								// show gradient controls, hide search/GIF options and clear previous search
								searchOptionActive = false;
								hasSearched = false;
								gifMode = false;
								searchQuery = '';
								searchResults = [];
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									searchOptionActive = false;
									hasSearched = false;
									gifMode = false;
									searchQuery = '';
									searchResults = [];
								}
							}}
						>{ $_('player_background_color') }</label>

						{#if !hasSearched && !searchOptionActive}
							<div class="flex items-center gap-3 mb-2">
								<label class="flex items-center gap-2 text-sm"
									><input type="checkbox" bind:checked={gradientMode} /> {$_('gradient_mode')}</label
								>
								<button
									on:click={() => clearSelection($playerModalData.playerId)}
									class="ml-2 text-sm underline">{$_('clear_gradient')}</button
								>
							</div>
							<div class="flex flex-wrap justify-center items-center gap-3 m-auto">
								{#each ['white', 'blue', 'black', 'red', 'green', 'mud'] as c}
									<button
										on:click={() => toggleColorSelection($playerModalData.playerId, c)}
										class="w-8 h-8 rounded-square rounded-lg border-2 relative"
										style="background: {colorToBg(c)}"
										aria-label={c}
									>
										{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
											<span
												class="block w-full h-full rounded-square rounded-lg"
												style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"
											></span>
										{/if}
										{#if selectedColors.indexOf(c) !== -1}
											<span
												class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
												>{selectedColors.indexOf(c) + 1}</span
											>
										{/if}
									</button>
								{/each}
								<div class="-h-1" />
								<hr class="w-full" />
								{#each ['metalicgray', 'gold', 'purple', 'pink', 'orange', 'lightgreen'] as c}
									<button
										on:click={() => toggleColorSelection($playerModalData.playerId, c)}
										class="w-8 h-8 rounded-square rounded-lg border-2 relative"
										style="background: {colorToBg(c)}"
										aria-label={c}
									>
										{#if !$players[$playerModalData.playerId - 1].color.includes(',') && $players[$playerModalData.playerId - 1].color === c}
											<span
												class="block w-full h-full rounded-square rounded-lg"
												style="box-shadow: 0 0 0 2px rgba(0,0,0,0.2) inset"
											></span>
										{/if}
										{#if selectedColors.indexOf(c) !== -1}
											<span
												class="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
												>{selectedColors.indexOf(c) + 1}</span
											>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					{/if}

					{#if mode === 'status_effects'}
						<!-- Status effects controls -->
						<div class="mt-1 w-full flex flex-col items-center text-center">
							<div class="grid grid-cols-2 gap-1 m-1 justify-left w-[105%]">
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.monarch ??
											false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'monarch',
												!($players[$playerModalData.playerId - 1].statusEffects?.monarch ?? false)
											)}
									/>
									<Crown />
									{String($_('monarch'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.initiative ??
											false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'initiative',
												!(
													$players[$playerModalData.playerId - 1].statusEffects?.initiative ?? false
												)
											)}
									/>
									<Initiative />
									{String($_('initiative'))}</label
								>
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.ascend ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'ascend',
												!($players[$playerModalData.playerId - 1].statusEffects?.ascend ?? false)
											)}
									/>
									<Ascend />
									{String($_('ascend'))}</label
								>
								<!-- FIXME: enable again the day/night switch setting -->
								<!-- <label class="flex items-center gap-2"><input type="checkbox" checked={$players[$playerModalData.playerId - 1].statusEffects?.dayNight ?? false} on:change={() => setPlayerStatusBoolean($playerModalData.playerId, 'dayNight', !($players[$playerModalData.playerId - 1].statusEffects?.dayNight ?? false))} /> <DayNight title={$_('tooltip_status_day_night')} /> { $_('day_night') }</label> -->
								<label class="flex items-center gap-1"
									><input
										type="checkbox"
										checked={$players[$playerModalData.playerId - 1].statusEffects?.ko ?? false}
										on:change={() =>
											setPlayerStatusBoolean(
												$playerModalData.playerId,
												'ko',
												!($players[$playerModalData.playerId - 1].statusEffects?.ko ?? false)
											)}
									/>
									<StatusSkull />
									{String($_('ko'))}</label
								>
							</div>

							<div class="w-full grid grid-cols-1 items-center text-center border-t pt-4">
								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><PoisonIcon /> {String($_('poison'))}</span>
									{#if ($players[$playerModalData.playerId - 1].poison ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerPoison(
													$playerModalData.playerId,
													Math.max(0, ($players[$playerModalData.playerId - 1].poison ?? 0) - 1)
												)}>-</button>
									{/if}
									<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded">{$players[$playerModalData.playerId - 1].poison ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].poison ?? 0) < POISON_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerPoison(
													$playerModalData.playerId,
													Math.min(99, ($players[$playerModalData.playerId - 1].poison ?? 0) + 1)
												)}>+</button>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Energy /> {String($_('energy'))}</span
									>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'energy',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'energy'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-energy"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" on:dblclick={() => startEditStat('energy', $players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'energy',
												($players[$playerModalData.playerId - 1].statusEffects?.energy ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Experience /> {String($_('experience'))}</span
									>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'experience',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) -
															1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'experience'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-experience"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" on:dblclick={() => startEditStat('experience', $players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'experience',
												($players[$playerModalData.playerId - 1].statusEffects?.experience ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Rad /> {String($_('rad'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'rad',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'rad'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-rad"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" on:dblclick={() => startEditStat('rad', $players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'rad',
												($players[$playerModalData.playerId - 1].statusEffects?.rad ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Acorn /> {String($_('acorn'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'acorn',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'acorn'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-acorn"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" on:dblclick={() => startEditStat('acorn', $players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'acorn',
												($players[$playerModalData.playerId - 1].statusEffects?.acorn ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><Ticket /> {String($_('ticket'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ticket',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) - 1
													)
												)}>-</button>
									{/if}
									{#if editingStat === 'ticket'}
										<div class="pointer-events-auto flex items-center gap-2">
											<input
												id="stat-input-ticket"
												type="number"
												bind:value={editingStatValue}
												on:keydown={(e) => {
													if (e.key === 'Enter') saveEditStat();
													if (e.key === 'Escape') cancelEditStat();
												}}
												class="w-20 text-center rounded-md px-1 py-0.5"
												placeholder={enterLifeTotalPlaceholder}
											/>
											<div class="flex gap-2">
												<button on:click={saveEditStat} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
												<button on:click={cancelEditStat} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
											</div>
										</div>
									{:else}
										<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded" on:dblclick={() => startEditStat('ticket', $players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0)} title={setLifeTotalSave}>{$players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0}</span>
									{/if}
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'ticket',
												($players[$playerModalData.playerId - 1].statusEffects?.ticket ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left text-base"><CommandTax /> {String($_('command_tax'))}</span
									>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.commandTax ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'commandTax',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.commandTax ?? 0) -
															1
													)
												)}>-</button>
									{/if}
									<span class="min-w-[2rem] px-2 py-1 bg-gray-100 rounded">{$players[$playerModalData.playerId - 1].statusEffects?.commandTax ?? 0}</span>
									<button
										class="px-2 py-1 bg-gray-200 rounded"
										on:click={() =>
											setPlayerStatusNumeric(
												$playerModalData.playerId,
												'commandTax',
												($players[$playerModalData.playerId - 1].statusEffects?.commandTax ?? 0) + 1
											)}>+</button>
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><TheRingerBearer isMax={$players[$playerModalData.playerId - 1].statusEffects?.ringBearer === 4} /> {String($_('ring_bearer'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ringBearer',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) -
															1
													)
												)}>-</button>
									{/if}
									<span class="min-w-[1rem] px-2 py-1 bg-gray-100 rounded">{$players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) < RING_BEARER_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'ringBearer',
													Math.min(
														4,
														($players[$playerModalData.playerId - 1].statusEffects?.ringBearer ?? 0) +
															1
													)
												)}>+</button>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<span class="w-60 text-left"><StartYourEngineSpeed isMax={$players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed === 4} /> {String($_('start_your_engine_speed'))}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0) > 0}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'startYourEngineSpeed',
													Math.max(
														0,
														($players[$playerModalData.playerId - 1].statusEffects
															?.startYourEngineSpeed ?? 0) - 1
													)
												)}>-</button>
									{/if}
									<span class="min-w-[1rem] px-2 py-1 bg-gray-100 rounded">{$players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0}</span>
									{#if ($players[$playerModalData.playerId - 1].statusEffects?.startYourEngineSpeed ?? 0) < SPEED_MAX}
										<button
											class="px-2 py-1 bg-gray-200 rounded"
											on:click={() =>
												setPlayerStatusNumeric(
													$playerModalData.playerId,
													'startYourEngineSpeed',
													Math.min(
														4,
														($players[$playerModalData.playerId - 1].statusEffects
															?.startYourEngineSpeed ?? 0) + 1
													)
												)}>+</button>
									{/if}
								</div>
							</div>

						<!-- Allow negative life toggle placed after color options -->
						<div class="mt-4 w-full flex flex-col items-center text-center">
							<label class="flex items-center gap-2 justify-center"
								><input
									type="checkbox"
									checked={$players[$playerModalData.playerId - 1].allowNegativeLife}
									on:change={() =>
										setPlayerAllowNegative(
											$playerModalData.playerId,
											!$players[$playerModalData.playerId - 1].allowNegativeLife
										)}
								/>
									<span class="ml-1 block text-lg text-center">
										{$_('allow_negative_life')}
									</span>
								</label>
								<div class="mt-2 text-sm text-gray-600 text-center">
									{$_('allow_negative_life_help')}
								</div>
							</div>
						</div>
					{/if}

					{#if mode === 'commander' && $appSettings.playerCount !== 2}
						<!-- Commander Damage Section (now its own tab) -->
						<div class="mt-2 w-full flex flex-col items-center text-center border-t pt-4">
							<div class="text-sm text-gray-600 mb-3">{String($_('commander_damage_help'))}</div>
							<div class="w-full text-left ml-4">{damageFromPlayerLabel}</div>
							<div class="grid grid-cols-1 gap-2 w-full">
								{#each Array($appSettings.playerCount) as _, i}
									{@const fromPlayerId = i + 1}
									{@const dmg =
										($players[$playerModalData.playerId - 1].statusEffects?.commanderDamage ??
											[])[i] ?? 0}
									{@const fromPlayerName = $players[i]?.playerName ?? `Player ${fromPlayerId}`}
									<div class="flex items-center gap-2">
										<span class="beleren w-full text-left ml-4">
											<CommanderDamage playerIndex={fromPlayerId - 1} />
											{fromPlayerName}
										</span>
										{#if dmg > 0}
											<button
												class="px-2 py-1 bg-gray-200 rounded"
												on:click={() =>
													setCommanderDamage($playerModalData.playerId, fromPlayerId, dmg - 1)}>-</button
											>
										{/if}
										{#if editingCommanderFrom === fromPlayerId}
											<div class="pointer-events-auto flex items-center gap-2">
												<input
													id={`commander-input-${fromPlayerId}`}
													type="number"
													bind:value={editingCommanderValue}
													on:keydown={(e) => {
														if (e.key === 'Enter') saveEditCommander();
														if (e.key === 'Escape') cancelEditCommander();
													}}
													class="w-20 text-center rounded-md px-1 py-0.5"
													placeholder={enterLifeTotalPlaceholder}
												/>
												<div class="flex gap-2">
													<button on:click={saveEditCommander} class="px-2 py-1 bg-green-600 text-white text-sm rounded">{setLifeTotalSave}</button>
													<button on:click={cancelEditCommander} class="px-2 py-1 bg-gray-400 text-white text-sm rounded">{setLifeTotalCancel}</button>
												</div>
											</div>
										{:else}
											<span class="px-3 py-1 bg-gray-100 rounded min-w-[3rem] text-center" on:dblclick={() => startEditCommander($playerModalData.playerId, fromPlayerId, dmg)} title={setCommanderDamageString} >{dmg}</span>
										{/if}
										<button
											class="px-2 py-1 bg-gray-200 rounded mr-10"
											on:click={() =>
												setCommanderDamage($playerModalData.playerId, fromPlayerId, dmg + 1)}
											>+</button
										>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
