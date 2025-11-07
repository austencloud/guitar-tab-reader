import { PitchDetector } from 'pitchy';
import type { TunerStatus, NoteInfo } from './types';
import { getNote } from './PitchDetector';
import {
	ExponentialMovingAverage,
	AdaptiveClarityThreshold,
	calculateRMS,
	getSignalStrength,
	getSignalStrengthPercentage,
	type SignalStrength
} from './SignalProcessor';

interface WindowWithAudioContext extends Window {
	AudioContext: AudioContextConstructor;
	webkitAudioContext?: AudioContextConstructor;
}

interface AudioContextConstructor {
	new (): AudioContext;
}

// Reactive state using Svelte 5 runes (internal)
let _tunerStatus = $state<TunerStatus>('inactive');
let _detectedNote = $state<NoteInfo | null>(null);
let _detectedFrequency = $state<number>(0);
let _detectedCents = $state<number>(0);
let _isListening = $state<boolean>(false);
let _signalStrength = $state<SignalStrength>('too-quiet');
let _signalStrengthPercentage = $state<number>(0);

// Export getter functions for reactive access
export function getTunerStatus(): TunerStatus {
	return _tunerStatus;
}

export function getDetectedNote(): NoteInfo | null {
	return _detectedNote;
}

export function getDetectedFrequency(): number {
	return _detectedFrequency;
}

export function getDetectedCents(): number {
	return _detectedCents;
}

export function getIsListening(): boolean {
	return _isListening;
}

export function getCurrentSignalStrength(): SignalStrength {
	return _signalStrength;
}

export function getCurrentSignalStrengthPercentage(): number {
	return _signalStrengthPercentage;
}

// For backward compatibility - export non-reactive initial values
export const tunerStatus: TunerStatus = 'inactive';
export const detectedNote: NoteInfo | null = null;
export const detectedFrequency: number = 0;
export const detectedCents: number = 0;
export const isListening: boolean = false;
export const signalStrength: SignalStrength = 'too-quiet';
export const signalStrengthPercentage: number = 0;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let buffer: Float32Array | null = null;
let detector: PitchDetector<Float32Array> | null = null;
let animationFrame: number | null = null;
let stream: MediaStream | null = null;

// Signal processing enhancements
let frequencyEMA: ExponentialMovingAverage | null = null;
let adaptiveThreshold: AdaptiveClarityThreshold | null = null;

export async function startTuner(onPitchCallback: (frequency: number) => void): Promise<void> {
	if (_isListening) return;

	try {
		_tunerStatus = 'requesting';

		// Initialize signal processors
		frequencyEMA = new ExponentialMovingAverage(0.3);
		adaptiveThreshold = new AdaptiveClarityThreshold(0.8);

		stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: false,
				autoGainControl: false,
				noiseSuppression: false
			}
		});

		_tunerStatus = 'active';

		const windowWithAudio = window as unknown as WindowWithAudioContext;
		const AudioContextClass = windowWithAudio.AudioContext || windowWithAudio.webkitAudioContext;

		if (!AudioContextClass) {
			throw new Error('AudioContext not supported in this browser');
		}

		audioContext = new AudioContextClass();
		analyser = audioContext.createAnalyser();
		source = audioContext.createMediaStreamSource(stream);

		analyser.fftSize = 2048;
		const bufferLength = analyser.fftSize;
		buffer = new Float32Array(bufferLength);

		source.connect(analyser);

		detector = PitchDetector.forFloat32Array(analyser.fftSize);

		_isListening = true;
		tuneLoop(onPitchCallback);
	} catch (err) {
		console.error('Error accessing microphone:', err);
		_tunerStatus = 'error';
	}
}

export function stopTuner(): void {
	if (animationFrame) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}

	if (source) {
		source.disconnect();
		source = null;
	}

	if (audioContext) {
		audioContext.close();
		audioContext = null;
	}

	if (stream) {
		stream.getTracks().forEach((track) => track.stop());
		stream = null;
	}

	// Reset signal processors
	if (frequencyEMA) {
		frequencyEMA.reset();
		frequencyEMA = null;
	}

	if (adaptiveThreshold) {
		adaptiveThreshold.reset();
		adaptiveThreshold = null;
	}

	_isListening = false;
	_tunerStatus = 'inactive';
	_detectedNote = null;
	_detectedFrequency = 0;
	_detectedCents = 0;
	_signalStrength = 'too-quiet';
	_signalStrengthPercentage = 0;
}

function tuneLoop(onPitchCallback: (frequency: number) => void): void {
	if (!analyser || !buffer || !detector || !audioContext || !frequencyEMA || !adaptiveThreshold) {
		_isListening = false;
		return;
	}

	analyser.getFloatTimeDomainData(buffer);

	// Calculate signal strength
	const rms = calculateRMS(buffer);
	_signalStrength = getSignalStrength(rms);
	_signalStrengthPercentage = getSignalStrengthPercentage(rms);

	// Get adaptive clarity threshold
	const clarityThreshold = adaptiveThreshold.getThreshold(rms);

	const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

	if (clarity > clarityThreshold && pitch > 65 && pitch < 1000) {
		// Apply exponential moving average for smoother frequency reading
		const smoothedPitch = frequencyEMA.update(pitch);

		_detectedFrequency = smoothedPitch;
		_detectedNote = getNote(smoothedPitch);

		onPitchCallback(smoothedPitch);
	} else {
		// Decay frequency when no clear signal
		if (_detectedFrequency > 0) {
			_detectedFrequency *= 0.8;
			if (_detectedFrequency < 1) {
				_detectedFrequency = 0;
				_detectedNote = null;
				frequencyEMA.reset();
			}
		}
	}

	if (_isListening) {
		animationFrame = requestAnimationFrame(() => tuneLoop(onPitchCallback));
	}
}
