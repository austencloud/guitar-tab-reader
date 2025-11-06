import type { ISessionManager } from '../services/contracts/ISessionManager';
import type { Session, QueueTab, Member, PersistentRoom, Playlist } from '../types';
/**
 * Session state management using Svelte 5 runes
 * Provides reactive state for the session feature
 */
export declare class SessionState {
    private sessionManager;
    currentSession: Session | null;
    isInSession: boolean;
    isConnecting: boolean;
    error: string | null;
    queue: QueueTab[];
    currentTab: QueueTab | null;
    members: Member[];
    currentMember: Member | null;
    showSessionSheet: boolean;
    showQueueView: boolean;
    showHistoryView: boolean;
    showCreateModal: boolean;
    showJoinModal: boolean;
    persistentRooms: PersistentRoom[];
    playlists: Playlist[];
    constructor(sessionManager: ISessionManager);
    hasSession: boolean;
    queueLength: number;
    memberCount: number;
    isHost: boolean;
    canPlayNext: () => boolean;
    syncScrollingEnabled: boolean;
    syncHost: () => Member | null;
    createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<void>;
    joinSession(code: string, deviceName: string): Promise<void>;
    leaveSession(saveHistory?: boolean): Promise<void>;
    addTabToQueue(tab: any): Promise<void>;
    removeTabFromQueue(queueTabId: string): Promise<void>;
    reorderQueue(queueTabs: QueueTab[]): Promise<void>;
    setCurrentTab(queueTabId: string): Promise<void>;
    playNextTab(): Promise<void>;
    saveTabToLibrary(queueTab: QueueTab): Promise<void>;
    loadPlaylistToQueue(playlistId: string): Promise<void>;
    enableScrollSync(): Promise<void>;
    disableScrollSync(): Promise<void>;
    updateScrollPosition(lineNumber: number): Promise<void>;
    createPersistentRoom(name: string): Promise<void>;
    rejoinPersistentRoom(roomId: string, deviceName: string): Promise<void>;
    deletePersistentRoom(roomId: string): Promise<void>;
    createPlaylist(name: string, tabs: any[]): Promise<void>;
    deletePlaylist(playlistId: string): Promise<void>;
    toggleSessionSheet(): void;
    toggleQueueView(): void;
    toggleHistoryView(): void;
    openCreateModal(): void;
    closeCreateModal(): void;
    openJoinModal(): void;
    closeJoinModal(): void;
    clearError(): void;
    private loadPersistentData;
}
