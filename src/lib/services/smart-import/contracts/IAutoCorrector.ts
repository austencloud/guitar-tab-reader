import type { Intent, AutoCorrectionResult } from '../types';

/**
 * Service for auto-correcting typos in queries
 */
export interface IAutoCorrector {
	/**
	 * Check if an ambiguous intent should be auto-corrected
	 * @param intent The ambiguous intent
	 * @returns Auto-correction result
	 */
	shouldAutoCorrect(intent: Intent): AutoCorrectionResult;
}

