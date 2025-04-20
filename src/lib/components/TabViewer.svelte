<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher, getContext } from 'svelte';
	import { loadChordDictionary, findChordsInText, type ProcessedChord } from '../utils/chordUtils';
	import { browser } from '$app/environment';
	import TabContentRenderer from './tabViewer/TabContentRenderer.svelte';
	import ChordTooltip from './tabViewer/ChordTooltip.svelte';
	import ChordModal from './tabViewer/ChordModal.svelte';

	// Props
	export let content: string = '';
	export let fontSize: number = 14;
	export let showChordDiagrams: boolean = true;

	// Internal state
	let container: HTMLDivElement; // Bound element for coordinate calculations
	let processedContentHtml: string = '';
	let chordsMap = new Map<string, ProcessedChord>(); // Store chord data by name
	let chordDictionaryLoaded = false;
	let contentHash = '';
	let isMobile = false;
	let isTouch = false;

	// Tooltip state
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipChord: ProcessedChord | null = null;
	let tooltipPlacement: 'above' | 'below' = 'below';
	let tooltipTimeout: number | null = null;
	let tooltipComponent: ChordTooltip; // Reference to the tooltip component instance

	// Modal state
	let modalVisible = false;
	let modalChord: ProcessedChord | null = null;

	const dispatch = createEventDispatcher<{ openTuner: void }>();
	const tunerContext = getContext<{ open: () => void }>('tuner'); // Simplified context example

	const TOOLTIP_DELAY = 150;
	const TOOLTIP_HIDE_DELAY = 300;

	// --- Reactive Computations ---

	$: contentStyle = `font-family: 'Courier New', monospace; font-size: ${fontSize}px; line-height: 1.5;`;

	// Re-process content when it changes or dictionary loads
	$: if (browser && content && chordDictionaryLoaded) {
		const newHash = hashString(content);
		if (newHash !== contentHash) {
			contentHash = newHash;
			processAndRenderContent();
		}
	} else if (!content) {
		processedContentHtml = ''; // Clear if content is empty
		contentHash = '';
	}

	// --- Lifecycle ---

	onMount(async () => {
		isMobile = window.matchMedia('(max-width: 768px)').matches;
		document.addEventListener('click', handleDocumentClick);
		document.addEventListener(
			'touchstart',
			() => {
				isTouch = true;
			},
			{ once: true, passive: true }
		);

		await loadChordDictionary();
		chordDictionaryLoaded = true; // Triggers reactive processing
	});

	onDestroy(() => {
		document.removeEventListener('click', handleDocumentClick);
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
	});

	// --- Core Logic ---

	function hashString(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0; // Convert to 32bit integer
		}
		return hash.toString();
	}

	async function processAndRenderContent() {
		if (!content) {
			processedContentHtml = '';
			chordsMap.clear();
			return;
		}

		const foundChords = findChordsInText(content);
		if (foundChords.length === 0) {
			processedContentHtml = content; // No chords, render plain text
			chordsMap.clear();
			return;
		}

		// Store chord data
		chordsMap.clear();
		foundChords.forEach((chord) => chordsMap.set(chord.name, chord));

		// Generate HTML with spans
		let result = '';
		let lastEnd = 0;
		// Sort by start index to process in order
		foundChords.sort((a, b) => a.startIndex - b.startIndex);

		for (const chord of foundChords) {
			result += escapeHtml(content.substring(lastEnd, chord.startIndex));
			// Add tabindex="0" to make spans focusable
			result += `<span class="chord" data-chord="${escapeHtml(chord.name)}" tabindex="0">${escapeHtml(chord.name)}</span>`;
			lastEnd = chord.endIndex;
		}
		result += escapeHtml(content.substring(lastEnd));

		processedContentHtml = result;

		// Wait for DOM update before potentially attaching handlers if needed (delegation preferred)
		await tick();
		// Event delegation handles clicks/hovers now
	}

	function escapeHtml(unsafe: string): string {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// --- Event Handlers ---

	function handleInteractionStart(event: MouseEvent | TouchEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;

		const chord = chordsMap.get(chordName);
		if (!chord) return;

		if (event.type === 'touchstart') {
			event.preventDefault(); // Prevent mouse events on touch devices
			isTouch = true;
			// Toggle behavior for touch
			if (tooltipVisible && tooltipChord?.name === chordName) {
				hideTooltip(0); // Hide immediately if tapping the same chord again
			} else {
				showTooltip(chord, target);
			}
		} else if (event.type === 'mouseenter' && !isTouch) {
			showTooltip(chord, target);
		}
	}

	function handleInteractionEnd(event: MouseEvent | TouchEvent) {
		const target = event.target as HTMLElement;
		if (event.type === 'mouseleave' && !isTouch && target.classList.contains('chord')) {
			hideTooltip();
		}
		// Touch end doesn't hide the tooltip, it stays until document click
	}

	function handleChordClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;

		const chord = chordsMap.get(chordName);
		if (!chord) {
			console.warn(`Chord data not found for: ${chordName}`);
			return;
		}

		modalChord = chord;
		modalVisible = true;
		hideTooltip(0); // Hide tooltip immediately when modal opens
		event.stopPropagation(); // Prevent document click handler from closing modal instantly
	}

	function handleDocumentClick(event: MouseEvent) {
		// Hide tooltip on any click outside the tooltip itself or a chord span
		if (tooltipVisible) {
			const target = event.target as Node;
			const tooltipEl = tooltipComponent?.getElement();
			const isClickInsideTooltip = tooltipEl?.contains(target);
			const isClickOnChord = (target as HTMLElement).classList?.contains('chord');

			if (!isClickInsideTooltip && !isClickOnChord) {
				hideTooltip(0);
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord')) return;

		// Trigger click (modal) on Enter or Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault(); // Prevent space from scrolling page
			handleChordClick(event as any); // Reuse click logic
		}
	}

	function handleFocusIn(event: FocusEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;
		const chord = chordsMap.get(chordName);
		if (!chord) return;

		// Show tooltip on focus, like mouseenter but without delay
		isTouch = false; // Ensure tooltip shows
		showTooltip(chord, target);
	}

	function handleFocusOut(event: FocusEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord')) return;

		// Hide tooltip on blur, like mouseleave
		hideTooltip();
	}

	// --- Tooltip Logic ---

	function showTooltip(chord: ProcessedChord, targetElement: HTMLElement) {
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);

		tooltipTimeout = window.setTimeout(
			async () => {
				tooltipChord = chord;
				tooltipVisible = true;

				// Calculate position after tooltip is rendered and measured
				await tick();
				positionTooltip(targetElement);
			},
			isTouch ? 0 : TOOLTIP_DELAY
		); // Show immediately on touch
	}

	function hideTooltip(delay: number = TOOLTIP_HIDE_DELAY) {
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
		tooltipTimeout = window.setTimeout(() => {
			tooltipVisible = false;
			tooltipChord = null;
		}, delay);
	}

	function positionTooltip(targetElement: HTMLElement) {
		if (!tooltipVisible || !tooltipComponent || !container) return;

		const tooltipEl = tooltipComponent.getElement();
		if (!tooltipEl) return;

		const targetRect = targetElement.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();

		// Calculate initial desired position (centered above/below target)
		const desiredX = targetRect.left + targetRect.width / 2 - containerRect.left;
		const desiredY = targetRect.top - containerRect.top;

		// Adjust X to stay within container bounds
		const minX = 10;
		const maxX = containerRect.width - tooltipRect.width - 10;
		tooltipX = Math.max(minX, Math.min(maxX, desiredX - tooltipRect.width / 2));

		// Decide placement (above/below) and set Y
		const spaceAbove = targetRect.top - containerRect.top;
		const spaceBelow = containerRect.bottom - targetRect.bottom;
		const tooltipHeight = tooltipRect.height;
		const margin = 10; // Space between target and tooltip

		if (spaceBelow >= tooltipHeight + margin || spaceBelow > spaceAbove) {
			tooltipY = desiredY + targetRect.height + margin;
			tooltipPlacement = 'below';
		} else {
			tooltipY = desiredY - tooltipHeight - margin;
			tooltipPlacement = 'above';
		}

		// Ensure Y is also within bounds (might be less critical depending on layout)
		tooltipY = Math.max(0, Math.min(containerRect.height - tooltipHeight, tooltipY));
	}

	function handleTooltipMouseEnter() {
		if (!isTouch) hideTooltip(999999); // Effectively cancel hide timeout on hover
	}

	function handleTooltipMouseLeave() {
		if (!isTouch) hideTooltip(); // Start hide timeout when leaving tooltip
	}

	// --- Modal Logic ---
	function handleModalClose() {
		modalVisible = false;
		modalChord = null;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- Main container for positioning and event delegation -->
<div
	class="tab-viewer"
	bind:this={container}
	role="region"
	aria-label="Tab Content"
	tabindex="-1"
	on:mouseenter={handleInteractionStart}
	on:mouseleave={handleInteractionEnd}
	on:touchstart={handleInteractionStart}
	on:click={handleChordClick}
	on:keydown={handleKeyDown}
	on:focusin={handleFocusIn}
	on:focusout={handleFocusOut}
>
	{#if chordDictionaryLoaded}
		<TabContentRenderer content={processedContentHtml} style={contentStyle} />

		<ChordTooltip
			bind:this={tooltipComponent}
			visible={tooltipVisible}
			chord={tooltipChord}
			x={tooltipX}
			y={tooltipY}
			placement={tooltipPlacement}
			{isMobile}
			on:mouseenter={handleTooltipMouseEnter}
			on:mouseleave={handleTooltipMouseLeave}
		/>
	{:else}
		<!-- Show plain content while dictionary loads -->
		<TabContentRenderer {content} style={contentStyle} />
	{/if}
</div>

<ChordModal visible={modalVisible} chord={modalChord} on:close={handleModalClose} />

<style>
	.tab-viewer {
		width: 100%;
		/* height: 100%; Removed */
		overflow-y: auto; /* Allow parent to control scroll if needed */
		overflow-x: auto;
		background-color: var(--viewer-bg, #f5f5f5);
		color: var(--viewer-text, #333);
		border-radius: 4px;
		padding: 1rem;
		position: relative; /* Needed for absolute positioning of tooltip */
		contain: layout style; /* Performance optimization */
		min-height: 100px; /* Ensure it has some height */
	}

	/* Global styles needed for chord spans generated in script */
	:global(.chord) {
		position: relative; /* Needed for potential pseudo-elements if added later */
		cursor: pointer;
		color: var(--chord-color, #1e88e5);
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
		border-radius: 3px;
		padding: 0 2px;
		transition: background-color 0.1s ease;
	}

	:global(.chord:hover) {
		background-color: var(--chord-hover-bg, rgba(30, 136, 229, 0.1));
	}

	/* --- Dark Mode --- */
	@media (prefers-color-scheme: dark) {
		.tab-viewer {
			--viewer-bg: #1e1e1e;
			--viewer-text: #e0e0e0;
			--chord-color: #64b5f6;
			--chord-hover-bg: rgba(100, 181, 246, 0.2);
		}
	}

	/* --- Mobile --- */
	@media (max-width: 768px) {
		.tab-viewer {
			padding: 0.5rem;
			touch-action: pan-y; /* Allow vertical scrolling on touch */
		}
	}
</style>
