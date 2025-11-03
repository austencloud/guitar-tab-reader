/**
 * Test script to check what tabs are returned for Green Day
 */

const API_URL = 'http://localhost:5001/api/scrape-artist';

async function testGreenDay() {
	console.log('🔍 Testing scrape-artist for Green Day...\n');

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ artistName: 'Green Day' })
		});

		const data = await response.json();

		if (!data.success) {
			console.error('❌ API request failed:', data.error);
			return;
		}

		console.log(`✅ Found ${data.count} total tabs for Green Day\n`);
		console.log('First 20 tabs:');
		console.log('─'.repeat(80));

		data.tabs.slice(0, 20).forEach((tab, i) => {
			console.log(`${(i + 1).toString().padStart(2)}. ${tab.title.padEnd(40)} (${tab.type})`);
		});

		console.log('\n' + '─'.repeat(80));
		console.log('🔍 Searching for "Basket Case"...\n');

		const basketCase = data.tabs.find(t =>
			t.title.toLowerCase().includes('basket')
		);

		if (basketCase) {
			console.log('✅ Found Basket Case:');
			console.log(`   Title: ${basketCase.title}`);
			console.log(`   Type: ${basketCase.type}`);
			console.log(`   URL: ${basketCase.url}`);
		} else {
			console.log('❌ Basket Case NOT found in scraped results');
			console.log('\nAll tab titles (to check if naming is different):');
			data.tabs.forEach((tab, i) => {
				console.log(`${(i + 1).toString().padStart(3)}. ${tab.title}`);
			});
		}

	} catch (error) {
		console.error('❌ Error:', error.message);
	}
}

// Check if server is running
fetch('http://localhost:5001/')
	.then(() => {
		console.log('✓ Server is running!\n');
		testGreenDay();
	})
	.catch(() => {
		console.log('❌ Server is not running!');
		console.log('Please start the dev server first: npm run dev -- --port 5001\n');
		process.exit(1);
	});
