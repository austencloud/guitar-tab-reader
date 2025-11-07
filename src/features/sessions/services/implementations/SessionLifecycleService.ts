import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type { Session, Member, SessionEvent, MemberLeftPayload } from '../../types';
import { SessionError, SessionErrorCode, SessionEventType } from '../../types';
import { generateRoomCode } from '../../utils/roomCodeGenerator';

/**
 * Service for managing session lifecycle
 * Handles creating, joining, and leaving sessions
 */

@injectable()
export class SessionLifecycleService implements ISessionLifecycleService {
	private currentSession: Session | null = null;
	private currentMemberId: string | null = null;
	private sessionStartTime: number = 0;

	constructor(
		@inject(TYPES.PeerConnection) private peerConnection: IPeerConnection,
		@inject(TYPES.SessionStorage) private storage: ISessionStorage,
		@inject(TYPES.SessionEventBus) private eventBus: ISessionEventBus
	) {}

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

			console.log('[SessionLifecycle] Session created:', session.id, 'Code:', code);
			this.eventBus.emitSessionUpdate(session);

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
			console.error('[SessionLifecycle] Failed to create session:', error);
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

			// Discover host peer ID (simplified for now)
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

			console.log('[SessionLifecycle] Joined session with code:', code);

			// Create minimal session object (will be synced from host)
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
			console.error('[SessionLifecycle] Failed to join session:', error);
			throw new SessionError('Failed to join session', SessionErrorCode.CONNECTION_FAILED);
		}
	}

	async leaveSession(saveHistory: boolean = true): Promise<void> {
		if (!this.currentSession) {
			return;
		}

		console.log('[SessionLifecycle] Leaving session:', this.currentSession.id);

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

		this.eventBus.emitSessionUpdate(null as any); // Signal session ended
	}

	getCurrentSession(): Session | null {
		return this.currentSession ? { ...this.currentSession } : null;
	}

	isInSession(): boolean {
		return this.currentSession !== null;
	}

	getCurrentMemberId(): string | null {
		return this.currentMemberId;
	}

	getSessionStartTime(): number {
		return this.sessionStartTime;
	}

	// ============================================================================
	// Internal Methods
	// ============================================================================

	/**
	 * Update the current session (used by sync service)
	 * @internal
	 */
	updateCurrentSession(session: Session): void {
		this.currentSession = session;
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	private async saveSessionToHistory(): Promise<void> {
		if (!this.currentSession) {
			return;
		}

		const duration = Date.now() - this.sessionStartTime;
		const pastSession = {
			id: this.currentSession.id,
			name: this.currentSession.name,
			date: this.currentSession.createdAt,
			duration,
			participants: this.currentSession.members.map((m) => m.deviceName),
			tabsPlayed: this.currentSession.history
		};

		await this.storage.savePastSession(pastSession);
		console.log('[SessionLifecycle] Session saved to history');
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
		console.warn('[SessionLifecycle] Using simplified peer discovery (code as peer ID)');
		return code;
	}
}

