<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { BottomSheet } from '$features/shared/components';
	import TuningMeter from './TuningMeter.svelte';
	import {
		startTuner,
		stopTuner,
		tunerStatus,
		isListening,
		detectedCents
	} from '../services/AudioProcessor';
	import {
		tunings,
		selectedTuning as globalSelectedTuning,
		getClosestString,
		calculateCents,
		addCustomTuning
	} from '../services/TuningDefinitions';
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
			if (!$tunings['Custom']) {
				addCustomTuning('Custom', customTuning);
				globalSelectedTuning.set('Custom');
			}
		}
	});

	// Update activeStrings when global tuning changes
	$effect(() => {
		const currentTuning = $globalSelectedTuning;
		if (currentTuning && $tunings[currentTuning]) {
			activeStrings = $tunings[currentTuning];
		}
	});

	function handlePitch(frequency: number) {
		closestString = getClosestString(frequency, activeStrings);

		if (closestString) {
			detectedCents.set(calculateCents(frequency, closestString.frequency));
		}
	}

	function handleTuningChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		globalSelectedTuning.set(target.value);
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			if ($isListening) {
				stopTuner();
			}
			onclose?.();
		}
	}

	// Automatically start tuner when sheet opens
	$effect(() => {
		if (open) {
			startTuner(handlePitch);
		}
	});

	onMount(() => {
		// If the sheet is already open on mount, start the tuner
		if (open) {
			startTuner(handlePitch);
		}
	});

	onDestroy(() => {
		if ($isListening) {
			stopTuner();
		}
	});
</script>

<BottomSheet bind:open onOpenChange={handleOpenChange} title="Guitar Tuner">
	<div class="tuner-content">
		<!-- Tuning Selector -->
		<div class="tuning-selector-container">
			<label for="tuning-select">Tuning:</label>
			<select id="tuning-select" value={$globalSelectedTuning} onchange={handleTuningChange}>
				{#each Object.keys($tunings) as tuningName}
					<option value={tuningName}>{tuningName}</option>
				{/each}
			</select>
		</div>

		<!-- Error Message -->
		{#if $tunerStatus === 'error'}
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
				detectedCents={$detectedCents}
				{closestString}
				strings={activeStrings}
				statusMessage={!$isListening ? 'Initializing tuner...' : 'Play a string...'}
			/>
		</div>
	</div>
</BottomSheet>

<style>
	.tuner-content {
		display: flex;
		flex-direction: column;
		gap: clamp(0.875rem, 2.5vw, 1.5rem);
		padding: clamp(0.5rem, 2vw, 1rem) 0;
	}

	/* Tuning Selector */
	.tuning-selector-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(0.75rem, 2vw, 1rem);
		padding: clamp(0.75rem, 2vw, 1rem);

		/* Modern 2025 glassmorphism */
		background: linear-gradient(
			135deg,
			rgba(245, 245, 245, 0.9),
			rgba(245, 245, 245, 0.7)
		);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);

		border-radius: clamp(10px, 2.5vw, 12px);
		border: 1px solid rgba(229, 229, 229, 0.8);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	}

	.tuning-selector-container label {
		font-size: clamp(0.875rem, 2vw, 1rem);
		font-weight: 600;
		color: var(--color-text-primary, #0a0a0a);
		letter-spacing: 0.3px;
	}

	.tuning-selector-container select {
		padding: clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.875rem, 2.5vw, 1rem);
		border-radius: clamp(8px, 2vw, 10px);
		border: 1.5px solid rgba(229, 229, 229, 0.8);

		/* Glassmorphism */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.95),
			rgba(255, 255, 255, 0.85)
		);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);

		color: var(--color-text-primary, #0a0a0a);
		font-size: clamp(0.875rem, 2vw, 1rem);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		min-width: clamp(140px, 35vw, 160px);
		min-height: var(--touch-target-min, 44px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.tuning-selector-container select:hover {
		border-color: rgba(76, 175, 80, 0.5);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.tuning-selector-container select:focus {
		outline: none;
		border-color: var(--color-primary, #4ade80);
		box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15), 0 4px 16px rgba(76, 175, 80, 0.2);
		transform: translateY(-1px);
	}

	/* Error Message */
	.tuner-error {
		display: flex;
		align-items: center;
		gap: clamp(0.75rem, 2vw, 1rem);
		padding: clamp(0.75rem, 2vw, 1rem);
		background: linear-gradient(
			135deg,
			rgba(248, 113, 113, 0.12),
			rgba(248, 113, 113, 0.08)
		);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(248, 113, 113, 0.4);
		border-radius: clamp(10px, 2.5vw, 12px);
		color: #f87171;
	}

	.tuner-error svg {
		flex-shrink: 0;
	}

	.tuner-error p {
		margin: 0;
		font-size: clamp(0.813rem, 2vw, 0.875rem);
		line-height: 1.5;
	}

	/* Tuner Display */
	.tuner-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.75rem, 2vw, 1.25rem);
		padding: clamp(0.75rem, 2vw, 1.25rem) 0;
	}

	/* Dark Mode */
	:global([data-theme='dark']) .tuning-selector-container {
		background: linear-gradient(
			135deg,
			rgba(26, 26, 26, 0.9),
			rgba(26, 26, 26, 0.7)
		);
		border-color: rgba(64, 64, 64, 0.8);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	:global([data-theme='dark']) .tuning-selector-container select {
		background: linear-gradient(
			135deg,
			rgba(36, 36, 36, 0.95),
			rgba(36, 36, 36, 0.85)
		);
		border-color: rgba(64, 64, 64, 0.8);
		color: var(--color-text-primary, #fafafa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	:global([data-theme='dark']) .tuner-error {
		background: linear-gradient(
			135deg,
			rgba(248, 113, 113, 0.18),
			rgba(248, 113, 113, 0.12)
		);
		border-color: rgba(248, 113, 113, 0.5);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.tuner-content {
			gap: 0.875rem;
			padding: 0.5rem 0;
		}

		.tuning-selector-container {
			flex-direction: column;
			gap: 0.625rem;
			padding: 0.75rem;
		}

		.tuning-selector-container select {
			width: 100%;
			min-width: 100%;
		}

		.tuner-display {
			padding: 0.75rem 0;
		}
	}

	/* Extra small devices */
	@media (max-width: 360px) {
		.tuner-content {
			gap: 0.75rem;
			padding: 0.375rem 0;
		}

		.tuning-selector-container {
			padding: 0.625rem;
		}
	}
</style>
