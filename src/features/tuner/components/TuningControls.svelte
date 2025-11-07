<script lang="ts">
	import { getTunings, getSelectedTuning } from '../services/TuningDefinitions.svelte';
	import { getIsListening } from '../services/AudioProcessor.svelte';

	interface Props {
		selectedTuning?: string;
		onstart?: () => void;
		onstop?: () => void;
		ontuningChange?: (tuning: string) => void;
	}

	let { selectedTuning = 'Standard', onstart, onstop, ontuningChange }: Props = $props();

	// Derive reactive values from service getters
	let tunings = $derived(getTunings());
	let isListening = $derived(getIsListening());

	function toggleTuner() {
		if (isListening) {
			onstop?.();
		} else {
			onstart?.();
		}
	}

	// Watch for tuning changes and notify parent
	$effect(() => {
		if (selectedTuning) {
			ontuningChange?.(selectedTuning);
		}
	});
</script>

<div class="tuner-controls" role="group" aria-label="Tuner controls">
	<div class="control-group">
		<label for="tuning-select" class="control-label">Guitar Tuning:</label>
		<select id="tuning-select" bind:value={selectedTuning} aria-describedby="tuning-help">
			{#each Object.keys(tunings) as tuning}
				<option value={tuning}>{tuning}</option>
			{/each}
		</select>
		<div id="tuning-help" class="sr-only">Select the tuning you want to tune your guitar to</div>
	</div>

	<button
		class="tuner-toggle"
		class:active={isListening}
		onclick={toggleTuner}
		aria-pressed={isListening}
		aria-describedby="tuner-status"
	>
		<span class="button-text">{isListening ? 'Stop Tuner' : 'Start Tuner'}</span>
	</button>

	<div id="tuner-status" class="sr-only" aria-live="polite">
		{isListening ? 'Tuner is listening for audio input' : 'Tuner is stopped'}
	</div>
</div>

<style>
	.tuner-controls {
		display: flex;
		gap: var(--spacing-lg);
		align-items: center;
		margin-bottom: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.control-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xs);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.tuner-toggle {
		min-height: var(--touch-target-min);
		padding: var(--spacing-md) var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-success), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: var(--transition-all);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--letter-spacing-tight);
		font-size: var(--font-size-base);
		box-shadow: var(--shadow-md);
		position: relative;
		overflow: hidden;
	}

	.tuner-toggle::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 70%
		);
		transform: translateX(-100%);
		transition: transform 0.6s;
	}

	.tuner-toggle:hover::before {
		transform: translateX(100%);
	}

	.tuner-toggle:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.tuner-toggle:active {
		transform: translateY(0);
		box-shadow: var(--shadow-md);
	}

	.tuner-toggle:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tuner-toggle.active {
		background: linear-gradient(135deg, var(--color-error), #dc2626);
		animation: pulse-error 2s infinite ease-in-out;
	}

	.tuner-toggle.active:hover {
		box-shadow: var(--shadow-lg), 0 0 20px rgba(248, 113, 113, 0.3);
	}

	@keyframes pulse-error {
		0%,
		100% {
			box-shadow:
				var(--shadow-sm),
				0 0 0 0 color-mix(in srgb, var(--color-error) 40%, transparent);
		}
		50% {
			box-shadow:
				var(--shadow-md),
				0 0 0 8px color-mix(in srgb, var(--color-error) 0%, transparent);
		}
	}

	select {
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		transition: var(--transition-all);
		cursor: pointer;
		min-width: 140px;
	}

	select:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	select:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}
</style>
