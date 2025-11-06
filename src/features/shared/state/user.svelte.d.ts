/**
 * User preferences and settings state management using Svelte 5 runes
 * Manages user preferences, settings, and authentication state
 */
export interface UserPreferences {
    fontSize: number;
    showChordDiagrams: boolean;
    autoScroll: boolean;
    scrollSpeed: number;
    handedness: 'right' | 'left';
    tuning: string[];
    defaultStringCount: number;
    enableKeyboardShortcuts: boolean;
    enableSoundEffects: boolean;
    language: string;
}
export interface UserProfile {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    createdAt?: number;
    lastLoginAt?: number;
}
export declare class UserState {
    isAuthenticated: boolean;
    profile: UserProfile | null;
    preferences: UserPreferences;
    sessionStartTime: number | null;
    lastActivity: number | null;
    isLeftHanded: () => boolean;
    hasProfile: () => boolean;
    login(profile: UserProfile): void;
    logout(): void;
    updateProfile(updates: Partial<UserProfile>): void;
    updatePreferences(updates: Partial<UserPreferences>): void;
    setFontSize(fontSize: number): void;
    toggleChordDiagrams(): void;
    toggleAutoScroll(): void;
    setScrollSpeed(speed: number): void;
    setHandedness(handedness: 'right' | 'left'): void;
    setTuning(tuning: string[]): void;
    setDefaultStringCount(count: number): void;
    toggleKeyboardShortcuts(): void;
    toggleSoundEffects(): void;
    setLanguage(language: string): void;
    updateActivity(): void;
    getSessionDuration(): number;
    private readonly STORAGE_KEY;
    saveToStorage(): void;
    loadFromStorage(): void;
    clearStorage(): void;
    reset(): void;
}
