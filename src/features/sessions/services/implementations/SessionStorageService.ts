import { injectable } from 'inversify';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PastSession, PersistentRoom, Playlist } from '../../types';
import { db } from '../../database/schema';

/**
 * Session storage service using Dexie (IndexedDB)
 * Handles all persistent data storage for sessions
 */

@injectable()
export class SessionStorageService implements ISessionStorage {
	// ============================================================================
	// Past Sessions
	// ============================================================================

	async savePastSession(session: PastSession): Promise<void> {
		await db.pastSessions.put(session);
		console.log('[SessionStorage] Saved past session:', session.id);
	}

	async getPastSessions(): Promise<PastSession[]> {
		return await db.pastSessions.orderBy('date').reverse().toArray();
	}

	async getPastSession(id: string): Promise<PastSession | undefined> {
		return await db.pastSessions.get(id);
	}

	async deletePastSession(id: string): Promise<void> {
		await db.pastSessions.delete(id);
		console.log('[SessionStorage] Deleted past session:', id);
	}

	async clearPastSessions(): Promise<void> {
		await db.pastSessions.clear();
		console.log('[SessionStorage] Cleared all past sessions');
	}

	// ============================================================================
	// Persistent Rooms
	// ============================================================================

	async savePersistentRoom(room: PersistentRoom): Promise<void> {
		await db.persistentRooms.put(room);
		console.log('[SessionStorage] Saved persistent room:', room.id);
	}

	async getPersistentRooms(): Promise<PersistentRoom[]> {
		return await db.persistentRooms.orderBy('lastActive').reverse().toArray();
	}

	async getPersistentRoom(id: string): Promise<PersistentRoom | undefined> {
		return await db.persistentRooms.get(id);
	}

	async getPersistentRoomByCode(code: string): Promise<PersistentRoom | undefined> {
		return await db.persistentRooms.where('code').equals(code).first();
	}

	async updateRoomActivity(id: string): Promise<void> {
		await db.persistentRooms.update(id, {
			lastActive: Date.now()
		});
	}

	async deletePersistentRoom(id: string): Promise<void> {
		await db.persistentRooms.delete(id);
		console.log('[SessionStorage] Deleted persistent room:', id);
	}

	// ============================================================================
	// Playlists
	// ============================================================================

	async savePlaylist(playlist: Playlist): Promise<void> {
		await db.playlists.put(playlist);
		console.log('[SessionStorage] Saved playlist:', playlist.id);
	}

	async getPlaylists(): Promise<Playlist[]> {
		return await db.playlists.orderBy('updatedAt').reverse().toArray();
	}

	async getPlaylist(id: string): Promise<Playlist | undefined> {
		return await db.playlists.get(id);
	}

	async deletePlaylist(id: string): Promise<void> {
		await db.playlists.delete(id);
		console.log('[SessionStorage] Deleted playlist:', id);
	}

	async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void> {
		await db.playlists.update(id, {
			...updates,
			updatedAt: Date.now()
		});
	}
}
