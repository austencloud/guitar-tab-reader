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

			// Find all tab links - try multiple selector strategies
			let tabLinks = document.querySelectorAll('article a[href*="/tab/"]');

			// Log what we found for debugging
			console.log(`Strategy 1 - Found ${tabLinks.length} tab links with 'article a[href*="/tab/"]'`);

			// If we didn't find any with the article selector, try broader search
			if (tabLinks.length === 0) {
				tabLinks = document.querySelectorAll('a[href*="/tab/"]');
				console.log(`Strategy 2 - Found ${tabLinks.length} tab links with 'a[href*="/tab/"]'`);
			}

			// Process each tab link
			tabLinks.forEach((link) => {
				const url = (link as HTMLAnchorElement).href;
				if (!url || url.endsWith('#') || seenUrls.has(url)) return;
				seenUrls.add(url);

				// Get title from link text
				let title = link.textContent?.trim() || '';
				title = title.replace(/\s*\*\s*$/, '').trim();
				if (!title) return;

				// Try to find parent row to extract rating and type info
				let rating: number | undefined;
				let votes: number | undefined;
				let type = 'Tab';

				// Try to find the containing row/article
				const parentRow = link.closest('article') || link.closest('tr') || link.closest('div[class*="row"]');

				if (parentRow) {
					// Try to extract rating - look for star elements
					const stars = parentRow.querySelectorAll('[class*="star" i], .STM0m, [data-rating]');
					if (stars.length > 0) {
						// Count filled/active stars
						let starCount = 0;
						stars.forEach((star) => {
							// Check various ways stars might be marked as filled
							const classList = Array.from(star.classList);
							const isFilled = classList.some(c =>
								c.includes('fill') || c.includes('active') || c.includes('N3Nzv')
							) && !classList.some(c =>
								c.includes('empty') || c.includes('cr1d0') || c.includes('t4iet')
							);
							if (isFilled) starCount++;
						});
						if (starCount > 0) rating = starCount;
					}

					// Try to extract vote count
					const voteElements = parentRow.querySelectorAll('[class*="vote" i], .fxXfx, [class*="rating" i]');
					for (const el of voteElements) {
						const text = el.textContent?.trim() || '';
						const match = text.match(/[\d,]+/);
						if (match) {
							const parsedVotes = parseInt(match[0].replace(/,/g, ''), 10);
							if (parsedVotes > 0) {
								votes = parsedVotes;
								break;
							}
						}
					}

					// Try to extract type from text content or nearby elements
					const typeElements = parentRow.querySelectorAll('[class*="type" i]');
					for (const el of typeElements) {
						const typeText = el.textContent?.trim();
						if (typeText && typeText.length < 20) { // Type should be short
							type = typeText;
							break;
						}
					}
				}

				// Fallback: determine type from URL if not found
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
					rating: rating && rating > 0 ? rating : undefined,
					votes: votes && votes > 0 ? votes : undefined
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
