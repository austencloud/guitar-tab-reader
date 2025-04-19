<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher, getContext } from 'svelte';
	import {
		loadChordDictionary,
		findChordsInText,
		generateChordsHtml,
		type ProcessedChord
	} from '../utils/chordUtils';
	import { startAutoScroll } from '../utils/autoScroll';
	import ChordDiagram from './ChordDiagram.svelte';
	import ScrollControls from './ScrollControls.svelte';
	import GuitarTuner from './GuitarTuner.svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	interface TunerContext {
		open: () => void;
		close: () => void;
		toggle: () => void;
	}

	export let content: string = '';
	export let tabContent: string = '';
	export let fontSize: number = 14;
	export let showChordDiagrams: boolean = true;
	export const currentPosition: number = 0;

	// Tooltip functionality variables
	let container: HTMLDivElement;
	let processedContent: string = '';
	let chords: ProcessedChord[] = [];
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipChord: ProcessedChord | null = null;
	let tooltipTimeout: number | null = null;
	let isMobile = false;
	let chordDictionaryLoaded = false;
	let tooltipElement: HTMLDivElement;
	let isTouch = false;
	let contentHash = '';

	// Tab viewer variables
	let tabContentEl: HTMLElement;
	let isAutoScrolling = false;
	let scrollSpeed = 0.5; // Default scroll speed
	let showChordDiagram = false;
	let selectedChord: ProcessedChord | null = null;
	let stopScrollFunction: (() => void) | null = null;
	let cancelScroll: (() => void) | null = null;

	const dispatch = createEventDispatcher<{
		openTuner: void;
	}>();

	const TOOLTIP_DELAY = 150;
	const TOOLTIP_HIDE_DELAY = 300;

	export { container };

	// Get the global tuner context if available
	const tunerContext = getContext<TunerContext>('tuner');

	$: contentStyle = `
		font-family: 'Courier New', monospace;
		font-size: ${fontSize}px;
		line-height: 1.5;
		white-space: pre-wrap;
	`;

	$: {
		// Create a hash of the content to detect changes
		const newHash = content ? hashString(content) : '';
		if (browser && content && chordDictionaryLoaded && newHash !== contentHash) {
			contentHash = newHash;
			processContent();
		}
	}

	function hashString(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString();
	}

	async function processContent() {
		if (!content) {
			processedContent = '';
			return;
		}

		// Find all chords in the content
		chords = findChordsInText(content);

		if (chords.length === 0) {
			processedContent = content;
			return;
		}

		// Sort chords by their position in the content
		chords.sort((a, b) => a.startIndex - b.startIndex);

		// Process text while replacing chord names with spans
		let result = '';
		let lastEnd = 0;

		for (const chord of chords) {
			// Add text between the last chord and this one
			result += content.substring(lastEnd, chord.startIndex);

			// Add the chord with a span
			result += `<span class="chord" data-chord="${chord.name}">${chord.name}</span>`;

			// Update last position
			lastEnd = chord.endIndex;
		}

		// Add any remaining text after the last chord
		result += content.substring(lastEnd);

		// Update processed content
		processedContent = result;

		// Wait for DOM update then attach handlers
		await tick();
		attachChordEventHandlers();
	}

	function attachChordEventHandlers() {
		if (!container) return;

		// Find all chord spans
		const chordSpans = container.querySelectorAll('.chord');
		console.log(`Attaching handlers to ${chordSpans.length} chords`);

		// Replace each span with a clone to remove existing handlers
		chordSpans.forEach((span) => {
			const clone = span.cloneNode(true);
			span.parentNode?.replaceChild(clone, span);
		});

		// Add handlers to newly created spans
		container.querySelectorAll('.chord').forEach((span) => {
			span.addEventListener('mouseenter', (e) => handleChordMouseEnter(e as MouseEvent));
			span.addEventListener('mouseleave', () => handleChordMouseLeave());
			span.addEventListener('click', (e) => handleChordClick(e as MouseEvent));
			span.addEventListener('touchstart', (e) => handleChordTouch(e as TouchEvent), {
				passive: false
			});
		});
	}

	function handleChordMouseEnter(event: MouseEvent) {
		if (isTouch || !showChordDiagrams) return;

		const target = event.target as HTMLElement;
		const chordName = target.dataset.chord;

		if (!chordName) return;

		const chord = chords.find((c) => c.name === chordName);
		if (!chord) return;

		if (tooltipTimeout !== null) {
			window.clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}

		tooltipTimeout = window.setTimeout(() => {
			tooltipChord = chord;

			const rect = target.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();

			tooltipX = rect.left + rect.width / 2 - containerRect.left;
			tooltipY = rect.top - containerRect.top;

			tooltipVisible = true;
			positionTooltip();
		}, TOOLTIP_DELAY);
	}

	function handleChordMouseLeave() {
		if (isTouch || !showChordDiagrams) return;

		if (tooltipTimeout !== null) {
			window.clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}

		tooltipTimeout = window.setTimeout(() => {
			tooltipVisible = false;
		}, TOOLTIP_HIDE_DELAY);
	}

	function handleChordTouch(event: TouchEvent) {
		if (!showChordDiagrams) return;

		const target = event.target as HTMLElement;
		const chordName = target.dataset.chord;

		if (!chordName) return;

		event.preventDefault();
		isTouch = true;

		if (tooltipVisible && tooltipChord?.name === chordName) {
			tooltipVisible = false;
			return;
		}

		const chord = chords.find((c) => c.name === chordName);
		if (!chord) return;

		tooltipChord = chord;

		const rect = target.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		tooltipX = rect.left + rect.width / 2 - containerRect.left;
		tooltipY = rect.top - containerRect.top;

		tooltipVisible = true;

		setTimeout(positionTooltip, 10);
	}

	function handleChordClick(event: MouseEvent) {
		if (!showChordDiagrams) return;

		const target = event.target as HTMLElement;
		const chordName = target.dataset.chord;
		console.log(`Chord clicked: ${chordName}`);

		if (!chordName) return;

		const chord = chords.find((c) => c.name === chordName);
		if (!chord) {
			console.warn(`Chord data not found for: ${chordName}`);
			return;
		}

		selectedChord = chord;
		showChordDiagram = true;
		event.stopPropagation();
	}

	function positionTooltip() {
		if (!tooltipElement || !container) return;

		const tooltipRect = tooltipElement.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		const minX = 10;
		const maxX = containerRect.width - tooltipRect.width - 10;
		const adjustedX = Math.max(minX, Math.min(maxX, tooltipX - tooltipRect.width / 2));

		const spaceAbove = tooltipY;
		const spaceBelow = containerRect.height - tooltipY;
		const tooltipHeight = tooltipRect.height;

		let yPos, placement;

		if (spaceBelow >= tooltipHeight + 10 || spaceBelow > spaceAbove) {
			yPos = tooltipY + 20;
			placement = 'below';
		} else {
			yPos = tooltipY - tooltipHeight - 10;
			placement = 'above';
		}

		tooltipElement.style.left = `${adjustedX}px`;
		tooltipElement.style.top = `${yPos}px`;
		tooltipElement.dataset.placement = placement;
	}

	function handleTooltipMouseEnter() {
		if (tooltipTimeout !== null) {
			window.clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
	}

	function handleTooltipMouseLeave() {
		tooltipTimeout = window.setTimeout(() => {
			tooltipVisible = false;
		}, TOOLTIP_HIDE_DELAY);
	}

	function handleDocumentClick(event: MouseEvent) {
		if (isTouch && tooltipVisible) {
			const target = event.target as Node;
			if (
				!tooltipElement.contains(target) &&
				!Array.from(container.querySelectorAll('.chord')).some((el) => el.contains(target))
			) {
				tooltipVisible = false;
			}
		}
	}

	// Tab functionality methods
	function processTabLine(line: string): string {
		const { html, chords: detectedChords } = generateChordsHtml(line);

		// Update our chords array with any newly detected chords
		chords = [
			...chords,
			...detectedChords.filter(
				(newChord: ProcessedChord) =>
					!chords.some(
						(existingChord) =>
							existingChord.name === newChord.name &&
							newChord.startIndex === existingChord.startIndex
					)
			)
		];

		return html;
	}

	function startTabAutoScroll() {
		if (!tabContentEl) return;

		cancelScroll = startAutoScroll(tabContentEl, scrollSpeed * 1000);
		isAutoScrolling = true;
	}

	function stopAutoScroll() {
		if (cancelScroll) {
			cancelScroll();
			cancelScroll = null;
		}
		isAutoScrolling = false;
	}

	function openTunerModal() {
		if (tunerContext) {
			tunerContext.open();
		} else {
			// Fall back to event dispatch if context not available
			dispatch('openTuner');
		}
	}

	onMount(() => {
		isMobile = window.matchMedia('(max-width: 768px)').matches;

		const loadChords = async () => {
			await loadChordDictionary();
			chordDictionaryLoaded = true;

			if (content) {
				processContent();
			}
		};

		loadChords();

		document.addEventListener('click', handleDocumentClick);

		// Setup tab content event delegation
		if (tabContentEl) {
			tabContentEl.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;

				if (target.classList.contains('chord')) {
					const chordName = target.getAttribute('data-chord');
					if (chordName) {
						selectedChord = chords.find((chord) => chord.name === chordName) || null;
						showChordDiagram = !!selectedChord;
						event.stopPropagation(); // Prevent triggering parent click handlers
					}
				}
			});
		}

		return () => {
			document.removeEventListener('click', handleDocumentClick);
			stopAutoScroll();
		};
	});

	onDestroy(() => {
		if (tooltipTimeout !== null) {
			window.clearTimeout(tooltipTimeout);
		}
	});
</script>

<div class="tab-viewer" bind:this={container}>
	{#if chordDictionaryLoaded}
		<div class="tab-content">
			{#if processedContent}
				<pre style={contentStyle}>
					<code>
						{@html processedContent}
					</code>
				</pre>
			{:else}
				<pre style={contentStyle}>
					<code>{content}</code>
				</pre>
			{/if}
		</div>

		{#if tooltipVisible && tooltipChord}
			<div
				class="chord-tooltip"
				class:visible={tooltipVisible}
				bind:this={tooltipElement}
				on:mouseenter={handleTooltipMouseEnter}
				on:mouseleave={handleTooltipMouseLeave}
				role="tooltip"
				aria-hidden={!tooltipVisible}
				style="--origin: {tooltipY > container?.clientHeight / 2 ? 'bottom' : 'top'} center"
			>
				<ChordDiagram
					name={tooltipChord.name}
					positions={tooltipChord.positions}
					barre={tooltipChord.barre}
					baseFret={tooltipChord.baseFret || 1}
					size={isMobile ? 'sm' : 'md'}
				/>
			</div>
		{/if}
	{:else}
		<div class="tab-content">
			<pre style={contentStyle}>
				<code>{content}</code>
			</pre>
		</div>
	{/if}
</div>

<!-- Use a button element to fix accessibility issues -->
{#if tabContent}
	<button
		class="tab-container"
		class:auto-scrolling={isAutoScrolling}
		style:--scroll-speed="{scrollSpeed}s"
		on:click={() => isAutoScrolling && stopAutoScroll()}
		aria-label="Tab container, click to stop scrolling when active"
		type="button"
	>
		<div class="tab-content" bind:this={tabContentEl}>
			{#each tabContent.split('\n') as line}
				<div class="tab-line">
					{@html processTabLine(line)}
				</div>
			{/each}
		</div>
	</button>
{/if}

<!-- Use a dialog-like div with proper role and keyboard access -->
{#if showChordDiagram && selectedChord}
	<div
		class="chord-modal"
		on:click|self={() => (showChordDiagram = false)}
		on:keydown={(e) => {
			if (e.key === 'Escape') showChordDiagram = false;
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="chord-name-title"
		tabindex="-1"
	>
		<div class="chord-modal-content">
			<h3 id="chord-name-title">{selectedChord.name}</h3>
			<ChordDiagram
				name={selectedChord.name}
				positions={selectedChord.positions}
				barre={selectedChord.barre}
				baseFret={selectedChord.baseFret}
			/>
			<button on:click={() => (showChordDiagram = false)}>Close</button>
		</div>
	</div>
{/if}

{#if tabContent}
	<ScrollControls
		container={tabContentEl}
		on:startScroll={() => startTabAutoScroll()}
		on:stopScroll={() => stopAutoScroll()}
	/>
{/if}

<style>
	.tab-viewer {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: auto;
		background-color: #f5f5f5;
		border-radius: 4px;
		padding: 1rem;
		position: relative;
		contain: layout;
	}

	.tab-content {
		position: relative;
	}

	pre {
		margin: 0;
		tab-size: 4;
	}

	:global(.chord) {
		position: relative;
		cursor: pointer;
		color: #1e88e5;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
		border-radius: 3px;
		padding: 0 2px;
	}

	:global(.chord:hover) {
		background-color: rgba(30, 136, 229, 0.1);
	}

	.chord-tooltip {
		position: absolute;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 10px;
		z-index: 100;
		opacity: 0;
		transform: scale(0.9);
		transform-origin: var(--origin, top center);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		pointer-events: none;
		touch-action: none;
	}

	.chord-tooltip.visible {
		opacity: 1;
		transform: scale(1);
		pointer-events: auto;
		touch-action: auto;
	}

	.tab-container {
		font-family: monospace;
		white-space: pre;
		overflow-x: auto;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #f9f9f9;
		position: relative;
		max-height: 70vh;
		overflow-y: auto;
		margin-top: 15px;
		width: 100%;
		text-align: left;
		cursor: pointer;
	}

	.tab-line {
		line-height: 1.5;
	}

	.tab-container.auto-scrolling .tab-content {
		animation: autoscroll var(--scroll-speed) linear;
		animation-play-state: running;
	}

	@keyframes autoscroll {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-100%);
		}
	}

	.chord-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.chord-modal-content {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		max-width: 90%;
		text-align: center;
	}

	.chord-modal-content button {
		margin-top: 15px;
		padding: 5px 15px;
		background-color: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.chord-modal-content button:hover {
		background-color: #0055aa;
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-viewer {
			padding: 0.5rem;
			touch-action: pan-y;
		}

		.chord-tooltip {
			padding: 6px;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.tab-viewer {
			background-color: #1e1e1e;
			color: #e0e0e0;
		}

		.chord-tooltip {
			background-color: #2d2d2d;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		}

		:global(.chord) {
			color: #64b5f6;
		}

		:global(.chord:hover) {
			background-color: rgba(100, 181, 246, 0.2);
		}

		.tab-container {
			background-color: #1e1e1e;
			border-color: #333;
			color: #e0e0e0;
		}

		.chord-modal-content {
			background-color: #2d2d2d;
			color: #e0e0e0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chord-tooltip {
			transition: none !important;
		}

		.tab-container.auto-scrolling .tab-content {
			animation: none !important;
		}
	}
</style>
