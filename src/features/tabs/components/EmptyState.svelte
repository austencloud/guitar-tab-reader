<script lang="ts">
	interface Props {
		hasAnyTabs: boolean;
		onaddtab: () => void;
	}

	let { hasAnyTabs, onaddtab }: Props = $props();
</script>

{#if !hasAnyTabs}
	<div class="empty-state">
		<h2>No tabs yet</h2>
		<p>Add your first guitar tab to get started</p>
		<button class="empty-add-btn" onclick={onaddtab}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
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
			<span>Add Your First Tab</span>
		</button>
	</div>
{:else}
	<div class="no-results">
		<h3>No matching tabs found</h3>
		<p>Try a different search term</p>
	</div>
{/if}

<style>
	.empty-state,
	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl);
		text-align: center;
		flex: 1;
		color: var(--color-text-secondary);
		background: var(--color-surface);
	}

	.empty-state h2,
	.no-results h3 {
		margin: 0 0 var(--spacing-md);
		color: var(--color-text-primary);
		font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-4xl));
		font-weight: var(--font-weight-bold);
	}

	.empty-state p,
	.no-results p {
		font-size: var(--font-size-base);
		margin: 0 0 var(--spacing-xl) 0;
	}

	.empty-add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		padding: 1.25rem var(--spacing-2xl);
		border: none;
		border-radius: var(--radius-xl);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-lg);
		min-height: var(--touch-target-comfortable);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
	}

	.empty-add-btn svg {
		flex-shrink: 0;
	}

	.empty-add-btn:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-3px);
		box-shadow:
			var(--shadow-xl),
			var(--glow-primary);
	}

	.empty-add-btn:active {
		transform: translateY(0) scale(0.98);
		box-shadow: var(--shadow-sm);
	}

	.empty-add-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.empty-state,
		.no-results {
			padding: var(--spacing-xl) var(--spacing-md);
		}

		.empty-add-btn {
			padding: 1rem var(--spacing-xl);
			font-size: var(--font-size-base);
		}
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		.empty-add-btn {
			padding: 0.875rem var(--spacing-lg);
			font-size: var(--font-size-sm);
		}

		.empty-add-btn svg {
			width: 24px;
			height: 24px;
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.empty-state,
		.no-results {
			padding: var(--spacing-md);
		}

		.empty-add-btn {
			padding: 0.75rem var(--spacing-lg);
			font-size: var(--font-size-sm);
		}
	}
</style>
