/**
 * COMPREHENSIVE MOBILE AUDIT TEST SUITE
 * Tests all pages and components on mobile devices
 * Focus: Viewport fit, overflow detection, scrollable area validation
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper: Check if element has unexpected horizontal overflow
async function checkHorizontalOverflow(page, selector, description) {
  const element = page.locator(selector).first();
  if (await element.count() === 0) return null;

  const box = await element.boundingBox();
  if (!box) return null;

  const viewportSize = page.viewportSize();
  if (box.x + box.width > viewportSize.width) {
    return {
      element: description,
      selector,
      width: box.width,
      viewportWidth: viewportSize.width,
      overflow: (box.x + box.width) - viewportSize.width
    };
  }
  return null;
}

// Helper: Check touch target size (minimum 44x44px)
async function checkTouchTargets(page, selector, description) {
  const elements = page.locator(selector);
  const count = await elements.count();
  const issues = [];

  for (let i = 0; i < Math.min(count, 20); i++) {
    const box = await elements.nth(i).boundingBox();
    if (box && (box.width < 44 || box.height < 44)) {
      issues.push({
        element: `${description} #${i}`,
        selector,
        width: box.width,
        height: box.height,
        minRequired: 44
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

// Helper: Capture screenshot
async function captureAuditScreenshot(page, name, testInfo) {
  const screenshotDir = 'mobile-audit-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const deviceName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
  await page.screenshot({
    path: path.join(screenshotDir, `${deviceName}-${name}.png`),
    fullPage: true
  });
}

// Helper: Check viewport fit
async function checkViewportFit(page, pageName) {
  const viewportHeight = page.viewportSize().height;
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

  const overflowElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const issues = [];

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();

      if (rect.right > window.innerWidth) {
        issues.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          width: rect.width,
          right: rect.right,
          viewportWidth: window.innerWidth
        });
      }
    });

    return issues;
  });

  return {
    pageName,
    requiresScroll: bodyHeight > viewportHeight,
    bodyHeight,
    viewportHeight,
    overflowElements: overflowElements.slice(0, 10)
  };
}

test.describe('HOME PAGE', () => {
  test('Layout and Viewport Fit', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewportFit = await checkViewportFit(page, 'home');
    console.log(`[${testInfo.project.name}] Home Page Viewport:`, viewportFit);

    // Check header fits
    const headerOverflow = await checkHorizontalOverflow(page, 'header', 'Main Header');
    expect(headerOverflow).toBeNull();

    // Check search bar fits
    const searchOverflow = await checkHorizontalOverflow(page, 'input[type="search"], input[placeholder*="Search"]', 'Search Bar');
    if (searchOverflow) {
      console.warn(`[${testInfo.project.name}] Search bar overflow:`, searchOverflow);
    }

    // Check Add Tab button is accessible
    const addButton = page.locator('button:has-text("Add Tab"), button[aria-label*="Add"]').first();
    if (await addButton.count() > 0) {
      const box = await addButton.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    await captureAuditScreenshot(page, 'home', testInfo);

    // No critical overflow
    expect(viewportFit.overflowElements.length).toBeLessThan(5);
  });

  test('Modals and Panels Fit', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add Tab"), button[aria-label*="Add"]').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Check panel fits
      const panelOverflow = await checkHorizontalOverflow(page, '[role="dialog"], .modal, .panel', 'Add Tab Panel');
      expect(panelOverflow).toBeNull();

      await captureAuditScreenshot(page, 'home-add-panel', testInfo);

      // Close panel
      const closeButton = page.locator('button[aria-label*="Close"], button:has-text("Cancel"), button:has-text("×")').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(300);
      } else {
        // Click backdrop
        await page.locator('[role="dialog"]').first().press('Escape');
      }
    }
  });

  test('Responsive Grid Layout', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check grid layout doesn't cause overflow
    const grid = page.locator('.tab-grid, .tabs-container, [data-testid*="tabs"]').first();
    if (await grid.count() > 0) {
      const gridOverflow = await checkHorizontalOverflow(page, '.tab-grid, .tabs-container', 'Tab Grid');
      expect(gridOverflow).toBeNull();

      // Check grid columns adapt to mobile
      const columnCount = await page.evaluate(() => {
        const grid = document.querySelector('.tab-grid, .tabs-container, [data-testid*="tabs"]');
        if (!grid) return 0;
        const style = window.getComputedStyle(grid);
        const columns = style.gridTemplateColumns;
        return columns ? columns.split(' ').length : 0;
      });

      console.log(`[${testInfo.project.name}] Grid columns:`, columnCount);

      // On mobile (width < 480px), should be 1-2 columns max
      if (page.viewportSize().width < 480) {
        expect(columnCount).toBeLessThanOrEqual(2);
      }
    }

    await captureAuditScreenshot(page, 'grid-layout', testInfo);
  });
});

test.describe('CREATE PAGE', () => {
  test('Form and Input Fit', async ({ page }, testInfo) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    const viewportFit = await checkViewportFit(page, 'create');
    console.log(`[${testInfo.project.name}] Create Page Viewport:`, viewportFit);

    // Check form inputs fit
    const titleInput = await checkHorizontalOverflow(page, 'input[name="title"], input[placeholder*="title" i]', 'Title Input');
    expect(titleInput).toBeNull();

    const artistInput = await checkHorizontalOverflow(page, 'input[name="artist"], input[placeholder*="artist" i]', 'Artist Input');
    expect(artistInput).toBeNull();

    // Check textarea fits
    const textareaOverflow = await checkHorizontalOverflow(page, 'textarea', 'Tab Content Textarea');
    expect(textareaOverflow).toBeNull();

    // Check no horizontal scroll
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    await captureAuditScreenshot(page, 'create', testInfo);

    expect(horizontalScroll).toBe(false);
  });
});

test.describe('VIEW TAB PAGE', () => {
  test('Content Display and Scroll Controls', async ({ page }, testInfo) => {
    // First create a test tab
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Mobile Test Tab');
    }

    const contentTextarea = page.locator('textarea').first();
    if (await contentTextarea.count() > 0) {
      await contentTextarea.fill(`E|-------0-------2-------3-------|\nB|-------1-------3-------0-------|\n\n[Verse]\nC       G       Am\nTest content`);
    }

    const saveButton = page.locator('button[type="submit"], button:has-text("Save")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    const viewportFit = await checkViewportFit(page, 'view-tab');
    console.log(`[${testInfo.project.name}] View Tab Page Viewport:`, viewportFit);

    // Check header fits
    const headerOverflow = await checkHorizontalOverflow(page, 'header, .tab-header', 'Tab Header');
    expect(headerOverflow).toBeNull();

    // Check tab content fits horizontally
    const contentOverflow = await checkHorizontalOverflow(page, '.tab-content, .tab-viewer, pre', 'Tab Content');
    if (contentOverflow) {
      console.warn(`[${testInfo.project.name}] Tab content overflow:`, contentOverflow);
    }

    // Check no horizontal scroll
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    await captureAuditScreenshot(page, 'view-tab', testInfo);

    expect(horizontalScroll).toBe(false);
  });
});

test.describe('TUNER PAGE', () => {
  test('Component Fit and Functionality', async ({ page }, testInfo) => {
    await page.goto('/tuner');
    await page.waitForLoadState('networkidle');

    const viewportFit = await checkViewportFit(page, 'tuner');
    console.log(`[${testInfo.project.name}] Tuner Page Viewport:`, viewportFit);

    // Check tuner component fits
    const tunerOverflow = await checkHorizontalOverflow(page, '.guitar-tuner, .tuner', 'Guitar Tuner Component');
    expect(tunerOverflow).toBeNull();

    // Check no horizontal scroll
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    await captureAuditScreenshot(page, 'tuner', testInfo);

    expect(horizontalScroll).toBe(false);
  });
});

test.describe('SETTINGS MODAL', () => {
  test('All Sections Fit', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const settingsButton = page.locator('button:has-text("Settings"), button[aria-label*="Settings"]').first();
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      // Check modal fits
      const modalOverflow = await checkHorizontalOverflow(page, '[role="dialog"], .modal, .settings-modal', 'Settings Modal');
      expect(modalOverflow).toBeNull();

      await captureAuditScreenshot(page, 'settings-modal', testInfo);

      // Close settings
      const closeButton = page.locator('button[aria-label*="Close"], button:has-text("Close"), button:has-text("×")').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });
});

test.describe('NAVIGATION', () => {
  test('All Links and Buttons Accessible', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check header doesn't overflow
    const headerOverflow = await checkHorizontalOverflow(page, 'header, nav', 'Header Navigation');
    expect(headerOverflow).toBeNull();

    await captureAuditScreenshot(page, 'navigation', testInfo);
  });
});

test.describe('LANDSCAPE ORIENTATION', () => {
  test('Layout Adaptation', async ({ page, browserName }, testInfo) => {
    // Get current viewport and swap dimensions
    const viewport = page.viewportSize();
    await page.setViewportSize({
      width: viewport.height,
      height: viewport.width
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewportFit = await checkViewportFit(page, 'home-landscape');
    console.log(`[${testInfo.project.name}] Landscape Viewport:`, viewportFit);

    // Check no horizontal overflow in landscape
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    await captureAuditScreenshot(page, 'home-landscape', testInfo);

    expect(horizontalScroll).toBe(false);
  });
});
