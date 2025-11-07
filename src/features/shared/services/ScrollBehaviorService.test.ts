import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScrollBehaviorService } from './ScrollBehaviorService';
import type { LayoutState } from '../state/layout.svelte';

// Mock LayoutState
class MockLayoutState implements Partial<LayoutState> {
	isHeaderVisible = true;
	lastScrollY = 0;

	hideHeader(): void {
		this.isHeaderVisible = false;
	}

	showHeader(): void {
		this.isHeaderVisible = true;
	}

	updateScrollPosition(y: number): void {
		this.lastScrollY = y;
	}
}

describe('ScrollBehaviorService', () => {
	let scrollBehavior: ScrollBehaviorService;
	let mockLayoutState: MockLayoutState;

	beforeEach(() => {
		mockLayoutState = new MockLayoutState();
		scrollBehavior = new ScrollBehaviorService(mockLayoutState as LayoutState);
	});

	describe('handleWindowScroll', () => {
		it('should not hide header when scroll delta is below threshold', () => {
			mockLayoutState.lastScrollY = 100;
			scrollBehavior.handleWindowScroll(120); // Delta = 20, below threshold of 50
			expect(mockLayoutState.isHeaderVisible).toBe(true);
		});

		it('should hide header when scrolling down past threshold and minimum', () => {
			mockLayoutState.lastScrollY = 100;
			scrollBehavior.handleWindowScroll(200); // Delta = 100, above threshold and minimum
			expect(mockLayoutState.isHeaderVisible).toBe(false);
			expect(mockLayoutState.lastScrollY).toBe(200);
		});

		it('should not hide header when scrolling down but below minimum scroll position', () => {
			mockLayoutState.lastScrollY = 0;
			scrollBehavior.handleWindowScroll(80); // Delta = 80, but below minScrollForHide of 100
			expect(mockLayoutState.isHeaderVisible).toBe(true);
		});

		it('should show header when scrolling up past threshold', () => {
			mockLayoutState.lastScrollY = 200;
			mockLayoutState.isHeaderVisible = false;
			scrollBehavior.handleWindowScroll(100); // Delta = -100, above threshold
			expect(mockLayoutState.isHeaderVisible).toBe(true);
			expect(mockLayoutState.lastScrollY).toBe(100);
		});

		it('should hide header when scroll delta is exactly at threshold', () => {
			mockLayoutState.lastScrollY = 100;
			scrollBehavior.handleWindowScroll(150); // Delta = 50, exactly at threshold
			// Should trigger because Math.abs(scrollDelta) < threshold is false (50 is not < 50)
			expect(mockLayoutState.isHeaderVisible).toBe(false);
		});
	});

	describe('handleContainerScroll', () => {
		it('should hide header when scrolling down in container past threshold', () => {
			const lastScroll = 100;
			const currentScroll = 200; // Delta = 100
			scrollBehavior.handleContainerScroll(currentScroll, lastScroll);
			expect(mockLayoutState.isHeaderVisible).toBe(false);
		});

		it('should show header when scrolling up in container past threshold', () => {
			mockLayoutState.isHeaderVisible = false;
			const lastScroll = 200;
			const currentScroll = 100; // Delta = -100
			scrollBehavior.handleContainerScroll(currentScroll, lastScroll);
			expect(mockLayoutState.isHeaderVisible).toBe(true);
		});

		it('should not change visibility when scroll delta is below threshold', () => {
			const lastScroll = 100;
			const currentScroll = 120; // Delta = 20
			scrollBehavior.handleContainerScroll(currentScroll, lastScroll);
			expect(mockLayoutState.isHeaderVisible).toBe(true);
		});
	});

	describe('Force Hide/Show', () => {
		it('should force hide header', () => {
			scrollBehavior.forceHideHeader();
			expect(mockLayoutState.isHeaderVisible).toBe(false);
		});

		it('should force show header', () => {
			mockLayoutState.isHeaderVisible = false;
			scrollBehavior.forceShowHeader();
			expect(mockLayoutState.isHeaderVisible).toBe(true);
		});
	});

	// Note: createWindowScrollListener tests are skipped because they require browser environment
	// These should be tested with Playwright e2e tests instead
});

