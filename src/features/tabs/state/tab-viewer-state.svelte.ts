import type { ProcessedChord } from '$lib/utils/chordDb';

/**
 * Tab viewer state factory function
 * Creates reactive state for the TabViewer component using Svelte 5 runes
 */
export function createTabViewerState() {
	// Content state
	let processedContentHtml = $state('');
	let chordsMap = $state(new Map<string, ProcessedChord>());
	let contentHash = $state('');

	// Container state
	let containerWidth = $state(0);

	// Font size state
	let currentUserFontSize = $state(14);

	// Device detection state
	let isMobile = $state(false);
	let isTouch = $state(false);

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipChord = $state<ProcessedChord | null>(null);
	let tooltipPlacement = $state<'above' | 'below'>('below');

	// Modal state
	let modalVisible = $state(false);
	let modalChord = $state<ProcessedChord | null>(null);

	// Pinch gesture state
	let isPinching = $state(false);
	let initialPinchDistance = $state(0);
	let initialFontSize = $state(16);

	return {
		// Content state
		get processedContentHtml() { return processedContentHtml; },
		set processedContentHtml(value: string) { processedContentHtml = value; },

		get chordsMap() { return chordsMap; },
		set chordsMap(value: Map<string, ProcessedChord>) { chordsMap = value; },

		get contentHash() { return contentHash; },
		set contentHash(value: string) { contentHash = value; },

		// Container state
		get containerWidth() { return containerWidth; },
		set containerWidth(value: number) { containerWidth = value; },

		// Font size state
		get currentUserFontSize() { return currentUserFontSize; },
		set currentUserFontSize(value: number) { currentUserFontSize = value; },

		// Device detection state
		get isMobile() { return isMobile; },
		set isMobile(value: boolean) { isMobile = value; },

		get isTouch() { return isTouch; },
		set isTouch(value: boolean) { isTouch = value; },

		// Tooltip state
		get tooltipVisible() { return tooltipVisible; },
		set tooltipVisible(value: boolean) { tooltipVisible = value; },

		get tooltipX() { return tooltipX; },
		set tooltipX(value: number) { tooltipX = value; },

		get tooltipY() { return tooltipY; },
		set tooltipY(value: number) { tooltipY = value; },

		get tooltipChord() { return tooltipChord; },
		set tooltipChord(value: ProcessedChord | null) { tooltipChord = value; },

		get tooltipPlacement() { return tooltipPlacement; },
		set tooltipPlacement(value: 'above' | 'below') { tooltipPlacement = value; },

		// Modal state
		get modalVisible() { return modalVisible; },
		set modalVisible(value: boolean) { modalVisible = value; },

		get modalChord() { return modalChord; },
		set modalChord(value: ProcessedChord | null) { modalChord = value; },

		// Pinch gesture state
		get isPinching() { return isPinching; },
		set isPinching(value: boolean) { isPinching = value; },

		get initialPinchDistance() { return initialPinchDistance; },
		set initialPinchDistance(value: number) { initialPinchDistance = value; },

		get initialFontSize() { return initialFontSize; },
		set initialFontSize(value: number) { initialFontSize = value; },

		// Helper methods
		clearTooltip() {
			tooltipVisible = false;
			tooltipChord = null;
		},

		showTooltip(chord: ProcessedChord, x: number, y: number, placement: 'above' | 'below') {
			tooltipChord = chord;
			tooltipX = x;
			tooltipY = y;
			tooltipPlacement = placement;
			tooltipVisible = true;
		},

		clearModal() {
			modalVisible = false;
			modalChord = null;
		},

		showModal(chord: ProcessedChord) {
			modalChord = chord;
			modalVisible = true;
		},

		startPinch(distance: number, fontSize: number) {
			isPinching = true;
			initialPinchDistance = distance;
			initialFontSize = fontSize;
		},

		endPinch() {
			isPinching = false;
			initialPinchDistance = 0;
		}
	};
}

export type TabViewerState = ReturnType<typeof createTabViewerState>;

