<script lang="ts">
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import { SettingsBottomSheet } from '$features/shared/components';
	import {
		ImportTabModal,
		WebImportModal,
		AddTabBottomSheet,
		ControlsRow,
		TabsList,
		EmptyState
	} from '$features/tabs/components';
	import type { Tab } from '$lib/stores/tabs';

	type SortField = 'title' | 'artist' | 'updatedAt';
	type SortOrder = 'asc' | 'desc';

	let sortBy = $state<SortField>('updatedAt');
	let sortOrder = $state<SortOrder>('desc');
	let isSettingsModalOpen = $state(false);
	let isImportModalOpen = $state(false);
	let isWebImportOpen = $state(false);
	let isAddTabPanelOpen = $state(false);
	let searchQuery = $state('');
	let appVersion = $state('1.0.0');

	// Filter and sort tabs using $derived rune
	let sortedAndFilteredTabs = $derived(
		[...$tabs]
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
						const artistA = a.artist || '';
						const artistB = b.artist || '';
						comparison = artistA.localeCompare(artistB);
						break;
					}
					case 'updatedAt': {
						const dateA = new Date(a.updatedAt ?? 0).getTime();
						const dateB = new Date(b.updatedAt ?? 0).getTime();
						comparison = dateA - dateB;
						break;
					}
				}
				return sortOrder === 'asc' ? comparison : -comparison;
			})
	);

	function toggleSort(field: SortField) {
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
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}

	function handleSearchChange(value: string) {
		searchQuery = value;
	}

	function closeSettingsModal() {
		isSettingsModalOpen = false;
	}

	function closeImportModal() {
		isImportModalOpen = false;
	}

	function closeWebImport() {
		isWebImportOpen = false;
	}

	function handleWebImportSubmit(newTab: Tab) {
		tabs.add(newTab);
		isWebImportOpen = false;
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}
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
		<ControlsRow
			bind:searchQuery
			onsearchchange={handleSearchChange}
			onaddtab={handleOpenAddTabPanel}
		/>

		{#if sortedAndFilteredTabs.length === 0}
			<EmptyState hasAnyTabs={$tabs.length > 0} />
		{:else}
			<TabsList
				tabs={sortedAndFilteredTabs}
				{sortBy}
				{sortOrder}
				ontoggle={toggleSort}
				onselect={handleSelectTab}
			/>
		{/if}
	</div>
</main>

<AddTabBottomSheet
	open={isAddTabPanelOpen}
	onclose={handleCloseAddTabPanel}
	onURLImport={handleURLImport}
	onPasteImport={handlePasteImport}
/>

<SettingsBottomSheet open={isSettingsModalOpen} onclose={closeSettingsModal} />
<ImportTabModal
	open={isImportModalOpen}
	onclose={closeImportModal}
	onimport={handleImportSubmit}
/>
<WebImportModal
	open={isWebImportOpen}
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

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.container {
			padding: var(--spacing-sm);
			gap: var(--spacing-md);
		}

		h1 {
			font-size: 1.5rem;
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
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		h1 {
			font-size: 1.125rem;
		}

		.version {
			font-size: 0.5rem;
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
	}
</style>
