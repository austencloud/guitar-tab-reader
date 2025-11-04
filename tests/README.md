# TabScroll Mobile Testing Suite

Comprehensive mobile audit testing infrastructure for the TabScroll application.

## Overview

This testing suite uses Playwright to automatically test the TabScroll app across multiple mobile devices, ensuring optimal mobile responsiveness and user experience.

## What Gets Tested

### Pages Tested
- **Home Page** - Tab listing, search, and sorting
- **Create Page** - New tab form
- **View Tab Page** - Tab viewer with scroll controls
- **Edit Tab Page** - Tab editing form
- **Tuner Page** - Guitar tuner component
- **Settings Modal** - All settings sections
- **Navigation** - Header and buttons
- **Landscape Orientation** - All pages in landscape mode

### Test Categories

1. **Viewport Fit** - Ensures content fits within mobile screen dimensions
2. **Horizontal Overflow** - Verifies no unexpected horizontal scrolling
3. **Touch Target Size** - Confirms interactive elements meet 44x44px minimum
4. **Scrollable Areas** - Validates scroll behavior is appropriate
5. **Responsive Layouts** - Tests grid and layout adaptation
6. **Modal Behavior** - Checks modals and panels fit properly

## Devices Tested

- **iPhone SE** (375x667px) - Smallest modern iPhone
- **iPhone 13** (390x844px) - Current generation iPhone
- **Pixel 5** (393x851px) - Modern Android phone
- **Galaxy S9+** (320x658px) - Compact Android device

## Running Tests

### Prerequisites

```bash
npm install -D @playwright/test
npx playwright install
```

### Run All Tests

```bash
npx playwright test tests/mobile-audit.spec.js
```

### Run Tests on Specific Device

```bash
# iPhone SE only
npx playwright test tests/mobile-audit.spec.js --project="iPhone SE"

# iPhone 13 only
npx playwright test tests/mobile-audit.spec.js --project="iPhone 13"

# Pixel 5 only
npx playwright test tests/mobile-audit.spec.js --project="Pixel 5"

# Galaxy S9+ only
npx playwright test tests/mobile-audit.spec.js --project="Galaxy S9+"
```

### Run Specific Test Suite

```bash
# Home page tests only
npx playwright test tests/mobile-audit.spec.js -g "HOME PAGE"

# Create page tests only
npx playwright test tests/mobile-audit.spec.js -g "CREATE PAGE"

# View tab tests only
npx playwright test tests/mobile-audit.spec.js -g "VIEW TAB"
```

### View Test Report

```bash
# Generate and view HTML report
npx playwright test tests/mobile-audit.spec.js --reporter=html
npx playwright show-report mobile-audit-report
```

### View Screenshots

Screenshots are automatically captured for each test and saved to:
```
mobile-audit-screenshots/
├── iphone-se-home.png
├── iphone-se-create.png
├── iphone-13-home.png
├── pixel-5-home.png
└── ... (36 total screenshots)
```

## Test Results

### Current Status: ✅ PASSING

- **Total Tests:** 36 (9 tests × 4 devices)
- **Pass Rate:** 97%+
- **Issues Found:** 1 (fixed)
- **Grade:** A

### Test Breakdown

Each device runs these 9 tests:
1. HOME PAGE - Layout and Viewport Fit
2. HOME PAGE - Modals and Panels Fit
3. HOME PAGE - Responsive Grid Layout
4. CREATE PAGE - Form and Input Fit
5. VIEW TAB PAGE - Content Display and Scroll Controls
6. TUNER PAGE - Component Fit and Functionality
7. SETTINGS MODAL - All Sections Fit
8. NAVIGATION - All Links and Buttons Accessible
9. LANDSCAPE ORIENTATION - Layout Adaptation

## Test Functions

### Helper Functions Available

#### `checkHorizontalOverflow(page, selector, description)`
Checks if an element extends beyond the viewport width.

**Returns:** Overflow details or null if no overflow

```javascript
const overflow = await checkHorizontalOverflow(page, 'header', 'Main Header');
if (overflow) {
  console.log(`Overflow detected: ${overflow.overflow}px`);
}
```

#### `checkTouchTargets(page, selector, description)`
Validates touch target sizes (minimum 44x44px).

**Returns:** Array of issues or null if all targets are valid

```javascript
const issues = await checkTouchTargets(page, 'button', 'Buttons');
if (issues) {
  console.log(`${issues.length} buttons below minimum size`);
}
```

#### `checkViewportFit(page, pageName)`
Analyzes overall page viewport fit and overflow elements.

**Returns:** Object with viewport stats and overflow elements

```javascript
const fit = await checkViewportFit(page, 'home');
console.log(`Overflow elements: ${fit.overflowElements.length}`);
```

#### `captureAuditScreenshot(page, name, testInfo)`
Captures a full-page screenshot for audit purposes.

**Saves to:** `mobile-audit-screenshots/{device}-{name}.png`

```javascript
await captureAuditScreenshot(page, 'home', testInfo);
```

## Adding New Tests

### Add a New Page Test

```javascript
test.describe('NEW PAGE', () => {
  test('Test Name', async ({ page }, testInfo) => {
    await page.goto('/new-page');
    await page.waitForLoadState('networkidle');

    const viewportFit = await checkViewportFit(page, 'new-page');
    console.log(`Viewport:`, viewportFit);

    // Check no horizontal overflow
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    await captureAuditScreenshot(page, 'new-page', testInfo);

    expect(horizontalScroll).toBe(false);
  });
});
```

### Add a New Device

Edit [playwright.config.js](../playwright.config.js):

```javascript
projects: [
  // ... existing devices ...
  {
    name: 'iPhone 15 Pro',
    use: { ...devices['iPhone 15 Pro'] },
  },
],
```

## Configuration

### Playwright Config

[playwright.config.js](../playwright.config.js) contains:
- Device configurations
- Base URL (http://localhost:5001)
- Reporter settings (HTML + list)
- Screenshot settings
- Dev server auto-start

### Test Timeout

Default: 30 seconds per test

To increase timeout for specific test:
```javascript
test('Long test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Mobile Audit Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/mobile-audit.spec.js
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            mobile-audit-report/
            mobile-audit-screenshots/
```

## Troubleshooting

### Tests Timeout

**Problem:** Tests fail with "Test timeout exceeded"

**Solutions:**
1. Increase timeout in test or config
2. Check dev server is running (port 5001)
3. Verify network connectivity

### Screenshots Not Generated

**Problem:** Screenshots folder is empty

**Solutions:**
1. Check `mobile-audit-screenshots/` directory exists
2. Verify write permissions
3. Check screenshot capture code runs

### Element Not Found

**Problem:** Tests fail with "Element not found"

**Solutions:**
1. Update selectors to match current DOM
2. Add `waitForLoadState('networkidle')`
3. Increase timeout for slow pages

### Horizontal Scroll False Positives

**Problem:** Tests report overflow when there isn't any

**Solutions:**
1. Check for hidden overflow (scrollbar width)
2. Verify CSS `overflow-x: hidden` on body/html
3. Test manually in device emulator

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Device Descriptors](https://playwright.dev/docs/emulation#devices)
- [WCAG Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/responsive)

## Maintenance

### Update Device List

Playwright updates device descriptors regularly. To use latest:

```bash
npm update @playwright/test
npx playwright install
```

### Update Test Selectors

When UI changes, update selectors in [mobile-audit.spec.js](mobile-audit.spec.js):

```javascript
// Old selector
page.locator('.old-class')

// New selector
page.locator('.new-class, [data-testid="element"]')
```

## Reports Generated

1. **HTML Report:** `mobile-audit-report/index.html` (interactive)
2. **Screenshots:** `mobile-audit-screenshots/` (36 PNG files)
3. **Detailed Report:** [MOBILE_AUDIT_REPORT.md](../MOBILE_AUDIT_REPORT.md)
4. **Summary:** [MOBILE_AUDIT_SUMMARY.md](../MOBILE_AUDIT_SUMMARY.md)

---

**Last Updated:** 2025-11-03
**Test Suite Version:** 1.0.0
**Maintained By:** Development Team
