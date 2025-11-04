import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Server-Sent Events endpoint for real-time progress updates
export const POST: RequestHandler = async ({ request }) => {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			// Helper to send progress updates
			const sendProgress = (step: string, details?: string) => {
				const data = JSON.stringify({ step, details, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			};

			const sendError = (error: string) => {
				const data = JSON.stringify({ error, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				controller.close();
			};

			const sendComplete = (tab: any, sources: string[]) => {
				const data = JSON.stringify({ success: true, tab, sources, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				controller.close();
			};

			try {
				const { query } = await request.json();

				if (!query || typeof query !== 'string') {
					sendError('Invalid query');
					return;
				}

				sendProgress('Parsing query', `Analyzing: "${query}"`);

				// Step 1: Parse the query
				const parsed = parseQuery(query);
				if (!parsed.song) {
					sendError('Could not parse song name. Please use format: "Song Name by Artist Name"');
					return;
				}

				sendProgress(
					'Query parsed',
					`Song: "${parsed.song}"${parsed.artist ? ` by ${parsed.artist}` : ''}`
				);

				// Step 2: Search for tabs online
				const searchQuery = `${parsed.song} ${parsed.artist || ''} guitar tab chords`;
				sendProgress('Searching Ultimate Guitar', `Looking for: ${searchQuery}`);

				const sources: string[] = [];
				let onlineTabsContext = '';

				try {
					const searchResults = await searchForTabsOnline(searchQuery, sendProgress);

					if (searchResults.length > 0) {
						onlineTabsContext = `\n\nReference information found online:\n${searchResults.join('\n')}`;
						sources.push(
							...searchResults.map((r, i) => `Online source ${i + 1}: Public tab databases`)
						);
						sendProgress('Tabs found', `Found ${searchResults.length} tab(s) online`);
					} else {
						sendProgress('No tabs found', 'Could not find any tabs online');
					}
				} catch (searchError) {
					sendProgress('Search failed', 'Unable to fetch tabs from online sources');
				}

				// Step 3: Format with AI if we have content
				if (!onlineTabsContext) {
					sendError('No online tab content found to format');
					return;
				}

				sendProgress('Formatting with AI', 'Cleaning up and formatting the tab content...');

				const enhancedContent = await generateTabWithAI(
					parsed.song,
					parsed.artist,
					onlineTabsContext,
					sendProgress
				);

				sources.push('Formatted with AI');

				sendProgress('Complete', 'Tab ready!');

				// Step 4: Send final result
				const tab = {
					id: crypto.randomUUID(),
					title: parsed.song,
					artist: parsed.artist,
					content: enhancedContent,
					createdAt: Date.now(),
					updatedAt: Date.now()
				};

				sendComplete(tab, sources);
			} catch (error) {
				console.error('Error in generate-tab-stream:', error);
				sendError(error instanceof Error ? error.message : 'Unknown error');
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

interface ParsedQuery {
	song: string;
	artist?: string;
}

function parseQuery(query: string): ParsedQuery {
	const byMatch = query.match(/^(.+?)\s+by\s+(.+)$/i);
	if (byMatch) {
		return {
			song: byMatch[1].trim(),
			artist: byMatch[2].trim()
		};
	}

	const dashMatch = query.match(/^(.+?)\s*-\s*(.+)$/);
	if (dashMatch) {
		return {
			artist: dashMatch[1].trim(),
			song: dashMatch[2].trim()
		};
	}

	return {
		song: query.trim()
	};
}

async function searchForTabsOnline(
	query: string,
	sendProgress: (step: string, details?: string) => void
): Promise<string[]> {
	const results: string[] = [];

	sendProgress('Searching Mobile API', 'Trying Ultimate Guitar Mobile API endpoints...');

	try {
		const mobileApiResults = await searchUltimateGuitarMobileAPI(query, sendProgress);
		if (mobileApiResults.length > 0) {
			sendProgress('Mobile API success', `Retrieved ${mobileApiResults.length} tab(s)`);
			return mobileApiResults;
		}

		sendProgress('No results', 'Mobile API returned no tabs');
		return results;
	} catch (error) {
		console.error('Error searching Ultimate Guitar:', error);
		return results;
	}
}

async function searchUltimateGuitarMobileAPI(
	query: string,
	sendProgress: (step: string, details?: string) => void
): Promise<string[]> {
	const results: string[] = [];

	try {
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

		for (let i = 0; i < endpoints.length; i++) {
			const endpoint = endpoints[i];

			try {
				sendProgress('Trying API endpoint', `Endpoint ${i + 1}/${endpoints.length}: ${endpoint.method}`);

				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 8000);

				const searchResponse = await fetch(endpoint.url, {
					method: endpoint.method,
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'UGTabs/5.29.0 (Android 11; Mobile)',
						Accept: 'application/json',
						'X-UG-API-KEY': '1'
					},
					body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				if (!searchResponse.ok) {
					sendProgress('Endpoint failed', `Status ${searchResponse.status}, trying next...`);
					continue;
				}

				const searchData = await searchResponse.json();
				const tabs = searchData?.tabs || searchData?.results || searchData?.data?.results || [];

				if (tabs.length === 0) {
					sendProgress('No tabs in response', 'Trying next endpoint...');
					continue;
				}

				sendProgress('Tabs found', `Found ${tabs.length} tab(s), fetching content...`);

				const topTabs = tabs.slice(0, 2);

				for (let j = 0; j < topTabs.length; j++) {
					const tab = topTabs[j];
					try {
						sendProgress('Fetching tab', `Downloading tab ${j + 1}/${topTabs.length}...`);

						const tabId = tab.id || tab.tab_id;
						const tabContent = await fetchTabFromMobileAPI(tabId);

						if (tabContent) {
							sendProgress('Tab downloaded', `Got ${tabContent.length} characters`);
							results.push(tabContent);
						}
					} catch (err) {
						sendProgress('Tab fetch failed', `Skipping tab ${j + 1}`);
						continue;
					}
				}

				if (results.length > 0) {
					return results;
				}
			} catch (endpointError) {
				sendProgress('Endpoint error', 'Trying next endpoint...');
				continue;
			}
		}

		return results;
	} catch (error) {
		console.error('Mobile API error:', error);
		return results;
	}
}

async function fetchTabFromMobileAPI(tabId: string | number): Promise<string | null> {
	try {
		const tabUrl = `https://tabs.ultimate-guitar.com/api/v1/tab/${tabId}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(tabUrl, {
			headers: {
				'User-Agent': 'UGTabs/5.29.0 (Android 11; Mobile)',
				Accept: 'application/json'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) return null;

		const tabData = await response.json();

		const content =
			tabData?.content ||
			tabData?.tab?.content ||
			tabData?.data?.tab?.content ||
			tabData?.data?.tab_view?.wiki_tab?.content ||
			null;

		return content;
	} catch (error) {
		return null;
	}
}

async function generateTabWithAI(
	song: string,
	artist: string | undefined,
	onlineContext: string,
	sendProgress: (step: string, details?: string) => void
): Promise<string> {
	const fullTitle = artist ? `${song} by ${artist}` : song;

	const apiKey = env.ANTHROPIC_API_KEY;

	if (apiKey) {
		try {
			if (!onlineContext) {
				throw new Error('No online tab content found to format');
			}

			sendProgress('Calling Claude AI', 'Sending tab to Claude for formatting...');

			const contextPrompt = `\n\nI found the actual guitar tab from Ultimate Guitar:${onlineContext}\n\nPlease clean up and format this tab nicely. Keep all the chords and lyrics exactly as shown, but improve the formatting to be clear and easy to read.`;

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

I have found an existing guitar tab from Ultimate Guitar that needs formatting cleanup.

IMPORTANT: Do NOT generate, guess, or invent any chords. Only clean up and format the existing tab content provided below.

Format requirements:
- Song title and artist at the top
- Chord positions shown above lyrics (preserve exact chords from source)
- Section labels like [Verse 1], [Chorus], [Bridge], [Intro], [Outro]
- Keep all chord names exactly as shown in the source
- Complete lyrics with chords positioned above the correct words
- Only include chords and lyrics - no tablature notation (e-B-G-D-A-E strings)

${contextPrompt}

Remember: Only format and clean up the provided content. Do not add, change, or generate any chords that aren't in the source material.`
						}
					]
				})
			});

			if (response.ok) {
				sendProgress('AI formatting complete', 'Tab successfully formatted');
				const data = await response.json();
				const generatedTab = data.content[0].text;
				return generatedTab;
			} else {
				const errorData = await response.text();
				console.error('Claude API error response:', response.status, errorData);
				throw new Error(`Claude API error: ${response.status}`);
			}
		} catch (error) {
			console.error('Error calling Claude API:', error);
			throw error;
		}
	}

	throw new Error(!apiKey
		? 'ANTHROPIC_API_KEY not configured'
		: 'Failed to generate tab - no online content available to format');
}
