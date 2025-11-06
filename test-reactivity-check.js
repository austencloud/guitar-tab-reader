/**
 * Check if sessionState assignment actually triggers reactivity
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

		console.log('\nWaiting for initialization...');
		await page.waitForTimeout(5000); // Give extra time

		// Check DOM multiple times to see if it updates
		for (let i = 0; i < 3; i++) {
			await page.waitForTimeout(2000);

			const check = await page.evaluate(() => {
				const hasBottomSheet = !!document.querySelector('[class*="session"]') ||
					document.body.innerHTML.includes('Create Session');
				const allDivs = Array.from(document.querySelectorAll('div')).length;
				return { hasBottomSheet, allDivs, timestamp: Date.now() };
			});

			console.log(`\nCheck ${i + 1}:`, check);
		}

		// Click the Jam button
		console.log('\nClicking Jam button...');
		await page.locator('button[aria-label="Jam Session"]').click();
		await page.waitForTimeout(2000);

		// Check if bottom sheet appears
		const afterClick = await page.evaluate(() => {
			return {
				hasCreateSession: document.body.textContent.includes('Create Session'),
				hasJoinSession: document.body.textContent.includes('Join Session'),
				bodyLength: document.body.innerHTML.length
			};
		});

		console.log('\nAfter click:', afterClick);

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
