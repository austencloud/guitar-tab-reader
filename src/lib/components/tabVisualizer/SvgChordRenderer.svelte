<script lang="ts">
	import type { ParsedChord } from '$lib/utils/parsing/types';
	import { getChordByName, type ChordDefinition } from '$lib/utils/chordUtils';
	import { chordTextColor } from '$lib/utils/visualizationConstants';
	import SvgChordDiagramRenderer from './SvgChordDiagramRenderer.svelte';

	export let chord: ParsedChord;
	export let x: number;
	export let y: number; // Y position for the chord name text (above the staff)
	export let diagramY: number; // Y position for the top of the chord diagram
	export let fontSize: number;
	export let showDiagram: boolean;

	// Correct reactive declaration syntax
	$: chordDefinition = showDiagram ? getChordByName(chord.name) : null;
</script>

<g class="chord-display">
	<!-- Chord Name -->
	<text
		{x}
		{y}
		font-size={fontSize}
		font-weight="bold"
		fill={chordTextColor}
		text-anchor="middle"
		dominant-baseline="auto">{chord.name}</text
	>

	<!-- Chord Diagram -->
	{#if chordDefinition}
		<SvgChordDiagramRenderer
			chordDiagramData={chordDefinition}
			x={x - (fontSize * 5) / 2}
			y={diagramY}
			{fontSize}
		/>
	{/if}
</g>
