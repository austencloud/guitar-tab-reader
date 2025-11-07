import type { LayoutState } from '../state/layout.svelte';
/**
 * Scroll behavior service
 * Handles scroll-based header visibility logic
 *
 * Extracted from +layout.svelte to separate concerns
 */
export declare class ScrollBehaviorService {
    private layoutState;
    private readonly scrollThreshold;
    private readonly minScrollForHide;
    constructor(layoutState: LayoutState);
    /**
     * Handle window scroll event
     * Determines whether to show or hide the header based on scroll direction
     */
    handleWindowScroll(currentScrollY: number): void;
    /**
     * Handle scroll from a container element (for pages with internal scroll)
     * Used by child routes that have their own scroll containers
     */
    handleContainerScroll(scrollTop: number, lastScroll: number): void;
    /**
     * Create a scroll listener that can be attached to window
     */
    createWindowScrollListener(): () => void;
    /**
     * Force show header (useful for navigation events)
     */
    forceShowHeader(): void;
    /**
     * Force hide header (useful for fullscreen modes)
     */
    forceHideHeader(): void;
}
