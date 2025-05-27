/**
 * Quick Tuning Fix Test Script
 * Run this in the browser console to test if tuning dropdown is working
 */

function testTuningFunctionality() {
	console.log('🎸 Testing Tuning Functionality...');
	console.log('='.repeat(40));

	// Test 1: Check if tuning selector exists
	console.log('\n1. Checking for tuning selector...');
	const settingsButton = document.querySelector(
		'button[aria-label*="settings"], button[aria-label*="Settings"]'
	);

	if (!settingsButton) {
		console.error('❌ Settings button not found');
		return;
	}

	// Open settings modal
	settingsButton.click();

	setTimeout(() => {
		const tuningSelect = document.querySelector('#tuning-select, select[aria-label*="tuning"]');

		if (!tuningSelect) {
			console.error('❌ Tuning selector not found in settings modal');
			return;
		}

		console.log('✅ Tuning selector found');

		// Test 2: Check available options
		console.log('\n2. Checking tuning options...');
		const options = Array.from(tuningSelect.querySelectorAll('option'));
		console.log(`Found ${options.length} tuning options:`);
		options.forEach((opt, i) => {
			console.log(`   ${i + 1}. ${opt.textContent} (value: ${opt.value})`);
		});

		if (options.length < 5) {
			console.warn('⚠️  Expected more tuning options');
		} else {
			console.log('✅ Good number of tuning options available');
		}

		// Test 3: Test selection change
		console.log('\n3. Testing tuning selection...');
		const originalValue = tuningSelect.value;
		console.log(`Current tuning: ${originalValue}`);

		// Find a different option
		const differentOption = options.find((opt) => opt.value !== originalValue);

		if (differentOption) {
			console.log(`Changing to: ${differentOption.textContent}`);

			// Change the value
			tuningSelect.value = differentOption.value;
			tuningSelect.dispatchEvent(new Event('input', { bubbles: true }));
			tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));

			setTimeout(() => {
				// Check if change took effect
				if (tuningSelect.value === differentOption.value) {
					console.log('✅ Tuning selection changed successfully');

					// Test 4: Check if display updates
					console.log('\n4. Checking tuning display updates...');
					const tuningDisplays = document.querySelectorAll(
						'.tuning-display, .tuning-name, [class*="tuning"]'
					);

					let foundUpdate = false;
					tuningDisplays.forEach((display) => {
						const text = display.textContent;
						if (text.includes(differentOption.textContent.split('(')[0].trim())) {
							console.log(`✅ Display updated: "${text}"`);
							foundUpdate = true;
						}
					});

					if (!foundUpdate) {
						console.warn('⚠️  Tuning display may not have updated');
					}

					// Test 5: Check localStorage
					console.log('\n5. Checking localStorage persistence...');
					const storedTuning = localStorage.getItem('guitar-tab-tuning');
					if (storedTuning === differentOption.value) {
						console.log('✅ Tuning saved to localStorage');
					} else {
						console.warn('⚠️  Tuning not saved to localStorage correctly');
						console.log(`   Expected: ${differentOption.value}`);
						console.log(`   Found: ${storedTuning}`);
					}

					// Restore original value
					setTimeout(() => {
						tuningSelect.value = originalValue;
						tuningSelect.dispatchEvent(new Event('input', { bubbles: true }));
						tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));
						console.log(`\n🔄 Restored original tuning: ${originalValue}`);
					}, 1000);
				} else {
					console.error('❌ Tuning selection did not change');
					console.log(`   Expected: ${differentOption.value}`);
					console.log(`   Actual: ${tuningSelect.value}`);
				}
			}, 500);
		} else {
			console.warn('⚠️  Could not find different tuning option to test');
		}
	}, 500);
}

// Test console errors
function checkConsoleErrors() {
	console.log('\n🔍 Checking for console errors...');
	console.log('='.repeat(40));

	// Override console.error to catch errors
	const originalError = console.error;
	const errors = [];

	console.error = function (...args) {
		errors.push(args.join(' '));
		originalError.apply(console, args);
	};

	setTimeout(() => {
		console.error = originalError;

		if (errors.length === 0) {
			console.log('✅ No console errors detected');
		} else {
			console.log(`❌ Found ${errors.length} console errors:`);
			errors.forEach((error, i) => {
				console.log(`   ${i + 1}. ${error}`);
			});
		}
	}, 2000);
}

// Run tests
console.log('🚀 Starting Tuning Fix Tests...');
testTuningFunctionality();
checkConsoleErrors();

// Make functions available globally
window.testTuningFunctionality = testTuningFunctionality;
window.checkConsoleErrors = checkConsoleErrors;
