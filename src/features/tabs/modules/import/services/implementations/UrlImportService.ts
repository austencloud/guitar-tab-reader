import { injectable } from 'inversify';
import type { IUrlImportService } from '../contracts/IUrlImportService';

/**
 * URL import service implementation
 * Handles fetching tabs from Ultimate Guitar URLs
 */
@injectable()
export class UrlImportService implements IUrlImportService {
	async fetchFromUrl(url: string): Promise<{
		success: boolean;
		title?: string;
		artist?: string;
		content?: string;
		error?: string;
	}> {
		if (!url.trim()) {
			return {
				success: false,
				error: 'URL is required'
			};
		}

		try {
			const response = await fetch('/api/parse-ug-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() })
			});

			const data = await response.json();

			if (data.success) {
				return {
					success: true,
					title: data.title || 'Imported Tab',
					artist: data.artist || '',
					content: data.content || ''
				};
			} else {
				return {
					success: false,
					error: data.error || 'Failed to fetch tab'
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

