<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { BrowserQRCodeReader } from '@zxing/library';
	import { _ } from 'svelte-i18n';

	const dispatch = createEventDispatcher<{ scan: string; error: string }>();
	const SCAN_BOX_SIZE = 280;

	let videoElement: HTMLVideoElement;
	let reader: BrowserQRCodeReader | null = null;
	let scanning = false;
	let errorMessage = '';

	onMount(async () => {
		try {
			reader = new BrowserQRCodeReader();
			scanning = true;
			await reader.decodeFromConstraints(
				{
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: SCAN_BOX_SIZE },
						height: { ideal: SCAN_BOX_SIZE },
						aspectRatio: { ideal: 1 }
					}
				},
				videoElement,
				(result) => {
					if (result) {
						dispatch('scan', result.getText());
						stopScanning();
					}
					// Per-frame errors (e.g. NotFoundException when no QR is visible) are harmless — ignore them silently.
				}
			);
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Camera access denied';
			scanning = false;
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
</script>

<div class="flex flex-col items-center gap-2 w-full">
	{#if errorMessage}
		<p class="text-red-400 text-sm text-center">{errorMessage}</p>
	{:else if scanning}
		<p class="text-white/70 text-sm">
			{$_('sync_mode_camera_scanning') || 'Point camera at QR code…'}
		</p>
	{/if}
	<video
		bind:this={videoElement}
		class="aspect-square w-full max-w-[280px] rounded-lg border-2 border-white/20 bg-black object-cover"
		autoplay
		playsinline
		muted
	></video>
</div>
