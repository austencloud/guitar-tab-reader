<script lang="ts">
	import type { ChordDefinition } from '$lib/utils/chordUtils';
	import {
		chordDiagramBgColor,
		chordDiagramDotColor,
		chordDiagramFretColor,
		chordDiagramMutedColor,
		chordDiagramNutColor,
		chordDiagramStrokeColor
	} from '$lib/utils/visualizationConstants';

	export let chordDiagramData: ChordDefinition;
	export let x: number;
	export let y: number;
	export let fontSize: number;

	$: diagramWidth = fontSize * 5;
	$: diagramHeight = fontSize * 6;
	$: fretSpacing = diagramHeight / 5;
	$: stringSpacingDiagram = diagramWidth / 5;
	$: dotRadius = fontSize / 3;
	$: mutedMarkSize = fontSize / 4;
	$: barreHeight = fontSize / 2;
	$: barreRadius = fontSize / 5; // Smaller radius for narrower barre appearance
</script>

<g class="chord-diagram">
	<!-- Background -->
	<rect
		x={x - 5}
		y={y - 5}
		width={diagramWidth + 10}
		height={diagramHeight + 10}
		rx="5"
		ry="5"
		fill={chordDiagramBgColor}
		stroke={chordDiagramStrokeColor}
	/>

	<!-- Frets (Horizontal lines) -->
	{#each { length: 6 } as _, i}
		<line
			x1={x}
			y1={y + i * fretSpacing}
			x2={x + diagramWidth}
			y2={y + i * fretSpacing}
			stroke={i === 0 ? chordDiagramNutColor : chordDiagramFretColor}
			stroke-width={i === 0 ? '2' : '1'}
		/>
	{/each}

	<!-- Strings (Vertical lines) -->
	{#each { length: 6 } as _, i}
		<line
			x1={x + i * stringSpacingDiagram}
			y1={y}
			x2={x + i * stringSpacingDiagram}
			y2={y + diagramHeight}
			stroke={chordDiagramFretColor}
			stroke-width="1"
		/>
	{/each}

	<!-- Barre -->
	{#if chordDiagramData.barre !== undefined}
		{@const barreFret = chordDiagramData.barre}
		{@const barreYPos = y + barreFret * fretSpacing - fretSpacing / 2}
		{@const stringIndices = chordDiagramData.positions
			.map((fret: number | string, idx: number) => (fret === barreFret ? idx : -1))
			.filter((idx: number) => idx !== -1)}
		{#if stringIndices.length > 0}
			{@const firstStringIdx = Math.min(...stringIndices)}
			{@const lastStringIdx = Math.max(...stringIndices)}
			{@const barStartX = x + (5 - lastStringIdx) * stringSpacingDiagram}
			{@const barEndX = x + (5 - firstStringIdx) * stringSpacingDiagram}
			<rect
				x={barStartX - barreRadius}
				y={barreYPos - barreRadius}
				width={barEndX - barStartX + barreRadius * 2}
				height={barreHeight}
				rx={barreRadius}
				fill={chordDiagramDotColor}
			/>
		{/if}
	{/if}

	<!-- Finger Positions & Muted Strings -->
	{#each chordDiagramData.positions as fret, stringIndex}
		{@const stringX = x + (5 - stringIndex) * stringSpacingDiagram}
		{#if fret >= 0}
			{@const dotY = y + (fret === 0 ? 0 : fret * fretSpacing - fretSpacing / 2)}
			<!-- Draw circle for fretted note (unless it's part of the barre) -->
			{#if !(chordDiagramData.barre !== undefined && fret === chordDiagramData.barre)}
				<circle
					cx={stringX}
					cy={dotY}
					r={dotRadius}
					fill={fret === 0 ? 'transparent' : chordDiagramDotColor}
					stroke={fret === 0 ? chordDiagramNutColor : 'none'}
					stroke-width="1"
				/>
			{/if}
		{:else}
			<!-- X for muted strings -->
			{@const mutedY = y - fretSpacing / 2}
			<line
				x1={stringX - mutedMarkSize}
				y1={mutedY - mutedMarkSize}
				x2={stringX + mutedMarkSize}
				y2={mutedY + mutedMarkSize}
				stroke={chordDiagramMutedColor}
				stroke-width="2"
			/>
			<line
				x1={stringX - mutedMarkSize}
				y1={mutedY + mutedMarkSize}
				x2={stringX + mutedMarkSize}
				y2={mutedY - mutedMarkSize}
				stroke={chordDiagramMutedColor}
				stroke-width="2"
			/>
		{/if}
	{/each}
</g>
