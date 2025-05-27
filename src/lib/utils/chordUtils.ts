export interface ChordPosition {
	fret: number;
	finger?: number;
	string: number;
}

// Export ChordDefinition
export interface ChordDefinition {
	positions: number[];
	barre?: number;
	baseFret?: number;
}

export interface ProcessedChord {
	name: string;
	positions: number[];
	barre?: number;
	baseFret?: number;
	startIndex: number;
	endIndex: number;
}

export type ChordDictionary = Record<string, ChordDefinition>;

// Chord parsing constants (for future use)
// const CHORD_ROOTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
// const MODIFIERS = ['b', '#', '♭', '♯'];
// const SUFFIXES = [
// 	'',
// 	'm',
// 	'7',
// 	'maj7',
// 	'm7',
// 	'dim',
// 	'aug',
// 	'sus2',
// 	'sus4',
// 	'add9',
// 	'9',
// 	'6',
// 	'm6',
// 	'5',
// 	'11',
// 	'13',
// 	'maj9',
// 	'mmaj7'
// ];

let chordDictionary: ChordDictionary = {};
let loadingPromise: Promise<void> | null = null;

const CHORD_PATTERN =
	/\b([A-G][b#]?(?:m|maj|min|aug|dim|sus[24]|add\d|m?7|m?9|m?11|m?13|6|5)*)(?=\s|$|\]|\)|\|)/g;

export function loadChordDictionary(): Promise<void> {
	if (loadingPromise) return loadingPromise;

	const basicChords: ChordDictionary = {
		// A family
		A: { positions: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
		Am: { positions: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
		A7: { positions: [-1, 0, 2, 0, 2, 0], baseFret: 1 },
		Amaj7: { positions: [-1, 0, 2, 1, 2, 0], baseFret: 1 },
		Am7: { positions: [-1, 0, 2, 0, 1, 0], baseFret: 1 },

		// A# / Bb family
		'A#': { positions: [-1, 1, 3, 3, 3, 1], barre: 1, baseFret: 1 },
		'A#m': { positions: [-1, 1, 3, 3, 2, 1], barre: 1, baseFret: 1 },

		// B family
		B: { positions: [-1, 2, 4, 4, 4, 2], barre: 2, baseFret: 1 },
		Bm: { positions: [-1, 2, 4, 4, 3, 2], barre: 2, baseFret: 1 },
		B7: { positions: [-1, 2, 1, 2, 0, 2], baseFret: 1 },
		Bmaj7: { positions: [-1, 2, 4, 3, 4, 2], barre: 2, baseFret: 1 },
		Bm7: { positions: [-1, 2, 0, 2, 0, 2], baseFret: 1 },

		// C family
		C: { positions: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
		Cm: { positions: [-1, 3, 5, 5, 4, 3], barre: 3, baseFret: 1 },
		C7: { positions: [-1, 3, 2, 3, 1, 0], baseFret: 1 },
		Cmaj7: { positions: [-1, 3, 2, 0, 0, 0], baseFret: 1 },
		Cm7: { positions: [-1, 3, 1, 3, 1, 3], baseFret: 1 },

		// D family
		D: { positions: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
		Dm: { positions: [-1, -1, 0, 2, 3, 1], baseFret: 1 },
		D7: { positions: [-1, -1, 0, 2, 1, 2], baseFret: 1 },
		Dmaj7: { positions: [-1, -1, 0, 2, 2, 2], baseFret: 1 },
		Dm7: { positions: [-1, -1, 0, 2, 1, 1], baseFret: 1 },

		// E family
		E: { positions: [0, 2, 2, 1, 0, 0], baseFret: 1 },
		Em: { positions: [0, 2, 2, 0, 0, 0], baseFret: 1 },
		E7: { positions: [0, 2, 0, 1, 0, 0], baseFret: 1 },
		Emaj7: { positions: [0, 2, 1, 1, 0, 0], baseFret: 1 },
		Em7: { positions: [0, 2, 0, 0, 0, 0], baseFret: 1 },

		// F family
		F: { positions: [1, 3, 3, 2, 1, 1], barre: 1, baseFret: 1 },
		Fm: { positions: [1, 3, 3, 1, 1, 1], barre: 1, baseFret: 1 },
		F7: { positions: [1, 3, 1, 2, 1, 1], barre: 1, baseFret: 1 },
		Fmaj7: { positions: [1, 3, 2, 2, 1, 0], baseFret: 1 },
		Fm7: { positions: [1, 3, 1, 1, 1, 1], barre: 1, baseFret: 1 },

		// G family
		G: { positions: [3, 2, 0, 0, 0, 3], baseFret: 1 },
		Gm: { positions: [3, 5, 5, 3, 3, 3], barre: 3, baseFret: 1 },
		G7: { positions: [3, 2, 0, 0, 0, 1], baseFret: 1 },
		Gmaj7: { positions: [3, 2, 0, 0, 0, 2], baseFret: 1 },
		Gm7: { positions: [3, 5, 3, 3, 3, 3], barre: 3, baseFret: 1 },

		// Common suspended
		Asus2: { positions: [-1, 0, 2, 2, 0, 0], baseFret: 1 },
		Asus4: { positions: [-1, 0, 2, 2, 3, 0], baseFret: 1 },
		Dsus2: { positions: [-1, -1, 0, 2, 3, 0], baseFret: 1 },
		Dsus4: { positions: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
		Esus4: { positions: [0, 2, 2, 2, 0, 0], baseFret: 1 }
	};

	loadingPromise = Promise.resolve().then(() => {
		chordDictionary = basicChords;
	});

	return loadingPromise;
}

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

			if (chordDictionary[chordName]) {
				const { positions, barre, baseFret } = chordDictionary[chordName];

				const isOverlapping = chordMatches.some(
					(existingChord) =>
						(startIndex > existingChord.startIndex && startIndex < existingChord.endIndex) ||
						(endIndex > existingChord.startIndex && endIndex < existingChord.endIndex)
				);

				if (!isOverlapping) {
					chordMatches.push({
						name: chordName,
						positions,
						barre,
						baseFret,
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

export function getChordByName(name: string): ChordDefinition | null {
	return chordDictionary[name] || null;
}
