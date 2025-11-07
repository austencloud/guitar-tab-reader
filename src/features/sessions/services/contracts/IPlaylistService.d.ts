import type { Tab } from '$lib/stores/tabs';
import type { Playlist } from '../../types';
/**
 * Service for managing playlists
 * Handles playlist CRUD operations
 */
export interface IPlaylistService {
    /**
     * Create a new playlist
     */
    createPlaylist(name: string, tabs: Tab[]): Promise<Playlist>;
    /**
     * Get all playlists
     */
    getPlaylists(): Promise<Playlist[]>;
    /**
     * Get a specific playlist
     */
    getPlaylist(playlistId: string): Promise<Playlist | undefined>;
    /**
     * Update a playlist
     */
    updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void>;
    /**
     * Delete a playlist
     */
    deletePlaylist(playlistId: string): Promise<void>;
    /**
     * Load a playlist into the queue
     */
    loadPlaylistToQueue(playlistId: string): Promise<void>;
}
