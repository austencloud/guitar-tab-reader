<script lang="ts">
	import type { TabGroup } from '$lib/utils/tabVersions';

	interface Props {
		results: any[];
		groupedResults: Map<string, TabGroup>;
		expandedGroups: Set<string>;
		onSelectTab: (tab: any) => void;
		onToggleGroup: (groupKey: string) => void;
	}

	let { results, groupedResults, expandedGroups, onSelectTab, onToggleGroup }: Props = $props();

	// Filter state
	let selectedTypes = $state<Set<string>>(new Set(['Chords'])); // Default to Chords only
	let availableTypes = $derived(() => {
		const types = new Set<string>();
		results.forEach((tab) => {
			if (tab.type) types.add(tab.type);
		});
		return Array.from(types).sort();
	});

	// Filtered results
	let filteredGroupedResults = $derived(() => {
		if (selectedTypes.size === 0) return groupedResults;

		const filtered = new Map<string, TabGroup>();
		for (const [key, group] of groupedResults.entries()) {
			if (selectedTypes.has(group.type)) {
				filtered.set(key, group);
			}
		}
		return filtered;
	});

	let filteredCount = $derived(() => {
		let count = 0;
		for (const group of filteredGroupedResults().values()) {
			count += group.versions.length;
		}
		return count;
	});

	function toggleType(type: string) {
		if (selectedTypes.has(type)) {
			selectedTypes.delete(type);
		} else {
			selectedTypes.add(type);
		}
		selectedTypes = new Set(selectedTypes); // Trigger reactivity
	}

	function selectAllTypes() {
		selectedTypes = new Set(availableTypes());
	}

	function clearAllTypes() {
		selectedTypes = new Set();
	}

	function formatVotes(votes?: number): string {
		if (!votes) return '';
		if (votes >= 1000) {
			return `${(votes / 1000).toFixed(1)}k`;
		}
		return votes.toString();
	}

	function renderStars(rating?: number): string {
		if (!rating) return '';
		// Normalize rating to 0-5 scale if it's out of range
		const normalizedRating = rating > 5 ? Math.round((rating / 100) * 5) : Math.round(rating);
		const clampedRating = Math.max(0, Math.min(5, normalizedRating));
		const filled = '★'.repeat(clampedRating);
		const empty = '☆'.repeat(5 - clampedRating);
		return filled + empty;
	}
</script>

<div class="bulk-results-view">
	<div class="filter-section">
		<div class="filter-header">
			<span class="filter-label">Filter by type:</span>
			<div class="filter-actions">
				<button class="filter-action-btn" onclick={selectAllTypes}>All</button>
				<button class="filter-action-btn" onclick={clearAllTypes}>None</button>
			</div>
		</div>
		<div class="filter-chips">
			{#each availableTypes() as type}
				<button
					class="filter-chip"
					class:active={selectedTypes.has(type)}
					onclick={() => toggleType(type)}
				>
					{type}
					{#if selectedTypes.has(type)}
						<span class="check-icon">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<p class="results-count">
		Showing {filteredCount()} of {results.length} tabs
	</p>

	<div class="tabs-list">
		{#each Array.from(filteredGroupedResults().values()) as group}
			{@const groupKey = `${group.baseTitle}|${group.type}`}
			{@const isExpanded = expandedGroups.has(groupKey)}
			{@const hasMultiple = group.versions.length > 1}

			<div class="tab-group">
				<!-- Recommended version (always shown) -->
				<button class="tab-item recommended" onclick={() => onSelectTab(group.recommendedVersion)}>
					<div class="tab-info">
						<div class="tab-title-row">
							<span class="tab-title">{group.recommendedVersion.title}</span>
							{#if hasMultiple && group.recommendedVersion.rating}
								<span class="recommended-badge">Recommended</span>
							{/if}
						</div>
						<div class="tab-meta-row">
							<span class="tab-type">{group.type}</span>
							{#if group.recommendedVersion.rating}
								<span class="tab-rating">
									{renderStars(group.recommendedVersion.rating)}
									<span class="vote-count">({formatVotes(group.recommendedVersion.votes)} votes)</span>
								</span>
							{/if}
						</div>
					</div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>

				<!-- Show alternate versions button if there are multiple versions -->
				{#if hasMultiple}
					<button class="show-alternates-btn" onclick={() => onToggleGroup(groupKey)}>
						<span>
							{isExpanded ? '▼' : '▶'}
							{group.alternateVersions.length} alternate version{group.alternateVersions.length !== 1
								? 's'
								: ''}
						</span>
					</button>

					<!-- Alternate versions (shown when expanded) -->
					{#if isExpanded}
						<div class="alternate-versions">
							{#each group.alternateVersions as altVersion}
								<button class="tab-item alternate" onclick={() => onSelectTab(altVersion)}>
									<div class="tab-info">
										<div class="tab-title-row">
											<span class="tab-title">{altVersion.title}</span>
										</div>
										<div class="tab-meta-row">
											{#if altVersion.rating}
												<span class="tab-rating">
													{renderStars(altVersion.rating)}
													<span class="vote-count">({formatVotes(altVersion.votes)} votes)</span>
												</span>
											{/if}
										</div>
									</div>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M9 18l6-6-6-6" />
									</svg>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.bulk-results-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.filter-section {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		border: 2px solid #e5e5e5;
	}

	.filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.filter-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
	}

	.filter-action-btn {
		background: transparent;
		border: 1px solid #ccc;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		color: #666;
		transition: all 0.2s;
	}

	.filter-action-btn:hover {
		background-color: #4caf50;
		border-color: #4caf50;
		color: white;
	}

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-chip {
		background: white;
		border: 2px solid #e5e5e5;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: #666;
	}

	.filter-chip:hover {
		border-color: #4caf50;
		background-color: #f8fdf8;
	}

	.filter-chip.active {
		background-color: #4caf50;
		border-color: #4caf50;
		color: white;
	}

	.check-icon {
		font-size: 0.9rem;
		font-weight: bold;
	}

	.results-count {
		font-size: 0.95rem;
		color: #666;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
	}

	.tabs-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tab-item {
		background: white;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.tab-item:hover {
		border-color: #4caf50;
		background-color: #f8fdf8;
		transform: translateX(4px);
	}

	.tab-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tab-title {
		font-weight: 600;
		color: #333;
		font-size: 1rem;
	}

	.tab-item svg {
		color: #999;
		transition: color 0.2s;
	}

	.tab-item:hover svg {
		color: #4caf50;
	}

	.tab-group {
		margin-bottom: 0.75rem;
	}

	.tab-item.recommended {
		border-color: #4caf50;
		background: linear-gradient(135deg, #f8fdf8 0%, #ffffff 100%);
	}

	.tab-item.recommended:hover {
		border-color: #45a049;
		background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f1 100%);
	}

	.tab-item.alternate {
		border-color: #e0e0e0;
		background: #fafafa;
		margin-left: 1.5rem;
	}

	.tab-item.alternate:hover {
		border-color: #9e9e9e;
		background: #f5f5f5;
	}

	.tab-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.tab-meta-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
	}

	.tab-type {
		color: #666;
		font-weight: 500;
	}

	.tab-rating {
		color: #ff9800;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.vote-count {
		color: #999;
		font-size: 0.8rem;
	}

	.recommended-badge {
		background: #4caf50;
		color: white;
		font-size: 0.7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.show-alternates-btn {
		background: transparent;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
		color: #666;
		font-size: 0.85rem;
		text-align: left;
		width: 100%;
		transition: color 0.2s, background-color 0.2s;
		border-radius: 4px;
		margin-top: 0.25rem;
	}

	.show-alternates-btn:hover {
		color: #4caf50;
		background-color: rgba(76, 175, 80, 0.05);
	}

	.show-alternates-btn span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alternate-versions {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.filter-section {
			background-color: rgba(255, 255, 255, 0.05);
			border-color: #3a3a3a;
		}

		.filter-label {
			color: #e0e0e0;
		}

		.filter-action-btn {
			border-color: #555;
			color: #999;
		}

		.filter-action-btn:hover {
			background-color: #66bb6a;
			border-color: #66bb6a;
			color: white;
		}

		.filter-chip {
			background-color: #1e1e1e;
			border-color: #3a3a3a;
			color: #999;
		}

		.filter-chip:hover {
			border-color: #66bb6a;
			background-color: #2a3a2a;
		}

		.filter-chip.active {
			background-color: #66bb6a;
			border-color: #66bb6a;
			color: white;
		}

		.results-count {
			background-color: rgba(255, 255, 255, 0.05);
			color: #ccc;
		}

		.tab-item {
			background-color: #1e1e1e;
			border-color: #3a3a3a;
		}

		.tab-item:hover {
			background-color: #2a3a2a;
			border-color: #66bb6a;
		}

		.tab-item.recommended {
			background: linear-gradient(135deg, #1e2e1e 0%, #1e1e1e 100%);
			border-color: #66bb6a;
		}

		.tab-item.recommended:hover {
			background: linear-gradient(135deg, #2a3a2a 0%, #253525 100%);
			border-color: #76cb7a;
		}

		.tab-item.alternate {
			background-color: #1a1a1a;
			border-color: #333;
		}

		.tab-item.alternate:hover {
			background-color: #252525;
			border-color: #555;
		}

		.tab-title {
			color: #e0e0e0;
		}

		.tab-type {
			color: #999;
		}

		.vote-count {
			color: #666;
		}

		.tab-item svg {
			color: #666;
		}

		.tab-item:hover svg {
			color: #66bb6a;
		}

		.show-alternates-btn {
			color: #999;
		}

		.show-alternates-btn:hover {
			color: #66bb6a;
			background-color: rgba(102, 187, 106, 0.1);
		}
	}
</style>

