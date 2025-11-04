<script lang="ts">
	import SearchBar from './SearchBar.svelte';

	interface Props {
		searchQuery: string;
		onsearchchange: (value: string) => void;
	}

	let { searchQuery = $bindable(''), onsearchchange }: Props = $props();
</script>

<div class="controls-row">
	<SearchBar value={searchQuery} onchange={onsearchchange} />
</div>

<style>
	.controls-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-low);
	}

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.controls-row {
			padding: var(--spacing-md);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.controls-row {
			padding: var(--spacing-sm);
		}
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		.controls-row {
			padding: 0.5rem;
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.controls-row {
			padding: var(--spacing-sm);
		}
	}
</style>
