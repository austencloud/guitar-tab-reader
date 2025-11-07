import type { Tab } from '$lib/state/tabs.svelte';
import type { IPlaylistService } from '../contracts/IPlaylistService';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { Playlist } from '../../types';
/**
 * Service for managing playlists
 * Handles playlist CRUD operations
 */
export declare class PlaylistService implements IPlaylistService {
    private storage;
    private queueService;
    constructor(storage: ISessionStorage, queueService: IQueueManagementService);
    createPlaylist(name: string, tabs: Tab[]): Promise<Playlist>;
    getPlaylists(): Promise<Playlist[]>;
    getPlaylist(playlistId: string): Promise<Playlist | undefined>;
    updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void>;
    deletePlaylist(playlistId: string): Promise<void>;
    loadPlaylistToQueue(playlistId: string): Promise<void>;
}
