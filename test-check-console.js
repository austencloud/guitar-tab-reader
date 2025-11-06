/**
 * Check browser console for errors
 */
import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: false, slowMo: 500 });
	const context = await browser.newContext({
		viewport: { width: 375, height: 667 }
	});
	const page = await context.newPage();

	// Collect console messages
	const consoleMessages = [];
	page.on('console', msg => {
		consoleMessages.push({
			type: msg.type(),
			text: msg.text()
		});
		console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
	});

	// Collect errors
	const pageErrors = [];
	page.on('pageerror', error => {
		pageErrors.push(error.message);
		console.error('[PAGE ERROR]:', error.message);
	});

	try {
		console.log('Loading page...');
		await page.goto('http://localhost:5001');
		await page.waitForTimeout(5000);

		console.log('\n=== Console Messages ===');
		consoleMessages.forEach(msg => {
			console.log(`[${msg.type}]: ${msg.text}`);
		});

		console.log('\n=== Page Errors ===');
		pageErrors.forEach(err => {
			console.error(err);
		});

		console.log('\n=== DOM State ===');
		const domState = await page.evaluate(() => {
			return {
				bodyHTML: document.body.innerHTML.substring(0, 500),
				bodyLength: document.body.innerHTML.length,
				hasApp: !!document.querySelector('#app'),
				hasNav: !!document.querySelector('nav'),
				allElements: document.querySelectorAll('*').length
			};
		});
		console.log(domState);

		await page.waitForTimeout(60000);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
})();
