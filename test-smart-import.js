/**
 * Automated Test Suite for Smart Import API
 *
 * This script tests various query patterns to ensure the AI generates
 * actionable suggestions instead of questions.
 */

const API_URL = 'http://localhost:5001/api/smart-import';

// Color codes for console output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	red: '\x1b[31m'
};

// Test cases organized by category
const testCases = [
	{
		category: 'Clear Artist Names (should be ARTIST_BULK_IMPORT)',
		tests: [
			{ query: 'Fish in a Birdcage', expectedType: 'ARTIST_BULK_IMPORT' },
			{ query: 'The Beatles', expectedType: 'ARTIST_BULK_IMPORT' },
			{ query: 'Pink Floyd', expectedType: 'ARTIST_BULK_IMPORT' },
			{ query: 'Metallica', expectedType: 'ARTIST_BULK_IMPORT' }
		]
	},
	{
		category: 'Clear Song Patterns (should be SINGLE_TAB_IMPORT)',
		tests: [
			{ query: 'Wonderwall by Oasis', expectedType: 'SINGLE_TAB_IMPORT' },
			{ query: 'Green Day Basket Case', expectedType: 'SINGLE_TAB_IMPORT' },
			{ query: 'Oasis - Wonderwall', expectedType: 'SINGLE_TAB_IMPORT' },
			{ query: 'Stairway to Heaven', expectedType: 'SINGLE_TAB_IMPORT' }
		]
	},
	{
		category: 'Ambiguous Queries (should have actionable suggestions)',
		tests: [
			{
				query: 'im so tired',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /Beatles.*I'm So Tired|Search for.*I'm So Tired/i
			},
			{
				query: 'Oasis',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /All tabs by Oasis|Search for.*Oasis/i
			},
			{
				query: 'Stairway',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /Led Zeppelin.*Stairway to Heaven|Search for.*Stairway/i
			}
		]
	},
	{
		category: 'Typo Corrections (should suggest corrections)',
		tests: [
			{
				query: 'Beatels',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /Did you mean.*Beatles/i
			},
			{
				query: 'Nirvanna Smells Like Teen Spirit',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /Nirvana/i
			},
			{
				query: 'Metalica',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /Metallica/i
			}
		]
	},
	{
		category: 'Band Abbreviations',
		tests: [
			{ query: 'RHCP Californication', expectedType: 'SINGLE_TAB_IMPORT' },
			{ query: 'RATM', expectedType: 'ARTIST_BULK_IMPORT' },
			{ query: 'ACDC', expectedType: 'ARTIST_BULK_IMPORT' }
		]
	},
	{
		category: 'Version Specifications',
		tests: [
			{ query: 'Wonderwall acoustic', expectedType: 'SINGLE_TAB_IMPORT' },
			{ query: 'Hotel California live', expectedType: 'SINGLE_TAB_IMPORT' }
		]
	},
	{
		category: 'Vague Queries (should provide specific options)',
		tests: [
			{
				query: 'something by Metallica',
				expectedType: 'AMBIGUOUS',
				checkSuggestions: true,
				expectedSuggestionPattern: /All tabs by Metallica|Metallica.*Enter Sandman|Metallica.*Nothing Else Matters/i
			}
		]
	}
];

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function runTest(test) {
	totalTests++;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: test.query })
		});

		const data = await response.json();

		// Check if request succeeded
		if (!data.success && !data.error) {
			throw new Error('API request failed');
		}

		// Determine the actual type
		let actualType = data.type;
		if (data.success && data.type === 'ambiguous') {
			actualType = 'AMBIGUOUS';
		} else if (data.success && data.type === 'artist_bulk') {
			actualType = 'ARTIST_BULK_IMPORT';
		} else if (data.success && data.type === 'single_tab') {
			actualType = 'SINGLE_TAB_IMPORT';
		} else if (data.success && data.type === 'ai_generated') {
			actualType = 'AI_GENERATED';
		}

		// Check type matches
		const typeMatches = actualType === test.expectedType;

		// Check suggestions if needed
		let suggestionsValid = true;
		let suggestionIssues = [];

		if (test.checkSuggestions && data.suggestions) {
			// Check that suggestions are actionable (not questions)
			const questionPatterns = [
				/^Are you looking for/i,
				/^Did you mean to/i,
				/^Do you want/i,
				/^Maybe you meant/i,
				/\?$/
			];

			for (const suggestion of data.suggestions) {
				const isQuestion = questionPatterns.some(pattern => pattern.test(suggestion));
				if (isQuestion) {
					suggestionsValid = false;
					suggestionIssues.push(`❌ Question-like: "${suggestion}"`);
				}
			}

			// Check if suggestions match expected pattern
			if (test.expectedSuggestionPattern) {
				const hasMatchingPattern = data.suggestions.some(s =>
					test.expectedSuggestionPattern.test(s)
				);
				if (!hasMatchingPattern) {
					suggestionsValid = false;
					suggestionIssues.push(`❌ No suggestion matches pattern: ${test.expectedSuggestionPattern}`);
				}
			}
		}

		const testPassed = typeMatches && suggestionsValid;

		if (testPassed) {
			passedTests++;
			console.log(`  ${colors.green}✓${colors.reset} "${test.query}"`);
			console.log(`    Type: ${colors.cyan}${actualType}${colors.reset}`);

			if (data.suggestions && data.suggestions.length > 0) {
				console.log(`    Suggestions: ${colors.blue}${data.suggestions.join(', ')}${colors.reset}`);
			}

			if (data._meta) {
				console.log(`    ${colors.magenta}Tokens: ${data._meta.inputTokens} + ${data._meta.outputTokens} = ${data._meta.inputTokens + data._meta.outputTokens}${colors.reset}`);
			}
		} else {
			failedTests++;
			console.log(`  ${colors.red}✗${colors.reset} "${test.query}"`);
			console.log(`    Expected type: ${colors.yellow}${test.expectedType}${colors.reset}`);
			console.log(`    Actual type: ${colors.red}${actualType}${colors.reset}`);

			if (data.suggestions) {
				console.log(`    Suggestions: ${colors.yellow}${data.suggestions.join(', ')}${colors.reset}`);
			}

			if (suggestionIssues.length > 0) {
				suggestionIssues.forEach(issue => console.log(`    ${issue}`));
			}

			failures.push({
				query: test.query,
				expected: test.expectedType,
				actual: actualType,
				suggestions: data.suggestions,
				issues: suggestionIssues
			});
		}

		console.log(''); // Empty line for readability

	} catch (error) {
		failedTests++;
		console.log(`  ${colors.red}✗${colors.reset} "${test.query}"`);
		console.log(`    ${colors.red}Error: ${error.message}${colors.reset}`);
		console.log('');

		failures.push({
			query: test.query,
			expected: test.expectedType,
			actual: 'ERROR',
			error: error.message
		});
	}
}

async function runAllTests() {
	console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║  Smart Import API - Automated Test Suite                  ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

	for (const category of testCases) {
		console.log(`${colors.bright}${colors.yellow}${category.category}${colors.reset}`);
		console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`);

		for (const test of category.tests) {
			await runTest(test);
			// Small delay to avoid overwhelming the API
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	// Print summary
	console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║  Test Results Summary                                      ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

	console.log(`  Total Tests: ${colors.bright}${totalTests}${colors.reset}`);
	console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
	console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
	console.log(`  Success Rate: ${colors.bright}${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}\n`);

	if (failures.length > 0) {
		console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
		failures.forEach((failure, index) => {
			console.log(`\n  ${index + 1}. "${failure.query}"`);
			console.log(`     Expected: ${failure.expected}`);
			console.log(`     Actual: ${failure.actual}`);
			if (failure.suggestions) {
				console.log(`     Suggestions: ${failure.suggestions.join(', ')}`);
			}
			if (failure.issues && failure.issues.length > 0) {
				failure.issues.forEach(issue => console.log(`     ${issue}`));
			}
			if (failure.error) {
				console.log(`     Error: ${failure.error}`);
			}
		});
		console.log('');
	}

	// Exit with appropriate code
	process.exit(failedTests > 0 ? 1 : 0);
}

// Check if server is running
console.log(`${colors.cyan}Checking if dev server is running at ${API_URL}...${colors.reset}\n`);

fetch('http://localhost:5001/')
	.then(() => {
		console.log(`${colors.green}✓ Server is running!${colors.reset}\n`);
		runAllTests();
	})
	.catch(() => {
		console.log(`${colors.red}✗ Server is not running!${colors.reset}`);
		console.log(`${colors.yellow}Please start the dev server first:${colors.reset}`);
		console.log(`  ${colors.cyan}npm run dev -- --port 5001${colors.reset}\n`);
		process.exit(1);
	});
