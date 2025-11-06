/**
 * Test to see what the actual store values are in the browser
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false, slowMo: 300 });
	const context = await browser.newContext({
		viewport: { width: 375, height: 667 }
	});
	const page = await context.newPage();

	page.on('console', msg => console.log(`[Browser]:`, msg.text()));

	try {
		console.log('Loading page...');
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(5000);

		// Inject script to check store values
		const storeCheck = await page.evaluate(() => {
			// Try to access the Svelte component and its stores
			const allElements = Array.from(document.querySelectorAll('*'));

			// Find if there are any Svelte comment markers for conditional blocks
			const bodyHTML = document.body.innerHTML;
			const hasConditionalMarkers = bodyHTML.includes('<!--[!-->');
			const conditionalMarkersCount = (bodyHTML.match(/<!--\[!\-->/g) || []).length;

			return {
				hasConditionalMarkers,
				conditionalMarkersCount,
				bodyHTMLSubstring: bodyHTML.substring(0, 1000)
			};
		});

		console.log('\n=== Store Check ===');
		console.log('Has conditional markers:', storeCheck.hasConditionalMarkers);
		console.log('Conditional markers count:', storeCheck.conditionalMarkersCount);
		console.log('\\nBody HTML (first 1000 chars):', storeCheck.bodyHTMLSubstring);

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
