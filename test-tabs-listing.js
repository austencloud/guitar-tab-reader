/**
 * Test different URL patterns to find where individual tabs are listed
 */

import { chromium } from 'playwright';

async function testTabsListing() {
	console.log('🔍 Testing different URLs to find tab listings...\n');

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();

	const urlsToTest = [
		'https://www.ultimate-guitar.com/artist/green_day_1368',
		'https://tabs.ultimate-guitar.com/artist/green_day',
		'https://www.ultimate-guitar.com/explore?name%5Bquery%5D=green%20day&type%5B%5D=Chords&type%5B%5D=Tabs',
		'https://www.ultimate-guitar.com/search.php?search_type=title&value=green%20day'
	];

	for (const url of urlsToTest) {
		try {
			console.log(`\n${'='.repeat(80)}`);
			console.log(`Testing: ${url}`);
			console.log('='.repeat(80));

			await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
			await page.waitForTimeout(2000);

			const tabCount = await page.evaluate(() => {
				const tabLinks = document.querySelectorAll('a[href*="/tab/"]');
				const basketCase = Array.from(tabLinks).find(a =>
					a.textContent?.toLowerCase().includes('basket case') ||
					a.href.includes('basket-case')
				);

				return {
					total: tabLinks.length,
					basketCase: basketCase ? {
						text: basketCase.textContent?.trim(),
						href: basketCase.href
					} : null
				};
			});

			console.log(`\n📊 Results:`);
			console.log(`   Total tab links: ${tabCount.total}`);

			if (tabCount.basketCase) {
				console.log(`   ✅ FOUND "Basket Case"!`);
				console.log(`      Text: "${tabCount.basketCase.text}"`);
				console.log(`      URL: ${tabCount.basketCase.href}`);
			} else {
				console.log(`   ❌ "Basket Case" NOT found`);
			}

		} catch (error) {
			console.log(`   ❌ Error: ${error.message}`);
		}
	}

	await browser.close();
}

testTabsListing();
