import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { Tab } from '$lib/stores/tabs';
import type { IPlaylistService } from '../contracts/IPlaylistService';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { Playlist } from '../../types';

/**
 * Service for managing playlists
 * Handles playlist CRUD operations
 */

@injectable()
export class PlaylistService implements IPlaylistService {
	constructor(
		@inject(TYPES.SessionStorage) private storage: ISessionStorage,
		@inject(TYPES.QueueManagement) private queueService: IQueueManagementService
	) {}

	// ============================================================================
	// Playlist Operations
	// ============================================================================

	async createPlaylist(name: string, tabs: Tab[]): Promise<Playlist> {
		const playlist: Playlist = {
			id: crypto.randomUUID(),
			name,
			tabs,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await this.storage.savePlaylist(playlist);
		console.log('[Playlist] Created playlist:', name);

		return playlist;
	}

	async getPlaylists(): Promise<Playlist[]> {
		return await this.storage.getPlaylists();
	}

	async getPlaylist(playlistId: string): Promise<Playlist | undefined> {
		return await this.storage.getPlaylist(playlistId);
	}

	async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void> {
		await this.storage.updatePlaylist(playlistId, updates);
	}

	async deletePlaylist(playlistId: string): Promise<void> {
		await this.storage.deletePlaylist(playlistId);
	}

	async loadPlaylistToQueue(playlistId: string): Promise<void> {
		const playlist = await this.storage.getPlaylist(playlistId);
		if (!playlist) {
			throw new Error('Playlist not found');
		}

		// Add all tabs to queue
		for (const tab of playlist.tabs) {
			await this.queueService.addTabToQueue(tab);
		}

		console.log('[Playlist] Loaded playlist to queue:', playlist.name);
	}
}

