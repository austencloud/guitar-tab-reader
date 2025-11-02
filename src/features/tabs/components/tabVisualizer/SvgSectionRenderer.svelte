<script lang="ts">
	import type { ParsedSection } from '$lib/utils/parsing/types';
	import { stringColors, measureLineColor, defaultColor } from '$lib/utils/visualizationConstants';
	import SvgNoteRenderer from './SvgNoteRenderer.svelte';
	import SvgChordRenderer from './SvgChordRenderer.svelte';

	interface Props {
		section: ParsedSection;
		stringCount: number;
		stringNames: string[];
		yOffset: number;
		fontSize: number;
		stringSpacing: number;
		xScale: number;
		tabWidth: number;
		showChordDiagrams: boolean;
		currentPosition: number;
	}

	let {
		section,
		stringCount,
		stringNames,
		yOffset,
		fontSize,
		stringSpacing,
		xScale,
		tabWidth,
		showChordDiagrams,
		currentPosition
	}: Props = $props();

	let sectionY = $state(yOffset);

	// Adjust yOffset if title exists
	$effect(() => {
		if (section.title) {
			sectionY = yOffset + stringSpacing;
		} else {
			sectionY = yOffset;
		}
	});

	const staffStartY = $derived(sectionY);
	const staffEndY = $derived(staffStartY + (stringCount - 1) * stringSpacing);
	const chordNameY = $derived(staffStartY - stringSpacing);
	const chordDiagramY = $derived(staffStartY - stringSpacing * 5);
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
