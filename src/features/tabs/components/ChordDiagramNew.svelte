<script lang="ts">
	import { SVGuitarChord } from 'svguitar';
	import type { ChordPosition } from '$lib/utils/chordDb';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		name: string;
		positions: ChordPosition[];
		size?: 'sm' | 'md' | 'lg';
		showNavigation?: boolean;
	}

	let {
		name,
		positions = [],
		size = 'lg',
		showNavigation = true
	}: Props = $props();

	let currentIndex = $state(0);
	let containerRef: HTMLDivElement | undefined = $state();

	// Size configurations
	const sizeConfig = {
		sm: { width: 100, height: 130, fontSize: 12 },
		md: { width: 150, height: 180, fontSize: 14 },
		lg: { width: 200, height: 240, fontSize: 16 }
	};

	const config = $derived(sizeConfig[size]);

	// Get current position
	const currentPosition = $derived(positions[currentIndex] || positions[0]);

	// Navigation handlers
	function nextPosition() {
		if (currentIndex < positions.length - 1) {
			currentIndex++;
		}
	}

	function previousPosition() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}

	// Convert frets array to finger positions array
	function parseFingerPositions(frets: number[], fingers: number[]): Array<[number, number | 'x']> {
		const result: Array<[number, number | 'x']> = [];

		for (let i = 0; i < frets.length; i++) {
			const fret = frets[i];
			const finger = fingers[i];

			if (fret === -1) {
				result.push([i + 1, 'x']); // String number, muted
			} else if (fret >= 0) {
				result.push([i + 1, fret]); // String number, fret number
			}
		}

		return result;
	}

	// Render the chord diagram
	function renderChord() {
		if (!containerRef || !currentPosition) return;

		// Clear previous diagram
		containerRef.innerHTML = '';

		try {
			const fingerPositions = parseFingerPositions(
				currentPosition.frets,
				currentPosition.fingers
			);

			// Convert barres array to SVGuitar format
			const barres = (currentPosition.barres || []).map((fret) => ({
				fret,
				fromString: 1,
				toString: 6
			}));

			// Create SVGuitar configuration
			const chordConfig = {
				fingers: fingerPositions,
				barres,
				title: name,
				position: currentPosition.baseFret || 1
			};

			// Create and render the chord
			new SVGuitarChord(containerRef)
				.configure({
					strings: 6,
					frets: 5,
					position: chordConfig.position,
					color: '#1976d2',
					backgroundColor: 'transparent',
					strokeWidth: 2,
					fretSize: 1.5,
					sidePadding: 10,
					titleBottomMargin: 10
				})
				.chord(chordConfig)
				.draw();
		} catch (error) {
			console.error('Error rendering chord diagram:', error);
			containerRef.innerHTML = '<p>Error rendering chord</p>';
		}
	}

	// Re-render when position changes or component mounts
	$effect(() => {
		if (containerRef && currentPosition) {
			renderChord();
		}
	});
</script>

<div class="chord-diagram-container" style="--width: {config.width}px;">
	<!-- Navigation controls -->
	{#if showNavigation && positions.length > 1}
		<div class="navigation-header">
			<button
				class="nav-button"
				onclick={previousPosition}
				disabled={currentIndex === 0}
				aria-label="Previous voicing"
			>
				<ChevronLeft size={20} />
			</button>

			<span class="position-indicator">
				Position {currentIndex + 1} of {positions.length}
			</span>

			<button
				class="nav-button"
				onclick={nextPosition}
				disabled={currentIndex === positions.length - 1}
				aria-label="Next voicing"
			>
				<ChevronRight size={20} />
			</button>
		</div>
	{/if}

	<!-- SVG container -->
	<div class="svg-container" bind:this={containerRef}></div>

	<!-- Position info -->
	{#if currentPosition}
		<div class="position-info">
			{#if currentPosition.baseFret && currentPosition.baseFret > 1}
				<span class="base-fret">Starting at fret {currentPosition.baseFret}</span>
			{/if}
			{#if currentPosition.capo}
				<span class="capo-indicator">Capo position</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.chord-diagram-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: var(--width);
		padding: 10px;
	}

	.navigation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 10px;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.nav-button:hover:not(:disabled) {
		background: #e0e0e0;
		border-color: #bbb;
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.position-indicator {
		font-size: 14px;
		font-weight: 500;
		color: #555;
		white-space: nowrap;
	}

	.svg-container {
		width: 100%;
		min-height: 200px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.position-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: #666;
	}

	.base-fret {
		font-weight: 500;
	}

	.capo-indicator {
		color: #1976d2;
		font-weight: 600;
	}

	/* Dark theme support */
	@media (prefers-color-scheme: dark) {
		.nav-button {
			background: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.nav-button:hover:not(:disabled) {
			background: #444;
			border-color: #666;
		}

		.position-indicator {
			color: #ccc;
		}

		.position-info {
			color: #aaa;
		}

		.capo-indicator {
			color: #64b5f6;
		}
	}

	/* Touch-friendly on mobile */
	@media (max-width: 768px) {
		.nav-button {
			padding: 10px;
		}
	}
</style>

