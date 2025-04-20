<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { derived } from 'svelte/store';

	export let detectedCents: number = 0;
	export let isCurrentlyTuned: boolean = false;
	export let needleRotationStore: ReturnType<typeof tweened<number>>; // Pass the tweened store

	// Derive rotation value from the store for use in template
	const needleRotation = derived(
		needleRotationStore,
		($needleRotationStore) => $needleRotationStore
	);

	// Calculate segment intensity based on cents
	function getSegmentIntensity(cents: number, index: number): number {
		const absCents = Math.abs(cents);
		// Segments light up based on 9-cent intervals
		return Math.min(1, Math.max(0, (absCents - index * 9) / 9));
	}
</script>

<div class="meter-display">
	<div class="segments-container">
		<div class="segments flat-segments">
			{#each Array(5) as _, i}
				<div
					class="segment flat-segment"
					class:active={detectedCents < 0 && Math.abs(detectedCents) > i * 9}
					style="--intensity: {getSegmentIntensity(detectedCents, i)}"
				></div>
			{/each}
		</div>

		<div class="center-segment" class:active={isCurrentlyTuned}></div>

		<div class="segments sharp-segments">
			{#each Array(5) as _, i}
				<div
					class="segment sharp-segment"
					class:active={detectedCents > 0 && Math.abs(detectedCents) > i * 9}
					style="--intensity: {getSegmentIntensity(detectedCents, i)}"
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

	<div class="cents-display" class:perfect={isCurrentlyTuned}>
		<span>
			{(isCurrentlyTuned ? 0 : detectedCents) > 0 ? '+' : ''}
			{isCurrentlyTuned ? 0 : detectedCents}
		</span>
		<span class="units">cents</span>
	</div>
</div>

<style>
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
		opacity: calc(0.5 + (var(--intensity) * 0.5));
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
		box-shadow: 0 0 10px var(--in-tune-color);
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
		color: var(--in-tune-color); /* Corrected variable name */
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
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.2s ease;
		border-radius: 1px;
		z-index: 1;
	}

	/* Use :global() to target parent class state */
	:global(.tuning-meter.perfect) .needle {
		background: var(--in-tune-color);
		box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
	}

	:global(.tuning-meter.flat) .needle {
		background: var(--flat-color);
	}

	:global(.tuning-meter.sharp) .needle {
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

	:global(.tuning-meter.perfect) .needle-center {
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
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.cents-display.perfect {
		color: var(--in-tune-color);
		background: rgba(76, 175, 80, 0.15);
		font-weight: 700;
	}

	.units {
		font-size: 0.8rem;
		font-weight: 500;
		opacity: 0.7;
		margin-left: 0.2rem;
	}

	@media (prefers-color-scheme: dark) {
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
	}
</style>
