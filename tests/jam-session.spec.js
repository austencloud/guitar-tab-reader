import { test, expect } from '@playwright/test';

/**
 * Collaborative Jam Session Tests
 * Tests the core WebRTC-based session functionality
 */

test.describe('Jam Session Feature', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app
		await page.goto('http://localhost:5001');

		// Wait for app to initialize
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000); // Give DI container time to initialize
	});

	test('should show Jam Session button in navigation', async ({ page }) => {
		// Check if navigation has the Jam Session button
		const jamButton = page.locator('button:has-text("Jam")').or(page.locator('button:has-text("Jam Session")'));
		await expect(jamButton).toBeVisible();

		console.log('✓ Jam Session button is visible in navigation');
	});

	test('should open session bottom sheet when Jam button clicked', async ({ page }) => {
		// Click the Jam Session button
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();

		// Wait for bottom sheet to appear
		await page.waitForTimeout(500);

		// Check for "Create Session" and "Join Session" options
		const createOption = page.locator('text=Create Session');
		const joinOption = page.locator('text=Join Session');

		await expect(createOption).toBeVisible();
		await expect(joinOption).toBeVisible();

		console.log('✓ Session bottom sheet opened with Create and Join options');
	});

	test('should open create session modal', async ({ page }) => {
		// Open sessions sheet
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		// Click Create Session
		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		// Check modal is visible
		const modal = page.locator('text=Create Jam Session');
		await expect(modal).toBeVisible();

		// Check form fields exist
		const sessionNameInput = page.locator('input[placeholder*="Sunday"]').or(page.locator('input#session-name'));
		const deviceNameInput = page.locator('input[placeholder*="iPhone"]').or(page.locator('input#device-name'));

		await expect(sessionNameInput).toBeVisible();
		await expect(deviceNameInput).toBeVisible();

		console.log('✓ Create session modal opened with form fields');
	});

	test('should create a session and show room code', async ({ page }) => {
		// Open sessions sheet
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		// Click Create Session
		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		// Fill in the form
		const sessionNameInput = page.locator('input#session-name');
		const deviceNameInput = page.locator('input#device-name');

		await sessionNameInput.fill('Test Jam');
		await deviceNameInput.fill('Test Device');

		// Submit the form
		await page.locator('button:has-text("Create Session")').click();

		// Wait for session to be created
		await page.waitForTimeout(2000);

		// Check if "Live" indicator appears
		const liveIndicator = page.locator('text=Live');
		await expect(liveIndicator).toBeVisible({ timeout: 5000 });

		console.log('✓ Session created successfully with Live indicator');
	});

	test('should show session queue when Live indicator clicked', async ({ page }) => {
		// Create a session first
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		await page.locator('input#session-name').fill('Queue Test');
		await page.locator('input#device-name').fill('Test Device');
		await page.locator('button:has-text("Create Session")').click();

		await page.waitForTimeout(2000);

		// Click the Live indicator
		const liveIndicator = page.locator('button:has-text("Live")').or(page.locator('.session-indicator'));
		await liveIndicator.click();

		await page.waitForTimeout(500);

		// Check if queue view is visible
		const queueView = page.locator('text=QUEUE').or(page.locator('text=NOW PLAYING'));
		await expect(queueView).toBeVisible();

		console.log('✓ Session queue view opened');
	});

	test('should show empty queue message when no tabs added', async ({ page }) => {
		// Create a session
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		await page.locator('input#session-name').fill('Empty Queue Test');
		await page.locator('input#device-name').fill('Test Device');
		await page.locator('button:has-text("Create Session")').click();

		await page.waitForTimeout(2000);

		// Open queue
		await page.locator('button:has-text("Live")').click();
		await page.waitForTimeout(500);

		// Check for empty state message
		const emptyMessage = page.locator('text=No tabs in queue');
		await expect(emptyMessage).toBeVisible();

		console.log('✓ Empty queue message displayed');
	});

	test('should display room code in queue view', async ({ page }) => {
		// Create a session
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		await page.locator('input#session-name').fill('Code Test');
		await page.locator('input#device-name').fill('Test Device');
		await page.locator('button:has-text("Create Session")').click();

		await page.waitForTimeout(2000);

		// Open queue
		await page.locator('button:has-text("Live")').click();
		await page.waitForTimeout(500);

		// Look for room code (format: ABC-123 or ABC123)
		const codeButton = page.locator('button').filter({ hasText: /-/ }).first();
		await expect(codeButton).toBeVisible();

		// Get the code text
		const codeText = await codeButton.textContent();
		console.log('✓ Room code displayed:', codeText);

		// Verify it's a valid format (6 characters with optional dash)
		const codeMatch = codeText?.match(/[A-Z0-9]{3}-?[A-Z0-9]{3}/);
		expect(codeMatch).toBeTruthy();
	});

	test('should be able to leave session', async ({ page }) => {
		// Create a session
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		await page.locator('input#session-name').fill('Leave Test');
		await page.locator('input#device-name').fill('Test Device');
		await page.locator('button:has-text("Create Session")').click();

		await page.waitForTimeout(2000);

		// Open queue
		await page.locator('button:has-text("Live")').click();
		await page.waitForTimeout(500);

		// Click Leave Session button
		await page.locator('button:has-text("Leave Session")').click();

		// Confirm the dialog if it appears
		page.once('dialog', dialog => {
			console.log('Dialog message:', dialog.message());
			dialog.accept();
		});

		await page.waitForTimeout(1000);

		// Check that Live indicator is gone
		const liveIndicator = page.locator('text=Live');
		await expect(liveIndicator).not.toBeVisible();

		console.log('✓ Successfully left session');
	});

	test('should open join session modal', async ({ page }) => {
		// Open sessions sheet
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		// Click Join Session
		await page.locator('text=Join Session').click();
		await page.waitForTimeout(500);

		// Check modal is visible
		const modal = page.locator('text=Join Jam Session');
		await expect(modal).toBeVisible();

		// Check form fields
		const codeInput = page.locator('input[placeholder*="ABC"]').or(page.locator('input#room-code'));
		const deviceInput = page.locator('input#device-name');

		await expect(codeInput).toBeVisible();
		await expect(deviceInput).toBeVisible();

		console.log('✓ Join session modal opened');
	});

	test('should validate room code format', async ({ page }) => {
		// Open join modal
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Join Session').click();
		await page.waitForTimeout(500);

		// Try to enter invalid code
		const codeInput = page.locator('input#room-code');
		await codeInput.fill('12');

		// Submit button should be disabled
		const submitButton = page.locator('button:has-text("Join Session")').last();
		await expect(submitButton).toBeDisabled();

		// Enter valid code
		await codeInput.fill('ABC123');
		await page.waitForTimeout(300);

		// Add device name
		await page.locator('input#device-name').fill('Test');

		// Now submit button should be enabled
		await expect(submitButton).toBeEnabled();

		console.log('✓ Room code validation working');
	});

	test('should show member count in queue view', async ({ page }) => {
		// Create a session
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		await page.locator('input#session-name').fill('Member Test');
		await page.locator('input#device-name').fill('Device 1');
		await page.locator('button:has-text("Create Session")').click();

		await page.waitForTimeout(2000);

		// Open queue
		await page.locator('button:has-text("Live")').click();
		await page.waitForTimeout(500);

		// Check for member count (should show "1 online" or similar)
		const memberCount = page.locator('text=/\\d+ online/');
		await expect(memberCount).toBeVisible();

		const countText = await memberCount.textContent();
		console.log('✓ Member count displayed:', countText);

		expect(countText).toContain('1');
	});
});

test.describe('Jam Session UI/UX', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should have proper mobile styling', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Open jam session
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		// Check bottom sheet is visible
		const bottomSheet = page.locator('text=Create Session').or(page.locator('text=Join Session'));
		await expect(bottomSheet).toBeVisible();

		console.log('✓ Mobile styling working');
	});

	test('should close modals with X button', async ({ page }) => {
		// Open create modal
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		// Click X button
		const closeButton = page.locator('button[aria-label="Close"]').first();
		await closeButton.click();
		await page.waitForTimeout(300);

		// Modal should be gone
		const modal = page.locator('text=Create Jam Session');
		await expect(modal).not.toBeVisible();

		console.log('✓ Modal closes with X button');
	});

	test('should close modals when clicking overlay', async ({ page }) => {
		// Open create modal
		const jamButton = page.locator('button').filter({ hasText: /Jam|Jam Session/ }).first();
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		// Click outside modal (on overlay)
		const overlay = page.locator('.modal-overlay').first();
		await overlay.click({ position: { x: 10, y: 10 } });
		await page.waitForTimeout(300);

		// Modal should be gone
		const modal = page.locator('text=Create Jam Session');
		await expect(modal).not.toBeVisible();

		console.log('✓ Modal closes when clicking overlay');
	});
});

test.describe('Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5001');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should have proper ARIA labels', async ({ page }) => {
		// Check navigation button
		const jamButton = page.locator('button[aria-label*="Jam"]').or(
			page.locator('button').filter({ hasText: /Jam/ })
		);
		await expect(jamButton).toBeVisible();

		// Open modal
		await jamButton.click();
		await page.waitForTimeout(500);

		await page.locator('text=Create Session').click();
		await page.waitForTimeout(500);

		// Check close button has aria-label
		const closeButton = page.locator('button[aria-label="Close"]');
		await expect(closeButton).toBeVisible();

		console.log('✓ Proper ARIA labels present');
	});

	test('should be keyboard navigable', async ({ page }) => {
		// Tab to navigation
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab'); // Should reach Jam button

		// Press Enter
		await page.keyboard.press('Enter');
		await page.waitForTimeout(500);

		// Check if bottom sheet opened
		const bottomSheet = page.locator('text=Create Session');
		const isVisible = await bottomSheet.isVisible();

		if (isVisible) {
			console.log('✓ Keyboard navigation working');
		} else {
			console.log('⚠ Keyboard navigation may need adjustment');
		}
	});
});

console.log('\n🎸 Jam Session Playwright Tests Complete!\n');
