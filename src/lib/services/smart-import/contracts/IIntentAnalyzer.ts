import type { Intent, ProgressCallback } from '../types';

/**
 * Service for analyzing user queries to determine intent
 */
export interface IIntentAnalyzer {
	/**
	 * Analyze a user query to determine their intent
	 * @param query The user's search query
	 * @param onProgress Optional callback for progress updates
	 * @returns The analyzed intent or null if unable to determine
	 */
	analyze(query: string, onProgress?: ProgressCallback): Promise<Intent | null>;
}

