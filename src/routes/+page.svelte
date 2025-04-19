<script lang="ts">
	import { tabs } from '$lib/stores/tabs';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	let searchTerm = '';
	let sortBy = 'date'; // 'date', 'title', 'artist', 'album'
	let sortOrder = 'desc'; // 'asc', 'desc'

	// Extract unique values for filtering
	$: artists = [...new Set($tabs.map((tab) => tab.artist).filter(Boolean))];
	$: albums = [...new Set($tabs.map((tab) => tab.album).filter(Boolean))];

	// Filter tabs based on search term
	$: filteredTabs = searchTerm
		? $tabs.filter(
				(tab) =>
					tab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(tab.artist?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
					(tab.album?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
					tab.content.toLowerCase().includes(searchTerm.toLowerCase())
			)
		: $tabs;

	// Sort tabs based on selected sort criteria
	$: sortedTabs = [...filteredTabs].sort((a, b) => {
		if (sortBy === 'date') {
			return sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
		} else if (sortBy === 'title') {
			return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
		} else if (sortBy === 'artist') {
			const aArtist = a.artist || '';
			const bArtist = b.artist || '';
			return sortOrder === 'asc' ? aArtist.localeCompare(bArtist) : bArtist.localeCompare(aArtist);
		} else if (sortBy === 'album') {
			const aAlbum = a.album || '';
			const bAlbum = b.album || '';
			return sortOrder === 'asc' ? aAlbum.localeCompare(bAlbum) : bAlbum.localeCompare(aAlbum);
		}
		return 0;
	});

	function viewTab(id: string) {
		goto(`/tab/${id}`);
	}

	function createNewTab() {
		goto('/new');
	}

	function deleteTab(id: string, event: Event) {
		event.stopPropagation();
		if (confirm('Are you sure you want to delete this tab?')) {
			tabs.delete(id);
		}
	}

	// Extract tab content for preview (without tuning info)
	function getTabPreview(content: string): string {
		// Skip the tuning lines (usually first 6-7 lines in tablature)
		const lines = content.split('\n');

		// Find first line that isn't part of tuning info or empty
		let startIdx = 0;
		const tuningPattern = /^[eEADGBbf][\|:]|^\||-{5,}/;

		// Skip past likely tuning info
		while (
			startIdx < lines.length &&
			(lines[startIdx].trim() === '' || tuningPattern.test(lines[startIdx]))
		) {
			startIdx++;
		}

		// Get a couple of content lines
		return lines.slice(startIdx, startIdx + 2).join('\n');
	}
</script>

<svelte:head>
	<title>TabScroll - Your Guitar Tabs</title>
</svelte:head>

<div class="container">
	<header>
		<h1>TabScroll</h1>
		<p class="tagline">Your portable guitar tab reader</p>
	</header>

	<div class="actions">
		<div class="search-container">
			<input
				type="text"
				bind:value={searchTerm}
				placeholder="Search tabs..."
				class="search-input"
			/>
		</div>

		<button class="new-tab-btn" on:click={createNewTab}> New Tab </button>
	</div>

	<div class="sort-options">
		<div class="sort-field">
			<label for="sort-by">Sort by</label>
			<select id="sort-by" bind:value={sortBy} class="sort-select">
				<option value="date">Date</option>
				<option value="title">Title</option>
				<option value="artist">Artist</option>
				<option value="album">Album</option>
			</select>
		</div>

		<div class="sort-field">
			<label for="sort-order">Order</label>
			<select id="sort-order" bind:value={sortOrder} class="sort-select">
				<option value="desc">Descending</option>
				<option value="asc">Ascending</option>
			</select>
		</div>
	</div>

	<div class="tabs-container">
		{#if sortedTabs.length === 0}
			<div class="empty-state">
				{searchTerm ? 'No tabs match your search' : 'No tabs yet. Create your first one!'}
			</div>
		{:else}
			<ul class="tabs-list">
				{#each sortedTabs as tab (tab.id)}
					<li>
						<div class="tab-item-wrapper">
							<button
								type="button"
								class="tab-item"
								on:click={() => viewTab(tab.id)}
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										viewTab(tab.id);
									}
								}}
								tabindex="0"
							>
								<div class="tab-info">
									<h3 class="tab-title">{tab.title}</h3>
									<p class="tab-date">
										{new Date(tab.createdAt).toLocaleDateString()}
									</p>
								</div>

								{#if tab.artist || tab.album}
									<div class="tab-metadata">
										{#if tab.artist}<span class="artist">{tab.artist}</span>{/if}
										{#if tab.artist && tab.album}<span class="separator">·</span>{/if}
										{#if tab.album}<span class="album">{tab.album}</span>{/if}
									</div>
								{/if}

								<div class="tab-preview">
									<pre>{getTabPreview(tab.content)}</pre>
								</div>
							</button>
							<button
								class="delete-btn"
								on:click={(e) => deleteTab(tab.id, e)}
								aria-label="Delete tab"
								type="button"
							>
								×
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.tagline {
		color: #666;
		font-style: italic;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.search-container {
		flex-grow: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.new-tab-btn {
		padding: 0.75rem 1.5rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.tabs-container {
		margin-top: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background-color: #f9f9f9;
		border-radius: 8px;
		color: #666;
	}

	.tabs-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.tab-item-wrapper {
		position: relative;
		margin-bottom: 1rem;
	}

	.tab-item {
		position: relative;
		padding: 1rem;
		border: 1px solid #eee;
		border-radius: 8px;
		cursor: pointer;
		transition:
			transform 0.1s,
			box-shadow 0.1s;
		background-color: white;
		overflow: hidden;
		width: 100%;
		text-align: left;
	}

	.tab-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.tab-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.tab-title {
		margin: 0;
		font-size: 1.2rem;
	}

	.tab-date {
		color: #888;
		font-size: 0.8rem;
		margin: 0;
	}

	.tab-preview {
		max-height: 80px;
		overflow: hidden;
		position: relative;
	}

	.tab-preview pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		overflow: hidden;
		white-space: pre;
	}

	.tab-preview::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 20px;
		background: linear-gradient(transparent, white);
	}

	.delete-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: #f44336;
		color: white;
		border: none;
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s;
		z-index: 1; /* Ensure the button stays above other elements */
	}

	.sort-options {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.sort-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sort-field label {
		font-size: 0.8rem;
		color: #666;
	}

	.sort-select {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: white;
		font-size: 0.9rem;
	}

	.tab-metadata {
		margin-top: -0.25rem;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
		color: #555;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.artist {
		font-weight: 500;
	}

	.album {
		font-style: italic;
	}

	.separator {
		color: #999;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.tagline {
			color: #aaa;
		}

		.search-input {
			background-color: #333;
			color: white;
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

		.tab-date {
			color: #aaa;
		}

		.tab-preview::after {
			background: linear-gradient(transparent, #2d2d2d);
		}

		.sort-field label {
			color: #aaa;
		}

		.sort-select {
			background-color: #333;
			color: white;
			border-color: #555;
		}

		.tab-metadata {
			color: #bbb;
		}

		.separator {
			color: #777;
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.container {
			padding: 0.5rem;
		}

		.actions {
			flex-direction: column;
		}

		.search-container {
			width: 100%;
		}

		.new-tab-btn {
			width: 100%;
		}

		.sort-options {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
