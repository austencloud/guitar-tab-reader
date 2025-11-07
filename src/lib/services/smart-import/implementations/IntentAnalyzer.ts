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
			lowerQuery.includes('everything by')
		) {
			const artist = query.replace(/get me|import|tabs? for|all|everything by/gi, '').trim();
			return {
				type: 'ARTIST_BULK_IMPORT',
				artist
			};
		}

		// Check if it's a well-known band name (multi-word or famous single-word)
		const famousBands = [
			'metallica', 'nirvana', 'oasis', 'radiohead', 'muse', 'queen',
			'acdc', 'kiss', 'tool', 'slayer', 'megadeth', 'anthrax'
		];
		
		// Multi-word query is likely a band name
		const wordCount = query.trim().split(/\s+/).length;
		if (wordCount >= 2 || famousBands.includes(lowerQuery)) {
			return {
				type: 'ARTIST_BULK_IMPORT',
				artist: query.trim()
			};
		}

		// Default for single-word queries: search as song first
		// The backend will handle fallback to artist if no song is found
		return {
			type: 'SINGLE_TAB_IMPORT',
			song: query.trim(),
			confidence: 'medium'
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

**CRITICAL INSTRUCTIONS FOR MUSICBRAINZ DATA:**
1. If MusicBrainz says isAmbiguous=true, you MUST use type "AMBIGUOUS"
2. **If songMatches > 0 AND artistMatches == 0**: This is likely a SONG, not an artist! Use SINGLE_TAB_IMPORT
3. **If songMatches > artistMatches**: Prefer SINGLE_TAB_IMPORT (search as song first)
4. If MusicBrainz provides topSongs with only ONE clear artist, use that as artist+song for SINGLE_TAB_IMPORT
5. The database knows which terms are actually ambiguous in the real music world - trust it!

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

Rules (PRIORITY ORDER - apply top rules first):

**1. EXPLICIT SONG PATTERNS** → Always use SINGLE_TAB_IMPORT:
  * "{song} by {artist}" (e.g., "Wonderwall by Oasis", "Hello by Adele")
  * "{artist} - {song}" (e.g., "Led Zeppelin - Stairway to Heaven")
  * "{artist} {song}" with 2+ words after artist (e.g., "Green Day Basket Case")
  * Ultimate Guitar URLs → extract URL

**2. FAMOUS BANDS (multi-word artist names)** → Use ARTIST_BULK_IMPORT:
  * "The Beatles", "Led Zeppelin", "Pink Floyd", "Red Hot Chili Peppers"
  * "Guns N' Roses", "System of a Down", "Rage Against the Machine"
  * Multi-word names that are clearly bands

**3. SINGLE-WORD QUERIES** → **CRITICAL DECISION POINT**:
  * **IF MusicBrainz shows songMatches > 0 AND artistMatches == 0**: Use SINGLE_TAB_IMPORT (it's a song!)
  * **IF MusicBrainz shows songMatches > artistMatches**: Use SINGLE_TAB_IMPORT (more likely a song)
  * **IF MusicBrainz shows ONLY ONE topSong with artist**: Use SINGLE_TAB_IMPORT with that artist+song
  * **DEFAULT for single words**: Use SINGLE_TAB_IMPORT with confidence "medium" (search as song first)
  * **ONLY use ARTIST_BULK_IMPORT** if it's a well-known single-word band name (e.g., "Metallica", "Nirvana", "Oasis", "Radiohead")

**4. AMBIGUOUS QUERIES** → Use AMBIGUOUS (but RARELY):
  * MusicBrainz says isAmbiguous=true (MUST respect this!)
  * Obvious typos that need correction (e.g., "Beatels")
  * Genuinely unclear intent (e.g., "that song that goes...", "something by...")
  * Too vague to be actionable (e.g., "guitar tabs", "music", "songs")

**5. SPECIAL CASES:**
  * Provide spelling corrections in "suggestions" if there are likely typos
  * For ambiguous queries, provide specific song/artist suggestions, not generic placeholders
  * When parsing "{artist} {song}" format, assume the first part is the artist and the rest is the song title

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

Examples (showing priority-based decision making):

**Explicit song patterns:**
"Wonderwall by Oasis" → {"type": "SINGLE_TAB_IMPORT", "song": "Wonderwall", "artist": "Oasis", "confidence": "high"}
"Led Zeppelin - Stairway to Heaven" → {"type": "SINGLE_TAB_IMPORT", "song": "Stairway to Heaven", "artist": "Led Zeppelin", "confidence": "high"}
"Green Day Basket Case" → {"type": "SINGLE_TAB_IMPORT", "song": "Basket Case", "artist": "Green Day", "confidence": "high"}

**Famous multi-word bands:**
"The Beatles" → {"type": "ARTIST_BULK_IMPORT", "artist": "The Beatles", "confidence": "high"}
"Fish in a Birdcage" → {"type": "ARTIST_BULK_IMPORT", "artist": "Fish in a Birdcage", "confidence": "high"}
"Red Hot Chili Peppers" → {"type": "ARTIST_BULK_IMPORT", "artist": "Red Hot Chili Peppers", "confidence": "high"}

**Single-word queries (DEFAULT TO SONG unless famous band):**
"Hello" → {"type": "SINGLE_TAB_IMPORT", "song": "Hello", "confidence": "medium"}
"Yesterday" → {"type": "SINGLE_TAB_IMPORT", "song": "Yesterday", "confidence": "medium"}
"Cotton" → {"type": "SINGLE_TAB_IMPORT", "song": "Cotton", "confidence": "medium"} (will find Mountain Goats song)
"Creep" → {"type": "SINGLE_TAB_IMPORT", "song": "Creep", "confidence": "medium"}
"Dreams" → {"type": "SINGLE_TAB_IMPORT", "song": "Dreams", "confidence": "medium"}
"Metallica" → {"type": "ARTIST_BULK_IMPORT", "artist": "Metallica", "confidence": "high"} (famous band exception)
"Nirvana" → {"type": "ARTIST_BULK_IMPORT", "artist": "Nirvana", "confidence": "high"} (famous band exception)

**When MusicBrainz helps with single words:**
If MusicBrainz says: "Cotton" has 0 artists, 3 songs (including "Cotton" by "The Mountain Goats")
→ {"type": "SINGLE_TAB_IMPORT", "song": "Cotton", "artist": "The Mountain Goats", "confidence": "high"}

**Typos requiring disambiguation:**
"Beatels" → {"type": "AMBIGUOUS", "ambiguityReason": "Possible typo detected", "suggestions": ["The Beatles"], "confidence": "low"}
"Nirvanna Smells Like Teen Spirit" → {"type": "AMBIGUOUS", "ambiguityReason": "Possible typo in artist name", "suggestions": ["Nirvana - Smells Like Teen Spirit"], "confidence": "low"}

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

