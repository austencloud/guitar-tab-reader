import type { NoteInfo } from './types';

export function getNote(frequency: number): NoteInfo {
	const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const a4 = 440;

	const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / a4));
	const octave = 4 + Math.floor((halfStepsFromA4 + 9) / 12);

	let noteIndex = (halfStepsFromA4 + 9) % 12;
	if (noteIndex < 0) noteIndex += 12;

	return {
		name: notes[noteIndex],
		octave,
		frequency
	};
}

export function getTuningIndicator(cents: number): 'inactive' | 'in-tune' | 'flat' | 'sharp' {
	if (!cents) return 'inactive';
	if (Math.abs(cents) < 5) return 'in-tune';
	return cents < 0 ? 'flat' : 'sharp';
}

export function frequencyToMidiNote(frequency: number): number {
	return Math.round(12 * Math.log2(frequency / 440) + 69);
}

export function midiNoteToFrequency(midiNote: number): number {
	return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function getTargetFrequency(noteName: string, octave: number): number {
	const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const noteIndex = notes.indexOf(noteName);

	if (noteIndex === -1) return 0;

	const midiNote = (octave + 1) * 12 + noteIndex;
	return midiNoteToFrequency(midiNote);
}
