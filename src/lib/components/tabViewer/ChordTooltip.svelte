<script lang="ts">
	import { fade } from 'svelte/transition';
	import ChordDiagram from '../ChordDiagram.svelte';
	import type { ProcessedChord } from '../../utils/chordUtils';

	export let visible: boolean = false;
	export let chord: ProcessedChord | null = null;
	export let x: number = 0;
	export let y: number = 0;
	export let placement: 'above' | 'below' = 'below';
	export let isMobile: boolean = false;

	let element: HTMLDivElement;

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
		on:mouseenter
		on:mouseleave
	>
		<ChordDiagram
			name={chord.name}
			positions={chord.positions}
			barre={chord.barre}
			baseFret={chord.baseFret || 1}
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
