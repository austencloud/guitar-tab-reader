/**
 * Auto-Scroll Testing Script
 * Run this in the browser console to systematically test auto-scroll functionality
 */

class AutoScrollTester {
	constructor() {
		this.results = [];
		this.currentTest = 0;
		this.tests = [
			{ name: 'Minimum Speed (1 px/s)', speed: 1, duration: 3000 },
			{ name: 'Low Speed (2.5 px/s)', speed: 2.5, duration: 3000 },
			{ name: 'Medium Speed (20 px/s)', speed: 20, duration: 2000 },
			{ name: 'High Speed (50 px/s)', speed: 50, duration: 2000 },
			{ name: 'Maximum Speed (100 px/s)', speed: 100, duration: 1000 },
			{ name: 'Fractional Speed (0.5 px/s)', speed: 0.5, duration: 5000 }
		];
	}

	async runAllTests() {
		console.log('🚀 Starting Auto-Scroll Test Suite...');
		console.log('Make sure you have a tab loaded with scrollable content!');

		// Wait for user to confirm
		if (!confirm('Ready to start auto-scroll tests? Make sure a tab is loaded.')) {
			return;
		}

		for (let i = 0; i < this.tests.length; i++) {
			await this.runSingleTest(this.tests[i], i + 1);
			if (i < this.tests.length - 1) {
				await this.waitForUser(`Test ${i + 1} complete. Ready for next test?`);
			}
		}

		this.showResults();
	}

	async runSingleTest(test, testNumber) {
		console.log(`\n📋 Test ${testNumber}/${this.tests.length}: ${test.name}`);

		const startTime = Date.now();
		const startPosition = this.getScrollPosition();

		// Set speed and start scrolling
		this.setScrollSpeed(test.speed);
		await this.delay(100); // Let speed setting take effect

		this.startScrolling();
		console.log(`⏱️  Scrolling at ${test.speed} px/s for ${test.duration}ms...`);

		// Wait for test duration
		await this.delay(test.duration);

		const endPosition = this.getScrollPosition();
		const actualDuration = Date.now() - startTime;
		const expectedDistance = (test.speed * actualDuration) / 1000;
		const actualDistance = endPosition - startPosition;
		const accuracy = Math.abs(1 - actualDistance / expectedDistance) * 100;

		this.stopScrolling();

		const result = {
			test: test.name,
			speed: test.speed,
			expectedDistance: expectedDistance.toFixed(2),
			actualDistance: actualDistance.toFixed(2),
			accuracy: accuracy.toFixed(1) + '%',
			passed: accuracy < 10 && actualDistance > 0 // Pass if within 10% and actually moved
		};

		this.results.push(result);

		console.log(`📊 Expected: ${result.expectedDistance}px, Actual: ${result.actualDistance}px`);
		console.log(`🎯 Accuracy: ${result.accuracy} - ${result.passed ? '✅ PASS' : '❌ FAIL'}`);

		return result;
	}

	async testSpeedChanges() {
		console.log('\n🔄 Testing Dynamic Speed Changes...');

		if (!confirm('Ready to test dynamic speed changes during scrolling?')) {
			return;
		}

		this.setScrollSpeed(10);
		this.startScrolling();

		const speeds = [10, 50, 5, 80, 1, 100, 20];

		for (let i = 0; i < speeds.length; i++) {
			console.log(`🎛️  Changing speed to ${speeds[i]} px/s`);
			this.setScrollSpeed(speeds[i]);
			await this.delay(1000);
		}

		this.stopScrolling();
		console.log('✅ Dynamic speed change test complete');
	}

	// Helper methods to interact with the app
	setScrollSpeed(speed) {
		const slider = document.querySelector('input[type="range"][aria-label="Scroll speed"]');
		if (slider) {
			slider.value = speed;
			slider.dispatchEvent(new Event('input', { bubbles: true }));
		} else {
			console.warn('⚠️  Speed slider not found');
		}
	}

	startScrolling() {
		const playButton = document.querySelector('button[aria-label="Start auto-scroll"]');
		if (playButton && !playButton.disabled) {
			playButton.click();
		} else {
			console.warn('⚠️  Play button not found or disabled');
		}
	}

	stopScrolling() {
		const pauseButton = document.querySelector('button[aria-label="Pause auto-scroll"]');
		if (pauseButton) {
			pauseButton.click();
		} else {
			console.warn('⚠️  Pause button not found');
		}
	}

	getScrollPosition() {
		const container = document.querySelector('.tab-content') || document.querySelector('main');
		return container ? container.scrollTop : 0;
	}

	async delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async waitForUser(message) {
		return new Promise((resolve) => {
			setTimeout(() => {
				if (confirm(message)) {
					resolve();
				} else {
					resolve();
				}
			}, 500);
		});
	}

	showResults() {
		console.log('\n📈 TEST RESULTS SUMMARY');
		console.log('========================');

		let passed = 0;
		this.results.forEach((result, index) => {
			const status = result.passed ? '✅' : '❌';
			console.log(`${status} ${result.test}: ${result.accuracy} accuracy`);
			if (result.passed) passed++;
		});

		console.log(`\n🏆 Overall: ${passed}/${this.results.length} tests passed`);

		if (passed === this.results.length) {
			console.log('🎉 All tests passed! Auto-scroll is working correctly.');
		} else {
			console.log('⚠️  Some tests failed. Check the results above.');
		}

		// Export results for further analysis
		window.autoScrollTestResults = this.results;
		console.log('\n💾 Results saved to window.autoScrollTestResults');
	}
}

// Usage instructions
console.log(`
🧪 Auto-Scroll Testing Suite
============================

To run tests:
1. Load a tab with scrollable content
2. Run: const tester = new AutoScrollTester()
3. Run: await tester.runAllTests()
4. Optional: await tester.testSpeedChanges()

Individual methods:
- tester.runSingleTest(test, number)
- tester.testSpeedChanges()
- tester.showResults()
`);

// Make it globally available
window.AutoScrollTester = AutoScrollTester;
