/**
 * Shared types for Smart Import functionality
 */

/**
 * Callback function for progress updates during import
 */
export type ProgressCallback = (step: string, details?: string) => void;

export interface Intent {
	type: 'ARTIST_BULK_IMPORT' | 'SINGLE_TAB_IMPORT' | 'AMBIGUOUS';
	artist?: string;
	song?: string;
	url?: string;
	confidence?: 'high' | 'medium' | 'low';
	suggestions?: string[];
	ambiguityReason?: string;
	_meta?: IntentMetadata;
}

export interface IntentMetadata {
	model: string;
	inputTokens: number;
	outputTokens: number;
	rawResponse: string;
	cached?: boolean;
}

export interface AutoCorrectionResult {
	shouldAutoCorrect: boolean;
	correctedQuery?: string;
}

export interface DisambiguationResponse {
	success: true;
	type: 'ambiguous';
	query: string;
	ambiguityReason?: string;
	suggestions: string[];
	possibleArtist?: string;
	possibleSong?: string;
	_meta?: IntentMetadata;
}

export interface TabImportResult {
	success: boolean;
	type?: 'single_tab' | 'artist_bulk' | 'ambiguous';
	tab?: {
		title: string;
		artist: string;
		content: string;
		url: string;
	};
	tabs?: any[];
	artist?: string;
	count?: number;
	message?: string;
	error?: string;
	alternateVersions?: any[];
	fallback?: boolean;
	originalQuery?: string;
	autoCorrection?: {
		from: string;
		to: string;
	};
	suggestions?: string[];
	_meta?: IntentMetadata;
}

export interface MusicBrainzAnalysis {
	isAmbiguous: boolean;
	confidence: 'high' | 'medium' | 'low';
	artistMatches: number;
	songMatches: number;
	topArtists: string[];
	topSongs: Array<{ title: string; artist: string }>;
	reasoning: string;
}

