import { injectable } from 'inversify';
import type { IPitchDetector } from '../contracts/IPitchDetector';
import type { NoteInfo } from '../types';

/**
 * Pitch detection and conversion service
 * Provides utilities for frequency-to-note conversion and tuning calculations
 */
@injectable()
export class PitchDetectorService implements IPitchDetector {
	private readonly notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	private readonly a4Frequency = 440;

	getNote(frequency: number): NoteInfo {
		const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / this.a4Frequency));
		const octave = 4 + Math.floor((halfStepsFromA4 + 9) / 12);

		let noteIndex = (halfStepsFromA4 + 9) % 12;
		if (noteIndex < 0) noteIndex += 12;

		return {
			name: this.notes[noteIndex],
			octave,
			frequency
		};
	}

	getTuningIndicator(cents: number): 'inactive' | 'in-tune' | 'flat' | 'sharp' {
		if (!cents) return 'inactive';
		if (Math.abs(cents) < 5) return 'in-tune';
		return cents < 0 ? 'flat' : 'sharp';
	}

	frequencyToMidiNote(frequency: number): number {
		return Math.round(12 * Math.log2(frequency / this.a4Frequency) + 69);
	}

	midiNoteToFrequency(midiNote: number): number {
		return this.a4Frequency * Math.pow(2, (midiNote - 69) / 12);
	}

	getTargetFrequency(noteName: string, octave: number): number {
		const noteIndex = this.notes.indexOf(noteName);

		if (noteIndex === -1) return 0;

		const midiNote = (octave + 1) * 12 + noteIndex;
		return this.midiNoteToFrequency(midiNote);
	}
}
