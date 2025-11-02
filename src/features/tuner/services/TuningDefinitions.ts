import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { StringDefinition, Tunings } from './types';

export const standardTunings: Tunings = {
	'Standard (E-A-D-G-B-E)': [
		{ note: 'E', octave: 2, frequency: 82.41, string: 6 }, // Low E
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 } // High E
	],
	'Drop D (D-A-D-G-B-E)': [
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }, // Low D
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 } // High E
	],
	'Drop C (C-G-C-F-A-D)': [
		{ note: 'C', octave: 2, frequency: 65.41, string: 6 }, // Low C
		{ note: 'G', octave: 2, frequency: 98.0, string: 5 },
		{ note: 'C', octave: 3, frequency: 130.81, string: 4 },
		{ note: 'F', octave: 3, frequency: 174.61, string: 3 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 } // High D
	],
	'Half Step Down (Eb-Ab-Db-Gb-Bb-Eb)': [
		{ note: 'Eb', octave: 2, frequency: 77.78, string: 6 }, // Low Eb
		{ note: 'Ab', octave: 2, frequency: 103.83, string: 5 },
		{ note: 'Db', octave: 3, frequency: 138.59, string: 4 },
		{ note: 'Gb', octave: 3, frequency: 185.0, string: 3 },
		{ note: 'Bb', octave: 3, frequency: 233.08, string: 2 },
		{ note: 'Eb', octave: 4, frequency: 311.13, string: 1 } // High Eb
	],
	'Whole Step Down (D-G-C-F-A-D)': [
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }, // Low D
		{ note: 'G', octave: 2, frequency: 98.0, string: 5 },
		{ note: 'C', octave: 3, frequency: 130.81, string: 4 },
		{ note: 'F', octave: 3, frequency: 174.61, string: 3 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 } // High D
	],
	'DADGAD (D-A-D-G-A-D)': [
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }, // Low D
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 } // High D
	],
	'Open G (D-G-D-G-B-D)': [
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }, // Low D
		{ note: 'G', octave: 2, frequency: 98.0, string: 5 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 } // High D
	],
	'Open D (D-A-D-F#-A-D)': [
		{ note: 'D', octave: 2, frequency: 73.42, string: 6 }, // Low D
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'D', octave: 3, frequency: 146.83, string: 4 },
		{ note: 'F#', octave: 3, frequency: 185.0, string: 3 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 2 },
		{ note: 'D', octave: 4, frequency: 293.66, string: 1 } // High D
	],
	'Open E (E-B-E-G#-B-E)': [
		{ note: 'E', octave: 2, frequency: 82.41, string: 6 }, // Low E
		{ note: 'B', octave: 2, frequency: 123.47, string: 5 },
		{ note: 'E', octave: 3, frequency: 164.81, string: 4 },
		{ note: 'G#', octave: 3, frequency: 207.65, string: 3 },
		{ note: 'B', octave: 3, frequency: 246.94, string: 2 },
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 } // High E
	],
	'Open A (E-A-E-A-C#-E)': [
		{ note: 'E', octave: 2, frequency: 82.41, string: 6 }, // Low E
		{ note: 'A', octave: 2, frequency: 110.0, string: 5 },
		{ note: 'E', octave: 3, frequency: 164.81, string: 4 },
		{ note: 'A', octave: 3, frequency: 220.0, string: 3 },
		{ note: 'C#', octave: 4, frequency: 277.18, string: 2 },
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 } // High E
	],
	'Open C (C-G-C-G-C-E)': [
		{ note: 'C', octave: 2, frequency: 65.41, string: 6 }, // Low C
		{ note: 'G', octave: 2, frequency: 98.0, string: 5 },
		{ note: 'C', octave: 3, frequency: 130.81, string: 4 },
		{ note: 'G', octave: 3, frequency: 196.0, string: 3 },
		{ note: 'C', octave: 4, frequency: 261.63, string: 2 },
		{ note: 'E', octave: 4, frequency: 329.63, string: 1 } // High E
	]
};

export const tunings: Writable<Tunings> = writable({ ...standardTunings });

// Global tuning preference store
const TUNING_STORAGE_KEY = 'guitar-tab-tuning';
const DEFAULT_TUNING = 'Standard (E-A-D-G-B-E)';

function loadSelectedTuning(): string {
	if (!browser) return DEFAULT_TUNING;

	try {
		const stored = localStorage.getItem(TUNING_STORAGE_KEY);
		if (stored && standardTunings[stored]) {
			return stored;
		}
	} catch {
		// localStorage not available
	}

	return DEFAULT_TUNING;
}

function saveSelectedTuning(tuning: string) {
	if (!browser) return;

	try {
		localStorage.setItem(TUNING_STORAGE_KEY, tuning);
	} catch {
		// localStorage not available
	}
}

export const selectedTuning = writable<string>(loadSelectedTuning());

// Save tuning changes to localStorage
selectedTuning.subscribe((tuning) => {
	saveSelectedTuning(tuning);
});

export function addCustomTuning(name: string, strings: StringDefinition[]): void {
	tunings.update((current) => ({ ...current, [name]: strings }));
}

/**
 * Get the short display name for a tuning (e.g., "Standard" from "Standard (E-A-D-G-B-E)")
 */
export function getTuningDisplayName(tuningName: string): string {
	const match = tuningName.match(/^([^(]+)/);
	return match ? match[1].trim() : tuningName;
}

/**
 * Get the string names for a tuning (e.g., ["E", "A", "D", "G", "B", "E"])
 */
export function getTuningStringNames(tuningName: string): string[] {
	const tuningData = standardTunings[tuningName];
	if (!tuningData) return ['E', 'A', 'D', 'G', 'B', 'E'];

	// Create a copy and sort by string number (6 to 1) and return note names
	return [...tuningData].sort((a, b) => b.string - a.string).map((string) => string.note);
}

export function getClosestString(
	frequency: number,
	activeStrings: StringDefinition[]
): StringDefinition | null {
	if (!frequency || !activeStrings?.length) return null;

	let closest = activeStrings[0];
	let smallestDistance = Infinity;

	for (const string of activeStrings) {
		const distance = Math.abs(Math.log2(frequency / string.frequency));

		if (distance < smallestDistance) {
			smallestDistance = distance;
			closest = string;
		}
	}

	return smallestDistance <= 0.26 ? closest : null;
}

export function calculateCents(actual: number, target: number): number {
	return Math.round(1200 * Math.log2(actual / target));
}
