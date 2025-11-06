// Playwright configuration with stealth mode and anti-detection measures
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { addExtra } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';

// Add stealth plugin to playwright
const chromiumWithStealth = addExtra(chromium);
chromiumWithStealth.use(StealthPlugin());

/**
 * Randomized delays to mimic human behavior
 */
const humanDelay = () => Math.floor(Math.random() * 1000) + 500; // 500-1500ms
const shortDelay = () => Math.floor(Math.random() * 500) + 200; // 200-700ms

/**
 * Pool of realistic user agents (rotate between them)
 */
const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

/**
 * Get a random user agent from the pool
 */
const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

/**
 * Creates a stealth browser instance with anti-detection measures
 */
export async function createStealthBrowser(): Promise<Browser> {
	return await chromiumWithStealth.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-blink-features=AutomationControlled',
			'--disable-dev-shm-usage',
			'--disable-web-security',
			'--disable-features=IsolateOrigins,site-per-process'
		]
	});
}

/**
 * Creates a stealth browser context with realistic settings
 */
export async function createStealthContext(browser: Browser): Promise<BrowserContext> {
	const context = await browser.newContext({
		userAgent: getRandomUserAgent(),
		viewport: {
			width: 1920,
			height: 1080
		},
		locale: 'en-US',
		timezoneId: 'America/New_York',
		permissions: [],
		// Add realistic browser headers
		extraHTTPHeaders: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'DNT': '1',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		}
	});

	return context;
}

/**
 * Navigate to a page with human-like behavior
 */
export async function stealthNavigate(
	page: Page,
	url: string,
	options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }
): Promise<void> {
	const { waitUntil = 'domcontentloaded', timeout = 60000 } = options || {};

	// Add random delay before navigation to mimic human behavior
	await page.waitForTimeout(shortDelay());

	try {
		await page.goto(url, { waitUntil, timeout });

		// Random delay after page load to mimic reading
		await page.waitForTimeout(humanDelay());
	} catch (error) {
		console.error('Navigation error:', error);
		throw error;
	}
}

/**
 * Scroll the page like a human would
 */
export async function humanScroll(page: Page, scrollCount: number = 3): Promise<void> {
	for (let i = 0; i < scrollCount; i++) {
		// Scroll by random increments
		const scrollAmount = Math.floor(Math.random() * 500) + 300;

		await page.evaluate((amount) => {
			window.scrollBy({
				top: amount,
				behavior: 'smooth'
			});
		}, scrollAmount);

		// Random pause between scrolls
		await page.waitForTimeout(humanDelay());
	}
}

/**
 * Wait for an element with multiple fallback selectors
 */
export async function waitForAnySelector(
	page: Page,
	selectors: string[],
	timeout: number = 10000
): Promise<boolean> {
	try {
		await Promise.race(
			selectors.map((selector) =>
				page.waitForSelector(selector, { state: 'attached', timeout })
			)
		);
		return true;
	} catch {
		console.warn('⚠️ None of the selectors found within timeout');
		return false;
	}
}

/**
 * Enhanced scraping configuration
 */
export interface StealthScrapingConfig {
	url: string;
	waitSelectors?: string[];
	scrollToLoad?: boolean;
	scrollCount?: number;
	extractData: (page: Page) => Promise<any>;
}

/**
 * Main stealth scraping function with all best practices applied
 */
export async function stealthScrape<T>(config: StealthScrapingConfig): Promise<T | null> {
	let browser: Browser | undefined;

	try {
		// Create stealth browser and context
		browser = await createStealthBrowser();
		const context = await createStealthContext(browser);
		const page = await context.newPage();

		console.log(`🌐 Navigating to ${config.url} with stealth mode...`);

		// Navigate with stealth
		await stealthNavigate(page, config.url);

		// Wait for specific selectors if provided
		if (config.waitSelectors && config.waitSelectors.length > 0) {
			await waitForAnySelector(page, config.waitSelectors);
		}

		// Scroll if needed (for infinite scroll content)
		if (config.scrollToLoad) {
			await humanScroll(page, config.scrollCount || 3);
		}

		// Extract data using provided function
		console.log(`📄 Extracting data...`);
		const data = await config.extractData(page);

		await browser.close();
		return data;
	} catch (error) {
		if (browser) {
			await browser.close();
		}
		console.error('❌ Stealth scraping error:', error);
		return null;
	}
}
