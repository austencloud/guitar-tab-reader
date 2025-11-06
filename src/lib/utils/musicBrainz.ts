/**
 * MusicBrainz API utility for music entity disambiguation
 * Free, comprehensive music database with no API key required
 * Rate limit: 1 request per second (we'll respect this)
 */

const MB_API_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'TabScrollApp/1.0 (https://github.com/yourusername/tab-scroll)';

interface MusicBrainzArtist {
	id: string;
	name: string;
	'sort-name': string;
	score: number;
	type?: string;
}

interface MusicBrainzRecording {
	id: string;
	title: string;
	score: number;
	'artist-credit'?: Array<{
		artist: {
			name: string;
		};
	}>;
}

interface AmbiguityAnalysis {
	isAmbiguous: boolean;
	confidence: 'high' | 'medium' | 'low';
	artistMatches: number;
	songMatches: number;
	topArtists: string[];
	topSongs: Array<{ title: string; artist: string }>;
	reasoning: string;
}

/**
 * Search for artists matching the query
 */
async function searchArtists(query: string): Promise<MusicBrainzArtist[]> {
	try {
		const url = `${MB_API_BASE}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=10`;
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT,
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			console.warn(`MusicBrainz artist search failed: ${response.status}`);
			return [];
		}

		const data = await response.json();
		return data.artists || [];
	} catch (error) {
		console.error('MusicBrainz artist search error:', error);
		return [];
	}
}

/**
 * Search for recordings (songs) matching the query
 */
async function searchRecordings(query: string): Promise<MusicBrainzRecording[]> {
	try {
		const url = `${MB_API_BASE}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=20`;
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT,
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			console.warn(`MusicBrainz recording search failed: ${response.status}`);
			return [];
		}

		const data = await response.json();
		return data.recordings || [];
	} catch (error) {
		console.error('MusicBrainz recording search error:', error);
		return [];
	}
}

/**
 * Analyze a query for ambiguity using real MusicBrainz data
 * This is the KEY function - it checks against real music database
 */
export async function analyzeQueryAmbiguity(query: string): Promise<AmbiguityAnalysis> {
	console.log(`🎵 MusicBrainz: Analyzing "${query}" for ambiguity...`);

	// Search both artists and recordings in parallel
	const [artists, recordings] = await Promise.all([
		searchArtists(query),
		searchRecordings(query)
	]);

	console.log(`📊 MusicBrainz results: ${artists.length} artists, ${recordings.length} songs`);

	// Filter for high-confidence matches (score > 80)
	const strongArtistMatches = artists.filter(a => a.score > 80);
	const strongSongMatches = recordings.filter(r => r.score > 80);

	// Extract unique artists from recordings
	const recordingArtists = new Set<string>();
	recordings.forEach(r => {
		if (r['artist-credit']?.[0]?.artist?.name) {
			recordingArtists.add(r['artist-credit'][0].artist.name);
		}
	});

	// Build analysis
	const topArtists = strongArtistMatches.slice(0, 5).map(a => a.name);
	const topSongs = strongSongMatches.slice(0, 5).map(r => ({
		title: r.title,
		artist: r['artist-credit']?.[0]?.artist?.name || 'Unknown'
	}));

	// Determine ambiguity based on REAL data
	let isAmbiguous = false;
	let confidence: 'high' | 'medium' | 'low' = 'high';
	let reasoning = '';

	// Case 1: Multiple strong artist matches (e.g., "Ghost" - band vs other artists)
	if (strongArtistMatches.length >= 2) {
		isAmbiguous = true;
		confidence = 'low';
		reasoning = `Found ${strongArtistMatches.length} artists with this name in MusicBrainz`;
	}
	// Case 2: Strong artist match + many songs (e.g., "Angel" - artist AND song title)
	else if (strongArtistMatches.length >= 1 && recordingArtists.size >= 3) {
		isAmbiguous = true;
		confidence = 'low';
		reasoning = `Could be artist "${strongArtistMatches[0].name}" OR a song title (found ${recordingArtists.size} artists with songs named this)`;
	}
	// Case 3: MANY songs by different artists (e.g., "Home", "Dreams", "Angel")
	else if (recordingArtists.size >= 5) {
		isAmbiguous = true;
		confidence = 'low';
		reasoning = `Found ${recordingArtists.size}+ different artists with songs titled "${query}" - very common song title`;
	}
	// Case 4: Some songs by different artists (moderate ambiguity)
	else if (recordingArtists.size >= 3) {
		isAmbiguous = true;
		confidence = 'medium';
		reasoning = `Found ${recordingArtists.size} artists with songs titled "${query}"`;
	}
	// Case 5: Clear - only one strong match
	else if (strongArtistMatches.length === 1 && recordingArtists.size <= 2) {
		isAmbiguous = false;
		confidence = 'high';
		reasoning = `Clear match to artist "${strongArtistMatches[0].name}"`;
	}
	// Case 6: Clear song title with one dominant artist
	else if (recordingArtists.size === 1) {
		isAmbiguous = false;
		confidence = 'high';
		const artistName = Array.from(recordingArtists)[0];
		reasoning = `Clear match to song "${query}" by ${artistName}`;
	}
	// Case 7: No strong matches - probably a typo or obscure query
	else {
		isAmbiguous = true;
		confidence = 'low';
		reasoning = 'No strong matches in MusicBrainz - may be obscure, misspelled, or needs live search';
	}

	console.log(`✅ MusicBrainz analysis: ${isAmbiguous ? 'AMBIGUOUS' : 'CLEAR'} (${confidence} confidence)`);
	console.log(`   Reasoning: ${reasoning}`);

	return {
		isAmbiguous,
		confidence,
		artistMatches: strongArtistMatches.length,
		songMatches: recordingArtists.size,
		topArtists,
		topSongs,
		reasoning
	};
}

/**
 * Get a quick ambiguity score (0-100, higher = more ambiguous)
 * Useful for quick checks without full analysis
 */
export async function getAmbiguityScore(query: string): Promise<number> {
	const analysis = await analyzeQueryAmbiguity(query);

	let score = 0;

	// More artists = more ambiguous
	score += Math.min(analysis.artistMatches * 15, 30);

	// More songs by different artists = very ambiguous
	score += Math.min(analysis.songMatches * 10, 40);

	// Low confidence = ambiguous
	if (analysis.confidence === 'low') score += 30;
	else if (analysis.confidence === 'medium') score += 15;

	return Math.min(score, 100);
}
