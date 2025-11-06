import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { Tab } from '$lib/stores/tabs';
import type { ISessionManager } from '../contracts/ISessionManager';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IQueueManagementService } from '../contracts/IQueueManagementService';
import type { IMemberManagementService } from '../contracts/IMemberManagementService';
import type { IPlaylistService } from '../contracts/IPlaylistService';
import type { ISessionHistoryService } from '../contracts/ISessionHistoryService';
import type { IPersistentRoomService } from '../contracts/IPersistentRoomService';
import type { ISessionSyncService } from '../contracts/ISessionSyncService';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type {
	Session,
	QueueTab,
	Member,
	SessionSettings,
	PastSession,
	PersistentRoom,
	Playlist
} from '../../types';

/**
 * Session orchestrator - thin coordinator that delegates to focused services
 * Implements ISessionManager by composing specialized services
 * 
 * This replaces the 883-line SessionManagerService monolith with clean delegation
 */

@injectable()
export class SessionOrchestrator implements ISessionManager {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.QueueManagement) private queue: IQueueManagementService,
		@inject(TYPES.MemberManagement) private members: IMemberManagementService,
		@inject(TYPES.PlaylistService) private playlists: IPlaylistService,
		@inject(TYPES.SessionHistory) private history: ISessionHistoryService,
		@inject(TYPES.PersistentRoomService) private rooms: IPersistentRoomService,
		@inject(TYPES.SessionSync) private sync: ISessionSyncService,
		@inject(TYPES.SessionEventBus) private eventBus: ISessionEventBus
	) {
		// Initialize sync service to set up peer handlers
		this.sync.initialize();
	}

	// ============================================================================
	// Session Lifecycle - Delegate to SessionLifecycleService
	// ============================================================================

	async createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<Session> {
		return await this.lifecycle.createSession(name, deviceName, persistentRoomId);
	}

	async joinSession(code: string, deviceName: string): Promise<Session> {
		return await this.lifecycle.joinSession(code, deviceName);
	}

	async leaveSession(saveHistory?: boolean): Promise<void> {
		await this.lifecycle.leaveSession(saveHistory);
	}

	getCurrentSession(): Session | null {
		return this.lifecycle.getCurrentSession();
	}

	isInSession(): boolean {
		return this.lifecycle.isInSession();
	}

	// ============================================================================
	// Queue Management - Delegate to QueueManagementService
	// ============================================================================

	async addTabToQueue(tab: Tab): Promise<QueueTab> {
		return await this.queue.addTabToQueue(tab);
	}

	async removeTabFromQueue(queueTabId: string): Promise<void> {
		await this.queue.removeTabFromQueue(queueTabId);
	}

	async reorderQueue(queueTabs: QueueTab[]): Promise<void> {
		await this.queue.reorderQueue(queueTabs);
	}

	async setCurrentTab(queueTabId: string): Promise<void> {
		await this.queue.setCurrentTab(queueTabId);
	}

	getNextTab(): QueueTab | null {
		return this.queue.getNextTab();
	}

	async playNextTab(): Promise<void> {
		await this.queue.playNextTab();
	}

	// ============================================================================
	// Member Management - Delegate to MemberManagementService
	// ============================================================================

	getMembers(): Member[] {
		return this.members.getMembers();
	}

	getCurrentMember(): Member | null {
		return this.members.getCurrentMember();
	}

	async updateCurrentMember(updates: Partial<Member>): Promise<void> {
		await this.members.updateCurrentMember(updates);
	}

	// ============================================================================
	// Settings & Sync - Delegate to MemberManagementService
	// ============================================================================

	async updateSettings(settings: Partial<SessionSettings>): Promise<void> {
		await this.members.updateSettings(settings);
	}

	async enableScrollSync(): Promise<void> {
		await this.members.enableScrollSync();
	}

	async disableScrollSync(): Promise<void> {
		await this.members.disableScrollSync();
	}

	async updateScrollPosition(lineNumber: number): Promise<void> {
		await this.members.updateScrollPosition(lineNumber);
	}

	// ============================================================================
	// History & Persistence - Delegate to SessionHistoryService
	// ============================================================================

	async getPastSessions(): Promise<PastSession[]> {
		return await this.history.getPastSessions();
	}

	async getPastSession(id: string): Promise<PastSession | undefined> {
		return await this.history.getPastSession(id);
	}

	async deletePastSession(id: string): Promise<void> {
		await this.history.deletePastSession(id);
	}

	async exportSession(sessionId: string): Promise<string> {
		return await this.history.exportSession(sessionId);
	}

	// ============================================================================
	// Persistent Rooms - Delegate to PersistentRoomService
	// ============================================================================

	async createPersistentRoom(name: string): Promise<PersistentRoom> {
		return await this.rooms.createPersistentRoom(name);
	}

	async getPersistentRooms(): Promise<PersistentRoom[]> {
		return await this.rooms.getPersistentRooms();
	}

	async rejoinPersistentRoom(roomId: string, deviceName: string): Promise<Session> {
		return await this.rooms.rejoinPersistentRoom(roomId, deviceName);
	}

	async deletePersistentRoom(roomId: string): Promise<void> {
		await this.rooms.deletePersistentRoom(roomId);
	}

	// ============================================================================
	// Playlists - Delegate to PlaylistService
	// ============================================================================

	async createPlaylist(name: string, tabs: Tab[]): Promise<Playlist> {
		return await this.playlists.createPlaylist(name, tabs);
	}

	async getPlaylists(): Promise<Playlist[]> {
		return await this.playlists.getPlaylists();
	}

	async loadPlaylistToQueue(playlistId: string): Promise<void> {
		await this.playlists.loadPlaylistToQueue(playlistId);
	}

	async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<void> {
		await this.playlists.updatePlaylist(playlistId, updates);
	}

	async deletePlaylist(playlistId: string): Promise<void> {
		await this.playlists.deletePlaylist(playlistId);
	}

	// ============================================================================
	// Tab Library Integration - Delegate to SessionHistoryService
	// ============================================================================

	async saveTabToLibrary(queueTab: QueueTab): Promise<void> {
		await this.history.saveTabToLibrary(queueTab);
	}

	async batchSaveToLibrary(queueTabIds: string[]): Promise<void> {
		await this.history.batchSaveToLibrary(queueTabIds);
	}

	async savePastSessionTabs(sessionId: string): Promise<void> {
		await this.history.savePastSessionTabs(sessionId);
	}

	// ============================================================================
	// Events - Delegate to SessionEventBus
	// ============================================================================

	onSessionUpdate(callback: (session: Session) => void): void {
		this.eventBus.onSessionUpdate(callback);
	}

	onQueueUpdate(callback: (queue: QueueTab[]) => void): void {
		this.eventBus.onQueueUpdate(callback);
	}

	onMemberUpdate(callback: (members: Member[]) => void): void {
		this.eventBus.onMemberUpdate(callback);
	}

	onError(callback: (error: Error) => void): void {
		this.eventBus.onError(callback);
	}
}

