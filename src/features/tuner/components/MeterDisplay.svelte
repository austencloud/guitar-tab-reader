<script lang="ts">
	import { derived } from 'svelte/store';
	import type { Tweened } from 'svelte/motion';

	interface Props {
		detectedCents?: number;
		isCurrentlyTuned?: boolean;
		needleRotationStore: Tweened<number>;
	}

	let { detectedCents = 0, isCurrentlyTuned = false, needleRotationStore }: Props = $props();

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
		margin-bottom: var(--spacing-sm);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		box-shadow: inset var(--shadow-sm);
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
		transition: var(--transition-all);
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
		background: var(--color-success-bg);
		transition: var(--transition-all);
	}

	.center-segment.active {
		background: var(--in-tune-color);
		box-shadow: var(--glow-primary);
	}

	.indicator-labels {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: var(--spacing-xs);
		padding: 0 var(--spacing-xs);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
	}

	.flat-label {
		color: var(--flat-color);
	}

	.in-tune-label {
		color: var(--in-tune-color);
	}

	.sharp-label {
		color: var(--sharp-color);
	}

	.needle-container {
		position: relative;
		width: 100%;
		height: 60px;
		margin-top: var(--spacing-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.needle {
		position: absolute;
		height: 60px;
		width: 2px;
		background: var(--color-text-secondary);
		transform-origin: bottom center;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			background var(--transition-base);
		border-radius: var(--radius-sm);
		z-index: 1;
	}

	/* Use :global() to target parent class state */
	:global(.tuning-meter.perfect) .needle {
		background: var(--in-tune-color);
		box-shadow: var(--glow-primary);
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
		border-radius: var(--radius-full);
		background: var(--color-text-secondary);
		bottom: 0;
		z-index: 2;
		box-shadow: var(--shadow-md);
	}

	:global(.tuning-meter.perfect) .needle-center {
		background: var(--in-tune-color);
		box-shadow: var(--glow-primary);
	}

	.cents-display {
		margin-top: var(--spacing-md);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-secondary);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-full);
		background: var(--color-surface-low);
		transition: var(--transition-colors);
	}

	.cents-display.perfect {
		color: var(--color-success);
		background: var(--color-success-bg);
		font-weight: var(--font-weight-bold);
	}

	.units {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		opacity: 0.7;
		margin-left: var(--spacing-xs);
	}
</style>
