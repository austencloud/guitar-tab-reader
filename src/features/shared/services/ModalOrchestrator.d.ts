import type { UIState } from '../state/ui.svelte';
import type { LayoutState } from '../state/layout.svelte';
/**
 * Modal orchestration service
 * Coordinates all modal and bottom sheet interactions
 *
 * Extracted from +layout.svelte to centralize modal management logic
 */
export declare class ModalOrchestrator {
    private uiState;
    private layoutState;
    constructor(uiState: UIState, layoutState: LayoutState);
    openSettings(): void;
    closeSettings(): void;
    toggleSettings(): void;
    openTuner(): void;
    closeTuner(): void;
    toggleTuner(): void;
    openAddTab(): void;
    closeAddTab(): void;
    openURLImport(): void;
    openPasteImport(): void;
    closeImportModal(): void;
    closeWebImport(): void;
    openSessions(): void;
    closeSessions(): void;
    closeAllModals(): void;
    hasAnyModalOpen(): boolean;
    get settingsOpen(): boolean;
    get tunerOpen(): boolean;
    get addTabOpen(): boolean;
    get importModalOpen(): boolean;
    get webImportOpen(): boolean;
    get sessionSheetOpen(): boolean;
}
