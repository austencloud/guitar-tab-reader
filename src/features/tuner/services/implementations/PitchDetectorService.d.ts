import type { IPitchDetector } from '../contracts/IPitchDetector';
import type { NoteInfo } from '../types';
/**
 * Pitch detection and conversion service
 * Provides utilities for frequency-to-note conversion and tuning calculations
 */
export declare class PitchDetectorService implements IPitchDetector {
    private readonly notes;
    private readonly a4Frequency;
    getNote(frequency: number): NoteInfo;
    getTuningIndicator(cents: number): 'inactive' | 'in-tune' | 'flat' | 'sharp';
    frequencyToMidiNote(frequency: number): number;
    midiNoteToFrequency(midiNote: number): number;
    getTargetFrequency(noteName: string, octave: number): number;
}
