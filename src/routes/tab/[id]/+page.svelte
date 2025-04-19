<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import TabViewer from '$lib/components/TabViewer.svelte';
	import ScrollControls from '$lib/components/ScrollControls.svelte';

	let currentTab = null;
	let tabViewer;
	let tabContainer: HTMLDivElement;
	let fontSize = 16;

	$: id = $page.params.id;
	$: currentTab = $tabs.find((tab) => tab.id === id);

	function goBack() {
		goto('/');
	}

	function editTab() {
		goto(`/tab/${id}/edit`);
	}

	function handleFontSizeChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		fontSize = parseInt(input.value);
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
			<button class="back-btn" on:click={goBack}> ← Back </button>
			<h1>{currentTab.title}</h1>
			<button class="edit-btn" on:click={editTab}> Edit </button>
		</header>

		<div class="font-size-control">
			<label>
				Font size: {fontSize}px
				<input
					type="range"
					min="12"
					max="24"
					step="1"
					bind:value={fontSize}
					on:input={handleFontSizeChange}
				/>
			</label>
		</div>

		<div class="tab-container">
			<TabViewer content={currentTab.content} {fontSize} bind:container={tabContainer} />
		</div>

		<div class="controls-container">
			<ScrollControls container={tabContainer} />
		</div>
	</div>
{:else}
	<div class="not-found">
		<h1>Tab Not Found</h1>
		<p>Sorry, the tab you're looking for doesn't exist or has been deleted.</p>
		<button on:click={goBack}>Back to Home</button>
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

	.back-btn,
	.edit-btn {
		padding: 0.5rem 1rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
	}

	.font-size-control {
		padding: 0.5rem 1rem;
		display: flex;
		justify-content: center;
		border-bottom: 1px solid #eee;
	}

	.font-size-control label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.font-size-control input {
		width: 150px;
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

		.font-size-control {
			border-color: #444;
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

		.font-size-control {
			padding: 0.3rem 0.5rem;
		}
	}
</style>
