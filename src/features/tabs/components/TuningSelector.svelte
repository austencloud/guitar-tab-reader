<script lang="ts">
	import { tunings, selectedTuning, getTuningDisplayName } from '$lib/utils/tuner/TuningDefinitions';

	interface Props {
		label?: string;
		showDescription?: boolean;
	}

	let { label = 'Guitar Tuning', showDescription = true }: Props = $props();

	// Simple event handler approach to avoid circular dependencies
	function handleTuningChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedTuning.set(target.value);
	}
</script>

<div class="tuning-selector">
	{#if showDescription}
		<div class="setting-info">
			<span class="setting-label">{label}</span>
			<span class="setting-description">Choose the tuning for your guitar</span>
		</div>
	{:else}
		<label for="tuning-select" class="tuning-label">{label}:</label>
	{/if}

	<div class="tuning-control">
		<select
			id="tuning-select"
			value={$selectedTuning}
			onchange={handleTuningChange}
			aria-label="Select guitar tuning"
		>
			{#each Object.keys($tunings) as tuningName (tuningName)}
				<option value={tuningName}>
					{getTuningDisplayName(tuningName)}
				</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.tuning-selector {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 40px;
	}

	.setting-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.setting-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
	}

	.setting-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-normal);
	}

	.tuning-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
		min-width: 80px;
		display: flex;
		align-items: center;
	}

	.tuning-control {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	select {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-surface);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
		min-width: 180px;
	}

	select:hover {
		border-color: var(--color-primary);
		background-color: var(--color-hover);
	}

	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-focus);
	}

	/* Responsive design */
	@media (max-width: 600px) {
		.tuning-selector {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.setting-info {
			margin-bottom: var(--spacing-xs);
		}

		.tuning-control {
			align-self: flex-start;
		}

		select {
			min-width: 160px;
		}
	}
</style>
