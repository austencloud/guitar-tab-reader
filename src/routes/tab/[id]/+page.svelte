<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/state';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import ScrollControls from '$lib/components/ScrollControls.svelte';
	import GuitarTuner from '$lib/components/GuitarTuner.svelte';
	import TuningDisplay from '$lib/components/TuningDisplay.svelte';
	import preferences from '$lib/stores/preferences';
	import TabViewer from '$lib/components/TabViewer.svelte';

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
	}

	header {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
		position: sticky;
		top: 0;
		background-color: #fff;
		z-index: 10;
	}

	h1 {
		flex: 1;
		margin: 0;
		text-align: center;
		font-size: 1.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.title-container {
		flex: 1;
		text-align: center;
	}

	.tab-metadata {
		font-size: 0.9rem;
		color: #666;
	}

	.tuning-info {
		margin-top: 0.25rem;
		opacity: 0.8;
	}

	.artist,
	.album {
		font-weight: bold;
	}

	.separator {
		margin: 0 0.5rem;
	}

	.back-btn,
	.edit-btn {
		padding: 0.5rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.tab-container {
		flex: 1;
		/* Change overflow to allow scrolling */
		overflow-y: auto;
		padding: 0;
	}

	.controls-container {
		padding: 0.5rem;
		border-top: 1px solid #eee;
		position: sticky;
		bottom: 0;
		z-index: 10;
	}

	.not-found {
		padding: 2rem;
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	.not-found button {
		padding: 0.75rem 1.5rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 1rem;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		header {
			background-color: #222;
			border-color: #444;
		}

		.back-btn,
		.edit-btn {
			border-color: #555;
			color: #eee;
		}

		.controls-container {
			border-color: #444;
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		header {
			padding: 0.5rem;
		}

		h1 {
			font-size: 1.2rem;
		}

		.back-btn,
		.edit-btn {
			padding: 0.4rem;
			font-size: 0.9rem;
		}
	}
</style>
