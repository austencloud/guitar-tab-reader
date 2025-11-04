// Visual inspection test for navigation accessibility
// This script helps verify touch targets and accessibility features

import { chromium } from '@playwright/test';

async function testNavigationAccessibility() {
	console.log('\n🧪 Testing Navigation Accessibility...\n');

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 } // iPhone 14 Pro size
	});
	const page = await context.newPage();

	try {
		// Navigate to the app
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');

		console.log('✅ Page loaded\n');

		// Test 1: Check navigation exists
		const nav = await page.locator('.primary-navigation').first();
		const isVisible = await nav.isVisible();
		console.log(`Navigation visible: ${isVisible ? '✅' : '❌'}`);

		// Test 2: Check all navigation buttons
		const navButtons = await page.locator('.primary-navigation .nav-button').all();
		console.log(`\nFound ${navButtons.length} navigation buttons\n`);

		for (let i = 0; i < navButtons.length; i++) {
			const button = navButtons[i];
			const box = await button.boundingBox();
			const ariaLabel = await button.getAttribute('aria-label');

			if (box) {
				const meetsMinTouch = box.width >= 44 && box.height >= 44;
				const status = meetsMinTouch ? '✅' : '❌';
				console.log(
					`Button ${i + 1}: ${ariaLabel || 'Unknown'}`
				);
				console.log(
					`  ${status} Size: ${Math.round(box.width)}x${Math.round(box.height)}px (Min: 44x44px)`
				);
				console.log(
					`  ${ariaLabel ? '✅' : '❌'} Has aria-label: ${ariaLabel || 'Missing'}`
				);
			}
		}

		// Test 3: Check focus visibility
		console.log('\n📍 Testing keyboard navigation...');
		await page.keyboard.press('Tab');
		await page.waitForTimeout(500);

		const focusedElement = await page.evaluate(() => {
			const focused = document.activeElement;
			return {
				tagName: focused?.tagName,
				className: focused?.className,
				hasOutline: window.getComputedStyle(focused).outlineWidth !== '0px'
			};
		});

		console.log(
			`  ${focusedElement.hasOutline ? '✅' : '❌'} Focus visible on: ${focusedElement.tagName}.${focusedElement.className}`
		);

		// Test 4: Portrait mode test
		console.log('\n📱 Testing portrait mode (bottom navigation)...');
		await page.waitForTimeout(1000);
		const hasBottomLayout = await page.locator('.primary-navigation.layout-bottom').isVisible();
		console.log(`  ${hasBottomLayout ? '✅' : '❌'} Bottom layout active in portrait`);

		// Test 5: Landscape mode test
		console.log('\n📱 Testing landscape mode (side navigation)...');
		await page.setViewportSize({ width: 844, height: 390 }); // Landscape
		await page.waitForTimeout(1000);
		const hasSideLayout = await page.locator('.primary-navigation.layout-side').isVisible();
		console.log(`  ${hasSideLayout ? '✅' : '❌'} Side layout active in landscape`);

		// Test 6: Container queries - labels visibility
		console.log('\n📏 Testing responsive labels (container queries)...');

		// Set wide viewport
		await page.setViewportSize({ width: 600, height: 800 });
		await page.waitForTimeout(500);
		const fullLabelVisible = await page
			.locator('.primary-navigation .nav-label-full')
			.first()
			.isVisible();
		console.log(`  ${fullLabelVisible ? '✅' : '❌'} Full labels visible at 600px width`);

		// Set narrow viewport
		await page.setViewportSize({ width: 350, height: 800 });
		await page.waitForTimeout(500);
		const iconOnlyMode = await page
			.locator('.primary-navigation .nav-label-full')
			.first()
			.isHidden();
		console.log(`  ${iconOnlyMode ? '✅' : '❌'} Icons-only mode at 350px width`);

		// Test 7: Button interactions
		console.log('\n🖱️ Testing button interactions...');
		await page.setViewportSize({ width: 390, height: 844 }); // Back to portrait
		await page.waitForTimeout(500);

		const addButton = await page.locator('.primary-navigation .nav-button').nth(1);
		await addButton.click();
		await page.waitForTimeout(500);

		const bottomSheetVisible = await page
			.locator('[class*="bottom-sheet"], [class*="BottomSheet"]')
			.isVisible();
		console.log(`  ${bottomSheetVisible ? '✅' : '❌'} Add Tab action triggered`);

		// Test 8: Color contrast test
		console.log('\n🎨 Testing color contrast...');
		const navBg = await page.locator('.primary-navigation').evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});
		console.log(`  Navigation background: ${navBg}`);

		console.log('\n✨ Visual inspection completed!');
		console.log('   The browser will remain open for manual inspection.');
		console.log('   Press Ctrl+C to close.\n');

		// Keep browser open for manual inspection
		await page.waitForTimeout(300000); // 5 minutes
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	} finally {
		await browser.close();
	}
}

testNavigationAccessibility();
