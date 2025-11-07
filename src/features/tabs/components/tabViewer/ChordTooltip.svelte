<script lang="ts">
	import { fade } from 'svelte/transition';
	import ChordDiagram from '../ChordDiagram.svelte';
	import type { ProcessedChord } from '$lib/utils/chordDb';

	interface Props {
		visible?: boolean;
		chord?: ProcessedChord | null;
		x?: number;
		y?: number;
		placement?: 'above' | 'below';
		isMobile?: boolean;
		onmouseenter?: (event: MouseEvent) => void;
		onmouseleave?: (event: MouseEvent) => void;
	}

	let {
		visible = false,
		chord = null,
		x = 0,
		y = 0,
		placement = 'below',
		isMobile = false,
		onmouseenter,
		onmouseleave
	}: Props = $props();

	let element = $state<HTMLDivElement>();

	// Convert first ChordPosition to old format for tooltip
	function convertToOldFormat(chord: ProcessedChord) {
		const position = chord.positions[0]; // Always use first position for tooltip
		if (!position) return { positions: [], barre: undefined, baseFret: 1 };

		// frets is already an array of numbers from the chord database
		// Just use it directly (it's already in the correct format)
		const positions = position.frets;

		// Get first barre if exists
		const barre = position.barres && position.barres.length > 0 ? position.barres[0] : undefined;

		return {
			positions,
			barre,
			baseFret: position.baseFret || 1
		};
	}

	const chordData = $derived(
		chord ? convertToOldFormat(chord) : { positions: [], barre: undefined, baseFret: 1 }
	);

	// Expose the element for positioning calculations
	export function getElement() {
		return element;
	}
</script>

{#if visible && chord}
	<div
		bind:this={element}
		class="chord-tooltip"
		class:visible
		style:left="{x}px"
		style:top="{y}px"
		style:--origin="{placement === 'above' ? 'bottom' : 'top'} center"
		role="tooltip"
		aria-hidden={!visible}
		transition:fade={{ duration: 150 }}
		{onmouseenter}
		{onmouseleave}
	>
		<ChordDiagram
			name={chord.name}
			positions={chordData.positions}
			barre={chordData.barre}
			baseFret={chordData.baseFret}
			size={isMobile ? 'sm' : 'md'}
		/>
	</div>
{/if}

<style>
	.chord-tooltip {
		position: absolute;
		background-color: var(--tooltip-bg, #fff);
		color: var(--tooltip-text, #333);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 10px;
		z-index: 100;
		opacity: 0;
		transform: scale(0.9);
		transform-origin: var(--origin, top center);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		pointer-events: none;
		touch-action: none;
		contain: layout style; /* Optimize rendering */
	}

	.chord-tooltip.visible {
		opacity: 1;
		transform: scale(1);
		pointer-events: auto;
		touch-action: auto;
	}

	@media (prefers-color-scheme: dark) {
		.chord-tooltip {
			--tooltip-bg: #2d2d2d;
			--tooltip-text: #e0e0e0;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chord-tooltip {
			transition: none !important;
		}
	}
</style>
