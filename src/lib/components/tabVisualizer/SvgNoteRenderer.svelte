<script lang="ts">
	import type { ParsedNote } from '$lib/utils/parsing/types';
	import {
		stringColors,
		techniqueColors,
		defaultColor,
		highlightColor
	} from '$lib/utils/visualizationConstants';
	import { tick } from 'svelte';

	export let note: ParsedNote;
	export let stringIndex: number;
	export let x: number;
	export let y: number;
	export let fontSize: number;
	export let stringSpacing: number;
	export let xScale: number;
	export let currentPosition: number; // Horizontal scroll position in pixels
	export let notePosition: number; // Character position of the note

	let element: SVGGElement;
	let highlightOffset = 0;
	let animationFrameId: number | null = null;

	$: noteX = x - fontSize / 2;
	$: noteY = y - fontSize / 2;
	$: textX = x;
	$: textY = y + fontSize / 4;
	$: techniqueTextX = x + fontSize;
	$: techniqueTextY = y;
	$: noteColor = stringColors[stringIndex % stringColors.length] || defaultColor;

	$: isHighlighted = Math.floor(currentPosition / (fontSize * xScale)) === notePosition;

	// Technique calculations
	$: technique = note.technique;
	$: techniqueFret = note.techniqueFret;
	$: techniqueColor = technique
		? techniqueColors[technique.charAt(0)] || defaultColor
		: defaultColor;

	// Technique path calculations
	$: techStartX = x + fontSize / 2;
	$: techEndX = x + fontSize * 2; // For h, p, /, \
	$: bendEndX = x + fontSize * 1.5; // For b
	$: bendHeight = stringSpacing;
	$: vibratoStartX = x + fontSize / 2;

	$: slidePath = `M ${techStartX} ${y} C ${x + fontSize} ${y - stringSpacing / 2}, ${techEndX - fontSize} ${y - stringSpacing / 2}, ${techEndX} ${y}`;
	$: bendPath = `M ${techStartX} ${y} Q ${x + fontSize} ${y - bendHeight}, ${bendEndX} ${y - bendHeight}`;
	$: vibratoPath = `M ${vibratoStartX} ${y} q 2 -3, 4 0 t 4 0 t 4 0 t 4 0`;

	function animateHighlight() {
		highlightOffset = (Date.now() / 100) % 6; // Adjust speed/length as needed
		if (isHighlighted) {
			animationFrameId = requestAnimationFrame(animateHighlight);
		}
	}

	$: if (isHighlighted && !animationFrameId) {
		// Start animation only when highlighted
		tick().then(() => {
			// Ensure element exists if needed, though direct attribute binding is preferred
			animationFrameId = requestAnimationFrame(animateHighlight);
		});
	} else if (!isHighlighted && animationFrameId) {
		// Stop animation when not highlighted
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
		highlightOffset = 0; // Reset offset
	}

	// Cleanup animation frame on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<g bind:this={element} class="note-group">
	<!-- Note Rectangle -->
	<rect
		{x}
		{y}
		width={fontSize}
		height={fontSize}
		rx="3"
		ry="3"
		fill={noteColor}
		stroke={isHighlighted ? highlightColor : 'none'}
		stroke-width={isHighlighted ? 3 : 0}
		stroke-dasharray={isHighlighted ? '3,3' : 'none'}
		stroke-dashoffset={isHighlighted ? highlightOffset : 0}
		transform="translate({-fontSize / 2}, {-fontSize / 2})"
	/>

	<!-- Fret Number -->
	<text
		x={textX}
		y={textY}
		font-size={fontSize * 0.8}
		fill="white"
		text-anchor="middle"
		dominant-baseline="middle">{note.fret}</text
	>

	<!-- Technique Indicator -->
	{#if technique}
		<!-- Technique Text (e.g., h, p, b, /, \, ~) -->
		<text
			x={techniqueTextX}
			y={techniqueTextY}
			font-size={fontSize * 0.8}
			fill={techniqueColor}
			dominant-baseline="middle">{technique}</text
		>

		<!-- Technique Visuals (Lines/Paths) -->
		{#if ['h', 'p', '/', '\\'].includes(technique) && techniqueFret !== undefined}
			<path d={slidePath} stroke={techniqueColor} stroke-width="2" fill="transparent" />
			<text
				x={techEndX}
				y={y - stringSpacing / 3}
				font-size={fontSize * 0.7}
				fill={techniqueColor}
				text-anchor="middle"
				dominant-baseline="middle">{techniqueFret}</text
			>
		{:else if technique.startsWith('b')}
			{@const bendAmount = technique.substring(1) || '1'}
			<path d={bendPath} stroke={techniqueColor} stroke-width="2" fill="transparent" />
			<text
				x={bendEndX}
				y={y - bendHeight - 5}
				font-size={fontSize * 0.7}
				fill={techniqueColor}
				text-anchor="middle"
				dominant-baseline="middle">{bendAmount}</text
			>
		{:else if technique === '~'}
			<path d={vibratoPath} stroke={techniqueColor} stroke-width="1.5" fill="transparent" />
		{/if}
	{/if}
</g>
