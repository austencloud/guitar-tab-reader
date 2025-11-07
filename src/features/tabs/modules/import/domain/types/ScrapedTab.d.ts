/**
 * Scraped tab information from Ultimate Guitar
 * Represents tab search results before they are imported
 */
export interface ScrapedTab {
    title: string;
    artist: string;
    url: string;
    type: string;
    rating?: number;
    votes?: number;
}
