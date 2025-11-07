<script lang="ts">
	import { tabs } from '$lib/state/tabs.svelte';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { SettingsBottomSheet } from '$features/shared/components';
import { WebImportModal, ControlsRow, TabsList, EmptyState } from '$features/tabs/components';
	import type { Tab } from '$lib/state/tabs.svelte';

	type SortField = 'title' | 'artist' | 'updatedAt';
	type SortOrder = 'asc' | 'desc';

	let sortBy = $state<SortField>('updatedAt');
	let sortOrder = $state<SortOrder>('desc');
	let isSettingsModalOpen = $state(false);
let isWebImportOpen = $state(false);
let searchQuery = $state('');
let appVersion = $state('1.0.0');
let lastScrollTop = $state(0);

	// Get scroll visibility context from parent layout
	const scrollVisibility = getContext<{
		getVisible: () => boolean;
		hide: () => void;
		show: () => void;
		handleContainerScroll: (scrollTop: number, lastScroll: number) => void;
	}>('scrollVisibility');

	// Filter and sort tabs using $derived rune
	let sortedAndFilteredTabs = $derived(
		[...tabs.tabs]
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
	isWebImportOpen = true;
}

	function handleSearchChange(value: string) {
		searchQuery = value;
	}

	function closeSettingsModal() {
		isSettingsModalOpen = false;
	}

function closeWebImport() {
	isWebImportOpen = false;
}

	function handleWebImportSubmit(newTab: Tab) {
		const actualTabId = tabs.add(newTab);
		isWebImportOpen = false;
		setTimeout(() => {
			goto(`/tab/${actualTabId}`, {});
		}, 100);
	}

	function handleListScroll(event: Event) {
		const target = event.target as HTMLElement;
		const currentScroll = target.scrollTop;

		// Notify layout of scroll position changes
		scrollVisibility?.handleContainerScroll(currentScroll, lastScrollTop);

		lastScrollTop = currentScroll;
	}
</script>

<svelte:head>
	<title>My Guitar Tabs | TabScroll</title>
</svelte:head>

<main class="container">


	<div class="tabs-list-container">
		<ControlsRow
			bind:searchQuery
			onsearchchange={handleSearchChange}
			onaddtab={handleOpenAddTabPanel}
		/>

		{#if sortedAndFilteredTabs.length === 0}
			<EmptyState hasAnyTabs={tabs.tabs.length > 0} />
		{:else}
			<TabsList
				tabs={sortedAndFilteredTabs}
				{sortBy}
				{sortOrder}
				ontoggle={toggleSort}
				onselect={handleSelectTab}
				onscroll={handleListScroll}
			/>
		{/if}
	</div>
</main>

<SettingsBottomSheet open={isSettingsModalOpen} onclose={closeSettingsModal} />
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

	.tabs-list-container {
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
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.container {
			padding: var(--spacing-xs);
		}

		.tabs-list-container {
			border-radius: var(--radius-lg);
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.container {
			padding: var(--spacing-xs);
		}

		.tabs-list-container {
			border-radius: var(--radius-md);
		}
	}
</style>
