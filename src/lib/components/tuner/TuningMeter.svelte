<script lang="ts">
	import type { StringDefinition } from '../../utils/tuner/types';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount, type ComponentProps } from 'svelte';

	export let detectedCents: number = 0;
	export let closestString: StringDefinition | null = null;
	export let strings: StringDefinition[] = [];
	export let statusMessage: string = ''; // New prop for status message

	const needleRotation = tweened(0, {
		duration: 300,
		easing: cubicOut
	});

	let mounted = false;
	let lastDetectedCents = 0;

	// Define the threshold for being considered 'in tune'
	const TUNED_THRESHOLD = 7; // Cents

	// Reactive state to track if the current string is tuned
	$: isCurrentlyTuned = closestString && Math.abs(detectedCents) < TUNED_THRESHOLD;

	// Update needle rotation based on tuning status
	$: if (mounted) {
		if (isCurrentlyTuned) {
			// Snap to center if tuned - Reduced duration for faster snap
			needleRotation.set(0, { duration: 50 });
		} else if (closestString) {
			// Follow detected cents smoothly if a string is detected but not perfectly tuned
			const targetRotation = Math.max(-45, Math.min(45, detectedCents));
			needleRotation.set(targetRotation); // Use default tween options
			lastDetectedCents = detectedCents;
		} else {
			// Reset if no string is detected
			needleRotation.set(0);
			lastDetectedCents = 0;
		}
	}

	// Determine overall tuning state, prioritizing 'perfect' when tuned
	$: tuningState = isCurrentlyTuned
		? 'perfect'
		: getTuningState(closestString ? detectedCents : lastDetectedCents);

	function getTuningState(cents: number) {
		const absCents = Math.abs(cents);
		if (absCents < 20) return 'perfect'; // More forgiving in-tune range
		if (cents < 0) return 'flat';
		return 'sharp';
	}

	function playReferenceNote(string: StringDefinition) {
		const audioContext = new AudioContext();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.value = string.frequency;

		gainNode.gain.setValueAtTime(0, audioContext.currentTime);
		gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.start();

		gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + 0.5);
		gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);

		setTimeout(() => {
			oscillator.stop();
			oscillator.disconnect();
			gainNode.disconnect();
		}, 1500);
	}

	onMount(() => {
		mounted = true;
	});
</script>

<div class="tuning-meter {tuningState}">
	<div class="note-info">
		{#if closestString}
			<span class="string-label">String {closestString.string}</span>
			<div class="note-name-wrapper">
				<span class="note-name">{closestString.note}{closestString.octave}</span>
			</div>
			<span class="frequency">{closestString.frequency.toFixed(1)}Hz</span>
		{:else}
			<!-- Render the statusMessage prop when no string is detected -->
			<span class="string-label">{statusMessage || 'Select a string'}</span>
			<div class="note-name-wrapper">
				<span class="note-name empty">--</span>
			</div>
			<span class="frequency">0.0Hz</span>
		{/if}
		<div class="perfect-indicator-wrapper">
			<!-- Use isCurrentlyTuned for the active class -->
			<span class="perfect-indicator" class:active={isCurrentlyTuned}> ✓ Perfect! </span>
		</div>
	</div>

	<div class="meter-display">
		<div class="segments-container">
			<div class="segments flat-segments">
				{#each Array(5) as _, i}
					<div
						class="segment flat-segment"
						class:active={closestString && detectedCents < 0 && Math.abs(detectedCents) > i * 9}
						style="--intensity: {Math.min(
							1,
							Math.max(0, (Math.abs(closestString ? detectedCents : 0) - i * 9) / 9)
						)}"
					></div>
				{/each}
			</div>

			<!-- Update center segment active class -->
			<div class="center-segment" class:active={isCurrentlyTuned}></div>

			<div class="segments sharp-segments">
				{#each Array(5) as _, i}
					<div
						class="segment sharp-segment"
						class:active={closestString && detectedCents > 0 && Math.abs(detectedCents) > i * 9}
						style="--intensity: {Math.min(
							1,
							Math.max(0, (Math.abs(closestString ? detectedCents : 0) - i * 9) / 9)
						)}"
					></div>
				{/each}
			</div>
		</div>

		<div class="indicator-labels">
			<span class="flat-label">♭ Flat</span>
			<span class="in-tune-label">In Tune</span>
			<span class="sharp-label">Sharp ♯</span>
		</div>

		<div class="needle-container">
			<div class="needle" style="transform: rotate({$needleRotation}deg)"></div>
			<div class="needle-center"></div>
		</div>

		<!-- Update cents display perfect class -->
		<div class="cents-display" class:perfect={isCurrentlyTuned}>
			<span
				>{(closestString ? detectedCents : 0) > 0 ? '+' : ''}{closestString
					? detectedCents
					: 0}</span
			>
			<span class="units">cents</span>
		</div>
	</div>

	<div class="string-buttons">
		{#each strings as string}
			<button
				class="string-button"
				class:active={closestString?.string === string.string}
				on:click={() => playReferenceNote(string)}
			>
				{string.note}{string.octave}
				<span class="string-number">{string.string}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.tuning-meter {
		--flat-color: #2196f3;
		--in-tune-color: #4caf50;
		--sharp-color: #f44336;

		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		padding: 1.5rem;
		border-radius: 16px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.tuning-meter.perfect {
		box-shadow: 0 4px 24px rgba(76, 175, 80, 0.2);
	}

	.note-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.5rem;
		height: 160px; /* Fixed height to prevent layout shifts */
		justify-content: center;
	}

	.string-label {
		font-size: 0.875rem;
		color: #78909c;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 500;
	}

	.note-name-wrapper {
		height: 4.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.note-name {
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		margin: 0.5rem 0;
		color: #4caf50; /* Use solid color */
		/* Remove background clipping for broader compatibility */
		/* background: linear-gradient(45deg, #4caf50, #66bb6a); */
		/* -webkit-background-clip: text; */
		/* background-clip: text; */
		/* -webkit-text-fill-color: transparent; */
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
	}

	.note-name.empty {
		color: #9e9e9e;
		/* background: #9e9e9e; */
		/* -webkit-text-fill-color: transparent; */
		text-shadow: none;
	}

	.frequency {
		font-size: 1rem;
		color: #607d8b;
		margin-bottom: 0.5rem;
	}

	.perfect-indicator-wrapper {
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.perfect-indicator {
		color: var(--in-tune-color);
		font-weight: 600;
		font-size: 0.9rem;
		opacity: 0;
		transform: scale(0);
		transition: all 0.3s ease;
	}

	.perfect-indicator.active {
		opacity: 1;
		transform: scale(1);
		animation: pulse 1.5s infinite;
	}

	.meter-display {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.segments-container {
		display: flex;
		width: 100%;
		height: 16px;
		margin-bottom: 8px;
		border-radius: 8px;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.05);
	}

	.segments {
		display: flex;
		flex: 1;
		height: 100%;
	}

	.flat-segments {
		flex-direction: row-reverse;
	}

	.sharp-segments {
		flex-direction: row;
	}

	.segment {
		flex: 1;
		height: 100%;
		opacity: 0.3;
		transition: all 0.2s ease;
	}

	.segment.active {
		opacity: calc(0.4 + (var(--intensity) * 0.6));
		transform: scaleY(1.1);
	}

	.flat-segment {
		background: var(--flat-color);
	}

	.sharp-segment {
		background: var(--sharp-color);
	}

	.center-segment {
		width: 20px;
		height: 100%;
		background: rgba(76, 175, 80, 0.3);
		transition: all 0.2s ease;
	}

	.center-segment.active {
		background: var(--in-tune-color);
		box-shadow: 0 0 8px var(--in-tune-color);
	}

	.indicator-labels {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: 4px;
		padding: 0 2px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.flat-label {
		color: var(--flat-color);
	}

	.in-tune-label {
		color: var (--in-tune-color);
	}

	.sharp-label {
		color: var(--sharp-color);
	}

	.needle-container {
		position: relative;
		width: 100%;
		height: 80px;
		margin-top: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.needle {
		position: absolute;
		height: 80px;
		width: 2px;
		background: #333;
		transform-origin: bottom center;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		border-radius: 1px;
		z-index: 1;
	}

	.tuning-meter.perfect .needle {
		background: var(--in-tune-color);
		box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
	}

	.tuning-meter.flat .needle {
		background: var(--flat-color);
	}

	.tuning-meter.sharp .needle {
		background: var(--sharp-color);
	}

	.needle-center {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #333;
		bottom: 0;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.tuning-meter.perfect .needle-center {
		background: var(--in-tune-color);
		box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
	}

	.cents-display {
		margin-top: 16px;
		font-size: 1.1rem;
		font-weight: 700;
		color: #607d8b;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		background: rgba(0, 0, 0, 0.03);
	}

	.cents-display.perfect {
		color: var(--in-tune-color);
		background: rgba(76, 175, 80, 0.1);
	}

	.units {
		font-size: 0.8rem;
		font-weight: 500;
		opacity: 0.7;
		margin-left: 0.2rem;
	}

	.string-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 20px;
		width: 100%;
	}

	.string-button {
		position: relative;
		min-width: 60px;
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.05);
		border: none;
		border-radius: 8px;
		color: #424242;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.string-button:hover {
		background: rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.string-button.active {
		background: rgba(76, 175, 80, 0.15);
		color: #2e7d32;
		box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
	}

	.string-number {
		position: absolute;
		top: -6px;
		right: -6px;
		background: #9e9e9e;
		color: white;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.string-button.active .string-number {
		background: #4caf50;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (prefers-color-scheme: dark) {
		.tuning-meter {
			background: linear-gradient(to bottom, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.8));
			box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
		}

		.string-label {
			color: #b0bec5;
		}

		.note-name {
			/* Ensure dark mode color is also solid if needed */
			color: #66bb6a;
			/* background: linear-gradient(45deg, #66bb6a, #81c784); */
		}

		.frequency {
			color: #90a4ae;
		}

		.segments-container {
			background: rgba(255, 255, 255, 0.1);
		}

		.needle,
		.needle-center {
			background: #e0e0e0;
		}

		.cents-display {
			color: #b0bec5;
			background: rgba(255, 255, 255, 0.05);
		}

		.indicator-labels {
			opacity: 0.9;
		}

		.string-button {
			background: rgba(255, 255, 255, 0.1);
			color: #e0e0e0;
		}

		.string-button:hover {
			background: rgba(255, 255, 255, 0.15);
		}

		.string-button.active {
			background: rgba(76, 175, 80, 0.3);
			color: #a5d6a7;
		}
	}
</style>
