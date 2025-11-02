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
    totalTime: number;
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
    difficulty: number;
    attempts: number;
    successRate: number;
    lastAttempt: number;
    notes: string[];
}
export declare class PracticeState {
    isActive: boolean;
    sessionStartTime: number | null;
    currentTabId: string | null;
    currentSections: string[];
    sessionNotes: PracticeNote[];
    goals: PracticeGoal[];
    dailyGoalMinutes: number;
    weeklyGoalSessions: number;
    stats: PracticeStats;
    sectionDifficulties: Map<string, PracticeDifficulty>;
    enableProgressTracking: boolean;
    enableDifficultyAdjustment: boolean;
    enablePracticeReminders: boolean;
    reminderTime: string;
    sessionDuration: () => number;
    todaysPracticeTime: () => 0;
    dailyGoalProgress: () => number;
    activeGoals: () => PracticeGoal[];
    completedGoals: () => PracticeGoal[];
    startSession(tabId?: string, sections?: string[]): void;
    endSession(accuracy?: number): void;
    pauseSession(): void;
    resumeSession(): void;
    addNote(content: string, type?: 'improvement' | 'difficulty' | 'technique' | 'general'): void;
    removeNote(noteId: string): void;
    addGoal(type: PracticeGoal['type'], target: number, description: string, deadline?: number): void;
    updateGoal(goalId: string, updates: Partial<PracticeGoal>): void;
    completeGoal(goalId: string): void;
    deleteGoal(goalId: string): void;
    updateSectionDifficulty(sectionId: string, success: boolean, notes?: string): void;
    getSectionDifficulty(sectionId: string): PracticeDifficulty | null;
    private updateStats;
    private updateStreak;
    private saveSessionData;
    setDailyGoal(minutes: number): void;
    setWeeklyGoal(sessions: number): void;
    toggleProgressTracking(): void;
    toggleDifficultyAdjustment(): void;
    togglePracticeReminders(): void;
    setReminderTime(time: string): void;
    private readonly STORAGE_KEY;
    saveToStorage(): void;
    loadFromStorage(): void;
    reset(): void;
}
