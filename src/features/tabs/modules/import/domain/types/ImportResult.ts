import type { ProgressLogEntry } from './ProgressLogEntry';

/**
 * Import result types
 * Represents the result of an import operation
 */

export interface ImportResult {
	success: boolean;
	type?: 'single_tab' | 'artist_bulk' | 'ambiguous' | 'ambiguous_with_results' | 'ai_generated';
	tab?: {
		title: string;
		artist: string;
		content: string;
		url?: string;
	};
	tabs?: any[];
	count?: number;
	error?: string;
	suggestions?: string[];
	query?: string;
	ambiguityReason?: string;
	possibleArtist?: string;
	possibleSong?: string;
	searchResults?: any[];
	fallback?: boolean;
	message?: string;
	_meta?: {
		model: string;
		inputTokens: number;
		outputTokens: number;
		rawResponse: string;
	};
	autoCorrection?: {
		from: string;
		to: string;
	};
	progressLog?: ProgressLogEntry[];
}
