// Quick test for just "Hello"
async function testHello() {
	console.log('Testing "Hello" query...\n');

	const response = await fetch('http://localhost:5001/api/smart-import', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: 'Hello' })
	});

	const data = await response.json();

	console.log('Response:', JSON.stringify(data, null, 2));

	if (data._meta) {
		console.log('\nAI Analysis:');
		console.log(data._meta.rawResponse);
	}
}

testHello().catch(console.error);
