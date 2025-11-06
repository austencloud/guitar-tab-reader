/**
 * Check the actual DOM state after page load
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
		await page.waitForTimeout(3000);

		// Check what's actually in the DOM
		const domCheck = await page.evaluate(() => {
			const body = document.body;
			const allElements = Array.from(body.querySelectorAll('*'));

			return {
				totalElements: allElements.length,
				hasSessionBottomSheet: allElements.some(el =>
					el.textContent?.includes('Create Session') ||
					el.textContent?.includes('Join Session')
				),
				bodyHTML: body.innerHTML.substring(0, 2000),
				// Check for any elements with session-related classes
				sessionElements: allElements
					.filter(el =>
						el.className &&
						typeof el.className === 'string' &&
						(el.className.includes('session') || el.className.includes('bottom-sheet'))
					)
					.map(el => ({ tag: el.tagName, class: el.className }))
			};
		});

		console.log('\n=== DOM Check ===');
		console.log('Total elements:', domCheck.totalElements);
		console.log('Has Session Bottom Sheet text:', domCheck.hasSessionBottomSheet);
		console.log('Session-related elements:', domCheck.sessionElements);
		console.log('\nPartial body HTML:', domCheck.bodyHTML.substring(0, 500));

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
