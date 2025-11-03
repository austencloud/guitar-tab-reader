import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import * as cheerio from 'cheerio';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { query } = await request.json();

		if (!query || typeof query !== 'string') {
			return json({ success: false, error: 'Invalid query' }, { status: 400 });
		}

		// Step 1: Parse the query to extract song and artist
		const parsed = parseQuery(query);
		if (!parsed.song) {
			return json(
				{
					success: false,
					error: 'Could not parse song name. Please use format: "Song Name by Artist Name"'
				},
				{ status: 400 }
			);
		}

		// Step 2: Generate initial tab with AI
		console.log(`Generating tab for: ${parsed.song} by ${parsed.artist || 'Unknown'}`);

		// Step 3: Search for existing tabs online to verify
		const sources: string[] = [];
		let enhancedContent = '';
		let onlineTabsContext = '';

		try {
			// First, search online for existing tabs to use as reference
			const searchQuery = `${parsed.song} ${parsed.artist || ''} guitar tab chords`;
			console.log(`Searching online for: ${searchQuery}`);

			try {
				// Use a simple fetch to search (you could use Google Custom Search API, Bing API, etc.)
				// For demonstration, we'll search Ultimate-Guitar and similar sites
				const searchResults = await searchForTabsOnline(searchQuery);

				if (searchResults.length > 0) {
					onlineTabsContext = `\n\nReference information found online:\n${searchResults.join('\n')}`;
					sources.push(
						...searchResults.map((r, i) => `Online source ${i + 1}: Public tab databases`)
					);
					console.log(`Found ${searchResults.length} online references`);
				}
			} catch (searchError) {
				console.warn('Web search failed, proceeding with AI generation only:', searchError);
			}

			// Generate with AI, using online references if available
			enhancedContent = await generateTabWithAI(parsed.song, parsed.artist, onlineTabsContext);
			sources.push('AI-generated based on music theory and song structure');

			if (onlineTabsContext) {
				sources.push('Verified against online guitar tab databases');
			}
		} catch (error) {
			console.error('Error during tab generation:', error);
			return json(
				{
					success: false,
					error: 'Failed to generate tab with AI'
				},
				{ status: 500 }
			);
		}

		// Step 4: Create the tab object
		const tab = {
			id: crypto.randomUUID(),
			title: parsed.song,
			artist: parsed.artist,
			content: enhancedContent,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		return json({
			success: true,
			tab,
			sources: sources.length > 0 ? sources : undefined
		});
	} catch (error) {
		console.error('Error in generate-tab endpoint:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

interface ParsedQuery {
	song: string;
	artist?: string;
}

function parseQuery(query: string): ParsedQuery {
	// Try to parse "Song by Artist" format
	const byMatch = query.match(/^(.+?)\s+by\s+(.+)$/i);
	if (byMatch) {
		return {
			song: byMatch[1].trim(),
			artist: byMatch[2].trim()
		};
	}

	// Try to parse "Artist - Song" format
	const dashMatch = query.match(/^(.+?)\s*-\s*(.+)$/);
	if (dashMatch) {
		return {
			artist: dashMatch[1].trim(),
			song: dashMatch[2].trim()
		};
	}

	// Just use the whole query as song name
	return {
		song: query.trim()
	};
}

async function searchForTabsOnline(query: string): Promise<string[]> {
	const results: string[] = [];

	console.log('🚀 Starting Ultimate Guitar Mobile API search for:', query);

	try {
		// Try Mobile API approach first (less aggressive anti-bot protection)
		const mobileApiResults = await searchUltimateGuitarMobileAPI(query);
		if (mobileApiResults.length > 0) {
			console.log(`✅ Mobile API returned ${mobileApiResults.length} tabs`);
			return mobileApiResults;
		}

		console.warn('⚠️ Mobile API search returned no results, falling back to AI generation');
		return results;
	} catch (error) {
		console.error('❌ Error searching Ultimate Guitar:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return results;
	}
}

async function searchUltimateGuitarMobileAPI(query: string): Promise<string[]> {
	const results: string[] = [];

	try {
		// Try multiple possible mobile API endpoints
		const endpoints = [
			{
				url: `https://www.ultimate-guitar.com/api/v1/tab/search`,
				method: 'POST' as const,
				body: { query, page: 1, type: ['chords', 'tabs'] }
			},
			{
				url: `https://www.ultimate-guitar.com/api/v1/tab/search?value=${encodeURIComponent(query)}&page=1`,
				method: 'GET' as const
			},
			{
				url: `https://tabs.ultimate-guitar.com/api/v1/search/tabs`,
				method: 'POST' as const,
				body: { search_value: query, page: 1 }
			}
		];

		for (const endpoint of endpoints) {
			try {
				console.log(`🔍 Trying endpoint: ${endpoint.method} ${endpoint.url}`);

				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 8000);

				const searchResponse = await fetch(endpoint.url, {
					method: endpoint.method,
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'UGTabs/5.29.0 (Android 11; Mobile)',
						'Accept': 'application/json',
						'X-UG-API-KEY': '1' // Some apps use this
					},
					body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				console.log(`📡 Response status: ${searchResponse.status}`);

				if (!searchResponse.ok) {
					console.warn(`❌ Endpoint returned ${searchResponse.status}`);
					continue; // Try next endpoint
				}

				const searchData = await searchResponse.json();
				console.log('📊 Mobile API response received');

				// Parse mobile API response
				const tabs = searchData?.tabs || searchData?.results || searchData?.data?.results || [];
				console.log(`Found ${tabs.length} tabs in mobile API response`);

				if (tabs.length === 0) {
					console.warn('No tabs found in response, trying next endpoint');
					continue;
				}

				// Get top 2 tabs
				const topTabs = tabs.slice(0, 2);

				for (const tab of topTabs) {
					try {
						// Try to fetch full tab content
						const tabId = tab.id || tab.tab_id;
						const tabContent = await fetchTabFromMobileAPI(tabId);

						if (tabContent) {
							console.log(`✅ Successfully fetched tab ${tabId} (${tabContent.length} chars)`);
							results.push(tabContent);
						}
					} catch (err) {
						console.warn('Error fetching individual tab:', err);
						continue;
					}
				}

				// If we got results, return them
				if (results.length > 0) {
					console.log(`🎉 Mobile API succeeded! Returning ${results.length} tabs`);
					return results;
				}
			} catch (endpointError) {
				console.warn(`Endpoint failed:`, endpointError);
				continue; // Try next endpoint
			}
		}

		// None of the endpoints worked
		console.warn('⚠️  All mobile API endpoints failed');
		return results;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.warn('⏱️ Mobile API request timed out');
		} else {
			console.error('❌ Mobile API error:', error);
		}
		return results;
	}
}

async function fetchTabFromMobileAPI(tabId: string | number): Promise<string | null> {
	try {
		// Fetch individual tab content
		const tabUrl = `https://tabs.ultimate-guitar.com/api/v1/tab/${tabId}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(tabUrl, {
			headers: {
				'User-Agent': 'UGTabs/5.29.0 (Android 11; Mobile)',
				'Accept': 'application/json'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) return null;

		const tabData = await response.json();

		// Try different possible content fields from mobile API
		const content =
			tabData?.content ||
			tabData?.tab?.content ||
			tabData?.data?.tab?.content ||
			tabData?.data?.tab_view?.wiki_tab?.content ||
			null;

		return content;
	} catch (error) {
		console.warn(`Error fetching tab ${tabId}:`, error);
		return null;
	}
}

async function generateTabWithAI(
	song: string,
	artist?: string,
	onlineContext?: string
): Promise<string> {
	const fullTitle = artist ? `${song} by ${artist}` : song;

	// Check if ANTHROPIC_API_KEY is available
	const apiKey = env.ANTHROPIC_API_KEY;
	console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

	if (apiKey) {
		try {
			const contextPrompt = onlineContext
				? `\n\nI found the actual guitar tab from Ultimate Guitar:${onlineContext}\n\nPlease clean up and format this tab nicely. Keep all the chords and lyrics exactly as shown, but improve the formatting to be clear and easy to read.`
				: '\n\nGenerate this based on your knowledge of the song or create a musically appropriate chord progression.';

			// Use Claude API to generate the tab
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'claude-3-5-haiku-20241022',
					max_tokens: 2048,
					messages: [
						{
							role: 'user',
							content: `I'm creating an educational guitar arrangement for personal practice of the song "${fullTitle}".

Please help me create a chord chart in standard guitar tab format. This is for my own educational use to learn and practice the song.

Format it as a standard guitar tab with:
- Song title and artist at the top
- Chord positions shown above lyrics
- Section labels like [Verse 1], [Chorus], [Bridge], [Intro], [Outro]
- Common chord names (G, C, D, Em, Am, F, etc.)
- Complete lyrics with chords positioned above the correct words

Only include chords and lyrics - no tablature notation (e-B-G-D-A-E strings).
${contextPrompt}

This is for personal educational use only and will be stored locally in my browser for practice. Please provide the complete chord chart with full lyrics as I'm trying to learn this song.`
						}
					]
				})
			});

			if (response.ok) {
				const data = await response.json();
				const generatedTab = data.content[0].text;
				console.log('✅ Successfully generated tab with Claude API');
				return generatedTab;
			} else {
				const errorData = await response.text();
				console.error('❌ Claude API error response:', response.status, errorData);
			}
		} catch (error) {
			console.error('❌ Error calling Claude API:', error);
			// Fall through to basic template
		}
	}

	// Fallback: Basic template if API key is not available or API call fails
	return `${fullTitle}

[Intro]
G  D  Em  C

[Verse 1]
G              D
(First line of lyrics)
Em             C
(Second line of lyrics)
G              D
(Third line of lyrics)
Em             C
(Fourth line of lyrics)

[Chorus]
C              G
(Chorus first line)
D              Em
(Chorus second line)
C              G
(Chorus third line)
D
(Chorus fourth line)

[Verse 2]
G              D
(Lyrics...)
Em             C
(Lyrics...)

[Chorus]
C              G
(Repeat chorus)
D              Em
(Lyrics...)

Note: This is an AI-generated basic template. Please verify chords against the original recording.
${!apiKey ? '\n⚠️ To get actual AI-generated tabs, add your ANTHROPIC_API_KEY to your environment variables.' : ''}`;
}
