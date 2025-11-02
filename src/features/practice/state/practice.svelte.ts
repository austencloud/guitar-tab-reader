import { injectable } from 'inversify';

/**
 * Practice session state management using Svelte 5 runes
 * Manages practice sessions, progress tracking, and learning analytics
 */

export interface PracticeGoal {
	id: string;
	type: 'tempo' | 'accuracy' | 'sections' | 'duration' | 'custom';
	target: number;
	current: number;
	description: string;
	deadline?: number;
	completed: boolean;
}

export interface PracticeStats {
	totalSessions: number;
	totalTime: number; // in milliseconds
	averageAccuracy: number;
	sectionsCompleted: number;
	currentStreak: number;
	longestStreak: number;
	lastPracticeDate: number;
}

export interface PracticeNote {
	id: string;
	sessionId: string;
	timestamp: number;
	content: string;
	type: 'improvement' | 'difficulty' | 'technique' | 'general';
}

export interface PracticeDifficulty {
	sectionId: string;
	difficulty: number; // 1-10 scale
	attempts: number;
	successRate: number;
	lastAttempt: number;
	notes: string[];
}

@injectable()
export class PracticeState {
	// Current practice session
	isActive = $state(false);
	sessionStartTime = $state<number | null>(null);
	currentTabId = $state<string | null>(null);
	currentSections = $state<string[]>([]);
	sessionNotes = $state<PracticeNote[]>([]);

	// Practice goals
	goals = $state<PracticeGoal[]>([]);
	dailyGoalMinutes = $state(30);
	weeklyGoalSessions = $state(5);

	// Practice statistics
	stats = $state<PracticeStats>({
		totalSessions: 0,
		totalTime: 0,
		averageAccuracy: 0,
		sectionsCompleted: 0,
		currentStreak: 0,
		longestStreak: 0,
		lastPracticeDate: 0
	});

	// Section difficulties and progress
	sectionDifficulties = $state<Map<string, PracticeDifficulty>>(new Map());

	// Practice preferences
	enableProgressTracking = $state(true);
	enableDifficultyAdjustment = $state(true);
	enablePracticeReminders = $state(true);
	reminderTime = $state('19:00'); // Default reminder time

	// Derived state
	sessionDuration = $derived(() => {
		if (!this.sessionStartTime) return 0;
		return Date.now() - this.sessionStartTime;
	});

	todaysPracticeTime = $derived(() => {
		const today = new Date().toDateString();
		// TODO: Calculate today's practice time from session history
		return 0;
	});

	dailyGoalProgress = $derived(() => {
		const todayMinutes = this.todaysPracticeTime() / (1000 * 60);
		return Math.min(100, (todayMinutes / this.dailyGoalMinutes) * 100);
	});

	activeGoals = $derived(() => this.goals.filter((goal) => !goal.completed));
	completedGoals = $derived(() => this.goals.filter((goal) => goal.completed));

	// Session management
	startSession(tabId?: string, sections: string[] = []) {
		this.isActive = true;
		this.sessionStartTime = Date.now();
		this.currentTabId = tabId || null;
		this.currentSections = [...sections];
		this.sessionNotes = [];
	}

	endSession(accuracy?: number) {
		if (!this.isActive || !this.sessionStartTime) return;

		const duration = Date.now() - this.sessionStartTime;

		// Update statistics
		this.updateStats(duration, accuracy);

		// Update streak
		this.updateStreak();

		// Save session data
		this.saveSessionData(duration, accuracy);

		// Reset session state
		this.isActive = false;
		this.sessionStartTime = null;
		this.currentTabId = null;
		this.currentSections = [];
		this.sessionNotes = [];
	}

	pauseSession() {
		// TODO: Implement session pausing
	}

	resumeSession() {
		// TODO: Implement session resuming
	}

	// Notes management
	addNote(
		content: string,
		type: 'improvement' | 'difficulty' | 'technique' | 'general' = 'general'
	) {
		if (!this.isActive) return;

		const note: PracticeNote = {
			id: crypto.randomUUID(),
			sessionId: this.currentTabId || 'unknown',
			timestamp: Date.now(),
			content,
			type
		};

		this.sessionNotes.push(note);
	}

	removeNote(noteId: string) {
		this.sessionNotes = this.sessionNotes.filter((note) => note.id !== noteId);
	}

	// Goals management
	addGoal(type: PracticeGoal['type'], target: number, description: string, deadline?: number) {
		const goal: PracticeGoal = {
			id: crypto.randomUUID(),
			type,
			target,
			current: 0,
			description,
			deadline,
			completed: false
		};

		this.goals.push(goal);
		this.saveToStorage();
	}

	updateGoal(goalId: string, updates: Partial<PracticeGoal>) {
		const goalIndex = this.goals.findIndex((goal) => goal.id === goalId);
		if (goalIndex !== -1) {
			this.goals[goalIndex] = { ...this.goals[goalIndex], ...updates };
			this.saveToStorage();
		}
	}

	completeGoal(goalId: string) {
		this.updateGoal(goalId, { completed: true });
	}

	deleteGoal(goalId: string) {
		this.goals = this.goals.filter((goal) => goal.id !== goalId);
		this.saveToStorage();
	}

	// Section difficulty tracking
	updateSectionDifficulty(sectionId: string, success: boolean, notes?: string) {
		const existing = this.sectionDifficulties.get(sectionId);

		if (existing) {
			existing.attempts++;
			existing.successRate = existing.successRate + (success ? 1 : -1) / existing.attempts;
			existing.lastAttempt = Date.now();
			if (notes) existing.notes.push(notes);
		} else {
			this.sectionDifficulties.set(sectionId, {
				sectionId,
				difficulty: success ? 3 : 7, // Initial difficulty based on first attempt
				attempts: 1,
				successRate: success ? 1 : 0,
				lastAttempt: Date.now(),
				notes: notes ? [notes] : []
			});
		}

		this.saveToStorage();
	}

	getSectionDifficulty(sectionId: string): PracticeDifficulty | null {
		return this.sectionDifficulties.get(sectionId) || null;
	}

	// Statistics management
	private updateStats(duration: number, accuracy?: number) {
		this.stats.totalSessions++;
		this.stats.totalTime += duration;
		this.stats.sectionsCompleted += this.currentSections.length;
		this.stats.lastPracticeDate = Date.now();

		if (accuracy !== undefined) {
			// Update average accuracy
			const totalAccuracy = this.stats.averageAccuracy * (this.stats.totalSessions - 1) + accuracy;
			this.stats.averageAccuracy = totalAccuracy / this.stats.totalSessions;
		}

		this.saveToStorage();
	}

	private updateStreak() {
		const today = new Date().toDateString();
		const lastPractice = new Date(this.stats.lastPracticeDate).toDateString();
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

		if (lastPractice === yesterday) {
			// Continuing streak
			this.stats.currentStreak++;
		} else if (lastPractice !== today) {
			// Streak broken
			this.stats.currentStreak = 1;
		}

		// Update longest streak
		if (this.stats.currentStreak > this.stats.longestStreak) {
			this.stats.longestStreak = this.stats.currentStreak;
		}
	}

	// Data persistence
	private saveSessionData(duration: number, accuracy?: number) {
		// TODO: Save detailed session data to storage or backend
	}

	// Preferences
	setDailyGoal(minutes: number) {
		this.dailyGoalMinutes = Math.max(5, Math.min(480, minutes)); // 5 minutes to 8 hours
		this.saveToStorage();
	}

	setWeeklyGoal(sessions: number) {
		this.weeklyGoalSessions = Math.max(1, Math.min(21, sessions)); // 1 to 21 sessions per week
		this.saveToStorage();
	}

	toggleProgressTracking() {
		this.enableProgressTracking = !this.enableProgressTracking;
		this.saveToStorage();
	}

	toggleDifficultyAdjustment() {
		this.enableDifficultyAdjustment = !this.enableDifficultyAdjustment;
		this.saveToStorage();
	}

	togglePracticeReminders() {
		this.enablePracticeReminders = !this.enablePracticeReminders;
		this.saveToStorage();
	}

	setReminderTime(time: string) {
		this.reminderTime = time;
		this.saveToStorage();
	}

	// Storage management
	private readonly STORAGE_KEY = 'TabScroll-practice-state';

	saveToStorage() {
		if (typeof localStorage === 'undefined') return;

		try {
			const state = {
				goals: this.goals,
				dailyGoalMinutes: this.dailyGoalMinutes,
				weeklyGoalSessions: this.weeklyGoalSessions,
				stats: this.stats,
				sectionDifficulties: Array.from(this.sectionDifficulties.entries()),
				enableProgressTracking: this.enableProgressTracking,
				enableDifficultyAdjustment: this.enableDifficultyAdjustment,
				enablePracticeReminders: this.enablePracticeReminders,
				reminderTime: this.reminderTime
			};
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
		} catch (error) {
			console.warn('Failed to save practice state:', error);
		}
	}

	loadFromStorage() {
		if (typeof localStorage === 'undefined') return;

		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const state = JSON.parse(saved);

				this.goals = state.goals || [];
				this.dailyGoalMinutes = state.dailyGoalMinutes || 30;
				this.weeklyGoalSessions = state.weeklyGoalSessions || 5;
				this.stats = { ...this.stats, ...state.stats };
				this.enableProgressTracking = state.enableProgressTracking ?? true;
				this.enableDifficultyAdjustment = state.enableDifficultyAdjustment ?? true;
				this.enablePracticeReminders = state.enablePracticeReminders ?? true;
				this.reminderTime = state.reminderTime || '19:00';

				// Restore section difficulties
				if (state.sectionDifficulties) {
					this.sectionDifficulties = new Map(state.sectionDifficulties);
				}
			}
		} catch (error) {
			console.warn('Failed to load practice state:', error);
		}
	}

	// Reset state
	reset() {
		this.endSession();
		this.goals = [];
		this.stats = {
			totalSessions: 0,
			totalTime: 0,
			averageAccuracy: 0,
			sectionsCompleted: 0,
			currentStreak: 0,
			longestStreak: 0,
			lastPracticeDate: 0
		};
		this.sectionDifficulties.clear();
		this.dailyGoalMinutes = 30;
		this.weeklyGoalSessions = 5;
		this.enableProgressTracking = true;
		this.enableDifficultyAdjustment = true;
		this.enablePracticeReminders = true;
		this.reminderTime = '19:00';

		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(this.STORAGE_KEY);
		}
	}
}

// Note: PracticeState is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.PracticeState) instead
