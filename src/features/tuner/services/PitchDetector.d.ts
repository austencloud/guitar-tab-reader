import type { NoteInfo } from './types';
export declare function getNote(frequency: number): NoteInfo;
export declare function getTuningIndicator(cents: number): 'inactive' | 'in-tune' | 'flat' | 'sharp';
export declare function frequencyToMidiNote(frequency: number): number;
export declare function midiNoteToFrequency(midiNote: number): number;
export declare function getTargetFrequency(noteName: string, octave: number): number;
