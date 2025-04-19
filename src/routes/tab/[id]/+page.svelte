<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import EnhancedTabViewer from '$lib/components/EnhancedTabViewer.svelte';
	import ScrollControls from '$lib/components/ScrollControls.svelte';
	import preferences from '$lib/stores/preferences';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let currentTab = null;
	let tabContainer: HTMLDivElement;
	let showSettingsModal = false;
	let currentPosition = 0;

	$: id = $page.params.id;
	$: currentTab = $tabs.find((tab) => tab.id === id);

	function goBack() {
		goto('/');
	}

	function editTab() {
		goto(`/tab/${id}/edit`);
	}

	function handleScrollChange(event: CustomEvent<boolean>) {
		// If scrolling is active, update current position based on scroll
		if (event.detail && tabContainer) {
			const updatePositionInterval = setInterval(() => {
				// Calculate position based on scroll position
				currentPosition = tabContainer.scrollTop;
			}, 100);

			return () => clearInterval(updatePositionInterval);
		}
	}

	// Make sure we have access to the container after component is mounted
	onMount(() => {
		return () => {
			// Cleanup if needed
		};
	});
</script>

<svelte:head>
	<title>{currentTab?.title || 'Tab'} | TabScroll</title>
</svelte:head>

{#if currentTab}
	<div class="tab-view">
		<header>
			<button class="back-btn" on:click={goBack} aria-label="Back to home"> ← Back </button>
			<div class="title-container">
				<h1>{currentTab.title}</h1>
				{#if currentTab.artist || currentTab.album}
					<div class="tab-metadata">
						{#if currentTab.artist}<span class="artist">{currentTab.artist}</span>{/if}
						{#if currentTab.artist && currentTab.album}<span class="separator">·</span>{/if}
						{#if currentTab.album}<span class="album">{currentTab.album}</span>{/if}
					</div>
				{/if}
			</div>
			<div class="action-buttons">
				<SettingsButton on:click={() => (showSettingsModal = true)} />
				<button class="edit-btn" on:click={editTab} aria-label="Edit tab"> Edit </button>
			</div>
		</header>

		<div class="tab-container">
			<EnhancedTabViewer
				content={currentTab.content}
				fontSize={$preferences.fontSize}
				showChordDiagrams={true}
				{currentPosition}
				bind:container={tabContainer}
			/>
		</div>

		<div class="controls-container">
			<ScrollControls container={tabContainer} on:scrollStateChange={handleScrollChange} />
		</div>
	</div>
{:else}
	<div class="not-found">
		<h1>Tab Not Found</h1>
		<p>Sorry, the tab you're looking for doesn't exist or has been deleted.</p>
		<button on:click={goBack}>Back to Home</button>
	</div>
{/if}

<SettingsModal bind:open={showSettingsModal} />

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

	.artist,
	.album {
		font-weight: bold;
	}

	.separator {
		margin: 0 0.5rem;
	}

	.back-btn,
	.edit-btn {
		padding: 0.5rem 1rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
	}
	
	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.tab-container {
		flex: 1;
		overflow: hidden;
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
			padding: 0.3rem 0.6rem;
			font-size: 0.9rem;
		}
	}
</style>
