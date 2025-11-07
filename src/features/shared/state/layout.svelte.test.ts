import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutState } from './layout.svelte';

describe('LayoutState', () => {
	let layoutState: LayoutState;

	beforeEach(() => {
		layoutState = new LayoutState();
	});

	describe('Modal States', () => {
		it('should initialize with all modals closed', () => {
			expect(layoutState.isAddTabPanelOpen).toBe(false);
			expect(layoutState.isImportModalOpen).toBe(false);
			expect(layoutState.isWebImportOpen).toBe(false);
			expect(layoutState.isSessionSheetOpen).toBe(false);
		});

		it('should open add tab panel', () => {
			layoutState.openAddTabPanel();
			expect(layoutState.isAddTabPanelOpen).toBe(true);
		});

		it('should close add tab panel', () => {
			layoutState.openAddTabPanel();
			layoutState.closeAddTabPanel();
			expect(layoutState.isAddTabPanelOpen).toBe(false);
		});

		it('should open import modal', () => {
			layoutState.openImportModal();
			expect(layoutState.isImportModalOpen).toBe(true);
		});

		it('should close import modal', () => {
			layoutState.openImportModal();
			layoutState.closeImportModal();
			expect(layoutState.isImportModalOpen).toBe(false);
		});

		it('should open web import', () => {
			layoutState.openWebImport();
			expect(layoutState.isWebImportOpen).toBe(true);
		});

		it('should close web import', () => {
			layoutState.openWebImport();
			layoutState.closeWebImport();
			expect(layoutState.isWebImportOpen).toBe(false);
		});

		it('should open session sheet', () => {
			layoutState.openSessionSheet();
			expect(layoutState.isSessionSheetOpen).toBe(true);
		});

		it('should close session sheet', () => {
			layoutState.openSessionSheet();
			layoutState.closeSessionSheet();
			expect(layoutState.isSessionSheetOpen).toBe(false);
		});
	});

	describe('Header Visibility', () => {
		it('should initialize with header visible', () => {
			expect(layoutState.isHeaderVisible).toBe(true);
		});

		it('should hide header', () => {
			layoutState.hideHeader();
			expect(layoutState.isHeaderVisible).toBe(false);
		});

		it('should show header', () => {
			layoutState.hideHeader();
			layoutState.showHeader();
			expect(layoutState.isHeaderVisible).toBe(true);
		});

		it('should update scroll position', () => {
			layoutState.updateScrollPosition(150);
			expect(layoutState.lastScrollY).toBe(150);
		});
	});

	describe('Derived States', () => {
		it('should detect active sheet when add tab panel is open', () => {
			layoutState.openAddTabPanel();
			expect(layoutState.hasActiveSheet()).toBe(true);
		});

		it('should detect active sheet when session sheet is open', () => {
			layoutState.openSessionSheet();
			expect(layoutState.hasActiveSheet()).toBe(true);
		});

		it('should detect no active sheet when all sheets are closed', () => {
			expect(layoutState.hasActiveSheet()).toBe(false);
		});

		it('should detect active import modal when import modal is open', () => {
			layoutState.openImportModal();
			expect(layoutState.hasActiveImportModal()).toBe(true);
		});

		it('should detect active import modal when web import is open', () => {
			layoutState.openWebImport();
			expect(layoutState.hasActiveImportModal()).toBe(true);
		});

		it('should detect no active import modal when all import modals are closed', () => {
			expect(layoutState.hasActiveImportModal()).toBe(false);
		});
	});

	describe('Close All Modals', () => {
		it('should close all modals and sheets', () => {
			// Open everything
			layoutState.openAddTabPanel();
			layoutState.openImportModal();
			layoutState.openWebImport();
			layoutState.openSessionSheet();

			// Close all
			layoutState.closeAll();

			// Verify all closed
			expect(layoutState.isAddTabPanelOpen).toBe(false);
			expect(layoutState.isImportModalOpen).toBe(false);
			expect(layoutState.isWebImportOpen).toBe(false);
			expect(layoutState.isSessionSheetOpen).toBe(false);
		});
	});
});

