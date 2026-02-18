<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import {
		assignRandomVanguardsForGame,
		players,
		setPlayerVanguard,
		setPlayerVanguardChoices
	} from '$lib/store/player';
	import { appSettings } from '$lib/store/appSettings';
	import { openSelectedEmblem } from '$lib/store/emblem';
	import { searchVanguardCards, type ScryfallEmblemCard } from '$lib/utils/scryfall';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';
	import { onMount } from 'svelte';

	let vanguardQuery = '';
	let vanguardResults: ScryfallEmblemCard[] = [];
	let isSearching = false;
	let hasSearched = false;
	let selectedPlayerId = 1;
	let isAssigning = false;
	let hasInitialized = false;

	$: innerHeight = 0;
	$: activePlayers = $players.slice(0, $appSettings.playerCount);
	$: if (!activePlayers.some((p) => p.id === selectedPlayerId) && activePlayers.length > 0) {
		selectedPlayerId = activePlayers[0].id;
	}

	onMount(async () => {
		if (hasInitialized) return;
		hasInitialized = true;

		const hasAnyAssigned = activePlayers.some(
			(player) => !!player.vanguard || (player.vanguardChoices?.length ?? 0) > 0
		);
		if ($appSettings.vanguardModeEnabled && !hasAnyAssigned) {
			isAssigning = true;
			try {
				await assignRandomVanguardsForGame();
			} finally {
				isAssigning = false;
			}
		}
	});

	const openVanguard = (vanguard: ScryfallEmblemCard | null | undefined) => {
		if (!vanguard) return;
		openSelectedEmblem(vanguard);
		toggleIsMenuOpen('');
	};

	const runVanguardSearch = async () => {
		vibrate(20);
		hasSearched = true;
		isSearching = true;
		try {
			vanguardResults = await searchVanguardCards(vanguardQuery, 72);
		} finally {
			isSearching = false;
		}
	};

	const handleSearchKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			runVanguardSearch();
		}
	};

	const assignSearchedCard = (card: ScryfallEmblemCard) => {
		setPlayerVanguard(selectedPlayerId, card);
		setPlayerVanguardChoices(selectedPlayerId, [card]);
	};

	const rerollAll = async () => {
		vibrate(30);
		isAssigning = true;
		try {
			await assignRandomVanguardsForGame();
		} finally {
			isAssigning = false;
		}
	};

	const chooseFromChoices = (playerId: number, choice: ScryfallEmblemCard) => {
		setPlayerVanguard(playerId, choice);
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-auto h-full"
	style="max-height: {innerHeight - 50}px; -webkit-overflow-scrolling: touch;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-2 py-2 sticky top-[-1px] bg-black"
		>
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('vanguard_menu')}</span>
			<span class="text-gray-400 text-center text-base mt-2 w-90">{$_('vanguard_explanation')}</span>
			<a
				class="text-blue-400 underline text-sm mt-2"
				href="https://mtg.wiki/page/Vanguard"
				target="_blank"
				rel="noreferrer"
			>
				{$_('vanguard_wiki_link')}
			</a>
		</div>

		<div class="w-full px-4 mt-1 mb-1">
			<div class="max-w-4xl mx-auto space-y-4">
				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
						<div>
							<div class="text-white text-lg font-semibold">{$_('vanguard_mode_settings_title')}</div>
							<div class="text-gray-300 text-sm">{$_('vanguard_mode_status')}: {$appSettings.vanguardModeEnabled ? $_('history_state_on') : $_('history_state_off')}</div>
							<div class="text-gray-400 text-xs mt-1">{$_('vanguard_random_rule')}</div>
						</div>
						<button
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50"
							on:click={rerollAll}
							disabled={isAssigning || !$appSettings.vanguardModeEnabled}
						>
							{isAssigning ? $_('scryfall_searching') : $_('vanguard_reroll_all')}
						</button>
					</div>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="text-white text-base font-semibold mb-3">{$_('vanguard_players_title')}</div>
					<div class="space-y-3">
						{#each activePlayers as player}
							<div class="bg-black/30 rounded-xl p-3">
								<div class="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
									<div class="text-white text-sm font-semibold truncate">
										{player.playerName}
									</div>
									{#if player.vanguard}
										<button
											class="bg-purple-700 hover:bg-purple-800 rounded-lg px-3 py-1 text-white text-xs"
											on:click={() => openVanguard(player.vanguard)}
										>
											{player.vanguard.name}
										</button>
									{:else}
										<span class="text-gray-400 text-xs">{$_('vanguard_none_assigned')}</span>
									{/if}
								</div>

								{#if (player.vanguardChoices?.length ?? 0) > 1}
									<div class="mt-2 flex flex-wrap gap-2">
										{#each player.vanguardChoices ?? [] as choice}
											<button
												class="rounded-full px-3 py-1 text-xs border"
												class:border-yellow-400={player.vanguard?.id === choice.id}
												class:text-yellow-200={player.vanguard?.id === choice.id}
												class:border-gray-500={player.vanguard?.id !== choice.id}
												class:text-white={player.vanguard?.id !== choice.id}
												on:click={() => chooseFromChoices(player.id, choice)}
												title={$_('scryfall_search_choose')}
											>
												{choice.name}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="text-white text-base font-semibold mb-2">{$_('vanguard_search_title')}</div>
					<div class="flex flex-col md:flex-row gap-2 mb-2">
						<select
							bind:value={selectedPlayerId}
							class="bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none md:w-60"
						>
							{#each activePlayers as player}
								<option value={player.id}>{$_('vanguard_assign_to')} {player.playerName}</option>
							{/each}
						</select>
						<input
							bind:value={vanguardQuery}
							type="text"
							autocomplete="off"
							class="flex-1 bg-black rounded-xl h-[42px] px-3 text-white text-base outline-none"
							placeholder={$_('vanguard_search_placeholder')}
							on:keypress={handleSearchKeyPress}
						/>
						<button
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50"
							on:click={runVanguardSearch}
							disabled={isSearching}
						>
							{isSearching ? $_('scryfall_searching') : $_('vanguard_search_button')}
						</button>
					</div>

					{#if hasSearched && vanguardResults.length === 0 && !isSearching}
						<div class="text-gray-300 text-sm">{$_('vanguard_search_noresult')}</div>
					{/if}

					{#if vanguardResults.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
							{#each vanguardResults as vanguard}
								<div class="bg-black/40 rounded-xl p-3 text-left text-white flex items-center gap-3">
									{#if vanguard.faces[0]?.image}
										<img
											src={vanguard.faces[0].image}
											alt={vanguard.name}
											class="w-16 h-24 object-cover rounded"
										/>
									{/if}
									<div class="min-w-0 flex-1">
										<div class="text-sm font-semibold truncate">{vanguard.name}</div>
										{#if vanguard.set_name}
											<div class="text-xs text-gray-300 truncate">{vanguard.set_name}</div>
										{/if}
										<div class="flex gap-2 mt-2">
											<button
												class="bg-blue-700 hover:bg-blue-800 rounded-lg px-2 py-1 text-xs"
												on:click={() => assignSearchedCard(vanguard)}
											>
												{$_('scryfall_search_choose')}
											</button>
											<button
												class="bg-purple-700 hover:bg-purple-800 rounded-lg px-2 py-1 text-xs"
												on:click={() => openVanguard(vanguard)}
											>
												{$_('vanguard_preview')}
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
