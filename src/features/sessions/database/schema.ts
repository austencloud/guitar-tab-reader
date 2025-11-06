import Dexie, { type Table } from 'dexie';
import type { PastSession, PersistentRoom, Playlist } from '../types';

/**
 * IndexedDB schema for session persistence
 * Using Dexie for cleaner API and better TypeScript support
 */

export class SessionDatabase extends Dexie {
	// Tables
	pastSessions!: Table<PastSession, string>;
	persistentRooms!: Table<PersistentRoom, string>;
	playlists!: Table<Playlist, string>;

	constructor() {
		super('TabScrollSessions');

		this.version(1).stores({
			pastSessions: 'id, date, name',
			persistentRooms: 'id, code, lastActive',
			playlists: 'id, name, createdAt, updatedAt'
		});
	}
}

// Singleton instance
export const db = new SessionDatabase();
