import type { NoteInfo } from '../types';

/**
 * Audio processing service for guitar tuner
 * Handles microphone access and audio analysis
 */
export interface IAudioProcessor {
	/**
	 * Start the tuner and begin processing audio
	 * @param onPitchCallback Called when a pitch is detected
	 */
	start(onPitchCallback: (frequency: number) => void): Promise<void>;

	/**
	 * Stop the tuner and release audio resources
	 */
	stop(): void;

	/**
	 * Check if the tuner is currently listening
	 */
	isListening(): boolean;

	/**
	 * Get the currently detected note
	 */
	getDetectedNote(): NoteInfo | null;

	/**
	 * Get the currently detected frequency
	 */
	getDetectedFrequency(): number;

	/**
	 * Get the tuning offset in cents
	 */
	getDetectedCents(): number;
}
