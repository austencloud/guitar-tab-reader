<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Radio } from 'lucide-svelte';
	import TuningMeter from '$features/tuner/components/TuningMeter.svelte';
	import {
		startTuner,
		stopTuner,
		tunerStatus,
		isListening,
		detectedCents
	} from '$features/tuner/services/AudioProcessor';
	import {
		tunings,
		selectedTuning as globalSelectedTuning,
		getClosestString,
		calculateCents
	} from '$features/tuner/services/TuningDefinitions';
	import type { StringDefinition } from '$features/tuner/services/types';

	let activeStrings = $state<StringDefinition[]>([]);
	let closestString = $state<StringDefinition | null>(null);

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

	// Automatically start tuner when page loads
	onMount(() => {
		startTuner(handlePitch);
	});

	onDestroy(() => {
		if ($isListening) {
			stopTuner();
		}
	});
</script>

<svelte:head>
	<title>Guitar Tuner | TabScroll</title>
</svelte:head>

<div class="tuner-page" in:fly={{ y: 20, duration: 300 }}>
	<div class="tuner-header">
		<button class="back-button" onclick={() => goto('/')} aria-label="Go back to home">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
				<path
					fill="currentColor"
					d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
				/>
			</svg>
			<span>Back</span>
		</button>
		<div class="header-title">
			<Radio size={24} class="header-icon" />
			<h1>Guitar Tuner</h1>
		</div>
	</div>

	<!-- Tuning Selector -->
	<div class="tuning-selector">
		<label for="tuning-select">Tuning</label>
		<select id="tuning-select" value={$globalSelectedTuning} onchange={handleTuningChange}>
			{#each Object.keys($tunings) as tuningName}
				<option value={tuningName}>{tuningName}</option>
			{/each}
		</select>
	</div>

	<!-- Error Message -->
	{#if $tunerStatus === 'error'}
		<div class="tuner-error">
			<Radio size={20} />
			<p>Microphone access denied. Please allow microphone access to use the tuner.</p>
		</div>
	{/if}

	<!-- Tuner Display -->
	<div class="tuner-container">
		<TuningMeter
			detectedCents={$detectedCents}
			{closestString}
			strings={activeStrings}
			statusMessage={!$isListening ? 'Initializing tuner...' : 'Play a string...'}
		/>
	</div>

</div>

<style>
	.tuner-page {
		height: calc(100vh - var(--banner-height, 79px) - var(--nav-height, 80px));
		height: calc(100dvh - var(--banner-height, 79px) - var(--nav-height, 80px));
		display: flex;
		flex-direction: column;
		max-width: 800px;
		margin: 0 auto;
		padding: 0.75rem;
		overflow: hidden;
		/* Prevent any horizontal overflow */
		box-sizing: border-box;
		width: 100%;
	}

	/* Extra compact mode for very small screens */
	@media (max-width: 380px) {
		.tuner-page {
			padding: 0.5rem;
		}
	}

	/* Landscape mode - reduce vertical spacing */
	@media (max-height: 500px) {
		.tuner-page {
			padding: 0.5rem;
		}
	}

	.tuner-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
		padding-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-height: var(--touch-target-min, 44px);
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-primary);
		font-weight: 500;
		transition: all 0.2s;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.back-button:hover {
		transform: translateX(-2px);
		background-color: var(--color-hover);
	}

	.back-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.header-title :global(.header-icon) {
		color: #f59e0b;
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	/* Tuning Selector */
	.tuning-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
		padding-bottom: 0.5rem;
		/* Prevent overflow on small screens */
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.tuning-selector label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.tuning-selector select {
		flex: 1;
		min-width: 0; /* Allow flex item to shrink below content size */
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s ease;
		/* Ensure minimum touch target size */
		min-height: var(--touch-target-min, 44px);
		box-sizing: border-box;
	}

	.tuning-selector select:hover {
		border-color: var(--color-primary);
	}

	.tuning-selector select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	/* Error Message */
	.tuner-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		flex-shrink: 0;
		margin-bottom: 0.5rem;
	}

	.tuner-error :global(svg) {
		flex-shrink: 0;
	}

	.tuner-error p {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.tuner-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		overflow: hidden;
		width: 100%;
		/* Ensure proper box sizing to prevent overflow */
		box-sizing: border-box;
	}

	/* Responsive adjustments */
	@media (min-width: 640px) {
		.tuner-page {
			padding: 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.tuning-selector label {
			font-size: 1rem;
		}

		.tuning-selector select {
			padding: 0.75rem 1rem;
			font-size: 1rem;
		}

		.back-button {
			font-size: 1rem;
		}
	}
</style>
