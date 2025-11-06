<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { loadChordDictionary, findChordsInText, type ProcessedChord } from '$lib/utils/chordUtils';
	import { browser } from '$app/environment';
	import TabContentRenderer from './tabViewer/TabContentRenderer.svelte';
	import ChordTooltip from './tabViewer/ChordTooltip.svelte';
	import ChordModal from './tabViewer/ChordModal.svelte';

	interface Props {
		content?: string;
		fontSize?: number;
		showChordDiagrams?: boolean;
		onopenTuner?: () => void;
	}

	let { content = '', fontSize = 14, showChordDiagrams = true, onopenTuner }: Props = $props();

	// Internal state
	let container = $state<HTMLDivElement>();
	let processedContentHtml = $state('');
	let chordsMap = $state(new Map<string, ProcessedChord>());
	let chordDictionaryLoaded = $state(false);
	let contentHash = $state('');
	let isMobile = $state(false);
	let isTouch = $state(false);
	let containerWidth = $state(0);
	let resizeObserver: ResizeObserver | null = null;

	// Pinch gesture state for font size control
	let initialPinchDistance = $state(0);
	let initialFontSize = $state(16);
	let isPinching = $state(false);
	let currentUserFontSize = $state(fontSize); // Track user's current font size preference

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipChord = $state<ProcessedChord | null>(null);
	let tooltipPlacement = $state<'above' | 'below'>('below');
	let tooltipTimeout = $state<number | null>(null);
	let tooltipComponent = $state<ChordTooltip>();

	// Modal state
	let modalVisible = $state(false);
	let modalChord = $state<ProcessedChord | null>(null);

	const TOOLTIP_DELAY = 150;
	const TOOLTIP_HIDE_DELAY = 300;

	// --- Reactive Computations ---

	// Calculate maximum safe font size (no overflow)
	const maxSafeFontSize = $derived(() => {
		if (!containerWidth || !content) return fontSize;
		
		// Find the longest line in the content
		const lines = content.split('\n');
		const longestLine = lines.reduce((longest, current) => 
			current.length > longest.length ? current : longest, '');
		
		if (!longestLine.length) return fontSize;
		
		// Calculate maximum font size that fits without overflow
		const availableWidth = containerWidth;
		const charWidthRatio = 0.6; // Monospace character width ratio
		const maxFontSize = availableWidth / (longestLine.length * charWidthRatio);
		
		// Return a reasonable maximum (don't let it get ridiculously large)
		return Math.min(maxFontSize, 32);
	});

	// Calculate actual font size to use (user preference limited by max safe size)
	const responsiveFontSize = $derived(() => {
		const maxSafe = maxSafeFontSize();
		const userPreferred = currentUserFontSize;
		
		// Use the smaller of user preference or max safe size, with 8px minimum
		return Math.max(Math.min(userPreferred, maxSafe), 8);
	});

	const contentStyle = $derived(
		`font-family: 'Courier New', monospace; font-size: ${responsiveFontSize()}px; line-height: 1.5;`
	);

	// Re-process content when it changes, dictionary loads, or font size changes
	$effect(() => {
		const actualFontSize = responsiveFontSize();
		
		if (browser && content && chordDictionaryLoaded) {
			const newHash = hashString(`${content}|${actualFontSize}|${containerWidth}`);
			if (newHash !== contentHash) {
				contentHash = newHash;
				processAndRenderContent();
			}
		} else if (!content) {
			processedContentHtml = '';
			contentHash = '';
		}
	});

	// Sync user font size with props changes
	$effect(() => {
		currentUserFontSize = fontSize;
	});

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

		await tick();

		// Add non-passive touchmove listener to allow preventDefault for pinch gestures
		if (container) {
			container.addEventListener('touchmove', handleGestureTouchMove, { passive: false });
		}

		// Set up ResizeObserver to track container width for responsive font sizing
		if (typeof ResizeObserver !== 'undefined' && container) {
			containerWidth = container.clientWidth;
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.target === container) {
						containerWidth = entry.contentRect.width;
					}
				}
			});
			resizeObserver.observe(container);
		}

		await loadChordDictionary();
		chordDictionaryLoaded = true; // Triggers reactive processing
	});

	onDestroy(() => {
		document.removeEventListener('click', handleDocumentClick);
		if (container) {
			container.removeEventListener('touchmove', handleGestureTouchMove);
		}
		if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
		resizeObserver?.disconnect();
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

	// Pinch gesture handlers for font size control
	function getPinchDistance(touches: TouchList): number {
		const touch1 = touches[0];
		const touch2 = touches[1];
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function handleGestureTouchStart(event: TouchEvent) {
		if (event.touches.length === 2) {
			// Two-finger pinch gesture
			event.preventDefault(); // Prevent default zoom
			isPinching = true;
			initialPinchDistance = getPinchDistance(event.touches);
			initialFontSize = currentUserFontSize;
		} else if (event.touches.length === 1) {
			// Single touch - handle chord interactions
			handleInteractionStart(event);
		}
	}

	function handleGestureTouchMove(event: TouchEvent) {
		if (!isPinching || event.touches.length !== 2) return;
		
		event.preventDefault(); // Prevent scrolling/zooming
		
		const currentDistance = getPinchDistance(event.touches);
		const distanceChange = currentDistance - initialPinchDistance;
		
		// Calculate font size change (1px change per 20px of pinch distance change)
		const fontSizeChange = distanceChange / 20;
		const newFontSize = initialFontSize + fontSizeChange;
		const maxSafe = maxSafeFontSize();
		
		// Constrain to safe bounds (8px minimum, maxSafe maximum)
		const constrainedSize = Math.max(8, Math.min(newFontSize, maxSafe));
		
		if (constrainedSize !== currentUserFontSize) {
			currentUserFontSize = constrainedSize;
		}
	}

	function handleGestureTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) {
			isPinching = false;
			initialPinchDistance = 0;
		}
	}

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

		// Global keyboard shortcuts
		if (event.key === 't' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			onopenTuner?.();
			return;
		}

		if (!target.classList.contains('chord')) return;

		// Trigger click (modal) on Enter or Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault(); // Prevent space from scrolling page
			// Create a synthetic mouse event for keyboard activation
			const syntheticEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			Object.defineProperty(syntheticEvent, 'target', {
				value: event.target,
				enumerable: true
			});
			handleChordClick(syntheticEvent);
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
		<TabContentRenderer content={processedContentHtml} style={contentStyle} />

		<ChordTooltip
			bind:this={tooltipComponent}
			visible={tooltipVisible}
			chord={tooltipChord}
			x={tooltipX}
			y={tooltipY}
			placement={tooltipPlacement}
			{isMobile}
			onmouseenter={handleTooltipMouseEnter}
			onmouseleave={handleTooltipMouseLeave}
		/>
	{:else}
		<!-- Show plain content while dictionary loads -->
		<TabContentRenderer {content} style={contentStyle} />
	{/if}
</div>

<ChordModal visible={modalVisible} chord={modalChord} onclose={handleModalClose} />

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
