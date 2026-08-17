<script lang="ts">
	import QRCode from 'qrcode';
	import { _ } from 'svelte-i18n';

	export let data: string = '';
	export let size: number = 256;

	let canvas: HTMLCanvasElement;
	let errorMessage = '';
	let copied = false;

	// Render at a fixed high resolution and let CSS scale it down: the printed modules
	// stay sharp, which is what makes the code readable by another device's camera.
	const RENDER_SIZE = 768;

	async function renderQR() {
		if (!canvas || !data) return;

		errorMessage = '';
		try {
			await QRCode.toCanvas(canvas, data, {
				color: { dark: '#000000', light: '#FFFFFF' },
				errorCorrectionLevel: 'M',
				margin: 4,
				width: RENDER_SIZE
			});
		} catch (e) {
			errorMessage = $_('sync_mode_qr_render_error') || 'Failed to render QR code';
			console.error(e);
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(data);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (e) {
			console.warn('[QRCodeDisplay] clipboard write failed', e);
		}
	}

	$: if (canvas && data) {
		renderQR();
	}
</script>

<div class="flex w-full flex-col items-center gap-2">
	{#if errorMessage}
		<p class="text-sm text-red-400">{errorMessage}</p>
	{/if}

	<div
		class="flex w-full max-w-[512px] items-center justify-center rounded-xl bg-white p-2 shadow-sm"
	>
		<canvas
			bind:this={canvas}
			class="block aspect-square h-auto w-full bg-white"
			style="min-width: {size}px"
		>
			<span class="text-sm text-red-400">
				Error: Your browser does not support the HTML5 canvas tag.
			</span>
		</canvas>
	</div>

	<button class="text-xs text-white/50 underline" on:click={copyToClipboard}>
		{copied
			? $_('sync_mode_copied') || 'Copied!'
			: $_('sync_mode_copy_code') || 'Copy the code instead'}
	</button>
</div>
