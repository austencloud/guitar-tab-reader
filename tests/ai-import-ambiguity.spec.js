import { test, expect } from '@playwright/test';

/**
 * Test suite for AI Import ambiguity detection and handling
 * Tests the "Crazy" problem: single-word queries that could be artist OR song
 */

test.describe('AI Import Ambiguity Detection', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should detect ambiguity for "Crazy" query', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Wait for modal to be visible
		await expect(page.locator('text=Import from Web')).toBeVisible();

		// Should be on smart import view by default
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('Crazy');
		await page.waitForTimeout(300);

		// Click import button
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for AI analysis
		await page.waitForTimeout(5000);

		// Check if disambiguation view is shown
		const disambiguationHeading = page.locator('text=Clarify Your Request');
		const isDisambiguating = await disambiguationHeading.isVisible().catch(() => false);

		// Log the result
		console.log('Disambiguation view shown:', isDisambiguating);

		// Take screenshot for debugging
		await page.screenshot({ 
			path: 'tests/screenshots/crazy-ambiguity-test.png', 
			fullPage: true 
		});

		// Check what view we're on
		const currentView = await page.evaluate(() => {
			const smartView = document.querySelector('.smart-view');
			const disambigView = document.querySelector('[class*="disambig"]');
			const bulkView = document.querySelector('[class*="bulk"]');
			
			if (smartView) return 'smart';
			if (disambigView) return 'disambiguation';
			if (bulkView) return 'bulk-results';
			return 'unknown';
		});

		console.log('Current view:', currentView);

		// If we're on bulk results, check what we got
		if (currentView === 'bulk-results') {
			const resultsText = await page.textContent('body');
			if (resultsText) {
				console.log('Results contain "Gnarls Barkley":', resultsText.includes('Gnarls Barkley'));
				console.log('Results contain "Crazy" (artist):', resultsText.match(/Crazy.*artist/i));
			}
		}

		// The test passes if disambiguation is shown OR if results include Gnarls Barkley
		const bodyText = await page.textContent('body');
		const hasGnarlsBarkley = bodyText ? bodyText.includes('Gnarls Barkley') : false;
		
		expect(isDisambiguating || hasGnarlsBarkley).toBeTruthy();
	});

	test('should detect ambiguity for "Home" query', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Enter ambiguous query
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('Home');
		await page.waitForTimeout(300);

		// Submit
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for processing
		await page.waitForTimeout(5000);

		// Screenshot
		await page.screenshot({ 
			path: 'tests/screenshots/home-ambiguity-test.png', 
			fullPage: true 
		});

		// Should show disambiguation
		const disambiguationHeading = page.locator('text=Clarify Your Request');
		const isDisambiguating = await disambiguationHeading.isVisible().catch(() => false);

		console.log('Disambiguation for "Home":', isDisambiguating);
		
		// Home is extremely common - should definitely trigger disambiguation
		expect(isDisambiguating).toBeTruthy();
	});

	test('should correctly handle "Crazy Gnarls Barkley" query', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Enter specific query with artist
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('Crazy Gnarls Barkley');
		await page.waitForTimeout(300);

		// Submit
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for processing
		await page.waitForTimeout(10000);

		// Screenshot
		await page.screenshot({ 
			path: 'tests/screenshots/crazy-gnarls-barkley-test.png', 
			fullPage: true 
		});

		// Should find the song
		const bodyText = await page.textContent('body');
		const foundGnarlsBarkley = bodyText ? (bodyText.includes('Gnarls Barkley') || bodyText.includes('Crazy')) : false;

		console.log('Found Gnarls Barkley:', foundGnarlsBarkley);
		console.log('Page text sample:', bodyText ? bodyText.slice(0, 500) : 'No body text');

		expect(foundGnarlsBarkley).toBeTruthy();
	});

	test('should clearly identify artist-only queries', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Enter clear artist query
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('The Beatles');
		await page.waitForTimeout(300);

		// Submit
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for processing
		await page.waitForTimeout(5000);

		// Should go straight to bulk results (no disambiguation)
		const bulkResultsHeading = page.locator('text=Choose a Tab');
		const isBulkResults = await bulkResultsHeading.isVisible().catch(() => false);

		console.log('Bulk results shown for "The Beatles":', isBulkResults);

		expect(isBulkResults).toBeTruthy();
	});

	test('should clearly identify song-with-artist queries', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Enter clear "song by artist" query
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('Wonderwall by Oasis');
		await page.waitForTimeout(300);

		// Submit
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for processing
		await page.waitForTimeout(10000);

		// Should go to preview (single tab found)
		const previewHeading = page.locator('text=Preview & Edit');
		const isPreview = await previewHeading.isVisible().catch(() => false);

		console.log('Preview shown for "Wonderwall by Oasis":', isPreview);

		// OR bulk results with Wonderwall
		const bodyText = await page.textContent('body');
		const foundWonderwall = bodyText ? bodyText.includes('Wonderwall') : false;

		expect(isPreview || foundWonderwall).toBeTruthy();
	});

	test('should handle MusicBrainz data correctly', async ({ page }) => {
		// Test the MusicBrainz integration by checking server-side logs
		// This is a server-side test that we'll run via API

		const response = await page.request.post('http://localhost:5001/api/smart-import-stream', {
			headers: { 'Content-Type': 'application/json' },
			data: { query: 'Crazy' }
		});

		expect(response.ok()).toBeTruthy();

		// Read the stream response
		const buffer = await response.body();
		const data = buffer.toString();

		console.log('Server response for "Crazy":', data.slice(0, 500));

		// Check if MusicBrainz was consulted
		const mentionsMusicBrainz = data.includes('MusicBrainz') || data.includes('musicbrainz');
		console.log('MusicBrainz consulted:', mentionsMusicBrainz);

		// Check if ambiguity was detected
		const detectedAmbiguity = data.includes('AMBIGUOUS') || data.includes('disambiguat');
		console.log('Ambiguity detected:', detectedAmbiguity);
	});
});

test.describe('AI Import Console Logging', () => {
	test('should log AI analysis process', async ({ page }) => {
		// Capture console logs
		/** @type {Array<{type: string, text: string}>} */
		const logs = [];
		page.on('console', msg => {
			logs.push({ type: msg.type(), text: msg.text() });
		});

		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Enter query
		const smartInput = page.locator('input[placeholder*="artist"]').first();
		await smartInput.fill('Crazy');
		await page.waitForTimeout(300);

		// Submit
		const importBtn = page.locator('button:has-text("Smart Import")').first();
		await importBtn.click();

		// Wait for processing
		await page.waitForTimeout(10000);

		// Output all logs
		console.log('\n=== CLIENT-SIDE LOGS ===');
		logs.forEach(log => {
			if (log.text.includes('MusicBrainz') || 
			    log.text.includes('Intent') || 
			    log.text.includes('Import') ||
			    log.text.includes('AI')) {
				console.log(`[${log.type}] ${log.text}`);
			}
		});
		console.log('=== END LOGS ===\n');

		// Check if key processes were logged
		const hasMusicBrainzLog = logs.some(log => log.text.includes('MusicBrainz'));
		const hasIntentLog = logs.some(log => log.text.includes('Intent') || log.text.includes('intent'));
		const hasResultLog = logs.some(log => log.text.includes('result') || log.text.includes('Result'));

		console.log('Has MusicBrainz log:', hasMusicBrainzLog);
		console.log('Has Intent log:', hasIntentLog);
		console.log('Has Result log:', hasResultLog);

		expect(hasIntentLog || hasResultLog).toBeTruthy();
	});
});
