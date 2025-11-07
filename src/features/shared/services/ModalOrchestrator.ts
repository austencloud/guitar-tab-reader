import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import type { UIState } from '../state/ui.svelte';
import type { LayoutState } from '../state/layout.svelte';

/**
 * Modal orchestration service
 * Coordinates all modal and bottom sheet interactions
 * 
 * Extracted from +layout.svelte to centralize modal management logic
 */
@injectable()
export class ModalOrchestrator {
	constructor(
		@inject(TYPES.UIState) private uiState: UIState,
		@inject(TYPES.LayoutState) private layoutState: LayoutState
	) {}

	// Settings Modal
	openSettings(): void {
		this.uiState.openModal('settings');
	}

	closeSettings(): void {
		this.uiState.closeModal('settings');
	}

	toggleSettings(): void {
		if (this.uiState.settingsModalOpen) {
			this.closeSettings();
		} else {
			this.openSettings();
		}
	}

	// Tuner Modal
	openTuner(): void {
		this.uiState.openModal('tuner');
	}

	closeTuner(): void {
		this.uiState.closeModal('tuner');
	}

	toggleTuner(): void {
		if (this.uiState.tunerModalOpen) {
			this.closeTuner();
		} else {
			this.openTuner();
		}
	}

	// Add Tab Panel
	openAddTab(): void {
		this.layoutState.openWebImport();
	}

	closeAddTab(): void {
		this.layoutState.closeWebImport();
		this.layoutState.closeAddTabPanel();
	}

	// Import Modals
	openURLImport(): void {
		this.layoutState.openWebImport();
	}

	openPasteImport(): void {
		this.layoutState.openImportModal();
	}

	closeImportModal(): void {
		this.layoutState.closeImportModal();
	}

	closeWebImport(): void {
		this.layoutState.closeWebImport();
	}

	// Session Sheet
	openSessions(): void {
		this.layoutState.openSessionSheet();
	}

	closeSessions(): void {
		this.layoutState.closeSessionSheet();
	}

	// Utility methods
	closeAllModals(): void {
		this.uiState.closeAllModals();
		this.layoutState.closeAll();
	}

	hasAnyModalOpen(): boolean {
		return this.uiState.hasActiveModal() || this.layoutState.hasActiveSheet();
	}

	// Get current modal states (for reactive UI)
	get settingsOpen(): boolean {
		return this.uiState.settingsModalOpen;
	}

	get tunerOpen(): boolean {
		return this.uiState.tunerModalOpen;
	}

	get addTabOpen(): boolean {
		return this.layoutState.isWebImportOpen;
	}

	get importModalOpen(): boolean {
		return this.layoutState.isImportModalOpen;
	}

	get webImportOpen(): boolean {
		return this.layoutState.isWebImportOpen;
	}

	get sessionSheetOpen(): boolean {
		return this.layoutState.isSessionSheetOpen;
	}
}
