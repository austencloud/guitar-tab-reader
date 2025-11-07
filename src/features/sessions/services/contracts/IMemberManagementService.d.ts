import type { Member, SessionSettings } from '../../types';
/**
 * Service for managing session members
 * Handles member tracking, updates, and settings
 */
export interface IMemberManagementService {
    /**
     * Get current members in session
     */
    getMembers(): Member[];
    /**
     * Get current device's member info
     */
    getCurrentMember(): Member | null;
    /**
     * Update current member info
     */
    updateCurrentMember(updates: Partial<Member>): Promise<void>;
    /**
     * Update session settings
     */
    updateSettings(settings: Partial<SessionSettings>): Promise<void>;
    /**
     * Enable scroll sync (become sync host)
     */
    enableScrollSync(): Promise<void>;
    /**
     * Disable scroll sync
     */
    disableScrollSync(): Promise<void>;
    /**
     * Update scroll position (if sync enabled)
     */
    updateScrollPosition(lineNumber: number): Promise<void>;
}
