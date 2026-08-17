<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		syncState,
		initHostSync,
		initGuestSync,
		acceptGuestAnswer,
		disconnectSync
	} from '$lib/store/syncStore';
	import { syncModalOpen, closeSyncModal } from '$lib/store/modal';
	import QRCodeDisplay from './QRCodeDisplay.svelte';
	import QRScanner from './QRScanner.svelte';
	import X from '$lib/assets/icons/X.svelte';

	type Step =
		| 'choose_role'
		| 'host_show_offer'
		| 'host_scan_answer'
		| 'guest_scan_offer'
		| 'guest_show_answer'
		| 'connected'
		| 'error';

	let step: Step = 'choose_role';
	let offerPayload = '';
	let answerPayload = '';
	let errorMessage = '';
	let loading = false;

	$: if ($syncState.status === 'connected' && step !== 'connected') {
		step = 'connected';
	}

	async function startHost() {
		loading = true;
		errorMessage = '';
		try {
			offerPayload = await initHostSync();
			step = 'host_show_offer';
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Failed to create offer';
			step = 'error';
		} finally {
			loading = false;
		}
	}

	function startGuest() {
		step = 'guest_scan_offer';
	}

	async function onOfferScanned(event: CustomEvent<string>) {
		loading = true;
		errorMessage = '';
		try {
			answerPayload = await initGuestSync(event.detail);
			step = 'guest_show_answer';
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Failed to process offer';
			step = 'error';
		} finally {
			loading = false;
		}
	}

	async function onAnswerScanned(event: CustomEvent<string>) {
		loading = true;
		errorMessage = '';
		try {
			await acceptGuestAnswer(event.detail);
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Failed to accept answer';
			step = 'error';
		} finally {
			loading = false;
		}
	}

	function reset() {
		disconnectSync();
		step = 'choose_role';
		offerPayload = '';
		answerPayload = '';
		errorMessage = '';
		loading = false;
	}

	// Closing the modal must keep the peer connection alive: players close it to play.
	function close() {
		if ($syncState.status !== 'connected') reset();
		closeSyncModal();
	}
</script>

{#if $syncModalOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		on:click|self={close}
	>
		<div
			class="relative bg-gray-900 text-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4 shadow-2xl"
		>
			<!-- Close button -->
			<button
				class="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors"
				on:click={close}
				aria-label="Close"
			>
				<X />
			</button>

			<h2 class="text-xl font-bold text-center">🔗 {$_('sync_mode_title') || 'Sync Mode'}</h2>

			{#if step === 'choose_role'}
				<p class="text-center text-white/70 text-sm">
					{$_('sync_mode_description') ||
						'Connect with other players on the same Wi-Fi or hotspot. No internet required.'}
				</p>
				<div class="flex flex-col gap-3">
					<button
						class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
						on:click={startHost}
						disabled={loading}
					>
						{loading
							? $_('sync_mode_preparing') || 'Preparing…'
							: '📡 ' + ($_('sync_mode_host_button') || 'Host — Share my screen first')}
					</button>
					<button
						class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition-colors"
						on:click={startGuest}
					>
						📷 {$_('sync_mode_guest_button') || "Guest — Scan the host's QR code"}
					</button>
				</div>
			{:else if step === 'host_show_offer'}
				<p class="text-center text-white/70 text-sm">
					{$_('sync_mode_step_1_of_2') || 'Step 1/2 — Have the guest scan this QR code.'}
				</p>
				<QRCodeDisplay data={offerPayload} size={256} />
				<button
					class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
					on:click={() => (step = 'host_scan_answer')}
				>
					{$_('sync_mode_host_continue') || 'Guest has scanned → Continue'}
				</button>
				<button class="text-white/50 text-sm underline text-center" on:click={reset}
					>{$_('sync_mode_cancel') || 'Cancel'}</button
				>
			{:else if step === 'host_scan_answer'}
				<p class="text-center text-white/70 text-sm">
					{$_('sync_mode_step_2_of_2') || "Step 2/2 — Scan the guest's answer QR code."}
				</p>
				<QRScanner
					on:scan={onAnswerScanned}
					on:error={(e) => {
						errorMessage = e.detail;
						step = 'error';
					}}
				/>
				{#if loading}
					<p class="text-center text-white/60 text-sm">
						{$_('sync_mode_connecting') || 'Connecting…'}
					</p>
				{/if}
				<button class="text-white/50 text-sm underline text-center" on:click={reset}
					>{$_('sync_mode_cancel') || 'Cancel'}</button
				>
			{:else if step === 'guest_scan_offer'}
				<p class="text-center text-white/70 text-sm">
					{$_('sync_mode_guest_scan_offer') || "Scan the host's QR code."}
				</p>
				<QRScanner
					on:scan={onOfferScanned}
					on:error={(e) => {
						errorMessage = e.detail;
						step = 'error';
					}}
				/>
				{#if loading}
					<p class="text-center text-white/60 text-sm">
						{$_('sync_mode_processing') || 'Processing…'}
					</p>
				{/if}
				<button class="text-white/50 text-sm underline text-center" on:click={reset}
					>{$_('sync_mode_cancel') || 'Cancel'}</button
				>
			{:else if step === 'guest_show_answer'}
				<p class="text-center text-white/70 text-sm">
					{$_('sync_mode_guest_show_answer') || 'Show this QR code to the host to scan.'}
				</p>
				<QRCodeDisplay data={answerPayload} size={256} />
				<p class="text-center text-white/50 text-sm">
					{$_('sync_mode_waiting_for_host') || 'Waiting for host to scan…'}
				</p>
				<button class="text-white/50 text-sm underline text-center" on:click={reset}
					>{$_('sync_mode_cancel') || 'Cancel'}</button
				>
			{:else if step === 'connected'}
				<div class="flex flex-col items-center gap-3">
					<div class="text-5xl">✅</div>
					<p class="text-green-400 font-semibold text-lg text-center">
						{$_('sync_mode_connected') || 'Connected!'}
					</p>
					<p class="text-white/60 text-sm text-center">
						{$_('sync_mode_connected_desc') || 'Game state is now synchronized in real-time.'}
					</p>
					<button
						class="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 font-semibold transition-colors"
						on:click={reset}
					>
						{$_('sync_mode_disconnect') || 'Disconnect'}
					</button>
					<button
						class="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
						on:click={close}
					>
						{$_('close') || 'Close'}
					</button>
				</div>
			{:else if step === 'error'}
				<div class="flex flex-col items-center gap-3">
					<div class="text-5xl">❌</div>
					<p class="text-red-400 font-semibold text-center">
						{errorMessage || $_('sync_mode_error') || 'An error occurred'}
					</p>
					<button
						class="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
						on:click={reset}
					>
						{$_('sync_mode_try_again') || 'Try Again'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
