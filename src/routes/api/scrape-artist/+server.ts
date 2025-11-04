import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium } from 'playwright';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { artistName } = await request.json();

		if (!artistName || typeof artistName !== 'string') {
			return json({ success: false, error: 'Invalid artist name' }, { status: 400 });
		}

		console.log(`🎸 Scraping tabs for artist: ${artistName}`);

		const tabs = await scrapeArtistTabs(artistName);

		if (!tabs || tabs.length === 0) {
			console.warn('⚠️ No tabs found for artist');
			return json(
				{
					success: false,
					error: 'No tabs found for this artist. Please check the spelling or try a different artist.'
				},
				{ status: 404 }
			);
		}

		console.log(`✅ Found ${tabs.length} tabs for ${artistName}`);

		return json({
			success: true,
			artistName,
			tabs,
			count: tabs.length
		});
	} catch (error) {
		console.error('❌ Error scraping artist tabs:', error);
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

async function scrapeArtistTabs(artistName: string): Promise<TabInfo[]> {
	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		});
		const page = await context.newPage();

		// Step 1: Search for the artist to get their page URL
		const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=band&value=${encodeURIComponent(artistName)}`;

		console.log(`🔍 Searching for artist: ${searchUrl}...`);
		await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Extract artist page URL from search results
		console.log(`📄 Finding artist page...`);
		const artistPageUrl = await page.evaluate(() => {
			const artistLink = document.querySelector('a[href*="/artist/"]');
			return artistLink ? (artistLink as HTMLAnchorElement).href : null;
		});

		if (!artistPageUrl) {
			await browser.close();
			console.warn('⚠️ Could not find artist page');
			return [];
		}

		console.log(`🌐 Navigating to artist page: ${artistPageUrl}...`);
		await page.goto(artistPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Step 2: Scroll to load all dynamically-loaded tabs
		console.log(`📜 Scrolling to load all tabs...`);
		let previousTabCount = 0;
		let currentTabCount = 0;
		let scrollAttempts = 0;
		const maxScrollAttempts = 20; // Prevent infinite loops

		do {
			previousTabCount = currentTabCount;

			// Scroll to bottom of page
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight);
			});

			// Wait for content to load
			await page.waitForTimeout(1500);

			// Count current tabs
			currentTabCount = await page.evaluate(() => {
				return document.querySelectorAll('article a[href*="/tab/"]').length;
			});

			scrollAttempts++;
			console.log(`   Scroll ${scrollAttempts}: Found ${currentTabCount} tabs...`);

			// Stop if we've reached max attempts or no new tabs are loading
		} while (currentTabCount > previousTabCount && scrollAttempts < maxScrollAttempts);

		console.log(`✅ Finished scrolling. Total tabs found: ${currentTabCount}`);

		// Step 3: Extract all tabs from artist page
		console.log(`📄 Extracting tabs from artist page...`);
		const tabs = await page.evaluate(() => {
			const results: TabInfo[] = [];
			const seenUrls = new Set<string>();

			// Extract artist name from page header
			const artistHeader = document.querySelector('h1');
			const artist = artistHeader?.textContent?.replace(/\s+(Chords?|Tabs?|&).*/i, '').trim() || '';

			// Find all rows in the artist page table (each row is a tab)
			const rows = document.querySelectorAll('article .dyhP1:not(.oStLJ)');
			console.log(`Found ${rows.length} result rows`);

			rows.forEach((row) => {
				// Each row has 4 cells: Artist | Song | Rating | Type
				const cells = row.querySelectorAll('.qNp1Q');
				if (cells.length < 4) return;

				// Cell 1: Song title and URL
				const songCell = cells[1];
				const songLink = songCell.querySelector('a[href*="/tab/"]') as HTMLAnchorElement;
				if (!songLink) return;

				const url = songLink.href;
				if (!url || url.endsWith('#') || seenUrls.has(url)) return;
				seenUrls.add(url);

				let title = songLink.textContent?.trim() || '';
				title = title.replace(/\s*\*\s*$/, '').trim();
				if (!title) return;

				// Cell 2: Rating (stars and vote count)
				const ratingCell = cells[2];
				const stars = ratingCell.querySelectorAll('.STM0m');
				let rating = 0;
				stars.forEach((star) => {
					// Count filled stars (N3Nzv without cr1d0 or t4iet = filled)
					if (
						star.classList.contains('N3Nzv') &&
						!star.classList.contains('cr1d0') &&
						!star.classList.contains('t4iet')
					) {
						rating++;
					}
				});

				const voteDiv = ratingCell.querySelector('.fxXfx');
				const votesText = voteDiv?.textContent?.trim() || '0';
				// Parse vote count, handling commas (e.g., "4,307" -> 4307)
				const votes = parseInt(votesText.replace(/,/g, ''), 10) || 0;

				// Cell 3: Type
				const typeCell = cells[3];
				let type = typeCell.textContent?.trim() || 'Tab';

				// If type is not set or is generic, try to determine from URL
				if (!type || type === 'Tab') {
					if (url.includes('-chords-')) type = 'Chords';
					else if (url.includes('-bass-')) type = 'Bass';
					else if (url.includes('-tabs-')) type = 'Tab';
					else if (url.includes('-ukulele-')) type = 'Ukulele';
					else if (url.includes('-guitar-pro-')) type = 'Guitar Pro';
					else if (url.includes('-power-')) type = 'Power';
					else if (url.includes('-drums-')) type = 'Drums';
				}

				results.push({
					title,
					artist,
					url,
					type,
					rating: rating > 0 ? rating : undefined,
					votes: votes > 0 ? votes : undefined
				});
			});

			return results;
		});

		await browser.close();

		// Remove duplicates and filter out invalid entries
		const uniqueTabs = Array.from(
			new Map(tabs.map((tab) => [tab.url, tab])).values()
		);

		console.log(`✅ Found ${uniqueTabs.length} unique tabs`);

		return uniqueTabs;
	} catch (error) {
		if (browser) {
			await browser.close();
		}
		console.error('❌ Playwright error while scraping artist:', error);
		throw error;
	}
}
