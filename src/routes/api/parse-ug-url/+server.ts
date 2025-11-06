import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium } from 'playwright';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		if (!url || typeof url !== 'string') {
			return json({ success: false, error: 'Invalid URL' }, { status: 400 });
		}

		// Validate it's a Ultimate Guitar URL
		if (!url.includes('ultimate-guitar.com') && !url.includes('tabs.ultimate-guitar.com')) {
			return json(
				{ success: false, error: 'Please provide a valid Ultimate Guitar URL' },
				{ status: 400 }
			);
		}

		console.log(`🎸 Fetching Ultimate Guitar page with Playwright: ${url}`);

		// Use Playwright to fetch and parse the page
		const tabData = await fetchTabWithPlaywright(url);

		if (!tabData || !tabData.content) {
			console.error('❌ Could not extract tab content from page');
			return json(
				{
					success: false,
					error: 'Could not extract tab content. The page may have changed or the tab may be unavailable.'
				},
				{ status: 500 }
			);
		}

		console.log(`✅ Successfully extracted tab: ${tabData.title || 'Unknown'}`);

		return json({
			success: true,
			title: tabData.title,
			artist: tabData.artist,
			content: tabData.content
		});
	} catch (error) {
		console.error('❌ Error parsing Ultimate Guitar URL:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

interface TabData {
	title?: string;
	artist?: string;
	content?: string;
}

async function fetchTabWithPlaywright(url: string): Promise<TabData | null> {
	let browser;
	try {
		// Launch headless browser
		browser = await chromium.launch({ headless: true });
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		});
		const page = await context.newPage();

		console.log(`🌐 Navigating to ${url}...`);

		// Navigate to the page - use domcontentloaded instead of networkidle (faster, more reliable)
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

		// Wait for page to settle and tab content to load
		console.log(`⏳ Waiting for tab content to load...`);
		await page.waitForTimeout(3000); // Give the page time to load dynamic content

		// Use Promise.race to wait for any of these selectors to appear
		await Promise.race([
			page.waitForSelector('code', { state: 'attached', timeout: 10000 }),
			page.waitForSelector('pre.js-tab-content', { state: 'attached', timeout: 10000 }),
			page.waitForSelector('pre[class*="tab"]', { state: 'attached', timeout: 10000 })
		]).catch(() => {
			console.warn('⚠️ Tab content selectors not found, will try to extract anyway');
		});

		// Extract tab data from the page
		console.log(`📄 Extracting tab data...`);
		const tabData = await page.evaluate(() => {
			// Extract tab content from code/pre element - try multiple possible selectors
			let codeElement = document.querySelector('code');
			if (!codeElement) {
				codeElement = document.querySelector('pre.js-tab-content');
			}
			if (!codeElement) {
				codeElement = document.querySelector('pre[class*="tab"]');
			}
			const content = codeElement?.textContent?.trim() || null;

			// Extract title from h1
			const titleElement = document.querySelector('h1');
			const fullTitle = titleElement?.textContent?.trim() || '';

			// Extract artist from link after "by" text
			const artistLink = document.querySelector('a[href*="/artist/"]');
			const artist = artistLink?.textContent?.trim() || '';

			// Clean up title - remove "Tab" or "Tabs" suffix
			const title = fullTitle.replace(/\s+(Tab|Tabs|Chords?|Bass)(\s+Tab)?$/i, '').trim();

			return {
				title: title || 'Imported Tab',
				artist: artist || '',
				content: content
			};
		});

		await browser.close();

		if (!tabData.content) {
			console.warn('⚠️ No content found in code element');
			return null;
		}

		console.log(`✅ Extracted ${tabData.content.length} characters of tab content`);

		return {
			title: tabData.title,
			artist: tabData.artist,
			content: cleanTabContent(tabData.content)
		};
	} catch (error) {
		if (browser) {
			await browser.close();
		}
		console.error('❌ Playwright error:', error);
		return null;
	}
}

function cleanTabContent(content: string): string {
	// Remove the "X" close button text that sometimes appears
	let cleaned = content.replace(/\s*X\s*$/g, '').trim();

	// Decode HTML entities
	cleaned = cleaned
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');

	// Remove [tab] and [ch] tags that Ultimate Guitar uses
	cleaned = cleaned.replace(/\[(tab|ch)\]/gi, '').replace(/\[\/(tab|ch)\]/gi, '');

	return cleaned.trim();
}
