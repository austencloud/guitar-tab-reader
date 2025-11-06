import type { Container } from 'inversify';
import { TYPES } from '$core/di/types';
import type { IPeerConnection } from './contracts/IPeerConnection';
import type { ISessionStorage } from './contracts/ISessionStorage';
import type { ISessionManager } from './contracts/ISessionManager';
import { PeerConnectionService } from './implementations/PeerConnectionService';
import { SessionStorageService } from './implementations/SessionStorageService';
import { SessionManagerService } from './implementations/SessionManagerService';
import { SessionState } from '../state/session.svelte';

/**
 * Register all session-related services with the DI container
 */
export function registerSessionServices(container: Container): void {
	// Bind service implementations to their contracts
	container.bind<IPeerConnection>(TYPES.PeerConnection).to(PeerConnectionService).inSingletonScope();

	container
		.bind<ISessionStorage>(TYPES.SessionStorage)
		.to(SessionStorageService)
		.inSingletonScope();

	container
		.bind<ISessionManager>(TYPES.SessionManager)
		.to(SessionManagerService)
		.inSingletonScope();

	// Bind state management
	container.bind<SessionState>(TYPES.SessionState).to(SessionState).inSingletonScope();

	console.log('[DI] Session services registered');
}
