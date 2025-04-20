<script lang="ts">
	// Import the new parser and types
	import { createTabParser, type ParsedTab as NewParsedTab, type ParsedSection } from '$lib/utils/parsing';
	import SvgSectionRenderer from './tabVisualizer/SvgSectionRenderer.svelte';
	import { onMount, onDestroy } from 'svelte';
	// Removed import { parseTab, type ParsedTab } from '$lib/utils/tabParser';

	export let content: string;
	export let fontSize: number = 14;
	export let showChordDiagrams: boolean = true;
	export let currentPosition: number = 0; // Horizontal pixel position

	let container: HTMLDivElement;
	let svgElement: SVGElement;
	// Use the new ParsedTab type
	let parsedTab: NewParsedTab | null = null;
	let tabWidth = 0;
	let tabHeight = 0;
	let stringSpacing = 0;
	let xScale = 0.5; // Units per character
	let resizeObserver: ResizeObserver | null = null;
	let sectionYOffsets: number[] = []; // Store pre-calculated offsets

	// Define reactive variables for stringCount and stringNames
	$: stringCount = parsedTab?.stringCount ?? 6;
	$: stringNames = parsedTab?.stringNames ?? ['e', 'B', 'G', 'D', 'A', 'E'];

	export { container };

	$: if (content) {
		// Use the new parser directly
		parsedTab = createTabParser().parse(content);
	}

	$: if (parsedTab && svgElement) {
		updateTabVisualization();
	}

	// ... onMount/onDestroy remain largely the same ...
	onMount(() => {
		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === container) {
					// Optional: Could recalculate based on container size if needed
					// updateTabVisualization();
				}
			}
		});

		if (container) {
			resizeObserver.observe(container);
		}

		// Initial parse and render
		if (content) {
			// Use the new parser directly
			parsedTab = createTabParser().parse(content);
			// updateTabVisualization will be triggered by the reactive statement
		}

		return () => {
			if (container && resizeObserver) {
				resizeObserver.unobserve(container);
			}
			resizeObserver = null;
		};
	});


	function updateTabVisualization() {
		if (!parsedTab) return;

		const { sections = [] } = parsedTab; // Default stringCount if undefined
		stringSpacing = Math.max(fontSize * 1.5, 20);

		let maxLength = 0;
		sections.forEach((section) => {
			section.lines.forEach((line) => {
				maxLength = Math.max(maxLength, line.length);
			});
		});

		tabWidth = maxLength * xScale * fontSize + 20; // Add padding

		// Calculate height and section offsets
		let currentY = stringSpacing; // Initial top padding
		sectionYOffsets = []; // Reset offsets

		sections.forEach((section) => {
			sectionYOffsets.push(currentY); // Store offset for this section

			let sectionHeight = 0;
			if (section.title) sectionHeight += stringSpacing; // Space for title
			sectionHeight += stringCount * stringSpacing; // Space for strings
			sectionHeight += stringSpacing * 2; // Space after section lines
			if (showChordDiagrams) {
				const hasChords = section.chords.length > 0;
				if (hasChords) sectionHeight += fontSize * 6 + stringSpacing; // Approx diagram height + margin
			}
			currentY += sectionHeight; // Update cumulative offset for the next section
		});
		tabHeight = currentY + stringSpacing; // Add bottom padding

		// No need to manually clear or create SVG elements here anymore
		// The template handles rendering based on reactive updates
	}

	// Removed highlightCurrentPosition and handleScroll
	// Highlighting is handled reactively within SvgNoteRenderer based on currentPosition prop
</script>

<div class="tab-viewer" bind:this={container}>
	{#if parsedTab}
		<svg
			bind:this={svgElement}
			width={tabWidth}
			height={tabHeight}
			viewBox="0 0 {tabWidth} {tabHeight}"
			role="img"
			aria-label="Guitar Tab Visualization"
			class="tab-svg-container"
		>
			{#each parsedTab.sections as section, sectionIndex (section.startLine ?? sectionIndex)}
				<SvgSectionRenderer
					{section}
					{stringCount} 
					{stringNames}
					yOffset={sectionYOffsets[sectionIndex]} 
					{fontSize}
					{stringSpacing}
					{xScale}
					{tabWidth}
					{showChordDiagrams}
					{currentPosition}
				/>
			{/each}
		</svg>
	{:else}
		<div class="tab-svg-container"></div>
		<!-- Placeholder or loading state -->
	{/if}
</div>

<style>
	/* ...existing styles... */
	.tab-viewer {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: auto;
		background-color: var(--viewer-bg, #f5f5f5);
		color: var(--viewer-text, #333);
		border-radius: 4px;
		padding: 1rem;
		contain: content; /* Optimize rendering */
	}

	.tab-svg-container {
		display: block; /* Ensure SVG behaves like a block element */
		min-width: 100%; /* Allow shrinking if content is smaller */
		/* min-height removed, height is set dynamically */
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-viewer {
			padding: 0.5rem;
			touch-action: pan-y pan-x; /* Allow panning */
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.tab-viewer {
			--viewer-bg: #1e1e1e;
			--viewer-text: #e0e0e0;
		}
		/* Update SVG colors via constants if needed, or use CSS variables */
	}
</style>
