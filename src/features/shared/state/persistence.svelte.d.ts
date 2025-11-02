import type { TabState } from '$features/tabs/state/tab.svelte';
import type { UIState } from './ui.svelte';
import type { UserState } from './user.svelte';
import type { AudioState } from '$features/practice/state/audio.svelte';
import type { PracticeState } from '$features/practice/state/practice.svelte';
/**
 * State persistence manager using Svelte 5 runes
 * Handles automatic saving and loading of application state
 */
export declare class PersistenceManager {
    private tabState;
    private uiState;
    private userState;
    private audioState;
    private practiceState;
    private readonly STORAGE_KEY;
    private readonly AUTO_SAVE_INTERVAL;
    private autoSaveTimer;
    private isInitialized;
    constructor(tabState: TabState, uiState: UIState, userState: UserState, audioState: AudioState, practiceState: PracticeState);
    /**
     * Initialize the persistence manager and load saved state
     */
    initialize(): Promise<void>;
    /**
     * Save current application state to localStorage
     */
    saveState(): void;
    /**
     * Load application state from localStorage
     */
    loadState(): Promise<void>;
    /**
     * Check if a saved state version is compatible with current version
     */
    private isVersionCompatible;
    /**
     * Export application state for backup or transfer
     */
    exportState(): string;
    /**
     * Import application state from backup
     */
    importState(stateJson: string): Promise<boolean>;
    /**
     * Validate imported state structure
     */
    private validateStateStructure;
    /**
     * Clear all saved state
     */
    clearState(): void;
    /**
     * Get storage usage information
     */
    getStorageInfo(): {
        used: number;
        available: number;
        percentage: number;
    };
    /**
     * Cleanup method
     */
    destroy(): void;
}
