import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { Tab } from '$lib/stores/tabs';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type {
	QueueTab,
	SessionEvent,
	QueueTabAddedPayload,
	QueueTabRemovedPayload,
	QueueReorderedPayload,
	TabStartedPayload
} from '../../types';
import { SessionError, SessionErrorCode, SessionEventType } from '../../types';

/**
 * Service for managing the session queue
 * Handles adding, removing, reordering, and playing tabs
 */

@injectable()
export class QueueManagementService implements IQueueManagementService {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.PeerConnection) private peerConnection: IPeerConnection,
		@inject(TYPES.SessionEventBus) private eventBus: ISessionEventBus
	) {}

	// ============================================================================
	// Queue Operations
	// ============================================================================

	async addTabToQueue(tab: Tab): Promise<QueueTab> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const queueTab: QueueTab = {
			id: crypto.randomUUID(),
			tab,
			addedBy: memberId,
			addedAt: Date.now(),
			order: session.queue.length
		};

		session.queue.push(queueTab);
		session.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueTabAddedPayload> = {
			type: SessionEventType.QUEUE_TAB_ADDED,
			payload: { queueTab },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[QueueManagement] Added tab to queue:', tab.title);
		this.eventBus.emitQueueUpdate(session.queue);
		this.eventBus.emitSessionUpdate(session);

		return queueTab;
	}

	async removeTabFromQueue(queueTabId: string): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		session.queue = session.queue.filter((qt) => qt.id !== queueTabId);
		session.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueTabRemovedPayload> = {
			type: SessionEventType.QUEUE_TAB_REMOVED,
			payload: { queueTabId },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[QueueManagement] Removed tab from queue:', queueTabId);
		this.eventBus.emitQueueUpdate(session.queue);
		this.eventBus.emitSessionUpdate(session);
	}

	async reorderQueue(queueTabs: QueueTab[]): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		// Update order property
		queueTabs.forEach((qt, index) => {
			qt.order = index;
		});

		session.queue = queueTabs;
		session.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueReorderedPayload> = {
			type: SessionEventType.QUEUE_REORDERED,
			payload: { queueTabs },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[QueueManagement] Queue reordered');
		this.eventBus.emitQueueUpdate(session.queue);
		this.eventBus.emitSessionUpdate(session);
	}

	async setCurrentTab(queueTabId: string): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const queueTab = session.queue.find((qt) => qt.id === queueTabId);
		if (!queueTab) {
			throw new Error('Queue tab not found');
		}

		// Add previous tab to history if exists
		if (session.currentTabId) {
			const previousTab = session.queue.find((qt) => qt.id === session.currentTabId);
			if (previousTab) {
				session.history.push({
					tabId: previousTab.id,
					tab: previousTab.tab,
					playedAt: Date.now(),
					duration: undefined // Will be calculated when next tab starts
				});
			}
		}

		session.currentTabId = queueTabId;
		session.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<TabStartedPayload> = {
			type: SessionEventType.TAB_STARTED,
			payload: { tabId: queueTabId },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[QueueManagement] Current tab set to:', queueTab.tab.title);
		this.eventBus.emitSessionUpdate(session);
	}

	getNextTab(): QueueTab | null {
		const session = this.lifecycle.getCurrentSession();
		if (!session) {
			return null;
		}

		if (!session.currentTabId) {
			return session.queue[0] || null;
		}

		const currentIndex = session.queue.findIndex((qt) => qt.id === session.currentTabId);

		if (currentIndex === -1 || currentIndex === session.queue.length - 1) {
			return null;
		}

		return session.queue[currentIndex + 1];
	}

	async playNextTab(): Promise<void> {
		const nextTab = this.getNextTab();
		if (nextTab) {
			await this.setCurrentTab(nextTab.id);
		}
	}

	getQueue(): QueueTab[] {
		const session = this.lifecycle.getCurrentSession();
		return session?.queue || [];
	}

	getCurrentTabId(): string | null {
		const session = this.lifecycle.getCurrentSession();
		return session?.currentTabId || null;
	}
}

