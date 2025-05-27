/**
 * Critical Fixes Test Script
 * Tests for the infinite loop fix and tuning dropdown functionality
 */

function testCriticalFixes() {
	console.log('🔧 Testing Critical Tuning Fixes...');
	console.log('='.repeat(50));

	const results = {
		pageLoads: false,
		noInfiniteLoop: false,
		settingsDropdownWorks: false,
		tunerDropdownWorks: false,
		synchronization: false,
		persistence: false,
		noConsoleErrors: false
	};

	// Test 1: Check if page loads without errors
	console.log('\n1. Testing page load...');
	try {
		const body = document.body;
		const hasContent = body && body.children.length > 0;
		results.pageLoads = hasContent;
		console.log(hasContent ? '✅ Page loads successfully' : '❌ Page failed to load');
	} catch (error) {
		console.error('❌ Page load error:', error);
	}

	// Test 2: Check for infinite loop errors
	console.log('\n2. Checking for infinite loop errors...');
	const originalError = console.error;
	let hasInfiniteLoopError = false;

	console.error = function (...args) {
		const message = args.join(' ');
		if (message.includes('effect_update_depth_exceeded') || message.includes('infinite')) {
			hasInfiniteLoopError = true;
		}
		originalError.apply(console, args);
	};

	setTimeout(() => {
		console.error = originalError;
		results.noInfiniteLoop = !hasInfiniteLoopError;
		console.log(hasInfiniteLoopError ? '❌ Infinite loop detected' : '✅ No infinite loop errors');
	}, 2000);

	// Test 3: Test Settings Modal Tuning Dropdown
	console.log('\n3. Testing Settings Modal tuning dropdown...');
	setTimeout(() => {
		try {
			// Open settings modal
			const settingsButton = document.querySelector(
				'button[aria-label*="settings"], button[aria-label*="Settings"]'
			);
			if (settingsButton) {
				settingsButton.click();

				setTimeout(() => {
					const tuningSelect = document.querySelector('#tuning-select');
					if (tuningSelect) {
						const originalValue = tuningSelect.value;
						const options = Array.from(tuningSelect.querySelectorAll('option'));

						if (options.length > 1) {
							const newOption = options.find((opt) => opt.value !== originalValue);
							if (newOption) {
								// Test selection change
								tuningSelect.value = newOption.value;
								tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));

								setTimeout(() => {
									const currentValue = tuningSelect.value;
									results.settingsDropdownWorks = currentValue === newOption.value;
									console.log(
										results.settingsDropdownWorks
											? '✅ Settings dropdown works'
											: '❌ Settings dropdown failed'
									);

									// Restore original value
									tuningSelect.value = originalValue;
									tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));
								}, 500);
							}
						}
					} else {
						console.log('❌ Tuning selector not found in settings modal');
					}
				}, 500);
			} else {
				console.log('❌ Settings button not found');
			}
		} catch (error) {
			console.error('❌ Settings dropdown test error:', error);
		}
	}, 1000);

	// Test 4: Test Tuner Modal Dropdown
	console.log('\n4. Testing Tuner Modal tuning dropdown...');
	setTimeout(() => {
		try {
			// Close settings modal first
			const closeButtons = document.querySelectorAll('button[aria-label*="close"], .close-button');
			closeButtons.forEach((btn) => btn.click());

			setTimeout(() => {
				// Open tuner modal
				const tunerButton = document.querySelector('button[aria-label*="tuner"], .tuner-button');
				if (tunerButton) {
					tunerButton.click();

					setTimeout(() => {
						const tunerSelect = document.querySelector(
							'.tuning-selector-container select, .tuner-container select'
						);
						if (tunerSelect) {
							const originalValue = tunerSelect.value;
							const options = Array.from(tunerSelect.querySelectorAll('option'));

							if (options.length > 1) {
								const newOption = options.find((opt) => opt.value !== originalValue);
								if (newOption) {
									tunerSelect.value = newOption.value;
									tunerSelect.dispatchEvent(new Event('change', { bubbles: true }));

									setTimeout(() => {
										const currentValue = tunerSelect.value;
										results.tunerDropdownWorks = currentValue === newOption.value;
										console.log(
											results.tunerDropdownWorks
												? '✅ Tuner dropdown works'
												: '❌ Tuner dropdown failed'
										);

										// Restore original value
										tunerSelect.value = originalValue;
										tunerSelect.dispatchEvent(new Event('change', { bubbles: true }));
									}, 500);
								}
							}
						} else {
							console.log('❌ Tuning selector not found in tuner modal');
						}
					}, 500);
				} else {
					console.log('❌ Tuner button not found');
				}
			}, 500);
		} catch (error) {
			console.error('❌ Tuner dropdown test error:', error);
		}
	}, 3000);

	// Test 5: Test localStorage persistence
	console.log('\n5. Testing localStorage persistence...');
	setTimeout(() => {
		try {
			const stored = localStorage.getItem('guitar-tab-tuning');
			results.persistence = stored !== null;
			console.log(
				results.persistence ? `✅ Tuning persisted: ${stored}` : '❌ No tuning persistence'
			);
		} catch (error) {
			console.error('❌ Persistence test error:', error);
		}
	}, 5000);

	// Test 6: Check for console errors
	console.log('\n6. Monitoring console errors...');
	const errors = [];
	const originalConsoleError = console.error;

	console.error = function (...args) {
		const message = args.join(' ');
		if (!message.includes('DevTools') && !message.includes('well-known')) {
			errors.push(message);
		}
		originalConsoleError.apply(console, args);
	};

	setTimeout(() => {
		console.error = originalConsoleError;
		results.noConsoleErrors = errors.length === 0;
		console.log(
			results.noConsoleErrors
				? '✅ No critical console errors'
				: `❌ Found ${errors.length} console errors`
		);

		if (errors.length > 0) {
			console.log('Errors found:');
			errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
		}
	}, 6000);

	// Final summary
	setTimeout(() => {
		console.log('\n' + '='.repeat(50));
		console.log('🎯 CRITICAL FIXES TEST SUMMARY');
		console.log('='.repeat(50));

		Object.entries(results).forEach(([test, passed]) => {
			const status = passed ? '✅ PASS' : '❌ FAIL';
			const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
			console.log(`${status} - ${testName}`);
		});

		const passedCount = Object.values(results).filter(Boolean).length;
		const totalCount = Object.keys(results).length;

		console.log('\n' + '='.repeat(50));
		console.log(`OVERALL: ${passedCount}/${totalCount} tests passed`);

		if (passedCount === totalCount) {
			console.log('🎉 ALL CRITICAL FIXES WORKING!');
		} else {
			console.log('⚠️  Some issues remain - check failed tests above');
		}
	}, 7000);
}

// Auto-run the test
console.log('🚀 Starting Critical Fixes Test...');
testCriticalFixes();

// Make function available globally
window.testCriticalFixes = testCriticalFixes;
