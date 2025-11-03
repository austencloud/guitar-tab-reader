<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import { SettingsModal } from '$features/shared/components';
	import {
		ImportTabModal,
		AITabGeneratorModal,
		WebImportModal,
		AddTabPanel
	} from '$features/tabs/components';
	import type { Tab } from '$lib/stores/tabs';

	let sortBy = 'updatedAt'; // 'updatedAt', 'title', 'artist'
	let sortOrder = 'desc'; // 'asc', 'desc'
	let isSettingsModalOpen = false;
	let isImportModalOpen = false;
	let isAIGeneratorOpen = false;
	let isWebImportOpen = false;
	let isAddTabPanelOpen = false;
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

	function handleOpenAddTabPanel() {
		isAddTabPanelOpen = true;
	}

	function handleCloseAddTabPanel() {
		isAddTabPanelOpen = false;
	}

	function handleAISearch() {
		isAddTabPanelOpen = false;
		isAIGeneratorOpen = true;
	}

	function handleURLImport() {
		isAddTabPanelOpen = false;
		isWebImportOpen = true;
	}

	function handlePasteImport() {
		isAddTabPanelOpen = false;
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

	function closeWebImport() {
		isWebImportOpen = false;
	}

	function handleWebImportSubmit(newTab: Tab) {
		tabs.add(newTab);
		isWebImportOpen = false;

		// Navigate to the newly imported tab
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

			<button class="add-tab-button" on:click={handleOpenAddTabPanel}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
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
				<span>Add Tab</span>
			</button>
		</div>

		{#if sortedAndFilteredTabs.length === 0}
			{#if $tabs.length === 0}
				<div class="empty-state">
					<h2>No tabs yet</h2>
					<p>Add your first guitar tab to get started</p>
					<button class="empty-add-btn" on:click={handleOpenAddTabPanel}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
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
						<span>Add Your First Tab</span>
					</button>
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

<AddTabPanel
	visible={isAddTabPanelOpen}
	onclose={handleCloseAddTabPanel}
	onAISearch={handleAISearch}
	onURLImport={handleURLImport}
	onPasteImport={handlePasteImport}
/>

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
<WebImportModal
	visible={isWebImportOpen}
	onclose={closeWebImport}
	onimport={handleWebImportSubmit}
/>

<style>
	.container {
		max-width: var(--container-lg);
		margin: 0 auto;
		padding: var(--spacing-md);
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title-container {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
	}

	h1 {
		margin: 0;
		font-size: clamp(var(--font-size-2xl), 4vw, var(--font-size-4xl));
		color: var(--color-text-primary);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--letter-spacing-tight);
	}

	.version {
		color: var(--color-text-tertiary);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		padding: 0.125rem 0.5rem;
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
	}

	.tabs-container {
		background-color: var(--color-surface);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-low);
	}

	.search-container {
		position: relative;
		flex: 1;
	}

	input[type='search'] {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		background-color: var(--color-background);
		color: var(--color-text-primary);
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	input[type='search']:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px var(--color-primary-dim), var(--glow-primary);
		transform: translateY(-1px);
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		fill: var(--color-text-tertiary);
		transition: var(--transition-colors);
		pointer-events: none;
	}

	input[type='search']:focus + .search-icon {
		fill: var(--color-primary);
	}

	.add-tab-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: 0.75rem var(--spacing-lg);
		border: none;
		border-radius: var(--radius-lg);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		box-shadow: var(--shadow-md);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.add-tab-button svg {
		flex-shrink: 0;
	}

	.add-tab-button:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.add-tab-button:active {
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
	}

	.add-tab-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
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
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-surface-low);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.sort-button {
		background: none;
		border: none;
		padding: var(--spacing-sm) var(--spacing-md);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		text-align: left;
		transition: var(--transition-all);
		border-radius: var(--radius-md);
		min-height: var(--touch-target-min);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wide);
	}

	.sort-button:hover {
		color: var(--color-text-primary);
		background-color: var(--color-hover);
		transform: translateY(-1px);
	}

	.sort-button:active {
		transform: translateY(0);
	}

	.sort-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.sort-indicator {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		color: var(--color-primary);
	}

	.last-update {
		text-align: right;
		justify-content: flex-end;
	}

	.tabs-items-container {
		overflow-y: auto;
		flex: 1;
		padding: var(--spacing-sm);
	}

	.tab-item {
		display: grid;
		grid-template-columns: 3fr 2fr 2fr;
		padding: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: var(--transition-all);
		animation: fadeIn 0.3s ease forwards;
		animation-delay: var(--delay);
		opacity: 0;
		min-height: var(--touch-target-comfortable);
		align-items: center;
		box-shadow: var(--shadow-sm);
	}

	.tab-item:hover {
		background-color: var(--color-surface-high);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary);
	}

	.tab-item:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.tab-item:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tab-title {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-artist {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-date {
		color: var(--color-text-tertiary);
		text-align: right;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
	}

	.empty-state,
	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl);
		text-align: center;
		flex: 1;
		color: var(--color-text-secondary);
		background: var(--color-surface);
	}

	.empty-state h2,
	.no-results h3 {
		margin: 0 0 var(--spacing-md);
		color: var(--color-text-primary);
		font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
		font-weight: var(--font-weight-bold);
	}

	.empty-state p,
	.no-results p {
		font-size: var(--font-size-base);
		margin: 0 0 var(--spacing-xl) 0;
	}

	.empty-add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		padding: 1.25rem var(--spacing-2xl);
		border: none;
		border-radius: var(--radius-xl);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-lg);
		min-height: var(--touch-target-comfortable);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
	}

	.empty-add-btn svg {
		flex-shrink: 0;
	}

	.empty-add-btn:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-3px);
		box-shadow: var(--shadow-xl), var(--glow-primary);
	}

	.empty-add-btn:active {
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
	}

	.empty-add-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
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

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.container {
			padding: var(--spacing-sm);
			gap: var(--spacing-md);
		}

		h1 {
			font-size: 1.5rem;
		}

		.controls-row {
			padding: var(--spacing-md);
		}

		.add-tab-button {
			padding: 0.75rem var(--spacing-md);
			font-size: var(--font-size-sm);
		}

		.tabs-header {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.tabs-header,
		.tab-item {
			grid-template-columns: 2fr 1.5fr 1fr;
		}

		.tabs-items-container {
			padding: var(--spacing-xs);
		}

		.tab-item {
			padding: var(--spacing-md);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.container {
			padding: var(--spacing-xs);
		}

		.title-container {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		h1 {
			font-size: 1.25rem;
		}

		.version {
			font-size: 0.625rem;
		}

		.tabs-container {
			border-radius: var(--radius-lg);
		}

		.controls-row {
			padding: var(--spacing-sm);
			gap: var(--spacing-sm);
		}

		input[type='search'] {
			padding: 0.75rem 0.875rem 0.75rem 2.5rem;
			font-size: var(--font-size-sm);
		}

		.search-icon {
			left: 0.75rem;
			width: 18px;
			height: 18px;
		}

		/* Hide button text on mobile, show icon only */
		.add-tab-button span {
			display: none;
		}

		.add-tab-button {
			padding: 0.75rem;
			min-width: var(--touch-target-min);
		}

		.add-tab-button svg {
			width: 22px;
			height: 22px;
		}

		/* Hide date column on mobile */
		.tabs-header,
		.tab-item {
			grid-template-columns: 1.5fr 1fr;
		}

		.sort-button.last-update,
		.tab-date {
			display: none;
		}

		.sort-button {
			padding: var(--spacing-xs) var(--spacing-sm);
			font-size: 0.625rem;
		}

		.tabs-items-container {
			padding: 0.25rem;
		}

		.tab-item {
			padding: var(--spacing-sm) var(--spacing-md);
			margin-bottom: 0.25rem;
			border-radius: var(--radius-md);
		}

		.tab-title {
			font-size: var(--font-size-sm);
		}

		.tab-artist {
			font-size: var(--font-size-xs);
		}

		/* Empty state mobile optimization */
		.empty-state,
		.no-results {
			padding: var(--spacing-xl) var(--spacing-md);
		}

		.empty-add-btn {
			padding: 1rem var(--spacing-xl);
			font-size: var(--font-size-base);
		}
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		h1 {
			font-size: 1.125rem;
		}

		.version {
			font-size: 0.5rem;
		}

		.controls-row {
			padding: 0.5rem;
		}

		.add-tab-button {
			padding: 0.625rem;
			min-width: 42px;
		}

		.add-tab-button svg {
			width: 20px;
			height: 20px;
		}

		.tab-title {
			font-size: 0.8125rem;
		}

		.tab-artist {
			font-size: 0.625rem;
		}

		.empty-add-btn {
			padding: 0.875rem var(--spacing-lg);
			font-size: var(--font-size-sm);
		}

		.empty-add-btn svg {
			width: 24px;
			height: 24px;
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.container {
			padding: var(--spacing-xs);
		}

		.tabs-container {
			border-radius: var(--radius-md);
		}

		.controls-row {
			padding: var(--spacing-sm);
		}

		.empty-state,
		.no-results {
			padding: var(--spacing-md);
		}

		.empty-add-btn {
			padding: 0.75rem var(--spacing-lg);
			font-size: var(--font-size-sm);
		}
	}
</style>
