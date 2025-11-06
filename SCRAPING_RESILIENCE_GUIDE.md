# Web Scraping Resilience Guide

## Current Status: ✅ You're Using Best Practices!

Your current implementation already follows many industry-recommended approaches:

1. ✅ **Semantic HTML targeting** - Using `a[href*="/tab/"]` instead of brittle CSS classes
2. ✅ **Multiple fallback strategies** - Trying specific selectors before broader ones
3. ✅ **Playwright for JS rendering** - Using a real browser engine
4. ✅ **Pattern-based extraction** - Looking for URL patterns that rarely change
5. ✅ **User agent spoofing** - Pretending to be a real Chrome browser

## Industry Best Practices for Handling Obfuscation

Based on research from ScrapingAnt, ZenRows, and web scraping communities:

### 1. **Target Stable Elements (You're Doing This!)**

**Bad (Brittle):**
```typescript
// CSS classes change frequently
const items = document.querySelectorAll('.dyhP1 .qNp1Q');
```

**Good (Resilient):**
```typescript
// URL patterns and semantic HTML are stable
const items = document.querySelectorAll('a[href*="/tab/"]');
```

**Why it works:** Websites can't change their URL structure without breaking functionality.

---

### 2. **Implement Fallback Chains (You're Doing This!)**

```typescript
// Try specific selector first
let tabLinks = document.querySelectorAll('article a[href*="/tab/"]');

// Fallback to broader selector
if (tabLinks.length === 0) {
  tabLinks = document.querySelectorAll('a[href*="/tab/"]');
}

// Could add more fallbacks
if (tabLinks.length === 0) {
  tabLinks = document.querySelectorAll('[data-tab-url], [href*="ultimate-guitar.com/tab"]');
}
```

---

### 3. **Use Playwright Stealth (New!)**

Install: `npm install playwright-extra playwright-extra-plugin-stealth`

**Why:** Ultimate Guitar can detect automation by checking:
- `navigator.webdriver === true` (Playwright sets this)
- Chrome DevTools Protocol (CDP) signatures
- Missing browser features that real browsers have

**Stealth mode** patches these telltale signs to make Playwright undetectable.

---

### 4. **Randomize Behavior to Appear Human**

**Bad:**
```typescript
await page.goto(url);
await page.waitForTimeout(3000); // Always 3 seconds
```

**Good:**
```typescript
const randomDelay = () => Math.floor(Math.random() * 1000) + 500; // 500-1500ms
await page.goto(url);
await page.waitForTimeout(randomDelay());
```

**Why:** Bots have predictable timing. Humans don't.

---

### 5. **Rotate User Agents**

Don't use the same User-Agent for every request. Rotate between current Chrome/Firefox/Safari versions:

```typescript
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Firefox/132.0'
];
```

---

### 6. **Extract by Position/Structure (Fallback Strategy)**

When CSS classes fail, look at document structure:

```typescript
// If we can't find by class, try by position
const rows = document.querySelectorAll('article');
rows.forEach(row => {
  const links = row.querySelectorAll('a');
  const firstLink = links[0]; // Usually the title
  const rating = row.querySelector('[role="img"]'); // ARIA roles are stable
});
```

---

## When Your Scraper Breaks (It Will!)

### Debugging Checklist:

1. **Check if selectors changed:**
   ```bash
   # Open the page in real browser, inspect element
   # Compare current HTML to what your code expects
   ```

2. **Check for new anti-bot measures:**
   - CAPTCHA appearing?
   - 403/429 errors (rate limiting)?
   - Content not loading at all?

3. **Update selectors using fallback approach:**
   - Add more fallback strategies
   - Use even broader selectors
   - Extract by document structure instead of classes

4. **Add more delays:**
   - Increase wait times
   - Add random delays between requests
   - Slow down scrolling

---

## How to Use the New Stealth Module

### Example: Refactor parse-ug-url to use stealth

**Before:**
```typescript
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ userAgent: '...' });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
```

**After (with stealth helper):**
```typescript
import { stealthScrape } from '$lib/server/playwright-stealth';

const tabData = await stealthScrape({
  url: 'https://tabs.ultimate-guitar.com/tab/...',
  waitSelectors: ['code', 'pre.js-tab-content'],
  scrollToLoad: false,
  extractData: async (page) => {
    return await page.evaluate(() => {
      // Your extraction logic
      const codeElement = document.querySelector('code');
      return { content: codeElement?.textContent };
    });
  }
});
```

---

## "Guaranteed to Work" Approaches?

**Truth:** There is NO guaranteed approach. This is a cat-and-mouse game.

### Most Resilient Strategies (in order):

1. **🥇 Use Official APIs** (if available) - Never breaks
2. **🥈 Semantic HTML + Fallbacks** (what you're doing) - Breaks rarely
3. **🥉 Stealth Mode + Human Behavior** (new addition) - Harder to detect
4. **Position-based extraction** - Last resort when selectors fail
5. **AI/ML to identify elements** - Overkill for personal projects

### What Actually Works Long-Term:

✅ **For personal use with friends:** Your current approach is fine!
- UG won't ban you for occasional scraping
- Adding stealth mode gives you extra buffer
- Fallback strategies = easy to fix when it breaks

❌ **For production/commercial apps:** You'll fight constantly
- Need proxy rotation
- Need CAPTCHA solving services ($$$)
- Need daily monitoring/updates
- Consider paid scraping APIs instead

---

## Quick Wins You Can Add Now:

### Priority 1: Add Stealth Mode (5 min)
Already set up in `src/lib/server/playwright-stealth.ts` - just import and use!

### Priority 2: Add Random Delays (2 min)
```typescript
const randomWait = () => Math.floor(Math.random() * 1000) + 500;
await page.waitForTimeout(randomWait());
```

### Priority 3: Add More Fallback Selectors (5 min)
```typescript
const selectors = [
  'article a[href*="/tab/"]',      // Current
  'a[href*="/tab/"]',              // Current fallback
  '[data-song-url]',               // Possible data attribute
  'a[href*="tabs.ultimate-guitar.com"]' // Even broader
];
```

### Priority 4: Rate Limiting (2 min)
```typescript
// Add delay between bulk imports
await new Promise(r => setTimeout(r, 2000)); // 2 second delay
```

---

## Bottom Line for Personal Use:

**Your current approach is solid!** Adding stealth mode will make it even better. For a personal app used by you and friends:

- ✅ You're unlikely to get blocked (low volume)
- ✅ Your fallback strategy means easy fixes when selectors change
- ✅ Semantic HTML targeting is industry best practice
- ✅ Adding stealth gives you insurance against future detection

**Don't overthink it!** The techniques you're using now are exactly what professionals recommend. Stealth mode is just extra insurance.
