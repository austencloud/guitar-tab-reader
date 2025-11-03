<script lang="ts">
	import '../app.css';
	import { SettingsButton, SettingsModal, Footer } from '$features/shared/components';
	import { GuitarTuner } from '$features/tuner/components';
	import { setContext, getContext, onMount } from 'svelte';
	import { initializeApp } from '$lib/app';
	import { useService } from '$lib/useService.svelte';
	import { TYPES } from '$core/di';
	import type { UIState, UserState } from '$features/shared/services';

	interface TunerState {
		open: boolean;
		setOpen: (value: boolean) => void;
	}

	let { children } = $props();
	let childTunerState: TunerState | null = $state(null);

	// Get services from DI container (stored in $state to maintain reactivity)
	let uiState = $state<UIState | undefined>(undefined);
	let userState = $state<UserState | undefined>(undefined);

	// Initialize application on mount
	onMount(async () => {
		await initializeApp();

		// Get services after initialization
		uiState = useService<UIState>(TYPES.UIState);
		userState = useService<UserState>(TYPES.UserState);
	});

	// Create a global tuner context
	setContext('tuner', {
		open: () => uiState?.openModal('tuner'),
		close: () => uiState?.closeModal('tuner'),
		toggle: () => {
			if (uiState) {
				if (uiState.tunerModalOpen) {
					uiState.closeModal('tuner');
				} else {
					uiState.openModal('tuner');
				}
			}
		}
	});

	// Handle state synchronization between parent and child
	$effect(() => {
		if (childTunerState && uiState && childTunerState.open !== uiState.tunerModalOpen) {
			childTunerState.setOpen(uiState.tunerModalOpen);
		}
	});

	// Try to get context from child routes
	function handleContextMount(_node: HTMLElement) {
		try {
			// Try to get tuner state from a child route
			childTunerState = getContext<TunerState>('tunerState');
			if (childTunerState && uiState) {
				uiState.tunerModalOpen = childTunerState.open;
			}
		} catch {
			// Context not available, no problem
		}

		return {
			destroy() {
				// Cleanup if needed
			}
		};
	}

	function toggleSettings() {
		uiState?.openModal('settings');
	}

	function closeSettings() {
		uiState?.closeModal('settings');
	}

	function closeTuner() {
		uiState?.closeModal('tuner');
	}

	function toggleTuner() {
		if (uiState) {
			if (uiState.tunerModalOpen) {
				uiState.closeModal('tuner');
			} else {
				uiState.openModal('tuner');
			}
		}
	}

	// Dark mode is always active - no theme switching needed
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
	/>
	<meta name="theme-color" content="#4caf50" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<div class="app-container">
	<header class="app-header">
		<div class="logo-area">
			<a href="/" class="logo-link">
				<h1 class="app-title">TabScroll</h1>
			</a>
		</div>
		<div class="app-actions">
			<button class="tuner-button" onclick={toggleTuner} aria-label="Open Guitar Tuner">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
					<path
						fill="currentColor"
						d="M12 3a9 9 0 0 0-9 9h3c0-3.31 2.69-6 6-6s6 2.69 6 6h3a9 9 0 0 0-9-9zm3.14 12a3.01 3.01 0 0 1-2.14.9 3 3 0 0 1-3-3 2.97 2.97 0 0 1 .9-2.14L12 8.07l1.14 2.69c.58.59.9 1.35.9 2.14a2.99 2.99 0 0 1-.9 2.1z"
					/>
				</svg>
				<span>Tune Guitar</span>
			</button>
			<SettingsButton onclick={toggleSettings} />
		</div>
	</header>

	<div class="content-wrapper" use:handleContextMount>
		{@render children()}
	</div>

	<Footer />
</div>

{#if uiState}
	<SettingsModal open={uiState.settingsModalOpen} onclose={closeSettings} />
	<GuitarTuner showTuner={uiState.tunerModalOpen} onclose={closeTuner} />
{/if}

<style>
	/* Global body styles are now in app.css */

	.app-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
	}

	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		backdrop-filter: var(--blur-sm);
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		text-decoration: none;
		color: var(--color-text-primary);
		transition: var(--transition-all);
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
	}

	.logo-link:hover {
		color: var(--color-primary);
		background: var(--color-hover);
	}

	.logo-link:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.app-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: inherit;
		letter-spacing: var(--letter-spacing-tight);
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.app-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.tuner-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-hover));
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		padding: 0.625rem var(--spacing-md);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		cursor: pointer;
		box-shadow: var(--shadow-md);
		transition: var(--transition-all);
		position: relative;
		overflow: hidden;
		min-height: var(--touch-target-min);
	}

	.tuner-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
		transition: left var(--transition-slower);
	}

	.tuner-button:hover {
		background: linear-gradient(135deg, var(--color-secondary-hover), var(--color-secondary-active));
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), var(--glow-secondary);
	}

	.tuner-button:hover::before {
		left: 100%;
	}

	.tuner-button:hover svg {
		transform: rotate(12deg) scale(1.05);
	}

	.tuner-button:active {
		background: linear-gradient(135deg, var(--color-secondary-active), var(--color-secondary));
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
	}

	.tuner-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tuner-button svg {
		transition: transform var(--transition-base);
		flex-shrink: 0;
	}

	.content-wrapper {
		width: 100%;
		max-width: var(--container-lg);
		padding: 0;
		padding-bottom: 4rem;
		margin: 0 auto;
		flex: 1;
	}

	/* ========================================
	   RESPONSIVE BREAKPOINTS
	   ======================================== */

	/* Tablet - 768px */
	@media (max-width: 768px) {
		.app-header {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.app-title {
			font-size: var(--font-size-lg);
		}

		.tuner-button {
			padding: 0.5rem var(--spacing-sm);
			font-size: var(--font-size-xs);
		}
	}

	/* Mobile - 480px */
	@media (max-width: 480px) {
		.app-header {
			padding: var(--spacing-sm) var(--spacing-page-padding-mobile);
		}

		.logo-link {
			padding: var(--spacing-xs) 0;
		}

		.app-title {
			font-size: var(--font-size-base);
		}

		.app-actions {
			gap: var(--spacing-xs);
		}

		/* Hide tuner button text on mobile, show icon only */
		.tuner-button span {
			display: none;
		}

		.tuner-button {
			padding: 0.625rem;
			min-width: var(--touch-target-min);
			width: var(--touch-target-min);
			justify-content: center;
		}

		.tuner-button svg {
			width: 20px;
			height: 20px;
		}
	}

	/* Extra small - 360px */
	@media (max-width: 360px) {
		.app-header {
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.app-title {
			font-size: var(--font-size-sm);
		}

		.tuner-button {
			padding: 0.5rem;
		}
	}
</style>
