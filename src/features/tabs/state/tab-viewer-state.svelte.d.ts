import type { ProcessedChord } from '$lib/utils/chordDb';
/**
 * Tab viewer state factory function
 * Creates reactive state for the TabViewer component using Svelte 5 runes
 */
export declare function createTabViewerState(): {
    processedContentHtml: string;
    chordsMap: Map<string, ProcessedChord>;
    contentHash: string;
    containerWidth: number;
    currentUserFontSize: number;
    isMobile: boolean;
    isTouch: boolean;
    tooltipVisible: boolean;
    tooltipX: number;
    tooltipY: number;
    tooltipChord: ProcessedChord | null;
    tooltipPlacement: "above" | "below";
    modalVisible: boolean;
    modalChord: ProcessedChord | null;
    isPinching: boolean;
    initialPinchDistance: number;
    initialFontSize: number;
    clearTooltip(): void;
    showTooltip(chord: ProcessedChord, x: number, y: number, placement: "above" | "below"): void;
    clearModal(): void;
    showModal(chord: ProcessedChord): void;
    startPinch(distance: number, fontSize: number): void;
    endPinch(): void;
};
export type TabViewerState = ReturnType<typeof createTabViewerState>;
