import type { IPersistentRoomService } from '../contracts/IPersistentRoomService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { ISessionStorage } from '../contracts/ISessionStorage';
import type { PersistentRoom, Session } from '../../types';
/**
 * Service for managing persistent rooms
 * Handles room creation, retrieval, and rejoining
 */
export declare class PersistentRoomService implements IPersistentRoomService {
    private lifecycle;
    private storage;
    constructor(lifecycle: ISessionLifecycleService, storage: ISessionStorage);
    createPersistentRoom(name: string): Promise<PersistentRoom>;
    getPersistentRooms(): Promise<PersistentRoom[]>;
    getPersistentRoom(roomId: string): Promise<PersistentRoom | undefined>;
    rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session>;
    deletePersistentRoom(roomId: string): Promise<void>;
}
