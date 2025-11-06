import { injectable } from 'inversify';
import type { ISmartImportService } from '../contracts/ISmartImportService';
import type { ImportResult } from '../../domain/types';

/**
 * Smart import service implementation
 * Handles AI-powered tab import with intent analysis
 */
@injectable()
export class SmartImportService implements ISmartImportService {
	async processQuery(
		query: string,
		onProgress?: (step: string, details?: string) => void
	): Promise<ImportResult> {
		if (!query.trim()) {
			return {
				success: false,
				error: 'Query is required'
			};
		}

		try {
			// Use streaming endpoint for real-time progress updates
			const response = await fetch('/api/smart-import-stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim() })
			});

			if (!response.ok || !response.body) {
				throw new Error('Failed to start streaming');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let finalResult: ImportResult | null = null;

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					// Process any remaining data in buffer before exiting
					if (buffer.trim()) {
						console.log('📦 Processing remaining buffer:', buffer);
						const lines = buffer.split('\n\n');
						for (const line of lines) {
							if (!line.trim() || !line.startsWith('data: ')) continue;

							const data = JSON.parse(line.substring(6));
							console.log('📦 Received SSE data (final):', data);

							if (data.error) {
								return {
									success: false,
									error: data.error,
									suggestions: data.suggestions
								};
							}

							if (data.needsDisambiguation) {
								finalResult = data.disambiguationData;
							}

							if (data.success && data.result) {
								console.log('✅ Import complete, result type:', data.result.type);
								console.log('✅ Result data:', data.result);
								finalResult = data.result;
							}
						}
					}
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				// Process complete messages (separated by \n\n)
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || ''; // Keep incomplete message in buffer

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;

					const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
					console.log('📦 Received SSE data:', data);

					// Handle progress updates
					if (data.step && onProgress) {
						onProgress(data.step, data.details);
					}

					// Handle errors
					if (data.error) {
						console.log('❌ Error received:', data.error);
						return {
							success: false,
							error: data.error,
							suggestions: data.suggestions
						};
					}

					// Handle disambiguation
					if (data.needsDisambiguation) {
						console.log('❓ Disambiguation needed:', data.disambiguationData);
						finalResult = data.disambiguationData;
					}

					// Handle completion
					if (data.success && data.result) {
						console.log('✅ Import complete, result type:', data.result.type);
						console.log('✅ Result data:', data.result);
						finalResult = data.result;
					}
				}
			}

			console.log('🏁 Stream ended, final result:', finalResult);

			return (
				finalResult || {
					success: false,
					error: 'No result received from server'
				}
			);
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

