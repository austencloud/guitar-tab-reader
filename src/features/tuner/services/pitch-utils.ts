// src/lib/utils/tuner/pitch-utils.ts

/**
 * Represents a musical note with its name, octave and frequency
 */
export interface Note {
	name: string;
	octave: number;
	frequency: number;
}

/**
 * Represents a guitar string with its note, octave, frequency and string number
 */
export interface GuitarString {
	note: string;
	octave: number;
	frequency: number;
	string: number;
}

/**
 * Standard guitar tunings
 */
export const TUNINGS: Record<string, GuitarString[]> = {
	Standard: [
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'E', octave: 2, frequency: 82.41, string: 6 }
	],
	'Drop D': [
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }
	],
	'Half Step Down': [
		{ note: 'Eb', octave: 4, frequency: 311.13, string: 1 },
		{ note: 'Bb', octave: 3, frequency: 233.08, string: 2 },
		{ note: 'Gb', octave: 3, frequency: 185.0, string: 3 },
		{ note: 'Db', octave: 3, frequency: 138.59, string: 4 },
		{ note: 'Ab', octave: 2, frequency: 103.83, string: 5 },
		{ note: 'Eb', octave: 2, frequency: 77.78, string: 6 }
	],
	DADGAD: [
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }
	],
	'Open G': [
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'G', octave: 2, frequency: 98.0, string: 5 },
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }
	],
	'Open D': [
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'F#', octave: 3, frequency: 185.0, string: 3 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }
	]
};

// Musical notes in standard Western notation
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Flat equivalents for sharp notes (for display purposes)
const FLAT_EQUIVALENTS: Record<string, string> = {
	'C#': 'Db',
	'D#': 'Eb',
	'F#': 'Gb',
	'G#': 'Ab',
	'A#': 'Bb'
};

/**
 * Converts a frequency in Hz to the nearest musical note
 * @param frequency Frequency in Hz
 * @param preferFlats Whether to prefer flat notation (e.g., Bb) over sharp (e.g., A#)
 * @returns Note object containing name, octave, and exact frequency
 */
export function getNote(frequency: number, preferFlats: boolean = false): Note {
	if (!frequency || frequency <= 0) {
		return { name: '', octave: 0, frequency: 0 };
	}

	// A4 = 440Hz (standard tuning reference)
	const a4 = 440;

	// Calculate how many half steps away from A4
	// Formula: 12 * log2(f/440)
	const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / a4));

	// Calculate the octave (A4 is in octave 4)
	const octave = 4 + Math.floor((halfStepsFromA4 + 9) / 12);

	// Calculate the note index
	let noteIndex = (halfStepsFromA4 + 9) % 12;
	if (noteIndex < 0) {
		noteIndex += 12;
	}

	let noteName = NOTES[noteIndex];

	// Convert to flat notation if preferred
	if (preferFlats && FLAT_EQUIVALENTS[noteName]) {
		noteName = FLAT_EQUIVALENTS[noteName];
	}

	return {
		name: noteName,
		octave,
		frequency
	};
}

/**
 * Calculate cents deviation between actual frequency and target frequency
 * 100 cents = 1 semitone
 * @param actual Actual frequency in Hz
 * @param target Target frequency in Hz
 * @returns Cents deviation (positive = sharp, negative = flat)
 */
export function calculateCents(actual: number, target: number): number {
	if (!actual || !target || actual <= 0 || target <= 0) {
		return 0;
	}

	// Formula: 1200 * log2(actual/target)
	return Math.round(1200 * Math.log2(actual / target));
}

/**
 * Find the closest guitar string to a detected frequency
 * @param frequency Detected frequency in Hz
 * @param strings Array of strings to compare against
 * @param maxDistance Maximum musical distance to consider a match (in semitones)
 * @returns The closest matching string or null if no match is found
 */
export function findClosestString(
	frequency: number,
	strings: GuitarString[],
	maxDistance: number = 4
): GuitarString | null {
	if (!frequency || !strings || strings.length === 0) {
		return null;
	}

	let closest: GuitarString | null = null;
	let smallestDistance = Infinity;

	for (const string of strings) {
		// Using log distance for musical intervals
		const distance = Math.abs(Math.log2(frequency / string.frequency));

		if (distance < smallestDistance) {
			smallestDistance = distance;
			closest = string;
		}
	}

	// Convert to semitones (one octave = 12 semitones = log2(2))
	const semitoneDistance = smallestDistance * 12;

	// Only return if within the max distance
	if (semitoneDistance <= maxDistance) {
		return closest;
	}

	return null;
}

/**
 * Create a custom tuning from string definitions
 * @param stringNames Array of string names (e.g., ['E', 'B', 'G', 'D', 'A', 'E'])
 * @param baseTuning Reference tuning to derive frequencies from
 * @returns Array of GuitarString objects representing the custom tuning
 */
export function createCustomTuning(
	stringNames: string[],
	baseTuning: string = 'Standard'
): GuitarString[] {
	const baseStrings = TUNINGS[baseTuning] || TUNINGS['Standard'];
	const customTuning: GuitarString[] = [];

	// Use the standard frequencies as a reference
	const noteFrequencies: Record<string, number> = {};

	// Get all note frequencies from NOTES array
	// Starting with C0 at 16.35 Hz and using equal temperament
	const c0 = 16.35;
	for (let octave = 0; octave <= 8; octave++) {
		for (let i = 0; i < NOTES.length; i++) {
			const note = NOTES[i];
			// Calculate frequency using equal temperament formula:
			// f = 16.35 * 2^(octave + semitone/12)
			const semitone = i + octave * 12;
			const frequency = c0 * Math.pow(2, semitone / 12);
			noteFrequencies[`${note}${octave}`] = frequency;

			// Also add flat equivalents
			if (FLAT_EQUIVALENTS[note]) {
				noteFrequencies[`${FLAT_EQUIVALENTS[note]}${octave}`] = frequency;
			}
		}
	}

	// Create custom tuning with the same string count as stringNames
	for (let i = 0; i < stringNames.length; i++) {
		const stringNameRaw = stringNames[i];

		// Try to extract note and octave (e.g., "E4", "Bb3")
		const match = stringNameRaw.match(/([A-G][b#]?)(\d+)?/i);

		if (match) {
			const noteName = match[1];

			// Default to octave from standard tuning if not specified
			let octave: number;
			if (match[2]) {
				octave = parseInt(match[2], 10);
			} else {
				// Use corresponding string from base tuning
				const stringIndex = Math.min(i, baseStrings.length - 1);
				octave = baseStrings[stringIndex].octave;
			}

			// Look up the frequency
			const noteKey = `${noteName}${octave}`;
			let frequency = noteFrequencies[noteKey];

			// If not found, use the base tuning frequency
			if (!frequency) {
				const stringIndex = Math.min(i, baseStrings.length - 1);
				frequency = baseStrings[stringIndex].frequency;
			}

			customTuning.push({
				note: noteName,
				octave,
				frequency,
				string: i + 1
			});
		} else {
			// If string name is not valid, use the corresponding string from base tuning
			const stringIndex = Math.min(i, baseStrings.length - 1);
			customTuning.push({
				...baseStrings[stringIndex],
				string: i + 1
			});
		}
	}

	return customTuning;
}

/**
 * Get the tuning name from a set of string names
 * @param stringNames Array of string names
 * @returns The name of the matching tuning or "Custom" if no match is found
 */
export function identifyTuning(stringNames: string[]): string {
	if (!stringNames || stringNames.length === 0) {
		return 'Standard';
	}

	// Check against known tunings
	for (const [tuningName, strings] of Object.entries(TUNINGS)) {
		if (stringNames.length === strings.length) {
			let match = true;

			for (let i = 0; i < stringNames.length; i++) {
				const normalizedName = stringNames[i].replace(/\d+$/, ''); // Remove octave
				if (normalizedName !== strings[i].note) {
					match = false;
					break;
				}
			}

			if (match) {
				return tuningName;
			}
		}
	}

	return 'Custom';
}
