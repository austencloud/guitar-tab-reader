/// <reference types="node" />
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'development',
			strategies: 'generateSW',
			scope: '/',
			base: '/',
			selfDestroying: process.env.SELF_DESTROYING_SW === 'true',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'google-fonts-stylesheets'
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			manifest: {
				short_name: 'TabScroll',
				name: 'TabScroll - Guitar Tab Reader',
				description: 'A portable guitar tab reader with auto-scrolling and tuner',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#4caf50',
				background_color: '#ffffff',
				orientation: 'portrait',
				categories: ['music', 'utilities', 'education'],
				icons: [
					{
						src: '/icon-72.png',
						sizes: '72x72',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-96.png',
						sizes: '96x96',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-128.png',
						sizes: '128x128',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-144.png',
						sizes: '144x144',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				screenshots: [
					{
						src: '/screenshots/mobile-home.png',
						sizes: '750x1334',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'TabScroll Home Screen'
					}
				]
			},
			devOptions: {
				enabled: true,
				suppressWarnings: process.env.SUPPRESS_WARNING === 'true',
				type: 'module',
				navigateFallback: '/'
			},
			// if you have shared info in svelte config file put in a separate module and use it also here
			kit: {}
		})
	],
	server: {
		port: 5001,
		allowedHosts: ['21e236af-93f8-40ce-a514-4dd00ecf32e0-00-2szeshrr4on31.riker.replit.dev']
	},
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
