import type { Tab } from '$lib/state/tabs.svelte';

/**
 * Core session types for collaborative jam sessions
 */

// ============================================================================
// Member Types
// ============================================================================

export interface Member {
	id: string; // Unique peer ID
	deviceName: string; // "Alex's iPhone"
	joinedAt: number; // Timestamp
	isOnline: boolean;
	scrollPosition?: number; // Current line number in tab (for sync)
}

// ============================================================================
// Queue Types
// ============================================================================

export interface QueueTab {
	id: string; // Unique queue item ID
	tab: Tab; // The actual tab data
	addedBy: string; // Member ID who added it
	addedAt: number; // Timestamp
	order: number; // Position in queue (for drag-to-reorder)
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
	id: string; // Unique session ID
	name: string; // "Sunday Jam"
	code: string; // 6-character join code (e.g., "ABC123")
	createdBy: string; // Member ID of creator
	createdAt: number;
	lastActivity: number;
	members: Member[];
	queue: QueueTab[];
	currentTabId: string | null; // Currently playing tab
	settings: SessionSettings;
	history: SessionHistoryEntry[];
}

export interface SessionSettings {
	syncScrolling: boolean; // Enable synchronized scrolling
	syncHost: string | null; // Member ID controlling scroll (null = disabled)
}

// ============================================================================
// Session History Types
// ============================================================================

export interface SessionHistoryEntry {
	tabId: string;
	tab: Tab;
	playedAt: number;
	duration?: number; // milliseconds
}

export interface PastSession {
	id: string;
	name: string;
	date: number;
	duration: number;
	participants: string[]; // Device names
	tabsPlayed: SessionHistoryEntry[];
}

// ============================================================================
// Persistent Room Types
// ============================================================================

export interface PersistentRoom {
	id: string;
	name: string; // "Sunday Jam"
	code: string; // Permanent room code
	createdAt: number;
	lastActive: number;
	memberDeviceIds: string[]; // Device IDs that have joined before
	sessions: string[]; // Session IDs for history
}

// ============================================================================
// Playlist Types
// ============================================================================

export interface Playlist {
	id: string;
	name: string; // "Classic Rock Night"
	tabs: Tab[];
	createdAt: number;
	updatedAt: number;
}

// ============================================================================
// WebRTC Event Types
// ============================================================================

export enum SessionEventType {
	// Connection events
	MEMBER_JOINED = 'member_joined',
	MEMBER_LEFT = 'member_left',
	MEMBER_UPDATED = 'member_updated',

	// Queue events
	QUEUE_TAB_ADDED = 'queue_tab_added',
	QUEUE_TAB_REMOVED = 'queue_tab_removed',
	QUEUE_REORDERED = 'queue_reordered',

	// Playback events
	TAB_STARTED = 'tab_started',
	TAB_CHANGED = 'tab_changed',

	// Scroll sync events
	SCROLL_SYNC_ENABLED = 'scroll_sync_enabled',
	SCROLL_SYNC_DISABLED = 'scroll_sync_disabled',
	SCROLL_POSITION_UPDATED = 'scroll_position_updated',

	// Session events
	SESSION_SETTINGS_UPDATED = 'session_settings_updated',
	SESSION_STATE_SYNC = 'session_state_sync' // Full state sync for new joiners
}

export interface SessionEvent<T = unknown> {
	type: SessionEventType;
	payload: T;
	senderId: string; // Member ID of sender
	timestamp: number;
}

// Specific event payload types
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
	queueTabs: QueueTab[]; // Full reordered list
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

// ============================================================================
// Error Types
// ============================================================================

export class SessionError extends Error {
	constructor(
		message: string,
		public code: SessionErrorCode
	) {
		super(message);
		this.name = 'SessionError';
	}
}

export enum SessionErrorCode {
	CONNECTION_FAILED = 'CONNECTION_FAILED',
	INVALID_CODE = 'INVALID_CODE',
	SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
	ALREADY_IN_SESSION = 'ALREADY_IN_SESSION',
	PEER_DISCONNECTED = 'PEER_DISCONNECTED',
	SYNC_FAILED = 'SYNC_FAILED'
}

// ============================================================================
// Connection State Types
// ============================================================================

export enum ConnectionState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error'
}

export interface ConnectionStatus {
	state: ConnectionState;
	error?: string;
	connectedPeers: number;
}
