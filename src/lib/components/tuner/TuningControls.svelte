<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { tunings } from '../../utils/tuner/TuningDefinitions';
	import { isListening } from '../../utils/tuner/AudioProcessor';

	export let selectedTuning: string = 'Standard';

	const dispatch = createEventDispatcher<{
		start: void;
		stop: void;
		tuningChange: string;
	}>();

	function toggleTuner() {
		if ($isListening) {
			dispatch('stop');
		} else {
			dispatch('start');
		}
	}

	$: if (selectedTuning) {
		dispatch('tuningChange', selectedTuning);
	}
</script>

<div class="tuner-controls">
	<select bind:value={selectedTuning}>
		{#each Object.keys($tunings) as tuning}
			<option value={tuning}>{tuning}</option>
		{/each}
	</select>

	<button class="tuner-toggle" class:active={$isListening} on:click={toggleTuner}>
		{$isListening ? 'Stop' : 'Start'}
	</button>
</div>

<style>
	.tuner-controls {
		display: flex;
		gap: 0.5rem;
	}

	.tuner-toggle {
		padding: 0.5rem 1rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.tuner-toggle:hover {
		background-color: #388e3c;
	}

	.tuner-toggle.active {
		background-color: #f44336;
	}

	.tuner-toggle.active:hover {
		background-color: #d32f2f;
	}

	select {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #ccc;
	}

	@media (prefers-color-scheme: dark) {
		select {
			background-color: #333;
			color: #e0e0e0;
			border-color: #555;
		}
	}
</style>
