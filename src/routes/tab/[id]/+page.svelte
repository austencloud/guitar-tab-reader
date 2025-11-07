<script lang="ts">
	import { setContext, getContext } from 'svelte';
	import { page } from '$app/state';
	import { tabs } from '$lib/state/tabs.svelte';
	import { goto } from '$app/navigation';
	import { ScrollControls, TabViewer } from '$features/tabs/components';
	import { GuitarTuner } from '$features/tuner/components';
	import { preferences } from '$lib/state/preferences.svelte';

	let tabContainer = $state<HTMLDivElement | undefined>(undefined);
	// let currentPosition = $state(0); // TODO: Use for scroll position tracking
	let tunerOpen = $state(false);
	let lastContainerScrollTop = $state(0);

	const id = $derived(page.params.id);
	const currentTab = $derived(tabs.tabs.find((tab) => tab.id === id));

	// Get scroll visibility context from parent layout
	const scrollVisibility = getContext<{
		getVisible: () => boolean;
		hide: () => void;
		show: () => void;
		handleContainerScroll: (scrollTop: number, lastScroll: number) => void;
	}>('scrollVisibility');
	// Call the function in a $derived context to establish reactive tracking
	const isControlsVisible = $derived(scrollVisibility?.getVisible() ?? true);

	function handleHideNavigation() {
		// Hide the navigation when auto-scroll starts
		scrollVisibility?.hide();
	}

	function handleContainerScroll(event: Event) {
		const target = event.target as HTMLElement;
		const currentScroll = target.scrollTop;
		
		// Notify layout of scroll position changes
		scrollVisibility?.handleContainerScroll(currentScroll, lastContainerScrollTop);
		
		lastContainerScrollTop = currentScroll;
	}

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
	<div class="tab-view tabscroll-tab-page">
		<div 
			class="tab-container tabscroll-tab-container" 
			bind:this={tabContainer}
			onscroll={handleContainerScroll}
		>
			{#if tabContainer}
				<TabViewer
					content={currentTab.content}
					fontSize={preferences.fontSize}
					showChordDiagrams={true}
					onopenTuner={handleOpenTuner}
				/>
			{/if}
		</div>

		<div class="controls-container" class:controls-hidden={!isControlsVisible}>
			{#if tabContainer}
				<ScrollControls 
					container={tabContainer} 
					onscrollStateChange={handleScrollChange}
					onhideNavigation={handleHideNavigation}
				/>
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
	.tab-view,
	.tabscroll-tab-page {
		display: flex;
		flex-direction: column;
		height: 100vh; /* Fill viewport height */
		background: var(--color-background);
	}

	.tab-container,
	.tabscroll-tab-container {
		flex: 1; /* Grow to fill available space */
		overflow-y: auto;
		overflow-x: auto; /* Allow horizontal scrolling to preserve chord alignment */
		padding: var(--spacing-md);
		padding-bottom: calc(60px + 72px + env(safe-area-inset-bottom)); /* Space for controls + nav */
		background: var(--color-background);
		min-height: 0; /* Important for flex children to allow shrinking */
	}

	.controls-container {
		padding: 0.5rem 0.75rem;
		padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		position: fixed;
		bottom: 72px; /* Above nav bar (nav is ~72px tall with safe area) */
		left: 0;
		right: 0;
		background: rgba(15, 15, 15, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		z-index: 90; /* Below nav (100) but above content */
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* When navigation is hidden, move controls to the very bottom */
	.controls-container.controls-hidden {
		bottom: 0;
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
			padding: 0.375rem 0.5rem;
			padding-bottom: calc(0.375rem + env(safe-area-inset-bottom));
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.tab-container {
			padding: var(--spacing-xs);
		}

		.controls-container {
			padding: 0.375rem 0.5rem;
			padding-bottom: calc(0.375rem + env(safe-area-inset-bottom));
		}

		.not-found {
			padding: var(--spacing-xl) var(--spacing-md);
		}
	}

	/* Landscape mobile optimization - maximize content space */
	@media (max-height: 600px) and (orientation: landscape) {
		.tab-container {
			padding: var(--spacing-xs);
			padding-bottom: calc(50px + 64px + env(safe-area-inset-bottom)); /* Smaller controls + nav in landscape */
		}

		.controls-container {
			padding: 0.25rem 0.5rem;
			padding-bottom: calc(0.25rem + env(safe-area-inset-bottom));
			bottom: 64px; /* Nav is slightly shorter in landscape */
		}

		.controls-container.controls-hidden {
			bottom: 0;
		}
	}

	/* Larger screens - controls stay fixed but more comfortable */
	@media (min-width: 1024px) {
		.controls-container {
			left: 50%;
			transform: translateX(-50%);
			max-width: var(--container-lg);
			border-radius: 16px 16px 0 0;
		}
	}
</style>
