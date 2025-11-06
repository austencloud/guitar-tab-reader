import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getRecommendedTab } from '$lib/utils/tabVersions';

// Simple in-memory cache for AI intent analysis (15 minute TTL)
const intentCache = new Map<string, { intent: Intent; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { query } = await request.json();

		if (!query || typeof query !== 'string') {
			return json({ success: false, error: 'Invalid query' }, { status: 400 });
		}

		console.log(`🤖 Smart import request: "${query}"`);

		// Use Claude to analyze the query and determine intent
		const intent = await analyzeIntent(query);
		console.log(`🧠 Detected intent:`, intent);

		if (!intent || !intent.type) {
			return json(
				{
					success: false,
					error: 'Could not understand your request. Try "artist name" or "song name by artist"'
				},
				{ status: 400 }
			);
		}

		// Handle ambiguous queries
		if (intent.type === 'AMBIGUOUS') {
			console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);

			// Check if this is a simple typo with a clear correction
			const isTypo = intent.ambiguityReason?.toLowerCase().includes('typo');
			const hasSingleCorrection =
				intent.suggestions?.length === 1 && !intent.ambiguityReason?.includes('vague');

			if (isTypo && hasSingleCorrection) {
				// Auto-correct: recursively call with the corrected query
				const correctedQuery = intent.suggestions[0];
				console.log(`🔄 Auto-correcting "${query}" → "${correctedQuery}"`);

				// Re-analyze with the corrected query
				const correctedIntent = await analyzeIntent(correctedQuery);

				if (correctedIntent && correctedIntent.type !== 'AMBIGUOUS') {
					// Get the result from handleIntent
					const result = await handleIntent(correctedIntent, fetch);
					const resultData = await result.json();

					// Mark this as auto-corrected in metadata
					return json({
						...resultData,
						autoCorrection: { from: query, to: correctedQuery }
					});
				}
			}

			// Otherwise, show disambiguation UI
			return json({
				success: true,
				type: 'ambiguous',
				query: query,
				ambiguityReason: intent.ambiguityReason,
				suggestions: intent.suggestions || [],
				possibleArtist: intent.artist,
				possibleSong: intent.song,
				_meta: intent._meta
			});
		}

		// Handle the intent
		return await handleIntent(intent, fetch);
	} catch (error) {
		console.error('❌ Smart import error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

async function handleIntent(intent: Intent, fetch: typeof global.fetch) {
	// Execute the appropriate workflow based on intent
	if (intent.type === 'ARTIST_BULK_IMPORT') {
			// Bulk import all tabs for an artist
			console.log(`📦 Executing bulk artist import for: ${intent.artist}`);

			const response = await fetch('/api/scrape-artist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artistName: intent.artist })
			});

			const data = await response.json();

			if (data.success) {
				return json({
					success: true,
					type: 'artist_bulk',
					artist: intent.artist,
					tabs: data.tabs,
					count: data.count,
					message: `Found ${data.count} tabs for ${intent.artist}`,
					_meta: intent._meta
				});
			} else {
				return json({
					success: false,
					error: data.error || `Could not find tabs for ${intent.artist}`
				});
			}
		} else if (intent.type === 'SINGLE_TAB_IMPORT') {
			// If URL provided, use it directly
			if (intent.url) {
				console.log(`🔗 Importing single tab from URL: ${intent.url}`);

				const response = await fetch('/api/parse-ug-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ url: intent.url })
				});

				const data = await response.json();

				if (data.success) {
					return json({
						success: true,
						type: 'single_tab',
						tab: {
							title: data.title,
							artist: data.artist,
							content: data.content,
							url: intent.url
						},
						message: `Imported "${data.title}" by ${data.artist}`,
						_meta: intent._meta
					});
				} else {
					return json({ success: false, error: data.error });
				}
			} else {
				// Search for the specific song using title search
				console.log(`🔍 Searching for: ${intent.song} by ${intent.artist || 'unknown'}`);

				const titleResponse = await fetch('/api/scrape-title', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ song: intent.song, artist: intent.artist })
				});

				const titleData = await titleResponse.json();

				if (titleData.success && titleData.tabs.length > 0) {
					// Get the recommended version based on rating and votes
					const matchingTab = getRecommendedTab(titleData.tabs);
					console.log(
						`✅ Found recommended tab: ${matchingTab.title} (${titleData.tabs.length} total versions)`,
						matchingTab.rating ? `[Rating: ${matchingTab.rating}/5, Votes: ${matchingTab.votes}]` : ''
					);

					// Now fetch the actual content
					const tabResponse = await fetch('/api/parse-ug-url', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ url: matchingTab.url })
					});

					const tabData = await tabResponse.json();

					if (tabData.success) {
						return json({
							success: true,
							type: 'single_tab',
							tab: {
								title: tabData.title,
								artist: tabData.artist,
								content: tabData.content,
								url: matchingTab.url
							},
							alternateVersions: titleData.tabs.slice(1, 6), // Include up to 5 alternate versions
							message: `Imported "${tabData.title}" by ${tabData.artist}${titleData.tabs.length > 1 ? ` (${titleData.tabs.length - 1} other versions available)` : ''}`,
							_meta: intent._meta
						});
					}
				}

				// Fallback: If we have an artist, try bulk import instead
				if (intent.artist) {
					console.log(`⚠️ Song "${intent.song}" not found. Trying artist bulk import for: ${intent.artist}`);

					const artistResponse = await fetch('/api/scrape-artist', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ artistName: intent.artist })
					});

					const artistData = await artistResponse.json();

					if (artistData.success && artistData.tabs.length > 0) {
						console.log(`✅ Fallback successful! Found ${artistData.tabs.length} tabs by ${intent.artist}`);
						return json({
							success: true,
							type: 'artist_bulk',
							artist: intent.artist,
							tabs: artistData.tabs,
							count: artistData.count,
							message: `Couldn't find "${intent.song}", but here are all tabs by ${intent.artist}`,
							fallback: true,
							originalQuery: intent.song,
							_meta: intent._meta
						});
					}
				}

				// Final fallback: Could not find tabs at all
				console.log(`❌ Could not find tabs for "${intent.song}" by ${intent.artist || 'unknown'}`);
				return json({
					success: false,
					error: `Could not find tabs for "${intent.song}"${intent.artist ? ` by ${intent.artist}` : ''}. Try searching for just the artist name or check your spelling.`,
					suggestions: intent.artist ? [`All tabs by ${intent.artist}`, 'Try a different song'] : ['Check spelling', 'Try including artist name'],
					_meta: intent._meta
				});
			}
		}

	return json({ success: false, error: 'Unknown intent type' }, { status: 400 });
}

interface Intent {
	type: 'ARTIST_BULK_IMPORT' | 'SINGLE_TAB_IMPORT' | 'AMBIGUOUS';
	artist?: string;
	song?: string;
	url?: string;
	confidence?: 'high' | 'medium' | 'low';
	suggestions?: string[];
	ambiguityReason?: string;
	_meta?: {
		model: string;
		inputTokens: number;
		outputTokens: number;
		rawResponse: string;
	};
}

async function analyzeIntent(query: string): Promise<Intent | null> {
	const apiKey = ANTHROPIC_API_KEY;

	// Normalize query for cache key
	const cacheKey = query.toLowerCase().trim();

	// Check cache first
	const cached = intentCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		console.log(`💾 Cache hit for: "${query}"`);
		return { ...cached.intent, _meta: { ...cached.intent._meta, cached: true } as any };
	}

	// Clean up expired cache entries periodically
	if (intentCache.size > 100) {
		const now = Date.now();
		for (const [key, value] of intentCache.entries()) {
			if (now - value.timestamp >= CACHE_TTL) {
				intentCache.delete(key);
			}
		}
	}

	if (!apiKey) {
		// Fallback: Simple heuristics
		return simpleIntentAnalysis(query);
	}

	// STEP 1: Check MusicBrainz database for real-world ambiguity data
	console.log('🎵 Querying MusicBrainz database...');
	let mbAnalysis;
	try {
		mbAnalysis = await analyzeQueryAmbiguity(query);
	} catch (error) {
		console.warn('⚠️ MusicBrainz query failed, proceeding without it:', error);
		mbAnalysis = null;
	}

	try {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-3-5-haiku-20241022',
				max_tokens: 400,
				messages: [
					{
						role: 'user',
						content: `Analyze this guitar tab import request and determine the user's intent.

User query: "${query}"

${mbAnalysis ? `🎵 MusicBrainz Database Analysis (REAL MUSIC DATA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Is Ambiguous: ${mbAnalysis.isAmbiguous ? '⚠️ YES - Multiple interpretations exist' : '✅ NO - Clear match'}
Confidence: ${mbAnalysis.confidence.toUpperCase()}
Artist Matches: ${mbAnalysis.artistMatches} ${mbAnalysis.artistMatches > 0 ? `(${mbAnalysis.topArtists.join(', ')})` : ''}
Song Matches: ${mbAnalysis.songMatches} ${mbAnalysis.songMatches > 0 ? `(found in songs by ${mbAnalysis.songMatches} different artists)` : ''}
Reasoning: ${mbAnalysis.reasoning}

${mbAnalysis.topSongs.length > 0 ? `Top Songs Found:
${mbAnalysis.topSongs.map(s => `  • "${s.title}" by ${s.artist}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CRITICAL INSTRUCTION**: MusicBrainz is a comprehensive real-world music database.
If MusicBrainz says isAmbiguous=true, you MUST use type "AMBIGUOUS" - do NOT override this with SINGLE_TAB_IMPORT or ARTIST_BULK_IMPORT.
The database knows which terms are actually ambiguous in the real music world.

` : '⚠️ MusicBrainz data unavailable - use your best judgment\n\n'}Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "type": "ARTIST_BULK_IMPORT" | "SINGLE_TAB_IMPORT" | "AMBIGUOUS",
  "artist": "artist name if mentioned",
  "song": "song title if mentioned",
  "url": "URL if provided",
  "confidence": "high" | "medium" | "low",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "ambiguityReason": "why this is ambiguous (only if type is AMBIGUOUS)"
}

Rules:
- If the query is clearly just an artist name (e.g., "Fish in a Birdcage", "The Beatles", "Metallica", "Nirvana"), use ARTIST_BULK_IMPORT
- If it clearly mentions a specific song, use SINGLE_TAB_IMPORT. Song patterns include:
  * "{song} by {artist}" (e.g., "Wonderwall by Oasis", "Hello by Adele")
  * "{artist} {song}" (e.g., "Green Day Basket Case", "Oasis Wonderwall")
  * "{artist} - {song}" (e.g., "Led Zeppelin - Stairway to Heaven")
  * **IMPORTANT**: Single-word queries (e.g., "Hello", "Yesterday", "Creep", "Dreams", "Home", "Stay") should ALWAYS default to SINGLE_TAB_IMPORT unless they are clearly famous band names. Even common words like "Hello" are likely song titles in this guitar tab context.
- **DEFAULT BEHAVIOR**: When in doubt between artist or song for ANY single word, ALWAYS prefer SINGLE_TAB_IMPORT with confidence "medium". Let the search engine decide if it exists. DO NOT mark as AMBIGUOUS just because a word is common.
- If it's a Ultimate Guitar URL, use SINGLE_TAB_IMPORT and extract the URL
- **RARELY use "AMBIGUOUS"** - Only use it if:
  * The query contains obvious typos that need correction (e.g., "Beatels")
  * The query is genuinely unclear with no actionable intent (e.g., "that song that goes...", "something by")
  * The query is too vague to be actionable (e.g., "guitar tabs", "music", "songs")
- Provide spelling corrections in "suggestions" if there are likely typos
- For ambiguous queries, provide specific song/artist suggestions, not generic placeholders
- When parsing "{artist} {song}" format, assume the first part is the artist and the rest is the song title

**CRITICAL - Suggestion Formatting Rules:**
Suggestions MUST be actionable statements that the user can directly select, NOT questions or conversational phrases.

GOOD suggestion formats:
✅ "The Beatles - I'm So Tired" (for song suggestions)
✅ "All tabs by The Beatles" (for artist bulk import)
✅ "Led Zeppelin - Stairway to Heaven" (for complete song with artist)
✅ "Search for: I'm So Tired" (when artist unknown)

BAD suggestion formats (NEVER use these):
❌ "Are you looking for the Beatles song 'I'm So Tired'?"
❌ "Did you mean to search for a specific guitar tab?"
❌ "Do you want all tabs by this artist?"
❌ "Maybe you meant..."

For typo corrections: Use "Did you mean: Correct Spelling"
For partial songs: Use "Artist - Complete Song Title"
For vague queries: Provide specific actionable options, not instructions like "Specify a song name"

Advanced pattern recognition:
- **Band abbreviations**: Recognize common abbreviations and expand them:
  * "RHCP" → "Red Hot Chili Peppers"
  * "RATM" → "Rage Against the Machine"
  * "SOAD" → "System of a Down"
  * "GNR" → "Guns N' Roses"
  * "ACDC" or "AC/DC" → "AC/DC"
  If unsure about an abbreviation, mark as AMBIGUOUS and suggest the expansion

- **Partial song names**: If user provides what appears to be a partial song title, try to infer the full name:
  * "Stairway" → likely "Stairway to Heaven"
  * "Smells Like" → likely "Smells Like Teen Spirit"
  * "Bohemian" → likely "Bohemian Rhapsody"
  If uncertain, mark as AMBIGUOUS and suggest full title

- **Featured artists**: Handle collaborations properly:
  * "Song feat. Artist" or "Song ft. Artist" → extract main song and primary artist
  * "Artist & Artist - Song" → extract both artists and song
  * "Artist with Artist" → extract both artists

- **Version specifications**: Parse version/style modifiers:
  * "acoustic version", "acoustic", "unplugged" → note in intent but still search for song
  * "live version", "live at...", "live" → search for main song
  * "electric", "classical guitar" → search for main song
  * "tab" vs "chords" → both are valid, search for song
  * "bass tab", "ukulele" → search for song, note instrument

- **Album/year context**: Handle temporal references:
  * "Beatles 1967" → search for artist Beatles, note year context
  * "from Abbey Road" → search with album context if mentioned
  * "early stuff", "new song" → mark as vague, suggest clarification

- **Colloquial/casual queries**: Interpret natural language:
  * "that song that goes..." → mark as AMBIGUOUS, ask for more details
  * "popular song by X" → search for artist X's popular songs
  * "best tabs by X" → ARTIST_BULK_IMPORT for X
  * "something by X" → too vague, mark AMBIGUOUS

- **Misspellings and fuzzy matching**: Be aggressive with typo detection:
  * "Nirvanna" → "Nirvana"
  * "Metalica" → "Metallica"
  * "Led Zeplin" → "Led Zeppelin"
  * "Jimi Hendix" → "Jimi Hendrix"
  Always provide corrected spelling in suggestions

Ambiguous cases (use sparingly):
- Queries with obvious typos (e.g., "Beatels" instead of "Beatles")
- Genuinely vague queries (e.g., "guitar tabs", "that song", "music")

Examples:
"Fish in a Birdcage" → {"type": "ARTIST_BULK_IMPORT", "artist": "Fish in a Birdcage", "confidence": "high"}
"Wonderwall by Oasis" → {"type": "SINGLE_TAB_IMPORT", "song": "Wonderwall", "artist": "Oasis", "confidence": "high"}
"Green Day Basket Case" → {"type": "SINGLE_TAB_IMPORT", "song": "Basket Case", "artist": "Green Day", "confidence": "high"}
"Oasis Wonderwall" → {"type": "SINGLE_TAB_IMPORT", "song": "Wonderwall", "artist": "Oasis", "confidence": "high"}
"Hello" → {"type": "SINGLE_TAB_IMPORT", "song": "Hello", "confidence": "medium"}
"Oasis" → {"type": "SINGLE_TAB_IMPORT", "song": "Oasis", "confidence": "medium"} (try as song first; if no results, fallback happens server-side)
"Yesterday" → {"type": "SINGLE_TAB_IMPORT", "song": "Yesterday", "confidence": "medium"}
"Beatels" → {"type": "AMBIGUOUS", "ambiguityReason": "Possible typo detected", "suggestions": ["The Beatles"], "confidence": "low"}
"Stairway to Heaven" → {"type": "SINGLE_TAB_IMPORT", "song": "Stairway to Heaven", "confidence": "medium"}
"im so tired" → {"type": "SINGLE_TAB_IMPORT", "song": "I'm So Tired", "confidence": "medium"}

Edge case examples:
"RHCP Californication" → {"type": "SINGLE_TAB_IMPORT", "song": "Californication", "artist": "Red Hot Chili Peppers", "confidence": "high"}
"Stairway" → {"type": "SINGLE_TAB_IMPORT", "song": "Stairway", "confidence": "medium"} (search will likely find "Stairway to Heaven")
"Wonderwall acoustic" → {"type": "SINGLE_TAB_IMPORT", "song": "Wonderwall", "artist": "Oasis", "confidence": "high"}
"Nirvanna Smells Like Teen Spirit" → {"type": "AMBIGUOUS", "ambiguityReason": "Possible typo in artist name", "suggestions": ["Nirvana - Smells Like Teen Spirit"], "confidence": "low"}
"Hotel California live" → {"type": "SINGLE_TAB_IMPORT", "song": "Hotel California", "artist": "Eagles", "confidence": "high"}
"Beatles 1967" → {"type": "ARTIST_BULK_IMPORT", "artist": "Beatles", "confidence": "high"}
"something by Metallica" → {"type": "AMBIGUOUS", "ambiguityReason": "Query too vague - no specific song mentioned", "suggestions": ["All tabs by Metallica", "Metallica - Enter Sandman", "Metallica - Nothing Else Matters"], "confidence": "low"}
"RATM" → {"type": "ARTIST_BULK_IMPORT", "artist": "Rage Against the Machine", "confidence": "high"}
"best tabs by Pink Floyd" → {"type": "ARTIST_BULK_IMPORT", "artist": "Pink Floyd", "confidence": "high"}`
					}
				]
			})
		});

		if (response.ok) {
			const data = await response.json();
			const jsonText = data.content[0].text.trim();

			// Remove markdown code blocks if present
			const cleanJson = jsonText.replace(/^```json\s*|\s*```$/g, '').trim();

			const intent = JSON.parse(cleanJson);

			// Attach metadata about the AI call
			intent._meta = {
				model: 'claude-3-5-haiku-20241022',
				inputTokens: data.usage?.input_tokens || 0,
				outputTokens: data.usage?.output_tokens || 0,
				rawResponse: jsonText
			};

			console.log('🧠 AI analyzed intent:', intent);
			console.log(`📊 Token usage: ${intent._meta.inputTokens} input + ${intent._meta.outputTokens} output = ${intent._meta.inputTokens + intent._meta.outputTokens} total`);

			// Cache the result
			intentCache.set(cacheKey, { intent, timestamp: Date.now() });
			console.log(`💾 Cached intent for: "${query}"`);

			return intent;
		}
	} catch (error) {
		console.warn('⚠️ AI intent analysis failed, using fallback:', error);
	}

	// Fallback to simple analysis
	return simpleIntentAnalysis(query);
}

function simpleIntentAnalysis(query: string): Intent | null {
	const lowerQuery = query.toLowerCase().trim();

	// Check if it's a URL
	if (lowerQuery.includes('ultimate-guitar.com/tab/')) {
		return {
			type: 'SINGLE_TAB_IMPORT',
			url: query.includes('http') ? query : `https://${query}`
		};
	}

	// Check for "by" keyword (song by artist)
	const byMatch = query.match(/^(.+?)\s+by\s+(.+)$/i);
	if (byMatch) {
		return {
			type: 'SINGLE_TAB_IMPORT',
			song: byMatch[1].trim(),
			artist: byMatch[2].trim()
		};
	}

	// Check for dash format (Artist - Song)
	const dashMatch = query.match(/^(.+?)\s*-\s*(.+)$/);
	if (dashMatch) {
		return {
			type: 'SINGLE_TAB_IMPORT',
			artist: dashMatch[1].trim(),
			song: dashMatch[2].trim()
		};
	}

	// If it contains keywords like "tabs", "all", "everything", assume bulk import
	if (
		lowerQuery.includes('all') ||
		lowerQuery.includes('tabs for') ||
		lowerQuery.includes('everything')
	) {
		const artist = query
			.replace(/get me|import|tabs? for|all|everything/gi, '')
			.trim();
		return {
			type: 'ARTIST_BULK_IMPORT',
			artist
		};
	}

	// Default: assume it's an artist name for bulk import
	return {
		type: 'ARTIST_BULK_IMPORT',
		artist: query.trim()
	};
}
