/**
 * Inspect Ultimate Guitar to find where individual song tabs are listed
 */

import { chromium } from 'playwright';

async function inspectPage() {
	console.log('🔍 Inspecting Ultimate Guitar page structure...\n');

	const browser = await chromium.launch({ headless: false }); // Run with UI so we can see
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();

	try {
		// Navigate to Green Day artist page
		const artistUrl = 'https://www.ultimate-guitar.com/artist/green_day_1368';
		console.log(`🌐 Navigating to: ${artistUrl}\n`);
		await page.goto(artistUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Check if there are tabs/sections on the page
		console.log('📄 Looking for navigation tabs/sections...\n');

		const navElements = await page.evaluate(() => {
			// Look for navigation elements
			const nav = {
				tabs: [],
				links: [],
				buttons: []
			};

			// Find tab-like elements
			document.querySelectorAll('[role="tab"], .tab, [class*="tab"], a[href*="tabs"]').forEach(el => {
				nav.tabs.push({
					text: el.textContent?.trim(),
					href: el.getAttribute('href'),
					class: el.className
				});
			});

			// Find links that might lead to tabs listing
			document.querySelectorAll('a').forEach(a => {
				const href = a.getAttribute('href');
				const text = a.textContent?.trim().toLowerCase();
				if (href && (text.includes('tab') || text.includes('song') || href.includes('tabs'))) {
					nav.links.push({
						text: a.textContent?.trim(),
						href: href
					});
				}
			});

			return nav;
		});

		console.log('Navigation Tabs:');
		navElements.tabs.forEach((tab, i) => {
			console.log(`  ${i + 1}. "${tab.text}" → ${tab.href}`);
		});

		console.log('\nRelevant Links:');
		navElements.links.slice(0, 20).forEach((link, i) => {
			console.log(`  ${i + 1}. "${link.text}" → ${link.href}`);
		});

		// Wait for user to inspect
		console.log('\n⏳ Browser will stay open for 60 seconds for manual inspection...');
		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await browser.close();
	}
}

inspectPage();
