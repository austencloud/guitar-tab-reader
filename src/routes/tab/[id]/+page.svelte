<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/state';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import { ScrollControls, TabViewer, TuningDisplay } from '$features/tabs/components';
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

	function editTab() {
		goto(`/tab/${id}/edit`);
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
		<header>
			<button class="back-btn" onclick={goBack} aria-label="Back to home"> ← Back </button>
			<div class="title-container">
				<h1>{currentTab.title}</h1>
				{#if currentTab.artist || currentTab.album}
					<div class="tab-metadata">
						{#if currentTab.artist}<span class="artist">{currentTab.artist}</span>{/if}
						{#if currentTab.artist && currentTab.album}<span class="separator">·</span>{/if}
						{#if currentTab.album}<span class="album">{currentTab.album}</span>{/if}
					</div>
				{/if}
				<div class="tuning-info">
					<TuningDisplay compact={true} showStrings={false} />
				</div>
			</div>
			<div class="action-buttons">
				<button class="edit-btn" onclick={editTab} aria-label="Edit tab">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M12 20h9"></path>
						<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
					</svg>
				</button>
			</div>
		</header>

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
		height: 100vh;
		max-height: 100vh;
		background: var(--color-background);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		border-bottom: 2px solid var(--color-border-light);
		position: sticky;
		top: 0;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		z-index: var(--z-sticky);
		transition: var(--transition-colors);
	}

	h1 {
		flex: 1;
		margin: 0;
		text-align: center;
		font-size: clamp(1.125rem, 3vw, 1.5rem);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		letter-spacing: -0.01em;
	}

	.title-container {
		flex: 1;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.tab-metadata {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tuning-info {
		opacity: 0.9;
		font-size: var(--font-size-xs);
	}

	.artist,
	.album {
		font-weight: var(--font-weight-semibold);
	}

	.separator {
		color: var(--color-text-tertiary);
	}

	.back-btn,
	.edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: var(--color-surface-variant);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: var(--color-text-primary);
		transition: var(--transition-all);
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		flex-shrink: 0;
	}

	.back-btn:hover,
	.edit-btn:hover {
		background: var(--color-hover);
		border-color: var(--color-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.back-btn:active,
	.edit-btn:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.tab-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		background: var(--color-background);
	}

	.controls-container {
		padding: var(--spacing-md);
		border-top: 2px solid var(--color-border-light);
		position: sticky;
		bottom: 0;
		background: var(--color-surface);
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
		z-index: var(--z-sticky);
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
		header {
			padding: var(--spacing-sm) var(--spacing-md);
			gap: var(--spacing-sm);
		}

		h1 {
			font-size: 1.125rem;
		}

		.tab-metadata {
			font-size: var(--font-size-xs);
		}

		.back-btn,
		.edit-btn {
			padding: var(--spacing-sm);
			min-width: 40px;
			min-height: 40px;
		}

		.controls-container {
			padding: var(--spacing-sm);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		header {
			padding: var(--spacing-sm);
			gap: var(--spacing-xs);
		}

		h1 {
			font-size: 1rem;
		}

		.tab-metadata {
			font-size: 0.625rem;
			flex-direction: column;
			gap: 0.125rem;
		}

		.separator {
			display: none;
		}

		.tuning-info {
			font-size: 0.625rem;
		}

		.back-btn,
		.edit-btn {
			padding: 0.625rem;
			min-width: var(--touch-target-min);
			min-height: var(--touch-target-min);
		}

		.back-btn svg,
		.edit-btn svg {
			width: 18px;
			height: 18px;
		}

		.action-buttons {
			gap: 0.25rem;
		}

		.controls-container {
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.not-found {
			padding: var(--spacing-xl) var(--spacing-md);
		}
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		header {
			padding: 0.5rem;
		}

		h1 {
			font-size: 0.875rem;
		}

		.back-btn,
		.edit-btn {
			padding: 0.5rem;
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		header {
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.tab-metadata,
		.tuning-info {
			display: none;
		}

		.controls-container {
			padding: var(--spacing-xs) var(--spacing-sm);
		}
	}
</style>
