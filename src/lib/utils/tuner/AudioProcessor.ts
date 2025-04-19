import { writable, type Writable } from 'svelte/store';
import { PitchDetector } from 'pitchy';
import type { TunerStatus, NoteInfo } from './types';
import { getNote } from './PitchDetector';

interface WindowWithAudioContext extends Window {
	AudioContext: AudioContextConstructor;
	webkitAudioContext?: AudioContextConstructor;
}

interface AudioContextConstructor {
	new (): AudioContext;
}

export const tunerStatus: Writable<TunerStatus> = writable('inactive');
export const detectedNote: Writable<NoteInfo | null> = writable(null);
export const detectedFrequency: Writable<number> = writable(0);
export const detectedCents: Writable<number> = writable(0);
export const isListening: Writable<boolean> = writable(false);

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let buffer: Float32Array | null = null;
let detector: PitchDetector<Float32Array> | null = null;
let animationFrame: number | null = null;
let stream: MediaStream | null = null;

export async function startTuner(onPitchCallback: (frequency: number) => void): Promise<void> {
	if (isListeningValue()) return;

	try {
		tunerStatus.set('requesting');

		stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: false,
				autoGainControl: false,
				noiseSuppression: false
			}
		});

		tunerStatus.set('active');

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

		isListening.set(true);
		tuneLoop(onPitchCallback);
	} catch (err) {
		console.error('Error accessing microphone:', err);
		tunerStatus.set('error');
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

	isListening.set(false);
	tunerStatus.set('inactive');
	detectedNote.set(null);
	detectedFrequency.set(0);
	detectedCents.set(0);
}

function isListeningValue(): boolean {
	let result = false;
	const unsubscribe = isListening.subscribe((value) => {
		result = value;
	});
	unsubscribe();
	return result;
}

function tuneLoop(onPitchCallback: (frequency: number) => void): void {
	if (!analyser || !buffer || !detector || !audioContext) {
		isListening.set(false);
		return;
	}

	analyser.getFloatTimeDomainData(buffer);

	const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

	if (clarity > 0.8 && pitch > 65 && pitch < 1000) {
		detectedFrequency.set(pitch);
		detectedNote.set(getNote(pitch));

		onPitchCallback(pitch);
	} else {
		detectedFrequency.update((curr) => {
			if (curr > 0) {
				curr *= 0.8;
				if (curr < 1) {
					curr = 0;
					detectedNote.set(null);
				}
			}
			return curr;
		});
	}

	let stillListening = false;
	const unsubscribe = isListening.subscribe((value) => {
		stillListening = value;
	});
	unsubscribe();

	if (stillListening) {
		animationFrame = requestAnimationFrame(() => tuneLoop(onPitchCallback));
	}
}
