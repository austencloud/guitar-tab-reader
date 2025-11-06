import { injectable, inject } from 'inversify';
import type { Tab } from '$lib/stores/tabs';
import { tabs } from '$lib/stores/tabs';
import type { ISessionManager } from '../contracts/ISessionManager';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type {
	Session,
	QueueTab,
	Member,
	SessionSettings,
	SessionEvent,
	PastSession,
	PersistentRoom,
	Playlist,
	SessionHistoryEntry
} from '../../types';
import {
	SessionEventType,
	SessionError,
	SessionErrorCode,
	type MemberJoinedPayload,
	type MemberLeftPayload,
	type QueueTabAddedPayload,
	type QueueTabRemovedPayload,
	type QueueReorderedPayload,
	type TabStartedPayload,
	type ScrollPositionUpdatedPayload,
	type SessionSettingsUpdatedPayload,
	type SessionStateSyncPayload
} from '../../types';
import { generateRoomCode } from '../../utils/roomCodeGenerator';
import { TYPES } from '$core/di/types';

/**
 * High-level session management service
 * Coordinates WebRTC connections and local storage
 */

@injectable()
export class SessionManagerService implements ISessionManager {
	private currentSession: Session | null = null;
	private currentMemberId: string | null = null;
	private sessionStartTime: number = 0;

	// Event callbacks
	private sessionUpdateCallbacks: ((session: Session) => void)[] = [];
	private queueUpdateCallbacks: ((queue: QueueTab[]) => void)[] = [];
	private memberUpdateCallbacks: ((members: Member[]) => void)[] = [];
	private errorCallbacks: ((error: Error) => void)[] = [];

	constructor(
		@inject(TYPES.PeerConnection) private peerConnection: IPeerConnection,
		@inject(TYPES.SessionStorage) private storage: ISessionStorage
	) {
		this.setupPeerConnectionHandlers();
	}

	// ============================================================================
	// Session Lifecycle
	// ============================================================================

	async createSession(
		name: string,
		deviceName: string,
		persistentRoomId?: string
	): Promise<Session> {
		if (this.currentSession) {
			throw new SessionError('Already in a session', SessionErrorCode.ALREADY_IN_SESSION);
		}

		try {
			// Initialize peer connection
			const peerId = await this.peerConnection.initialize();
			this.currentMemberId = peerId;

			// Generate room code
			const code = generateRoomCode();

			// Create session object
			const session: Session = {
				id: crypto.randomUUID(),
				name,
				code,
				createdBy: peerId,
				createdAt: Date.now(),
				lastActivity: Date.now(),
				members: [
					{
						id: peerId,
						deviceName,
						joinedAt: Date.now(),
						isOnline: true
					}
				],
				queue: [],
				currentTabId: null,
				settings: {
					syncScrolling: false,
					syncHost: null
				},
				history: []
			};

			// Create the session in peer connection
			await this.peerConnection.createSession(code);

			this.currentSession = session;
			this.sessionStartTime = Date.now();

			console.log('[SessionManager] Session created:', session.id, 'Code:', code);
			this.notifySessionUpdate();

			// If linked to persistent room, update it
			if (persistentRoomId) {
				const room = await this.storage.getPersistentRoom(persistentRoomId);
				if (room) {
					room.sessions.push(session.id);
					room.lastActive = Date.now();
					await this.storage.savePersistentRoom(room);
				}
			}

			return session;
		} catch (error) {
			console.error('[SessionManager] Failed to create session:', error);
			throw new SessionError('Failed to create session', SessionErrorCode.CONNECTION_FAILED);
		}
	}

	async joinSession(code: string, deviceName: string): Promise<Session> {
		if (this.currentSession) {
			throw new SessionError('Already in a session', SessionErrorCode.ALREADY_IN_SESSION);
		}

		try {
			// Initialize peer connection
			const peerId = await this.peerConnection.initialize();
			this.currentMemberId = peerId;

			// TODO: In a real implementation, we'd need a signaling mechanism to discover the host peer ID
			// For now, we'll use a simplified approach where the code maps to the host's peer ID
			// This would typically involve a lightweight signaling server
			const hostPeerId = await this.discoverHostPeerId(code);

			// Join the session
			await this.peerConnection.joinSession(code, hostPeerId);

			// Create temporary session (will be updated with full state from host)
			const member: Member = {
				id: peerId,
				deviceName,
				joinedAt: Date.now(),
				isOnline: true
			};

			// Request full session state from host
			await this.requestSessionState();

			console.log('[SessionManager] Joined session with code:', code);

			// Wait for session state sync
			// In a real implementation, this would be handled asynchronously
			// For now, we'll create a minimal session object
			this.currentSession = {
				id: crypto.randomUUID(),
				name: 'Joined Session',
				code,
				createdBy: hostPeerId,
				createdAt: Date.now(),
				lastActivity: Date.now(),
				members: [member],
				queue: [],
				currentTabId: null,
				settings: {
					syncScrolling: false,
					syncHost: null
				},
				history: []
			};

			return this.currentSession;
		} catch (error) {
			console.error('[SessionManager] Failed to join session:', error);
			throw new SessionError('Failed to join session', SessionErrorCode.CONNECTION_FAILED);
		}
	}

	async leaveSession(saveHistory: boolean = true): Promise<void> {
		if (!this.currentSession) {
			return;
		}

		console.log('[SessionManager] Leaving session:', this.currentSession.id);

		// Save to history if requested
		if (saveHistory && this.sessionStartTime > 0) {
			await this.saveSessionToHistory();
		}

		// Notify other peers
		const event: SessionEvent<MemberLeftPayload> = {
			type: SessionEventType.MEMBER_LEFT,
			payload: { memberId: this.currentMemberId! },
			senderId: this.currentMemberId!,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		// Disconnect from peers
		await this.peerConnection.leaveSession();

		this.currentSession = null;
		this.currentMemberId = null;
		this.sessionStartTime = 0;

		this.notifySessionUpdate();
	}

	getCurrentSession(): Session | null {
		return this.currentSession ? { ...this.currentSession } : null;
	}

	isInSession(): boolean {
		return this.currentSession !== null;
	}

	// ============================================================================
	// Queue Management
	// ============================================================================

	async addTabToQueue(tab: Tab): Promise<QueueTab> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const queueTab: QueueTab = {
			id: crypto.randomUUID(),
			tab,
			addedBy: this.currentMemberId,
			addedAt: Date.now(),
			order: this.currentSession.queue.length
		};

		this.currentSession.queue.push(queueTab);
		this.currentSession.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueTabAddedPayload> = {
			type: SessionEventType.QUEUE_TAB_ADDED,
			payload: { queueTab },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[SessionManager] Added tab to queue:', tab.title);
		this.notifyQueueUpdate();

		return queueTab;
	}

	async removeTabFromQueue(queueTabId: string): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		this.currentSession.queue = this.currentSession.queue.filter((qt) => qt.id !== queueTabId);
		this.currentSession.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueTabRemovedPayload> = {
			type: SessionEventType.QUEUE_TAB_REMOVED,
			payload: { queueTabId },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[SessionManager] Removed tab from queue:', queueTabId);
		this.notifyQueueUpdate();
	}

	async reorderQueue(queueTabs: QueueTab[]): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		// Update order property
		queueTabs.forEach((qt, index) => {
			qt.order = index;
		});

		this.currentSession.queue = queueTabs;
		this.currentSession.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<QueueReorderedPayload> = {
			type: SessionEventType.QUEUE_REORDERED,
			payload: { queueTabs },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[SessionManager] Queue reordered');
		this.notifyQueueUpdate();
	}

	async setCurrentTab(queueTabId: string): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const queueTab = this.currentSession.queue.find((qt) => qt.id === queueTabId);
		if (!queueTab) {
			throw new Error('Queue tab not found');
		}

		// Add previous tab to history if exists
		if (this.currentSession.currentTabId) {
			const previousTab = this.currentSession.queue.find(
				(qt) => qt.id === this.currentSession!.currentTabId
			);
			if (previousTab) {
				this.currentSession.history.push({
					tabId: previousTab.id,
					tab: previousTab.tab,
					playedAt: Date.now(),
					duration: undefined // Will be calculated when next tab starts
				});
			}
		}

		this.currentSession.currentTabId = queueTabId;
		this.currentSession.lastActivity = Date.now();

		// Broadcast to peers
		const event: SessionEvent<TabStartedPayload> = {
			type: SessionEventType.TAB_STARTED,
			payload: { tabId: queueTabId },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		console.log('[SessionManager] Current tab set to:', queueTab.tab.title);
		this.notifySessionUpdate();
	}

	getNextTab(): QueueTab | null {
		if (!this.currentSession) {
			return null;
		}

		if (!this.currentSession.currentTabId) {
			return this.currentSession.queue[0] || null;
		}

		const currentIndex = this.currentSession.queue.findIndex(
			(qt) => qt.id === this.currentSession!.currentTabId
		);

		if (currentIndex === -1 || currentIndex === this.currentSession.queue.length - 1) {
			return null;
		}

		return this.currentSession.queue[currentIndex + 1];
	}

	async playNextTab(): Promise<void> {
		const nextTab = this.getNextTab();
		if (nextTab) {
			await this.setCurrentTab(nextTab.id);
		}
	}

	// ============================================================================
	// Member Management
	// ============================================================================

	getMembers(): Member[] {
		return this.currentSession?.members || [];
	}

	getCurrentMember(): Member | null {
		if (!this.currentSession || !this.currentMemberId) {
			return null;
		}
		return (
			this.currentSession.members.find((m) => m.id === this.currentMemberId) || null
		);
	}

	async updateCurrentMember(updates: Partial<Member>): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const member = this.currentSession.members.find((m) => m.id === this.currentMemberId);
		if (member) {
			Object.assign(member, updates);

			// Broadcast to peers
			const event: SessionEvent = {
				type: SessionEventType.MEMBER_UPDATED,
				payload: { memberId: this.currentMemberId, updates },
				senderId: this.currentMemberId,
				timestamp: Date.now()
			};
			await this.peerConnection.broadcast(event);

			this.notifyMemberUpdate();
		}
	}

	// ============================================================================
	// Settings & Sync
	// ============================================================================

	async updateSettings(settings: Partial<SessionSettings>): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		Object.assign(this.currentSession.settings, settings);

		// Broadcast to peers
		const event: SessionEvent<SessionSettingsUpdatedPayload> = {
			type: SessionEventType.SESSION_SETTINGS_UPDATED,
			payload: { settings },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		this.notifySessionUpdate();
	}

	async enableScrollSync(): Promise<void> {
		await this.updateSettings({
			syncScrolling: true,
			syncHost: this.currentMemberId!
		});
	}

	async disableScrollSync(): Promise<void> {
		await this.updateSettings({
			syncScrolling: false,
			syncHost: null
		});
	}

	async updateScrollPosition(lineNumber: number): Promise<void> {
		if (!this.currentSession || !this.currentMemberId) {
			return;
		}

		if (!this.currentSession.settings.syncScrolling) {
			return;
		}

		// Update local member scroll position
		const member = this.currentSession.members.find((m) => m.id === this.currentMemberId);
		if (member) {
			member.scrollPosition = lineNumber;
		}

		// Broadcast to peers
		const event: SessionEvent<ScrollPositionUpdatedPayload> = {
			type: SessionEventType.SCROLL_POSITION_UPDATED,
			payload: { memberId: this.currentMemberId, lineNumber },
			senderId: this.currentMemberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);
	}

	// ============================================================================
	// History & Persistence
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
			lines.push(`${index + 1}. ${entry.tab.title}${entry.tab.artist ? ` - ${entry.tab.artist}` : ''}`);
		});

		return lines.join('\n');
	}

	// ============================================================================
	// Persistent Rooms
	// ============================================================================

	async createPersistentRoom(name: string): Promise<PersistentRoom> {
		const room: PersistentRoom = {
			id: crypto.randomUUID(),
			name,
			code: generateRoomCode(),
			createdAt: Date.now(),
			lastActive: Date.now(),
			memberDeviceIds: [],
			sessions: []
		};

		await this.storage.savePersistentRoom(room);
		console.log('[SessionManager] Created persistent room:', room.name);

		return room;
	}

	async getPersistentRooms(): Promise<PersistentRoom[]> {
		return await this.storage.getPersistentRooms();
	}

	async rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session> {
		const room = await this.storage.getPersistentRoom(roomId);
		if (!room) {
			throw new Error('Room not found');
		}

		return await this.createSession(room.name, deviceName, roomId);
	}

	async deletePersistentRoom(roomId: string): Promise<void> {
		await this.storage.deletePersistentRoom(roomId);
	}

	// ============================================================================
	// Playlists
	// ============================================================================

	async createPlaylist(name: string, tabs: Tab[]): Promise<Playlist> {
		const playlist: Playlist = {
			id: crypto.randomUUID(),
			name,
			tabs,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await this.storage.savePlaylist(playlist);
		console.log('[SessionManager] Created playlist:', name);

		return playlist;
	}

	async getPlaylists(): Promise<Playlist[]> {
		return await this.storage.getPlaylists();
	}

	async loadPlaylistToQueue(playlistId: string): Promise<void> {
		const playlist = await this.storage.getPlaylist(playlistId);
		if (!playlist) {
			throw new Error('Playlist not found');
		}

		// Add all tabs to queue
		for (const tab of playlist.tabs) {
			await this.addTabToQueue(tab);
		}

		console.log('[SessionManager] Loaded playlist to queue:', playlist.name);
	}

	async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void> {
		await this.storage.updatePlaylist(playlistId, updates);
	}

	async deletePlaylist(playlistId: string): Promise<void> {
		await this.storage.deletePlaylist(playlistId);
	}

	// ============================================================================
	// Tab Library Integration
	// ============================================================================

	async saveTabToLibrary(queueTab: QueueTab): Promise<void> {
		// Get tabs store and add the tab
		tabs.add(queueTab.tab);
		console.log('[SessionManager] Saved tab to library:', queueTab.tab.title);
	}

	async batchSaveToLibrary(queueTabIds: string[]): Promise<void> {
		if (!this.currentSession) {
			return;
		}

		for (const id of queueTabIds) {
			const queueTab = this.currentSession.queue.find((qt) => qt.id === id);
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

		console.log('[SessionManager] Saved all tabs from past session');
	}

	// ============================================================================
	// Events
	// ============================================================================

	onSessionUpdate(callback: (session: Session) => void): void {
		this.sessionUpdateCallbacks.push(callback);
	}

	onQueueUpdate(callback: (queue: QueueTab[]) => void): void {
		this.queueUpdateCallbacks.push(callback);
	}

	onMemberUpdate(callback: (members: Member[]) => void): void {
		this.memberUpdateCallbacks.push(callback);
	}

	onError(callback: (error: Error) => void): void {
		this.errorCallbacks.push(callback);
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
			console.log('[SessionManager] Peer connected:', peerId);
			// Send current session state to new peer
			if (this.currentSession && this.currentMemberId) {
				const event: SessionEvent<SessionStateSyncPayload> = {
					type: SessionEventType.SESSION_STATE_SYNC,
					payload: { session: this.currentSession },
					senderId: this.currentMemberId,
					timestamp: Date.now()
				};
				this.peerConnection.sendTo(peerId, event);
			}
		});

		// Handle peer disconnections
		this.peerConnection.onPeerDisconnected((peerId) => {
			console.log('[SessionManager] Peer disconnected:', peerId);
			if (this.currentSession) {
				const member = this.currentSession.members.find((m) => m.id === peerId);
				if (member) {
					member.isOnline = false;
					this.notifyMemberUpdate();
				}
			}
		});
	}

	private handlePeerEvent(event: SessionEvent, fromPeerId: string): void {
		if (!this.currentSession) {
			return;
		}

		console.log('[SessionManager] Handling event:', event.type, 'from:', fromPeerId);

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
			console.error('[SessionManager] Error handling event:', error);
			this.notifyError(error as Error);
		}
	}

	private handleMemberJoined(payload: MemberJoinedPayload): void {
		if (!this.currentSession) return;
		this.currentSession.members.push(payload.member);
		this.notifyMemberUpdate();
	}

	private handleMemberLeft(payload: MemberLeftPayload): void {
		if (!this.currentSession) return;
		this.currentSession.members = this.currentSession.members.filter(
			(m) => m.id !== payload.memberId
		);
		this.notifyMemberUpdate();
	}

	private handleQueueTabAdded(payload: QueueTabAddedPayload): void {
		if (!this.currentSession) return;
		this.currentSession.queue.push(payload.queueTab);
		this.notifyQueueUpdate();
	}

	private handleQueueTabRemoved(payload: QueueTabRemovedPayload): void {
		if (!this.currentSession) return;
		this.currentSession.queue = this.currentSession.queue.filter(
			(qt) => qt.id !== payload.queueTabId
		);
		this.notifyQueueUpdate();
	}

	private handleQueueReordered(payload: QueueReorderedPayload): void {
		if (!this.currentSession) return;
		this.currentSession.queue = payload.queueTabs;
		this.notifyQueueUpdate();
	}

	private handleTabStarted(payload: TabStartedPayload): void {
		if (!this.currentSession) return;
		this.currentSession.currentTabId = payload.tabId;
		this.notifySessionUpdate();
	}

	private handleScrollPositionUpdated(payload: ScrollPositionUpdatedPayload): void {
		if (!this.currentSession) return;
		const member = this.currentSession.members.find((m) => m.id === payload.memberId);
		if (member) {
			member.scrollPosition = payload.lineNumber;
			this.notifyMemberUpdate();
		}
	}

	private handleSessionSettingsUpdated(payload: SessionSettingsUpdatedPayload): void {
		if (!this.currentSession) return;
		Object.assign(this.currentSession.settings, payload.settings);
		this.notifySessionUpdate();
	}

	private handleSessionStateSync(payload: SessionStateSyncPayload): void {
		// Merge incoming session state with current state
		if (!this.currentSession) {
			this.currentSession = payload.session;
		} else {
			// Merge carefully to preserve local member info
			this.currentSession = {
				...payload.session,
				members: this.mergeMemberLists(this.currentSession.members, payload.session.members)
			};
		}
		this.notifySessionUpdate();
		this.notifyQueueUpdate();
		this.notifyMemberUpdate();
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

	private async saveSessionToHistory(): Promise<void> {
		if (!this.currentSession) {
			return;
		}

		const duration = Date.now() - this.sessionStartTime;
		const pastSession: PastSession = {
			id: this.currentSession.id,
			name: this.currentSession.name,
			date: this.currentSession.createdAt,
			duration,
			participants: this.currentSession.members.map((m) => m.deviceName),
			tabsPlayed: this.currentSession.history
		};

		await this.storage.savePastSession(pastSession);
		console.log('[SessionManager] Session saved to history');
	}

	private async requestSessionState(): Promise<void> {
		// This would send a request to the host for full session state
		// For now, this is handled automatically via SESSION_STATE_SYNC event
		// when a peer connects
	}

	private async discoverHostPeerId(code: string): Promise<string> {
		// TODO: Implement proper peer discovery via signaling server
		// For now, we'll use a simplified approach where the code IS the peer ID
		// In production, this would query a signaling server to get the host's peer ID
		console.warn('[SessionManager] Using simplified peer discovery (code as peer ID)');
		return code;
	}

	private notifySessionUpdate(): void {
		if (this.currentSession) {
			this.sessionUpdateCallbacks.forEach((cb) => cb({ ...this.currentSession! }));
		}
	}

	private notifyQueueUpdate(): void {
		if (this.currentSession) {
			this.queueUpdateCallbacks.forEach((cb) => cb([...this.currentSession!.queue]));
		}
	}

	private notifyMemberUpdate(): void {
		if (this.currentSession) {
			this.memberUpdateCallbacks.forEach((cb) => cb([...this.currentSession!.members]));
		}
	}

	private notifyError(error: Error): void {
		this.errorCallbacks.forEach((cb) => cb(error));
	}
}
