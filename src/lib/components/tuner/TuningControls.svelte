<script lang="ts">
	import { tunings } from '../../utils/tuner/TuningDefinitions';
	import { isListening } from '../../utils/tuner/AudioProcessor';

	interface Props {
		selectedTuning?: string;
		onstart?: () => void;
		onstop?: () => void;
		ontuningChange?: (tuning: string) => void;
	}

	let { selectedTuning = 'Standard', onstart, onstop, ontuningChange }: Props = $props();

	function toggleTuner() {
		if ($isListening) {
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
			{#each Object.keys($tunings) as tuning}
				<option value={tuning}>{tuning}</option>
			{/each}
		</select>
		<div id="tuning-help" class="sr-only">Select the tuning you want to tune your guitar to</div>
	</div>

	<button
		class="tuner-toggle"
		class:active={$isListening}
		onclick={toggleTuner}
		aria-pressed={$isListening}
		aria-describedby="tuner-status"
	>
		<span class="button-text">{$isListening ? 'Stop Tuner' : 'Start Tuner'}</span>
	</button>

	<div id="tuner-status" class="sr-only" aria-live="polite">
		{$isListening ? 'Tuner is listening for audio input' : 'Tuner is stopped'}
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
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-success);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: var(--transition-all);
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-base);
		box-shadow: var(--shadow-sm);
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
		background: color-mix(in srgb, var(--color-success) 85%, black);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.tuner-toggle:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.tuner-toggle.active {
		background: var(--color-error);
		animation: pulse-error 2s infinite ease-in-out;
	}

	.tuner-toggle.active:hover {
		background: color-mix(in srgb, var(--color-error) 85%, black);
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

	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
	}
</style>
