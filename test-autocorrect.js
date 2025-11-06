/**
 * Test script for auto-correction feature
 * Tests that typos with single corrections are automatically fixed
 */

async function testAutoCorrect(query, expectedCorrection) {
	console.log(`\nTesting: "${query}"`);
	console.log('-'.repeat(80));

	try {
		const response = await fetch('http://localhost:5001/api/smart-import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		});

		const data = await response.json();

		console.log('Response type:', data.type);

		if (data.autoCorrection) {
			console.log(`✅ Auto-corrected: "${data.autoCorrection.from}" → "${data.autoCorrection.to}"`);
			console.log(`   Expected: "${expectedCorrection}"`);

			if (data.autoCorrection.to === expectedCorrection) {
				console.log('   ✅ Correction matches expected value!');
				return true;
			} else {
				console.log('   ❌ Correction does not match expected value');
				return false;
			}
		} else if (data.type === 'ambiguous') {
			console.log('❌ No auto-correction applied');
			console.log(`   Ambiguity reason: ${data.ambiguityReason}`);
			console.log(`   Suggestions: ${data.suggestions?.join(', ')}`);
			return false;
		} else {
			console.log('✅ Query processed directly (no typo detected)');
			return true;
		}

	} catch (error) {
		console.log(`❌ Error: ${error.message}`);
		return false;
	}
}

async function runTests() {
	console.log('🧪 Testing Auto-Correction Feature\n');
	console.log('='.repeat(80));

	const tests = [
		// Typos that should be auto-corrected
		{ query: 'Beatels', expectedCorrection: 'The Beatles', shouldCorrect: true },
		{ query: 'Mettalica', expectedCorrection: 'Metallica', shouldCorrect: true },
		{ query: 'Nirvan', expectedCorrection: 'Nirvana', shouldCorrect: true },

		// Normal queries (no correction needed)
		{ query: 'Hello', expectedCorrection: null, shouldCorrect: false },
		{ query: 'Yesterday', expectedCorrection: null, shouldCorrect: false }
	];

	const results = {
		passed: 0,
		failed: 0
	};

	for (const test of tests) {
		const passed = await testAutoCorrect(test.query, test.expectedCorrection);
		if (passed) {
			results.passed++;
		} else {
			results.failed++;
		}

		// Delay to avoid rate limiting
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	console.log('\n\n' + '='.repeat(80));
	console.log('📊 TEST SUMMARY');
	console.log('='.repeat(80));
	console.log(`Total: ${tests.length}`);
	console.log(`✅ Passed: ${results.passed}`);
	console.log(`❌ Failed: ${results.failed}`);
	console.log('='.repeat(80));

	process.exit(results.failed === 0 ? 0 : 1);
}

runTests().catch(console.error);
