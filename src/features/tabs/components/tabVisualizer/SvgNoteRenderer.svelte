<script lang="ts">
	import type { ParsedNote } from '$lib/utils/parsing/types';
	import {
		stringColors,
		techniqueColors,
		defaultColor,
		highlightColor
	} from '$lib/utils/visualizationConstants';
	import { tick } from 'svelte';

	interface Props {
		note: ParsedNote;
		stringIndex: number;
		x: number;
		y: number;
		fontSize: number;
		stringSpacing: number;
		xScale: number;
		currentPosition: number;
		notePosition: number;
	}

	let {
		note,
		stringIndex,
		x,
		y,
		fontSize,
		stringSpacing,
		xScale,
		currentPosition,
		notePosition
	}: Props = $props();

	let highlightOffset = $state(0);
	let animationFrameId = $state<number | null>(null);

	const textX = $derived(x);
	const textY = $derived(y + fontSize / 4);
	const techniqueTextX = $derived(x + fontSize);
	const techniqueTextY = $derived(y);
	const noteColor = $derived(stringColors[stringIndex % stringColors.length] || defaultColor);

	const isHighlighted = $derived(
		Math.floor(currentPosition / (fontSize * xScale)) === notePosition
	);

	// Technique calculations
	const technique = $derived(note.technique);
	const techniqueFret = $derived(note.techniqueFret);
	const techniqueColor = $derived(
		technique ? techniqueColors[technique.charAt(0)] || defaultColor : defaultColor
	);

	// Technique path calculations
	const techStartX = $derived(x + fontSize / 2);
	const techEndX = $derived(x + fontSize * 2); // For h, p, /, \
	const bendEndX = $derived(x + fontSize * 1.5); // For b
	const bendHeight = $derived(stringSpacing);
	const vibratoStartX = $derived(x + fontSize / 2);

	const slidePath = $derived(
		`M ${techStartX} ${y} C ${x + fontSize} ${y - stringSpacing / 2}, ${techEndX - fontSize} ${y - stringSpacing / 2}, ${techEndX} ${y}`
	);
	const bendPath = $derived(
		`M ${techStartX} ${y} Q ${x + fontSize} ${y - bendHeight}, ${bendEndX} ${y - bendHeight}`
	);
	const vibratoPath = $derived(`M ${vibratoStartX} ${y} q 2 -3, 4 0 t 4 0 t 4 0 t 4 0`);

	function animateHighlight() {
		highlightOffset = (Date.now() / 100) % 6; // Adjust speed/length as needed
		if (isHighlighted) {
			animationFrameId = requestAnimationFrame(animateHighlight);
		}
	}

	$effect(() => {
		if (isHighlighted && !animationFrameId) {
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
		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});
</script>

<g class="note-group">
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
