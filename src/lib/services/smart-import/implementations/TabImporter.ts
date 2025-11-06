import type { ITabImporter } from '../contracts/ITabImporter';
import type { IUltimateGuitarClient } from '../contracts/IUltimateGuitarClient';
import type { Intent, TabImportResult, ProgressCallback } from '../types';
import { getRecommendedTab } from '$lib/utils/tabVersions';

/**
 * Orchestrates tab import workflows based on intent
 */
export class TabImporter implements ITabImporter {
	constructor(private ugClient: IUltimateGuitarClient) {}

	async executeImport(intent: Intent, onProgress?: ProgressCallback): Promise<TabImportResult> {
		if (intent.type === 'ARTIST_BULK_IMPORT') {
			return this.importArtistBulk(intent, onProgress);
		} else if (intent.type === 'SINGLE_TAB_IMPORT') {
			return this.importSingleTab(intent, onProgress);
		}

		return {
			success: false,
			error: 'Unknown intent type'
		};
	}

	private async importArtistBulk(
		intent: Intent,
		onProgress?: ProgressCallback
	): Promise<TabImportResult> {
		console.log(`📦 Executing bulk artist import for: ${intent.artist}`);
		onProgress?.('Fetching artist tabs', `Searching for all tabs by ${intent.artist}...`);

		const data = await this.ugClient.scrapeArtistTabs(intent.artist!);

		if (data.success) {
			onProgress?.('Artist tabs found', `Found ${data.count} tabs for ${intent.artist}`);
			return {
				success: true,
				type: 'artist_bulk',
				artist: intent.artist,
				tabs: data.tabs,
				count: data.count,
				message: `Found ${data.count} tabs for ${intent.artist}`,
				_meta: intent._meta
			};
		} else {
			return {
				success: false,
				error: data.error || `Could not find tabs for ${intent.artist}`
			};
		}
	}

	private async importSingleTab(
		intent: Intent,
		onProgress?: ProgressCallback
	): Promise<TabImportResult> {
		// If URL provided, use it directly
		if (intent.url) {
			return this.importFromUrl(intent, onProgress);
		}

		// Search for the specific song
		return this.importFromSearch(intent, onProgress);
	}

	private async importFromUrl(
		intent: Intent,
		onProgress?: ProgressCallback
	): Promise<TabImportResult> {
		console.log(`🔗 Importing single tab from URL: ${intent.url}`);
		onProgress?.('Fetching tab from URL', `Loading tab content from ${intent.url}...`);

		const data = await this.ugClient.parseUrl(intent.url!);

		if (data.success) {
			onProgress?.('Tab loaded', `Successfully imported "${data.title}" by ${data.artist}`);
			return {
				success: true,
				type: 'single_tab',
				tab: {
					title: data.title,
					artist: data.artist,
					content: data.content,
					url: intent.url!
				},
				message: `Imported "${data.title}" by ${data.artist}`,
				_meta: intent._meta
			};
		} else {
			return {
				success: false,
				error: data.error
			};
		}
	}

	private async importFromSearch(
		intent: Intent,
		onProgress?: ProgressCallback
	): Promise<TabImportResult> {
		console.log(`🔍 Searching for: ${intent.song} by ${intent.artist || 'unknown'}`);
		onProgress?.(
			'Searching for tab',
			`Looking for "${intent.song}"${intent.artist ? ` by ${intent.artist}` : ''}...`
		);

		const titleData = await this.ugClient.searchSong(intent.song!, intent.artist);

		if (titleData.success && titleData.tabs.length > 0) {
			// Get the recommended version based on rating and votes
			const matchingTab = getRecommendedTab(titleData.tabs);
			console.log(
				`✅ Found recommended tab: ${matchingTab.title} (${titleData.tabs.length} total versions)`,
				matchingTab.rating ? `[Rating: ${matchingTab.rating}/5, Votes: ${matchingTab.votes}]` : ''
			);
			onProgress?.(
				'Tab found',
				`Found ${titleData.tabs.length} version${titleData.tabs.length > 1 ? 's' : ''}, selecting best match...`
			);

			// Now fetch the actual content
			onProgress?.('Loading tab content', 'Fetching the full tab...');
			const tabData = await this.ugClient.parseUrl(matchingTab.url);

			if (tabData.success) {
				onProgress?.('Tab loaded', `Successfully imported "${tabData.title}"`);
				return {
					success: true,
					type: 'single_tab',
					tab: {
						title: tabData.title,
						artist: tabData.artist,
						content: tabData.content,
						url: matchingTab.url
					},
					alternateVersions: titleData.tabs.slice(1, 6), // Include up to 5 alternate versions
					message: `Imported "${tabData.title}" by ${tabData.artist}${titleData.tabs.length > 1 ? ` (${titleData.tabs.length - 1} other versions available)` : ''}`,
					_meta: intent._meta
				};
			}
		}

		// Fallback: If we have an artist, try bulk import instead
		if (intent.artist) {
			return this.fallbackToArtistBulk(intent, onProgress);
		}

		// Final fallback: Could not find tabs at all
		console.log(`❌ Could not find tabs for "${intent.song}" by ${intent.artist || 'unknown'}`);
		return {
			success: false,
			error: `Could not find tabs for "${intent.song}"${intent.artist ? ` by ${intent.artist}` : ''}. Try searching for just the artist name or check your spelling.`,
			suggestions: intent.artist
				? [`All tabs by ${intent.artist}`, 'Try a different song']
				: ['Check spelling', 'Try including artist name'],
			_meta: intent._meta
		};
	}

	private async fallbackToArtistBulk(
		intent: Intent,
		onProgress?: ProgressCallback
	): Promise<TabImportResult> {
		console.log(
			`⚠️ Song "${intent.song}" not found. Trying artist bulk import for: ${intent.artist}`
		);
		onProgress?.(
			'Song not found',
			`Couldn't find "${intent.song}", searching for all tabs by ${intent.artist}...`
		);

		const artistData = await this.ugClient.scrapeArtistTabs(intent.artist!);

		if (artistData.success && artistData.tabs.length > 0) {
			console.log(`✅ Fallback successful! Found ${artistData.tabs.length} tabs by ${intent.artist}`);
			onProgress?.('Artist tabs found', `Found ${artistData.tabs.length} tabs by ${intent.artist}`);
			return {
				success: true,
				type: 'artist_bulk',
				artist: intent.artist,
				tabs: artistData.tabs,
				count: artistData.count,
				message: `Couldn't find "${intent.song}", but here are all tabs by ${intent.artist}`,
				fallback: true,
				originalQuery: intent.song,
				_meta: intent._meta
			};
		}

		return {
			success: false,
			error: `Could not find "${intent.song}" or any tabs by ${intent.artist}`
		};
	}
}

