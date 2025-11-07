import type { Tab } from '$lib/state/tabs.svelte';
import type { PastSession, QueueTab } from '../../types';

/**
 * Service for managing session history
 * Handles past sessions, export, and tab library integration
 */

export interface ISessionHistoryService {
	/**
	 * Get past sessions
	 */
	getPastSessions(): Promise<PastSession[]>;

	/**
	 * Get a specific past session
	 */
	getPastSession(id: string): Promise<PastSession | undefined>;

	/**
	 * Delete a past session
	 */
	deletePastSession(id: string): Promise<void>;

	/**
	 * Export session as text/markdown
	 */
	exportSession(sessionId: string): Promise<string>;

	/**
	 * Save a tab from session to personal library
	 */
	saveTabToLibrary(queueTab: QueueTab): Promise<void>;

	/**
	 * Batch save multiple tabs to library
	 */
	batchSaveToLibrary(queueTabIds: string[]): Promise<void>;

	/**
	 * Batch save all tabs from a past session
	 */
	savePastSessionTabs(sessionId: string): Promise<void>;
}

