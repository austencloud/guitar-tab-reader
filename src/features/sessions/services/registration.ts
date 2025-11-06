import type { Container } from 'inversify';
import { TYPES } from '$core/di/types';
import type { IPeerConnection } from './contracts/IPeerConnection';
import type { ISessionStorage } from './contracts/ISessionStorage';
import type { ISessionManager } from './contracts/ISessionManager';
import type { ISessionEventBus } from './contracts/ISessionEventBus';
import type { ISessionLifecycleService } from './contracts/ISessionLifecycleService';
import type { IQueueManagementService } from './contracts/IQueueManagementService';
import type { IMemberManagementService } from './contracts/IMemberManagementService';
import type { IPlaylistService } from './contracts/IPlaylistService';
import type { ISessionHistoryService } from './contracts/ISessionHistoryService';
import type { IPersistentRoomService } from './contracts/IPersistentRoomService';
import type { ISessionSyncService } from './contracts/ISessionSyncService';
import { PeerConnectionService } from './implementations/PeerConnectionService';
import { SessionStorageService } from './implementations/SessionStorageService';
import { SessionEventBus } from './implementations/SessionEventBus';
import { SessionLifecycleService } from './implementations/SessionLifecycleService';
import { QueueManagementService } from './implementations/QueueManagementService';
import { MemberManagementService } from './implementations/MemberManagementService';
import { PlaylistService } from './implementations/PlaylistService';
import { SessionHistoryService } from './implementations/SessionHistoryService';
import { PersistentRoomService } from './implementations/PersistentRoomService';
import { SessionSyncService } from './implementations/SessionSyncService';
import { SessionOrchestrator } from './implementations/SessionOrchestrator';
import { SessionState } from '../state/session.svelte';

/**
 * Register all session-related services with the DI container
 * Now using refactored, focused services instead of monolithic SessionManagerService
 */
export function registerSessionServices(container: Container): void {
	// Bind infrastructure services
	container.bind<IPeerConnection>(TYPES.PeerConnection).to(PeerConnectionService).inSingletonScope();

	container
		.bind<ISessionStorage>(TYPES.SessionStorage)
		.to(SessionStorageService)
		.inSingletonScope();

	// Bind refactored session services
	container
		.bind<ISessionEventBus>(TYPES.SessionEventBus)
		.to(SessionEventBus)
		.inSingletonScope();

	container
		.bind<ISessionLifecycleService>(TYPES.SessionLifecycle)
		.to(SessionLifecycleService)
		.inSingletonScope();

	container
		.bind<IQueueManagementService>(TYPES.QueueManagement)
		.to(QueueManagementService)
		.inSingletonScope();

	container
		.bind<IMemberManagementService>(TYPES.MemberManagement)
		.to(MemberManagementService)
		.inSingletonScope();

	container
		.bind<IPlaylistService>(TYPES.PlaylistService)
		.to(PlaylistService)
		.inSingletonScope();

	container
		.bind<ISessionHistoryService>(TYPES.SessionHistory)
		.to(SessionHistoryService)
		.inSingletonScope();

	container
		.bind<IPersistentRoomService>(TYPES.PersistentRoomService)
		.to(PersistentRoomService)
		.inSingletonScope();

	container
		.bind<ISessionSyncService>(TYPES.SessionSync)
		.to(SessionSyncService)
		.inSingletonScope();

	// Bind the orchestrator as the ISessionManager implementation
	container
		.bind<ISessionManager>(TYPES.SessionManager)
		.to(SessionOrchestrator)
		.inSingletonScope();

	// Bind state management
	container.bind<SessionState>(TYPES.SessionState).to(SessionState).inSingletonScope();

	console.log('[DI] Session services registered (refactored architecture)');
}
