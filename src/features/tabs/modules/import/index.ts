/**
 * Import module barrel export
 * Provides clean access to import functionality
 */

// Export domain types
export type * from './domain/types';

// Export service contracts
export type * from './services/contracts';

// Export service implementations
export * from './services/implementations';

// Export state
export { createImportState } from './state/import-state.svelte';
export type { ImportState } from './state/import-state.svelte';

// Export main component
export { default as WebImportModal } from './components/WebImportModal.svelte';

// Export view components (if needed elsewhere)
export { default as ImportMenuView } from './components/views/ImportMenuView.svelte';
export { default as ImportUrlView } from './components/views/ImportUrlView.svelte';
export { default as ImportSmartView } from './components/views/ImportSmartView.svelte';
export { default as ImportPasteView } from './components/views/ImportPasteView.svelte';
export { default as ImportDisambiguationView } from './components/views/ImportDisambiguationView.svelte';
export { default as ImportBulkResultsView } from './components/views/ImportBulkResultsView.svelte';
export { default as ImportPreviewView } from './components/views/ImportPreviewView.svelte';

