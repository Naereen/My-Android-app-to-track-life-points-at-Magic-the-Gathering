import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// To read the version from package.json, we need to use the file system and URL modules, since we can't use import.meta in this config file
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// Lire le package.json pour extraire la version
const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			mode: 'development',
			// base: '/',
			// base: '/My-Android-app-to-track-life-points-at-Magic-the-Gathering/',
			// generate a manifest named `manifest.json` and a service worker named `service-worker.js`
			manifestFilename: 'manifest.json',
			filename: 'service-worker.js',
			strategies: 'generateSW',
			registerType: 'prompt',
			injectRegister: 'inline',
			selfDestroying: false,
			includeAssets: [
				'icons/favicon.ico',
				'icons/icon-128x128.png',
				'icons/icon-192x192.png',
				'icons/icon-256x256.png',
				'icons/icon-512x512.png'
			],
			manifest: {
				name: "Naereen's MTG Life Tracker",
				short_name: "Naereen's MTG Life Tracker",
				description:
					"Naereen's Magic The Gathering Life Tracker, for Android and iOS devices. Keep track of your life points during games with ease! Work in progress...",
				theme_color: '#062911',
				orientation: 'portrait',
				// display: 'fullscreen',
				display: 'standalone',
				background_color: '#000000',
				screenshots: [
					{
						src: 'screenshots/screenshot1.png',
						sizes: '750x889',
						type: 'image/png'
					}
				],
				icons: [
					{
						src: 'icons/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: 'icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: 'icons/icon-256x256.png',
						sizes: '256x256',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: 'icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: 'icons/icon-1024x1024.png',
						sizes: '1024x1024',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module'
				// navigateFallback: 'index.html'
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,jpg,jpeg,woff2,woff,ttf,eot,otf}'],
				clientsClaim: true,
				skipWaiting: true,
				maximumFileSizeToCacheInBytes: 64000000
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	define: {
		// On définit une variable globale disponible dans le code Svelte
		'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
	}
});
