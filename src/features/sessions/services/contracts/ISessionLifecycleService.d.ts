import type { Session } from '../../types';
/**
 * Service for managing session lifecycle operations
 * Handles creating, joining, and leaving sessions
 */
export interface ISessionLifecycleService {
    /**
     * Create a new session
     * @param name Session name (e.g., "Sunday Jam")
     * @param deviceName Name of this device
     * @param persistentRoomId Optional persistent room to link to
     */
    createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<Session>;
    /**
     * Join an existing session using a code
     * @param code 6-character room code
     * @param deviceName Name of this device
     */
    joinSession(code: string, deviceName: string): Promise<Session>;
    /**
     * Leave the current session
     * @param saveHistory Whether to save session to history
     */
    leaveSession(saveHistory?: boolean): Promise<void>;
    /**
     * Get the current active session
     */
    getCurrentSession(): Session | null;
    /**
     * Check if currently in a session
     */
    isInSession(): boolean;
    /**
     * Get the current member ID
     */
    getCurrentMemberId(): string | null;
    /**
     * Get the session start time
     */
    getSessionStartTime(): number;
    /**
     * Update the current session (used by sync service)
     * @internal
     */
    updateCurrentSession(session: Session): void;
}
