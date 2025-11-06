import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { IPersistentRoomService } from '../contracts/IPersistentRoomService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PersistentRoom, Session } from '../../types';
import { generateRoomCode } from '../../utils/roomCodeGenerator';

/**
 * Service for managing persistent rooms
 * Handles room creation, retrieval, and rejoining
 */

@injectable()
export class PersistentRoomService implements IPersistentRoomService {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.SessionStorage) private storage: ISessionStorage
	) {}

	// ============================================================================
	// Persistent Room Operations
	// ============================================================================

	async createPersistentRoom(name: string): Promise<PersistentRoom> {
		const room: PersistentRoom = {
			id: crypto.randomUUID(),
			name,
			code: generateRoomCode(),
			createdAt: Date.now(),
			lastActive: Date.now(),
			memberDeviceIds: [],
			sessions: []
		};

		await this.storage.savePersistentRoom(room);
		console.log('[PersistentRoom] Created persistent room:', room.name);

		return room;
	}

	async getPersistentRooms(): Promise<PersistentRoom[]> {
		return await this.storage.getPersistentRooms();
	}

	async getPersistentRoom(roomId: string): Promise<PersistentRoom | undefined> {
		return await this.storage.getPersistentRoom(roomId);
	}

	async rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session> {
		const room = await this.storage.getPersistentRoom(roomId);
		if (!room) {
			throw new Error('Room not found');
		}

		return await this.lifecycle.createSession(room.name, deviceName, roomId);
	}

	async deletePersistentRoom(roomId: string): Promise<void> {
		await this.storage.deletePersistentRoom(roomId);
	}
}

