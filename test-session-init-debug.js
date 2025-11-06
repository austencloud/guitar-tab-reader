/**
 * Debug script to check session initialization
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false, slowMo: 500 });
	const context = await browser.newContext({
		viewport: { width: 375, height: 667 }
	});
	const page = await context.newPage();

	// Listen for console messages
	page.on('console', msg => {
		console.log(`[Browser ${msg.type()}]:`, msg.text());
	});

	// Listen for page errors
	page.on('pageerror', error => {
		console.error('[Page Error]:', error.message);
	});

	try {
		console.log('Navigating to app...');
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(3000);

		console.log('\nChecking if session components are rendered...');
		const sessionSheet = await page.locator('text=Create Session').count();
		console.log(`SessionBottomSheet in DOM: ${sessionSheet > 0 ? 'YES' : 'NO'}`);

		// Execute JavaScript to check sessionState
		const sessionStateCheck = await page.evaluate(() => {
			// Try to access window to see if sessionState is exposed
			return {
				hasSessionIndicator: !!document.querySelector('.session-indicator'),
				hasBottomSheet: !!document.querySelector('[class*="bottom-sheet"]') || !!document.querySelector('[class*="session-options"]'),
				bodyClasses: document.body.className,
				allText: document.body.innerText.substring(0, 500)
			};
		});

		console.log('\nPage state check:', JSON.stringify(sessionStateCheck, null, 2));

		console.log('\nClicking Jam button...');
		const jamButton = page.locator('button[aria-label="Jam Session"]');
		await jamButton.click();
		await page.waitForTimeout(2000);

		console.log('\nAfter click - checking for bottom sheet...');
		const createVisible = await page.locator('text=Create Session').isVisible();
		console.log(`Create Session visible: ${createVisible}`);

		if (!createVisible) {
			console.log('\n❌ Bottom sheet did not open!');
			console.log('Taking screenshot...');
			await page.screenshot({ path: 'debug-click-failed.png', fullPage: true });

			// Check what elements are visible
			const visibleText = await page.evaluate(() => {
				return Array.from(document.querySelectorAll('*'))
					.filter(el => el.offsetParent !== null && el.textContent.trim())
					.map(el => el.textContent.trim())
					.slice(0, 20);
			});
			console.log('Visible text on page:', visibleText);
		}

		console.log('\nWaiting...');
		await page.waitForTimeout(10000);

	} catch (error) {
		console.error('Error:', error.message);
		await page.screenshot({ path: 'debug-init-error.png', fullPage: true });
	} finally {
		await browser.close();
	}
})();
