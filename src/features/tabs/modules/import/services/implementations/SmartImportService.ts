import { injectable } from 'inversify';
import type { ISmartImportService } from '../contracts/ISmartImportService';
import type { ImportResult } from '../../domain/types';

/**
 * Smart import service implementation
 * Handles AI-powered tab import with intent analysis
 */
@injectable()
export class SmartImportService implements ISmartImportService {
	async processQuery(query: string): Promise<ImportResult> {
		if (!query.trim()) {
			return {
				success: false,
				error: 'Query is required'
			};
		}

		try {
			const response = await fetch('/api/smart-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim() })
			});

			const data = await response.json();
			return data as ImportResult;
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please check your connection and try again.'
			};
		}
	}

	async fetchArtistTabs(artistName: string): Promise<{
		success: boolean;
		tabs?: any[];
		error?: string;
	}> {
		if (!artistName.trim()) {
			return {
				success: false,
				error: 'Artist name is required'
			};
		}

		try {
			const response = await fetch('/api/scrape-artist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artistName: artistName.trim() })
			});

			const data = await response.json();

			if (data.success) {
				return {
					success: true,
					tabs: data.tabs || []
				};
			} else {
				return {
					success: false,
					error: data.error || 'Could not find tabs for this artist'
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please check your connection and try again.'
			};
		}
	}

	async searchSong(
		songName: string,
		artistName?: string
	): Promise<{
		success: boolean;
		tab?: any;
		error?: string;
	}> {
		if (!songName.trim()) {
			return {
				success: false,
				error: 'Song name is required'
			};
		}

		try {
			// Search for the specific song by fetching artist tabs
			const response = await fetch('/api/scrape-artist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artistName: artistName || songName })
			});

			const data = await response.json();

			if (data.success && data.tabs.length > 0) {
				// Find the matching tab
				const songLower = songName.toLowerCase();
				const matchingTab = data.tabs.find((tab: any) =>
					tab.title.toLowerCase().includes(songLower)
				);

				if (matchingTab) {
					return {
						success: true,
						tab: matchingTab
					};
				} else {
					return {
						success: false,
						error: `Could not find "${songName}"`
					};
				}
			} else {
				return {
					success: false,
					error: 'Could not find this song'
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please check your connection and try again.'
			};
		}
	}
}

