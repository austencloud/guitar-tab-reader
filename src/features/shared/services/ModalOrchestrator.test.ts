import { describe, it, expect, beforeEach } from 'vitest';
import { ModalOrchestrator } from './ModalOrchestrator';
import type { UIState } from '../state/ui.svelte';
import type { LayoutState } from '../state/layout.svelte';

// Mock UIState
class MockUIState implements Partial<UIState> {
settingsModalOpen = false;
tunerModalOpen = false;

openModal(modalType: 'settings' | 'chordEditor' | 'import' | 'tuner'): void {
this.closeAllModals();
if (modalType === 'settings') {
this.settingsModalOpen = true;
} else if (modalType === 'tuner') {
this.tunerModalOpen = true;
}
}

closeModal(modalType: 'settings' | 'chordEditor' | 'import' | 'tuner'): void {
if (modalType === 'settings') {
this.settingsModalOpen = false;
} else if (modalType === 'tuner') {
this.tunerModalOpen = false;
}
}

closeAllModals(): void {
this.settingsModalOpen = false;
this.tunerModalOpen = false;
}

hasActiveModal(): boolean {
return this.settingsModalOpen || this.tunerModalOpen;
}
}

// Mock LayoutState
class MockLayoutState implements Partial<LayoutState> {
isAddTabPanelOpen = false;
isImportModalOpen = false;
isWebImportOpen = false;
isSessionSheetOpen = false;

openAddTabPanel(): void {
this.isAddTabPanelOpen = true;
}

closeAddTabPanel(): void {
this.isAddTabPanelOpen = false;
}

openWebImport(): void {
this.isAddTabPanelOpen = false;
this.isWebImportOpen = true;
}

closeWebImport(): void {
this.isWebImportOpen = false;
}

openImportModal(): void {
this.isAddTabPanelOpen = false;
this.isImportModalOpen = true;
}

closeImportModal(): void {
this.isImportModalOpen = false;
}

openSessionSheet(): void {
this.isSessionSheetOpen = true;
}

closeSessionSheet(): void {
this.isSessionSheetOpen = false;
}

closeAll(): void {
this.isAddTabPanelOpen = false;
this.isImportModalOpen = false;
this.isWebImportOpen = false;
this.isSessionSheetOpen = false;
}

hasActiveSheet(): boolean {
return this.isAddTabPanelOpen || this.isSessionSheetOpen;
}
}

describe('ModalOrchestrator', () => {
let modalOrchestrator: ModalOrchestrator;
let mockUIState: MockUIState;
let mockLayoutState: MockLayoutState;

beforeEach(() => {
mockUIState = new MockUIState();
mockLayoutState = new MockLayoutState();
modalOrchestrator = new ModalOrchestrator(
mockUIState as UIState,
mockLayoutState as LayoutState
);
});

describe('Settings Modal', () => {
it('should open settings modal', () => {
modalOrchestrator.openSettings();
expect(mockUIState.settingsModalOpen).toBe(true);
});

it('should close settings modal', () => {
mockUIState.settingsModalOpen = true;
modalOrchestrator.closeSettings();
expect(mockUIState.settingsModalOpen).toBe(false);
});

it('should toggle settings modal', () => {
modalOrchestrator.toggleSettings();
expect(mockUIState.settingsModalOpen).toBe(true);
modalOrchestrator.toggleSettings();
expect(mockUIState.settingsModalOpen).toBe(false);
});
});

describe('Tuner Modal', () => {
it('should open tuner modal', () => {
modalOrchestrator.openTuner();
expect(mockUIState.tunerModalOpen).toBe(true);
});

it('should close tuner modal', () => {
mockUIState.tunerModalOpen = true;
modalOrchestrator.closeTuner();
expect(mockUIState.tunerModalOpen).toBe(false);
});

it('should toggle tuner modal', () => {
modalOrchestrator.toggleTuner();
expect(mockUIState.tunerModalOpen).toBe(true);
modalOrchestrator.toggleTuner();
expect(mockUIState.tunerModalOpen).toBe(false);
});
});

describe('Add Tab Panel', () => {
it('should open add tab panel (opens web import)', () => {
modalOrchestrator.openAddTab();
expect(mockLayoutState.isWebImportOpen).toBe(true);
});

it('should close add tab panel (closes web import)', () => {
mockLayoutState.isWebImportOpen = true;
modalOrchestrator.closeAddTab();
expect(mockLayoutState.isWebImportOpen).toBe(false);
});
});

describe('Import Modals', () => {
it('should open URL import', () => {
modalOrchestrator.openURLImport();
expect(mockLayoutState.isWebImportOpen).toBe(true);
});

it('should open paste import', () => {
modalOrchestrator.openPasteImport();
expect(mockLayoutState.isImportModalOpen).toBe(true);
});

it('should close import modal', () => {
mockLayoutState.isImportModalOpen = true;
modalOrchestrator.closeImportModal();
expect(mockLayoutState.isImportModalOpen).toBe(false);
});

it('should close web import', () => {
mockLayoutState.isWebImportOpen = true;
modalOrchestrator.closeWebImport();
expect(mockLayoutState.isWebImportOpen).toBe(false);
});
});

describe('Session Sheet', () => {
it('should open session sheet', () => {
modalOrchestrator.openSessions();
expect(mockLayoutState.isSessionSheetOpen).toBe(true);
});

it('should close session sheet', () => {
mockLayoutState.isSessionSheetOpen = true;
modalOrchestrator.closeSessions();
expect(mockLayoutState.isSessionSheetOpen).toBe(false);
});
});

describe('Close All', () => {
it('should close all modals and sheets', () => {
// Open everything
mockUIState.settingsModalOpen = true;
mockUIState.tunerModalOpen = true;
mockLayoutState.isAddTabPanelOpen = true;
mockLayoutState.isImportModalOpen = true;
mockLayoutState.isWebImportOpen = true;
mockLayoutState.isSessionSheetOpen = true;

// Close all
modalOrchestrator.closeAllModals();

// Verify all closed
expect(mockUIState.settingsModalOpen).toBe(false);
expect(mockUIState.tunerModalOpen).toBe(false);
expect(mockLayoutState.isAddTabPanelOpen).toBe(false);
expect(mockLayoutState.isImportModalOpen).toBe(false);
expect(mockLayoutState.isWebImportOpen).toBe(false);
expect(mockLayoutState.isSessionSheetOpen).toBe(false);
});
});
});
