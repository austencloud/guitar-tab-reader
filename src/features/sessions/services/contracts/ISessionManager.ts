import type { Tab } from '$lib/state/tabs.svelte';
import type {
	Session,
	QueueTab,
	Member,
	SessionSettings,
	PastSession,
	PersistentRoom,
	Playlist
} from '../../types';

/**
 * Interface for high-level session management
 * Coordinates between PeerConnection and SessionStorage
 */

export interface ISessionManager {
	// ============================================================================
	// Session Lifecycle
	// ============================================================================

	/**
	 * Create a new session
	 * @param name Session name (e.g., "Sunday Jam")
	 * @param deviceName Name of this device
	 * @param persistentRoomId Optional persistent room to link to
	 */
	createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<Session>;

	/**
	 * Join an existing session using a code
	 * @param code 6-character room code
	 * @param deviceName Name of this device
	 */
	joinSession(code: string, deviceName: string): Promise<Session>;

	/**
	 * Leave the current session
	 * @param saveHistory Whether to save session to history
	 */
	leaveSession(saveHistory?: boolean): Promise<void>;

	/**
	 * Get the current active session
	 */
	getCurrentSession(): Session | null;

	/**
	 * Check if currently in a session
	 */
	isInSession(): boolean;

	// ============================================================================
	// Queue Management
	// ============================================================================

	/**
	 * Add a tab to the session queue
	 */
	addTabToQueue(tab: Tab): Promise<QueueTab>;

	/**
	 * Remove a tab from the queue
	 */
	removeTabFromQueue(queueTabId: string): Promise<void>;

	/**
	 * Reorder the queue (drag-and-drop)
	 */
	reorderQueue(queueTabs: QueueTab[]): Promise<void>;

	/**
	 * Set the currently playing tab
	 */
	setCurrentTab(queueTabId: string): Promise<void>;

	/**
	 * Get the next tab in queue
	 */
	getNextTab(): QueueTab | null;

	/**
	 * Play the next tab in queue
	 */
	playNextTab(): Promise<void>;

	// ============================================================================
	// Member Management
	// ============================================================================

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

	// ============================================================================
	// Settings & Sync
	// ============================================================================

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

	// ============================================================================
	// History & Persistence
	// ============================================================================

	/**
	 * Get past sessions
	 */
	getPastSessions(): Promise<PastSession[]>;

	/**
	 * Get a specific past session
	 */
	getPastSession(id: string): Promise<PastSession | undefined>;

	/**
	 * Delete a past session
	 */
	deletePastSession(id: string): Promise<void>;

	/**
	 * Export session as text/markdown
	 */
	exportSession(sessionId: string): Promise<string>;

	// ============================================================================
	// Persistent Rooms
	// ============================================================================

	/**
	 * Create a persistent room
	 */
	createPersistentRoom(name: string): Promise<PersistentRoom>;

	/**
	 * Get all persistent rooms
	 */
	getPersistentRooms(): Promise<PersistentRoom[]>;

	/**
	 * Rejoin a persistent room
	 */
	rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session>;

	/**
	 * Delete a persistent room
	 */
	deletePersistentRoom(roomId: string): Promise<void>;

	// ============================================================================
	// Playlists
	// ============================================================================

	/**
	 * Create a new playlist
	 */
	createPlaylist(name: string, tabs: Tab[]): Promise<Playlist>;

	/**
	 * Get all playlists
	 */
	getPlaylists(): Promise<Playlist[]>;

	/**
	 * Load a playlist into the queue
	 */
	loadPlaylistToQueue(playlistId: string): Promise<void>;

	/**
	 * Update a playlist
	 */
	updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void>;

	/**
	 * Delete a playlist
	 */
	deletePlaylist(playlistId: string): Promise<void>;

	// ============================================================================
	// Tab Library Integration
	// ============================================================================

	/**
	 * Save a tab from session to personal library
	 */
	saveTabToLibrary(queueTab: QueueTab): Promise<void>;

	/**
	 * Batch save multiple tabs to library
	 */
	batchSaveToLibrary(queueTabIds: string[]): Promise<void>;

	/**
	 * Batch save all tabs from a past session
	 */
	savePastSessionTabs(sessionId: string): Promise<void>;

	// ============================================================================
	// Events
	// ============================================================================

	/**
	 * Subscribe to session updates
	 */
	onSessionUpdate(callback: (session: Session) => void): void;

	/**
	 * Subscribe to queue updates
	 */
	onQueueUpdate(callback: (queue: QueueTab[]) => void): void;

	/**
	 * Subscribe to member updates
	 */
	onMemberUpdate(callback: (members: Member[]) => void): void;

	/**
	 * Subscribe to errors
	 */
	onError(callback: (error: Error) => void): void;
}
