/**
 * Chord database integration using @tombatossals/chords-db
 * Provides comprehensive chord data with multiple voicings
 */

import guitarChords from '@tombatossals/chords-db/lib/guitar.json';

export interface ChordPosition {
	frets: number[]; // Array of fret numbers, -1 for muted (e.g., [1, 3, 1, 3, 1, 1])
	fingers: number[]; // Array of finger numbers (e.g., [1, 3, 1, 3, 1, 1])
	barres?: number[]; // Array of fret numbers where barres occur
	capo?: boolean; // Whether this is a capo position
	baseFret?: number; // Starting fret (1 = open position)
	midi?: number[]; // MIDI note numbers
}

export interface ChordData {
	key: string; // Root note (e.g., "C", "F#")
	suffix: string; // Chord type (e.g., "major", "minor", "7")
	positions: ChordPosition[]; // Multiple voicings
}

export interface ProcessedChord {
	name: string; // Display name (e.g., "F#m")
	fullName: string; // Full name (e.g., "F# minor")
	positions: ChordPosition[]; // All available voicings
	currentPositionIndex: number; // Currently selected voicing
	startIndex: number; // Position in text
	endIndex: number; // End position in text
}

// Normalize chord names for lookup
function normalizeChordName(name: string): { key: string; suffix: string } | null {
	// Match pattern: Root note (A-G) + optional sharp/flat + optional suffix
	const match = name.match(/^([A-G][b#]?)(.*)?$/);
	if (!match) return null;

	const key = match[1];
	let suffix = match[2] || 'major';

	// Normalize suffix names to match chords-db format
	const suffixMap: Record<string, string> = {
		'': 'major',
		m: 'minor',
		min: 'minor',
		maj: 'major',
		maj7: 'maj7',
		'7': '7',
		m7: 'm7',
		dim: 'dim',
		aug: 'aug',
		sus2: 'sus2',
		sus4: 'sus4',
		'6': '6',
		m6: 'm6',
		'9': '9',
		m9: 'm9',
		maj9: 'maj9',
		'11': '11',
		m11: 'm11',
		'13': '13',
		m13: 'm13',
		add9: 'add9',
		'7b5': '7b5',
		'7#5': '7#5',
		'7b9': '7b9',
		'7#9': '7#9',
		'5': '5',
		mmaj7: 'mmaj7',
		mmaj9: 'mmaj9'
	};

	suffix = suffixMap[suffix] || suffix;

	return { key, suffix };
}

// Get chord data from the database
export function getChordData(chordName: string): ChordData | null {
	const normalized = normalizeChordName(chordName);
	if (!normalized) return null;

	const { key, suffix } = normalized;

	// Find the chord in the database
	const chordList = (guitarChords.chords as any)[key];
	if (!chordList) return null;

	const chord = chordList.find((c: any) => c.suffix === suffix);
	if (!chord) return null;

	return {
		key: chord.key,
		suffix: chord.suffix,
		positions: chord.positions.map((pos: any) => ({
			frets: pos.frets,
			fingers: pos.fingers,
			barres: pos.barres,
			capo: pos.capo,
			baseFret: pos.baseFret || 1,
			midi: pos.midi
		}))
	};
}

// Get all available voicings for a chord
export function getChordVoicings(chordName: string): ChordPosition[] {
	const chordData = getChordData(chordName);
	return chordData?.positions || [];
}

// Get a specific voicing by index
export function getChordVoicing(chordName: string, index: number = 0): ChordPosition | null {
	const voicings = getChordVoicings(chordName);
	return voicings[index] || voicings[0] || null;
}

// Check if a chord exists in the database
export function chordExists(chordName: string): boolean {
	return getChordData(chordName) !== null;
}

// Get the full chord name (e.g., "F# minor" from "F#m")
export function getFullChordName(chordName: string): string {
	const chordData = getChordData(chordName);
	if (!chordData) return chordName;

	const suffixNames: Record<string, string> = {
		major: '',
		minor: 'minor',
		maj7: 'major 7th',
		'7': '7th',
		m7: 'minor 7th',
		dim: 'diminished',
		aug: 'augmented',
		sus2: 'suspended 2nd',
		sus4: 'suspended 4th',
		'6': '6th',
		m6: 'minor 6th',
		'9': '9th',
		m9: 'minor 9th',
		maj9: 'major 9th',
		'11': '11th',
		m11: 'minor 11th',
		'13': '13th',
		m13: 'minor 13th',
		add9: 'add 9',
		'7b5': '7 flat 5',
		'7#5': '7 sharp 5',
		'7b9': '7 flat 9',
		'7#9': '7 sharp 9',
		'5': 'power chord',
		mmaj7: 'minor major 7th',
		mmaj9: 'minor major 9th'
	};

	const suffixName = suffixNames[chordData.suffix] || chordData.suffix;
	return suffixName ? `${chordData.key} ${suffixName}` : chordData.key;
}

// Convert fret array to positions array (for backward compatibility)
// Note: The chord database already returns frets as number[], so this is mostly a pass-through
export function fretsToPositions(frets: number[]): number[] {
	return frets;
}

// Find chords in text (updated to use chords-db)
const CHORD_PATTERN =
	/\b([A-G][b#]?(?:m|maj|min|aug|dim|sus[24]|add\d|m?7|m?9|m?11|m?13|6|5)*)(?=\s|$|\]|\)|\|)/g;

export function findChordsInText(text: string): ProcessedChord[] {
	if (!text) return [];

	const chordMatches: ProcessedChord[] = [];
	const lines = text.split('\n');
	let currentPosition = 0;

	lines.forEach((line) => {
		const lineStartPosition = currentPosition;
		let match;
		CHORD_PATTERN.lastIndex = 0;

		while ((match = CHORD_PATTERN.exec(line)) !== null) {
			const chordName = match[1];
			const startIndex = lineStartPosition + match.index;
			const endIndex = startIndex + chordName.length;

			// Check if chord exists in database
			if (chordExists(chordName)) {
				const chordData = getChordData(chordName);
				if (!chordData) continue;

				const isOverlapping = chordMatches.some(
					(existingChord) =>
						(startIndex > existingChord.startIndex && startIndex < existingChord.endIndex) ||
						(endIndex > existingChord.startIndex && endIndex < existingChord.endIndex)
				);

				if (!isOverlapping) {
					chordMatches.push({
						name: chordName,
						fullName: getFullChordName(chordName),
						positions: chordData.positions,
						currentPositionIndex: 0,
						startIndex,
						endIndex
					});
				}
			}
		}

		currentPosition += line.length + 1;
	});

	return chordMatches;
}

// Generate HTML with chord spans (updated)
export function generateChordsHtml(text: string): { html: string; chords: ProcessedChord[] } {
	const chords = findChordsInText(text);
	if (chords.length === 0) return { html: text, chords };

	let html = '';
	let lastIndex = 0;

	chords.sort((a, b) => a.startIndex - b.startIndex);

	for (const chord of chords) {
		html += text.substring(lastIndex, chord.startIndex);
		html += `<span class="chord" data-chord="${chord.name}">${chord.name}</span>`;
		lastIndex = chord.endIndex;
	}

	html += text.substring(lastIndex);
	return { html, chords };
}

// Get all available chord keys
export function getAvailableKeys(): string[] {
	return Object.keys((guitarChords.chords as any));
}

// Get all available suffixes for a key
export function getAvailableSuffixes(key: string): string[] {
	const chordList = (guitarChords.chords as any)[key];
	if (!chordList) return [];
	return chordList.map((c: any) => c.suffix);
}

