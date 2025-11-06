/**
 * Test creating a jam session
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

		console.log('\nClicking Jam button...');
		await page.locator('button[aria-label="Jam Session"]').click();
		await page.waitForTimeout(2000);

		console.log('\nClicking Create Session button...');
		const createButton = page.getByRole('button', { name: /create session/i });
		await createButton.click();
		await page.waitForTimeout(2000);

		// Check if create session modal appeared
		const hasModal = await page.evaluate(() => {
			const text = document.body.textContent || '';
			return {
				hasDeviceName: text.includes('Device Name') || text.includes('Your Name'),
				hasCreateButton: text.includes('Create'),
				hasRoomName: text.includes('Room Name') || text.includes('Session Name')
			};
		});

		console.log('\nAfter clicking Create Session:', hasModal);

		if (hasModal.hasDeviceName || hasModal.hasCreateButton) {
			console.log('\n✅ SUCCESS! Create session modal appeared!');
		} else {
			console.log('\n❌ FAILED: Modal did not appear');
		}

		// Keep browser open for manual testing
		await page.waitForTimeout(120000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
