/**
 * Visual inspection script - opens the app in Playwright browser (headed mode)
 * so you can see it working
 */

import { chromium } from 'playwright';

async function openAppForInspection() {
	console.log('🚀 Opening TabScroll app in Playwright browser...\n');

	let browser;
	try {
		// Launch browser in HEADED mode (visible)
		browser = await chromium.launch({
			headless: false, // Show the browser!
			slowMo: 500 // Slow down operations so you can see them
		});

		const context = await browser.newContext({
			viewport: { width: 1280, height: 720 }
		});

		const page = await context.newPage();

		console.log('📱 Navigating to http://localhost:5001/...');
		await page.goto('http://localhost:5001/', { waitUntil: 'networkidle' });

		console.log('✅ Page loaded!\n');
		console.log('👀 Browser window is now open for visual inspection.');
		console.log('🎸 Try clicking the "AI Tab Generator" button to test the streaming progress!');
		console.log('\n⌨️  Press Ctrl+C in this terminal when you\'re done inspecting.\n');

		// Keep the browser open until user terminates
		await new Promise(() => {}); // Never resolves - keeps browser open
	} catch (error) {
		console.error('❌ Error:', error);
		if (browser) {
			await browser.close();
		}
		process.exit(1);
	}
}

openAppForInspection();
