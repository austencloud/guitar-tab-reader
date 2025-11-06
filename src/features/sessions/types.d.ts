import type { Tab } from '$lib/stores/tabs';
/**
 * Core session types for collaborative jam sessions
 */
export interface Member {
    id: string;
    deviceName: string;
    joinedAt: number;
    isOnline: boolean;
    scrollPosition?: number;
}
export interface QueueTab {
    id: string;
    tab: Tab;
    addedBy: string;
    addedAt: number;
    order: number;
}
export interface Session {
    id: string;
    name: string;
    code: string;
    createdBy: string;
    createdAt: number;
    lastActivity: number;
    members: Member[];
    queue: QueueTab[];
    currentTabId: string | null;
    settings: SessionSettings;
    history: SessionHistoryEntry[];
}
export interface SessionSettings {
    syncScrolling: boolean;
    syncHost: string | null;
}
export interface SessionHistoryEntry {
    tabId: string;
    tab: Tab;
    playedAt: number;
    duration?: number;
}
export interface PastSession {
    id: string;
    name: string;
    date: number;
    duration: number;
    participants: string[];
    tabsPlayed: SessionHistoryEntry[];
}
export interface PersistentRoom {
    id: string;
    name: string;
    code: string;
    createdAt: number;
    lastActive: number;
    memberDeviceIds: string[];
    sessions: string[];
}
export interface Playlist {
    id: string;
    name: string;
    tabs: Tab[];
    createdAt: number;
    updatedAt: number;
}
export declare enum SessionEventType {
    MEMBER_JOINED = "member_joined",
    MEMBER_LEFT = "member_left",
    MEMBER_UPDATED = "member_updated",
    QUEUE_TAB_ADDED = "queue_tab_added",
    QUEUE_TAB_REMOVED = "queue_tab_removed",
    QUEUE_REORDERED = "queue_reordered",
    TAB_STARTED = "tab_started",
    TAB_CHANGED = "tab_changed",
    SCROLL_SYNC_ENABLED = "scroll_sync_enabled",
    SCROLL_SYNC_DISABLED = "scroll_sync_disabled",
    SCROLL_POSITION_UPDATED = "scroll_position_updated",
    SESSION_SETTINGS_UPDATED = "session_settings_updated",
    SESSION_STATE_SYNC = "session_state_sync"
}
export interface SessionEvent<T = unknown> {
    type: SessionEventType;
    payload: T;
    senderId: string;
    timestamp: number;
}
export interface MemberJoinedPayload {
    member: Member;
}
export interface MemberLeftPayload {
    memberId: string;
}
export interface MemberUpdatedPayload {
    memberId: string;
    updates: Partial<Member>;
}
export interface QueueTabAddedPayload {
    queueTab: QueueTab;
}
export interface QueueTabRemovedPayload {
    queueTabId: string;
}
export interface QueueReorderedPayload {
    queueTabs: QueueTab[];
}
export interface TabStartedPayload {
    tabId: string;
}
export interface ScrollPositionUpdatedPayload {
    memberId: string;
    lineNumber: number;
}
export interface SessionSettingsUpdatedPayload {
    settings: Partial<SessionSettings>;
}
export interface SessionStateSyncPayload {
    session: Session;
}
export declare class SessionError extends Error {
    code: SessionErrorCode;
    constructor(message: string, code: SessionErrorCode);
}
export declare enum SessionErrorCode {
    CONNECTION_FAILED = "CONNECTION_FAILED",
    INVALID_CODE = "INVALID_CODE",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    ALREADY_IN_SESSION = "ALREADY_IN_SESSION",
    PEER_DISCONNECTED = "PEER_DISCONNECTED",
    SYNC_FAILED = "SYNC_FAILED"
}
export declare enum ConnectionState {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ERROR = "error"
}
export interface ConnectionStatus {
    state: ConnectionState;
    error?: string;
    connectedPeers: number;
}
