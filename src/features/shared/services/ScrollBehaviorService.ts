import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import type { LayoutState } from '../state/layout.svelte';

/**
 * Scroll behavior service
 * Handles scroll-based header visibility logic
 * 
 * Extracted from +layout.svelte to separate concerns
 */
@injectable()
export class ScrollBehaviorService {
	private readonly scrollThreshold = 50; // Minimum scroll distance to trigger hide/show
	private readonly minScrollForHide = 100; // Minimum scroll position before hiding

	constructor(
		@inject(TYPES.LayoutState) private layoutState: LayoutState
	) {}

	/**
	 * Handle window scroll event
	 * Determines whether to show or hide the header based on scroll direction
	 */
	handleWindowScroll(currentScrollY: number): void {
		const lastScrollY = this.layoutState.lastScrollY;
		const scrollDelta = currentScrollY - lastScrollY;

		// Only trigger if scrolled past threshold
		if (Math.abs(scrollDelta) < this.scrollThreshold) return;

		if (scrollDelta > 0 && currentScrollY > this.minScrollForHide) {
			// Scrolling down & past initial position - hide header
			this.layoutState.hideHeader();
		} else if (scrollDelta < 0) {
			// Scrolling up - show header
			this.layoutState.showHeader();
		}

		this.layoutState.updateScrollPosition(currentScrollY);
	}

	/**
	 * Handle scroll from a container element (for pages with internal scroll)
	 * Used by child routes that have their own scroll containers
	 */
	handleContainerScroll(scrollTop: number, lastScroll: number): void {
		const scrollDelta = scrollTop - lastScroll;

		// Only trigger if scrolled past threshold
		if (Math.abs(scrollDelta) < this.scrollThreshold) return;

		if (scrollDelta > 0 && scrollTop > this.minScrollForHide) {
			// Scrolling down - hide header
			this.layoutState.hideHeader();
		} else if (scrollDelta < 0) {
			// Scrolling up - show header
			this.layoutState.showHeader();
		}
	}

	/**
	 * Create a scroll listener that can be attached to window
	 */
	createWindowScrollListener(): () => void {
		const handler = () => {
			this.handleWindowScroll(window.scrollY);
		};

		window.addEventListener('scroll', handler, { passive: true });

		// Return cleanup function
		return () => {
			window.removeEventListener('scroll', handler);
		};
	}

	/**
	 * Force show header (useful for navigation events)
	 */
	forceShowHeader(): void {
		this.layoutState.showHeader();
	}

	/**
	 * Force hide header (useful for fullscreen modes)
	 */
	forceHideHeader(): void {
		this.layoutState.hideHeader();
	}
}

