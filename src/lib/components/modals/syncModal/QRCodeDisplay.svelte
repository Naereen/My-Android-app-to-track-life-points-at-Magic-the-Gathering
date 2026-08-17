<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import { _ } from 'svelte-i18n';

	export let data: string = '';
	export let size: number = 256;

	const MIN_CANVAS_SIZE = 512;

	let canvas: HTMLCanvasElement;
	let errorMessage = '';

	$: canvasSize = Math.max(size, MIN_CANVAS_SIZE);

	async function renderQR() {
		if (!canvas || !data) return;
		errorMessage = '';
		try {
			await QRCode.toCanvas(canvas, data, {
				width: canvasSize,
				margin: 4,
				color: { dark: '#000000', light: '#FFFFFF' }
			});
		} catch (e) {
			errorMessage = $_('sync_mode_qr_render_error') || 'Failed to render QR code';
			console.error(e);
		}
	}

	onMount(() => {
		renderQR();
	});

	$: if (canvas && data) {
		renderQR();
	}
</script>

<div class="flex flex-col items-center gap-2">
	{#if errorMessage}
		<p class="text-red-400 text-sm">{errorMessage}</p>
	{/if}
	<div class="rounded-lg bg-white p-4">
		<canvas
			bind:this={canvas}
			width={canvasSize}
			height={canvasSize}
			style={`width: ${size}px; height: ${size}px;`}
			class="block max-w-full bg-white"
		></canvas>
	</div>
</div>
