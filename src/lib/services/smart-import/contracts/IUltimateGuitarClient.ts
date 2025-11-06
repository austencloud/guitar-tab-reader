/**
 * Client for interacting with Ultimate Guitar scraping APIs
 */
export interface IUltimateGuitarClient {
	/**
	 * Scrape all tabs for an artist
	 * @param artistName The artist name
	 * @returns API response with tabs
	 */
	scrapeArtistTabs(artistName: string): Promise<any>;

	/**
	 * Search for a specific song
	 * @param song The song title
	 * @param artist Optional artist name
	 * @returns API response with matching tabs
	 */
	searchSong(song: string, artist?: string): Promise<any>;

	/**
	 * Parse a specific Ultimate Guitar URL
	 * @param url The Ultimate Guitar URL
	 * @returns API response with tab data
	 */
	parseUrl(url: string): Promise<any>;
}

