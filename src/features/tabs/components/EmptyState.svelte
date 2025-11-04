<script lang="ts">
	interface Props {
		hasAnyTabs: boolean;
	}

	let { hasAnyTabs }: Props = $props();
</script>

{#if !hasAnyTabs}
	<div class="empty-state">
		<h2>No tabs yet</h2>
		<p>Tap the "Add" button in the navigation bar to get started</p>
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
		margin: 0;
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.empty-state,
		.no-results {
			padding: var(--spacing-xl) var(--spacing-md);
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.empty-state,
		.no-results {
			padding: var(--spacing-md);
		}
	}
</style>
