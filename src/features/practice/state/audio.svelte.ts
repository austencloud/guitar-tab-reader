import { injectable } from 'inversify';

/**
 * Audio and practice state management using Svelte 5 runes
 * Manages audio playback, practice sessions, and audio analysis
 */

export interface AudioFeatures {
	tempo?: number;
	key?: string;
	timeSignature?: string;
	duration: number;
}

export interface Timestamp {
	position: number;
	time: number;
	section?: string;
	confidence?: number;
}

export interface PracticeSession {
	id: string;
	tabId?: string;
	startTime: number;
	endTime?: number;
	sections: string[];
	tempo: number;
	accuracy?: number;
	notes?: string;
}

@injectable()
export class AudioState {
	// Playback state
	isPlaying = $state(false);
	currentTime = $state(0);
	duration = $state(0);
	volume = $state(0.8);
	playbackRate = $state(1.0);
	audioUrl = $state<string | null>(null);

	// Practice features
	isLooping = $state(false);
	loopStart = $state(0);
	loopEnd = $state(0);
	practiceMode = $state<'section' | 'full' | 'custom'>('full');
	metronomeEnabled = $state(false);
	metronomeVolume = $state(0.5);
	metronomeTempo = $state(120);

	// Audio analysis
	audioFeatures = $state<AudioFeatures | null>(null);
	timestamps = $state<Timestamp[]>([]);
	isAnalyzing = $state(false);

	// Practice session
	currentSession = $state<PracticeSession | null>(null);
	sessionHistory = $state<PracticeSession[]>([]);

	// Audio context and nodes (for Web Audio API)
	audioContext = $state<AudioContext | null>(null);
	audioBuffer = $state<AudioBuffer | null>(null);
	sourceNode = $state<AudioBufferSourceNode | null>(null);
	gainNode = $state<GainNode | null>(null);

	// Derived state
	progress = $derived(() => (this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0));

	isInLoop = $derived(
		() => this.isLooping && this.currentTime >= this.loopStart && this.currentTime <= this.loopEnd
	);

	canPlay = $derived(() => this.audioUrl !== null || this.audioBuffer !== null);

	hasSession = $derived(() => this.currentSession !== null);

	sessionDuration = $derived(() => {
		if (!this.currentSession) return 0;
		const endTime = this.currentSession.endTime || Date.now();
		return endTime - this.currentSession.startTime;
	});

	// Playback actions
	async play() {
		if (!this.canPlay) return;

		try {
			if (this.audioContext && this.audioBuffer) {
				await this.playWithWebAudio();
			} else if (this.audioUrl) {
				await this.playWithHTMLAudio();
			}
			this.isPlaying = true;
		} catch (error) {
			console.error('Failed to play audio:', error);
		}
	}

	pause() {
		this.isPlaying = false;
		if (this.sourceNode) {
			this.sourceNode.stop();
			this.sourceNode = null;
		}
	}

	stop() {
		this.pause();
		this.currentTime = 0;
	}

	seek(time: number) {
		this.currentTime = Math.max(0, Math.min(this.duration, time));
		// If playing, restart from new position
		if (this.isPlaying) {
			this.pause();
			this.play();
		}
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
		if (this.gainNode) {
			this.gainNode.gain.value = this.volume;
		}
	}

	setPlaybackRate(rate: number) {
		this.playbackRate = Math.max(0.25, Math.min(2.0, rate));
		if (this.sourceNode) {
			this.sourceNode.playbackRate.value = this.playbackRate;
		}
	}

	// Loop actions
	setLoop(start: number, end: number) {
		this.loopStart = Math.max(0, start);
		this.loopEnd = Math.min(this.duration, end);
		this.isLooping = true;
	}

	clearLoop() {
		this.isLooping = false;
		this.loopStart = 0;
		this.loopEnd = 0;
	}

	toggleLoop() {
		this.isLooping = !this.isLooping;
	}

	// Practice mode actions
	setPracticeMode(mode: 'section' | 'full' | 'custom') {
		this.practiceMode = mode;
	}

	// Metronome actions
	toggleMetronome() {
		this.metronomeEnabled = !this.metronomeEnabled;
	}

	setMetronomeVolume(volume: number) {
		this.metronomeVolume = Math.max(0, Math.min(1, volume));
	}

	setMetronomeTempo(tempo: number) {
		this.metronomeTempo = Math.max(40, Math.min(200, tempo));
	}

	// Audio loading
	async loadAudio(url: string) {
		this.audioUrl = url;
		this.isAnalyzing = true;

		try {
			// Initialize audio context if needed
			if (!this.audioContext) {
				this.audioContext = new AudioContext();
				this.gainNode = this.audioContext.createGain();
				this.gainNode.connect(this.audioContext.destination);
			}

			// Load audio buffer
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			this.duration = this.audioBuffer.duration;

			// Basic audio analysis
			await this.analyzeAudio();
		} catch (error) {
			console.error('Failed to load audio:', error);
		} finally {
			this.isAnalyzing = false;
		}
	}

	// Audio analysis
	private async analyzeAudio() {
		if (!this.audioBuffer) return;

		// Basic feature extraction
		this.audioFeatures = {
			duration: this.audioBuffer.duration
			// TODO: Implement tempo detection, key detection, etc.
		};
	}

	// Practice session management
	startPracticeSession(tabId?: string, sections: string[] = []) {
		this.currentSession = {
			id: crypto.randomUUID(),
			tabId,
			startTime: Date.now(),
			sections,
			tempo: this.metronomeTempo
		};
	}

	endPracticeSession(accuracy?: number, notes?: string) {
		if (!this.currentSession) return;

		this.currentSession.endTime = Date.now();
		if (accuracy !== undefined) this.currentSession.accuracy = accuracy;
		if (notes) this.currentSession.notes = notes;

		// Add to history
		this.sessionHistory.push({ ...this.currentSession });
		this.currentSession = null;

		// Save to storage
		this.saveSessionHistory();
	}

	// Web Audio API implementation
	private async playWithWebAudio() {
		if (!this.audioContext || !this.audioBuffer || !this.gainNode) return;

		// Stop any existing source
		if (this.sourceNode) {
			this.sourceNode.stop();
		}

		// Create new source
		this.sourceNode = this.audioContext.createBufferSource();
		this.sourceNode.buffer = this.audioBuffer;
		this.sourceNode.playbackRate.value = this.playbackRate;
		this.sourceNode.connect(this.gainNode);

		// Set volume
		this.gainNode.gain.value = this.volume;

		// Start playback
		this.sourceNode.start(0, this.currentTime);

		// Handle end of playback
		this.sourceNode.onended = () => {
			if (this.isInLoop()) {
				this.currentTime = this.loopStart;
				this.playWithWebAudio();
			} else {
				this.isPlaying = false;
				this.sourceNode = null;
			}
		};
	}

	// HTML Audio fallback
	private async playWithHTMLAudio() {
		// TODO: Implement HTML Audio fallback for simpler use cases
	}

	// Storage management
	private readonly SESSION_STORAGE_KEY = 'TabScroll-practice-sessions';

	saveSessionHistory() {
		if (typeof localStorage === 'undefined') return;

		try {
			localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(this.sessionHistory));
		} catch (error) {
			console.warn('Failed to save session history:', error);
		}
	}

	loadSessionHistory() {
		if (typeof localStorage === 'undefined') return;

		try {
			const saved = localStorage.getItem(this.SESSION_STORAGE_KEY);
			if (saved) {
				this.sessionHistory = JSON.parse(saved);
			}
		} catch (error) {
			console.warn('Failed to load session history:', error);
		}
	}

	// Reset state
	reset() {
		this.stop();
		this.audioUrl = null;
		this.audioBuffer = null;
		this.audioFeatures = null;
		this.timestamps = [];
		this.clearLoop();
		this.metronomeEnabled = false;
		this.practiceMode = 'full';
		this.currentSession = null;

		// Clean up audio context
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
		this.sourceNode = null;
		this.gainNode = null;
	}
}

// Note: AudioState is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.AudioState) instead
