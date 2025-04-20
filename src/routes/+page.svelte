<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ImportTabModal from '$lib/components/ImportTabModal.svelte';
	import type { Tab } from '$lib/stores/tabs';

	let searchTerm = '';
	let sortBy = 'updatedAt'; // 'updatedAt', 'title', 'artist'
	let sortOrder = 'desc'; // 'asc', 'desc'
	let isSettingsModalOpen = false;
	let isImportModalOpen = false;
	let searchQuery = '';
	let appVersion = '1.0.0';

	// Extract unique values for filtering
	$: artists = [...new Set($tabs.map((tab) => tab.artist).filter(Boolean))];
	$: albums = [...new Set($tabs.map((tab) => tab.album).filter(Boolean))];

	// Filter and sort tabs
	$: sortedAndFilteredTabs = [...$tabs]
		.filter((tab) => {
			if (!searchQuery) return true;
			const query = searchQuery.toLowerCase();
			return (
				tab.title.toLowerCase().includes(query) ||
				(tab.artist && tab.artist.toLowerCase().includes(query)) ||
				(tab.album && tab.album.toLowerCase().includes(query))
			);
		})
		.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'title':
					comparison = a.title.localeCompare(b.title);
					break;
				case 'artist':
					// Handle potential undefined artists
					const artistA = a.artist || '';
					const artistB = b.artist || '';
					comparison = artistA.localeCompare(artistB);
					break;
				case 'updatedAt':
					// Provide a default value (e.g., 0) if updatedAt is undefined
					const dateA = new Date(a.updatedAt ?? 0).getTime();
					const dateB = new Date(b.updatedAt ?? 0).getTime();
					comparison = dateA - dateB;
					break;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});

	function toggleSort(field: 'title' | 'artist' | 'updatedAt') {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}

	function handleSelectTab(id: string) {
		goto(`/tab/${id}`, {});
	}

	function handleCreateNewTab() {
		goto('/new', {});
	}

	function handleImportTab() {
		isImportModalOpen = true;
	}

	function handleImportSubmit(event: CustomEvent<Tab>) {
		const newTab = event.detail;
		tabs.add(newTab);
		isImportModalOpen = false;

		// Navigate to the newly imported tab
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}

	onMount(async () => {
		try {
			// Try to get version from package.json
			const response = await fetch('/package.json');
			if (response.ok) {
				const pkg = await response.json();
				appVersion = pkg.version || '1.0.0';
			}
		} catch (error) {
			console.error('Failed to load version:', error);
		}
	});
</script>

<svelte:head>
	<title>My Guitar Tabs | TabScroll</title>
</svelte:head>

<main class="container">
	<header>
		<div class="title-container">
			<h1>TabScroll</h1>
			<span class="version">{appVersion}</span>
		</div>
		<SettingsButton on:click={() => (isSettingsModalOpen = true)} />
	</header>

	<div class="tabs-container">
		<div class="controls-row">
			<div class="search-container">
				<input
					type="search"
					placeholder="Search tabs..."
					bind:value={searchQuery}
					aria-label="Search tabs"
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="20"
					height="20"
					class="search-icon"
				>
					<path
						d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
					/>
				</svg>
			</div>

			<div class="action-buttons">
				<button class="import-button" on:click={handleImportTab}>
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
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="17 8 12 3 7 8"></polyline>
						<line x1="12" y1="3" x2="12" y2="15"></line>
					</svg>
					<span>Import Tab</span>
				</button>

				<button class="new-tab-button" on:click={handleCreateNewTab}>
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
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					<span>New Tab</span>
				</button>
			</div>
		</div>

		{#if sortedAndFilteredTabs.length === 0}
			{#if $tabs.length === 0}
				<div class="empty-state">
					<h2>No tabs yet</h2>
					<p>Create a new tab or import one to get started</p>
					<div class="empty-actions">
						<button class="empty-import-btn" on:click={handleImportTab}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="17 8 12 3 7 8"></polyline>
								<line x1="12" y1="3" x2="12" y2="15"></line>
							</svg>
							<span>Import a Tab</span>
						</button>

						<button class="empty-create-btn" on:click={handleCreateNewTab}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
							<span>Create New Tab</span>
						</button>
					</div>
				</div>
			{:else}
				<div class="no-results">
					<h3>No matching tabs found</h3>
					<p>Try a different search term</p>
				</div>
			{/if}
		{:else}
			<div class="tabs-list">
				<div class="tabs-header">
					<button class="sort-button" on:click={() => toggleSort('title')}>
						Title
						{#if sortBy === 'title'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
					<button class="sort-button" on:click={() => toggleSort('artist')}>
						Artist
						{#if sortBy === 'artist'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
					<button class="sort-button last-update" on:click={() => toggleSort('updatedAt')}>
						Last Updated
						{#if sortBy === 'updatedAt'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				</div>

				<div class="tabs-items-container">
					{#each sortedAndFilteredTabs as tab, idx (tab.id)}
						<div
							class="tab-item"
							transition:fade={{ duration: 150 }}
							style="--delay: {idx * 50}ms"
							on:click={() => handleSelectTab(tab.id)}
							on:keydown={(e) => e.key === 'Enter' && handleSelectTab(tab.id)}
							tabindex="0"
							role="button"
							aria-label="Open tab: {tab.title}"
						>
							<div class="tab-title">{tab.title}</div>
							<div class="tab-artist">{tab.artist || '-'}</div>
							<div class="tab-date">
								{new Date(tab.updatedAt ?? 0).toLocaleDateString(undefined, {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</main>

<SettingsModal bind:open={isSettingsModalOpen} />
<ImportTabModal bind:visible={isImportModalOpen} on:import={handleImportSubmit} />

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.title-container {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-text-primary, #333);
		font-weight: 600;
	}

	.version {
		color: var(--color-text-secondary, #666);
		font-size: 0.9rem;
	}

	.tabs-container {
		background-color: var(--color-surface, #fff);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, #eee);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-container {
		position: relative;
		flex: 1;
		min-width: 200px;
	}

	input[type='search'] {
		width: 100%;
		padding: 0.5rem 0.5rem 0.5rem 2.5rem;
		border: 1px solid var(--color-border, #eee);
		border-radius: 4px;
		font-size: 1rem;
		background-color: var(--color-background, #fff);
		color: var(--color-text-primary, #333);
	}

	input[type='search']:focus {
		border-color: var(--color-primary, #4caf50);
		outline: none;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		fill: var(--color-text-secondary, #666);
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.new-tab-button,
	.import-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.1s;
	}

	.new-tab-button {
		background-color: var(--color-primary, #4caf50);
		color: white;
	}

	.import-button {
		background-color: var(--color-secondary, #3f51b5);
		color: white;
	}

	.new-tab-button:hover,
	.import-button:hover {
		opacity: 0.9;
	}

	.new-tab-button:active,
	.import-button:active {
		transform: scale(0.98);
	}

	.tabs-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.tabs-header {
		display: grid;
		grid-template-columns: 3fr 2fr 2fr;
		padding: 0.75rem 1rem;
		background-color: var(--color-surface-variant, #f5f5f5);
		border-bottom: 1px solid var(--color-border, #eee);
	}

	.sort-button {
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		font-weight: 600;
		color: var(--color-text-secondary, #666);
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		text-align: left;
	}

	.sort-button:hover {
		color: var(--color-text-primary, #333);
	}

	.sort-indicator {
		font-size: 0.8rem;
	}

	.last-update {
		text-align: right;
		justify-content: flex-end;
	}

	.tabs-items-container {
		overflow-y: auto;
		flex: 1;
	}

	.tab-item {
		display: grid;
		grid-template-columns: 3fr 2fr 2fr;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #eee);
		cursor: pointer;
		transition: background-color 0.2s;
		animation: fadeIn 0.3s ease forwards;
		animation-delay: var(--delay);
		opacity: 0;
	}

	.tab-item:hover {
		background-color: var(--color-hover, #f9f9f9);
	}

	.tab-title {
		font-weight: 500;
		color: var(--color-text-primary, #333);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-artist {
		color: var(--color-text-secondary, #666);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-date {
		color: var(--color-text-secondary, #666);
		text-align: right;
		font-size: 0.9rem;
	}

	.empty-state,
	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		flex: 1;
		color: var(--color-text-secondary, #666);
	}

	.empty-state h2,
	.no-results h3 {
		margin-bottom: 0.5rem;
		color: var(--color-text-primary, #333);
	}

	.empty-actions {
		margin-top: 2rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.empty-create-btn,
	.empty-import-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.empty-create-btn {
		background-color: var(--color-primary, #4caf50);
		color: white;
	}

	.empty-import-btn {
		background-color: var(--color-secondary, #3f51b5);
		color: white;
	}

	.empty-create-btn:hover,
	.empty-import-btn:hover {
		transform: translateY(-2px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.action-buttons {
			width: 100%;
		}

		.new-tab-button,
		.import-button {
			flex: 1;
			justify-content: center;
		}

		.tabs-header,
		.tab-item {
			grid-template-columns: 1.5fr 1fr;
		}

		.sort-button.last-update,
		.tab-date {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.empty-actions {
			flex-direction: column;
			gap: 1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		input[type='search'] {
			background-color: #333;
			color: #e0e0e0;
			border-color: #555;
		}

		.empty-state {
			background-color: #333;
			color: #bbb;
		}

		.tab-item {
			background-color: #2d2d2d;
			border-color: #444;
		}

		.tab-item:hover {
			background-color: #3a3a3a;
		}
	}
</style>
