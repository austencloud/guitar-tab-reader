import type { ISessionEventBus, SessionEventHandler } from '../contracts/ISessionEventBus';
import type { Session, QueueTab, Member, SessionEvent } from '../../types';
/**
 * Event bus implementation for session events
 * Provides a clean, typed event system to replace callback arrays
 */
export declare class SessionEventBus implements ISessionEventBus {
    private sessionUpdateHandlers;
    private queueUpdateHandlers;
    private memberUpdateHandlers;
    private errorHandlers;
    private peerEventHandlers;
    onSessionUpdate(handler: SessionEventHandler<Session>): () => void;
    onQueueUpdate(handler: SessionEventHandler<QueueTab[]>): () => void;
    onMemberUpdate(handler: SessionEventHandler<Member[]>): () => void;
    onError(handler: SessionEventHandler<Error>): () => void;
    onPeerEvent(handler: SessionEventHandler<{
        event: SessionEvent;
        fromPeerId: string;
    }>): () => void;
    emitSessionUpdate(session: Session): void;
    emitQueueUpdate(queue: QueueTab[]): void;
    emitMemberUpdate(members: Member[]): void;
    emitError(error: Error): void;
    emitPeerEvent(event: SessionEvent, fromPeerId: string): void;
    clearAll(): void;
}
