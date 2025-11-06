// Test script for "Rule 1 Magic" live search
async function testLiveSearch() {
	console.log('🧪 Testing live search for "Rule 1 Magic"\n');

	// Step 1: Call smart-import (current behavior)
	console.log('Step 1: Current smart-import response');
	const smartImportResponse = await fetch('http://localhost:5001/api/smart-import', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: 'Rule 1 Magic' })
	});
	const smartImportData = await smartImportResponse.json();
	console.log(`Type: ${smartImportData.type}`);
	console.log(`Reason: ${smartImportData.ambiguityReason}`);
	console.log(`Suggestions: ${smartImportData.suggestions?.join(', ')}\n`);

	// Step 2: Simulate what SHOULD happen - live search
	console.log('Step 2: What SHOULD happen - live UG search');
	const searchResponse = await fetch('http://localhost:5001/api/scrape-title', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ song: 'Rule 1 Magic' })
	});
	const searchData = await searchResponse.json();

	if (searchData.success && searchData.tabs?.length > 0) {
		console.log(`✅ Found ${searchData.tabs.length} tabs!\n`);

		// Group by artist
		const artistGroups = new Map();
		searchData.tabs.forEach(tab => {
			const artist = tab.artist || 'Unknown';
			if (!artistGroups.has(artist)) {
				artistGroups.set(artist, []);
			}
			artistGroups.get(artist).push(tab);
		});

		console.log('Artists found:');
		Array.from(artistGroups.entries()).forEach(([artist, tabs]) => {
			console.log(`  • ${artist} (${tabs.length} version${tabs.length > 1 ? 's' : ''})`);
			tabs.slice(0, 2).forEach(tab => {
				const rating = tab.rating ? '⭐'.repeat(tab.rating) : '';
				const votes = tab.votes ? ` (${tab.votes} votes)` : '';
				console.log(`    - ${tab.title} [${tab.type}]${rating}${votes}`);
			});
		});

		console.log('\n📊 COMPARISON:');
		console.log('❌ Current: Generic AI suggestions (not helpful)');
		console.log('✅ With Live Search: Real tabs from actual artists!');
		console.log(`\nThe system found "${Array.from(artistGroups.keys())[0]}" which the AI didn't know about!`);
	} else {
		console.log('❌ No tabs found');
	}
}

testLiveSearch().catch(console.error);
