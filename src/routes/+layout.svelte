<script lang="ts">
	import '../app.css';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import GuitarTuner from '$lib/components/GuitarTuner.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { setContext, getContext } from 'svelte';

	interface TunerState {
		open: boolean;
		setOpen: (value: boolean) => void;
	}

	let { children } = $props();
	let settingsOpen = $state(false);
	let tunerOpen = $state(false);
	let childTunerState: TunerState | null = $state(null);

	// Create a global tuner context
	setContext('tuner', {
		open: () => (tunerOpen = true),
		close: () => (tunerOpen = false),
		toggle: () => (tunerOpen = !tunerOpen)
	});

	// Handle state synchronization between parent and child
	$effect(() => {
		if (childTunerState && childTunerState.open !== tunerOpen) {
			childTunerState.setOpen(tunerOpen);
		}
	});

	// Try to get context from child routes
	function handleContextMount(_node: HTMLElement) {
		try {
			// Try to get tuner state from a child route
			childTunerState = getContext<TunerState>('tunerState');
			if (childTunerState) {
				tunerOpen = childTunerState.open;
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
		settingsOpen = !settingsOpen;
	}

	function closeSettings() {
		settingsOpen = false;
	}

	function closeTuner() {
		tunerOpen = false;
	}

	function toggleTuner() {
		tunerOpen = !tunerOpen;
	}
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
				<h1 class="app-title">Guitar Tab Reader</h1>
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

<SettingsModal open={settingsOpen} onclose={closeSettings} />
<GuitarTuner showTuner={tunerOpen} onclose={closeTuner} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		background-color: var(--color-background);
		color: var(--color-text-primary);
		overscroll-behavior: none;
		transition: var(--transition-colors);
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
		transition: var(--transition-colors);
	}

	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-surface);
		box-shadow: var(--shadow-sm);
		transition: var(--transition-colors);
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		text-decoration: none;
		color: var(--color-text-primary);
		transition: var(--transition-colors);
	}

	.logo-link:hover {
		color: var(--color-primary);
	}

	.app-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		margin: 0;
		color: inherit;
	}

	.app-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.tuner-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		cursor: pointer;
		box-shadow: var(--shadow-md);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.tuner-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.tuner-button:hover {
		background: linear-gradient(
			135deg,
			var(--color-secondary-hover),
			var(--color-secondary-active)
		);
		transform: translateY(-2px) scale(1.02);
		box-shadow: var(--shadow-xl);
	}

	.tuner-button:hover::before {
		left: 100%;
	}

	.tuner-button:hover svg {
		transform: rotate(15deg) scale(1.1);
	}

	.tuner-button:active {
		background: linear-gradient(135deg, var(--color-secondary-active), var(--color-secondary));
		transform: translateY(-1px) scale(1.01);
		box-shadow: var(--shadow-lg);
	}

	.tuner-button:focus {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tuner-button svg {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.content-wrapper {
		width: 100%;
		max-width: 900px;
		padding: var(--spacing-md);
		margin: 0 auto;
		flex: 1;
	}

	/* Responsive design improvements */

	/* Mobile optimization */
	@media (max-width: 600px) {
		.app-title {
			font-size: var(--font-size-lg);
		}

		.app-header {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.app-actions {
			gap: var(--spacing-xs);
		}
	}

	/* Mobile optimization for tuner button */
	@media (max-width: 768px) {
		.tuner-button {
			padding: var(--spacing-sm);
			font-size: var(--font-size-xs);
		}

		.content-wrapper {
			padding: var(--spacing-sm);
		}
	}
</style>
