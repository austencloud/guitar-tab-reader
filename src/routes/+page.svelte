<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import { SettingsModal } from '$features/shared/components';
	import { ImportTabModal, AITabGeneratorModal } from '$features/tabs/components';
	import type { Tab } from '$lib/stores/tabs';

	let sortBy = 'updatedAt'; // 'updatedAt', 'title', 'artist'
	let sortOrder = 'desc'; // 'asc', 'desc'
	let isSettingsModalOpen = false;
	let isImportModalOpen = false;
	let isAIGeneratorOpen = false;
	let searchQuery = '';
	let appVersion = '1.0.0';

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
				case 'title': {
					comparison = a.title.localeCompare(b.title);
					break;
				}
				case 'artist': {
					// Handle potential undefined artists
					const artistA = a.artist || '';
					const artistB = b.artist || '';
					comparison = artistA.localeCompare(artistB);
					break;
				}
				case 'updatedAt': {
					// Provide a default value (e.g., 0) if updatedAt is undefined
					const dateA = new Date(a.updatedAt ?? 0).getTime();
					const dateB = new Date(b.updatedAt ?? 0).getTime();
					comparison = dateA - dateB;
					break;
				}
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

	function handleImportSubmit(newTab: Tab) {
		tabs.add(newTab);
		isImportModalOpen = false;

		// Navigate to the newly imported tab
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}

	function closeSettingsModal() {
		isSettingsModalOpen = false;
	}

	function closeImportModal() {
		isImportModalOpen = false;
	}

	function handleAIGenerator() {
		isAIGeneratorOpen = true;
	}

	function closeAIGenerator() {
		isAIGeneratorOpen = false;
	}

	function handleAIGeneratedTab(newTab: Tab) {
		tabs.add(newTab);
		isAIGeneratorOpen = false;

		// Navigate to the newly generated tab
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}

	onMount(async () => {
		// Set a static version instead of fetching package.json
		appVersion = '1.0.0';
	});
</script>

<svelte:head>
	<title>My Guitar Tabs | TabScroll</title>
</svelte:head>

<main class="container">
	<header>
		<div class="title-container">
			<h1>Tab Scroll</h1>
			<span class="version">{appVersion}</span>
		</div>
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
				<button class="ai-generate-button" on:click={handleAIGenerator}>
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
						<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
					</svg>
					<span>AI Generate</span>
				</button>

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
					<p>Generate with AI, import, or create a tab to get started</p>
					<div class="empty-actions">
						<button class="empty-ai-btn" on:click={handleAIGenerator}>
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
								<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
							</svg>
							<span>Generate with AI</span>
						</button>

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

<SettingsModal open={isSettingsModalOpen} onclose={closeSettingsModal} />
<ImportTabModal
	visible={isImportModalOpen}
	onclose={closeImportModal}
	onimport={handleImportSubmit}
/>
<AITabGeneratorModal
	visible={isAIGeneratorOpen}
	onclose={closeAIGenerator}
	onimport={handleAIGeneratedTab}
/>

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
		font-size: var(--font-size-2xl);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.version {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.tabs-container {
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: var(--transition-colors);
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		gap: var(--spacing-md);
		flex-wrap: wrap;
		background-color: var(--color-surface);
		transition: var(--transition-colors);
	}

	.search-container {
		position: relative;
		flex: 1;
		min-width: 200px;
	}

	input[type='search'] {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 2.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-base);
		background-color: var(--color-background);
		color: var(--color-text-primary);
		transition: var(--transition-colors);
	}

	input[type='search']:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		fill: var(--color-text-secondary);
		transition: var(--transition-colors);
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
	}

	.new-tab-button,
	.import-button,
	.ai-generate-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		border-radius: var(--radius-sm);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.new-tab-button {
		background-color: var(--color-primary);
		color: var(--color-text-inverse);
	}

	.import-button {
		background-color: var(--color-secondary);
		color: var(--color-text-inverse);
	}

	.ai-generate-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		position: relative;
		overflow: hidden;
	}

	.ai-generate-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.ai-generate-button:hover::before {
		left: 100%;
	}

	.new-tab-button:hover {
		background-color: var(--color-primary-hover);
	}

	.import-button:hover {
		background-color: var(--color-secondary-hover);
	}

	.ai-generate-button:hover {
		background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.new-tab-button:active {
		background-color: var(--color-primary-active);
		transform: scale(0.98);
	}

	.import-button:active {
		background-color: var(--color-secondary-active);
		transform: scale(0.98);
	}

	.ai-generate-button:active {
		transform: scale(0.98) translateY(0);
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
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-surface-variant);
		border-bottom: 1px solid var(--color-border);
		transition: var(--transition-colors);
	}

	.sort-button {
		background: none;
		border: none;
		padding: var(--spacing-xs) var(--spacing-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		cursor: pointer;
		text-align: left;
		transition: var(--transition-colors);
		border-radius: var(--radius-sm);
	}

	.sort-button:hover {
		color: var(--color-text-primary);
		background-color: var(--color-hover);
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
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		transition: var(--transition-colors);
		animation: fadeIn 0.3s ease forwards;
		animation-delay: var(--delay);
		opacity: 0;
	}

	.tab-item:hover {
		background-color: var(--color-hover);
	}

	.tab-title {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-artist {
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-date {
		color: var(--color-text-secondary);
		text-align: right;
		font-size: var(--font-size-sm);
	}

	.empty-state,
	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl) var(--spacing-md);
		text-align: center;
		flex: 1;
		color: var(--color-text-secondary);
		background-color: var(--color-surface);
		transition: var(--transition-colors);
	}

	.empty-state h2,
	.no-results h3 {
		margin-bottom: var(--spacing-sm);
		color: var(--color-text-primary);
	}

	.empty-actions {
		margin-top: var(--spacing-xl);
		display: flex;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		justify-content: center;
	}

	.empty-create-btn,
	.empty-import-btn,
	.empty-ai-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-lg);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-sm);
	}

	.empty-create-btn {
		background-color: var(--color-primary);
		color: var(--color-text-inverse);
	}

	.empty-import-btn {
		background-color: var(--color-secondary);
		color: var(--color-text-inverse);
	}

	.empty-ai-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		position: relative;
		overflow: hidden;
	}

	.empty-ai-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.empty-ai-btn:hover::before {
		left: 100%;
	}

	.empty-create-btn:hover {
		background-color: var(--color-primary-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.empty-import-btn:hover {
		background-color: var(--color-secondary-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.empty-ai-btn:hover {
		background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
			gap: var(--spacing-md);
		}
	}
</style>
