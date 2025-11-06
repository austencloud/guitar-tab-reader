/**
 * URL import service contract
 * Handles importing tabs from Ultimate Guitar URLs
 */
export interface IUrlImportService {
	/**
	 * Fetch tab content from a URL
	 * @param url - The Ultimate Guitar tab URL
	 * @returns Promise with tab data or error
	 */
	fetchFromUrl(url: string): Promise<{
		success: boolean;
		title?: string;
		artist?: string;
		content?: string;
		error?: string;
	}>;
}

