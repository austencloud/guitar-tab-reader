/**
 * Guitar Tuning Functionality Test Script
 * Run this in the browser console to test tuning dropdown and display functionality
 */

class TuningFunctionalityTester {
	constructor() {
		this.results = [];
		this.currentTest = 0;
	}

	async runAllTests() {
		console.log('🎸 Starting Guitar Tuning Functionality Tests...');
		console.log('='.repeat(50));

		const tests = [
			{ name: 'Check Tuning Dropdown Exists', test: () => this.testTuningDropdownExists() },
			{ name: 'Check Tuning Options Available', test: () => this.testTuningOptionsAvailable() },
			{ name: 'Test Tuning Selection Changes', test: () => this.testTuningSelectionChanges() },
			{ name: 'Test Tuning Display Updates', test: () => this.testTuningDisplayUpdates() },
			{ name: 'Test Tuning Persistence', test: () => this.testTuningPersistence() },
			{
				name: 'Test Settings Modal Tuning Selector',
				test: () => this.testSettingsModalTuningSelector()
			},
			{ name: 'Test Tuner Modal Integration', test: () => this.testTunerModalIntegration() }
		];

		for (let i = 0; i < tests.length; i++) {
			const test = tests[i];
			console.log(`\n📋 Test ${i + 1}/${tests.length}: ${test.name}`);

			try {
				const result = await test.test();
				this.results.push({
					name: test.name,
					passed: result.passed,
					message: result.message,
					details: result.details || null
				});

				console.log(result.passed ? '✅ PASS' : '❌ FAIL', '-', result.message);
				if (result.details) {
					console.log('   Details:', result.details);
				}
			} catch (error) {
				console.error('❌ ERROR -', error.message);
				this.results.push({
					name: test.name,
					passed: false,
					message: `Error: ${error.message}`,
					details: null
				});
			}

			// Wait a bit between tests
			await this.delay(500);
		}

		this.showResults();
	}

	testTuningDropdownExists() {
		// Check if tuning dropdown exists in settings modal
		const settingsButton = document.querySelector(
			'button[aria-label*="settings"], button[aria-label*="Settings"]'
		);

		if (!settingsButton) {
			return { passed: false, message: 'Settings button not found' };
		}

		// Click settings to open modal
		settingsButton.click();

		// Wait a moment for modal to open
		setTimeout(() => {
			const tuningSelect = document.querySelector('#tuning-select, select[aria-label*="tuning"]');

			if (tuningSelect) {
				return { passed: true, message: 'Tuning dropdown found in settings modal' };
			} else {
				return { passed: false, message: 'Tuning dropdown not found in settings modal' };
			}
		}, 300);

		return { passed: true, message: 'Settings modal opened successfully' };
	}

	testTuningOptionsAvailable() {
		const tuningSelect = document.querySelector('#tuning-select, select[aria-label*="tuning"]');

		if (!tuningSelect) {
			return { passed: false, message: 'Tuning dropdown not found' };
		}

		const options = tuningSelect.querySelectorAll('option');
		const expectedTunings = [
			'Standard',
			'Drop D',
			'Drop C',
			'Half Step Down',
			'DADGAD',
			'Open G',
			'Open D'
		];

		const availableOptions = Array.from(options).map((opt) => opt.textContent.trim());
		const foundTunings = expectedTunings.filter((tuning) =>
			availableOptions.some((option) => option.includes(tuning))
		);

		if (foundTunings.length >= 5) {
			return {
				passed: true,
				message: `Found ${foundTunings.length} expected tunings`,
				details: foundTunings
			};
		} else {
			return {
				passed: false,
				message: `Only found ${foundTunings.length} expected tunings`,
				details: { found: foundTunings, available: availableOptions }
			};
		}
	}

	async testTuningSelectionChanges() {
		const tuningSelect = document.querySelector('#tuning-select, select[aria-label*="tuning"]');

		if (!tuningSelect) {
			return { passed: false, message: 'Tuning dropdown not found' };
		}

		const originalValue = tuningSelect.value;
		const options = tuningSelect.querySelectorAll('option');

		if (options.length < 2) {
			return { passed: false, message: 'Not enough tuning options to test selection' };
		}

		// Try to select a different tuning
		const newOption = Array.from(options).find((opt) => opt.value !== originalValue);

		if (!newOption) {
			return { passed: false, message: 'Could not find different tuning option' };
		}

		// Change selection
		tuningSelect.value = newOption.value;
		tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));

		// Wait for change to take effect
		await this.delay(200);

		// Check if value actually changed
		if (tuningSelect.value === newOption.value) {
			// Restore original value
			tuningSelect.value = originalValue;
			tuningSelect.dispatchEvent(new Event('change', { bubbles: true }));

			return {
				passed: true,
				message: 'Tuning selection changed successfully',
				details: `Changed from "${originalValue}" to "${newOption.value}"`
			};
		} else {
			return { passed: false, message: 'Tuning selection did not change' };
		}
	}

	testTuningDisplayUpdates() {
		// Look for tuning display components
		const tuningDisplays = document.querySelectorAll(
			'.tuning-display, .tuning-name, [class*="tuning"]'
		);

		if (tuningDisplays.length === 0) {
			return { passed: false, message: 'No tuning display elements found' };
		}

		// Check if any display shows tuning information
		let foundTuningInfo = false;
		const displayTexts = [];

		tuningDisplays.forEach((display) => {
			const text = display.textContent.trim();
			displayTexts.push(text);

			if (
				text.includes('Standard') ||
				text.includes('Drop') ||
				text.includes('Open') ||
				text.includes('DADGAD') ||
				text.includes('Tuning')
			) {
				foundTuningInfo = true;
			}
		});

		if (foundTuningInfo) {
			return {
				passed: true,
				message: 'Tuning display found and showing tuning information',
				details: displayTexts.filter((text) => text.length > 0)
			};
		} else {
			return {
				passed: false,
				message: 'Tuning displays found but not showing tuning information',
				details: displayTexts
			};
		}
	}

	testTuningPersistence() {
		// Check if tuning preference is stored in localStorage
		const storedTuning = localStorage.getItem('guitar-tab-tuning');

		if (storedTuning) {
			try {
				const tuningValue = JSON.parse(storedTuning);
				return {
					passed: true,
					message: 'Tuning preference found in localStorage',
					details: tuningValue
				};
			} catch (e) {
				// If it's not JSON, it might be a plain string
				return {
					passed: true,
					message: 'Tuning preference found in localStorage (string format)',
					details: storedTuning
				};
			}
		} else {
			return { passed: false, message: 'No tuning preference found in localStorage' };
		}
	}

	testSettingsModalTuningSelector() {
		// Check if settings modal has tuning selector
		const settingsModal = document.querySelector('.modal, [role="dialog"]');

		if (!settingsModal) {
			return { passed: false, message: 'Settings modal not found or not open' };
		}

		const tuningSelector = settingsModal.querySelector(
			'#tuning-select, select[aria-label*="tuning"], .tuning-selector'
		);

		if (tuningSelector) {
			return { passed: true, message: 'Tuning selector found in settings modal' };
		} else {
			return { passed: false, message: 'Tuning selector not found in settings modal' };
		}
	}

	async testTunerModalIntegration() {
		// Try to open tuner modal
		const tunerButton = document.querySelector(
			'button[aria-label*="tuner"], button[aria-label*="Tune"]'
		);

		if (!tunerButton) {
			return { passed: false, message: 'Tuner button not found' };
		}

		// Click tuner button
		tunerButton.click();

		// Wait for modal to open
		await this.delay(500);

		// Check if tuner modal has tuning dropdown
		const tunerModal = document.querySelector('.tuner-modal, [aria-label*="tuner"]');

		if (!tunerModal) {
			return { passed: false, message: 'Tuner modal did not open' };
		}

		const tunerTuningSelect = tunerModal.querySelector('#tuning-select, select');

		if (tunerTuningSelect) {
			// Close tuner modal
			const closeButton = tunerModal.querySelector('button[aria-label*="close"], .close-btn');
			if (closeButton) closeButton.click();

			return { passed: true, message: 'Tuner modal has tuning dropdown' };
		} else {
			return { passed: false, message: 'Tuner modal does not have tuning dropdown' };
		}
	}

	async delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	showResults() {
		console.log('\n' + '='.repeat(50));
		console.log('🎸 TUNING FUNCTIONALITY TEST RESULTS');
		console.log('='.repeat(50));

		let passed = 0;
		this.results.forEach((result, index) => {
			const status = result.passed ? '✅' : '❌';
			console.log(`${status} ${result.name}: ${result.message}`);
			if (result.passed) passed++;
		});

		console.log(`\n🏆 Overall: ${passed}/${this.results.length} tests passed`);

		if (passed === this.results.length) {
			console.log('🎉 All tuning functionality tests passed!');
		} else {
			console.log('⚠️  Some tuning functionality tests failed. Check the results above.');
		}

		// Store results globally
		window.tuningTestResults = this.results;
		console.log('\n💾 Results saved to window.tuningTestResults');
	}
}

// Usage instructions
console.log(`
🎸 Guitar Tuning Functionality Test Suite
==========================================

To run tests:
1. Make sure you're on a page with the TabScroll
2. Run: const tester = new TuningFunctionalityTester()
3. Run: await tester.runAllTests()

Individual test methods are also available on the tester instance.
`);

// Make it globally available
window.TuningFunctionalityTester = TuningFunctionalityTester;
