import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationCoordinator } from './NavigationCoordinator';

// Mock SvelteKit's goto function
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock SvelteKit's page store
vi.mock('$app/state', () => ({
	page: {
		url: {
			pathname: '/'
		}
	}
}));

import { goto } from '$app/navigation';
import { page } from '$app/state';

describe('NavigationCoordinator', () => {
	let navigationCoordinator: NavigationCoordinator;

	beforeEach(() => {
		navigationCoordinator = new NavigationCoordinator();
		vi.clearAllMocks();
	});

	describe('goToLibrary', () => {
		it('should navigate to library (home page)', () => {
			navigationCoordinator.goToLibrary();
			expect(goto).toHaveBeenCalledWith('/');
		});
	});

	describe('goToTab', () => {
		it('should navigate to tab with given id', () => {
			const tabId = 'test-tab-123';
			navigationCoordinator.goToTab(tabId);
			expect(goto).toHaveBeenCalledWith(`/tab/${tabId}`);
		});

		it('should handle tab ids with special characters', () => {
			const tabId = 'tab-with-dashes-123';
			navigationCoordinator.goToTab(tabId);
			expect(goto).toHaveBeenCalledWith(`/tab/${tabId}`);
		});
	});

	describe('goToTabDelayed', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should navigate to tab after default delay', () => {
			const tabId = 'delayed-tab-123';
			navigationCoordinator.goToTabDelayed(tabId);

			expect(goto).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);

			expect(goto).toHaveBeenCalledWith(`/tab/${tabId}`);
		});

		it('should navigate to tab after custom delay', () => {
			const tabId = 'custom-delay-tab';
			const customDelay = 500;
			navigationCoordinator.goToTabDelayed(tabId, customDelay);

			expect(goto).not.toHaveBeenCalled();

			vi.advanceTimersByTime(499);
			expect(goto).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(goto).toHaveBeenCalledWith(`/tab/${tabId}`);
		});

		it('should handle multiple delayed navigations', () => {
			navigationCoordinator.goToTabDelayed('tab1', 100);
			navigationCoordinator.goToTabDelayed('tab2', 200);

			vi.advanceTimersByTime(100);
			expect(goto).toHaveBeenCalledWith('/tab/tab1');

			vi.advanceTimersByTime(100);
			expect(goto).toHaveBeenCalledWith('/tab/tab2');
		});
	});

	describe('isViewingTab', () => {
		it('should return true when on a tab page', () => {
			expect(navigationCoordinator.isViewingTab('/tab/some-tab-id')).toBe(true);
		});

		it('should return false when on library page', () => {
			expect(navigationCoordinator.isViewingTab('/')).toBe(false);
		});

		it('should return false when on other pages', () => {
			expect(navigationCoordinator.isViewingTab('/settings')).toBe(false);
		});

		it('should return false when on tab edit page', () => {
			expect(navigationCoordinator.isViewingTab('/tab/some-id/edit')).toBe(false);
		});
	});

	describe('extractTabId', () => {
		it('should extract tab id from tab page URL', () => {
			expect(navigationCoordinator.extractTabId('/tab/my-tab-123', { id: 'my-tab-123' })).toBe('my-tab-123');
		});

		it('should return null when not on tab page', () => {
			expect(navigationCoordinator.extractTabId('/', {})).toBeNull();
		});

		it('should return null when on tab edit page', () => {
			expect(navigationCoordinator.extractTabId('/tab/some-id/edit', { id: 'some-id' })).toBeNull();
		});

		it('should handle tab ids with special characters', () => {
			expect(navigationCoordinator.extractTabId('/tab/tab-with-dashes-and-numbers-123', { id: 'tab-with-dashes-and-numbers-123' })).toBe('tab-with-dashes-and-numbers-123');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty tab id gracefully', () => {
			navigationCoordinator.goToTab('');
			expect(goto).toHaveBeenCalledWith('/tab/');
		});

		it('should handle zero delay in goToTabDelayed', () => {
			vi.useFakeTimers();
			navigationCoordinator.goToTabDelayed('tab-id', 0);
			vi.advanceTimersByTime(0);
			expect(goto).toHaveBeenCalledWith('/tab/tab-id');
			vi.useRealTimers();
		});
	});
});

