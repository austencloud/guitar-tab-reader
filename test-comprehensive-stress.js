/**
 * COMPREHENSIVE STRESS TEST SUITE
 * Tests various edge cases and challenging scenarios to identify weaknesses
 */

const TEST_CATEGORIES = {
	// Category 1: Single-word ambiguous terms (hardest case)
	SINGLE_WORD_AMBIGUOUS: [
		{ query: 'Ghost', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Band "Ghost" vs song "Ghost"' },
		{ query: 'Angel', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Band "Angel" vs very common song title' },
		{ query: 'Home', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Band "Home" vs very common song title' },
		{ query: 'Dream', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Could be artist or song fragment' },
		{ query: 'Hero', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Common song title' },
		{ query: 'Believer', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Band vs song title' },
		{ query: 'Paradise', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Very common song title' },
		{ query: 'Thunder', type: 'artist_or_song', expectedAmbiguous: true, notes: 'Common rock song title' },
	],

	// Category 2: Typos and misspellings
	TYPOS_MISSPELLINGS: [
		{ query: 'Nirvanna', type: 'typo', expectedAmbiguous: true, notes: 'Misspelling of Nirvana' },
		{ query: 'Metalica', type: 'typo', expectedAmbiguous: true, notes: 'Misspelling of Metallica' },
		{ query: 'Led Zeplin', type: 'typo', expectedAmbiguous: true, notes: 'Misspelling of Led Zeppelin' },
		{ query: 'Jimi Hendix', type: 'typo', expectedAmbiguous: true, notes: 'Misspelling of Jimi Hendrix' },
		{ query: 'Linkin Parc', type: 'typo', expectedAmbiguous: true, notes: 'Misspelling of Linkin Park' },
	],

	// Category 3: Band abbreviations
	ABBREVIATIONS: [
		{ query: 'RHCP', type: 'abbreviation', expectedAmbiguous: false, notes: 'Red Hot Chili Peppers abbreviation' },
		{ query: 'RATM', type: 'abbreviation', expectedAmbiguous: false, notes: 'Rage Against the Machine' },
		{ query: 'SOAD', type: 'abbreviation', expectedAmbiguous: false, notes: 'System of a Down' },
		{ query: 'GNR', type: 'abbreviation', expectedAmbiguous: false, notes: 'Guns N Roses' },
		{ query: 'ACDC', type: 'abbreviation', expectedAmbiguous: false, notes: 'AC/DC' },
	],

	// Category 4: Partial song names (incomplete queries)
	PARTIAL_NAMES: [
		{ query: 'Stairway', type: 'partial', expectedAmbiguous: true, notes: 'Likely "Stairway to Heaven"' },
		{ query: 'Smells Like', type: 'partial', expectedAmbiguous: true, notes: 'Likely "Smells Like Teen Spirit"' },
		{ query: 'Bohemian', type: 'partial', expectedAmbiguous: true, notes: 'Likely "Bohemian Rhapsody"' },
		{ query: 'Sweet Child', type: 'partial', expectedAmbiguous: true, notes: 'Likely "Sweet Child O Mine"' },
		{ query: 'Hotel Calif', type: 'partial', expectedAmbiguous: true, notes: 'Likely "Hotel California"' },
	],

	// Category 5: Songs with version specifications
	VERSION_SPECS: [
		{ query: 'Wonderwall acoustic', type: 'version_spec', expectedAmbiguous: false, notes: 'Song with version type' },
		{ query: 'Hotel California live', type: 'version_spec', expectedAmbiguous: false, notes: 'Live version specification' },
		{ query: 'Hurt unplugged', type: 'version_spec', expectedAmbiguous: false, notes: 'Unplugged version' },
		{ query: 'Layla acoustic version', type: 'version_spec', expectedAmbiguous: false, notes: 'Full acoustic specification' },
	],

	// Category 6: Featured artists and collaborations
	COLLABORATIONS: [
		{ query: 'Smells Like Teen Spirit feat. Nirvana', type: 'collab', expectedAmbiguous: false, notes: 'With featured artist' },
		{ query: 'Under Pressure Queen David Bowie', type: 'collab', expectedAmbiguous: false, notes: 'Two artists collaboration' },
		{ query: 'Numb Linkin Park ft. Jay-Z', type: 'collab', expectedAmbiguous: true, notes: 'Remix with featured artist' },
	],

	// Category 7: Obscure/rare songs (likely to have poor MusicBrainz data)
	OBSCURE: [
		{ query: 'Rule 1 Magic', type: 'obscure', expectedAmbiguous: true, notes: 'Very obscure song' },
		{ query: 'Zzyzx Rd', type: 'obscure', expectedAmbiguous: true, notes: 'Obscure Stone Sour song' },
		{ query: 'Lateralus Parabola', type: 'obscure', expectedAmbiguous: true, notes: 'Tool deep cut' },
	],

	// Category 8: Clear, unambiguous queries (should work perfectly)
	CLEAR_UNAMBIGUOUS: [
		{ query: 'Wonderwall by Oasis', type: 'clear', expectedAmbiguous: false, notes: 'Perfect format' },
		{ query: 'Green Day Basket Case', type: 'clear', expectedAmbiguous: false, notes: 'Artist + song' },
		{ query: 'Metallica - Enter Sandman', type: 'clear', expectedAmbiguous: false, notes: 'Artist - song format' },
		{ query: 'Fish in a Birdcage', type: 'clear', expectedAmbiguous: false, notes: 'Unique artist name' },
	],

	// Category 9: Numbers and special characters
	SPECIAL_CHARS: [
		{ query: '1979', type: 'special', expectedAmbiguous: true, notes: 'Song by Smashing Pumpkins - just a number' },
		{ query: '3 Doors Down', type: 'special', expectedAmbiguous: false, notes: 'Band name with number' },
		{ query: 'Blink-182', type: 'special', expectedAmbiguous: false, notes: 'Band name with hyphen and number' },
		{ query: '21 Guns', type: 'special', expectedAmbiguous: true, notes: 'Number in song title' },
	],

	// Category 10: Very common single words (highest ambiguity)
	ULTRA_COMMON: [
		{ query: 'Love', type: 'ultra_common', expectedAmbiguous: true, notes: 'Extremely common word' },
		{ query: 'Life', type: 'ultra_common', expectedAmbiguous: true, notes: 'Extremely common word' },
		{ query: 'Time', type: 'ultra_common', expectedAmbiguous: true, notes: 'Extremely common word' },
		{ query: 'Night', type: 'ultra_common', expectedAmbiguous: true, notes: 'Extremely common word' },
		{ query: 'Run', type: 'ultra_common', expectedAmbiguous: true, notes: 'Extremely common word' },
	],

	// Category 11: Genre-specific terms
	GENRE_TERMS: [
		{ query: 'Blues', type: 'genre', expectedAmbiguous: true, notes: 'Could be genre or song/artist' },
		{ query: 'Jazz', type: 'genre', expectedAmbiguous: true, notes: 'Could be genre or artist name' },
		{ query: 'Metal', type: 'genre', expectedAmbiguous: true, notes: 'Could be genre or part of band name' },
	],

	// Category 12: Proper nouns and names
	PROPER_NOUNS: [
		{ query: 'Lucy', type: 'proper_noun', expectedAmbiguous: true, notes: 'Common name in songs' },
		{ query: 'Caroline', type: 'proper_noun', expectedAmbiguous: true, notes: 'Common name in songs' },
		{ query: 'Maria', type: 'proper_noun', expectedAmbiguous: true, notes: 'Common name in songs' },
		{ query: 'Johnny', type: 'proper_noun', expectedAmbiguous: true, notes: 'Common name in songs' },
	]
};

async function testSmartImport(query) {
	try {
		const response = await fetch('http://localhost:5001/api/smart-import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		});
		return await response.json();
	} catch (error) {
		return { error: error.message };
	}
}

async function runStressTests() {
	console.log('🔥 COMPREHENSIVE STRESS TEST SUITE\n');
	console.log('=' .repeat(80));
	console.log('Testing edge cases and challenging scenarios\n');

	const results = {
		byCategory: {},
		totalTests: 0,
		totalPassed: 0,
		totalFailed: 0,
		totalErrors: 0,
		unexpectedBehaviors: [],
		excellentCases: [],
		failedCases: []
	};

	for (const [categoryName, tests] of Object.entries(TEST_CATEGORIES)) {
		console.log(`\n${'='.repeat(80)}`);
		console.log(`📂 CATEGORY: ${categoryName.replace(/_/g, ' ')}`);
		console.log(`${'='.repeat(80)}\n`);

		const categoryResults = {
			total: tests.length,
			passed: 0,
			failed: 0,
			errors: 0,
			details: []
		};

		for (const test of tests) {
			results.totalTests++;
			console.log(`\n📝 Testing: "${test.query}"`);
			console.log(`   Type: ${test.type}`);
			console.log(`   Expected: ${test.expectedAmbiguous ? 'AMBIGUOUS' : 'CLEAR'}`);
			console.log(`   Notes: ${test.notes}`);

			const result = await testSmartImport(test.query);

			if (result.error) {
				console.log(`   ❌ ERROR: ${result.error}`);
				categoryResults.errors++;
				results.totalErrors++;
				results.failedCases.push({
					category: categoryName,
					query: test.query,
					reason: `Error: ${result.error}`
				});
				continue;
			}

			const isAmbiguous = result.type === 'ambiguous' || result.type === 'ambiguous_with_results';
			const behaviorMatched = isAmbiguous === test.expectedAmbiguous;

			const testDetail = {
				query: test.query,
				type: test.type,
				expectedAmbiguous: test.expectedAmbiguous,
				actualType: result.type,
				behaviorMatched,
				suggestions: result.suggestions || [],
				ambiguityReason: result.ambiguityReason
			};

			categoryResults.details.push(testDetail);

			if (behaviorMatched) {
				console.log(`   ✅ BEHAVIOR MATCHED: Correctly detected as ${isAmbiguous ? 'AMBIGUOUS' : 'CLEAR'}`);
				categoryResults.passed++;
				results.totalPassed++;

				if (isAmbiguous && result.suggestions && result.suggestions.length > 1) {
					console.log(`   ✨ EXCELLENT: Provided ${result.suggestions.length} suggestions`);
					results.excellentCases.push({
						category: categoryName,
						query: test.query,
						suggestions: result.suggestions.length
					});
				}
			} else {
				console.log(`   ⚠️  UNEXPECTED: Expected ${test.expectedAmbiguous ? 'AMBIGUOUS' : 'CLEAR'}, got ${result.type}`);
				categoryResults.failed++;
				results.totalFailed++;
				results.unexpectedBehaviors.push({
					category: categoryName,
					query: test.query,
					expected: test.expectedAmbiguous ? 'AMBIGUOUS' : 'CLEAR',
					actual: result.type,
					reason: result.ambiguityReason
				});
				results.failedCases.push({
					category: categoryName,
					query: test.query,
					reason: `Expected ${test.expectedAmbiguous ? 'ambiguous' : 'clear'} but got ${result.type}`
				});
			}

			if (result.ambiguityReason) {
				console.log(`   Reason: ${result.ambiguityReason}`);
			}

			if (result.suggestions && result.suggestions.length > 0) {
				console.log(`   Suggestions (${result.suggestions.length}):`);
				result.suggestions.slice(0, 3).forEach(s => console.log(`      - ${s}`));
			}

			// Small delay to avoid overwhelming the API
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		results.byCategory[categoryName] = categoryResults;

		// Category summary
		const successRate = (categoryResults.passed / categoryResults.total * 100).toFixed(1);
		console.log(`\n📊 ${categoryName} SUMMARY:`);
		console.log(`   ✅ Passed: ${categoryResults.passed}/${categoryResults.total} (${successRate}%)`);
		console.log(`   ⚠️  Failed: ${categoryResults.failed}`);
		console.log(`   ❌ Errors: ${categoryResults.errors}`);
	}

	// Overall summary
	console.log('\n' + '='.repeat(80));
	console.log('📊 OVERALL STRESS TEST RESULTS\n');
	console.log(`Total Tests: ${results.totalTests}`);
	console.log(`✅ Passed: ${results.totalPassed} (${(results.totalPassed / results.totalTests * 100).toFixed(1)}%)`);
	console.log(`⚠️  Unexpected Behaviors: ${results.totalFailed} (${(results.totalFailed / results.totalTests * 100).toFixed(1)}%)`);
	console.log(`❌ Errors: ${results.totalErrors} (${(results.totalErrors / results.totalTests * 100).toFixed(1)}%)`);

	// Category performance breakdown
	console.log('\n📈 PERFORMANCE BY CATEGORY:\n');
	for (const [categoryName, categoryResults] of Object.entries(results.byCategory)) {
		const successRate = (categoryResults.passed / categoryResults.total * 100).toFixed(1);
		const icon = successRate >= 90 ? '🟢' : successRate >= 70 ? '🟡' : '🔴';
		console.log(`${icon} ${categoryName.replace(/_/g, ' ').padEnd(30)} ${successRate}% (${categoryResults.passed}/${categoryResults.total})`);
	}

	// Unexpected behaviors detail
	if (results.unexpectedBehaviors.length > 0) {
		console.log('\n⚠️  UNEXPECTED BEHAVIORS DETAIL:\n');
		results.unexpectedBehaviors.forEach((ub, i) => {
			console.log(`${i + 1}. "${ub.query}" (${ub.category})`);
			console.log(`   Expected: ${ub.expected}, Got: ${ub.actual}`);
			console.log(`   Reason: ${ub.reason || 'N/A'}\n`);
		});
	}

	// Excellent cases
	if (results.excellentCases.length > 0) {
		console.log(`\n✨ EXCELLENT CASES (${results.excellentCases.length}):`);
		console.log('   These queries were handled perfectly with multiple suggestions:\n');
		results.excellentCases.slice(0, 10).forEach((ec, i) => {
			console.log(`   ${i + 1}. "${ec.query}" - ${ec.suggestions} suggestions`);
		});
	}

	// Overall grade
	console.log('\n' + '='.repeat(80));
	const successRate = results.totalPassed / results.totalTests;
	let grade;
	if (successRate >= 0.95) grade = '🏆 A+ (Exceptional)';
	else if (successRate >= 0.90) grade = '🥇 A (Excellent)';
	else if (successRate >= 0.80) grade = '🥈 B (Good)';
	else if (successRate >= 0.70) grade = '🥉 C (Fair)';
	else grade = '😞 D (Needs Work)';

	console.log(`\n🎓 OVERALL GRADE: ${grade}`);
	console.log(`   Success rate: ${(successRate * 100).toFixed(1)}%`);

	// Recommendations
	console.log('\n💡 RECOMMENDATIONS:\n');

	// Find weakest categories
	const weakCategories = Object.entries(results.byCategory)
		.map(([name, data]) => ({ name, successRate: data.passed / data.total }))
		.filter(c => c.successRate < 0.8)
		.sort((a, b) => a.successRate - b.successRate);

	if (weakCategories.length > 0) {
		console.log('   Focus areas for improvement:');
		weakCategories.forEach(cat => {
			console.log(`   - ${cat.name.replace(/_/g, ' ')}: ${(cat.successRate * 100).toFixed(1)}% success rate`);
		});
	} else {
		console.log('   🎉 All categories performing at 80%+ success rate!');
	}

	console.log('\n' + '='.repeat(80));

	return results;
}

// Run the tests
console.log('Starting comprehensive stress test in 2 seconds...');
console.log('Make sure your dev server is running on http://localhost:5001\n');

setTimeout(() => {
	runStressTests().catch(console.error);
}, 2000);
