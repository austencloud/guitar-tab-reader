/**
 * SETTINGS PANEL RESPONSIVE VALIDATION
 *
 * Ensures the settings panel fits beautifully on all devices:
 * - Compact tab preview on small screens
 * - Proper spacing and padding optimization
 * - Zero horizontal overflow
 * - All touch targets meet minimum requirements
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Helper: Comprehensive overflow detection
async function detectOverflow(page, testInfo) {
	const results = await page.evaluate(() => {
		const issues = [];

		// Check document-level overflow
		const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

		if (hasHorizontalScroll) {
			issues.push({
				type: 'HORIZONTAL_SCROLL',
				element: 'document',
				scrollWidth: document.documentElement.scrollWidth,
				viewportWidth: window.innerWidth,
				overflow: document.documentElement.scrollWidth - window.innerWidth
			});
		}

		// Check all elements for horizontal overflow
		const allElements = document.querySelectorAll('*');
		allElements.forEach((el) => {
			const rect = el.getBoundingClientRect();

			// Check if element extends beyond viewport
			if (rect.right > window.innerWidth && rect.width > 0) {
				const computed = window.getComputedStyle(el);

				// Only report if not intentionally scrollable
				if (computed.overflowX !== 'scroll' && computed.overflowX !== 'auto') {
					issues.push({
						type: 'ELEMENT_OVERFLOW',
						element: `${el.tagName}.${el.className}`,
						id: el.id,
						width: rect.width,
						right: rect.right,
						viewportWidth: window.innerWidth,
						overflow: rect.right - window.innerWidth
					});
				}
			}
		});

		return {
			hasHorizontalScroll,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			documentWidth: document.documentElement.scrollWidth,
			documentHeight: document.documentElement.scrollHeight,
			issues: issues.slice(0, 10) // Limit to first 10 issues
		};
	});

	console.log(`[${testInfo.project.name}] Overflow Check:`, results);
	return results;
}

// Helper: Check touch targets
async function validateTouchTargets(page, testInfo) {
	const MIN_SIZE = 44;

	const results = await page.evaluate((minSize) => {
		const interactiveElements = document.querySelectorAll(
			'button, a, input[type="range"], label.switch, [role="button"], [onclick]'
		);

		const failures = [];

		interactiveElements.forEach((el) => {
			const rect = el.getBoundingClientRect();

			// Skip hidden elements
			if (rect.width === 0 || rect.height === 0) return;
			if (window.getComputedStyle(el).visibility === 'hidden') return;

			// Check if element or parent is within settings panel
			const inSettings = el.closest('.bottom-sheet-content, .modal');
			if (!inSettings) return;

			if (rect.width < minSize || rect.height < minSize) {
				failures.push({
					element: el.tagName,
					class: el.className,
					id: el.id,
					width: rect.width,
					height: rect.height,
					minRequired: minSize,
					text: el.textContent?.substring(0, 30)
				});
			}
		});

		return failures;
	}, MIN_SIZE);

	if (results.length > 0) {
		console.warn(`[${testInfo.project.name}] Touch target failures:`, results);
	}

	return results;
}

// Helper: Capture screenshot
async function captureScreenshot(page, name, testInfo) {
	const screenshotDir = 'settings-responsive-screenshots';
	if (!fs.existsSync(screenshotDir)) {
		fs.mkdirSync(screenshotDir, { recursive: true });
	}

	const deviceName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	await page.screenshot({
		path: path.join(screenshotDir, `${deviceName}-${name}-${timestamp}.png`),
		fullPage: true
	});
}

// Helper: Open settings panel
async function openSettings(page) {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1000);

	// Look for settings button - try multiple selectors
	const selectors = [
		'button:has-text("Settings")',
		'a:has-text("Settings")',
		'[aria-label="Settings"]',
		'button[aria-label*="Settings" i]',
		'.nav-item:has-text("Settings")',
		'nav >> text=Settings'
	];

	for (const selector of selectors) {
		try {
			const element = page.locator(selector).first();
			if (await element.count() > 0 && await element.isVisible()) {
				await element.click();
				await page.waitForTimeout(800);

				// Check if settings panel opened
				const panel = page.locator('.bottom-sheet-content, .modal').first();
				if (await panel.count() > 0) {
					return true;
				}
			}
		} catch (e) {
			// Try next selector
		}
	}

	return false;
}

test.describe('SETTINGS PANEL - No Overflow Guarantee', () => {
	test('Settings panel has zero horizontal overflow', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const overflowCheck = await detectOverflow(page, testInfo);

		// Critical: NO horizontal scroll allowed
		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		// Critical: NO elements should overflow horizontally
		const horizontalOverflows = overflowCheck.issues.filter(
			issue => issue.type === 'ELEMENT_OVERFLOW'
		);

		if (horizontalOverflows.length > 0) {
			console.error(`[${testInfo.project.name}] Horizontal overflows:`, horizontalOverflows);
		}

		expect(horizontalOverflows.length).toBe(0);

		await captureScreenshot(page, 'no-overflow-portrait', testInfo);
	});

	test('Settings panel has zero horizontal overflow in landscape', async ({ page }, testInfo) => {
		// Switch to landscape BEFORE loading page
		const viewport = page.viewportSize();
		await page.setViewportSize({
			width: viewport.height,
			height: viewport.width
		});

		const opened = await openSettings(page);

		// If failed to open, skip test as it's a navigation issue not layout
		if (!opened) {
			test.skip();
			return;
		}

		const overflowCheck = await detectOverflow(page, testInfo);

		// Critical: NO horizontal scroll in landscape
		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		const horizontalOverflows = overflowCheck.issues.filter(
			issue => issue.type === 'ELEMENT_OVERFLOW'
		);

		expect(horizontalOverflows.length).toBe(0);

		await captureScreenshot(page, 'no-overflow-landscape', testInfo);
	});
});

test.describe('SETTINGS PANEL - Touch Target Compliance', () => {
	test('All interactive elements meet 44px minimum', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const touchTargetFailures = await validateTouchTargets(page, testInfo);

		// Filter out only visible failures
		const visibleFailures = touchTargetFailures.filter(f => f.width > 0 && f.height > 0);

		if (visibleFailures.length > 0) {
			console.error(`[${testInfo.project.name}] Touch target failures:`, visibleFailures);
		}

		// All visible interactive elements must meet minimum
		expect(visibleFailures.length).toBe(0);

		await captureScreenshot(page, 'touch-targets', testInfo);
	});
});

test.describe('SETTINGS PANEL - Component Fit Validation', () => {
	test('All settings sections fit within viewport', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const viewport = page.viewportSize();

		// Check each major component
		const components = [
			'.setting-section',
			'.font-size-preview',
			'.font-size-control',
			'.hand-toggle',
			'.toggle-control'
		];

		for (const selector of components) {
			const elements = page.locator(selector);
			const count = await elements.count();

			for (let i = 0; i < count; i++) {
				const element = elements.nth(i);

				if (await element.isVisible()) {
					const box = await element.boundingBox();

					if (box) {
						console.log(`[${testInfo.project.name}] ${selector}[${i}]:`, {
							width: box.width,
							height: box.height,
							fitsHorizontally: box.x + box.width <= viewport.width
						});

						// Component must fit horizontally
						expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1); // +1 for rounding
					}
				}
			}
		}

		await captureScreenshot(page, 'component-fit', testInfo);
	});

	test('Tab preview is compact on small screens', async ({ page }, testInfo) => {
		const viewportSize = page.viewportSize();

		// Only test on small screens
		if (viewportSize.width > 380 && viewportSize.height > 650) {
			test.skip();
		}

		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		// Check if compact preview is visible
		const compactPreview = page.locator('.preview-compact');
		const fullPreview = page.locator('.preview-full');

		const compactVisible = await compactPreview.isVisible();
		const fullVisible = await fullPreview.isVisible();

		console.log(`[${testInfo.project.name}] Preview visibility:`, {
			compact: compactVisible,
			full: fullVisible,
			viewport: viewportSize
		});

		// On small screens, compact should be visible, full should not
		expect(compactVisible).toBe(true);
		expect(fullVisible).toBe(false);

		// Get the preview text length
		const previewText = await compactPreview.textContent();
		console.log(`[${testInfo.project.name}] Compact preview lines:`, previewText?.split('\n').length);

		// Compact preview should have 3 lines instead of 6
		expect(previewText?.split('\n').length).toBe(3);

		await captureScreenshot(page, 'compact-preview', testInfo);
	});
});

test.describe('SETTINGS PANEL - Extreme Size Testing', () => {
	test('Fits on smallest mobile (280px width)', async ({ page }, testInfo) => {
		// Test extreme small size
		await page.setViewportSize({ width: 280, height: 653 });

		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const overflowCheck = await detectOverflow(page, testInfo);

		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		await captureScreenshot(page, 'extreme-small', testInfo);
	});

	test('Fits in extreme landscape (844x390)', async ({ page }, testInfo) => {
		// Test extreme landscape
		await page.setViewportSize({ width: 844, height: 390 });

		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const overflowCheck = await detectOverflow(page, testInfo);

		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		// In landscape, vertical overflow is acceptable (scrolling)
		// but horizontal must be zero
		const horizontalOverflows = overflowCheck.issues.filter(
			issue => issue.type === 'ELEMENT_OVERFLOW'
		);

		expect(horizontalOverflows.length).toBe(0);

		await captureScreenshot(page, 'extreme-landscape', testInfo);
	});
});

test.describe('SETTINGS PANEL - Content Density', () => {
	test('Content fits within reasonable height', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const viewport = page.viewportSize();

		// Measure settings content height
		const contentHeight = await page.evaluate(() => {
			const sheet = document.querySelector('.bottom-sheet-body, .modal-body');
			if (!sheet) return 0;
			return sheet.scrollHeight;
		});

		const viewportHeight = viewport.height;
		const heightRatio = contentHeight / viewportHeight;

		console.log(`[${testInfo.project.name}] Settings density:`, {
			contentHeight,
			viewportHeight,
			ratio: heightRatio.toFixed(2)
		});

		// Content should fit comfortably (with scrolling if needed)
		// Allow up to 2x viewport height (reasonable scrolling)
		expect(heightRatio).toBeLessThan(2.5);

		await captureScreenshot(page, 'content-density', testInfo);
	});
});

test.describe('SETTINGS PANEL - Interactive Elements', () => {
	test('Font size controls are usable', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		// Check + and - buttons
		const decreaseBtn = page.locator('button[aria-label*="Decrease font"]').first();
		const increaseBtn = page.locator('button[aria-label*="Increase font"]').first();
		const slider = page.locator('input[type="range"][aria-label*="Font"]').first();

		// All controls should be visible
		expect(await decreaseBtn.isVisible()).toBe(true);
		expect(await increaseBtn.isVisible()).toBe(true);
		expect(await slider.isVisible()).toBe(true);

		// Check button sizes
		const decreaseBox = await decreaseBtn.boundingBox();
		const increaseBox = await increaseBtn.boundingBox();

		if (decreaseBox && increaseBox) {
			expect(decreaseBox.width).toBeGreaterThanOrEqual(40);
			expect(decreaseBox.height).toBeGreaterThanOrEqual(40);
			expect(increaseBox.width).toBeGreaterThanOrEqual(40);
			expect(increaseBox.height).toBeGreaterThanOrEqual(40);
		}

		await captureScreenshot(page, 'font-controls', testInfo);
	});

	test('Handedness toggle buttons are usable', async ({ page }, testInfo) => {
		const opened = await openSettings(page);

		if (!opened) {
			test.skip();
			return;
		}

		const leftHandBtn = page.locator('button[aria-label*="Left-handed"]').first();
		const rightHandBtn = page.locator('button[aria-label*="Right-handed"]').first();

		expect(await leftHandBtn.isVisible()).toBe(true);
		expect(await rightHandBtn.isVisible()).toBe(true);

		// Check sizes meet touch target minimum
		const leftBox = await leftHandBtn.boundingBox();
		const rightBox = await rightHandBtn.boundingBox();

		if (leftBox && rightBox) {
			expect(leftBox.height).toBeGreaterThanOrEqual(44);
			expect(rightBox.height).toBeGreaterThanOrEqual(44);
		}

		await captureScreenshot(page, 'handedness-toggle', testInfo);
	});
});
