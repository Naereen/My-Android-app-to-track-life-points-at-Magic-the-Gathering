<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	export let data: string = '';
	export let size: number = 256;

	let canvas: HTMLCanvasElement;
	let errorMessage = '';

	async function renderQR() {
		if (!canvas || !data) return;
		errorMessage = '';
		try {
			await QRCode.toCanvas(canvas, data, {
				width: size,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' }
			});
		} catch (e) {
			errorMessage = 'Failed to render QR code';
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
	<canvas
		bind:this={canvas}
		width={size}
		height={size}
		class="rounded-lg border-2 border-white/20 bg-white"
	></canvas>
</div>
