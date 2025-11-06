/**
 * Test clicking the Jam button
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

		console.log('\nLooking for Jam button...');
		const jamButton = await page.locator('button[aria-label="Jam Session"]');
		console.log('Jam button found:', await jamButton.count());

		console.log('\nClicking Jam button...');
		await jamButton.click();
		await page.waitForTimeout(2000);

		// Check for bottom sheet
		const hasBottomSheet = await page.evaluate(() => {
			const text = document.body.textContent || '';
			return {
				hasCreateSession: text.includes('Create Session'),
				hasJoinSession: text.includes('Join Session'),
				hasJamSessions: text.includes('Jam Sessions')
			};
		});

		console.log('\nAfter click:', hasBottomSheet);

		if (hasBottomSheet.hasCreateSession || hasBottomSheet.hasJoinSession || hasBottomSheet.hasJamSessions) {
			console.log('\n✅ SUCCESS! Bottom sheet appeared!');
		} else {
			console.log('\n❌ FAILED: Bottom sheet did not appear');
		}

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
