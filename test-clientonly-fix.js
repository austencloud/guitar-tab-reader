/**
 * Test if ClientOnly wrapper fixes the Svelte 5 reactivity bug
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

		// Check if session components are now in the DOM
		const initialCheck = await page.evaluate(() => {
			return {
				hasCreateSession: document.body.textContent.includes('Create Session'),
				hasJoinSession: document.body.textContent.includes('Join Session'),
				sessionElements: Array.from(document.querySelectorAll('*'))
					.filter(el => el.textContent?.includes('Session') && el.tagName !== 'BUTTON')
					.map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 50) }))
			};
		});

		console.log('\n=== Initial DOM Check (after ClientOnly mount) ===');
		console.log('Has "Create Session" text:', initialCheck.hasCreateSession);
		console.log('Has "Join Session" text:', initialCheck.hasJoinSession);
		console.log('Session elements:', initialCheck.sessionElements);

		// Click the Jam button
		console.log('\n=== Clicking Jam button ===');
		try {
			await page.locator('button[aria-label="Jam Session"]').click({ timeout: 5000 });
			await page.waitForTimeout(2000);
		} catch (error) {
			console.log('Click failed:', error.message);
			// Take screenshot for debugging
			await page.screenshot({ path: 'click-failed.png' });
			console.log('Screenshot saved to click-failed.png');
		}

		// Check if bottom sheet appears
		const afterClick = await page.evaluate(() => {
			return {
				hasCreateSession: document.body.textContent.includes('Create Session'),
				hasJoinSession: document.body.textContent.includes('Join Session'),
				hasBottomSheet: !!document.querySelector('[class*="bottom-sheet"]'),
				bodyLength: document.body.innerHTML.length
			};
		});

		console.log('\n=== After Clicking Jam Button ===');
		console.log('Has "Create Session" text:', afterClick.hasCreateSession);
		console.log('Has "Join Session" text:', afterClick.hasJoinSession);
		console.log('Has bottom sheet element:', afterClick.hasBottomSheet);
		console.log('Body HTML length:', afterClick.bodyLength);

		if (afterClick.hasCreateSession && afterClick.hasJoinSession) {
			console.log('\n✅ SUCCESS! ClientOnly wrapper fixed the rendering issue!');
		} else {
			console.log('\n❌ FAILED: Components still not rendering');
		}

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
