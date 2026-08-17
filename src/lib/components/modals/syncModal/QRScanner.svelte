<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { BrowserMultiFormatReader, ReaderException } from '@zxing/library';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';

	const dispatch = createEventDispatcher<{ scan: string; error: string }>();

	let videoElement: HTMLVideoElement;
	let reader: BrowserMultiFormatReader | null = null;
	let scanning = false;
	let errorMessage = '';

	onMount(async () => {
		try {
			reader = new BrowserMultiFormatReader();
			scanning = true;
			await reader.decodeFromConstraints(
				{ video: { facingMode: 'environment' } },
				videoElement,
				(result, err) => {
					if (result) {
						dispatch('scan', result.getText());
						stopScanning();
					} else if (err && !(err instanceof ReaderException)) {
						errorMessage = err.message ?? get(_)('sync_mode_camera_error') ?? 'Camera error';
						dispatch('error', errorMessage);
					}
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
		class="w-full max-w-xs rounded-lg border-2 border-white/20"
		autoplay
		playsinline
		muted
	></video>
</div>
