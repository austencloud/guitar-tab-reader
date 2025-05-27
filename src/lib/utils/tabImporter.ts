import type { Tab } from '$lib/stores/tabs';
import { v4 as uuidv4 } from 'uuid';

interface ImportResult {
	success: boolean;
	tab?: Tab;
	error?: string;
}

export interface TabImportOptions {
	url?: string;
	rawContent?: string;
	title?: string;
	artist?: string;
	album?: string;
	useAI?: boolean;
	aiEndpoint?: string;
	aiModel?: string;
}

export async function importTab(options: TabImportOptions): Promise<ImportResult> {
	try {
		// If URL is provided, fetch content from it
		let content = options.rawContent || '';

		if (options.url) {
			content = await fetchTabContent(options.url);
		}

		// If there's no content at this point, return error
		if (!content) {
			return {
				success: false,
				error: 'No tab content available from provided sources'
			};
		}

		// Process content with AI if requested
		if (options.useAI) {
			content = await processWithAI(content, options);
		}

		// Extract title from content if not already provided
		let title = options.title;
		if (!title) {
			title = extractTitleFromContent(content) || 'Imported Tab';
		}

		// Create a new tab object
		const newTab: Tab = {
			id: uuidv4(),
			title,
			artist: options.artist || extractArtistFromContent(content) || '',
			album: options.album || '',
			content,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		};

		return {
			success: true,
			tab: newTab
		};
	} catch (error) {
		console.error('Error importing tab:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error during import'
		};
	}
}

async function fetchTabContent(url: string): Promise<string> {
	try {
		// Use fetch API with a CORS proxy if necessary
		// For local development, we may need a proxy to avoid CORS issues
		const isLocalhost =
			window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
		const fetchUrl = isLocalhost ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;

		const response = await fetch(fetchUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch tab: ${response.statusText}`);
		}

		const html = await response.text();

		// Extract tab content from HTML - this is a simple extraction strategy
		// and may need to be refined for specific websites
		return extractTabFromHtml(html, url);
	} catch (error) {
		console.error('Error fetching tab:', error);
		throw error;
	}
}

function extractTabFromHtml(html: string, url: string): string {
	// Simplified extraction based on common tab sites
	if (url.includes('ultimate-guitar.com')) {
		// Extract UG content from their specific JSON structure
		const match = html.match(/window\.UGAPP\.store\.page = (\{.*?\});/s);
		if (match && match[1]) {
			try {
				const data = JSON.parse(match[1]);
				return data.data?.tab_view?.wiki_tab?.content || data.data?.tab?.wiki_tab?.content || '';
			} catch {
				// Fallback to regular extraction if JSON parsing fails
			}
		}
	}

	// Generic approach for tab sites
	// Look for pre tags which often contain tab content
	const preTagMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
	if (preTagMatch && preTagMatch[1]) {
		return decodeHtmlEntities(preTagMatch[1].trim());
	}

	// Try div with class containing tab/chord/content
	const tabDivRegexes = [
		/<div[^>]*class="[^"]*\b(?:tab|chord|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*id="[^"]*\b(?:tab|chord|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
	];

	for (const regex of tabDivRegexes) {
		const match = html.match(regex);
		if (match && match[1]) {
			return decodeHtmlEntities(match[1].trim());
		}
	}

	// Remove script tags first
	const htmlWithoutScripts = html.replace(
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		''
	);

	// If nothing specific found, try to extract main content by removing HTML tags
	return decodeHtmlEntities(
		htmlWithoutScripts
			.replace(/<[^>]*>/g, '')
			// Replace multiple newlines with a single one
			.replace(/\n{3,}/g, '\n\n')
			.trim()
	);
}

function decodeHtmlEntities(html: string): string {
	const textarea = document.createElement('textarea');
	textarea.innerHTML = html;
	return textarea.value;
}

function extractTitleFromContent(content: string): string | null {
	// Look for common title patterns in tab content
	const titlePatterns = [
		/title:\s*(.+?)(?:\n|\r|$)/i,
		/song:\s*(.+?)(?:\n|\r|$)/i,
		/^(.+?)(?:\n|\r|$)/
	];

	for (const pattern of titlePatterns) {
		const match = content.match(pattern);
		if (match && match[1]) {
			return match[1].trim();
		}
	}

	return null;
}

function extractArtistFromContent(content: string): string | null {
	// Look for common artist patterns in tab content
	const artistPatterns = [
		/artist:\s*(.+?)(?:\n|\r|$)/i,
		/by:\s*(.+?)(?:\n|\r|$)/i,
		/band:\s*(.+?)(?:\n|\r|$)/i
	];

	for (const pattern of artistPatterns) {
		const match = content.match(pattern);
		if (match && match[1]) {
			return match[1].trim();
		}
	}

	return null;
}

async function processWithAI(content: string, options: TabImportOptions): Promise<string> {
	const endpoint = options.aiEndpoint || 'http://localhost:11434/api/generate';
	const model = options.aiModel || 'phi3';

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				prompt: createTabFormattingPrompt(content),
				stream: false,
				max_tokens: 4000
			})
		});

		if (!response.ok) {
			throw new Error(`AI service error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.response || content; // Fall back to original content if no response
	} catch (error) {
		console.error('AI processing error:', error);
		// If AI processing fails, return original content
		return content;
	}
}

function createTabFormattingPrompt(content: string): string {
	return `You are a guitar tab formatting expert. Please format this tab into a clean, consistent format:
1. Remove any unnecessary text or ads
2. Maintain correct alignment of tab notation
3. Ensure strings are properly labeled (e.g., e|--3--| B|--0--|)
4. Preserve section headers (Verse, Chorus, etc.)
5. Keep any chord notations above lyrics
6. Make sure spacing is consistent

Here's the tab to format:

${content}

Format the tab with proper spacing, alignment, and structure:`;
}
