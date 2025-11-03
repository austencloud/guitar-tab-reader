/**
 * Search specifically for "Basket Case" to see where it appears
 */

import { chromium } from 'playwright';

async function searchBasketCase() {
	console.log('🔍 Searching for "Basket Case" on Ultimate Guitar...\n');

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();

	try {
		// Search for "basket case green day"
		const searchUrl = 'https://www.ultimate-guitar.com/search.php?search_type=title&value=basket%20case%20green%20day';
		console.log(`🌐 Searching: ${searchUrl}\n`);

		await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Extract all results
		const results = await page.evaluate(() => {
			const tabLinks = Array.from(document.querySelectorAll('a[href*="/tab/"]'));

			return tabLinks.map(link => ({
				text: link.textContent?.trim(),
				href: link.href,
				isBasketCase: link.textContent?.toLowerCase().includes('basket case') ||
					link.href.includes('basket-case')
			})).filter(r => r.isBasketCase);
		});

		console.log(`✅ Found ${results.length} "Basket Case" results:\n`);

		results.forEach((result, i) => {
			console.log(`${i + 1}. "${result.text}"`);
			console.log(`   ${result.href}\n`);
		});

		// Now try the explore page with scrolling
		console.log('\n' + '='.repeat(80));
		console.log('Testing explore page with scrolling...');
		console.log('='.repeat(80) + '\n');

		const exploreUrl = 'https://www.ultimate-guitar.com/explore?name%5Bquery%5D=green%20day&type%5B%5D=Chords';
		console.log(`🌐 Navigating to: ${exploreUrl}\n`);

		await page.goto(exploreUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Scroll to load more
		let previousCount = 0;
		let currentCount = 0;
		let scrolls = 0;

		do {
			previousCount = currentCount;

			await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
			await page.waitForTimeout(2000);

			currentCount = await page.evaluate(() =>
				document.querySelectorAll('a[href*="/tab/"]').length
			);

			scrolls++;
			console.log(`Scroll ${scrolls}: Found ${currentCount} tabs...`);

		} while (currentCount > previousCount && scrolls < 10);

		// Check if Basket Case is there now
		const basketAfterScroll = await page.evaluate(() => {
			const tabLinks = Array.from(document.querySelectorAll('a[href*="/tab/"]'));
			return tabLinks.filter(link =>
				link.textContent?.toLowerCase().includes('basket case') ||
				link.href.includes('basket-case')
			).map(link => ({
				text: link.textContent?.trim(),
				href: link.href
			}));
		});

		if (basketAfterScroll.length > 0) {
			console.log(`\n✅ FOUND "Basket Case" after scrolling!`);
			basketAfterScroll.forEach(result => {
				console.log(`   "${result.text}" → ${result.href}`);
			});
		} else {
			console.log(`\n❌ "Basket Case" still not found after scrolling`);
		}

	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await browser.close();
	}
}

searchBasketCase();
