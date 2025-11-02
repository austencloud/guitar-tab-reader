import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import type { TabState } from '$features/tabs/state/tab.svelte';
import type { UIState } from './ui.svelte';
import type { UserState } from './user.svelte';
import type { AudioState } from '$features/practice/state/audio.svelte';
import type { PracticeState } from '$features/practice/state/practice.svelte';

/**
 * State persistence manager using Svelte 5 runes
 * Handles automatic saving and loading of application state
 */
@injectable()
export class PersistenceManager {
	private readonly STORAGE_KEY = 'TabScroll-app-state';
	private readonly AUTO_SAVE_INTERVAL = 5000; // 5 seconds
	private autoSaveTimer: number | null = null;
	private autoSaveIntervalId: number | null = null;
	private isInitialized = false;

	constructor(
		@inject(TYPES.TabState) private tabState: TabState,
		@inject(TYPES.UIState) private uiState: UIState,
		@inject(TYPES.UserState) private userState: UserState,
		@inject(TYPES.AudioState) private audioState: AudioState,
		@inject(TYPES.PracticeState) private practiceState: PracticeState
	) {
		// Constructor intentionally empty - initialization happens in initialize()
	}

	/**
	 * Initialize the persistence manager and load saved state
	 */
	async initialize() {
		if (typeof window === 'undefined') return;

		try {
			// Load state from storage
			await this.loadState();

			// Mark as initialized to enable auto-save
			this.isInitialized = true;

			// Set up periodic auto-save
			this.autoSaveIntervalId = window.setInterval(() => {
				this.saveState();
			}, this.AUTO_SAVE_INTERVAL);

			// Set up beforeunload handler for final save
			window.addEventListener('beforeunload', () => {
				this.saveState();
			});

			// Set up visibility change handler for background saves
			document.addEventListener('visibilitychange', () => {
				if (document.hidden) {
					this.saveState();
				}
			});
		} catch (error) {
			console.warn('Failed to initialize persistence manager:', error);
			this.isInitialized = true; // Still enable auto-save even if loading failed
		}
	}

	/**
	 * Save current application state to localStorage
	 */
	saveState() {
		if (typeof localStorage === 'undefined') return;

		try {
			const state = {
				version: '1.0.0',
				timestamp: Date.now(),
				tab: {
					content: this.tabState.content,
					currentSection: this.tabState.currentSection,
					selectedChords: Array.from(this.tabState.selectedChords),
					fontSize: this.tabState.fontSize,
					showChordDiagrams: this.tabState.showChordDiagrams,
					darkMode: this.tabState.darkMode
				},
				ui: {
					// Don't persist modal states or tooltips
					sidebarOpen: this.uiState.sidebarOpen
					// Don't persist notifications or errors
				},
				user: {
					isAuthenticated: this.userState.isAuthenticated,
					profile: this.userState.profile,
					preferences: this.userState.preferences,
					sessionStartTime: this.userState.sessionStartTime,
					lastActivity: this.userState.lastActivity
				},
				audio: {
					volume: this.audioState.volume,
					playbackRate: this.audioState.playbackRate,
					practiceMode: this.audioState.practiceMode,
					metronomeEnabled: this.audioState.metronomeEnabled,
					metronomeVolume: this.audioState.metronomeVolume,
					metronomeTempo: this.audioState.metronomeTempo
					// Don't persist playback state or audio buffers
				},
				practice: {
					goals: this.practiceState.goals,
					dailyGoalMinutes: this.practiceState.dailyGoalMinutes,
					weeklyGoalSessions: this.practiceState.weeklyGoalSessions,
					stats: this.practiceState.stats,
					sectionDifficulties: Array.from(this.practiceState.sectionDifficulties.entries()),
					enableProgressTracking: this.practiceState.enableProgressTracking,
					enableDifficultyAdjustment: this.practiceState.enableDifficultyAdjustment,
					enablePracticeReminders: this.practiceState.enablePracticeReminders,
					reminderTime: this.practiceState.reminderTime
				}
			};

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
		} catch (error) {
			console.warn('Failed to save application state:', error);
		}
	}

	/**
	 * Load application state from localStorage
	 */
	async loadState() {
		if (typeof localStorage === 'undefined') return;

		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (!saved) return;

			const state = JSON.parse(saved);

			// Check version compatibility
			if (state.version && !this.isVersionCompatible(state.version)) {
				console.warn('Incompatible state version, skipping load');
				return;
			}

			// Restore tab state
			if (state.tab) {
				this.tabState.content = state.tab.content || '';
				this.tabState.currentSection = state.tab.currentSection || 0;
				this.tabState.selectedChords = new Set(state.tab.selectedChords || []);
				this.tabState.fontSize = state.tab.fontSize || 14;
				this.tabState.showChordDiagrams = state.tab.showChordDiagrams ?? true;
				this.tabState.darkMode = state.tab.darkMode || false;
			}

			// Restore UI state
			if (state.ui) {
				this.uiState.sidebarOpen = state.ui.sidebarOpen || false;
			}

			// Restore user state
			if (state.user) {
				this.userState.isAuthenticated = state.user.isAuthenticated || false;
				this.userState.profile = state.user.profile || null;
				this.userState.preferences = { ...this.userState.preferences, ...state.user.preferences };
				this.userState.sessionStartTime = state.user.sessionStartTime || null;
				this.userState.lastActivity = state.user.lastActivity || null;
			}

			// Restore audio state
			if (state.audio) {
				this.audioState.volume = state.audio.volume ?? 0.8;
				this.audioState.playbackRate = state.audio.playbackRate ?? 1.0;
				this.audioState.practiceMode = state.audio.practiceMode || 'full';
				this.audioState.metronomeEnabled = state.audio.metronomeEnabled || false;
				this.audioState.metronomeVolume = state.audio.metronomeVolume ?? 0.5;
				this.audioState.metronomeTempo = state.audio.metronomeTempo || 120;
			}

			// Restore practice state
			if (state.practice) {
				this.practiceState.goals = state.practice.goals || [];
				this.practiceState.dailyGoalMinutes = state.practice.dailyGoalMinutes || 30;
				this.practiceState.weeklyGoalSessions = state.practice.weeklyGoalSessions || 5;
				this.practiceState.stats = { ...this.practiceState.stats, ...state.practice.stats };
				this.practiceState.enableProgressTracking = state.practice.enableProgressTracking ?? true;
				this.practiceState.enableDifficultyAdjustment =
					state.practice.enableDifficultyAdjustment ?? true;
				this.practiceState.enablePracticeReminders = state.practice.enablePracticeReminders ?? true;
				this.practiceState.reminderTime = state.practice.reminderTime || '19:00';

				// Restore section difficulties
				if (state.practice.sectionDifficulties) {
					this.practiceState.sectionDifficulties = new Map(state.practice.sectionDifficulties);
				}
			}
		} catch (error) {
			console.warn('Failed to load application state:', error);
		}
	}

	/**
	 * Check if a saved state version is compatible with current version
	 */
	private isVersionCompatible(savedVersion: string): boolean {
		// For now, accept all versions
		// In the future, implement proper version compatibility checking
		return true;
	}

	/**
	 * Export application state for backup or transfer
	 */
	exportState(): string {
		this.saveState(); // Ensure current state is saved
		const state = localStorage.getItem(this.STORAGE_KEY);
		return state || '{}';
	}

	/**
	 * Import application state from backup
	 */
	async importState(stateJson: string): Promise<boolean> {
		try {
			const state = JSON.parse(stateJson);

			// Validate state structure
			if (!this.validateStateStructure(state)) {
				throw new Error('Invalid state structure');
			}

			// Save to localStorage
			localStorage.setItem(this.STORAGE_KEY, stateJson);

			// Reload state
			await this.loadState();

			return true;
		} catch (error) {
			console.error('Failed to import state:', error);
			return false;
		}
	}

	/**
	 * Validate imported state structure
	 */
	private validateStateStructure(state: any): boolean {
		// Basic validation - check for required top-level properties
		return typeof state === 'object' && state !== null && typeof state.timestamp === 'number';
	}

	/**
	 * Clear all saved state
	 */
	clearState() {
		if (typeof localStorage === 'undefined') return;

		localStorage.removeItem(this.STORAGE_KEY);

		// Reset all state objects
		this.tabState.reset();
		this.uiState.reset();
		this.userState.reset();
		this.audioState.reset();
		this.practiceState.reset();
	}

	/**
	 * Get storage usage information
	 */
	getStorageInfo(): { used: number; available: number; percentage: number } {
		if (typeof localStorage === 'undefined') {
			return { used: 0, available: 0, percentage: 0 };
		}

		try {
			const state = localStorage.getItem(this.STORAGE_KEY);
			const used = state ? new Blob([state]).size : 0;

			// Estimate available storage (most browsers have ~5-10MB limit)
			const estimated = 5 * 1024 * 1024; // 5MB estimate
			const percentage = (used / estimated) * 100;

			return {
				used,
				available: estimated - used,
				percentage: Math.min(100, percentage)
			};
		} catch (error) {
			return { used: 0, available: 0, percentage: 0 };
		}
	}

	/**
	 * Cleanup method
	 */
	destroy() {
		if (this.autoSaveTimer) {
			clearTimeout(this.autoSaveTimer);
			this.autoSaveTimer = null;
		}

		if (this.autoSaveIntervalId) {
			clearInterval(this.autoSaveIntervalId);
			this.autoSaveIntervalId = null;
		}

		// Final save before cleanup
		this.saveState();
	}
}

// Note: PersistenceManager is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.PersistenceManager) instead
