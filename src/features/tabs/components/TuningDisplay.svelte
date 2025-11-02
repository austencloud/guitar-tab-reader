<script lang="ts">
	import {
		selectedTuning,
		getTuningDisplayName,
		getTuningStringNames
	} from '$lib/utils/tuner/TuningDefinitions';

	interface Props {
		compact?: boolean;
		showStrings?: boolean;
	}

	let { compact = false, showStrings = true }: Props = $props();

	// Add safety checks for store values
	const displayName = $derived(
		$selectedTuning ? getTuningDisplayName($selectedTuning) : 'Standard'
	);

	const stringNames = $derived(
		$selectedTuning ? getTuningStringNames($selectedTuning) : ['E', 'A', 'D', 'G', 'B', 'E']
	);
</script>

<div class="tuning-display" class:compact>
	{#if compact}
		<span class="tuning-name">{displayName}</span>
	{:else}
		<div class="tuning-info">
			<span class="tuning-label">Tuning:</span>
			<span class="tuning-name">{displayName}</span>
			{#if showStrings}
				<div class="string-names">
					{#each stringNames as stringName, index (index)}
						<span class="string-note" class:low-string={index >= 3}>
							{stringName}
						</span>
						{#if index < stringNames.length - 1}
							<span class="separator">-</span>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tuning-display {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.tuning-display.compact {
		font-size: var(--font-size-xs);
	}

	.tuning-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.tuning-label {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-tertiary);
	}

	.tuning-name {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.string-names {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-family: var(--font-family-mono);
		font-size: var(--font-size-xs);
		background-color: var(--color-surface-variant);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.string-note {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		min-width: 16px;
		text-align: center;
	}

	.string-note.low-string {
		color: var(--color-text-secondary);
	}

	.separator {
		color: var(--color-text-tertiary);
		font-weight: var(--font-weight-normal);
	}

	/* Responsive design */
	@media (max-width: 600px) {
		.tuning-display:not(.compact) {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.tuning-info {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.string-names {
			font-size: var(--font-size-xs);
			padding: var(--spacing-xs);
		}
	}
</style>
