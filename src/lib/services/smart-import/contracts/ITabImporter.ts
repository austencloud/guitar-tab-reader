import type { Intent, TabImportResult } from '../types';

/**
 * Orchestrates tab import workflows
 */
export interface ITabImporter {
	/**
	 * Execute the import workflow based on intent
	 * @param intent The analyzed intent
	 * @returns Import result
	 */
	executeImport(intent: Intent): Promise<TabImportResult>;
}

