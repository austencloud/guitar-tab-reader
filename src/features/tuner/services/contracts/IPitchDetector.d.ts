import type { NoteInfo } from '../types';
/**
 * Pitch detection and conversion service
 */
export interface IPitchDetector {
    /**
     * Convert frequency to note information
     */
    getNote(frequency: number): NoteInfo;
    /**
     * Get tuning indicator based on cents offset
     */
    getTuningIndicator(cents: number): 'inactive' | 'in-tune' | 'flat' | 'sharp';
    /**
     * Convert frequency to MIDI note number
     */
    frequencyToMidiNote(frequency: number): number;
    /**
     * Convert MIDI note number to frequency
     */
    midiNoteToFrequency(midiNote: number): number;
    /**
     * Get target frequency for a note
     */
    getTargetFrequency(noteName: string, octave: number): number;
}
