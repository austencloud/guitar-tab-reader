<script lang="ts">
	import { CALIBRATION_OPTIONS, a4Calibration, type A4Frequency } from '../services/CalibrationSettings.svelte';
	import { Settings } from 'lucide-svelte';

	function handleCalibrationChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = parseInt(target.value, 10) as A4Frequency;
		a4Calibration.value = value;
	}
</script>

<div class="calibration-settings">
	<label for="a4-calibration">
		<Settings size={16} class="settings-icon" />
		A4 Calibration
	</label>
	<select
		id="a4-calibration"
		value={a4Calibration.value}
		onchange={handleCalibrationChange}
		title="Adjust the reference pitch for A4"
	>
		{#each CALIBRATION_OPTIONS as option}
			<option value={option.value}>
				{option.label} - {option.description}
			</option>
		{/each}
	</select>
</div>

<style>
	.calibration-settings {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
	}

	label {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	label :global(.settings-icon) {
		color: var(--color-primary);
		flex-shrink: 0;
	}

	select {
		flex: 1;
		min-width: 0;
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: var(--font-size-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: var(--touch-target-min, 44px);
	}

	select:hover {
		border-color: var(--color-primary);
	}

	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	/* Compact mode for small screens */
	@media (max-width: 380px) {
		label {
			font-size: 0.7rem;
		}

		select {
			font-size: 0.7rem;
			padding: 0.4rem 0.5rem;
		}
	}
</style>
