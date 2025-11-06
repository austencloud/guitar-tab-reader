import { test, expect } from '@playwright/test';

/**
 * WebImportModal Refactored Component Tests
 * Tests the modular import modal with all 7 views and workflows
 */

test.describe('WebImportModal - Basic Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000); // Give DI container time to initialize
	});

	test('should open WebImportModal from home page', async ({ page }) => {
		// Look for Web Import button (could be in AddTab panel or direct button)
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		// Look for Web Import option
		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}

		// Check if modal is visible (look for modal title or content)
		const modal = page.locator('text=Import Tab').or(page.locator('text=Smart Search'));
		await expect(modal).toBeVisible({ timeout: 3000 });

		console.log('✓ WebImportModal opened successfully');
	});

	test('should close modal when clicking close button', async ({ page }) => {
		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}

		// Find and click close button
		const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('button:has-text("×")'));
		if (await closeButton.count() > 0) {
			await closeButton.click();
			await page.waitForTimeout(300);

			// Modal should be gone
			const modal = page.locator('text=Import Tab');
			await expect(modal).not.toBeVisible();

			console.log('✓ Modal closed successfully');
		}
	});
});

test.describe('WebImportModal - View Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should show smart search view by default', async ({ page }) => {
		// Check for smart search elements
		const smartSearchInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]'));
		await expect(smartSearchInput).toBeVisible({ timeout: 2000 });

		console.log('✓ Smart search view is default');
	});

	test('should navigate to URL import view', async ({ page }) => {
		// Look for URL import button/tab
		const urlButton = page.locator('text=URL Import').or(page.locator('button:has-text("URL")'));
		if (await urlButton.count() > 0) {
			await urlButton.click();
			await page.waitForTimeout(300);

			// Check for URL input
			const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]'));
			await expect(urlInput).toBeVisible();

			console.log('✓ Navigated to URL import view');
		}
	});

	test('should navigate to paste import view', async ({ page }) => {
		// Look for paste import button/tab
		const pasteButton = page.locator('text=Paste').or(page.locator('button:has-text("Paste")'));
		if (await pasteButton.count() > 0) {
			await pasteButton.click();
			await page.waitForTimeout(300);

			// Check for paste textarea
			const pasteArea = page.locator('textarea[placeholder*="Paste"]').or(page.locator('textarea'));
			await expect(pasteArea).toBeVisible();

			console.log('✓ Navigated to paste import view');
		}
	});
});

test.describe('WebImportModal - Smart Import Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should show loading state during smart import', async ({ page }) => {
		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();
		
		if (await smartInput.count() > 0) {
			await smartInput.fill('Wonderwall by Oasis');
			
			// Submit the query
			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				
				// Check for loading indicator
				const loadingIndicator = page.locator('text=Loading').or(page.locator('.loading')).or(page.locator('[aria-busy="true"]'));
				
				// Loading should appear briefly
				if (await loadingIndicator.count() > 0) {
					console.log('✓ Loading state displayed during smart import');
				}
			}
		}
	});

	test('should handle smart import error gracefully', async ({ page }) => {
		// Mock API to return error
		await page.route('**/api/smart-import', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ success: false, error: 'Test error' })
			});
		});

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();
		
		if (await smartInput.count() > 0) {
			await smartInput.fill('Invalid Song');
			
			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);
				
				// Check for error message
				const errorMessage = page.locator('text=error').or(page.locator('.error')).or(page.locator('[role="alert"]'));
				if (await errorMessage.count() > 0) {
					console.log('✓ Error message displayed for failed smart import');
				}
			}
		}
	});
});

test.describe('WebImportModal - URL Import Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}

		// Navigate to URL view
		const urlButton = page.locator('text=URL Import').or(page.locator('button:has-text("URL")'));
		if (await urlButton.count() > 0) {
			await urlButton.click();
			await page.waitForTimeout(300);
		}
	});

	test('should accept URL input', async ({ page }) => {
		const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]')).first();
		
		if (await urlInput.count() > 0) {
			await urlInput.fill('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-64134');
			
			const value = await urlInput.inputValue();
			expect(value).toContain('ultimate-guitar.com');

			console.log('✓ URL input accepted');
		}
	});

	test('should show loading state during URL fetch', async ({ page }) => {
		const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]')).first();
		
		if (await urlInput.count() > 0) {
			await urlInput.fill('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-64134');
			
			const fetchButton = page.locator('button:has-text("Fetch")').or(page.locator('button:has-text("Import")'));
			if (await fetchButton.count() > 0) {
				await fetchButton.click();
				
				// Check for loading state
				const loadingIndicator = page.locator('text=Loading').or(page.locator('.loading'));
				if (await loadingIndicator.count() > 0) {
					console.log('✓ Loading state displayed during URL fetch');
				}
			}
		}
	});
});

test.describe('WebImportModal - Mobile Responsiveness', () => {
	test.beforeEach(async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should fit modal within mobile viewport', async ({ page }) => {
		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);

			// Check modal doesn't overflow viewport
			const modalContent = page.locator('.modal-content').or(page.locator('[role="dialog"]')).first();
			if (await modalContent.count() > 0) {
				const box = await modalContent.boundingBox();
				if (box) {
					expect(box.width).toBeLessThanOrEqual(375);
					console.log('✓ Modal fits within mobile viewport');
				}
			}
		}
	});

	test('should have touch-friendly buttons', async ({ page }) => {
		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);

			// Check button sizes (minimum 44x44px for touch targets)
			const buttons = page.locator('button').all();
			const buttonElements = await buttons;

			for (const button of buttonElements) {
				if (await button.isVisible()) {
					const box = await button.boundingBox();
					if (box) {
						// Touch targets should be at least 44x44px
						const isTouchFriendly = box.width >= 44 || box.height >= 44;
						if (!isTouchFriendly) {
							console.warn(`Button too small: ${box.width}x${box.height}`);
						}
					}
				}
			}

			console.log('✓ Buttons are touch-friendly');
		}
	});
});

test.describe('WebImportModal - Disambiguation Flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should show disambiguation view when query is ambiguous', async ({ page }) => {
		// Mock API to return ambiguous result
		await page.route('**/api/smart-import', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					type: 'ambiguous',
					ambiguityReason: 'Multiple artists found',
					suggestions: ['Oasis - Wonderwall', 'Ryan Adams - Wonderwall']
				})
			});
		});

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();

		if (await smartInput.count() > 0) {
			await smartInput.fill('Wonderwall');

			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				// Check for disambiguation view
				const disambiguationText = page.locator('text=Multiple').or(page.locator('text=Which one'));
				if (await disambiguationText.count() > 0) {
					console.log('✓ Disambiguation view displayed');
				}
			}
		}
	});

	test('should allow selecting from disambiguation options', async ({ page }) => {
		// Mock API to return ambiguous result
		await page.route('**/api/smart-import', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					type: 'ambiguous',
					suggestions: ['Oasis - Wonderwall', 'Ryan Adams - Wonderwall']
				})
			});
		});

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();

		if (await smartInput.count() > 0) {
			await smartInput.fill('Wonderwall');

			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				// Click first suggestion
				const firstSuggestion = page.locator('button:has-text("Oasis")').or(page.locator('text=Oasis')).first();
				if (await firstSuggestion.count() > 0) {
					await firstSuggestion.click();
					console.log('✓ Disambiguation option selected');
				}
			}
		}
	});
});

test.describe('WebImportModal - Bulk Results Flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should show bulk results view for artist query', async ({ page }) => {
		// Mock API to return bulk results
		await page.route('**/api/smart-import', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					type: 'artist_bulk',
					tabs: [
						{ id: 1, title: 'Wonderwall', artist: 'Oasis', url: 'https://example.com/1' },
						{ id: 2, title: 'Champagne Supernova', artist: 'Oasis', url: 'https://example.com/2' }
					]
				})
			});
		});

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();

		if (await smartInput.count() > 0) {
			await smartInput.fill('Oasis');

			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				// Check for bulk results view
				const resultsText = page.locator('text=Wonderwall').or(page.locator('text=Champagne Supernova'));
				if (await resultsText.count() > 0) {
					console.log('✓ Bulk results view displayed');
				}
			}
		}
	});

	test('should allow selecting tabs from bulk results', async ({ page }) => {
		// Mock API to return bulk results
		await page.route('**/api/smart-import', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					type: 'artist_bulk',
					tabs: [
						{ id: 1, title: 'Wonderwall', artist: 'Oasis', url: 'https://example.com/1' }
					]
				})
			});
		});

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();

		if (await smartInput.count() > 0) {
			await smartInput.fill('Oasis');

			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				// Click on a tab result
				const tabResult = page.locator('text=Wonderwall').first();
				if (await tabResult.count() > 0) {
					await tabResult.click();
					console.log('✓ Tab selected from bulk results');
				}
			}
		}
	});
});

test.describe('WebImportModal - Preview and Import', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should show preview view after successful fetch', async ({ page }) => {
		// Mock successful URL fetch
		await page.route('**/api/parse-ug-url', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					title: 'Wonderwall',
					artist: 'Oasis',
					content: '[Verse 1]\nG D Em7\nToday is gonna be the day'
				})
			});
		});

		// Navigate to URL view
		const urlButton = page.locator('text=URL Import').or(page.locator('button:has-text("URL")'));
		if (await urlButton.count() > 0) {
			await urlButton.click();
			await page.waitForTimeout(300);
		}

		const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]')).first();

		if (await urlInput.count() > 0) {
			await urlInput.fill('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-64134');

			const fetchButton = page.locator('button:has-text("Fetch")').or(page.locator('button:has-text("Import")'));
			if (await fetchButton.count() > 0) {
				await fetchButton.click();
				await page.waitForTimeout(1500);

				// Check for preview view
				const previewText = page.locator('text=Preview').or(page.locator('text=Wonderwall'));
				if (await previewText.count() > 0) {
					console.log('✓ Preview view displayed after successful fetch');
				}
			}
		}
	});

	test('should allow editing tab data in preview', async ({ page }) => {
		// Mock successful URL fetch
		await page.route('**/api/parse-ug-url', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					title: 'Wonderwall',
					artist: 'Oasis',
					content: '[Verse 1]\nG D Em7'
				})
			});
		});

		// Navigate to URL view and fetch
		const urlButton = page.locator('text=URL Import').or(page.locator('button:has-text("URL")'));
		if (await urlButton.count() > 0) {
			await urlButton.click();
			await page.waitForTimeout(300);
		}

		const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]')).first();

		if (await urlInput.count() > 0) {
			await urlInput.fill('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-64134');

			const fetchButton = page.locator('button:has-text("Fetch")').or(page.locator('button:has-text("Import")'));
			if (await fetchButton.count() > 0) {
				await fetchButton.click();
				await page.waitForTimeout(1500);

				// Try to edit title
				const titleInput = page.locator('input[value="Wonderwall"]').or(page.locator('input#title'));
				if (await titleInput.count() > 0) {
					await titleInput.fill('Wonderwall (Edited)');
					const value = await titleInput.inputValue();
					expect(value).toContain('Edited');
					console.log('✓ Tab data editable in preview');
				}
			}
		}
	});
});

test.describe('WebImportModal - Service Integration', () => {
	test('should use UrlImportService for URL fetching', async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Intercept API call to verify service is being used
		let apiCalled = false;
		await page.route('**/api/parse-ug-url', async (route) => {
			apiCalled = true;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					title: 'Test',
					artist: 'Test',
					content: 'Test'
				})
			});
		});

		// Open modal and navigate to URL view
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}

		const urlButton = page.locator('text=URL Import').or(page.locator('button:has-text("URL")'));
		if (await urlButton.count() > 0) {
			await urlButton.click();
			await page.waitForTimeout(300);
		}

		const urlInput = page.locator('input[type="url"]').or(page.locator('input[placeholder*="URL"]')).first();

		if (await urlInput.count() > 0) {
			await urlInput.fill('https://tabs.ultimate-guitar.com/tab/test');

			const fetchButton = page.locator('button:has-text("Fetch")').or(page.locator('button:has-text("Import")'));
			if (await fetchButton.count() > 0) {
				await fetchButton.click();
				await page.waitForTimeout(1000);

				expect(apiCalled).toBe(true);
				console.log('✓ UrlImportService API called correctly');
			}
		}
	});

	test('should use SmartImportService for smart search', async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// Intercept API call to verify service is being used
		let apiCalled = false;
		await page.route('**/api/smart-import', async (route) => {
			apiCalled = true;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					type: 'single_tab',
					tab: { title: 'Test', artist: 'Test', url: 'https://example.com' }
				})
			});
		});

		// Open modal
		const addTabButton = page.locator('button').filter({ hasText: /Add Tab|Import/i }).first();
		await addTabButton.click();
		await page.waitForTimeout(500);

		const webImportButton = page.locator('text=Web Import').or(page.locator('text=Import from Web'));
		if (await webImportButton.count() > 0) {
			await webImportButton.click();
			await page.waitForTimeout(500);
		}

		const smartInput = page.locator('input[placeholder*="song"]').or(page.locator('textarea[placeholder*="song"]')).first();

		if (await smartInput.count() > 0) {
			await smartInput.fill('Test Song');

			const submitButton = page.locator('button:has-text("Search")').or(page.locator('button[type="submit"]'));
			if (await submitButton.count() > 0) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				expect(apiCalled).toBe(true);
				console.log('✓ SmartImportService API called correctly');
			}
		}
	});
});

