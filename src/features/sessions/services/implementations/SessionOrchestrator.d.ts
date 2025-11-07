import type { Tab } from '$lib/state/tabs.svelte';
import type { ISessionManager } from '../contracts/ISessionManager';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { IMemberManagementService } from '../contracts/IMemberManagementService';
import type { IPlaylistService } from '../contracts/IPlaylistService';
import type { ISessionHistoryService } from '../contracts/ISessionHistoryService';
import type { IPersistentRoomService } from '../contracts/IPersistentRoomService';
import type { ISessionSyncService } from '../contracts/ISessionSyncService';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type { Session, QueueTab, Member, SessionSettings, PastSession, PersistentRoom, Playlist } from '../../types';
/**
 * Session orchestrator - thin coordinator that delegates to focused services
 * Implements ISessionManager by composing specialized services
 *
 * This replaces the 883-line SessionManagerService monolith with clean delegation
 */
export declare class SessionOrchestrator implements ISessionManager {
    private lifecycle;
    private queue;
    private members;
    private playlists;
    private history;
    private rooms;
    private sync;
    private eventBus;
    constructor(lifecycle: ISessionLifecycleService, queue: IQueueManagementService, members: IMemberManagementService, playlists: IPlaylistService, history: ISessionHistoryService, rooms: IPersistentRoomService, sync: ISessionSyncService, eventBus: ISessionEventBus);
    createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<Session>;
    joinSession(code: string, deviceName: string): Promise<Session>;
    leaveSession(saveHistory?: boolean): Promise<void>;
    getCurrentSession(): Session | null;
    isInSession(): boolean;
    addTabToQueue(tab: Tab): Promise<QueueTab>;
    removeTabFromQueue(queueTabId: string): Promise<void>;
    reorderQueue(queueTabs: QueueTab[]): Promise<void>;
    setCurrentTab(queueTabId: string): Promise<void>;
    getNextTab(): QueueTab | null;
    playNextTab(): Promise<void>;
    getMembers(): Member[];
    getCurrentMember(): Member | null;
    updateCurrentMember(updates: Partial<Member>): Promise<void>;
    updateSettings(settings: Partial<SessionSettings>): Promise<void>;
    enableScrollSync(): Promise<void>;
    disableScrollSync(): Promise<void>;
    updateScrollPosition(lineNumber: number): Promise<void>;
    getPastSessions(): Promise<PastSession[]>;
    getPastSession(id: string): Promise<PastSession | undefined>;
    deletePastSession(id: string): Promise<void>;
    exportSession(sessionId: string): Promise<string>;
    createPersistentRoom(name: string): Promise<PersistentRoom>;
    getPersistentRooms(): Promise<PersistentRoom[]>;
    rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session>;
    deletePersistentRoom(roomId: string): Promise<void>;
    createPlaylist(name: string, tabs: Tab[]): Promise<Playlist>;
    getPlaylists(): Promise<Playlist[]>;
    loadPlaylistToQueue(playlistId: string): Promise<void>;
    updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void>;
    deletePlaylist(playlistId: string): Promise<void>;
    saveTabToLibrary(queueTab: QueueTab): Promise<void>;
    batchSaveToLibrary(queueTabIds: string[]): Promise<void>;
    savePastSessionTabs(sessionId: string): Promise<void>;
    onSessionUpdate(callback: (session: Session) => void): void;
    onQueueUpdate(callback: (queue: QueueTab[]) => void): void;
    onMemberUpdate(callback: (members: Member[]) => void): void;
    onError(callback: (error: Error) => void): void;
}
