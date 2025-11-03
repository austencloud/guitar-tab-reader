import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium } from 'playwright';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { song, artist } = await request.json();

		if (!song || typeof song !== 'string') {
			return json({ success: false, error: 'Invalid song name' }, { status: 400 });
		}

		console.log(`🎸 Scraping tabs by title: ${song}${artist ? ` by ${artist}` : ''}`);

		const tabs = await scrapeTitleSearch(song, artist);

		if (!tabs || tabs.length === 0) {
			console.warn('⚠️ No tabs found for this search');
			return json(
				{
					success: false,
					error: 'No tabs found for this song. Please check the spelling or try a different search.'
				},
				{ status: 404 }
			);
		}

		console.log(`✅ Found ${tabs.length} tabs for "${song}"`);

		return json({
			success: true,
			song,
			artist: artist || null,
			tabs,
			count: tabs.length
		});
	} catch (error) {
		console.error('❌ Error scraping tabs by title:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

interface TabInfo {
	title: string;
	artist: string;
	url: string;
	type: string;
	rating?: number;
	votes?: number;
}

async function scrapeTitleSearch(song: string, artist?: string): Promise<TabInfo[]> {
	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		});
		const page = await context.newPage();

		// Search by title
		const searchQuery = artist ? `${song} ${artist}` : song;
		const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(searchQuery)}`;

		console.log(`🔍 Searching by title: ${searchUrl}...`);
		await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Scroll to load more results
		console.log(`📜 Scrolling to load all results...`);
		let previousTabCount = 0;
		let currentTabCount = 0;
		let scrollAttempts = 0;
		const maxScrollAttempts = 10;

		do {
			previousTabCount = currentTabCount;

			// Scroll to bottom
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight);
			});

			// Wait for content to load
			await page.waitForTimeout(1000);

			// Count current tabs
			currentTabCount = await page.evaluate(() => {
				return document.querySelectorAll('a[href*="/tab/"]').length;
			});

			scrollAttempts++;
			console.log(`   Scroll ${scrollAttempts}: Found ${currentTabCount} tabs...`);

		} while (currentTabCount > previousTabCount && scrollAttempts < maxScrollAttempts);

		console.log(`✅ Finished scrolling. Total tabs found: ${currentTabCount}`);

		// Extract tabs from search results
		console.log(`📄 Extracting tabs from search results...`);
		const tabs = await page.evaluate(() => {
			const tabLinks = document.querySelectorAll('a[href*="/tab/"]');
			const results: TabInfo[] = [];
			const seenUrls = new Set<string>();

			tabLinks.forEach((linkElement) => {
				const url = (linkElement as HTMLAnchorElement).href;

				// Skip if URL is just "#" or already seen
				if (!url || url.endsWith('#') || seenUrls.has(url)) return;
				seenUrls.add(url);

				// Get title from link text
				let title = linkElement.textContent?.trim() || '';
				title = title.replace(/\s*\*\s*$/, '').trim();

				// Skip if empty
				if (!title) return;

				// Try to extract artist from page context (usually in parent elements)
				const parent = linkElement.closest('article, div, section');
				const artistElement = parent?.querySelector('[class*="artist"], a[href*="/artist/"]');
				const artist = artistElement?.textContent?.trim() || '';

				// Determine type from URL
				let type = 'Tab';
				if (url.includes('-chords-')) type = 'Chords';
				else if (url.includes('-bass-')) type = 'Bass';
				else if (url.includes('-tabs-')) type = 'Tab';
				else if (url.includes('-ukulele-')) type = 'Ukulele';
				else if (url.includes('-guitar-pro-')) type = 'Guitar Pro';
				else if (url.includes('-power-')) type = 'Power';
				else if (url.includes('-drums-')) type = 'Drums';

				results.push({
					title,
					artist,
					url,
					type,
					rating: undefined,
					votes: undefined
				});
			});

			return results;
		});

		await browser.close();

		// Remove duplicates
		const uniqueTabs = Array.from(new Map(tabs.map((tab) => [tab.url, tab])).values());

		console.log(`✅ Found ${uniqueTabs.length} unique tabs`);

		return uniqueTabs;
	} catch (error) {
		if (browser) {
			await browser.close();
		}
		console.error('❌ Playwright error while scraping by title:', error);
		throw error;
	}
}
