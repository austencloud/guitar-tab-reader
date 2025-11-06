import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { ISessionSyncService } from '../contracts/ISessionSyncService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type {
	SessionEvent,
	Member,
	MemberJoinedPayload,
	MemberLeftPayload,
	QueueTabAddedPayload,
	QueueTabRemovedPayload,
	QueueReorderedPayload,
	TabStartedPayload,
	ScrollPositionUpdatedPayload,
	SessionSettingsUpdatedPayload,
	SessionStateSyncPayload
} from '../../types';
import { SessionEventType } from '../../types';

/**
 * Service for synchronizing session state across peers
 * Handles WebRTC event coordination and state synchronization
 */

@injectable()
export class SessionSyncService implements ISessionSyncService {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.PeerConnection) private peerConnection: IPeerConnection,
		@inject(TYPES.SessionEventBus) private eventBus: ISessionEventBus
	) {}

	// ============================================================================
	// Initialization
	// ============================================================================

	initialize(): void {
		this.setupPeerConnectionHandlers();
		this.setupEventBusHandlers();
	}

	cleanup(): void {
		// Cleanup would happen here if needed
		// For now, the event bus and peer connection handle their own cleanup
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	private setupPeerConnectionHandlers(): void {
		// Handle incoming events from peers
		this.peerConnection.onEvent((event, fromPeerId) => {
			this.handlePeerEvent(event, fromPeerId);
		});

		// Handle peer connections
		this.peerConnection.onPeerConnected((peerId) => {
			console.log('[SessionSync] Peer connected:', peerId);
			// Send current session state to new peer
			const session = this.lifecycle.getCurrentSession();
			const memberId = this.lifecycle.getCurrentMemberId();

			if (session && memberId) {
				const event: SessionEvent<SessionStateSyncPayload> = {
					type: SessionEventType.SESSION_STATE_SYNC,
					payload: { session },
					senderId: memberId,
					timestamp: Date.now()
				};
				this.peerConnection.sendTo(peerId, event);
			}
		});

		// Handle peer disconnections
		this.peerConnection.onPeerDisconnected((peerId) => {
			console.log('[SessionSync] Peer disconnected:', peerId);
			const session = this.lifecycle.getCurrentSession();

			if (session) {
				const member = session.members.find((m) => m.id === peerId);
				if (member) {
					member.isOnline = false;
					this.eventBus.emitMemberUpdate(session.members);
				}
			}
		});
	}

	private setupEventBusHandlers(): void {
		// Listen for peer events from the event bus
		this.eventBus.onPeerEvent(({ event, fromPeerId }) => {
			this.handlePeerEvent(event, fromPeerId);
		});
	}

	private handlePeerEvent(event: SessionEvent, fromPeerId: string): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) {
			return;
		}

		console.log('[SessionSync] Handling event:', event.type, 'from:', fromPeerId);

		try {
			switch (event.type) {
				case SessionEventType.MEMBER_JOINED:
					this.handleMemberJoined(event.payload as MemberJoinedPayload);
					break;
				case SessionEventType.MEMBER_LEFT:
					this.handleMemberLeft(event.payload as MemberLeftPayload);
					break;
				case SessionEventType.QUEUE_TAB_ADDED:
					this.handleQueueTabAdded(event.payload as QueueTabAddedPayload);
					break;
				case SessionEventType.QUEUE_TAB_REMOVED:
					this.handleQueueTabRemoved(event.payload as QueueTabRemovedPayload);
					break;
				case SessionEventType.QUEUE_REORDERED:
					this.handleQueueReordered(event.payload as QueueReorderedPayload);
					break;
				case SessionEventType.TAB_STARTED:
					this.handleTabStarted(event.payload as TabStartedPayload);
					break;
				case SessionEventType.SCROLL_POSITION_UPDATED:
					this.handleScrollPositionUpdated(event.payload as ScrollPositionUpdatedPayload);
					break;
				case SessionEventType.SESSION_SETTINGS_UPDATED:
					this.handleSessionSettingsUpdated(event.payload as SessionSettingsUpdatedPayload);
					break;
				case SessionEventType.SESSION_STATE_SYNC:
					this.handleSessionStateSync(event.payload as SessionStateSyncPayload);
					break;
			}
		} catch (error) {
			console.error('[SessionSync] Error handling event:', error);
			this.eventBus.emitError(error as Error);
		}
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================

	private handleMemberJoined(payload: MemberJoinedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.members.push(payload.member);
		this.eventBus.emitMemberUpdate(session.members);
	}

	private handleMemberLeft(payload: MemberLeftPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.members = session.members.filter((m) => m.id !== payload.memberId);
		this.eventBus.emitMemberUpdate(session.members);
	}

	private handleQueueTabAdded(payload: QueueTabAddedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.queue.push(payload.queueTab);
		this.eventBus.emitQueueUpdate(session.queue);
	}

	private handleQueueTabRemoved(payload: QueueTabRemovedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.queue = session.queue.filter((qt) => qt.id !== payload.queueTabId);
		this.eventBus.emitQueueUpdate(session.queue);
	}

	private handleQueueReordered(payload: QueueReorderedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.queue = payload.queueTabs;
		this.eventBus.emitQueueUpdate(session.queue);
	}

	private handleTabStarted(payload: TabStartedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		session.currentTabId = payload.tabId;
		this.eventBus.emitSessionUpdate(session);
	}

	private handleScrollPositionUpdated(payload: ScrollPositionUpdatedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		const member = session.members.find((m) => m.id === payload.memberId);
		if (member) {
			member.scrollPosition = payload.lineNumber;
			this.eventBus.emitMemberUpdate(session.members);
		}
	}

	private handleSessionSettingsUpdated(payload: SessionSettingsUpdatedPayload): void {
		const session = this.lifecycle.getCurrentSession();
		if (!session) return;

		Object.assign(session.settings, payload.settings);
		this.eventBus.emitSessionUpdate(session);
	}

	private handleSessionStateSync(payload: SessionStateSyncPayload): void {
		const session = this.lifecycle.getCurrentSession();

		// Merge incoming session state with current state
		if (!session) {
			this.lifecycle.updateCurrentSession(payload.session);
		} else {
			// Merge carefully to preserve local member info
			const mergedSession = {
				...payload.session,
				members: this.mergeMemberLists(session.members, payload.session.members)
			};
			this.lifecycle.updateCurrentSession(mergedSession);
		}

		this.eventBus.emitSessionUpdate(payload.session);
		this.eventBus.emitQueueUpdate(payload.session.queue);
		this.eventBus.emitMemberUpdate(payload.session.members);
	}

	private mergeMemberLists(local: Member[], remote: Member[]): Member[] {
		const merged = new Map<string, Member>();

		// Add local members
		local.forEach((m) => merged.set(m.id, m));

		// Merge with remote members
		remote.forEach((m) => {
			if (merged.has(m.id)) {
				// Update existing member
				merged.set(m.id, { ...merged.get(m.id)!, ...m });
			} else {
				// Add new member
				merged.set(m.id, m);
			}
		});

		return Array.from(merged.values());
	}
}

