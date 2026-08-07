<script lang="ts">
	import '../app.css';
	import '../lib/utils/i18n.js'; // Importation pour initialiser i18n

	import { Capacitor } from '@capacitor/core';
	import { Device } from '@capacitor/device';

	$: innerHeight = 0;

	import { onMount } from 'svelte';

	const isMobileWeb = () => {
		const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
		const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
		return isCoarsePointer || mobileUa;
	};

	const requestFullscreen = async () => {
		const element = document.documentElement;
		if (!element.requestFullscreen || document.fullscreenElement) return;

		try {
			// await element.requestFullscreen();
		} catch {
			// Some mobile browsers require a user gesture before entering fullscreen.
		}
	};

	const enableMobileFullscreenByDefault = async () => {
		if (Capacitor.isNativePlatform()) return;
		if (!isMobileWeb()) return;

		await requestFullscreen();

		if (document.fullscreenElement) return;

		const onFirstInteraction = () => {
			void requestFullscreen();
		};

		window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });
		window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
	};

	onMount(async () => {
		const mod = await import('../setupStatusBar');
		mod.setupStatusBar?.().catch(console.warn);
		await enableMobileFullscreenByDefault();
	});

	const applyNativeContext = async () => {
		const body = document.body;

		// 1. Détection simple via le Core de Capacitor
		if (Capacitor.isNativePlatform()) {
			body.classList.add('is-native');

			// 2. Détection spécifique à la plateforme pour des ajustements fins
			const info = await Device.getInfo();
			if (info.platform === 'android') {
				body.classList.add('is-android');
			} else if (info.platform === 'ios') {
				body.classList.add('is-ios');
			}
		} else {
			body.classList.add('is-web');
		}
	};

	applyNativeContext();
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, height=device-height, viewport-fit=cover"
	/>
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<svelte:window bind:innerHeight contextmenu="return false" />

<!-- outer full-width container avoids visible body background at the sides -->
<div
	class="w-full max-h-screen font-sans flex justify-center overflow-hidden"
	style="background-color: var(--stream-layout-bg, transparent); color: var(--stream-layout-fg, inherit);"
>
	<div class="mx-auto max-w-[1000px] flex justify-center w-full" style="height: {innerHeight}px;">
		<slot />
	</div>
</div>
