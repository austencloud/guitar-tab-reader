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
		height: clamp(14px, 3vw, 18px);
		margin-bottom: clamp(6px, 1.5vw, 10px);
		border-radius: clamp(8px, 2vw, 10px);
		overflow: hidden;

		/* Modern 2025 design */
		background: linear-gradient(
			135deg,
			rgba(0, 0, 0, 0.08),
			rgba(0, 0, 0, 0.04)
		);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
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
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
		position: relative;
	}

	.segment.active {
		opacity: calc(0.5 + (var(--intensity) * 0.5));
		transform: scaleY(1.15);
		filter: brightness(1.2);
	}

	.flat-segment {
		background: linear-gradient(180deg, var(--flat-color) 0%, #1976d2 100%);
	}

	.sharp-segment {
		background: linear-gradient(180deg, var(--sharp-color) 0%, #d32f2f 100%);
	}

	.center-segment {
		width: clamp(18px, 4vw, 24px);
		height: 100%;
		background: rgba(76, 175, 80, 0.3);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		position: relative;
	}

	.center-segment::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
		height: 80%;
		border-radius: 2px;
		background: rgba(76, 175, 80, 0.5);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.center-segment.active {
		background: linear-gradient(180deg, var(--in-tune-color) 0%, #43a047 100%);
		box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
	}

	.center-segment.active::after {
		opacity: 1;
		animation: centerPulse 1.5s ease-in-out infinite;
	}

	@keyframes centerPulse {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			transform: translate(-50%, -50%) scale(1.2);
		}
	}

	.indicator-labels {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: clamp(3px, 0.8vw, 5px);
		padding: 0 clamp(2px, 0.5vw, 4px);
		font-size: clamp(0.688rem, 1.8vw, 0.813rem);
		font-weight: 600;
		letter-spacing: 0.3px;
	}

	.flat-label {
		color: var(--flat-color);
		text-shadow: 0 1px 2px rgba(33, 150, 243, 0.2);
	}

	.in-tune-label {
		color: var(--in-tune-color);
		text-shadow: 0 1px 2px rgba(76, 175, 80, 0.2);
	}

	.sharp-label {
		color: var(--sharp-color);
		text-shadow: 0 1px 2px rgba(244, 67, 54, 0.2);
	}

	.needle-container {
		position: relative;
		width: 100%;
		height: clamp(60px, 15vw, 80px);
		margin-top: clamp(12px, 3vw, 16px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.needle {
		position: absolute;
		height: clamp(60px, 15vw, 80px);
		width: 2px;
		background: linear-gradient(180deg, #424242 0%, #616161 100%);
		transform-origin: bottom center;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.3s ease;
		border-radius: 1px;
		z-index: 1;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	/* Use :global() to target parent class state */
	:global(.tuning-meter.perfect) .needle {
		background: linear-gradient(180deg, var(--in-tune-color) 0%, #43a047 100%);
		box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
		filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.4));
	}

	:global(.tuning-meter.flat) .needle {
		background: linear-gradient(180deg, var(--flat-color) 0%, #1976d2 100%);
		box-shadow: 0 0 8px rgba(33, 150, 243, 0.4);
	}

	:global(.tuning-meter.sharp) .needle {
		background: linear-gradient(180deg, var(--sharp-color) 0%, #d32f2f 100%);
		box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
	}

	.needle-center {
		position: absolute;
		width: clamp(8px, 2vw, 11px);
		height: clamp(8px, 2vw, 11px);
		border-radius: 50%;
		background: linear-gradient(135deg, #424242 0%, #616161 100%);
		bottom: 0;
		z-index: 2;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(.tuning-meter.perfect) .needle-center {
		background: linear-gradient(135deg, var(--in-tune-color) 0%, #43a047 100%);
		box-shadow: 0 0 12px rgba(76, 175, 80, 0.7);
		animation: centerGlow 1.5s ease-in-out infinite;
	}

	@keyframes centerGlow {
		0%, 100% {
			box-shadow: 0 0 12px rgba(76, 175, 80, 0.7);
		}
		50% {
			box-shadow: 0 0 20px rgba(76, 175, 80, 0.9);
		}
	}

	.cents-display {
		margin-top: clamp(12px, 3vw, 16px);
		font-size: clamp(1rem, 2.5vw, 1.125rem);
		font-weight: 700;
		color: #607d8b;
		padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
		border-radius: clamp(10px, 2.5vw, 14px);

		/* Glassmorphism */
		background: linear-gradient(
			135deg,
			rgba(0, 0, 0, 0.04),
			rgba(0, 0, 0, 0.02)
		);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.cents-display.perfect {
		color: var(--in-tune-color);
		background: linear-gradient(
			135deg,
			rgba(76, 175, 80, 0.18),
			rgba(76, 175, 80, 0.1)
		);
		border-color: rgba(76, 175, 80, 0.3);
		box-shadow: 0 2px 12px rgba(76, 175, 80, 0.2);
		font-weight: 800;
		animation: perfectBounce 2s ease-in-out infinite;
	}

	@keyframes perfectBounce {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.units {
		font-size: clamp(0.75rem, 2vw, 0.875rem);
		font-weight: 600;
		opacity: 0.7;
		margin-left: 0.25rem;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.segments-container {
			background: linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.08),
				rgba(255, 255, 255, 0.04)
			);
			border-color: rgba(255, 255, 255, 0.06);
			box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
		}

		.needle,
		.needle-center {
			background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
		}

		.cents-display {
			color: #b0bec5;
			background: linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.06),
				rgba(255, 255, 255, 0.03)
			);
			border-color: rgba(255, 255, 255, 0.08);
		}

		.indicator-labels {
			opacity: 0.95;
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.segments-container {
			height: 15px;
			margin-bottom: 7px;
		}

		.needle-container {
			height: 65px;
			margin-top: 12px;
		}

		.needle {
			height: 65px;
		}

		.cents-display {
			margin-top: 12px;
			padding: 7px 13px;
		}
	}

	/* Extra small devices */
	@media (max-width: 360px) {
		.segments-container {
			height: 14px;
			margin-bottom: 6px;
		}

		.needle-container {
			height: 60px;
			margin-top: 10px;
		}

		.needle {
			height: 60px;
			width: 1.5px;
		}

		.needle-center {
			width: 8px;
			height: 8px;
		}

		.cents-display {
			font-size: 1rem;
			padding: 6px 12px;
		}
	}
</style>
