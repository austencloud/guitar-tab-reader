/**
 * COMPREHENSIVE RESPONSIVE VALIDATION FOR GUITAR TUNER
 *
 * This test suite ensures that the guitar tuner component:
 * 1. Fits perfectly on ALL device sizes without overflow
 * 2. Maintains minimum touch targets (44x44px)
 * 3. Never causes horizontal scrollbars
 * 4. Adapts beautifully to both portrait and landscape orientations
 *
 * This paradigm should be applied to ALL components in the app.
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
		const hasVerticalScroll = document.documentElement.scrollHeight > window.innerHeight;

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
			hasVerticalScroll,
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

// Helper: Validate touch targets
async function validateTouchTargets(page, testInfo) {
	const MIN_SIZE = 44;

	const results = await page.evaluate((minSize) => {
		const interactiveElements = document.querySelectorAll(
			'button, a, input, select, textarea, [role="button"], [onclick]'
		);

		const failures = [];

		interactiveElements.forEach((el, index) => {
			const rect = el.getBoundingClientRect();

			// Skip hidden elements
			if (rect.width === 0 || rect.height === 0) return;

			if (rect.width < minSize || rect.height < minSize) {
				failures.push({
					element: el.tagName,
					class: el.className,
					id: el.id,
					width: rect.width,
					height: rect.height,
					minRequired: minSize,
					visible: window.getComputedStyle(el).visibility !== 'hidden'
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
	const screenshotDir = 'responsive-validation-screenshots';
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

test.describe('GUITAR TUNER - No Overflow Guarantee', () => {
	test('Tuner page has zero horizontal overflow', async ({ page }, testInfo) => {
		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const overflowCheck = await detectOverflow(page, testInfo);

		// Critical: NO horizontal scroll allowed
		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		// Critical: NO elements should overflow horizontally
		const horizontalOverflows = overflowCheck.issues.filter(
			issue => issue.type === 'ELEMENT_OVERFLOW'
		);

		if (horizontalOverflows.length > 0) {
			console.error(`[${testInfo.project.name}] Horizontal overflows detected:`, horizontalOverflows);
		}

		expect(horizontalOverflows.length).toBe(0);

		await captureScreenshot(page, 'no-overflow-portrait', testInfo);
	});

	test('Tuner page has zero horizontal overflow in landscape', async ({ page }, testInfo) => {
		// Switch to landscape
		const viewport = page.viewportSize();
		await page.setViewportSize({
			width: viewport.height,
			height: viewport.width
		});

		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

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

test.describe('GUITAR TUNER - Touch Target Compliance', () => {
	test('All interactive elements meet 44px minimum', async ({ page }, testInfo) => {
		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const touchTargetFailures = await validateTouchTargets(page, testInfo);

		// Filter out only visible failures
		const visibleFailures = touchTargetFailures.filter(f => f.visible);

		if (visibleFailures.length > 0) {
			console.error(`[${testInfo.project.name}] Touch target failures:`, visibleFailures);
		}

		// All visible interactive elements must meet minimum
		expect(visibleFailures.length).toBe(0);

		await captureScreenshot(page, 'touch-targets', testInfo);
	});
});

test.describe('GUITAR TUNER - Component Fit Validation', () => {
	test('All tuner components fit within viewport', async ({ page }, testInfo) => {
		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const viewport = page.viewportSize();

		// Check each major component
		const components = [
			'.tuning-selector',
			'.tuning-meter',
			'.note-info',
			'.meter-display',
			'.string-buttons'
		];

		for (const selector of components) {
			const element = page.locator(selector).first();

			if (await element.count() > 0) {
				const box = await element.boundingBox();

				if (box) {
					console.log(`[${testInfo.project.name}] ${selector}:`, {
						width: box.width,
						height: box.height,
						fitsHorizontally: box.x + box.width <= viewport.width,
						fitsVertically: box.y + box.height <= viewport.height
					});

					// Component must fit horizontally
					expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
				}
			}
		}

		await captureScreenshot(page, 'component-fit', testInfo);
	});
});

test.describe('GUITAR TUNER - Extreme Size Testing', () => {
	test('Fits on smallest mobile (280px width)', async ({ page }, testInfo) => {
		// Test extreme small size
		await page.setViewportSize({ width: 280, height: 653 });

		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const overflowCheck = await detectOverflow(page, testInfo);

		expect(overflowCheck.hasHorizontalScroll).toBe(false);

		await captureScreenshot(page, 'extreme-small', testInfo);
	});

	test('Fits in extreme landscape (844x390)', async ({ page }, testInfo) => {
		// Test extreme landscape (like iPhone 14 Pro Max landscape)
		await page.setViewportSize({ width: 844, height: 390 });

		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

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

test.describe('GUITAR TUNER - Visual Regression Check', () => {
	test('Layout matches expected density', async ({ page }, testInfo) => {
		await page.goto('/tuner');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const viewport = page.viewportSize();

		// Measure total content height
		const contentHeight = await page.evaluate(() => {
			const components = [
				'.tuning-selector',
				'.note-info',
				'.meter-display',
				'.string-buttons'
			];

			let totalHeight = 0;
			components.forEach(selector => {
				const el = document.querySelector(selector);
				if (el) {
					totalHeight += el.getBoundingClientRect().height;
				}
			});

			return totalHeight;
		});

		const heightRatio = contentHeight / viewport.height;

		console.log(`[${testInfo.project.name}] Layout density:`, {
			contentHeight,
			viewportHeight: viewport.height,
			ratio: heightRatio.toFixed(2)
		});

		// Content should fit comfortably (ratio < 1.0 ideal, < 1.5 acceptable with scroll)
		expect(heightRatio).toBeLessThan(1.5);

		await captureScreenshot(page, 'layout-density', testInfo);
	});
});
