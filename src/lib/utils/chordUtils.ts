/**
 * Chord utilities - now powered by @tombatossals/chords-db
 * This file maintains backward compatibility while using the comprehensive chord database
 */

// Re-export everything from chordDb for new code
export {
	type ChordPosition,
	type ChordData,
	type ProcessedChord,
	getChordData,
	getChordVoicings,
	getChordVoicing,
	chordExists,
	getFullChordName,
	fretsToPositions,
	findChordsInText,
	generateChordsHtml,
	getAvailableKeys,
	getAvailableSuffixes
} from './chordDb';

// Legacy interfaces for backward compatibility
export interface ChordDefinition {
	positions: number[];
	barre?: number;
	baseFret?: number;
}

export type ChordDictionary = Record<string, ChordDefinition>;

// Legacy function for backward compatibility
// Converts new chord data format to old format (first voicing only)
export function getChordByName(name: string): ChordDefinition | null {
	const { getChordVoicing, fretsToPositions } = require('./chordDb');
	const voicing = getChordVoicing(name, 0);

	if (!voicing) return null;

	return {
		positions: fretsToPositions(voicing.frets),
		barre: voicing.barres?.[0],
		baseFret: voicing.baseFret || 1
	};
}

// Legacy function for backward compatibility
export async function loadChordDictionary(): Promise<ChordDictionary> {
	// No longer needed with chords-db, but kept for compatibility
	// Returns empty object since we now use the database directly
	return Promise.resolve({});
}
