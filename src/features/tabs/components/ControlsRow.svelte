<script lang="ts">
	import SearchBar from './SearchBar.svelte';

	interface Props {
		searchQuery: string;
		onsearchchange: (value: string) => void;
		onaddtab: () => void;
	}

	let { searchQuery = $bindable(''), onsearchchange, onaddtab }: Props = $props();
</script>

<div class="controls-row">
	<SearchBar value={searchQuery} onchange={onsearchchange} />

	<button class="add-tab-button" onclick={onaddtab}>
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

<style>
	.controls-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-low);
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
		box-shadow:
			var(--shadow-lg),
			var(--glow-primary);
	}

	.add-tab-button:active {
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
	}

	.add-tab-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.controls-row {
			padding: var(--spacing-md);
		}

		.add-tab-button {
			padding: 0.75rem var(--spacing-md);
			font-size: var(--font-size-sm);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.controls-row {
			padding: var(--spacing-sm);
			gap: var(--spacing-sm);
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
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		.controls-row {
			padding: 0.5rem;
		}

		.add-tab-button {
			padding: 0.625rem;
			min-width: var(--touch-target-min);
		}

		.add-tab-button svg {
			width: 20px;
			height: 20px;
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.controls-row {
			padding: var(--spacing-sm);
		}
	}
</style>
