<script lang="ts">
	import type { ParsedChord } from '$lib/utils/parsing/types';
	import { getChordByName } from '$lib/utils/chordUtils';
	import { chordTextColor } from '$lib/utils/visualizationConstants';
	import SvgChordDiagramRenderer from './SvgChordDiagramRenderer.svelte';

	interface Props {
		chord: ParsedChord;
		x: number;
		y: number;
		diagramY: number;
		fontSize: number;
		showDiagram: boolean;
	}

	let { chord, x, y, diagramY, fontSize, showDiagram }: Props = $props();

	const chordDefinition = $derived(showDiagram ? getChordByName(chord.name) : null);
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
