/**
 * GUITAR TUNER MOBILE AUDIT - Enhanced Testing
 * Deep dive testing of the Guitar Tuner component on mobile devices
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper: Capture screenshot
async function captureScreenshot(page, name, testInfo) {
  const screenshotDir = 'tuner-audit-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const deviceName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
  await page.screenshot({
    path: path.join(screenshotDir, `${deviceName}-${name}.png`),
    fullPage: true
  });
}

// Helper: Check element fits in viewport
async function checkElementFits(page, selector, description) {
  const element = page.locator(selector).first();
  if (await element.count() === 0) {
    return { found: false, description };
  }

  const box = await element.boundingBox();
  if (!box) {
    return { found: false, description };
  }

  const viewport = page.viewportSize();

  return {
    found: true,
    description,
    fitsHorizontally: box.x + box.width <= viewport.width,
    fitsVertically: box.y + box.height <= viewport.height,
    width: box.width,
    height: box.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    overflowX: Math.max(0, (box.x + box.width) - viewport.width),
    overflowY: Math.max(0, (box.y + box.height) - viewport.height)
  };
}

// Helper: Check touch targets
async function checkTouchTarget(page, selector, minSize = 44) {
  const elements = page.locator(selector);
  const count = await elements.count();
  const results = [];

  for (let i = 0; i < count; i++) {
    const box = await elements.nth(i).boundingBox();
    if (box) {
      results.push({
        index: i,
        width: box.width,
        height: box.height,
        meetsMinimum: box.width >= minSize && box.height >= minSize
      });
    }
  }

  return results;
}

test.describe('GUITAR TUNER - Mobile Viewport Fit', () => {
  test('Tuner opens and fits within mobile viewport', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open settings to access tuner
    const settingsButton = page.locator('button:has-text("Settings"), button[aria-label*="Settings"]').first();
    if (await settingsButton.count() === 0) {
      // Alternative: navigate directly to tuner page if it exists
      await page.goto('/tuner');
      await page.waitForLoadState('networkidle');
    } else {
      // Click tuner button in header
      const tunerButton = page.locator('button:has-text("Tuner"), a[href="/tuner"]').first();
      if (await tunerButton.count() > 0) {
        await tunerButton.click();
        await page.waitForTimeout(500);
      }
    }

    await captureScreenshot(page, 'tuner-opened', testInfo);

    // Check if tuner content exists
    const tunerContent = page.locator('.tuner-content, .tuning-meter').first();
    expect(await tunerContent.count()).toBeGreaterThan(0);

    // Check viewport dimensions
    const viewport = page.viewportSize();
    console.log(`[${testInfo.project.name}] Viewport: ${viewport.width}x${viewport.height}`);

    // Verify no horizontal scroll
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(horizontalScroll).toBe(false);
  });

  test('Tuning selector fits and is accessible', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const selectorContainer = await checkElementFits(page, '.tuning-selector-container', 'Tuning Selector');
    console.log(`[${testInfo.project.name}] Tuning Selector:`, selectorContainer);

    if (selectorContainer.found) {
      expect(selectorContainer.fitsHorizontally).toBe(true);
      expect(selectorContainer.overflowX).toBe(0);
    }

    // Check select dropdown
    const select = page.locator('#tuning-select, select').first();
    if (await select.count() > 0) {
      const box = await select.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44); // Touch target minimum
      }
    }

    await captureScreenshot(page, 'tuning-selector', testInfo);
  });
});

test.describe('GUITAR TUNER - Component Sizing', () => {
  test('TuningMeter fits within sheet', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const tuningMeter = await checkElementFits(page, '.tuning-meter', 'Tuning Meter');
    console.log(`[${testInfo.project.name}] Tuning Meter:`, tuningMeter);

    if (tuningMeter.found) {
      expect(tuningMeter.fitsHorizontally).toBe(true);

      // Check if meter is too tall (should fit comfortably with scrolling if needed)
      const viewport = page.viewportSize();
      console.log(`[${testInfo.project.name}] Meter height: ${tuningMeter.height}px, Viewport: ${viewport.height}px`);
    }

    await captureScreenshot(page, 'tuning-meter-size', testInfo);
  });

  test('Note info display is readable', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const noteInfo = await checkElementFits(page, '.note-info', 'Note Info Display');
    console.log(`[${testInfo.project.name}] Note Info:`, noteInfo);

    // Check note name font size
    const noteName = page.locator('.note-name').first();
    if (await noteName.count() > 0) {
      const fontSize = await noteName.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      console.log(`[${testInfo.project.name}] Note name font size: ${fontSize}`);
    }

    await captureScreenshot(page, 'note-display', testInfo);
  });

  test('Meter display segments are visible', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const segmentsContainer = await checkElementFits(page, '.segments-container', 'Segments Container');
    console.log(`[${testInfo.project.name}] Segments:`, segmentsContainer);

    if (segmentsContainer.found) {
      expect(segmentsContainer.fitsHorizontally).toBe(true);

      // Check segment height is adequate
      expect(segmentsContainer.height).toBeGreaterThanOrEqual(12);
    }

    await captureScreenshot(page, 'meter-segments', testInfo);
  });
});

test.describe('GUITAR TUNER - String Buttons', () => {
  test('String buttons meet touch target minimums', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const stringButtons = await checkTouchTarget(page, '.string-button', 44);
    console.log(`[${testInfo.project.name}] String buttons:`, stringButtons);

    // Check all buttons
    for (const button of stringButtons) {
      if (!button.meetsMinimum) {
        console.warn(`[${testInfo.project.name}] Button ${button.index} too small: ${button.width}x${button.height}px`);
      }
      expect(button.meetsMinimum).toBe(true);
    }

    await captureScreenshot(page, 'string-buttons', testInfo);
  });

  test('String buttons container fits horizontally', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const buttonsContainer = await checkElementFits(page, '.string-buttons', 'String Buttons Container');
    console.log(`[${testInfo.project.name}] Buttons container:`, buttonsContainer);

    if (buttonsContainer.found) {
      expect(buttonsContainer.fitsHorizontally).toBe(true);
    }

    await captureScreenshot(page, 'buttons-layout', testInfo);
  });
});

test.describe('GUITAR TUNER - Layout Density', () => {
  test('All components fit within visible area', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const viewport = page.viewportSize();

    // Get all major component heights
    const components = [
      '.tuning-selector-container',
      '.note-info',
      '.meter-display',
      '.string-buttons'
    ];

    let totalHeight = 0;
    for (const selector of components) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const box = await element.boundingBox();
        if (box) {
          totalHeight += box.height;
          console.log(`[${testInfo.project.name}] ${selector}: ${box.height}px`);
        }
      }
    }

    console.log(`[${testInfo.project.name}] Total content height: ${totalHeight}px, Viewport: ${viewport.height}px`);

    // Content should ideally fit or require minimal scrolling
    const heightRatio = totalHeight / viewport.height;
    console.log(`[${testInfo.project.name}] Height ratio: ${heightRatio.toFixed(2)}`);

    await captureScreenshot(page, 'layout-density', testInfo);
  });

  test('Spacing and padding are appropriate for mobile', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check padding on main container
    const tunerContent = page.locator('.tuner-content').first();
    if (await tunerContent.count() > 0) {
      const padding = await tunerContent.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          top: style.paddingTop,
          bottom: style.paddingBottom,
          left: style.paddingLeft,
          right: style.paddingRight
        };
      });
      console.log(`[${testInfo.project.name}] Tuner content padding:`, padding);
    }

    await captureScreenshot(page, 'spacing-analysis', testInfo);
  });
});

test.describe('GUITAR TUNER - Landscape Mode', () => {
  test('Tuner adapts to landscape orientation', async ({ page }, testInfo) => {
    // Switch to landscape
    const viewport = page.viewportSize();
    await page.setViewportSize({
      width: viewport.height,
      height: viewport.width
    });

    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check horizontal fit
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(horizontalScroll).toBe(false);

    // Check if content fits better in landscape
    const tuningMeter = await checkElementFits(page, '.tuning-meter', 'Tuning Meter (Landscape)');
    console.log(`[${testInfo.project.name}] Landscape - Tuning Meter:`, tuningMeter);

    await captureScreenshot(page, 'tuner-landscape', testInfo);
  });
});

test.describe('GUITAR TUNER - Interactive Elements', () => {
  test('All interactive elements are tappable', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Test tuning selector
    const select = page.locator('#tuning-select, select').first();
    if (await select.count() > 0) {
      await select.click();
      await page.waitForTimeout(200);
      await select.press('Escape'); // Close dropdown
    }

    // Test string buttons
    const firstButton = page.locator('.string-button').first();
    if (await firstButton.count() > 0) {
      await firstButton.click();
      await page.waitForTimeout(200);
    }

    await captureScreenshot(page, 'interactive-test', testInfo);
  });
});
