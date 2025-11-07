import type { ISessionSyncService } from '../contracts/ISessionSyncService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
/**
 * Service for synchronizing session state across peers
 * Handles WebRTC event coordination and state synchronization
 */
export declare class SessionSyncService implements ISessionSyncService {
    private lifecycle;
    private peerConnection;
    private eventBus;
    constructor(lifecycle: ISessionLifecycleService, peerConnection: IPeerConnection, eventBus: ISessionEventBus);
    initialize(): void;
    cleanup(): void;
    private setupPeerConnectionHandlers;
    private setupEventBusHandlers;
    private handlePeerEvent;
    private handleMemberJoined;
    private handleMemberLeft;
    private handleQueueTabAdded;
    private handleQueueTabRemoved;
    private handleQueueReordered;
    private handleTabStarted;
    private handleScrollPositionUpdated;
    private handleSessionSettingsUpdated;
    private handleSessionStateSync;
    private mergeMemberLists;
}
