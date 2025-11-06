import type { Tab } from '$lib/stores/tabs';
import type { QueueTab } from '../../types';

/**
 * Service for managing the session queue
 * Handles adding, removing, reordering, and playing tabs
 */

export interface IQueueManagementService {
	/**
	 * Add a tab to the session queue
	 */
	addTabToQueue(tab: Tab): Promise<QueueTab>;

	/**
	 * Remove a tab from the queue
	 */
	removeTabFromQueue(queueTabId: string): Promise<void>;

	/**
	 * Reorder the queue (drag-and-drop)
	 */
	reorderQueue(queueTabs: QueueTab[]): Promise<void>;

	/**
	 * Set the currently playing tab
	 */
	setCurrentTab(queueTabId: string): Promise<void>;

	/**
	 * Get the next tab in queue
	 */
	getNextTab(): QueueTab | null;

	/**
	 * Play the next tab in queue
	 */
	playNextTab(): Promise<void>;

	/**
	 * Get the current queue
	 */
	getQueue(): QueueTab[];

	/**
	 * Get the current tab ID
	 */
	getCurrentTabId(): string | null;
}

