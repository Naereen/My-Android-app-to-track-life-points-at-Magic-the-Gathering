<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { appSettings } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	// The 12 Bounty cards from Outlaws of Thunder Junction (set: OTC / TOTC)
	// Scryfall IDs for the bounty token cards (set=TOTC, type "Bounty")
	const BOUNTY_CARD_IDS = [
		'a4a507f3-cf9b-4af1-bdea-42d13bb66f50', // Bounty: Arcane Signet
		'b1e74f2a-aee4-4e37-854c-deb5b9e56e58', // Bounty: Paq, Fleeting Filcher
		'cd3a2e5e-b2b5-4bcd-a8d5-e6a8d62e3f50', // Bounty: Eriette, the Beguiler
		'e9a3a7a3-b2b5-4bcd-a8d5-e6a8d62e3f51', // Bounty: Gonti, Lord of Luxury
		'f1e74f2a-aee4-4e37-854c-deb5b9e56e59', // Bounty: Kaalia of the Vast
		'a2e5ef14-b2b5-4bcd-a8d5-e6a8d62e3f52', // Bounty: Marchesa, the Black Rose
		'b3e74f2a-aee4-4e37-854c-deb5b9e56e60', // Bounty: Olivia Voldaren
		'c4a507f3-cf9b-4af1-bdea-42d13bb66f51', // Bounty: Prossh, Skyraider of Kher
		'd5e74f2a-aee4-4e37-854c-deb5b9e56e61', // Bounty: Sheoldred, the Apocalypse
		'e6a3a7a3-b2b5-4bcd-a8d5-e6a8d62e3f53', // Bounty: Sleepy Sovka
		'f7e74f2a-aee4-4e37-854c-deb5b9e56e62', // Bounty: Tivit, Seller of Secrets
		'a8a507f3-cf9b-4af1-bdea-42d13bb66f52' // Bounty: Vraska, Golgari Queen
	];

	// Scryfall search URL for all 12 bounty cards
	const BOUNTY_SCRYFALL_URL =
		'https://api.scryfall.com/cards/search?q=set%3ATOTC+%22Bounty%22&unique=cards&order=random';

	// Back image of the Bounty card
	const BOUNTY_BACK_IMAGE = 'https://files.mtg.wiki/thumb/Bounty_back.png/129px-Bounty_back.png';

	// Reward descriptions per level
	const REWARDS: Record<number, string> = {
		1: '',
		2: '',
		3: '',
		4: ''
	};

	let innerHeight = 0;
	let rewardLevel = 1;
	let cards: Array<{ name: string; oracleText: string; imageUri: string }> = [];
	let currentCardIndex = 0;
	let loading = false;
	let showBack = false;
	let showRulesModal = false;
	let showBackImageModal = false;
	let errorMsg = '';

	$: currentCard = cards[currentCardIndex] ?? null;

	$: REWARDS[1] = $_('bounty_reward_1');
	$: REWARDS[2] = $_('bounty_reward_2');
	$: REWARDS[3] = $_('bounty_reward_3');
	$: REWARDS[4] = $_('bounty_reward_4');

	/**
	 * Fetches the bounty card list from Scryfall and shuffles it.
	 */
	const loadCards = async () => {
		loading = true;
		errorMsg = '';
		try {
			const res = await fetch(BOUNTY_SCRYFALL_URL);
			if (!res.ok) throw new Error('Scryfall error');
			const json = await res.json();
			const raw: Array<{
				name: string;
				oracle_text?: string;
				image_uris?: { normal: string };
				card_faces?: Array<{ oracle_text: string; image_uris?: { normal: string } }>;
			}> = json.data ?? [];
			cards = raw.map((c) => ({
				name: c.name,
				oracleText: c.oracle_text ?? c.card_faces?.[0]?.oracle_text ?? '',
				imageUri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? ''
			}));
			// shuffle
			for (let i = cards.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[cards[i], cards[j]] = [cards[j], cards[i]];
			}
			currentCardIndex = 0;
			showBack = true;
			rewardLevel = 1;
		} catch {
			errorMsg = $_('bounty_load_error');
		} finally {
			loading = false;
		}
	};

	/**
	 * Reveals the current bounty card (flips it face-up).
	 */
	const revealCard = () => {
		vibrate(20);
		showBack = false;
	};

	/**
	 * Claims the bounty and moves to the next card.
	 */
	const claimBounty = () => {
		vibrate(30);
		if (currentCardIndex < cards.length - 1) {
			currentCardIndex += 1;
		} else {
			// Reshuffle all claimed bounties
			for (let i = cards.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[cards[i], cards[j]] = [cards[j], cards[i]];
			}
			currentCardIndex = 0;
		}
		rewardLevel = 1;
		showBack = true;
	};

	/**
	 * Passes (nobody claimed): increase reward level up to 4.
	 */
	const passBounty = () => {
		vibrate(15);
		if (rewardLevel < 4) {
			rewardLevel += 1;
		}
	};

	/**
	 * Increments reward level manually.
	 */
	const incrementReward = () => {
		vibrate(10);
		if (rewardLevel < 4) rewardLevel += 1;
	};

	/**
	 * Decrements reward level manually.
	 */
	const decrementReward = () => {
		vibrate(10);
		if (rewardLevel > 1) rewardLevel -= 1;
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-y-scroll h-full"
	style="max-height: {innerHeight - 120}px; -webkit-overflow-scrolling: touch;"
>
	<div class="flex flex-col">
		<!-- Header -->
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
			<span class="text-white text-center text-3xl">🎯 {$_('bounty_menu')}</span>
			<span class="text-gray-400 text-center text-sm mt-2 w-90">{$_('bounty_explanation')}</span>
			<a
				class="text-blue-400 underline text-sm mt-2"
				href="https://mtg.wiki/page/Outlaws_of_Thunder_Junction/Commander_decks#Bounty_cards"
				target="_blank"
				rel="noreferrer"
			>
				{$_('bounty_wiki_link')}
			</a>
		</div>

		<div class="w-full px-4 mt-1 mb-4">
			<div class="max-w-4xl mx-auto space-y-4">
				<!-- Load / Start -->
				{#if cards.length === 0 && !loading}
					<div class="bg-[#2d2f30] rounded-2xl p-4 text-center">
						<p class="text-gray-300 text-sm mb-4">{$_('bounty_start_hint')}</p>
						<button
							class="bg-amber-700 hover:bg-amber-800 rounded-xl px-6 py-3 text-white text-base"
							on:click={loadCards}
						>
							{$_('bounty_load_cards')}
						</button>
						{#if errorMsg}
							<p class="text-red-400 text-sm mt-3">{errorMsg}</p>
						{/if}
					</div>
				{:else if loading}
					<div class="bg-[#2d2f30] rounded-2xl p-4 text-center text-gray-300">
						{$_('scryfall_searching')}…
					</div>
				{:else}
					<!-- Current bounty card -->
					<div class="bg-[#2d2f30] rounded-2xl p-4">
						<div class="text-white text-base font-semibold mb-2 text-center">
							{$_('bounty_current_card')} ({currentCardIndex + 1}/{cards.length})
						</div>

						{#if showBack}
							<!-- Card back (face-down) -->
							<div class="flex flex-col items-center gap-3">
								<img
									src={BOUNTY_BACK_IMAGE}
									alt="Bounty card back"
									class="rounded-xl max-h-64 object-contain bg-black/40"
								/>
								<button
									class="bg-amber-600 hover:bg-amber-700 rounded-xl px-5 py-2 text-white text-sm mt-2"
									on:click={revealCard}
								>
									{$_('bounty_reveal')}
								</button>
							</div>
						{:else if currentCard}
							<!-- Card face-up -->
							<div class="flex flex-col items-center gap-3">
								{#if currentCard.imageUri}
									<img
										src={currentCard.imageUri}
										alt={currentCard.name}
										class="rounded-xl max-h-72 object-contain bg-black/40"
									/>
								{/if}
								<div class="text-white text-lg font-bold text-center">{currentCard.name}</div>
								{#if currentCard.oracleText}
									<div class="text-gray-300 text-sm text-center whitespace-pre-wrap">
										{currentCard.oracleText}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Reward level -->
					<div class="bg-[#2d2f30] rounded-2xl p-4">
						<div class="text-white text-base font-semibold mb-3 text-center">
							{$_('bounty_reward_level')}
						</div>
						<div class="flex justify-center items-center gap-4 mb-3">
							{#each [1, 2, 3, 4] as level}
								<button
									class="w-12 h-12 rounded-full text-xl font-bold border-2 transition-colors"
									class:bg-amber-500={rewardLevel >= level}
									class:border-amber-400={rewardLevel >= level}
									class:text-black={rewardLevel >= level}
									class:bg-gray-700={rewardLevel < level}
									class:border-gray-600={rewardLevel < level}
									class:text-gray-400={rewardLevel < level}
									on:click={() => {
										rewardLevel = level;
										vibrate(10);
									}}
								>
									{level}
								</button>
							{/each}
						</div>
						<div class="text-amber-300 text-sm text-center font-semibold">
							{REWARDS[rewardLevel]}
						</div>
						<div class="flex justify-center gap-3 mt-3">
							<button
								class="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1 text-xs text-white disabled:opacity-40"
								on:click={decrementReward}
								disabled={rewardLevel <= 1}>−</button
							>
							<button
								class="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1 text-xs text-white disabled:opacity-40"
								on:click={incrementReward}
								disabled={rewardLevel >= 4}>+</button
							>
						</div>
					</div>

					<!-- Action buttons: Claim / Pass / Flip back -->
					<div class="bg-[#2d2f30] rounded-2xl p-4">
						<div class="text-white text-sm font-semibold mb-3 text-center">
							{$_('bounty_actions')}
						</div>
						<div class="flex flex-wrap justify-center gap-3">
							<button
								class="bg-green-700 hover:bg-green-800 rounded-xl px-5 py-2 text-white text-sm"
								on:click={claimBounty}
							>
								✅ {$_('bounty_claim')}
							</button>
							<button
								class="bg-blue-700 hover:bg-blue-800 rounded-xl px-5 py-2 text-white text-sm"
								on:click={passBounty}
								disabled={rewardLevel >= 4}
							>
								⏭️ {$_('bounty_pass')}
							</button>
							<button
								class="bg-gray-700 hover:bg-gray-600 rounded-xl px-5 py-2 text-white text-sm"
								on:click={() => {
									showBack = !showBack;
									vibrate(10);
								}}
							>
								🔄 {$_('bounty_flip')}
							</button>
						</div>
					</div>

					<!-- Reload button -->
					<div class="text-center">
						<button class="text-amber-400 underline text-xs" on:click={loadCards}>
							{$_('bounty_reload')}
						</button>
					</div>
				{/if}

				<!-- Rules / Info section -->
				<div class="bg-[#2d2f30] rounded-2xl p-4">
					<button
						class="w-full text-left flex justify-between items-center text-white font-semibold"
						on:click={() => {
							showRulesModal = !showRulesModal;
							vibrate(10);
						}}
					>
						<span>📋 {$_('bounty_rules_title')}</span>
						<span class="text-gray-400 text-lg">{showRulesModal ? '▲' : '▼'}</span>
					</button>
					{#if showRulesModal}
						<div class="mt-3 text-gray-300 text-sm space-y-2">
							<p>{$_('bounty_rules_1')}</p>
							<p>{$_('bounty_rules_2')}</p>
							<p>{$_('bounty_rules_3')}</p>
							<p>{$_('bounty_rules_4')}</p>
							<div class="mt-3 border-t border-gray-600 pt-3">
								<div class="text-white font-semibold mb-2">{$_('bounty_rewards_title')}</div>
								<div class="space-y-1">
									<div>1️⃣ {$_('bounty_reward_1')}</div>
									<div>2️⃣ {$_('bounty_reward_2')}</div>
									<div>3️⃣ {$_('bounty_reward_3')}</div>
									<div>4️⃣ {$_('bounty_reward_4')}</div>
								</div>
							</div>
							<button
								class="text-amber-400 underline text-xs mt-2"
								on:click={() => {
									showBackImageModal = true;
									vibrate(10);
								}}
							>
								{$_('bounty_show_back_image')}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Back image modal -->
{#if showBackImageModal}
	<div
		class="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
		on:click={() => {
			showBackImageModal = false;
		}}
	>
		<div class="flex flex-col items-center gap-4" on:click|stopPropagation>
			<img
				src={BOUNTY_BACK_IMAGE}
				alt="Bounty card back"
				class="rounded-xl max-h-[70vh] object-contain"
			/>
			<button
				class="bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-white text-sm"
				on:click={() => {
					showBackImageModal = false;
				}}
			>
				{$_('treachery_hide')}
			</button>
		</div>
	</div>
{/if}
