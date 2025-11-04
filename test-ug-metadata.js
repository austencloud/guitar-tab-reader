import { chromium } from 'playwright';

async function inspectUGSearchResults() {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();

	// Search for a song with multiple versions - "Basket Case" by Green Day has many versions
	const searchUrl =
		'https://www.ultimate-guitar.com/search.php?search_type=title&value=basket%20case%20green%20day';

	console.log('🔍 Navigating to search results...');
	await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
	await page.waitForTimeout(3000);

	// Scroll once to load more
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(2000);

	console.log('\n📊 Inspecting page structure...');

	// Get sample HTML structure
	const structure = await page.evaluate(() => {
		const results = [];

		// Try different selectors to find the result containers
		const possibleContainers = [
			'article',
			'[class*="search"]',
			'[class*="result"]',
			'[data-type]',
			'[data-name]'
		];

		possibleContainers.forEach((selector) => {
			const elements = document.querySelectorAll(selector);
			if (elements.length > 0) {
				results.push({
					selector: selector,
					count: elements.length,
					sampleHTML: elements[0]?.outerHTML.substring(0, 500)
				});
			}
		});

		// Also check for rating-specific elements
		const ratingSelectors = [
			'[class*="rating"]',
			'[class*="star"]',
			'[class*="vote"]',
			'[data-rating]',
			'svg[class*="star"]',
			'span[class*="rating"]'
		];

		ratingSelectors.forEach((selector) => {
			const elements = document.querySelectorAll(selector);
			if (elements.length > 0) {
				results.push({
					selector: selector,
					count: elements.length,
					sampleHTML: elements[0]?.outerHTML.substring(0, 500),
					sampleText: elements[0]?.textContent?.trim()
				});
			}
		});

		return results;
	});

	console.log('\n📦 Found containers and elements:');
	structure.forEach((item) => {
		console.log(`\n  Selector: ${item.selector}`);
		console.log(`  Count: ${item.count}`);
		if (item.sampleText) console.log(`  Sample text: ${item.sampleText}`);
		console.log(`  Sample HTML: ${item.sampleHTML}...`);
	});

	// Look for the main article element that contains the data table
	const tabData = await page.evaluate(() => {
		const results = [];

		// Find all rows in the search results (each row is a tab)
		const rows = document.querySelectorAll('article .dyhP1:not(.oStLJ)');

		console.log(`Found ${rows.length} result rows`);

		rows.forEach((row, index) => {
			if (index >= 10) return; // Get first 10

			// Extract all cell data
			const cells = row.querySelectorAll('.qNp1Q');
			const data = {
				index,
				cellCount: cells.length,
				cells: []
			};

			cells.forEach((cell, cellIndex) => {
				// Get link if exists
				const link = cell.querySelector('a[href*="/tab/"]');

				const cellData = {
					cellIndex,
					classes: cell.className,
					text: cell.textContent?.trim().substring(0, 100),
					hasLink: !!link,
					url: link?.href || null
				};

				// If this is the rating cell (index 2), extract star rating and votes
				if (cellIndex === 2) {
					// Count filled stars (N3Nzv without other classes = filled)
					const stars = cell.querySelectorAll('.STM0m');
					let filledStars = 0;
					stars.forEach((star) => {
						// If it only has N3Nzv class (no cr1d0 or t4iet), it's filled
						if (
							star.classList.contains('N3Nzv') &&
							!star.classList.contains('cr1d0') &&
							!star.classList.contains('t4iet')
						) {
							filledStars++;
						}
					});

					// Get vote count from the number div
					const voteDiv = cell.querySelector('.fxXfx');
					const votes = voteDiv ? voteDiv.textContent.trim() : null;

					cellData.rating = filledStars;
					cellData.votes = votes;
					cellData.totalStars = stars.length;

					// Store at top level
					data.rating = filledStars;
					data.votes = votes;
				}

				data.cells.push(cellData);

				// Store URL at top level if this cell has the tab link
				if (link && link.href.includes('/tab/')) {
					data.url = link.href;
					data.title = link.textContent?.trim();
				}

				// Store type if this is the type cell (index 3)
				if (cellIndex === 3) {
					data.type = cell.textContent?.trim();
				}

				// Store artist if this is the artist cell (index 0)
				if (cellIndex === 0) {
					const artistLink = cell.querySelector('a[href*="/artist/"]');
					if (artistLink) {
						data.artist = artistLink.textContent?.trim();
					}
				}
			});

			results.push(data);
		});

		return results;
	});

	console.log('\n\n🎸 First 5 tabs with all metadata:');
	console.log(JSON.stringify(tabData, null, 2));

	console.log('\n\n⏸️  Browser left open for manual inspection. Press Ctrl+C to close.');
	// Keep browser open for manual inspection
	// await browser.close();
}

inspectUGSearchResults().catch(console.error);
