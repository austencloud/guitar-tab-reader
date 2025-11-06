import type { IAmbiguityHandler } from '../contracts/IAmbiguityHandler';
import type { Intent, DisambiguationResponse } from '../types';

/**
 * Handles ambiguous queries and creates disambiguation responses
 */
export class AmbiguityHandler implements IAmbiguityHandler {
	createDisambiguationResponse(query: string, intent: Intent): DisambiguationResponse {
		return {
			success: true,
			type: 'ambiguous',
			query: query,
			ambiguityReason: intent.ambiguityReason,
			suggestions: intent.suggestions || [],
			possibleArtist: intent.artist,
			possibleSong: intent.song,
			_meta: intent._meta
		};
	}
}

