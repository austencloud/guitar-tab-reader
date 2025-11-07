/**
 * Navigation coordination service
 * Handles all navigation logic and routing
 *
 * Extracted from +layout.svelte to separate navigation concerns
 */
export declare class NavigationCoordinator {
    /**
     * Navigate to the library (home page)
     */
    goToLibrary(): void;
    /**
     * Navigate to a specific tab
     */
    goToTab(tabId: string): void;
    /**
     * Navigate to tab with a delay (useful after imports)
     */
    goToTabDelayed(tabId: string, delayMs?: number): void;
    /**
     * Navigate to tab edit page
     */
    goToTabEdit(tabId: string): void;
    /**
     * Navigate to new tab creation
     */
    goToNewTab(): void;
    /**
     * Navigate to jam sessions hub
     */
    goToJamSessions(): void;
    /**
     * Navigate to tuner page
     */
    goToTuner(): void;
    /**
     * Check if currently viewing a tab
     */
    isViewingTab(pathname: string): boolean;
    /**
     * Extract tab ID from current path
     */
    extractTabId(pathname: string, params: Record<string, string>): string | null;
    /**
     * Navigate back (browser history)
     */
    goBack(): void;
    /**
     * Navigate forward (browser history)
     */
    goForward(): void;
    /**
     * Replace current history entry
     */
    replaceState(url: string): void;
}
