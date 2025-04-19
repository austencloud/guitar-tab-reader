import { writable, type Writable } from 'svelte/store';
import type { StringDefinition, Tunings } from './types';

export const standardTunings: Tunings = {
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
	]
};

export const tunings: Writable<Tunings> = writable({ ...standardTunings });

export function addCustomTuning(name: string, strings: StringDefinition[]): void {
	tunings.update((current) => ({ ...current, [name]: strings }));
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
