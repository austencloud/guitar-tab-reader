/**
 * Service for synchronizing session state across peers
 * Handles WebRTC event coordination and state synchronization
 */
export interface ISessionSyncService {
    /**
     * Initialize the sync service
     * Sets up peer connection handlers
     */
    initialize(): void;
    /**
     * Cleanup the sync service
     * Removes all handlers
     */
    cleanup(): void;
}
