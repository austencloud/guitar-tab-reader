/**
 * Stress test for smart import with vague single-word song titles
 * Tests that the AI properly identifies famous single-word songs as SINGLE_TAB_IMPORT
 * instead of marking them as AMBIGUOUS
 */

const testCases = [
	// Famous single-word songs
	{ query: 'Hello', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Hello', artist: 'Adele (or others)' },
	{ query: 'Yesterday', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Yesterday', artist: 'The Beatles (or others)' },
	{ query: 'Hallelujah', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Hallelujah', artist: 'Leonard Cohen / Jeff Buckley' },
	{ query: 'Creep', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Creep', artist: 'Radiohead (or others)' },
	{ query: 'Wonderwall', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Wonderwall', artist: 'Oasis' },
	{ query: 'Everlong', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Everlong', artist: 'Foo Fighters' },
	{ query: 'Blackbird', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Blackbird', artist: 'The Beatles' },
	{ query: 'Clocks', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Clocks', artist: 'Coldplay' },
	{ query: 'Glycerine', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Glycerine', artist: 'Bush' },
	{ query: 'Iris', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Iris', artist: 'Goo Goo Dolls' },

	// Ambiguous cases (could be band name or less famous)
	{ query: 'Hurt', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Hurt', artist: 'Nine Inch Nails / Johnny Cash' },
	{ query: 'Dreams', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Dreams', artist: 'Fleetwood Mac (or others)' },
	{ query: 'Monster', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Monster', artist: 'Various artists' },
	{ query: 'Superman', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Superman', artist: 'Various artists' },

	// Edge cases - very common words
	{ query: 'Home', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Home', artist: 'Various artists' },
	{ query: 'Tonight', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Tonight', artist: 'Various artists' },
	{ query: 'Stay', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Stay', artist: 'Various artists' },
	{ query: 'Smile', expectedType: 'SINGLE_TAB_IMPORT', expectedSong: 'Smile', artist: 'Various artists' },

	// Proper artist names (should be ARTIST_BULK_IMPORT)
	{ query: 'Metallica', expectedType: 'ARTIST_BULK_IMPORT', expectedArtist: 'Metallica' },
	{ query: 'Nirvana', expectedType: 'ARTIST_BULK_IMPORT', expectedArtist: 'Nirvana' },
	{ query: 'Beatles', expectedType: 'ARTIST_BULK_IMPORT', expectedArtist: 'Beatles' },

	// Genuinely vague (should be AMBIGUOUS)
	{ query: 'guitar tabs', expectedType: 'AMBIGUOUS', reason: 'Too vague' },
	{ query: 'music', expectedType: 'AMBIGUOUS', reason: 'Too vague' },
	{ query: 'that song', expectedType: 'AMBIGUOUS', reason: 'Genuinely unclear' }
];

async function runStressTest() {
	console.log('🧪 Starting Smart Import Stress Test\n');
	console.log('='.repeat(80));

	const results = {
		passed: 0,
		failed: 0,
		total: testCases.length,
		failures: []
	};

	for (let i = 0; i < testCases.length; i++) {
		const testCase = testCases[i];
		console.log(`\n[${i + 1}/${testCases.length}] Testing: "${testCase.query}"`);
		console.log('-'.repeat(80));

		try {
			const response = await fetch('http://localhost:5001/api/smart-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: testCase.query })
			});

			const data = await response.json();

			// Analyze AI response
			let intentType = data.type;
			if (data.success && data.type === 'ambiguous') {
				intentType = 'AMBIGUOUS';
			} else if (data.success && data.type === 'single_tab') {
				intentType = 'SINGLE_TAB_IMPORT';
			} else if (data.success && data.type === 'artist_bulk') {
				intentType = 'ARTIST_BULK_IMPORT';
			} else if (!data.success) {
				intentType = 'ERROR';
			}

			const passed = intentType === testCase.expectedType;

			if (passed) {
				console.log(`✅ PASSED`);
				console.log(`   Expected: ${testCase.expectedType}`);
				console.log(`   Got: ${intentType}`);

				if (data._meta) {
					console.log(`   Tokens: ${data._meta.inputTokens} in + ${data._meta.outputTokens} out = ${data._meta.inputTokens + data._meta.outputTokens} total`);
				}

				if (intentType === 'SINGLE_TAB_IMPORT' && data.tab) {
					console.log(`   Song: "${data.tab.title || testCase.expectedSong}"`);
				} else if (intentType === 'ARTIST_BULK_IMPORT' && data.artist) {
					console.log(`   Artist: "${data.artist}"`);
				} else if (intentType === 'AMBIGUOUS' && data.ambiguityReason) {
					console.log(`   Reason: "${data.ambiguityReason}"`);
					if (data.suggestions && data.suggestions.length > 0) {
						console.log(`   Suggestions: ${data.suggestions.slice(0, 3).join(', ')}`);
					}
				}

				results.passed++;
			} else {
				console.log(`❌ FAILED`);
				console.log(`   Expected: ${testCase.expectedType}`);
				console.log(`   Got: ${intentType}`);

				if (intentType === 'AMBIGUOUS' && data.ambiguityReason) {
					console.log(`   Ambiguity Reason: "${data.ambiguityReason}"`);
					if (data.suggestions && data.suggestions.length > 0) {
						console.log(`   Suggestions: ${data.suggestions.join(', ')}`);
					}
				}

				if (data._meta && data._meta.rawResponse) {
					console.log(`   AI Raw Response:\n   ${data._meta.rawResponse.substring(0, 200)}...`);
				}

				results.failed++;
				results.failures.push({
					query: testCase.query,
					expected: testCase.expectedType,
					got: intentType,
					data: data
				});
			}

		} catch (error) {
			console.log(`❌ ERROR: ${error.message}`);
			results.failed++;
			results.failures.push({
				query: testCase.query,
				expected: testCase.expectedType,
				got: 'NETWORK_ERROR',
				error: error.message
			});
		}

		// Small delay to avoid rate limiting
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	// Print summary
	console.log('\n\n' + '='.repeat(80));
	console.log('📊 STRESS TEST SUMMARY');
	console.log('='.repeat(80));
	console.log(`Total Tests: ${results.total}`);
	console.log(`✅ Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
	console.log(`❌ Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);

	if (results.failures.length > 0) {
		console.log('\n🔍 FAILED TEST DETAILS:');
		console.log('-'.repeat(80));
		results.failures.forEach((failure, idx) => {
			console.log(`\n${idx + 1}. "${failure.query}"`);
			console.log(`   Expected: ${failure.expected}`);
			console.log(`   Got: ${failure.got}`);
			if (failure.data && failure.data.ambiguityReason) {
				console.log(`   Reason: ${failure.data.ambiguityReason}`);
			}
		});
	}

	console.log('\n' + '='.repeat(80));
	console.log(results.failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
	console.log('='.repeat(80));

	// Exit with appropriate code
	process.exit(results.failed === 0 ? 0 : 1);
}

// Run the test
runStressTest().catch(error => {
	console.error('❌ Test suite failed:', error);
	process.exit(1);
});
