import type { IAudioProcessor } from '../contracts/IAudioProcessor';
import type { IPitchDetector } from '../contracts/IPitchDetector';
import type { NoteInfo } from '../types';
/**
 * Audio processing service for guitar tuner
 * Handles microphone access and real-time pitch detection
 */
export declare class AudioProcessorService implements IAudioProcessor {
    private pitchDetector;
    private audioContext;
    private analyser;
    private source;
    private buffer;
    private detector;
    private animationFrame;
    private stream;
    private listening;
    private detectedNote;
    private detectedFrequency;
    private detectedCents;
    constructor(pitchDetector: IPitchDetector);
    start(onPitchCallback: (frequency: number) => void): Promise<void>;
    stop(): void;
    isListening(): boolean;
    getDetectedNote(): NoteInfo | null;
    getDetectedFrequency(): number;
    getDetectedCents(): number;
    private tuneLoop;
}
