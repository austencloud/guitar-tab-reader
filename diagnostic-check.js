/**
 * Diagnostic Check Script
 * Run this in the browser console to identify potential issues
 */

function runDiagnostics() {
	console.log('🔍 Running TabScroll Diagnostics...\n');

	const issues = [];
	const warnings = [];
	const info = [];

	// Check for console errors
	const originalError = console.error;
	const errors = [];
	console.error = (...args) => {
		errors.push(args.join(' '));
		originalError.apply(console, args);
	};

	// 1. Check DOM Elements
	console.log('📋 Checking DOM Elements...');

	const elements = {
		'Tab Content Container': '.tab-content, main',
		'Scroll Controls': '.scroll-controls',
		'Play Button': 'button[aria-label*="auto-scroll"], button[aria-label*="Start"]',
		'Speed Slider': 'input[type="range"][aria-label*="speed"]',
		'Settings Button': 'button[aria-label*="settings"], button[aria-label*="Settings"]',
		'Settings Modal': '.modal, [role="dialog"]'
	};

	Object.entries(elements).forEach(([name, selector]) => {
		const element = document.querySelector(selector);
		if (element) {
			info.push(`✅ ${name}: Found`);
		} else {
			issues.push(`❌ ${name}: Not found (${selector})`);
		}
	});

	// 2. Check Scroll Container
	console.log('\n📜 Checking Scroll Container...');

	const container = document.querySelector('.tab-content') || document.querySelector('main');
	if (container) {
		const scrollHeight = container.scrollHeight;
		const clientHeight = container.clientHeight;
		const isScrollable = scrollHeight > clientHeight;

		info.push(`📏 Container dimensions: ${clientHeight}px visible, ${scrollHeight}px total`);

		if (isScrollable) {
			info.push('✅ Container is scrollable');
		} else {
			warnings.push('⚠️  Container is not scrollable (content fits in viewport)');
		}
	} else {
		issues.push('❌ No scroll container found');
	}

	// 3. Check JavaScript Errors
	console.log('\n🐛 Checking for JavaScript Errors...');

	setTimeout(() => {
		if (errors.length > 0) {
			issues.push(`❌ JavaScript errors detected: ${errors.length}`);
			errors.forEach((error) => console.error('  ', error));
		} else {
			info.push('✅ No JavaScript errors detected');
		}
	}, 1000);

	// 4. Check CSS Variables
	console.log('\n🎨 Checking CSS Variables...');

	const cssVars = [
		'--color-primary',
		'--color-surface',
		'--color-text-primary',
		'--spacing-md',
		'--font-size-base'
	];

	const computedStyle = getComputedStyle(document.documentElement);
	cssVars.forEach((varName) => {
		const value = computedStyle.getPropertyValue(varName);
		if (value.trim()) {
			info.push(`✅ ${varName}: ${value.trim()}`);
		} else {
			warnings.push(`⚠️  ${varName}: Not defined`);
		}
	});

	// 5. Check Local Storage
	console.log('\n💾 Checking Local Storage...');

	try {
		const preferences = localStorage.getItem('guitar-tab-preferences');
		const theme = localStorage.getItem('guitar-tab-theme');

		if (preferences) {
			const prefs = JSON.parse(preferences);
			info.push(
				`✅ Preferences stored: fontSize=${prefs.fontSize}, handedness=${prefs.isLeftHanded ? 'left' : 'right'}`
			);
		} else {
			warnings.push('⚠️  No preferences found in localStorage');
		}

		if (theme) {
			const themeData = JSON.parse(theme);
			info.push(`✅ Theme stored: ${themeData.mode}`);
		} else {
			warnings.push('⚠️  No theme found in localStorage');
		}
	} catch (e) {
		issues.push(`❌ Error reading localStorage: ${e.message}`);
	}

	// 6. Check Performance
	console.log('\n⚡ Checking Performance...');

	const performanceEntries = performance.getEntriesByType('navigation');
	if (performanceEntries.length > 0) {
		const entry = performanceEntries[0];
		const loadTime = entry.loadEventEnd - entry.loadEventStart;

		if (loadTime < 1000) {
			info.push(`✅ Page load time: ${loadTime.toFixed(0)}ms (good)`);
		} else if (loadTime < 3000) {
			warnings.push(`⚠️  Page load time: ${loadTime.toFixed(0)}ms (acceptable)`);
		} else {
			issues.push(`❌ Page load time: ${loadTime.toFixed(0)}ms (slow)`);
		}
	}

	// 7. Check Memory Usage (if available)
	if (performance.memory) {
		const memory = performance.memory;
		const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
		const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);

		info.push(`📊 Memory usage: ${usedMB}MB / ${limitMB}MB`);

		if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
			warnings.push('⚠️  High memory usage detected');
		}
	}

	// Display Results
	setTimeout(() => {
		console.log('\n' + '='.repeat(50));
		console.log('📊 DIAGNOSTIC RESULTS');
		console.log('='.repeat(50));

		if (issues.length === 0 && warnings.length === 0) {
			console.log('🎉 All checks passed! No issues detected.');
		} else {
			if (issues.length > 0) {
				console.log('\n❌ CRITICAL ISSUES:');
				issues.forEach((issue) => console.log(issue));
			}

			if (warnings.length > 0) {
				console.log('\n⚠️  WARNINGS:');
				warnings.forEach((warning) => console.log(warning));
			}
		}

		if (info.length > 0) {
			console.log('\n✅ INFORMATION:');
			info.forEach((item) => console.log(item));
		}

		console.log('\n💡 RECOMMENDATIONS:');

		if (issues.length > 0) {
			console.log('- Fix critical issues first');
			console.log('- Check browser console for detailed error messages');
			console.log('- Verify all components are properly loaded');
		}

		if (warnings.length > 0) {
			console.log('- Address warnings to improve user experience');
			console.log('- Consider optimizing performance if needed');
		}

		console.log('- Run auto-scroll tests: new AutoScrollTester().runAllTests()');
		console.log('- Test settings modal functionality manually');
		console.log('- Verify responsive design on different screen sizes');

		// Store results globally
		window.diagnosticResults = { issues, warnings, info };
		console.log('\n💾 Results saved to window.diagnosticResults');
	}, 1500);
}

// Auto-run diagnostics
console.log('🚀 Starting diagnostics in 2 seconds...');
setTimeout(runDiagnostics, 2000);

// Make function globally available
window.runDiagnostics = runDiagnostics;
