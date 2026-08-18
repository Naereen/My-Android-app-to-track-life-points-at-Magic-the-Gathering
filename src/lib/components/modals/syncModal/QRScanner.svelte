<script lang="ts">
	import { Capacitor } from '@capacitor/core';
	import { Camera } from '@capacitor/camera';

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import {
		BrowserQRCodeReader,
		DecodeHintType,
		BarcodeFormat,
		NotFoundException
	} from '@zxing/library';
	import { _ } from 'svelte-i18n';

	async function requestNativeCameraPermission(): Promise<boolean> {
		// Si l'application tourne dans l'APK natif Capacitor
		if (Capacitor.isNativePlatform()) {
			const status = await Camera.checkPermissions();

			if (status.camera !== 'granted') {
			const request = await Camera.requestPermissions({ permissions: ['camera'] });
			return request.camera === 'granted';
			}
		}
		return true; // En navigateur web classique
	}

	// À appeler avant d'initialiser le scanner :
	async function initScanner() {
		const hasPermission = await requestNativeCameraPermission();
		if (!hasPermission) {
			throw new Error('Permission denied by user');
		}

		// Démarrage de votre scanner (html5-qrcode / zxing) ici...
	}

	const dispatch = createEventDispatcher<{ scan: string; error: string }>();

	let videoElement: HTMLVideoElement;
	let reader: BrowserQRCodeReader | null = null;
	let scanning = false;
	let errorMessage = '';
	let resolutionLabel = '';
	let manualCode = '';
	let showManual = false;

	async function buildReader(): Promise<BrowserQRCodeReader> {
		await initScanner();
		const r = new BrowserQRCodeReader(150);
		const hints = new Map();
		hints.set(DecodeHintType.TRY_HARDER, true);
		hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
		r.hints = hints;
		return r;
	}

	onMount(async () => {
		try {
			reader = await buildReader();
			scanning = true;
			// A high-resolution stream is mandatory: a dense QR code filmed off another
			// screen is unreadable below ~720p.
			await reader.decodeFromConstraints(
				{
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1920 },
						height: { ideal: 1080 }
					}
				},
				videoElement,
				(result, error) => {
					if (result) {
						dispatch('scan', result.getText());
						stopScanning();
						return;
					}
					// NotFoundException fires on every frame without a QR code — expected.
					if (error && !(error instanceof NotFoundException)) {
						console.warn('[QRScanner] decode error', error);
					}
				}
			);

			const track = (videoElement.srcObject as MediaStream | null)?.getVideoTracks()?.[0];
			const settings = track?.getSettings();
			if (settings) {
				resolutionLabel = `${settings.width ?? '?'}×${settings.height ?? '?'}`;
				console.info('[QRScanner] camera settings', settings);
			}
		} catch (e) {
			console.error('[QRScanner] failed to start camera', e);
			errorMessage = e instanceof Error ? e.message : 'Camera access denied';
			scanning = false;
			showManual = true;
			dispatch('error', errorMessage);
		}
	});

	onDestroy(() => {
		stopScanning();
	});

	function stopScanning() {
		reader?.reset();
		reader = null;
		scanning = false;
	}

	function submitManual() {
		const value = manualCode.trim();
		if (!value) return;
		stopScanning();
		dispatch('scan', value);
	}

	async function pasteFromClipboard() {
		try {
			manualCode = await navigator.clipboard.readText();
		} catch (e) {
			console.warn('[QRScanner] clipboard read failed', e);
		}
	}
</script>

<div class="flex w-full flex-col items-center gap-2">
	{#if errorMessage}
		<p class="text-center text-sm text-red-400">{errorMessage}</p>
	{:else if scanning}
		<p class="text-sm text-white/70">
			{$_('sync_mode_camera_scanning') || 'Point camera at QR code…'}
		</p>
	{/if}

	<!-- object-contain: what is displayed is exactly what the decoder sees. -->
	<video
		bind:this={videoElement}
		class="aspect-[4/3] w-full max-w-[320px] rounded-lg border-2 border-white/20 bg-black object-contain"
		autoplay
		playsinline
		muted
	></video>

	{#if resolutionLabel}
		<p class="text-xs text-white/40">{resolutionLabel}</p>
	{/if}

	<button class="text-xs text-white/50 underline" on:click={() => (showManual = !showManual)}>
		{$_('sync_mode_manual_entry') || 'QR code not scanning? Enter the code manually'}
	</button>

	{#if showManual}
		<div class="flex w-full flex-col gap-2">
			<textarea
				bind:value={manualCode}
				rows="3"
				spellcheck="false"
				autocapitalize="none"
				placeholder={$_('sync_mode_manual_placeholder') ||
					'Paste the code shown on the other device'}
				class="w-full resize-none rounded-lg bg-black/40 p-2 font-mono text-xs text-white outline-none ring-1 ring-white/20 focus:ring-white/50"
			></textarea>
			<div class="flex gap-2">
				<button
					class="flex-1 rounded-lg bg-gray-700 py-2 text-sm transition-colors hover:bg-gray-600"
					on:click={pasteFromClipboard}
				>
					{$_('sync_mode_paste') || 'Paste'}
				</button>
				<button
					class="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold transition-colors hover:bg-blue-500 disabled:opacity-40"
					on:click={submitManual}
					disabled={!manualCode.trim()}
				>
					{$_('sync_mode_validate') || 'Validate'}
				</button>
			</div>
		</div>
	{/if}
</div>
