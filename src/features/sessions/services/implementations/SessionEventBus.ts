import { injectable } from 'inversify';
import type { ISessionEventBus, SessionEventHandler } from '../contracts/ISessionEventBus';
import type { Session, QueueTab, Member, SessionEvent } from '../../types';

/**
 * Event bus implementation for session events
 * Provides a clean, typed event system to replace callback arrays
 */

@injectable()
export class SessionEventBus implements ISessionEventBus {
	private sessionUpdateHandlers: Set<SessionEventHandler<Session>> = new Set();
	private queueUpdateHandlers: Set<SessionEventHandler<QueueTab[]>> = new Set();
	private memberUpdateHandlers: Set<SessionEventHandler<Member[]>> = new Set();
	private errorHandlers: Set<SessionEventHandler<Error>> = new Set();
	private peerEventHandlers: Set<
		SessionEventHandler<{ event: SessionEvent; fromPeerId: string }>
	> = new Set();

	// ============================================================================
	// Subscription Methods
	// ============================================================================

	onSessionUpdate(handler: SessionEventHandler<Session>): () => void {
		this.sessionUpdateHandlers.add(handler);
		return () => this.sessionUpdateHandlers.delete(handler);
	}

	onQueueUpdate(handler: SessionEventHandler<QueueTab[]>): () => void {
		this.queueUpdateHandlers.add(handler);
		return () => this.queueUpdateHandlers.delete(handler);
	}

	onMemberUpdate(handler: SessionEventHandler<Member[]>): () => void {
		this.memberUpdateHandlers.add(handler);
		return () => this.memberUpdateHandlers.delete(handler);
	}

	onError(handler: SessionEventHandler<Error>): () => void {
		this.errorHandlers.add(handler);
		return () => this.errorHandlers.delete(handler);
	}

	onPeerEvent(
		handler: SessionEventHandler<{ event: SessionEvent; fromPeerId: string }>
	): () => void {
		this.peerEventHandlers.add(handler);
		return () => this.peerEventHandlers.delete(handler);
	}

	// ============================================================================
	// Emission Methods
	// ============================================================================

	emitSessionUpdate(session: Session): void {
		const sessionCopy = { ...session };
		this.sessionUpdateHandlers.forEach((handler) => {
			try {
				handler(sessionCopy);
			} catch (error) {
				console.error('[SessionEventBus] Error in session update handler:', error);
			}
		});
	}

	emitQueueUpdate(queue: QueueTab[]): void {
		const queueCopy = [...queue];
		this.queueUpdateHandlers.forEach((handler) => {
			try {
				handler(queueCopy);
			} catch (error) {
				console.error('[SessionEventBus] Error in queue update handler:', error);
			}
		});
	}

	emitMemberUpdate(members: Member[]): void {
		const membersCopy = [...members];
		this.memberUpdateHandlers.forEach((handler) => {
			try {
				handler(membersCopy);
			} catch (error) {
				console.error('[SessionEventBus] Error in member update handler:', error);
			}
		});
	}

	emitError(error: Error): void {
		this.errorHandlers.forEach((handler) => {
			try {
				handler(error);
			} catch (handlerError) {
				console.error('[SessionEventBus] Error in error handler:', handlerError);
			}
		});
	}

	emitPeerEvent(event: SessionEvent, fromPeerId: string): void {
		this.peerEventHandlers.forEach((handler) => {
			try {
				handler({ event, fromPeerId });
			} catch (error) {
				console.error('[SessionEventBus] Error in peer event handler:', error);
			}
		});
	}

	// ============================================================================
	// Cleanup
	// ============================================================================

	clearAll(): void {
		this.sessionUpdateHandlers.clear();
		this.queueUpdateHandlers.clear();
		this.memberUpdateHandlers.clear();
		this.errorHandlers.clear();
		this.peerEventHandlers.clear();
	}
}

