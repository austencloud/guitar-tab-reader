import type { IAutoCorrector } from '../contracts/IAutoCorrector';
import type { Intent, AutoCorrectionResult } from '../types';

/**
 * Determines if typos should be auto-corrected
 */
export class AutoCorrector implements IAutoCorrector {
	shouldAutoCorrect(intent: Intent): AutoCorrectionResult {
		// Check if this is a simple typo with a clear correction
		const isTypo = intent.ambiguityReason?.toLowerCase().includes('typo');
		const hasSingleCorrection =
			intent.suggestions?.length === 1 && !intent.ambiguityReason?.includes('vague');

		if (isTypo && hasSingleCorrection) {
			return {
				shouldAutoCorrect: true,
				correctedQuery: intent.suggestions![0]
			};
		}

		return {
			shouldAutoCorrect: false
		};
	}
}

