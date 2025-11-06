<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import { Plus } from 'lucide-svelte';

	interface Props {
		searchQuery: string;
		onsearchchange: (value: string) => void;
		onaddtab?: () => void;
	}

	let { searchQuery = $bindable(''), onsearchchange, onaddtab }: Props = $props();
</script>

<div class="controls-row">
	<SearchBar value={searchQuery} onchange={onsearchchange} />
	{#if onaddtab}
		<button class="add-button" onclick={onaddtab} aria-label="Add new tab">
			<Plus size={20} />
			<span>Add Tab</span>
		</button>
	{/if}
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

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		min-height: var(--touch-target-min);
	}

	.add-button:hover {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.add-button:active {
		transform: translateY(0);
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
