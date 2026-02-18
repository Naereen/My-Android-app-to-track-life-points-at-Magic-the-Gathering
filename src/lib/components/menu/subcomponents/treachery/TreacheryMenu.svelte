<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import {
		assignRandomTreacheryForGame,
		players,
		setPlayerTreacherySeen
	} from '$lib/store/player';
	import { appSettings } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';
	import { onMount } from 'svelte';
	import { getTreacheryImageCandidates } from '$lib/utils/treachery';

	let isAssigning = false;
	let hasInitialized = false;
	let revealedPlayerId: number | null = null;
	let innerHeight = 0;
	let revealImageCandidates: string[] = [];
	let revealImageIndex = 0;

	$: activePlayers = $players.slice(0, $appSettings.playerCount);
	$: isShogunVariant = !!$appSettings.shogunVariantEnabled;
	$: treacheryOfficialUrl = $appSettings.locale === 'fr'
		? 'https://mtgtreachery.net/fr/'
		: 'https://mtgtreachery.net/en/';
	$: modeSettingsTitle = isShogunVariant ? $_('shogun_mode_settings_title') : $_('treachery_mode_settings_title');
	$: modeExplanation = isShogunVariant ? $_('shogun_explanation') : $_('treachery_explanation');
	$: modeRerollLabel = isShogunVariant ? $_('shogun_reroll_all') : $_('treachery_reroll_all');
	$: modePlayersTitle = isShogunVariant ? $_('shogun_players_title') : $_('treachery_players_title');
	$: allAssignedPlayersSeenOnce =
		activePlayers.length > 0 &&
		activePlayers.every((player) => !!player.treacheryRole && !!player.treacherySeen);
	$: revealedPlayer =
		revealedPlayerId === null
			? null
			: activePlayers.find((player) => player.id === revealedPlayerId) ?? null;

	const roleDisplay = (role: string | null | undefined) => {
		if (!role) return '-';
		if (isShogunVariant && role === 'leader') return 'Shogun';
		return role.charAt(0).toUpperCase() + role.slice(1);
	};

	const canRevealPlayer = (player: App.Player.Data) => {
		if (!player.treacheryRole) return false;
		if (!player.treacherySeen) return true;
		return allAssignedPlayersSeenOnce;
	};

	onMount(async () => {
		if (hasInitialized) return;
		hasInitialized = true;

		const hasAnyAssigned = activePlayers.some((player) => !!player.treacheryRole);
		if ($appSettings.treacheryModeEnabled && !hasAnyAssigned) {
			isAssigning = true;
			try {
				await assignRandomTreacheryForGame();
			} finally {
				isAssigning = false;
			}
		}
	});

	const rerollAll = async () => {
		vibrate(30);
		isAssigning = true;
		try {
			await assignRandomTreacheryForGame();
			revealedPlayerId = null;
		} finally {
			isAssigning = false;
		}
	};

	const revealForPlayer = (playerId: number) => {
		const target = activePlayers.find((player) => player.id === playerId);
		if (!target?.treacheryRole) return;
		if (target.treacherySeen && !allAssignedPlayersSeenOnce) return;

		revealImageCandidates = target.treacheryCard
			? getTreacheryImageCandidates(
				target.treacheryCard.cardId,
				target.treacheryCard.role,
				target.treacheryCard.name,
				target.treacheryCard.slug
			)
			: [];
		revealImageIndex = 0;

		vibrate(20);
		revealedPlayerId = playerId;
	};

	const handleRevealImageError = () => {
		if (revealImageIndex < revealImageCandidates.length - 1) {
			revealImageIndex += 1;
		}
	};

	const closeReveal = () => {
		if (revealedPlayerId !== null) {
			setPlayerTreacherySeen(revealedPlayerId, true);
		}
		revealedPlayerId = null;
		revealImageCandidates = [];
		revealImageIndex = 0;
		vibrate(12);
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-scroll h-full"
	style="max-height: {innerHeight - 120}px; -webkit-overflow-scrolling: touch;"
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
			<span class="text-white text-center text-3xl">{$_('treachery_menu')}</span>
			<span class="text-gray-400 text-center text-base mt-2 w-90">{modeExplanation}</span>
			{#if !isShogunVariant}
				<a
					class="text-blue-400 underline text-sm mt-2"
					href={treacheryOfficialUrl}
					target="_blank"
					rel="noreferrer"
				>
					{$_('treachery_official_link')}
				</a>
            {:else}
				<a
					class="text-blue-400 underline text-sm mt-2"
					href="https://github.com/Naereen/Mes-regles-de-variantes-fun-et-amusantes-Magic-the-Gathering-en-LaTeX/tree/main/cartes-pour-le-shogun"
					target="_blank"
					rel="noreferrer"
				>
					{$_('shogun_nonofficial_link')}
				</a>
			{/if}
		</div>

		<div class="w-full px-4 mt-1 mb-1">
			<div class="max-w-4xl mx-auto space-y-4">
				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
						<div>
							<div class="text-white text-lg font-semibold">{modeSettingsTitle}</div>
							<div class="text-gray-300 text-sm">
								{$_('treachery_mode_status')}: {$appSettings.treacheryModeEnabled ? $_('history_state_on') : $_('history_state_off')}
							</div>
							<div class="text-gray-400 text-xs mt-1">{$_('treachery_random_rule')}</div>
						</div>
						<button
							class="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 py-2 text-white text-sm disabled:opacity-50"
							on:click={rerollAll}
							disabled={isAssigning || !$appSettings.treacheryModeEnabled}
						>
							{isAssigning ? $_('scryfall_searching') : modeRerollLabel}
						</button>
					</div>
				</div>

				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<div class="text-white text-base font-semibold mb-3">{modePlayersTitle}</div>
					<div class="space-y-3">
						{#each activePlayers as player}
							<div class="bg-black/30 rounded-xl p-3">
								<div class="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
									<div>
										<div class="text-white text-sm font-semibold truncate">{player.playerName}</div>
										<div class="text-gray-400 text-xs">
											{#if player.treacheryRole}
												{player.treacherySeen ? $_('treachery_seen_once') : $_('treachery_hidden_assigned')}
											{:else}
												{$_('treachery_none_assigned')}
											{/if}
										</div>
									</div>
									<button
										class="rounded-lg px-3 py-1 text-xs text-white disabled:opacity-50"
										class:bg-purple-700={canRevealPlayer(player)}
										class:hover:bg-purple-800={canRevealPlayer(player)}
										class:bg-gray-700={!canRevealPlayer(player)}
										on:click={() => revealForPlayer(player.id)}
										disabled={!canRevealPlayer(player)}
									>
										{#if !player.treacherySeen}
											{$_('treachery_reveal_once')}
										{:else if allAssignedPlayersSeenOnce}
											{$_('treachery_reveal_again') || 'Reveal again'}
										{:else}
											{$_('treachery_checked')}
										{/if}
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if revealedPlayer}
	<div class="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" on:click={closeReveal}>
		<div class="bg-[#1f2123] w-full max-w-xl rounded-2xl p-4 text-white" on:click|stopPropagation>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="text-xs uppercase tracking-wide text-gray-400">{$_('treachery_secret_role')}</div>
					<div class="text-lg font-semibold">{revealedPlayer.playerName}</div>
				</div>
				<button
					class="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1 text-xs"
					on:click={closeReveal}
				>
					{$_('treachery_hide')}
				</button>
			</div>

			<div class="mt-3 rounded-xl bg-black/40 p-3">
				{#if !isShogunVariant && revealImageCandidates.length > 0}
					<img
						src={revealImageCandidates[revealImageIndex]}
						alt={revealedPlayer.treacheryCard?.name ?? 'Treachery card'}
						class="w-full max-h-[360px] object-contain rounded-lg bg-black/40"
						on:error={handleRevealImageError}
					/>
				{/if}
				<div class="text-sm text-gray-300">{$_('treachery_role')}</div>
				<div class="text-xl font-bold capitalize">{roleDisplay(revealedPlayer.treacheryRole)}</div>
				{#if !isShogunVariant}
					<div class="text-base mt-2 font-semibold">{revealedPlayer.treacheryCard?.name ?? '-'}</div>
					<div class="text-xs text-gray-400 mt-1">{revealedPlayer.treacheryCard?.faces?.[0]?.typeLine ?? ''}</div>
					{#if revealedPlayer.treacheryCard?.faces?.[0]?.oracleText}
						<pre class="mt-3 whitespace-pre-wrap break-words text-sm leading-5 font-sans">{revealedPlayer.treacheryCard.faces[0].oracleText}</pre>
					{/if}
				{/if}
			</div>
			<div class="text-xs text-gray-400 mb-3 mt-3">{$_('treachery_hide_after_reading')}</div>
		</div>
	</div>
{/if}
