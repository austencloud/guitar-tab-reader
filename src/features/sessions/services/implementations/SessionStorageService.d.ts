import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PastSession, PersistentRoom, Playlist } from '../../types';
/**
 * Session storage service using Dexie (IndexedDB)
 * Handles all persistent data storage for sessions
 */
export declare class SessionStorageService implements ISessionStorage {
    savePastSession(session: PastSession): Promise<void>;
    getPastSessions(): Promise<PastSession[]>;
    getPastSession(id: string): Promise<PastSession | undefined>;
    deletePastSession(id: string): Promise<void>;
    clearPastSessions(): Promise<void>;
    savePersistentRoom(room: PersistentRoom): Promise<void>;
    getPersistentRooms(): Promise<PersistentRoom[]>;
    getPersistentRoom(id: string): Promise<PersistentRoom | undefined>;
    getPersistentRoomByCode(code: string): Promise<PersistentRoom | undefined>;
    updateRoomActivity(id: string): Promise<void>;
    deletePersistentRoom(id: string): Promise<void>;
    savePlaylist(playlist: Playlist): Promise<void>;
    getPlaylists(): Promise<Playlist[]>;
    getPlaylist(id: string): Promise<Playlist | undefined>;
    deletePlaylist(id: string): Promise<void>;
    updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void>;
}
