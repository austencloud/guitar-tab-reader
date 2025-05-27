<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount, onDestroy } from 'svelte';
	import TuningMeter from './TuningMeter.svelte';
	import {
		startTuner,
		stopTuner,
		tunerStatus,
		isListening,
		detectedCents
	} from '../../utils/tuner/AudioProcessor';
	import {
		tunings,
		selectedTuning as globalSelectedTuning,
		getClosestString,
		calculateCents,
		addCustomTuning
	} from '../../utils/tuner/TuningDefinitions';
	import type { StringDefinition } from '../../utils/tuner/types';

	interface Props {
		open?: boolean;
		customTuning?: StringDefinition[] | null;
		onclose?: () => void;
	}

	let { open = true, customTuning = null, onclose }: Props = $props();

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

	// Remove handleStart function
	// function handleStart() {
	// 	startTuner(handlePitch);
	// }

	// Remove handleStop function
	// function handleStop() {
	// 	stopTuner();
	// 	closestString = null;
	// }

	function handleTuningChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		globalSelectedTuning.set(target.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}

	function close() {
		if ($isListening) {
			stopTuner();
		}
		onclose?.();
	}

	// Automatically start tuner when modal opens
	$effect(() => {
		if (open) {
			startTuner(handlePitch);
		}
	});

	onMount(() => {
		// If the modal is already open on mount, start the tuner
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

<svelte:window on:keydown={handleKeydown} />

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
					<select id="tuning-select" value={$globalSelectedTuning} onchange={handleTuningChange}>
						{#each Object.keys($tunings) as tuningName}
							<option value={tuningName}>{tuningName}</option>
						{/each}
					</select>
				</div>

				{#if $tunerStatus === 'error'}
					<div class="tuner-error">
						<p>Microphone access denied. Please allow microphone access to use the tuner.</p>
					</div>
				{/if}

				<div class="tuner-display">
					<TuningMeter
						detectedCents={$detectedCents}
						{closestString}
						strings={activeStrings}
						statusMessage={!$isListening ? 'Initializing tuner...' : 'Play a string...'}
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
		z-index: 1000;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		z-index: 1000;
	}

	.modal-content {
		position: relative;
		background-color: #f5f5f5;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1001;
	}

	.close-button {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 30px;
		height: 30px;
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #666;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.tuner-container {
		padding: 1.5rem;
		width: 100%;
	}

	.tuner-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		margin: 1.5rem 0;
	}

	.tuner-error {
		background-color: #ffebee;
		color: #c62828;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		margin: 1rem 0;
	}

	.tuning-selector-container {
		display: flex;
		align-items: center;
		justify-content: center; /* Center the selector */
		gap: 0.5rem;
		margin-bottom: 1rem; /* Add some space below */
	}

	.tuning-selector-container label {
		font-weight: 500;
	}

	.tuning-selector-container select {
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		background-color: #fff;
	}

	@media (prefers-color-scheme: dark) {
		.modal-content {
			background-color: #1e1e1e;
			color: #e0e0e0;
		}

		.close-button {
			color: #aaa;
		}

		.close-button:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.tuning-selector-container select {
			background-color: #333;
			color: #e0e0e0;
			border-color: #555;
		}

		.tuner-error {
			background-color: rgba(244, 67, 54, 0.2);
		}
	}
</style>
