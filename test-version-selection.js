// Test script to verify version detection and recommendation system

async function testVersionSelection() {
	console.log('🧪 Testing version selection system...\n');

	// Test 1: Search for a song with multiple versions
	console.log('Test 1: Searching for "Basket Case" by Green Day');
	console.log('-----------------------------------------------');

	try {
		const response = await fetch('http://localhost:5001/api/scrape-title', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ song: 'Basket Case', artist: 'Green Day' })
		});

		const data = await response.json();

		if (data.success) {
			console.log(`✅ Found ${data.tabs.length} tabs\n`);

			// Show first 5 with ratings
			console.log('First 5 versions with ratings:\n');
			data.tabs.slice(0, 5).forEach((tab, i) => {
				console.log(`${i + 1}. ${tab.title}`);
				console.log(`   Type: ${tab.type}`);
				console.log(`   Rating: ${tab.rating || 'N/A'}/5`);
				console.log(`   Votes: ${tab.votes || 'N/A'}`);
				console.log(`   URL: ${tab.url}\n`);
			});

			// Calculate quality scores
			const { getRecommendedTab, calculateQualityScore } = await import(
				'./src/lib/utils/tabVersions.ts'
			);

			console.log('Quality scores:');
			data.tabs.slice(0, 5).forEach((tab) => {
				const score = calculateQualityScore(tab.rating, tab.votes);
				console.log(`  ${tab.title}: ${score}`);
			});

			const recommended = getRecommendedTab(data.tabs);
			console.log(`\n🌟 Recommended version: ${recommended.title}`);
			console.log(`   Rating: ${recommended.rating}/5, Votes: ${recommended.votes}`);
		} else {
			console.error('❌ Failed to fetch tabs:', data.error);
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
		console.log('\n💡 Make sure the dev server is running: npm run dev');
	}
}

testVersionSelection();
