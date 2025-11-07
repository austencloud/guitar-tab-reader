/**
 * Layout state management using Svelte 5 runes
 * Manages layout-specific UI state including modals, sheets, and header visibility
 *
 * This service extracts state management from +layout.svelte to follow
 * proper separation of concerns.
 */
export declare class LayoutState {
    isAddTabPanelOpen: boolean;
    isImportModalOpen: boolean;
    isWebImportOpen: boolean;
    isSessionSheetOpen: boolean;
    isHeaderVisible: boolean;
    lastScrollY: number;
    hasActiveSheet: () => boolean;
    hasActiveImportModal: () => boolean;
    openAddTabPanel(): void;
    closeAddTabPanel(): void;
    openImportModal(): void;
    closeImportModal(): void;
    openWebImport(): void;
    closeWebImport(): void;
    openSessionSheet(): void;
    closeSessionSheet(): void;
    showHeader(): void;
    hideHeader(): void;
    updateScrollPosition(scrollY: number): void;
    closeAll(): void;
}
