import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { ISessionManager } from '../services/contracts/ISessionManager';
import type { Session, QueueTab, Member, PersistentRoom, Playlist } from '../types';

/**
 * Session state management using Svelte 5 runes
 * Provides reactive state for the session feature
 */

@injectable()
export class SessionState {
	// Core session state
	currentSession = $state<Session | null>(null);
	isInSession = $state(false);
	isConnecting = $state(false);
	error = $state<string | null>(null);

	// Queue state
	queue = $state<QueueTab[]>([]);
	currentTab = $state<QueueTab | null>(null);

	// Members state
	members = $state<Member[]>([]);
	currentMember = $state<Member | null>(null);

	// UI state
	showSessionSheet = $state(false);
	showQueueView = $state(false);
	showHistoryView = $state(false);
	showCreateModal = $state(false);
	showJoinModal = $state(false);

	// Persistent data
	persistentRooms = $state<PersistentRoom[]>([]);
	playlists = $state<Playlist[]>([]);

	constructor(@inject(TYPES.SessionManager) private sessionManager: ISessionManager) {
		// Subscribe to session updates
		this.sessionManager.onSessionUpdate((session) => {
			this.currentSession = session;
			this.isInSession = true;
			this.currentTab = session.currentTabId
				? session.queue.find((qt) => qt.id === session.currentTabId) || null
				: null;
		});

		// Subscribe to queue updates
		this.sessionManager.onQueueUpdate((queue) => {
			this.queue = queue;
		});

		// Subscribe to member updates
		this.sessionManager.onMemberUpdate((members) => {
			this.members = members;
			this.currentMember = this.sessionManager.getCurrentMember();
		});

		// Subscribe to errors
		this.sessionManager.onError((error) => {
			this.error = error.message;
			this.isConnecting = false;
		});

		// Load persistent data
		this.loadPersistentData();
	}

	// ============================================================================
	// Derived State
	// ============================================================================

	hasSession = $derived(this.currentSession !== null);
	queueLength = $derived(this.queue.length);
	memberCount = $derived(this.members.length);
	isHost = $derived(
		this.currentSession && this.currentMember
			? this.currentSession.createdBy === this.currentMember.id
			: false
	);
	canPlayNext = $derived(() => {
		return this.sessionManager.getNextTab() !== null;
	});
	syncScrollingEnabled = $derived(this.currentSession?.settings.syncScrolling ?? false);
	syncHost = $derived(() => {
		if (!this.currentSession?.settings.syncHost) return null;
		return this.members.find((m) => m.id === this.currentSession!.settings.syncHost) || null;
	});

	// ============================================================================
	// Session Actions
	// ============================================================================

	async createSession(name: string, deviceName: string, persistentRoomId?: string): Promise<void> {
		this.isConnecting = true;
		this.error = null;

		try {
			const session = await this.sessionManager.createSession(name, deviceName, persistentRoomId);
			this.currentSession = session;
			this.isInSession = true;
			this.queue = session.queue;
			this.members = session.members;
			this.currentMember = this.sessionManager.getCurrentMember();
			this.showCreateModal = false;
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		} finally {
			this.isConnecting = false;
		}
	}

	async joinSession(code: string, deviceName: string): Promise<void> {
		this.isConnecting = true;
		this.error = null;

		try {
			const session = await this.sessionManager.joinSession(code, deviceName);
			this.currentSession = session;
			this.isInSession = true;
			this.queue = session.queue;
			this.members = session.members;
			this.currentMember = this.sessionManager.getCurrentMember();
			this.showJoinModal = false;
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		} finally {
			this.isConnecting = false;
		}
	}

	async leaveSession(saveHistory: boolean = true): Promise<void> {
		await this.sessionManager.leaveSession(saveHistory);
		this.currentSession = null;
		this.isInSession = false;
		this.queue = [];
		this.currentTab = null;
		this.members = [];
		this.currentMember = null;
		this.showQueueView = false;
		this.showSessionSheet = false;
	}

	// ============================================================================
	// Queue Actions
	// ============================================================================

	async addTabToQueue(tab: any): Promise<void> {
		try {
			await this.sessionManager.addTabToQueue(tab);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async removeTabFromQueue(queueTabId: string): Promise<void> {
		try {
			await this.sessionManager.removeTabFromQueue(queueTabId);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async reorderQueue(queueTabs: QueueTab[]): Promise<void> {
		try {
			await this.sessionManager.reorderQueue(queueTabs);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async setCurrentTab(queueTabId: string): Promise<void> {
		try {
			await this.sessionManager.setCurrentTab(queueTabId);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async playNextTab(): Promise<void> {
		try {
			await this.sessionManager.playNextTab();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async saveTabToLibrary(queueTab: QueueTab): Promise<void> {
		try {
			await this.sessionManager.saveTabToLibrary(queueTab);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async loadPlaylistToQueue(playlistId: string): Promise<void> {
		try {
			await this.sessionManager.loadPlaylistToQueue(playlistId);
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	// ============================================================================
	// Scroll Sync Actions
	// ============================================================================

	async enableScrollSync(): Promise<void> {
		try {
			await this.sessionManager.enableScrollSync();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async disableScrollSync(): Promise<void> {
		try {
			await this.sessionManager.disableScrollSync();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async updateScrollPosition(lineNumber: number): Promise<void> {
		try {
			await this.sessionManager.updateScrollPosition(lineNumber);
		} catch (error) {
			this.error = (error as Error).message;
		}
	}

	// ============================================================================
	// Persistent Rooms Actions
	// ============================================================================

	async createPersistentRoom(name: string): Promise<void> {
		try {
			await this.sessionManager.createPersistentRoom(name);
			await this.loadPersistentData();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async rejoinPersistentRoom(roomId: string, deviceName: string): Promise<void> {
		this.isConnecting = true;
		this.error = null;

		try {
			const session = await this.sessionManager.rejoinPersistentRoom(roomId, deviceName);
			this.currentSession = session;
			this.isInSession = true;
			this.queue = session.queue;
			this.members = session.members;
			this.currentMember = this.sessionManager.getCurrentMember();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		} finally {
			this.isConnecting = false;
		}
	}

	async deletePersistentRoom(roomId: string): Promise<void> {
		try {
			await this.sessionManager.deletePersistentRoom(roomId);
			await this.loadPersistentData();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	// ============================================================================
	// Playlist Actions
	// ============================================================================

	async createPlaylist(name: string, tabs: any[]): Promise<void> {
		try {
			await this.sessionManager.createPlaylist(name, tabs);
			await this.loadPersistentData();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	async deletePlaylist(playlistId: string): Promise<void> {
		try {
			await this.sessionManager.deletePlaylist(playlistId);
			await this.loadPersistentData();
		} catch (error) {
			this.error = (error as Error).message;
			throw error;
		}
	}

	// ============================================================================
	// UI Actions
	// ============================================================================

	toggleSessionSheet(): void {
		this.showSessionSheet = !this.showSessionSheet;
	}

	toggleQueueView(): void {
		this.showQueueView = !this.showQueueView;
	}

	toggleHistoryView(): void {
		this.showHistoryView = !this.showHistoryView;
	}

	openCreateModal(): void {
		this.showCreateModal = true;
		this.error = null;
	}

	closeCreateModal(): void {
		this.showCreateModal = false;
		this.error = null;
	}

	openJoinModal(): void {
		this.showJoinModal = true;
		this.error = null;
	}

	closeJoinModal(): void {
		this.showJoinModal = false;
		this.error = null;
	}

	clearError(): void {
		this.error = null;
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	private async loadPersistentData(): Promise<void> {
		try {
			this.persistentRooms = await this.sessionManager.getPersistentRooms();
			this.playlists = await this.sessionManager.getPlaylists();
		} catch (error) {
			console.error('[SessionState] Failed to load persistent data:', error);
		}
	}
}
