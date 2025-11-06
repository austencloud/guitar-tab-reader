<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/state';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import { ScrollControls, TabViewer } from '$features/tabs/components';
	import { GuitarTuner } from '$features/tuner/components';
	import preferences from '$lib/stores/preferences';

	let tabContainer = $state<HTMLDivElement | undefined>(undefined);
	// let currentPosition = $state(0); // TODO: Use for scroll position tracking
	let tunerOpen = $state(false);

	const id = $derived(page.params.id);
	const currentTab = $derived($tabs.find((tab) => tab.id === id));

	function goBack() {
		goto('/');
	}

	function handleScrollChange(isScrolling: boolean) {
		// If scrolling is active, update current position based on scroll
		if (isScrolling && tabContainer) {
			const updatePositionInterval = setInterval(() => {
				// Calculate position based on scroll position
				if (tabContainer) {
					// TODO: Use currentPosition for scroll position tracking
					// currentPosition = tabContainer.scrollTop;
				}
			}, 100);

			return () => clearInterval(updatePositionInterval);
		}
	}

	function handleOpenTuner() {
		tunerOpen = true;
	}

	function handleCloseTuner() {
		tunerOpen = false;
	}

	// Make sure we have access to the container after component is mounted
	onMount(() => {
		return () => {
			// Cleanup if needed
		};
	});

	// Provide tuner state context
	setContext('tunerState', {
		get open() {
			return tunerOpen;
		},
		setOpen: (value: boolean) => (tunerOpen = value)
	});
</script>

<svelte:head>
	<title>{currentTab?.title || 'Tab'} | TabScroll</title>
</svelte:head>

{#if currentTab}
	<div class="tab-view">
		<div class="tab-container" bind:this={tabContainer}>
			{#if tabContainer}
				<TabViewer
					content={currentTab.content}
					fontSize={$preferences.fontSize}
					showChordDiagrams={true}
					onopenTuner={handleOpenTuner}
				/>
			{/if}
		</div>

		<div class="controls-container">
			{#if tabContainer}
				<ScrollControls container={tabContainer} onscrollStateChange={handleScrollChange} />
			{/if}
		</div>

		<!-- Add GuitarTuner component here -->
		<GuitarTuner showTuner={tunerOpen} onclose={handleCloseTuner} />
	</div>
{:else}
	<div class="not-found">
		<h1>Tab Not Found</h1>
		<p>Sorry, the tab you're looking for doesn't exist or has been deleted.</p>
		<button onclick={goBack}>Back to Home</button>
	</div>
{/if}

<style>
	.tab-view {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 5rem); /* Account for bottom nav */
		background: var(--color-background);
	}

	.tab-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--spacing-md);
		background: var(--color-background);
	}

	.controls-container {
		padding: var(--spacing-sm) var(--spacing-md);
		border-top: 1px solid var(--color-border-light);
		position: sticky;
		bottom: 0;
		background: var(--color-surface);
		box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.05);
		z-index: 50;
		transition: var(--transition-colors);
	}

	.not-found {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl);
		text-align: center;
		min-height: 100vh;
		background: var(--color-background);
	}

	.not-found h1 {
		font-size: clamp(1.5rem, 4vw, 2rem);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.not-found p {
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xl);
		font-size: var(--font-size-base);
	}

	.not-found button {
		padding: 0.875rem var(--spacing-xl);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
		box-shadow: var(--shadow-md);
	}

	.not-found button:hover {
		background: var(--color-primary-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.not-found button:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.tab-container {
			padding: var(--spacing-sm);
		}

		.controls-container {
			padding: var(--spacing-xs) var(--spacing-sm);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.tab-container {
			padding: var(--spacing-xs);
		}

		.controls-container {
			padding: var(--spacing-xs);
		}

		.not-found {
			padding: var(--spacing-xl) var(--spacing-md);
		}
	}

	/* Landscape mobile optimization - maximize content space */
	@media (max-height: 600px) and (orientation: landscape) {
		.tab-view {
			min-height: calc(100vh - 4rem);
		}

		.tab-container {
			padding: var(--spacing-xs);
		}

		.controls-container {
			padding: var(--spacing-xs);
		}
	}
</style>
