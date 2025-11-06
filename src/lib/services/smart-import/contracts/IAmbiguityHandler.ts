import type { Intent, DisambiguationResponse } from '../types';

/**
 * Service for handling ambiguous queries
 */
export interface IAmbiguityHandler {
	/**
	 * Create a disambiguation response for the UI
	 * @param query The original query
	 * @param intent The ambiguous intent
	 * @returns Disambiguation response
	 */
	createDisambiguationResponse(query: string, intent: Intent): DisambiguationResponse;
}

