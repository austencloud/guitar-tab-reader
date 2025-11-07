import { injectable } from 'inversify';
import { goto } from '$app/navigation';
import type { Tab } from '$lib/state/tabs.svelte';

/**
 * Navigation coordination service
 * Handles all navigation logic and routing
 * 
 * Extracted from +layout.svelte to separate navigation concerns
 */
@injectable()
export class NavigationCoordinator {
	/**
	 * Navigate to the library (home page)
	 */
	goToLibrary(): void {
		goto('/');
	}

	/**
	 * Navigate to a specific tab
	 */
	goToTab(tabId: string): void {
		goto(`/tab/${tabId}`);
	}

	/**
	 * Navigate to tab with a delay (useful after imports)
	 */
	goToTabDelayed(tabId: string, delayMs: number = 100): void {
		setTimeout(() => {
			this.goToTab(tabId);
		}, delayMs);
	}

	/**
	 * Navigate to tab edit page
	 */
	goToTabEdit(tabId: string): void {
		goto(`/tab/${tabId}/edit`);
	}

	/**
	 * Navigate to new tab creation
	 */
	goToNewTab(): void {
		goto('/new');
	}

	/**
	 * Navigate to jam sessions hub
	 */
	goToJamSessions(): void {
		goto('/jam');
	}

	/**
	 * Navigate to tuner page
	 */
	goToTuner(): void {
		goto('/tuner');
	}

	/**
	 * Check if currently viewing a tab
	 */
	isViewingTab(pathname: string): boolean {
		return pathname.startsWith('/tab/') && !pathname.includes('/edit');
	}

	/**
	 * Extract tab ID from current path
	 */
	extractTabId(pathname: string, params: Record<string, string>): string | null {
		if (this.isViewingTab(pathname)) {
			return params.id || null;
		}
		return null;
	}

	/**
	 * Navigate back (browser history)
	 */
	goBack(): void {
		window.history.back();
	}

	/**
	 * Navigate forward (browser history)
	 */
	goForward(): void {
		window.history.forward();
	}

	/**
	 * Replace current history entry
	 */
	replaceState(url: string): void {
		goto(url, { replaceState: true });
	}
}

