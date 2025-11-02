import { injectable } from 'inversify';

/**
 * User preferences and settings state management using Svelte 5 runes
 * Manages user preferences, settings, and authentication state
 */

export interface UserPreferences {
	theme: 'light' | 'dark' | 'auto';
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

@injectable()
export class UserState {
	// Authentication state
	isAuthenticated = $state(false);
	profile = $state<UserProfile | null>(null);

	// User preferences with defaults
	preferences = $state<UserPreferences>({
		theme: 'auto',
		fontSize: 14,
		showChordDiagrams: true,
		autoScroll: false,
		scrollSpeed: 1,
		handedness: 'right',
		tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
		defaultStringCount: 6,
		enableKeyboardShortcuts: true,
		enableSoundEffects: true,
		language: 'en'
	});

	// Session state
	sessionStartTime = $state<number | null>(null);
	lastActivity = $state<number | null>(null);

	// Derived state
	isDarkMode = $derived(() => {
		if (this.preferences.theme === 'dark') return true;
		if (this.preferences.theme === 'light') return false;
		// Auto mode - check system preference
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
		);
	});

	isLeftHanded = $derived(() => this.preferences.handedness === 'left');
	hasProfile = $derived(() => this.profile !== null);

	// Authentication actions
	login(profile: UserProfile) {
		this.isAuthenticated = true;
		this.profile = profile;
		this.sessionStartTime = Date.now();
		this.lastActivity = Date.now();
		this.saveToStorage();
	}

	logout() {
		this.isAuthenticated = false;
		this.profile = null;
		this.sessionStartTime = null;
		this.lastActivity = null;
		this.clearStorage();
	}

	updateProfile(updates: Partial<UserProfile>) {
		if (this.profile) {
			this.profile = { ...this.profile, ...updates };
			this.saveToStorage();
		}
	}

	// Preference actions
	updatePreferences(updates: Partial<UserPreferences>) {
		this.preferences = { ...this.preferences, ...updates };
		this.saveToStorage();
	}

	setTheme(theme: 'light' | 'dark' | 'auto') {
		this.preferences.theme = theme;
		this.saveToStorage();
	}

	setFontSize(fontSize: number) {
		this.preferences.fontSize = Math.max(8, Math.min(32, fontSize));
		this.saveToStorage();
	}

	toggleChordDiagrams() {
		this.preferences.showChordDiagrams = !this.preferences.showChordDiagrams;
		this.saveToStorage();
	}

	toggleAutoScroll() {
		this.preferences.autoScroll = !this.preferences.autoScroll;
		this.saveToStorage();
	}

	setScrollSpeed(speed: number) {
		this.preferences.scrollSpeed = Math.max(0.1, Math.min(5, speed));
		this.saveToStorage();
	}

	setHandedness(handedness: 'right' | 'left') {
		this.preferences.handedness = handedness;
		this.saveToStorage();
	}

	setTuning(tuning: string[]) {
		this.preferences.tuning = [...tuning];
		this.saveToStorage();
	}

	setDefaultStringCount(count: number) {
		this.preferences.defaultStringCount = Math.max(4, Math.min(12, count));
		this.saveToStorage();
	}

	toggleKeyboardShortcuts() {
		this.preferences.enableKeyboardShortcuts = !this.preferences.enableKeyboardShortcuts;
		this.saveToStorage();
	}

	toggleSoundEffects() {
		this.preferences.enableSoundEffects = !this.preferences.enableSoundEffects;
		this.saveToStorage();
	}

	setLanguage(language: string) {
		this.preferences.language = language;
		this.saveToStorage();
	}

	// Session management
	updateActivity() {
		this.lastActivity = Date.now();
	}

	getSessionDuration(): number {
		if (!this.sessionStartTime) return 0;
		return Date.now() - this.sessionStartTime;
	}

	// Storage management
	private readonly STORAGE_KEY = 'TabScroll-user-state';

	saveToStorage() {
		if (typeof localStorage === 'undefined') return;

		try {
			const state = {
				isAuthenticated: this.isAuthenticated,
				profile: this.profile,
				preferences: this.preferences,
				sessionStartTime: this.sessionStartTime,
				lastActivity: this.lastActivity
			};
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
		} catch (error) {
			console.warn('Failed to save user state:', error);
		}
	}

	loadFromStorage() {
		if (typeof localStorage === 'undefined') return;

		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const state = JSON.parse(saved);

				// Restore authentication state
				this.isAuthenticated = state.isAuthenticated || false;
				this.profile = state.profile || null;
				this.sessionStartTime = state.sessionStartTime || null;
				this.lastActivity = state.lastActivity || null;

				// Restore preferences with defaults for missing properties
				this.preferences = {
					...this.preferences,
					...state.preferences
				};
			}
		} catch (error) {
			console.warn('Failed to load user state:', error);
		}
	}

	clearStorage() {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(this.STORAGE_KEY);
	}

	// Reset to defaults
	reset() {
		this.logout();
		this.preferences = {
			theme: 'auto',
			fontSize: 14,
			showChordDiagrams: true,
			autoScroll: false,
			scrollSpeed: 1,
			handedness: 'right',
			tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
			defaultStringCount: 6,
			enableKeyboardShortcuts: true,
			enableSoundEffects: true,
			language: 'en'
		};
		this.clearStorage();
	}
}

// Note: UserState is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.UserState) instead
