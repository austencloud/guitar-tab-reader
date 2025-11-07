<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
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
		calculateCents,
		addCustomTuning
	} from '../services/TuningDefinitions.svelte';
	import type { StringDefinition } from '../services/types';

	interface Props {
		open?: boolean;
		customTuning?: StringDefinition[] | null;
		onclose?: () => void;
	}

	let { open = true, customTuning = null, onclose }: Props = $props();

	let activeStrings = $state<StringDefinition[]>([]);
	let closestString = $state<StringDefinition | null>(null);
	let detectedCentsValue = $state(0);

	// Derive reactive values from service getters
	let tunings = $derived(getTunings());
	let selectedTuning = $derived(getSelectedTuning());
	let tunerStatus = $derived(getTunerStatus());
	let isListening = $derived(getIsListening());

	// Initialize with custom tuning if provided
	$effect(() => {
		if (customTuning && customTuning.length) {
			if (!tunings['Custom']) {
				addCustomTuning('Custom', customTuning);
				setSelectedTuning('Custom');
			}
		}
	});

	// Update activeStrings when global tuning changes
	$effect(() => {
		if (selectedTuning && tunings[selectedTuning]) {
			activeStrings = tunings[selectedTuning];
		}
	});

	function handlePitch(frequency: number) {
		closestString = getClosestString(frequency, activeStrings);

		if (closestString) {
			detectedCentsValue = calculateCents(frequency, closestString.frequency);
		}
	}

	function handleTuningChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		setSelectedTuning(target.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}

	function close() {
		if (isListening) {
			stopTuner();
		}
		onclose?.();
	}

	// Automatically start tuner when modal opens and cleanup when it closes
	$effect(() => {
		if (open) {
			startTuner(handlePitch);
		}
		
		return () => {
			if (isListening) {
				stopTuner();
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="modal-wrapper" transition:fade={{ duration: 200 }}>
		<!-- Use button for backdrop to handle both click and keyboard events properly -->
		<button class="modal-backdrop" aria-label="Close tuner" onclick={close}></button>

		<div
			class="modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="tuner-title"
			transition:scale={{ duration: 200, start: 0.95, opacity: 0, easing: quintOut }}
		>
			<button class="close-button" onclick={close} aria-label="Close tuner">×</button>

			<div class="tuner-container">
				<!-- Add Tuning Selector Dropdown -->
				<div class="tuning-selector-container">
					<label for="tuning-select">Tuning:</label>
					<select id="tuning-select" value={selectedTuning} onchange={handleTuningChange}>
						{#each Object.keys(tunings) as tuningName}
							<option value={tuningName}>{tuningName}</option>
						{/each}
					</select>
				</div>

				{#if tunerStatus === 'error'}
					<div class="tuner-error">
						<p>Microphone access denied. Please allow microphone access to use the tuner.</p>
					</div>
				{/if}

				<div class="tuner-display">
					<TuningMeter
						detectedCents={detectedCentsValue}
						{closestString}
						strings={activeStrings}
						statusMessage={!isListening ? 'Initializing tuner...' : 'Play a string...'}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: var(--z-modal);
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--blur-md);
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		z-index: var(--z-modal-backdrop);
	}

	.modal-content {
		position: relative;
		background-color: var(--color-surface-high);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-2xl);
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		z-index: var(--z-modal);
		border: 1px solid var(--color-border);
	}

	.close-button {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		background: none;
		border: none;
		font-size: var(--font-size-2xl);
		cursor: pointer;
		color: var(--color-text-secondary);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
	}

	.close-button:hover {
		background-color: var(--color-hover);
		color: var(--color-text-primary);
	}

	.close-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tuner-container {
		padding: var(--spacing-modal-padding);
		width: 100%;
	}

	.tuner-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-lg);
		margin: var(--spacing-lg) 0;
	}

	.tuner-error {
		background-color: var(--color-error-bg);
		color: var(--color-error);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-error);
		margin: var(--spacing-md) 0;
		font-weight: var(--font-weight-medium);
	}

	.tuning-selector-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.tuning-selector-container label {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
	}

	.tuning-selector-container select {
		min-height: var(--touch-target-min);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.tuning-selector-container select:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	.tuning-selector-container select:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.tuner-container {
			padding: var(--spacing-modal-padding-mobile);
		}
	}
</style>
