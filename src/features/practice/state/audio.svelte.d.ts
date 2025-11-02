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
export declare class AudioState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playbackRate: number;
    audioUrl: string | null;
    isLooping: boolean;
    loopStart: number;
    loopEnd: number;
    practiceMode: "section" | "full" | "custom";
    metronomeEnabled: boolean;
    metronomeVolume: number;
    metronomeTempo: number;
    audioFeatures: AudioFeatures | null;
    timestamps: Timestamp[];
    isAnalyzing: boolean;
    currentSession: PracticeSession | null;
    sessionHistory: PracticeSession[];
    audioContext: AudioContext | null;
    audioBuffer: AudioBuffer | null;
    sourceNode: AudioBufferSourceNode | null;
    gainNode: GainNode | null;
    progress: () => number;
    isInLoop: () => boolean;
    canPlay: () => boolean;
    hasSession: () => boolean;
    sessionDuration: () => number;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    seek(time: number): void;
    setVolume(volume: number): void;
    setPlaybackRate(rate: number): void;
    setLoop(start: number, end: number): void;
    clearLoop(): void;
    toggleLoop(): void;
    setPracticeMode(mode: 'section' | 'full' | 'custom'): void;
    toggleMetronome(): void;
    setMetronomeVolume(volume: number): void;
    setMetronomeTempo(tempo: number): void;
    loadAudio(url: string): Promise<void>;
    private analyzeAudio;
    startPracticeSession(tabId?: string, sections?: string[]): void;
    endPracticeSession(accuracy?: number, notes?: string): void;
    private playWithWebAudio;
    private playWithHTMLAudio;
    private readonly SESSION_STORAGE_KEY;
    saveSessionHistory(): void;
    loadSessionHistory(): void;
    reset(): void;
}
