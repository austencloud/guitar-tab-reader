import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import { tabs } from '$lib/state/tabs.svelte';
import type { ISessionHistoryService } from '../contracts/ISessionHistoryService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PastSession, QueueTab } from '../../types';

/**
 * Service for managing session history
 * Handles past sessions, export, and tab library integration
 */

@injectable()
export class SessionHistoryService implements ISessionHistoryService {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.SessionStorage) private storage: ISessionStorage
	) {}

	// ============================================================================
	// History Operations
	// ============================================================================

	async getPastSessions(): Promise<PastSession[]> {
		return await this.storage.getPastSessions();
	}

	async getPastSession(id: string): Promise<PastSession | undefined> {
		return await this.storage.getPastSession(id);
	}

	async deletePastSession(id: string): Promise<void> {
		await this.storage.deletePastSession(id);
	}

	async exportSession(sessionId: string): Promise<string> {
		const session = await this.storage.getPastSession(sessionId);
		if (!session) {
			throw new Error('Session not found');
		}

		const lines: string[] = [];
		lines.push(`# ${session.name}`);
		lines.push(`Date: ${new Date(session.date).toLocaleDateString()}`);
		lines.push(`Duration: ${Math.floor(session.duration / 1000 / 60)} minutes`);
		lines.push(`Participants: ${session.participants.join(', ')}`);
		lines.push('');
		lines.push('## Setlist');
		lines.push('');

		session.tabsPlayed.forEach((entry, index) => {
			lines.push(
				`${index + 1}. ${entry.tab.title}${entry.tab.artist ? ` - ${entry.tab.artist}` : ''}`
			);
		});

		return lines.join('\n');
	}

	// ============================================================================
	// Tab Library Integration
	// ============================================================================

	async saveTabToLibrary(queueTab: QueueTab): Promise<void> {
		// Get tabs store and add the tab
		tabs.add(queueTab.tab);
		console.log('[SessionHistory] Saved tab to library:', queueTab.tab.title);
	}

	async batchSaveToLibrary(queueTabIds: string[]): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		if (!session) {
			return;
		}

		for (const id of queueTabIds) {
			const queueTab = session.queue.find((qt) => qt.id === id);
			if (queueTab) {
				await this.saveTabToLibrary(queueTab);
			}
		}
	}

	async savePastSessionTabs(sessionId: string): Promise<void> {
		const session = await this.storage.getPastSession(sessionId);
		if (!session) {
			throw new Error('Session not found');
		}

		for (const entry of session.tabsPlayed) {
			tabs.add(entry.tab);
		}

		console.log('[SessionHistory] Saved all tabs from past session');
	}
}

