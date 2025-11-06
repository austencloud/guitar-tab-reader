/**
 * Disambiguation data structure
 * Used when AI needs clarification on user's intent
 */
export interface DisambiguationData {
	query: string;
	reason: string;
	suggestions: string[];
	possibleArtist?: string;
	possibleSong?: string;
	searchResults?: any[];
}

