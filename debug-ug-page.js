/**
 * Debug script to inspect Ultimate Guitar page structure
 */

import { chromium } from 'playwright';

async function debugPage() {
	console.log('🔍 Launching browser to inspect Green Day artist page...\n');

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();

	try {
		// Navigate to search
		const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=band&value=${encodeURIComponent('Green Day')}`;
		console.log(`📄 Searching: ${searchUrl}`);
		await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Get artist page URL
		const artistPageUrl = await page.evaluate(() => {
			const artistLink = document.querySelector('a[href*="/artist/"]');
			return artistLink ? artistLink.href : null;
		});

		if (!artistPageUrl) {
			console.log('❌ Could not find artist page URL');
			await browser.close();
			return;
		}

		console.log(`🌐 Artist page: ${artistPageUrl}\n`);

		// Navigate to artist page
		await page.goto(artistPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Check different selectors
		console.log('📊 Testing different selectors:\n');

		const selectors = [
			'article a[href*="/tab/"]',
			'a[href*="/tab/"]',
			'[data-name] a[href*="/tab/"]',
			'.js-tablist a[href*="/tab/"]',
		];

		for (const selector of selectors) {
			const count = await page.evaluate((sel) => {
				return document.querySelectorAll(sel).length;
			}, selector);
			console.log(`   ${selector.padEnd(40)} → ${count} elements`);
		}

		// Look for "Basket Case" specifically
		console.log('\n🔍 Searching for "Basket Case" on page...\n');

		const basketCaseInfo = await page.evaluate(() => {
			const basketLinks = Array.from(document.querySelectorAll('a')).filter(a =>
				a.textContent.toLowerCase().includes('basket case')
			);

			return basketLinks.map(link => ({
				text: link.textContent.trim(),
				href: link.href,
				selector: link.getAttribute('class') || 'no-class',
				parent: link.parentElement?.tagName || 'unknown'
			}));
		});

		if (basketCaseInfo.length > 0) {
			console.log(`✅ Found ${basketCaseInfo.length} "Basket Case" links:`);
			basketCaseInfo.forEach((info, i) => {
				console.log(`\n   ${i + 1}. Text: "${info.text}"`);
				console.log(`      URL: ${info.href}`);
				console.log(`      Class: ${info.selector}`);
				console.log(`      Parent: ${info.parent}`);
			});
		} else {
			console.log('❌ "Basket Case" NOT found on the page');
			console.log('   This might mean:');
			console.log('   - The tabs are loaded dynamically (JavaScript/AJAX)');
			console.log('   - The tabs are on a different tab/section of the page');
			console.log('   - The page requires scrolling to load more tabs');
		}

		// Check if there's pagination or "Load More" button
		console.log('\n📄 Checking for pagination/load more...\n');

		const paginationInfo = await page.evaluate(() => {
			const loadMore = document.querySelector('[data-load-more], .js-load-more, button:has-text("Load"), button:has-text("More")');
			const pagination = document.querySelector('.pagination, [class*="page"]');

			return {
				hasLoadMore: !!loadMore,
				loadMoreText: loadMore?.textContent?.trim() || null,
				hasPagination: !!pagination,
				paginationHTML: pagination?.outerHTML?.substring(0, 200) || null
			};
		});

		console.log('   Load More button:', paginationInfo.hasLoadMore ? `Yes (${paginationInfo.loadMoreText})` : 'No');
		console.log('   Pagination:', paginationInfo.hasPagination ? 'Yes' : 'No');

		// Take a screenshot for inspection
		await page.screenshot({ path: 'F:\\_CODE\\tab-scroll\\debug-greenday-page.png', fullPage: false });
		console.log('\n📸 Screenshot saved to: debug-greenday-page.png');

	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await browser.close();
	}
}

debugPage();
