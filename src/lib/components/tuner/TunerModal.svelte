<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onDestroy, createEventDispatcher } from 'svelte';
	import TuningControls from './TuningControls.svelte';
	import TuningMeter from './TuningMeter.svelte';
	import StringsDisplay from './StringsDisplay.svelte';
	import {
		startTuner,
		stopTuner,
		tunerStatus,
		isListening,
		detectedFrequency,
		detectedCents,
		detectedNote
	} from '../../utils/tuner/AudioProcessor';
	import {
		tunings,
		getClosestString,
		calculateCents,
		addCustomTuning
	} from '../../utils/tuner/TuningDefinitions';
	import type { StringDefinition } from '../../utils/tuner/types';

	// Create event dispatcher for the close event
	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let open = true; // Changed from false to true to ensure it shows up
	export let customTuning: StringDefinition[] | null = null;
	export let initialTuning = 'Standard';

	let selectedTuning = initialTuning;
	let activeStrings: StringDefinition[] = [];
	let closestString: StringDefinition | null = null;

	$: if (customTuning && customTuning.length) {
		if (!$tunings['Custom']) {
			addCustomTuning('Custom', customTuning);
			selectedTuning = 'Custom';
		}
	}

	// Update selectedTuning when initialTuning changes
	$: if (initialTuning && initialTuning !== selectedTuning && $tunings[initialTuning]) {
		selectedTuning = initialTuning;
	}

	$: if (selectedTuning && $tunings[selectedTuning]) {
		activeStrings = $tunings[selectedTuning];
	}

	function handlePitch(frequency: number) {
		closestString = getClosestString(frequency, activeStrings);

		if (closestString) {
			detectedCents.set(calculateCents(frequency, closestString.frequency));
		}
	}

	function handleStart() {
		startTuner(handlePitch);
	}

	function handleStop() {
		stopTuner();
		closestString = null;
	}

	function handleTuningChange(event: CustomEvent<string>) {
		selectedTuning = event.detail;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}

	function handleModalBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	function close() {
		if ($isListening) {
			stopTuner();
		}
		open = false;
		dispatch('close');
	}

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
		<button class="modal-backdrop" aria-label="Close tuner" on:click={close}></button>

		<div
			class="modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="tuner-title"
			transition:scale={{ duration: 200, start: 0.95, opacity: 0, easing: quintOut }}
		>
			<button class="close-button" on:click={close} aria-label="Close tuner">×</button>

			<div class="tuner-container">
				<div class="tuner-header">
					<h2 id="tuner-title">Guitar Tuner</h2>
					<TuningControls
						{selectedTuning}
						on:start={handleStart}
						on:stop={handleStop}
						on:tuningChange={handleTuningChange}
					/>
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
						statusMessage={!$isListening ? 'Press Start to begin tuning' : 'Play a string...'}
					/>

					<StringsDisplay {activeStrings} {closestString} detectedCents={$detectedCents} />
				</div>

				<div class="tuner-help">
					<h3>Quick guide:</h3>
					<ol>
						<li>Click "Start" to activate your microphone</li>
						<li>Play a single string on your guitar</li>
						<li>The tuner will show which string you're playing and how in-tune it is</li>
						<li>Adjust your tuning until the needle is centered (green)</li>
					</ol>
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

	.tuner-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.tuner-header h2 {
		margin: 0;
		font-size: 1.5rem;
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

	.tuner-help {
		border-top: 1px solid #ddd;
		padding-top: 1rem;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.tuner-help h3 {
		margin-top: 0;
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

		.tuner-help {
			border-color: #444;
		}

		.tuner-error {
			background-color: rgba(244, 67, 54, 0.2);
		}
	}

	@media (min-width: 768px) {
		.tuner-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}
</style>
