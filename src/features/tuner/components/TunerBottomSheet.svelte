<script lang="ts">
	import { BottomSheet } from '$features/shared/components';
	import TuningMeter from './TuningMeter.svelte';
	import {
		startTuner,
		stopTuner,
		getTunerStatus,
		getIsListening,
		getDetectedCents
	} from '../services/AudioProcessor.svelte';
	import {
		getTunings,
		getSelectedTuning,
		setSelectedTuning,
		getClosestString,
		addCustomTuning
	} from '../services/TuningDefinitions.svelte';
	import type { StringDefinition } from '../services/types';

	interface Props {
		open?: boolean;
		customTuning?: StringDefinition[] | null;
		onclose?: () => void;
	}

	let { open = $bindable(false), customTuning = null, onclose }: Props = $props();

	let activeStrings = $state<StringDefinition[]>([]);
	let closestString = $state<StringDefinition | null>(null);

	// Initialize with custom tuning if provided
	$effect(() => {
		if (customTuning && customTuning.length) {
			const tunings = getTunings();
			if (!tunings['Custom']) {
				addCustomTuning('Custom', customTuning);
				setSelectedTuning('Custom');
			}
		}
	});

	// Update activeStrings when global tuning changes
	$effect(() => {
		const currentTuning = getSelectedTuning();
		const tunings = getTunings();
		if (currentTuning && tunings[currentTuning]) {
			activeStrings = tunings[currentTuning];
		}
	});

	function handlePitch(frequency: number) {
		closestString = getClosestString(frequency, activeStrings);

		if (closestString) {
			// detectedCents is already a number from the getter, not a store
			// The calculateCents function returns the value directly
			// No need to call .set() - the AudioProcessor handles this internally
		}
	}

	function handleTuningChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		setSelectedTuning(target.value);
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			if (getIsListening()) {
				stopTuner();
			}
			onclose?.();
		}
	}

	// Automatically start tuner when sheet opens and cleanup when it closes
	$effect(() => {
		if (open) {
			startTuner(handlePitch);
		}

		return () => {
			if (getIsListening()) {
				stopTuner();
			}
		};
	});
</script>

<BottomSheet bind:open onOpenChange={handleOpenChange} title="Guitar Tuner">
	<div class="tuner-content">
		<!-- Tuning Selector -->
		<div class="tuning-selector-container">
			<label for="tuning-select">Tuning:</label>
			<select id="tuning-select" value={getSelectedTuning()} onchange={handleTuningChange}>
				{#each Object.keys(getTunings()) as tuningName}
					<option value={tuningName}>{tuningName}</option>
				{/each}
			</select>
		</div>

		<!-- Error Message -->
		{#if getTunerStatus() === 'error'}
			<div class="tuner-error">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
					<path
						fill="currentColor"
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
					/>
				</svg>
				<p>Microphone access denied. Please allow microphone access to use the tuner.</p>
			</div>
		{/if}

		<!-- Tuner Display -->
		<div class="tuner-display">
			<TuningMeter
				detectedCents={getDetectedCents()}
				{closestString}
				strings={activeStrings}
				statusMessage={!getIsListening() ? 'Initializing tuner...' : 'Play a string...'}
			/>
		</div>
	</div>
</BottomSheet>

<style>
	.tuner-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: 0;
	}

	/* Tuning Selector */
	.tuning-selector-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-surface-high);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.tuning-selector-container label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.tuning-selector-container select {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
		min-width: 140px;
		min-height: var(--touch-target-min, 44px);
	}

	.tuning-selector-container select:hover {
		border-color: var(--color-primary);
		background: var(--color-hover);
	}

	.tuning-selector-container select:focus {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
		border-color: var(--color-primary);
	}

	/* Error Message */
	.tuner-error {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-error-bg);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		color: var(--color-error);
	}

	.tuner-error svg {
		flex-shrink: 0;
	}

	.tuner-error p {
		margin: 0;
		font-size: var(--font-size-sm);
		line-height: 1.5;
	}

	/* Tuner Display */
	.tuner-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.tuning-selector-container {
			flex-direction: column;
			gap: var(--spacing-xs);
		}

		.tuning-selector-container select {
			width: 100%;
			min-width: 100%;
		}
	}
</style>
