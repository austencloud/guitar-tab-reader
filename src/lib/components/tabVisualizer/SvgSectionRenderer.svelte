<script lang="ts">
	import type { ParsedSection } from '$lib/utils/parsing/types';
	import { stringColors, measureLineColor, defaultColor } from '$lib/utils/visualizationConstants';
	import SvgNoteRenderer from './SvgNoteRenderer.svelte';
	import SvgChordRenderer from './SvgChordRenderer.svelte';

	export let section: ParsedSection;
	export let stringCount: number;
	export let stringNames: string[];
	export let yOffset: number;
	export let fontSize: number;
	export let stringSpacing: number;
	export let xScale: number;
	export let tabWidth: number;
	export let showChordDiagrams: boolean;
	export let currentPosition: number;

	let sectionY = yOffset;

	// Adjust yOffset if title exists
	$: if (section.title) {
		sectionY += stringSpacing;
	}

	$: staffStartY = sectionY;
	$: staffEndY = staffStartY + (stringCount - 1) * stringSpacing;
	$: chordNameY = staffStartY - stringSpacing;
	$: chordDiagramY = staffStartY - stringSpacing * 5; // Position diagram above chord name
</script>

<g class="tab-section">
	<!-- Section Title -->
	{#if section.title}
		<text
			x="10"
			y={yOffset}
			font-size={fontSize * 1.2}
			font-weight="bold"
			fill={defaultColor}
			dominant-baseline="hanging">{section.title}</text
		>
	{/if}

	<!-- String Names -->
	{#each stringNames as name, i}
		<text
			x="5"
			y={staffStartY + i * stringSpacing}
			font-size={fontSize}
			fill={stringColors[i % stringColors.length] || defaultColor}
			text-anchor="end"
			dominant-baseline="middle">{name}</text
		>
	{/each}

	<!-- String Lines -->
	{#each { length: stringCount } as _, i}
		<line
			x1="10"
			y1={staffStartY + i * stringSpacing}
			x2={tabWidth - 10}
			y2={staffStartY + i * stringSpacing}
			stroke={stringColors[i % stringColors.length] || defaultColor}
			stroke-width="1"
		/>
	{/each}

	<!-- Positions (Measure Lines, Notes, Techniques) -->
	{#each section.positions as pos}
		{@const posX = 10 + pos.position * fontSize * xScale}

		<!-- Measure Line -->
		{#if pos.isMeasureLine}
			<line
				x1={posX}
				y1={staffStartY - stringSpacing / 2}
				x2={posX}
				y2={staffEndY + stringSpacing / 2}
				stroke={measureLineColor}
				stroke-width="2"
			/>
		{/if}

		<!-- Notes -->
		{#each pos.notes as note, stringIndex}
			<SvgNoteRenderer
				{note}
				{stringIndex}
				x={posX}
				y={staffStartY + stringIndex * stringSpacing}
				{fontSize}
				{stringSpacing}
				{xScale}
				{currentPosition}
				notePosition={pos.position}
			/>
		{/each}
	{/each}

	<!-- Chords -->
	{#each section.chords as chord}
		{@const chordX = 10 + chord.position * fontSize * xScale}
		<SvgChordRenderer
			{chord}
			x={chordX}
			y={chordNameY}
			diagramY={chordDiagramY}
			{fontSize}
			showDiagram={showChordDiagrams}
		/>
	{/each}
</g>
