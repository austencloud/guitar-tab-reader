<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';
	import TabsListHeader from './TabsListHeader.svelte';
	import TabListItem from './TabListItem.svelte';

	type SortField = 'title' | 'artist' | 'updatedAt';
	type SortOrder = 'asc' | 'desc';

	interface Props {
		tabs: Tab[];
		sortBy: SortField;
		sortOrder: SortOrder;
		ontoggle: (field: SortField) => void;
		onselect: (id: string) => void;
	}

	let { tabs, sortBy, sortOrder, ontoggle, onselect }: Props = $props();
</script>

<div class="tabs-list">
	<TabsListHeader {sortBy} {sortOrder} {ontoggle} />

	<div class="tabs-items-container">
		{#each tabs as tab, idx (tab.id)}
			<TabListItem {tab} index={idx} {onselect} />
		{/each}
	</div>
</div>

<style>
	.tabs-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.tabs-items-container {
		overflow-y: auto;
		flex: 1;
		padding: var(--spacing-sm);
	}

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.tabs-items-container {
			padding: var(--spacing-xs);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.tabs-items-container {
			padding: 0.25rem;
		}
	}
</style>
