import { injectable } from 'inversify';

/**
 * Layout state management using Svelte 5 runes
 * Manages layout-specific UI state including modals, sheets, and header visibility
 * 
 * This service extracts state management from +layout.svelte to follow
 * proper separation of concerns.
 */
@injectable()
export class LayoutState {
	// Modal states
	isAddTabPanelOpen = $state(false);
	isImportModalOpen = $state(false);
	isWebImportOpen = $state(false);
	isSessionSheetOpen = $state(false);

	// Header visibility state
	isHeaderVisible = $state(true);
	lastScrollY = $state(0);

	// Derived state
	hasActiveSheet = $derived(() => 
		this.isAddTabPanelOpen || 
		this.isSessionSheetOpen
	);

	hasActiveImportModal = $derived(() => 
		this.isImportModalOpen || 
		this.isWebImportOpen
	);

	// Add Tab Panel actions
	openAddTabPanel() {
		this.isAddTabPanelOpen = true;
	}

	closeAddTabPanel() {
		this.isAddTabPanelOpen = false;
	}

	// Import Modal actions
	openImportModal() {
		this.isAddTabPanelOpen = false;
		this.isImportModalOpen = true;
	}

	closeImportModal() {
		this.isImportModalOpen = false;
	}

	// Web Import Modal actions
	openWebImport() {
		this.isAddTabPanelOpen = false;
		this.isWebImportOpen = true;
	}

	closeWebImport() {
		this.isWebImportOpen = false;
	}

	// Session Sheet actions
	openSessionSheet() {
		this.isSessionSheetOpen = true;
	}

	closeSessionSheet() {
		this.isSessionSheetOpen = false;
	}

	// Header visibility actions
	showHeader() {
		this.isHeaderVisible = true;
	}

	hideHeader() {
		this.isHeaderVisible = false;
	}

	updateScrollPosition(scrollY: number) {
		this.lastScrollY = scrollY;
	}

	// Close all modals and sheets
	closeAll() {
		this.isAddTabPanelOpen = false;
		this.isImportModalOpen = false;
		this.isWebImportOpen = false;
		this.isSessionSheetOpen = false;
	}
}

