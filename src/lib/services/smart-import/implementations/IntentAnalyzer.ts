import type { IIntentAnalyzer } from '../contracts/IIntentAnalyzer';
import type { IIntentCache } from '../contracts/IIntentCache';
import type { Intent, MusicBrainzAnalysis, ProgressCallback } from '../types';
import { analyzeQueryAmbiguity } from '$lib/utils/musicBrainz';

/**
 * Analyzes user queries using AI (Claude) with MusicBrainz data enrichment
 */
export class IntentAnalyzer implements IIntentAnalyzer {
	constructor(
		private cache: IIntentCache,
		private apiKey: string | undefined
	) {}

	async analyze(query: string, onProgress?: ProgressCallback): Promise<Intent | null> {
		// Check cache first
		const cached = this.cache.get(query);
		if (cached) {
			onProgress?.('Intent retrieved from cache', 'Using cached analysis result');
			return cached;
		}

		// Cleanup cache periodically
		this.cache.cleanup();

		// If no API key, use simple fallback
		if (!this.apiKey) {
			onProgress?.('Analyzing query', 'Using basic pattern matching...');
			return this.simpleAnalysis(query);
		}

		// Get MusicBrainz analysis for real-world data
		console.log('🎵 Querying MusicBrainz database...');
		onProgress?.('Checking MusicBrainz', 'Verifying against music database...');
		let mbAnalysis: MusicBrainzAnalysis | null = null;
		try {
			mbAnalysis = await analyzeQueryAmbiguity(query);
		} catch (error) {
			console.warn('⚠️ MusicBrainz query failed, proceeding without it:', error);
		}

		// Try AI analysis
		try {
			onProgress?.('AI analyzing intent', 'Using Claude AI to understand your request...');
			const intent = await this.aiAnalysis(query, mbAnalysis);
			if (intent) {
				this.cache.set(query, intent);
				onProgress?.('Intent determined', 'Successfully analyzed your request');
				return intent;
			}
		} catch (error) {
			console.warn('⚠️ AI intent analysis failed, using fallback:', error);
		}

		// Fallback to simple analysis
		onProgress?.('Using fallback analysis', 'Analyzing with basic pattern matching...');
		return this.simpleAnalysis(query);
	}

	private async aiAnalysis(
		query: string,
		mbAnalysis: MusicBrainzAnalysis | null
	): Promise<Intent | null> {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.apiKey!,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-haiku-4-5-20250604',
				max_tokens: 400,
				messages: [
					{
						role: 'user',
						content: this.buildPrompt(query, mbAnalysis)
					}
				]
			})
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const jsonText = data.content[0].text.trim();

		// Remove markdown code blocks if present
		const cleanJson = jsonText.replace(/^```json\s*|\s*```$/g, '').trim();
		const intent = JSON.parse(cleanJson);

		// Attach metadata
		intent._meta = {
			model: 'claude-haiku-4-5-20250604',
			inputTokens: data.usage?.input_tokens || 0,
			outputTokens: data.usage?.output_tokens || 0,
			rawResponse: jsonText
		};

		console.log('🧠 AI analyzed intent:', intent);
		console.log(
			`📊 Token usage: ${intent._meta.inputTokens} input + ${intent._meta.outputTokens} output = ${intent._meta.inputTokens + intent._meta.outputTokens} total`
		);

		return intent;
	}

	private simpleAnalysis(query: string): Intent | null {
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
			const artist = query.replace(/get me|import|tabs? for|all|everything/gi, '').trim();
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

	private buildPrompt(query: string, mbAnalysis: MusicBrainzAnalysis | null): string {
		const mbSection = mbAnalysis
			? `🎵 MusicBrainz Database Analysis (REAL MUSIC DATA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Is Ambiguous: ${mbAnalysis.isAmbiguous ? '⚠️ YES - Multiple interpretations exist' : '✅ NO - Clear match'}
Confidence: ${mbAnalysis.confidence.toUpperCase()}
Artist Matches: ${mbAnalysis.artistMatches} ${mbAnalysis.artistMatches > 0 ? `(${mbAnalysis.topArtists.join(', ')})` : ''}
Song Matches: ${mbAnalysis.songMatches} ${mbAnalysis.songMatches > 0 ? `(found in songs by ${mbAnalysis.songMatches} different artists)` : ''}
Reasoning: ${mbAnalysis.reasoning}

${mbAnalysis.topSongs.length > 0 ? `Top Songs Found:\n${mbAnalysis.topSongs.map((s) => `  • "${s.title}" by ${s.artist}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CRITICAL INSTRUCTION**: MusicBrainz is a comprehensive real-world music database.
If MusicBrainz says isAmbiguous=true, you MUST use type "AMBIGUOUS" - do NOT override this with SINGLE_TAB_IMPORT or ARTIST_BULK_IMPORT.
The database knows which terms are actually ambiguous in the real music world.

`
			: '⚠️ MusicBrainz data unavailable - use your best judgment\n\n';

		return `Analyze this guitar tab import request and determine the user's intent.

User query: "${query}"

${mbSection}Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
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
"best tabs by Pink Floyd" → {"type": "ARTIST_BULK_IMPORT", "artist": "Pink Floyd", "confidence": "high"}`;
	}
}

