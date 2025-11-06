import Dexie, { type Table } from 'dexie';
import type { PastSession, PersistentRoom, Playlist } from '../types';
/**
 * IndexedDB schema for session persistence
 * Using Dexie for cleaner API and better TypeScript support
 */
export declare class SessionDatabase extends Dexie {
    pastSessions: Table<PastSession, string>;
    persistentRooms: Table<PersistentRoom, string>;
    playlists: Table<Playlist, string>;
    constructor();
}
export declare const db: SessionDatabase;
