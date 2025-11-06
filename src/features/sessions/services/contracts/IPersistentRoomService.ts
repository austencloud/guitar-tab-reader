import type { PersistentRoom, Session } from '../../types';

/**
 * Service for managing persistent rooms
 * Handles room creation, retrieval, and rejoining
 */

export interface IPersistentRoomService {
	/**
	 * Create a persistent room
	 */
	createPersistentRoom(name: string): Promise<PersistentRoom>;

	/**
	 * Get all persistent rooms
	 */
	getPersistentRooms(): Promise<PersistentRoom[]>;

	/**
	 * Get a specific persistent room
	 */
	getPersistentRoom(roomId: string): Promise<PersistentRoom | undefined>;

	/**
	 * Rejoin a persistent room
	 */
	rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session>;

	/**
	 * Delete a persistent room
	 */
	deletePersistentRoom(roomId: string): Promise<void>;
}

