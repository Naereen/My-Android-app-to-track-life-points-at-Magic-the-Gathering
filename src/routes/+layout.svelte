<script lang="ts">
	import '../app.css';
	import '../lib/utils/i18n.js'; // Importation pour initialiser i18n

	import { Capacitor } from '@capacitor/core';
	import { Device } from '@capacitor/device';

	$: innerHeight = 0;

	import { onMount } from 'svelte';

	/**
	 * Detects touch-first mobile browsers outside Capacitor native runtime.
	 * Uses both pointer capability and user-agent heuristics for broad compatibility.
	 * @returns {boolean} `true` when the page is likely running in a mobile browser.
	 */
	const isMobileWeb = () => {
		const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
		const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
		return isCoarsePointer || mobileUa;
	};

	/**
	 * Requests fullscreen for mobile web sessions when supported by the browser.
	 * The call is intentionally no-op when fullscreen is unavailable or already active.
	 * @returns {Promise<void>}
	 */
	const requestFullscreen = async () => {
		const element = document.documentElement;
		if (!element.requestFullscreen || document.fullscreenElement) return;

		try {
			// await element.requestFullscreen();
		} catch {
			// Some mobile browsers require a user gesture before entering fullscreen.
		}
	};

	/**
	 * Tries to enter fullscreen automatically on mobile web.
	 * If blocked by gesture policy, retries once on the first user interaction.
	 * @returns {Promise<void>}
	 */
	const enableMobileFullscreenByDefault = async () => {
		if (Capacitor.isNativePlatform()) return;
		if (!isMobileWeb()) return;

		await requestFullscreen();

		if (document.fullscreenElement) return;

		// Many mobile browsers reject fullscreen on initial load without explicit user
		// gesture. We install one-shot listeners as a controlled fallback path.
		/**
		 * Deferred fullscreen retry bound to the first touch/pointer interaction.
		 * @returns {void}
		 */
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

	/**
	 * Adds runtime CSS context classes on `<body>` (`is-native`, `is-android`, `is-ios`, `is-web`).
	 * These classes drive safe-area and platform-specific styling across the app.
	 * @returns {Promise<void>}
	 */
	const applyNativeContext = async () => {
		const body = document.body;

		// Platform classes are a contract with app.css and player/layout components.
		// They are used as the single source of truth for native/web visual branches.
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

	// Run once at module evaluation: classes must exist before most route content mounts,
	// otherwise first frame can render with wrong safe-area and cause visible layout jumps.
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
