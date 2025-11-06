# Testing Guide

## Overview

This project uses comprehensive automated testing to ensure quality, especially for responsive design and mobile compatibility.

## Test Suites

### 1. Responsive Validation Tests

**Location**: `tests/tuner-responsive-validation.spec.js`

Comprehensive tests ensuring perfect fit on all devices:

```bash
# Run responsive validation tests
npx playwright test tuner-responsive-validation.spec.js

# Run on specific device
npx playwright test tuner-responsive-validation.spec.js --project="iPhone SE"

# Run all devices
npx playwright test tuner-responsive-validation.spec.js --reporter=list
```

**What it tests:**
- ✅ Zero horizontal overflow on all devices
- ✅ Zero horizontal overflow in landscape mode
- ✅ All touch targets meet 44px minimum
- ✅ Components fit within viewport
- ✅ Extreme sizes (280px width, various landscape)
- ✅ Layout density ratios

### 2. Mobile Audit Tests

**Location**: `tests/mobile-audit.spec.js`

Tests all pages for mobile compatibility:

```bash
npx playwright test mobile-audit.spec.js
```

### 3. Guitar Tuner Mobile Audit

**Location**: `tests/tuner-mobile-audit.spec.js`

Specific deep-dive tests for the guitar tuner component:

```bash
npx playwright test tuner-mobile-audit.spec.js
```

## Device Profiles

Tests run on these device profiles (configured in `playwright.config.js`):

- **iPhone SE** - 320x568px (smallest modern device)
- **iPhone 13** - 390x664px (common mid-size)
- **Pixel 5** - 393x727px (Android reference)
- **Galaxy S9+** - 320x658px (narrow Android)

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all test suites
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/tuner-responsive-validation.spec.js
```

### Run with Reporter

```bash
# List format (concise)
npx playwright test --reporter=list

# HTML report
npx playwright test --reporter=html

# Open report
npx playwright show-report
```

### Debug Tests

```bash
# Debug mode
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test -g "zero horizontal overflow"
```

## Test Development

### Writing New Responsive Tests

Use this template:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Your Component - Responsive Tests', () => {
  test('has zero horizontal overflow', async ({ page }, testInfo) => {
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');

    const overflowCheck = await page.evaluate(() => ({
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));

    console.log(`[${testInfo.project.name}]`, overflowCheck);
    expect(overflowCheck.hasHorizontalScroll).toBe(false);
  });

  test('meets touch target requirements', async ({ page }, testInfo) => {
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');

    const touchTargets = await page.evaluate(() => {
      const MIN_SIZE = 44;
      const interactive = document.querySelectorAll('button, a, input, select');
      const failures = [];

      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
            failures.push({
              element: el.tagName,
              width: rect.width,
              height: rect.height
            });
          }
        }
      });

      return failures;
    });

    expect(touchTargets.length).toBe(0);
  });
});
```

### Best Practices

1. **Always wait for load state**
   ```javascript
   await page.waitForLoadState('networkidle');
   ```

2. **Add small delays for animations**
   ```javascript
   await page.waitForTimeout(500);
   ```

3. **Log important metrics**
   ```javascript
   console.log(`[${testInfo.project.name}]`, metrics);
   ```

4. **Take screenshots on failure**
   - Screenshots are automatically captured on failure
   - Found in `test-results/` directory

5. **Test both orientations**
   ```javascript
   // Portrait test
   test('fits in portrait', async ({ page }) => {
     // ... normal test
   });

   // Landscape test
   test('fits in landscape', async ({ page }) => {
     const viewport = page.viewportSize();
     await page.setViewportSize({
       width: viewport.height,
       height: viewport.width
     });
     // ... landscape test
   });
   ```

## Helper Functions

### Overflow Detection

```javascript
async function detectOverflow(page, testInfo) {
  const results = await page.evaluate(() => {
    const issues = [];
    const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

    if (hasHorizontalScroll) {
      issues.push({
        type: 'HORIZONTAL_SCROLL',
        overflow: document.documentElement.scrollWidth - window.innerWidth
      });
    }

    // Check all elements
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        issues.push({
          type: 'ELEMENT_OVERFLOW',
          element: `${el.tagName}.${el.className}`,
          overflow: rect.right - window.innerWidth
        });
      }
    });

    return {
      hasHorizontalScroll,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      issues: issues.slice(0, 10)
    };
  });

  console.log(`[${testInfo.project.name}] Overflow Check:`, results);
  return results;
}
```

### Touch Target Validation

```javascript
async function validateTouchTargets(page) {
  return await page.evaluate(() => {
    const MIN_SIZE = 44;
    const interactive = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick]'
    );
    const failures = [];

    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
          failures.push({
            element: el.tagName,
            class: el.className,
            width: rect.width,
            height: rect.height
          });
        }
      }
    });

    return failures;
  });
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Mobile Responsive Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tuner-responsive-validation.spec.js
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Continuous Monitoring

### Screenshots

All tests capture screenshots in:
- `responsive-validation-screenshots/` - Comprehensive validation
- `tuner-audit-screenshots/` - Tuner-specific tests
- `mobile-audit-screenshots/` - General mobile tests

### Reports

HTML reports are generated in `mobile-audit-report/`:

```bash
npx playwright show-report mobile-audit-report
```

## Troubleshooting

### Tests Failing?

1. **Check viewport sizes**
   ```javascript
   console.log('Viewport:', page.viewportSize());
   ```

2. **Verify element visibility**
   ```javascript
   const visible = await element.isVisible();
   console.log('Element visible:', visible);
   ```

3. **Inspect bounding boxes**
   ```javascript
   const box = await element.boundingBox();
   console.log('Box:', box);
   ```

4. **Take debug screenshots**
   ```javascript
   await page.screenshot({ path: 'debug.png', fullPage: true });
   ```

### Common Issues

**Issue**: "Element not found"
- Add `await page.waitForLoadState('networkidle')`
- Increase timeout: `await page.waitForTimeout(1000)`

**Issue**: "Horizontal scroll detected"
- Check for fixed widths > viewport
- Verify `box-sizing: border-box`
- Check for missing `max-width: 100%`

**Issue**: "Touch target too small"
- Verify `min-height: 44px`
- Check padding is included in dimensions
- Ensure element is actually visible

## References

- [Playwright Documentation](https://playwright.dev)
- [Responsive Design Paradigm](./RESPONSIVE_DESIGN_PARADIGM.md)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/)
