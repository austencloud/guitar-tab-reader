import type { ISessionHistoryService } from '../contracts/ISessionHistoryService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PastSession, QueueTab } from '../../types';
/**
 * Service for managing session history
 * Handles past sessions, export, and tab library integration
 */
export declare class SessionHistoryService implements ISessionHistoryService {
    private lifecycle;
    private storage;
    constructor(lifecycle: ISessionLifecycleService, storage: ISessionStorage);
    getPastSessions(): Promise<PastSession[]>;
    getPastSession(id: string): Promise<PastSession | undefined>;
    deletePastSession(id: string): Promise<void>;
    exportSession(sessionId: string): Promise<string>;
    saveTabToLibrary(queueTab: QueueTab): Promise<void>;
    batchSaveToLibrary(queueTabIds: string[]): Promise<void>;
    savePastSessionTabs(sessionId: string): Promise<void>;
}
