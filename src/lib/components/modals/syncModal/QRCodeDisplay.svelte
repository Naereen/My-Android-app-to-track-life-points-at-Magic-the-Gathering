<script lang="ts">
    import { browser } from '$app/environment';
    import QRCode from 'qrcode';
    import { _ } from 'svelte-i18n';

    export let data: string = '';
    export let size: number = 256;

    let containerWidth = 0;
    let canvas: HTMLCanvasElement;
    let errorMessage = '';

    // Bornes de taille pour le canvas (en pixels CSS)
    const ABSOLUTE_MIN = 256;
    const ABSOLUTE_MAX = 512;

    function computeAdaptiveSize(width: number | undefined): number {
        if (!width) return ABSOLUTE_MIN;
        let target = Math.floor(width);
        return Math.max(ABSOLUTE_MIN, Math.min(ABSOLUTE_MAX, target));
    }

    $: dpr = browser ? (window.devicePixelRatio || 1) : 1;

    // 1. Calcul réactif de la taille de base puis ajustement Retina/DPR
    $: baseSize = computeAdaptiveSize(containerWidth);
    $: canvasSize = Math.max(size, baseSize) * dpr;

    async function renderQR() {
        if (!canvas || !data) return;

        errorMessage = '';
        try {
            await QRCode.toCanvas(canvas, data, {
                color: { dark: '#000000', light: '#FFFFFF' },
                margin: 2,
                width: canvasSize/4, // Ajuste la largeur pour le DPR
				// scale: dpr, // Ajuste l'échelle pour le DPR
            });
        } catch (e) {
            errorMessage = $_('sync_mode_qr_render_error') || 'Failed to render QR code';
            console.error(e);
        }
    }

    // 2. Déclaration réactive incluant explicitement `canvasSize`
    $: if (canvas && data && canvasSize) {
        renderQR();
    }
</script>

<div class="flex flex-col items-center gap-2 w-full">
    {#if errorMessage}
        <p class="text-red-400 text-sm">{errorMessage}</p>
    {/if}

    <div
        class="w-full max-w-[512px] rounded-xl bg-white p-2 shadow-sm flex justify-center items-center"
        bind:clientWidth={containerWidth}
    >
        <canvas
            bind:this={canvas}
            width={canvasSize}
            height={canvasSize}
            class="w-full h-auto aspect-square block bg-white [image-rendering:pixelated]"
        >
            <span class="text-red-400 text-sm">
                Error: Your browser does not support the HTML5 canvas tag.
            </span>
        </canvas>
    </div>
</div>