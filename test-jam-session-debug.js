/**
 * Debug script to manually test jam session UI
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false, slowMo: 500 });
	const context = await browser.newContext({
		viewport: { width: 375, height: 667 } // iPhone SE size
	});
	const page = await context.newPage();

	try {
		console.log('Navigating to app...');
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);

		console.log('Taking screenshot of initial state...');
		await page.screenshot({ path: 'debug-initial.png' });

		console.log('Looking for navigation buttons...');
		const buttons = await page.locator('button').all();
		console.log(`Found ${buttons.length} buttons`);

		for (let i = 0; i < buttons.length; i++) {
			const text = await buttons[i].textContent().catch(() => '');
			const ariaLabel = await buttons[i].getAttribute('aria-label').catch(() => '');
			console.log(`Button ${i}: text="${text}", aria-label="${ariaLabel}"`);
		}

		console.log('\nLooking for Jam Session button...');
		const jamButton = page.locator('button').filter({ hasText: /Jam/ });
		const count = await jamButton.count();
		console.log(`Found ${count} buttons with "Jam" text`);

		if (count > 0) {
			console.log('Clicking Jam button...');
			await jamButton.first().click();
			await page.waitForTimeout(1000);
			await page.screenshot({ path: 'debug-after-click.png' });

			console.log('Looking for bottom sheet...');
			const createOption = page.locator('text=Create Session');
			const isVisible = await createOption.isVisible();
			console.log(`Create Session option visible: ${isVisible}`);
		} else {
			console.log('❌ No Jam button found!');
			console.log('\nChecking if navigation element exists...');
			const nav = page.locator('nav');
			const navCount = await nav.count();
			console.log(`Found ${navCount} nav elements`);
		}

		console.log('\nPress Ctrl+C to close browser...');
		await page.waitForTimeout(30000); // Keep browser open for 30 seconds

	} catch (error) {
		console.error('Error:', error.message);
		await page.screenshot({ path: 'debug-error.png' });
	} finally {
		await browser.close();
	}
})();
