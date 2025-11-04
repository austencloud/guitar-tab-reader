/**
 * Test script for multi-artist song detection
 * Tests the smart import API's ability to detect when multiple artists have songs with the same title
 */

// List of songs with common titles recorded by multiple artists
const COMMON_SONG_TITLES = [
	{
		title: 'Candy Shop',
		artists: ['50 Cent', 'Andrew Bird'],
		notes: 'Hip-hop hit vs indie folk song'
	},
	{
		title: 'Stay',
		artists: ['Rihanna feat. Mikky Ekko', 'The Kid LAROI & Justin Bieber', 'Shakespears Sister', 'Lisa Loeb'],
		notes: 'Very common title across decades and genres'
	},
	{
		title: 'The One',
		artists: ['Backstreet Boys', 'Elton John', 'Kodaline', 'Shakira'],
		notes: 'Common romantic song title'
	},
	{
		title: 'Crazy',
		artists: ['Gnarls Barkley', 'Patsy Cline', 'Aerosmith', 'Seal', 'Willie Nelson'],
		notes: 'One of the most covered song titles'
	},
	{
		title: 'Home',
		artists: ['Phillip Phillips', 'Michael Bublé', 'Edward Sharpe & The Magnetic Zeros', 'Three Days Grace'],
		notes: 'Universal theme, many interpretations'
	},
	{
		title: 'Angel',
		artists: ['Sarah McLachlan', 'Shaggy', 'Aerosmith', 'Jack Johnson', 'The Weeknd'],
		notes: 'Another extremely common title'
	},
	{
		title: 'Ghost',
		artists: ['Justin Bieber', 'Ella Henderson', 'Halsey', 'Bad Flower'],
		notes: 'Modern pop favorite'
	},
	{
		title: 'Monsters',
		artists: ['James Blunt', 'All Time Low feat. blackbear', 'Shinedown', 'Ruelle'],
		notes: 'Popular in rock and pop'
	},
	{
		title: 'Breathe',
		artists: ['Faith Hill', 'Pink Floyd', 'Anna Nalick', 'Taylor Swift', 'The Prodigy'],
		notes: 'Spans country, rock, and electronic'
	},
	{
		title: 'Dreams',
		artists: ['Fleetwood Mac', 'The Cranberries', 'Beck', 'Van Halen', 'Gabrielle'],
		notes: 'Classic across multiple eras'
	},
	{
		title: 'Love Song',
		artists: ['Tesla', 'Sara Bareilles', 'The Cure', 'Adele', '311'],
		notes: 'Self-referential title'
	},
	{
		title: 'Hero',
		artists: ['Mariah Carey', 'Enrique Iglesias', 'Chad Kroeger feat. Josey Scott', 'Family of the Year'],
		notes: 'Inspirational theme'
	},
	{
		title: 'Sorry',
		artists: ['Justin Bieber', 'Beyoncé', 'Madonna', 'Buckcherry', 'Tracy Chapman'],
		notes: 'Apology theme across genres'
	},
	{
		title: 'Beautiful',
		artists: ['Christina Aguilera', 'Mariah Carey', 'Carole King', 'Eminem', 'Snoop Dogg feat. Pharrell'],
		notes: 'Common positive descriptor'
	},
	{
		title: 'Runaway',
		artists: ['Bon Jovi', 'Kanye West', 'The Corrs', 'Aurora', 'Del Shannon'],
		notes: 'Escape theme throughout rock history'
	},
	{
		title: 'Believer',
		artists: ['Imagine Dragons', 'Ozzy Osbourne', 'Smash Mouth', 'American Authors'],
		notes: 'Modern rock staple'
	},
	{
		title: 'Waves',
		artists: ['Dean Lewis', 'Mr. Probz', 'Normani feat. 6LACK', 'Kanye West'],
		notes: 'Natural imagery in music'
	},
	{
		title: 'Circles',
		artists: ['Post Malone', 'Hollywood Undead', 'Pierce The Veil', 'Incubus'],
		notes: 'Metaphorical title'
	},
	{
		title: 'Paradise',
		artists: ['Coldplay', 'Sade', 'George Ezra', 'John Prine', 'MEDUZA feat. Dermot Kennedy'],
		notes: 'Aspirational theme'
	},
	{
		title: 'Changes',
		artists: ['David Bowie', '2Pac', 'Black Sabbath', 'XXXTentacion', 'Hayd'],
		notes: 'Life transition theme'
	}
];

async function testSmartImport(query) {
	try {
		const response = await fetch('http://localhost:5001/api/smart-import', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ query })
		});

		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error testing "${query}":`, error.message);
		return { error: error.message };
	}
}

async function runTests() {
	console.log('🧪 MULTI-ARTIST SONG DETECTION STRESS TEST\n');
	console.log('=' .repeat(80));
	console.log(`Testing ${COMMON_SONG_TITLES.length} common song titles\n`);

	const results = {
		total: COMMON_SONG_TITLES.length,
		detected_as_ambiguous: 0,
		detected_as_single: 0,
		detected_as_artist: 0,
		errors: 0,
		detailed: []
	};

	for (const song of COMMON_SONG_TITLES) {
		console.log(`\n📝 Testing: "${song.title}"`);
		console.log(`   Known artists: ${song.artists.join(', ')}`);
		console.log(`   Notes: ${song.notes}`);

		const result = await testSmartImport(song.title);

		if (result.error) {
			console.log(`   ❌ ERROR: ${result.error}`);
			results.errors++;
			results.detailed.push({
				title: song.title,
				status: 'error',
				error: result.error
			});
			continue;
		}

		const testResult = {
			title: song.title,
			knownArtists: song.artists,
			detectedType: result.type,
			suggestions: result.suggestions || [],
			ambiguityReason: result.ambiguityReason,
			possibleArtist: result.possibleArtist,
			possibleSong: result.possibleSong
		};

		if (result.type === 'ambiguous') {
			console.log(`   ✅ CORRECT: Detected as AMBIGUOUS`);
			console.log(`   Reason: ${result.ambiguityReason}`);

			if (result.suggestions && result.suggestions.length > 0) {
				console.log(`   Suggestions provided (${result.suggestions.length}):`);
				result.suggestions.forEach(s => console.log(`      - ${s}`));

				// Check if suggestions include multiple artists
				const suggestionArtists = result.suggestions.filter(s => s.includes(' - '));
				if (suggestionArtists.length > 1) {
					console.log(`   ✨ EXCELLENT: Provided ${suggestionArtists.length} artist options`);
					testResult.status = 'excellent';
				} else if (suggestionArtists.length === 1) {
					console.log(`   ⚠️  PARTIAL: Only provided 1 artist option (expected multiple)`);
					testResult.status = 'partial';
				} else {
					console.log(`   ⚠️  INCOMPLETE: No artist-specific suggestions provided`);
					testResult.status = 'incomplete';
				}
			} else {
				console.log(`   ⚠️  WARNING: No suggestions provided`);
				testResult.status = 'no_suggestions';
			}

			results.detected_as_ambiguous++;
		} else if (result.type === 'single_tab') {
			console.log(`   ❌ MISSED: Detected as SINGLE_TAB_IMPORT`);
			console.log(`   Artist assumed: ${result.tab?.artist || 'unknown'}`);
			testResult.status = 'missed';
			results.detected_as_single++;
		} else if (result.type === 'artist_bulk') {
			console.log(`   ❌ MISSED: Detected as ARTIST_BULK_IMPORT`);
			console.log(`   Artist assumed: ${result.artist || 'unknown'}`);
			testResult.status = 'missed';
			results.detected_as_artist++;
		} else {
			console.log(`   ❓ UNKNOWN: ${result.type}`);
			testResult.status = 'unknown';
		}

		results.detailed.push(testResult);

		// Small delay to avoid overwhelming the API
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// Print summary
	console.log('\n' + '='.repeat(80));
	console.log('📊 SUMMARY\n');
	console.log(`Total tests: ${results.total}`);
	console.log(`✅ Detected as ambiguous: ${results.detected_as_ambiguous} (${Math.round(results.detected_as_ambiguous / results.total * 100)}%)`);
	console.log(`❌ Detected as single tab: ${results.detected_as_single} (${Math.round(results.detected_as_single / results.total * 100)}%)`);
	console.log(`❌ Detected as artist bulk: ${results.detected_as_artist} (${Math.round(results.detected_as_artist / results.total * 100)}%)`);
	console.log(`⚠️  Errors: ${results.errors}`);

	// Breakdown by quality
	const excellent = results.detailed.filter(r => r.status === 'excellent').length;
	const partial = results.detailed.filter(r => r.status === 'partial').length;
	const incomplete = results.detailed.filter(r => r.status === 'incomplete').length;
	const noSuggestions = results.detailed.filter(r => r.status === 'no_suggestions').length;

	if (results.detected_as_ambiguous > 0) {
		console.log(`\n🎯 AMBIGUOUS DETECTION QUALITY:`);
		console.log(`   ✨ Excellent (multiple artists): ${excellent}`);
		console.log(`   ⚠️  Partial (single artist): ${partial}`);
		console.log(`   ⚠️  Incomplete (no artists): ${incomplete}`);
		console.log(`   ⚠️  No suggestions: ${noSuggestions}`);
	}

	// List the ones that were missed
	const missed = results.detailed.filter(r => r.status === 'missed');
	if (missed.length > 0) {
		console.log(`\n❌ MISSED DETECTIONS (${missed.length}):`);
		missed.forEach(m => {
			console.log(`   - "${m.title}" (detected as: ${m.detectedType})`);
			console.log(`     Known artists: ${m.knownArtists.join(', ')}`);
		});
	}

	console.log('\n' + '='.repeat(80));

	// Overall grade
	const successRate = results.detected_as_ambiguous / results.total;
	let grade;
	if (successRate >= 0.9) grade = '🏆 A+ (Excellent)';
	else if (successRate >= 0.8) grade = '🥇 A (Great)';
	else if (successRate >= 0.7) grade = '🥈 B (Good)';
	else if (successRate >= 0.6) grade = '🥉 C (Fair)';
	else grade = '😞 D (Needs Work)';

	console.log(`\n🎓 OVERALL GRADE: ${grade}`);
	console.log(`   Detection rate: ${Math.round(successRate * 100)}%\n`);

	return results;
}

// Run the tests
console.log('Starting test in 2 seconds...');
console.log('Make sure your dev server is running on http://localhost:5001\n');

setTimeout(() => {
	runTests().catch(console.error);
}, 2000);
