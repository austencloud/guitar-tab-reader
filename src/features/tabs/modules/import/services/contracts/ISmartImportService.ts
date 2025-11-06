import type { ImportResult } from '../../domain/types';

/**
 * Smart import service contract
 * Handles AI-powered tab import with intent analysis
 */
export interface ISmartImportService {
	/**
	 * Process a smart import query using AI with real-time progress updates
	 * @param query - User's natural language query
	 * @param onProgress - Optional callback for progress updates
	 * @returns Promise with import result
	 */
	processQuery(
		query: string,
		onProgress?: (step: string, details?: string) => void
	): Promise<ImportResult>;

	/**
	 * Fetch tabs for a specific artist
	 * @param artistName - Name of the artist
	 * @returns Promise with bulk tab results
	 */
	fetchArtistTabs(artistName: string): Promise<{
		success: boolean;
		tabs?: any[];
		error?: string;
	}>;

	/**
	 * Search for a specific song
	 * @param songName - Name of the song
	 * @param artistName - Optional artist name for better matching
	 * @returns Promise with tab data or error
	 */
	searchSong(
		songName: string,
		artistName?: string
	): Promise<{
		success: boolean;
		tab?: any;
		error?: string;
	}>;
}

