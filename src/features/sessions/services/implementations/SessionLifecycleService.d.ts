import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type { Session } from '../../types';
/**
 * Service for managing session lifecycle
 * Handles creating, joining, and leaving sessions
 */
export declare class SessionLifecycleService implements ISessionLifecycleService {
    private peerConnection;
    private storage;
    private eventBus;
    private currentSession;
    private currentMemberId;
    private sessionStartTime;
    constructor(peerConnection: IPeerConnection, storage: ISessionStorage, eventBus: ISessionEventBus);
    createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<Session>;
    joinSession(code: string, deviceName: string): Promise<Session>;
    leaveSession(saveHistory?: boolean): Promise<void>;
    getCurrentSession(): Session | null;
    isInSession(): boolean;
    getCurrentMemberId(): string | null;
    getSessionStartTime(): number;
    /**
     * Update the current session (used by sync service)
     * @internal
     */
    updateCurrentSession(session: Session): void;
    private saveSessionToHistory;
    private requestSessionState;
    private discoverHostPeerId;
}
