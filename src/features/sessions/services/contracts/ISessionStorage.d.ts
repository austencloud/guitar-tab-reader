import type { PastSession, PersistentRoom, Playlist } from '../../types';
/**
 * Interface for session persistence (IndexedDB via Dexie)
 */
export interface ISessionStorage {
    /**
     * Save a completed session to history
     */
    savePastSession(session: PastSession): Promise<void>;
    /**
     * Get all past sessions, sorted by date (newest first)
     */
    getPastSessions(): Promise<PastSession[]>;
    /**
     * Get a specific past session by ID
     */
    getPastSession(id: string): Promise<PastSession | undefined>;
    /**
     * Delete a past session
     */
    deletePastSession(id: string): Promise<void>;
    /**
     * Clear all past sessions
     */
    clearPastSessions(): Promise<void>;
    /**
     * Create or update a persistent room
     */
    savePersistentRoom(room: PersistentRoom): Promise<void>;
    /**
     * Get all persistent rooms, sorted by last active
     */
    getPersistentRooms(): Promise<PersistentRoom[]>;
    /**
     * Get a persistent room by ID
     */
    getPersistentRoom(id: string): Promise<PersistentRoom | undefined>;
    /**
     * Get a persistent room by code
     */
    getPersistentRoomByCode(code: string): Promise<PersistentRoom | undefined>;
    /**
     * Update last active timestamp for a room
     */
    updateRoomActivity(id: string): Promise<void>;
    /**
     * Delete a persistent room
     */
    deletePersistentRoom(id: string): Promise<void>;
    /**
     * Create or update a playlist
     */
    savePlaylist(playlist: Playlist): Promise<void>;
    /**
     * Get all playlists, sorted by update date
     */
    getPlaylists(): Promise<Playlist[]>;
    /**
     * Get a specific playlist by ID
     */
    getPlaylist(id: string): Promise<Playlist | undefined>;
    /**
     * Delete a playlist
     */
    deletePlaylist(id: string): Promise<void>;
    /**
     * Update playlist last modified timestamp
     */
    updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void>;
}
