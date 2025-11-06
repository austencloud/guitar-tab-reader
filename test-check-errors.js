/**
 * Check if there are any runtime errors
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		viewport: { width: 1200, height: 800 }
	});
	const page = await context.newPage();

	const consoleErrors = [];
	page.on('console', msg => {
		if (msg.type() === 'error') {
			consoleErrors.push(msg.text());
		}
		console.log(`[Browser ${msg.type()}]:`, msg.text());
	});

	page.on('pageerror', error => {
		console.error('Page error:', error.message);
		consoleErrors.push(error.message);
	});

	try {
		console.log('Loading page...');
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(5000);

		// Check for error overlay
		const errorOverlay = await page.locator('vite-error-overlay').count();
		if (errorOverlay > 0) {
			console.log('\n❌ ERROR OVERLAY DETECTED!');
			await page.screenshot({ path: 'error-overlay.png', fullPage: true });
			console.log('Screenshot saved to error-overlay.png');

			// Try to read error message
			const errorText = await page.locator('vite-error-overlay').textContent();
			console.log('\nError text:', errorText?.substring(0, 500));
		} else {
			console.log('\n✅ No error overlay detected');
		}

		console.log('\nConsole errors:', consoleErrors);

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Test error:', error);
	} finally {
		await browser.close();
	}
})();
