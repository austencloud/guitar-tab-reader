<script lang="ts">
	type SortField = 'title' | 'artist' | 'updatedAt';
	type SortOrder = 'asc' | 'desc';

	interface Props {
		sortBy: SortField;
		sortOrder: SortOrder;
		ontoggle: (field: SortField) => void;
	}

	let { sortBy, sortOrder, ontoggle }: Props = $props();
</script>

<div class="tabs-header">
	<button class="sort-button" onclick={() => ontoggle('title')}>
		Title
		{#if sortBy === 'title'}
			<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
		{/if}
	</button>
	<button class="sort-button" onclick={() => ontoggle('artist')}>
		Artist
		{#if sortBy === 'artist'}
			<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
		{/if}
	</button>
	<button class="sort-button last-update" onclick={() => ontoggle('updatedAt')}>
		Last Updated
		{#if sortBy === 'updatedAt'}
			<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
		{/if}
	</button>
</div>

<style>
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

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.tabs-header {
			grid-template-columns: 2fr 1.5fr 1fr;
			padding: var(--spacing-sm) var(--spacing-md);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.tabs-header {
			grid-template-columns: 1.5fr 1fr;
		}

		.sort-button.last-update {
			display: none;
		}

		.sort-button {
			padding: var(--spacing-xs) var(--spacing-sm);
			font-size: 0.625rem;
		}
	}
</style>
