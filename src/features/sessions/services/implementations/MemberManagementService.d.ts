import type { IMemberManagementService } from '../contracts/IMemberManagementService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type { Member, SessionSettings } from '../../types';
/**
 * Service for managing session members
 * Handles member tracking, updates, and settings
 */
export declare class MemberManagementService implements IMemberManagementService {
    private lifecycle;
    private peerConnection;
    private eventBus;
    constructor(lifecycle: ISessionLifecycleService, peerConnection: IPeerConnection, eventBus: ISessionEventBus);
    getMembers(): Member[];
    getCurrentMember(): Member | null;
    updateCurrentMember(updates: Partial<Member>): Promise<void>;
    updateSettings(settings: Partial<SessionSettings>): Promise<void>;
    enableScrollSync(): Promise<void>;
    disableScrollSync(): Promise<void>;
    updateScrollPosition(lineNumber: number): Promise<void>;
}
