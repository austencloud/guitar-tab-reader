import type { Intent, TabImportResult, ProgressCallback } from '../types';

/**
 * Orchestrates tab import workflows
 */
export interface ITabImporter {
	/**
	 * Execute the import workflow based on intent
	 * @param intent The analyzed intent
	 * @param onProgress Optional callback for progress updates
	 * @returns Import result
	 */
	executeImport(intent: Intent, onProgress?: ProgressCallback): Promise<TabImportResult>;
}

