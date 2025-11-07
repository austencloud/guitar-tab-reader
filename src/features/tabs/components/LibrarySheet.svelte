<script lang="ts">
	import { tabs } from '$lib/state/tabs.svelte';
	import { goto } from '$app/navigation';
	import { Plus, X } from 'lucide-svelte';
	import type { Tab } from '$lib/state/tabs.svelte';

	interface Props {
		open: boolean;
		currentTabId?: string;
		onclose: () => void;
		onopenAddTab: () => void;
	}

	let { open = $bindable(false), currentTabId, onclose, onopenAddTab }: Props = $props();

	type SortField = 'title' | 'artist' | 'updatedAt';
	type SortOrder = 'asc' | 'desc';

	let sortBy = $state<SortField>('updatedAt');
	let sortOrder = $state<SortOrder>('desc');
	let searchQuery = $state('');

	// Filter and sort tabs
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
				let aVal: string | number;
				let bVal: string | number;

				switch (sortBy) {
					case 'title':
						aVal = a.title.toLowerCase();
						bVal = b.title.toLowerCase();
						break;
					case 'artist':
						aVal = (a.artist || '').toLowerCase();
						bVal = (b.artist || '').toLowerCase();
						break;
					case 'updatedAt':
						aVal = a.updatedAt ?? a.createdAt;
						bVal = b.updatedAt ?? b.createdAt;
						break;
					default:
						return 0;
				}

				if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
				if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
				return 0;
			})
	);

	function handleClose() {
		onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleSelectTab(tabId: string) {
		goto(`/tab/${tabId}`);
		handleClose();
	}

	function handleAddTab() {
		handleClose();
		onopenAddTab();
	}

	function toggleSort(field: SortField) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}
</script>

{#if open}
	<div class="sheet-backdrop" onclick={handleBackdropClick} role="presentation">
		<div class="sheet-container" role="dialog" aria-modal="true" aria-labelledby="library-title">
			<!-- Header -->
			<div class="sheet-header">
				<button class="add-button" onclick={handleAddTab} aria-label="Add new tab">
					<Plus size={20} />
					<span>Add Tab</span>
				</button>
				<h2 id="library-title">My Library</h2>
				<button class="close-button" onclick={handleClose} aria-label="Close library">
					<X size={24} />
				</button>
			</div>

			<!-- Search Bar -->
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

			<!-- Tabs List -->
			<div class="tabs-list">
				<!-- Sort Header -->
				<div class="tabs-header">
					<button class="sort-button" onclick={() => toggleSort('title')}>
						Title
						{#if sortBy === 'title'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
					<button class="sort-button" onclick={() => toggleSort('artist')}>
						Artist
						{#if sortBy === 'artist'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
					<button class="sort-button last-update" onclick={() => toggleSort('updatedAt')}>
						Updated
						{#if sortBy === 'updatedAt'}
							<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				</div>

				<!-- Tab Items -->
				<div class="tabs-items">
					{#if sortedAndFilteredTabs.length === 0}
						<div class="empty-state">
							{#if tabs.tabs.length === 0}
								<p>No tabs yet. Tap "Add Tab" to get started!</p>
							{:else}
								<p>No matching tabs found</p>
							{/if}
						</div>
					{:else}
						{#each sortedAndFilteredTabs as tab (tab.id)}
							<button
								class="tab-item"
								class:active={currentTabId === tab.id}
								onclick={() => handleSelectTab(tab.id)}
							>
								<div class="tab-info">
									<div class="tab-title">{tab.title}</div>
									<div class="tab-artist">{tab.artist || 'Unknown Artist'}</div>
								</div>
								<div class="tab-date">
									{new Date(tab.updatedAt ?? tab.createdAt).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric'
									})}
								</div>
								{#if currentTabId === tab.id}
									<div class="now-playing-badge">Now Playing</div>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.sheet-container {
		width: 100%;
		max-height: 85vh;
		background: var(--color-surface);
		border-radius: 24px 24px 0 0;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1rem 1rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.sheet-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		flex: 1;
		text-align: center;
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-button:hover {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
	}

	.add-button:active {
		transform: translateY(0);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: transparent;
		border: none;
		border-radius: 50%;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: var(--color-surface-high);
		color: var(--color-text-primary);
	}

	.search-container {
		position: relative;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.search-container input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 1px solid var(--color-border);
		border-radius: 12px;
		font-size: 1rem;
		background: var(--color-background);
		color: var(--color-text-primary);
	}

	.search-container input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-dim);
	}

	.search-icon {
		position: absolute;
		left: 2rem;
		top: 50%;
		transform: translateY(-50%);
		fill: var(--color-text-tertiary);
		pointer-events: none;
	}

	.tabs-list {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.tabs-header {
		display: grid;
		grid-template-columns: 2fr 1.5fr 1fr;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-surface-low);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.sort-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: transparent;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: color 0.2s;
	}

	.sort-button:hover {
		color: var(--color-text-primary);
	}

	.sort-indicator {
		font-size: 0.75rem;
	}

	.tabs-items {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.tab-item {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-surface-high);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		position: relative;
		align-items: center;
	}

	.tab-item:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.tab-item.active {
		border-color: var(--color-primary);
		background: var(--color-primary-dim);
	}

	.tab-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.tab-title {
		font-weight: 500;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tab-artist {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-style: italic;
	}

	.tab-date {
		color: var(--color-text-tertiary);
		font-size: 0.875rem;
		text-align: right;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.now-playing-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-primary);
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 6px;
	}

	.empty-state {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-secondary);
	}

	@media (max-width: 768px) {
		.last-update {
			display: none;
		}

		.tabs-header,
		.tab-item {
			grid-template-columns: 2fr 1.5fr;
		}

		.tab-date {
			display: none;
		}
	}
</style>

