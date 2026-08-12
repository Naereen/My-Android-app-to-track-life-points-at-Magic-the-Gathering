<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { _ } from 'svelte-i18n';
	import { vibrate } from '$lib/utils/haptics';

	// Scryfall search URL for all 12 bounty cards
	const BOUNTY_SCRYFALL_URL =
		'https://api.scryfall.com/cards/search?q=set%3ATOTC+%22Bounty%22&unique=cards&order=random';

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
	let showImageZoomModal = false;
	let zoomedImageSrc = '';
	let zoomedImageAlt = '';
	let bountyBackImage = '';
	let errorMsg = '';

	$: currentCard = cards[currentCardIndex] ?? null;

	$: REWARDS[1] = $_('bounty_reward_1');
	$: REWARDS[2] = $_('bounty_reward_2');
	$: REWARDS[3] = $_('bounty_reward_3');
	$: REWARDS[4] = $_('bounty_reward_4');

	const trimWantedSuffix = (name: string) => name.replace(/\s\/\/ Wanted!$/, '');

	const openImageZoomModal = (src: string, alt: string) => {
		if (!src) return;
		zoomedImageSrc = src;
		zoomedImageAlt = alt;
		showImageZoomModal = true;
		vibrate(10);
	};

	const closeImageZoomModal = () => {
		showImageZoomModal = false;
		zoomedImageSrc = '';
		zoomedImageAlt = '';
	};

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
				card_faces?: Array<{
					oracle_text: string;
					image_uris?: { normal: string };
				}>;
			}> = json.data ?? [];
			cards = raw.map((c) => ({
				name: trimWantedSuffix(c.name),
				oracleText: c.oracle_text ?? c.card_faces?.[0]?.oracle_text ?? '',
				imageUri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? ''
			}));
			bountyBackImage =
				raw.find((c) => !!c.card_faces?.[1]?.image_uris?.normal)?.card_faces?.[1]?.image_uris
					?.normal ?? '';
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
	style="-webkit-overflow-scrolling: touch;"
>
	<div class="flex flex-col">
		<!-- Header -->
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-1 py-1 sticky top-[-1px] bg-black"
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
		</div>

		<div class="w-full px-4 mt-1 mb-3">
			<div class="max-w-4xl mx-auto space-y-3">
				<!-- Load / Start -->
				{#if cards.length === 0 && !loading}
					<div class="bg-[#2d2f30] rounded-2xl p-3 text-center">
						<p class="text-gray-300 text-sm mb-3">{$_('bounty_start_hint')}</p>
						<button
							class="bg-amber-700 hover:bg-amber-800 rounded-xl px-5 py-2 text-white text-sm"
							on:click={loadCards}
						>
							{$_('bounty_load_cards')}
						</button>
						{#if errorMsg}
							<p class="text-red-400 text-sm mt-3">{errorMsg}</p>
						{/if}
					</div>
				{:else if loading}
					<div class="bg-[#2d2f30] rounded-2xl p-3 text-center text-gray-300">
						{$_('scryfall_searching')}…
					</div>
				{:else}
					<!-- Current bounty card -->
					<div class="bg-[#2d2f30] rounded-2xl p-3">
						<div class="text-white text-base font-semibold mb-2 text-center">
							{$_('bounty_current_card')} ({currentCardIndex + 1}/{cards.length})
						</div>

						{#if showBack}
							<!-- Card back (face-down) -->
							<div class="flex flex-col items-center gap-2">
								{#if bountyBackImage}
									<button
										type="button"
										class="rounded-xl cursor-zoom-in"
										on:click={() => openImageZoomModal(bountyBackImage, 'Bounty card back')}
									>
										<img
											src={bountyBackImage}
											alt="Bounty card back"
											class="rounded-xl w-full max-w-[17rem] max-h-[23rem] object-contain bg-black/40"
										/>
									</button>
								{/if}
								<button
									class="bg-amber-600 hover:bg-amber-700 rounded-xl px-5 py-2 text-white text-sm mt-1"
									on:click={revealCard}
								>
									{$_('bounty_reveal')}
								</button>
							</div>
						{:else if currentCard}
							<!-- Card face-up -->
							<div class="flex flex-col items-center gap-2">
								{#if currentCard.imageUri}
									<button
										type="button"
										class="rounded-xl cursor-zoom-in"
										on:click={() => openImageZoomModal(currentCard.imageUri, currentCard.name)}
									>
										<img
											src={currentCard.imageUri}
											alt={currentCard.name}
											class="rounded-xl w-full max-w-[17rem] max-h-[23rem] object-contain bg-black/40"
										/>
									</button>
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
					<div class="bg-[#2d2f30] rounded-2xl p-3">
						<div class="text-white text-base font-semibold mb-3 text-center">
							{$_('bounty_reward_level')}
						</div>
						<div class="flex justify-center items-center gap-2 mb-3">
							<button
								class="bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 text-lg text-white disabled:opacity-40"
								on:click={decrementReward}
								disabled={rewardLevel <= 1}>−</button
							>
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
							<button
								class="bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 text-lg text-white disabled:opacity-40"
								on:click={incrementReward}
								disabled={rewardLevel >= 4}>+</button
							>
						</div>
						<div class="text-amber-300 text-sm text-center font-semibold">
							{REWARDS[rewardLevel]}
						</div>
					</div>

					<!-- Action buttons: Claim / Pass / Flip back -->
					<div class="bg-[#2d2f30] rounded-2xl p-3">
						<div class="text-white text-base font-semibold mb-3 text-center">
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

				<div class="bg-[#2d2f30] rounded-2xl p-3">
					<p class="text-gray-400 text-sm">{$_('bounty_explanation')}</p>
					<a
						class="inline-block text-blue-400 underline text-sm mt-2"
						href="https://mtg.wiki/page/Outlaws_of_Thunder_Junction/Commander_decks#Bounty_cards"
						target="_blank"
						rel="noreferrer"
					>
						{$_('bounty_wiki_link')}
					</a>
				</div>

				<!-- Rules / Info section -->
				<div class="bg-[#2d2f30] rounded-2xl p-3">
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
							{#if bountyBackImage}
								<button
									class="text-amber-400 underline text-xs mt-2"
									on:click={() => {
										openImageZoomModal(bountyBackImage, 'Bounty card back');
									}}
								>
									{$_('bounty_show_back_image')}
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Image zoom modal -->
{#if showImageZoomModal}
	<div class="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4">
		<button
			type="button"
			aria-label={$_('treachery_hide')}
			class="absolute inset-0"
			on:click={closeImageZoomModal}
		></button>
		<div class="relative z-10 flex flex-col items-center gap-4">
			<img
				src={zoomedImageSrc}
				alt={zoomedImageAlt}
				class="rounded-xl max-h-[78vh] max-w-[94vw] object-contain"
			/>
			<button
				class="bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-white text-sm"
				on:click={closeImageZoomModal}
			>
				{$_('treachery_hide')}
			</button>
		</div>
	</div>
{/if}
