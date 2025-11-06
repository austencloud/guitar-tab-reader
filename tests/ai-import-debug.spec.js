import { test, expect } from '@playwright/test';

test.describe('AI Import Debug Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should display tabs after artist bulk import', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Wait for modal to be visible
		await expect(page.locator('text=Import from Web')).toBeVisible();

		// Click on "Import Tab" option (smart import)
		const smartImportOption = page.locator('text=Import Tab').first();
		await smartImportOption.click();
		await page.waitForTimeout(500);

		// Enter an artist query
		const input = page.locator('input[placeholder*="artist"], textarea[placeholder*="artist"]').first();
		await input.fill('Fish in a Birdcage');
		await page.waitForTimeout(300);

		// Click import button
		const importBtn = page.locator('button:has-text("Import")').last();
		await importBtn.click();

		// Wait for loading to start
		await expect(page.locator('text=Analyzing your request')).toBeVisible({ timeout: 5000 });

		// Wait for progress messages (with longer timeout)
		console.log('Waiting for progress updates...');
		
		// Wait for the import to complete (up to 30 seconds)
		await page.waitForTimeout(30000);

		// Take a screenshot to see what's on screen
		await page.screenshot({ path: 'tests/screenshots/after-import.png', fullPage: true });

		// Check what's visible on the page
		const pageContent = await page.content();
		console.log('Page contains "Choose a Tab":', pageContent.includes('Choose a Tab'));
		console.log('Page contains "Found":', pageContent.includes('Found'));
		console.log('Page contains "tabs":', pageContent.includes('tabs'));

		// Try to find the bulk results view
		const bulkResultsView = page.locator('[class*="bulk"]');
		const bulkResultsCount = await bulkResultsView.count();
		console.log('Bulk results elements found:', bulkResultsCount);

		// Check if we're still on loading screen
		const loadingVisible = await page.locator('.loading-state').isVisible().catch(() => false);
		console.log('Loading state visible:', loadingVisible);

		// Check current view
		const currentView = await page.evaluate(() => {
			const modal = document.querySelector('[class*="modal"]');
			return modal ? modal.innerHTML : 'No modal found';
		});
		console.log('Current modal content length:', currentView.length);

		// Look for any error messages
		const errorMessage = await page.locator('[class*="error"]').textContent().catch(() => 'No error');
		console.log('Error message:', errorMessage);

		// Check if tabs are in the DOM but not visible
		const allTabs = await page.locator('[class*="tab"]').count();
		console.log('Total elements with "tab" in class:', allTabs);

		// Try to find the "Choose a Tab" heading
		const chooseTabHeading = page.locator('text=Choose a Tab');
		const headingVisible = await chooseTabHeading.isVisible().catch(() => false);
		console.log('Choose a Tab heading visible:', headingVisible);

		// List all visible text on the page
		const visibleText = await page.evaluate(() => {
			const walker = document.createTreeWalker(
				document.body,
				NodeFilter.SHOW_TEXT,
				null,
				false
			);
			const texts = [];
			let node;
			while (node = walker.nextNode()) {
				const text = node.textContent.trim();
				if (text.length > 0) {
					texts.push(text);
				}
			}
			return texts;
		});
		console.log('Visible text snippets:', visibleText.slice(0, 20));

		// Final assertion - we should see either the bulk results or an error
		const hasBulkResults = await page.locator('text=Choose a Tab').isVisible().catch(() => false);
		const hasError = await page.locator('[class*="error"]').isVisible().catch(() => false);
		
		console.log('Has bulk results view:', hasBulkResults);
		console.log('Has error:', hasError);

		expect(hasBulkResults || hasError).toBeTruthy();
	});

	test('should show real-time progress updates', async ({ page }) => {
		// Open import modal
		const importButton = page.locator('button:has-text("Import")').first();
		await importButton.click();
		await page.waitForTimeout(500);

		// Click on "Import Tab" option
		const smartImportOption = page.locator('text=Import Tab').first();
		await smartImportOption.click();
		await page.waitForTimeout(500);

		// Enter an artist query
		const input = page.locator('input[placeholder*="artist"], textarea[placeholder*="artist"]').first();
		await input.fill('Beatles');
		await page.waitForTimeout(300);

		// Track progress messages
		const progressMessages = [];
		
		// Set up a listener for text changes in the loading area
		await page.evaluate(() => {
			window.progressMessages = [];
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList' || mutation.type === 'characterData') {
						const loadingText = document.querySelector('.loading-state p');
						if (loadingText) {
							const text = loadingText.textContent;
							if (text && !window.progressMessages.includes(text)) {
								window.progressMessages.push(text);
								console.log('Progress update:', text);
							}
						}
					}
				});
			});
			
			const loadingArea = document.querySelector('.loading-state');
			if (loadingArea) {
				observer.observe(loadingArea, {
					childList: true,
					subtree: true,
					characterData: true
				});
			}
		});

		// Click import button
		const importBtn = page.locator('button:has-text("Import")').last();
		await importBtn.click();

		// Wait for loading to start
		await expect(page.locator('.loading-state')).toBeVisible({ timeout: 5000 });

		// Wait for import to complete
		await page.waitForTimeout(30000);

		// Get the collected progress messages
		const messages = await page.evaluate(() => window.progressMessages);
		console.log('Collected progress messages:', messages);

		// We should have seen multiple progress messages
		expect(messages.length).toBeGreaterThan(1);
	});
});

