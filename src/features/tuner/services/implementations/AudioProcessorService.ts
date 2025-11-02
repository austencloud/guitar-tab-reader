import { injectable, inject } from 'inversify';
import { PitchDetector } from 'pitchy';
import { TYPES } from '$core/di';
import type { IAudioProcessor } from '../contracts/IAudioProcessor';
import type { IPitchDetector } from '../contracts/IPitchDetector';
import type { NoteInfo } from '../types';

interface WindowWithAudioContext extends Window {
	AudioContext: AudioContextConstructor;
	webkitAudioContext?: AudioContextConstructor;
}

interface AudioContextConstructor {
	new (): AudioContext;
}

/**
 * Audio processing service for guitar tuner
 * Handles microphone access and real-time pitch detection
 */
@injectable()
export class AudioProcessorService implements IAudioProcessor {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private source: MediaStreamAudioSourceNode | null = null;
	private buffer: Float32Array | null = null;
	private detector: PitchDetector<Float32Array> | null = null;
	private animationFrame: number | null = null;
	private stream: MediaStream | null = null;

	private listening = $state(false);
	private detectedNote = $state<NoteInfo | null>(null);
	private detectedFrequency = $state(0);
	private detectedCents = $state(0);

	constructor(@inject(TYPES.PitchDetector) private pitchDetector: IPitchDetector) {}

	async start(onPitchCallback: (frequency: number) => void): Promise<void> {
		if (this.listening) return;

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: false,
					autoGainControl: false,
					noiseSuppression: false
				}
			});

			const windowWithAudio = window as unknown as WindowWithAudioContext;
			const AudioContextClass = windowWithAudio.AudioContext || windowWithAudio.webkitAudioContext;

			if (!AudioContextClass) {
				throw new Error('AudioContext not supported in this browser');
			}

			this.audioContext = new AudioContextClass();
			this.analyser = this.audioContext.createAnalyser();
			this.source = this.audioContext.createMediaStreamSource(this.stream);

			this.analyser.fftSize = 2048;
			const bufferLength = this.analyser.fftSize;
			this.buffer = new Float32Array(bufferLength);

			this.source.connect(this.analyser);

			this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);

			this.listening = true;
			this.tuneLoop(onPitchCallback);
		} catch (err) {
			console.error('Error accessing microphone:', err);
			throw err;
		}
	}

	stop(): void {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}

		if (this.source) {
			this.source.disconnect();
			this.source = null;
		}

		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}

		this.listening = false;
		this.detectedNote = null;
		this.detectedFrequency = 0;
		this.detectedCents = 0;
	}

	isListening(): boolean {
		return this.listening;
	}

	getDetectedNote(): NoteInfo | null {
		return this.detectedNote;
	}

	getDetectedFrequency(): number {
		return this.detectedFrequency;
	}

	getDetectedCents(): number {
		return this.detectedCents;
	}

	private tuneLoop(onPitchCallback: (frequency: number) => void): void {
		if (!this.analyser || !this.buffer || !this.detector || !this.audioContext) {
			this.listening = false;
			return;
		}

		this.analyser.getFloatTimeDomainData(this.buffer);

		const [pitch, clarity] = this.detector.findPitch(this.buffer, this.audioContext.sampleRate);

		if (clarity > 0.8 && pitch > 65 && pitch < 1000) {
			this.detectedFrequency = pitch;
			this.detectedNote = this.pitchDetector.getNote(pitch);

			onPitchCallback(pitch);
		} else {
			// Fade out the frequency
			if (this.detectedFrequency > 0) {
				this.detectedFrequency *= 0.8;
				if (this.detectedFrequency < 1) {
					this.detectedFrequency = 0;
					this.detectedNote = null;
				}
			}
		}

		if (this.listening) {
			this.animationFrame = requestAnimationFrame(() => this.tuneLoop(onPitchCallback));
		}
	}
}
