<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { useService } from '$lib/useService.svelte';
	import { TYPES } from '$core/di';
	import type { ProcessedChord } from '$lib/utils/chordDb';
	import type { ITabContentProcessor } from '../services/contracts/ITabContentProcessor';
	import type { IChordDictionaryService } from '../services/contracts/IChordDictionaryService';
	import type { IResponsiveFontCalculator } from '../services/contracts/IResponsiveFontCalculator';
	import { createTabViewerState } from '../state/tab-viewer-state.svelte';
	import TabContentRenderer from './tabViewer/TabContentRenderer.svelte';
	import ChordTooltip from './tabViewer/ChordTooltip.svelte';
	import ChordModal from './tabViewer/ChordModal.svelte';
	import GestureHandler from './tabViewer/GestureHandler.svelte';
	import ChordInteractionLayer from './tabViewer/ChordInteractionLayer.svelte';

	interface Props {
		content?: string;
		fontSize?: number;
		showChordDiagrams?: boolean;
		onopenTuner?: () => void;
	}

	let { content = '', fontSize = 14, showChordDiagrams = true, onopenTuner }: Props = $props();

	// Resolve services from DI container (lazily to avoid initialization race)
	let contentProcessor = $state<ITabContentProcessor>();
	let chordDictionaryService = $state<IChordDictionaryService>();
	let fontCalculator = $state<IResponsiveFontCalculator>();

	// Create component state
	const viewerState = createTabViewerState();

	// Component refs
	let container = $state<HTMLDivElement>();
	let chordDictionaryLoaded = $state(false);
	let resizeObserver: ResizeObserver | null = null;
	let tooltipTimeout: number | null = null;
	let tooltipComponent = $state<ChordTooltip>();
	let gestureHandler = $state<GestureHandler>();
	let chordInteractionLayer = $state<ChordInteractionLayer>();

	const TOOLTIP_DELAY = 150;
	const TOOLTIP_HIDE_DELAY = 300;

	// --- Reactive Computations ---

	// Calculate maximum safe font size using service
	const maxSafeFontSize = $derived(() => {
		if (!fontCalculator) return viewerState.currentUserFontSize;
		return fontCalculator.calculateMaxSafeFontSize(
			content,
			viewerState.containerWidth,
			viewerState.currentUserFontSize
		);
	});

	// Calculate responsive font size using service
	const responsiveFontSize = $derived(() => {
		if (!fontCalculator) return viewerState.currentUserFontSize;
		return fontCalculator.calculateResponsiveFontSize(
			viewerState.currentUserFontSize,
			maxSafeFontSize()
		);
	});

	const contentStyle = $derived(
		`font-family: 'Courier New', monospace; font-size: ${responsiveFontSize()}px; line-height: 1.5;`
	);

	// Re-process content when it changes, dictionary loads, or font size changes
	$effect(() => {
		const actualFontSize = responsiveFontSize();

		if (browser && content && chordDictionaryLoaded && contentProcessor) {
			const newHash = contentProcessor.hashContent(`${content}|${actualFontSize}|${viewerState.containerWidth}`);
			if (newHash !== viewerState.contentHash) {
				viewerState.contentHash = newHash;
				processAndRenderContent();
			}
		} else if (!content) {
			viewerState.processedContentHtml = '';
			viewerState.contentHash = '';
		}
	});

	// Sync user font size with props changes
	$effect(() => {
		viewerState.currentUserFontSize = fontSize;
	});

	// --- Lifecycle using $effect ---
	$effect(() => {
		(async () => {
			// Initialize services first
			contentProcessor = useService<ITabContentProcessor>(TYPES.ITabContentProcessor);
			chordDictionaryService = useService<IChordDictionaryService>(TYPES.IChordDictionaryService);
			fontCalculator = useService<IResponsiveFontCalculator>(TYPES.IResponsiveFontCalculator);

			viewerState.isMobile = window.matchMedia('(max-width: 768px)').matches;
			document.addEventListener('click', handleDocumentClick);
			document.addEventListener(
				'touchstart',
				() => {
					viewerState.isTouch = true;
				},
				{ once: true, passive: true }
			);

			await tick();

			// Add non-passive touchmove listener to allow preventDefault for pinch gestures
			if (container) {
				container.addEventListener('touchmove', handleGestureTouchMove, { passive: false });
			}

			// Set up ResizeObserver to track container width for responsive font sizing
			if (typeof ResizeObserver !== 'undefined' && container) {
				viewerState.containerWidth = container.clientWidth;
				resizeObserver = new ResizeObserver((entries) => {
					for (const entry of entries) {
						if (entry.target === container) {
							viewerState.containerWidth = entry.contentRect.width;
						}
					}
				});
				resizeObserver.observe(container);
			}

			await chordDictionaryService!.loadDictionary();
			chordDictionaryLoaded = true; // Triggers reactive processing
		})();

		return () => {
			// Cleanup
			document.removeEventListener('click', handleDocumentClick);
			if (container) {
				container.removeEventListener('touchmove', handleGestureTouchMove);
			}
			if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
			resizeObserver?.disconnect();
		};
	});

	// --- Core Logic ---

	async function processAndRenderContent() {
		if (!content || !contentProcessor) {
			viewerState.processedContentHtml = '';
			viewerState.chordsMap.clear();
			return;
		}

		const foundChords = contentProcessor.findChords(content);
		if (foundChords.length === 0) {
			viewerState.processedContentHtml = content; // No chords, render plain text
			viewerState.chordsMap.clear();
			return;
		}

		// Store chord data
		viewerState.chordsMap.clear();
		foundChords.forEach((chord) => viewerState.chordsMap.set(chord.name, chord));

		// Generate HTML with chord spans
		viewerState.processedContentHtml = contentProcessor.generateHtmlWithChords(content, foundChords);

		// Wait for DOM update
		await tick();
	}

	// --- Event Handlers ---

	// Delegate gesture events to GestureHandler component
	function handleGestureTouchStart(event: TouchEvent) {
		if (event.touches.length === 2) {
			gestureHandler?.handleTouchStart(event);
		} else if (event.touches.length === 1) {
			chordInteractionLayer?.handleInteractionStart(event);
		}
	}

	function handleGestureTouchMove(event: TouchEvent) {
		gestureHandler?.handleTouchMove(event);
	}

	function handleGestureTouchEnd(event: TouchEvent) {
		gestureHandler?.handleTouchEnd(event);
	}

	// Delegate chord interaction events to ChordInteractionLayer component
	function handleInteractionStart(event: MouseEvent | TouchEvent) {
		chordInteractionLayer?.handleInteractionStart(event);
	}

	function handleInteractionEnd(event: MouseEvent | TouchEvent) {
		chordInteractionLayer?.handleInteractionEnd(event);
	}

	function handleChordClick(event: MouseEvent) {
		chordInteractionLayer?.handleChordClick(event);
	}

	function handleFocusIn(event: FocusEvent) {
		chordInteractionLayer?.handleFocusIn(event);
	}

	function handleFocusOut(event: FocusEvent) {
		chordInteractionLayer?.handleFocusOut(event);
	}

	// Handle font size changes from gesture handler
	function handleFontSizeChange(newSize: number) {
		viewerState.currentUserFontSize = newSize;
	}

	// Handle touch detection from chord interaction layer
	function handleTouchDetected() {
		viewerState.isTouch = true;
	}

	// Handle modal display from chord interaction layer
	function handleShowModal(chord: ProcessedChord) {
		viewerState.showModal(chord);
	}

	function handleDocumentClick(event: MouseEvent) {
		// Hide tooltip on any click outside the tooltip itself or a chord span
		if (viewerState.tooltipVisible) {
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
		// Global keyboard shortcuts
		if (event.key === 't' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			onopenTuner?.();
			return;
		}

		// Delegate chord-related keyboard events to ChordInteractionLayer
		chordInteractionLayer?.handleKeyDown(event);
	}

	// --- Tooltip Logic ---

	function showTooltip(chord: ProcessedChord, targetElement: HTMLElement) {
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);

		tooltipTimeout = window.setTimeout(
			async () => {
				viewerState.tooltipChord = chord;
				viewerState.tooltipVisible = true;

				// Calculate position after tooltip is rendered and measured
				await tick();
				positionTooltip(targetElement);
			},
			viewerState.isTouch ? 0 : TOOLTIP_DELAY
		); // Show immediately on touch
	}

	function hideTooltip(delay: number = TOOLTIP_HIDE_DELAY) {
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
		tooltipTimeout = window.setTimeout(() => {
			viewerState.clearTooltip();
		}, delay);
	}

	function positionTooltip(targetElement: HTMLElement) {
		if (!viewerState.tooltipVisible || !tooltipComponent || !container) return;

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
		viewerState.tooltipX = Math.max(minX, Math.min(maxX, desiredX - tooltipRect.width / 2));

		// Decide placement (above/below) and set Y
		const spaceAbove = targetRect.top - containerRect.top;
		const spaceBelow = containerRect.bottom - targetRect.bottom;
		const tooltipHeight = tooltipRect.height;
		const margin = 10; // Space between target and tooltip

		if (spaceBelow >= tooltipHeight + margin || spaceBelow > spaceAbove) {
			viewerState.tooltipY = desiredY + targetRect.height + margin;
			viewerState.tooltipPlacement = 'below';
		} else {
			viewerState.tooltipY = desiredY - tooltipHeight - margin;
			viewerState.tooltipPlacement = 'above';
		}

		// Ensure Y is also within bounds (might be less critical depending on layout)
		viewerState.tooltipY = Math.max(0, Math.min(containerRect.height - tooltipHeight, viewerState.tooltipY));
	}

	function handleTooltipMouseEnter() {
		if (!viewerState.isTouch) hideTooltip(999999); // Effectively cancel hide timeout on hover
	}

	function handleTooltipMouseLeave() {
		if (!viewerState.isTouch) hideTooltip(); // Start hide timeout when leaving tooltip
	}

	// --- Modal Logic ---
	function handleModalClose() {
		viewerState.clearModal();
	}
</script>

<!-- Gesture Handler (invisible component for pinch-to-zoom) -->
<GestureHandler
	bind:this={gestureHandler}
	currentFontSize={viewerState.currentUserFontSize}
	maxFontSize={maxSafeFontSize()}
	onfontSizeChange={handleFontSizeChange}
/>

<!-- Chord Interaction Layer (invisible component for chord events) -->
<ChordInteractionLayer
	bind:this={chordInteractionLayer}
	chordsMap={viewerState.chordsMap}
	{showChordDiagrams}
	isTouch={viewerState.isTouch}
	onshowTooltip={showTooltip}
	onhideTooltip={hideTooltip}
	onshowModal={handleShowModal}
	ontouchDetected={handleTouchDetected}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- Main container for positioning and event delegation -->
<div
	class="tab-viewer tabscroll-tab-viewer"
	bind:this={container}
	role="region"
	aria-label="Tab Content"
	tabindex="-1"
	onmouseenter={handleInteractionStart}
	onmouseleave={handleInteractionEnd}
	ontouchstart={handleGestureTouchStart}
	ontouchend={handleGestureTouchEnd}
	onclick={handleChordClick}
	onkeydown={handleKeyDown}
	onfocusin={handleFocusIn}
	onfocusout={handleFocusOut}
>
	{#if chordDictionaryLoaded}
		<TabContentRenderer content={viewerState.processedContentHtml} style={contentStyle} />

		<ChordTooltip
			bind:this={tooltipComponent}
			visible={viewerState.tooltipVisible}
			chord={viewerState.tooltipChord}
			x={viewerState.tooltipX}
			y={viewerState.tooltipY}
			placement={viewerState.tooltipPlacement}
			isMobile={viewerState.isMobile}
			onmouseenter={handleTooltipMouseEnter}
			onmouseleave={handleTooltipMouseLeave}
		/>
	{:else}
		<!-- Show plain content while dictionary loads -->
		<TabContentRenderer {content} style={contentStyle} />
	{/if}
</div>

<ChordModal visible={viewerState.modalVisible} chord={viewerState.modalChord} onclose={handleModalClose} />

<style>
	.tab-viewer,
	.tabscroll-tab-viewer {
		width: 100%;
		box-sizing: border-box; /* Ensure padding is included in width calculation */
		/* height: 100%; Removed */
		overflow-y: auto; /* Allow parent to control scroll if needed */
		overflow-x: auto; /* Allow horizontal scrolling for chord alignment preservation */
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
