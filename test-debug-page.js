/**
 * Debug test to see what's actually rendering and find the Jam button
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false, slowMo: 500 });
	const context = await browser.newContext({
		viewport: { width: 375, height: 667 }
	});
	const page = await context.newPage();

	page.on('console', msg => console.log(`[Browser]:`, msg.text()));

	try {
		console.log('Loading page...');
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(3000);

		// Take screenshot to see what's rendering
		await page.screenshot({ path: 'page-loaded.png' });
		console.log('\nScreenshot saved to page-loaded.png');

		// Check for any JavaScript errors
		const errors = await page.evaluate(() => {
			return {
				hasErrors: !!window.onerror,
				bodyText: document.body.textContent?.substring(0, 200),
				bodyHTML: document.body.innerHTML.length
			};
		});
		console.log('\nPage state:', errors);

		// Look for all buttons
		const buttons = await page.evaluate(() => {
			return Array.from(document.querySelectorAll('button')).map(btn => ({
				text: btn.textContent?.trim(),
				ariaLabel: btn.getAttribute('aria-label'),
				className: btn.className,
				id: btn.id
			}));
		});

		console.log('\n=== All buttons found ===');
		console.log(JSON.stringify(buttons, null, 2));

		// Try different selectors for Jam button
		const selectors = [
			'button[aria-label="Jam Session"]',
			'button[aria-label="Jam"]',
			'button:has-text("Jam")',
			'nav button',
			'[role="navigation"] button'
		];

		console.log('\n=== Testing different selectors ===');
		for (const selector of selectors) {
			const count = await page.locator(selector).count();
			console.log(`${selector}: ${count} found`);
		}

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
		await page.screenshot({ path: 'error-state.png' });
	} finally {
		await browser.close();
	}
})();
