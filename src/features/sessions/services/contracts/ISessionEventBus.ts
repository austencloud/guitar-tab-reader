import type {
	Session,
	QueueTab,
	Member,
	SessionEvent,
	SessionEventType
} from '../../types';

/**
 * Event bus for session-related events
 * Replaces callback arrays with a proper typed event system
 */

export type SessionEventHandler<T = unknown> = (payload: T) => void;

export interface ISessionEventBus {
	/**
	 * Subscribe to session updates
	 */
	onSessionUpdate(handler: SessionEventHandler<Session>): () => void;

	/**
	 * Subscribe to queue updates
	 */
	onQueueUpdate(handler: SessionEventHandler<QueueTab[]>): () => void;

	/**
	 * Subscribe to member updates
	 */
	onMemberUpdate(handler: SessionEventHandler<Member[]>): () => void;

	/**
	 * Subscribe to errors
	 */
	onError(handler: SessionEventHandler<Error>): () => void;

	/**
	 * Subscribe to peer events (for internal use by sync service)
	 */
	onPeerEvent(handler: SessionEventHandler<{ event: SessionEvent; fromPeerId: string }>): () => void;

	/**
	 * Emit a session update event
	 */
	emitSessionUpdate(session: Session): void;

	/**
	 * Emit a queue update event
	 */
	emitQueueUpdate(queue: QueueTab[]): void;

	/**
	 * Emit a member update event
	 */
	emitMemberUpdate(members: Member[]): void;

	/**
	 * Emit an error event
	 */
	emitError(error: Error): void;

	/**
	 * Emit a peer event (for internal use by sync service)
	 */
	emitPeerEvent(event: SessionEvent, fromPeerId: string): void;

	/**
	 * Clear all event handlers
	 */
	clearAll(): void;
}

