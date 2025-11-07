import type { Tab } from '$lib/state/tabs.svelte';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type { QueueTab } from '../../types';
/**
 * Service for managing the session queue
 * Handles adding, removing, reordering, and playing tabs
 */
export declare class QueueManagementService implements IQueueManagementService {
    private lifecycle;
    private peerConnection;
    private eventBus;
    constructor(lifecycle: ISessionLifecycleService, peerConnection: IPeerConnection, eventBus: ISessionEventBus);
    addTabToQueue(tab: Tab): Promise<QueueTab>;
    removeTabFromQueue(queueTabId: string): Promise<void>;
    reorderQueue(queueTabs: QueueTab[]): Promise<void>;
    setCurrentTab(queueTabId: string): Promise<void>;
    getNextTab(): QueueTab | null;
    playNextTab(): Promise<void>;
    getQueue(): QueueTab[];
    getCurrentTabId(): string | null;
}
