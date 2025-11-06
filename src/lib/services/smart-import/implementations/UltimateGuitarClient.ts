import type { IUltimateGuitarClient } from '../contracts/IUltimateGuitarClient';

/**
 * Client for coordinating Ultimate Guitar scraping API calls
 */
export class UltimateGuitarClient implements IUltimateGuitarClient {
	constructor(private fetch: typeof global.fetch) {}

	async scrapeArtistTabs(artistName: string): Promise<any> {
		const response = await this.fetch('/api/scrape-artist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ artistName })
		});

		return response.json();
	}

	async searchSong(song: string, artist?: string): Promise<any> {
		const response = await this.fetch('/api/scrape-title', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ song, artist })
		});

		return response.json();
	}

	async parseUrl(url: string): Promise<any> {
		const response = await this.fetch('/api/parse-ug-url', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url })
		});

		return response.json();
	}
}

