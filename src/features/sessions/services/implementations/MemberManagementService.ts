import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di/types';
import type { IMemberManagementService } from '../contracts/IMemberManagementService';
import type { ISessionLifecycleService } from '../contracts/ISessionLifecycleService';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { ISessionEventBus } from '../contracts/ISessionEventBus';
import type {
	Member,
	SessionSettings,
	SessionEvent,
	ScrollPositionUpdatedPayload,
	SessionSettingsUpdatedPayload
} from '../../types';
import { SessionError, SessionErrorCode, SessionEventType } from '../../types';

/**
 * Service for managing session members
 * Handles member tracking, updates, and settings
 */

@injectable()
export class MemberManagementService implements IMemberManagementService {
	constructor(
		@inject(TYPES.SessionLifecycle) private lifecycle: ISessionLifecycleService,
		@inject(TYPES.PeerConnection) private peerConnection: IPeerConnection,
		@inject(TYPES.SessionEventBus) private eventBus: ISessionEventBus
	) {}

	// ============================================================================
	// Member Management
	// ============================================================================

	getMembers(): Member[] {
		const session = this.lifecycle.getCurrentSession();
		return session?.members || [];
	}

	getCurrentMember(): Member | null {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			return null;
		}

		return session.members.find((m) => m.id === memberId) || null;
	}

	async updateCurrentMember(updates: Partial<Member>): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		const member = session.members.find((m) => m.id === memberId);
		if (member) {
			Object.assign(member, updates);

			// Broadcast to peers
			const event: SessionEvent = {
				type: SessionEventType.MEMBER_UPDATED,
				payload: { memberId, updates },
				senderId: memberId,
				timestamp: Date.now()
			};
			await this.peerConnection.broadcast(event);

			this.eventBus.emitMemberUpdate(session.members);
		}
	}

	// ============================================================================
	// Settings & Sync
	// ============================================================================

	async updateSettings(settings: Partial<SessionSettings>): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		Object.assign(session.settings, settings);

		// Broadcast to peers
		const event: SessionEvent<SessionSettingsUpdatedPayload> = {
			type: SessionEventType.SESSION_SETTINGS_UPDATED,
			payload: { settings },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);

		this.eventBus.emitSessionUpdate(session);
	}

	async enableScrollSync(): Promise<void> {
		const memberId = this.lifecycle.getCurrentMemberId();
		if (!memberId) {
			throw new SessionError('Not in a session', SessionErrorCode.SESSION_NOT_FOUND);
		}

		await this.updateSettings({
			syncScrolling: true,
			syncHost: memberId
		});
	}

	async disableScrollSync(): Promise<void> {
		await this.updateSettings({
			syncScrolling: false,
			syncHost: null
		});
	}

	async updateScrollPosition(lineNumber: number): Promise<void> {
		const session = this.lifecycle.getCurrentSession();
		const memberId = this.lifecycle.getCurrentMemberId();

		if (!session || !memberId) {
			return;
		}

		if (!session.settings.syncScrolling) {
			return;
		}

		// Update local member scroll position
		const member = session.members.find((m) => m.id === memberId);
		if (member) {
			member.scrollPosition = lineNumber;
		}

		// Broadcast to peers
		const event: SessionEvent<ScrollPositionUpdatedPayload> = {
			type: SessionEventType.SCROLL_POSITION_UPDATED,
			payload: { memberId, lineNumber },
			senderId: memberId,
			timestamp: Date.now()
		};
		await this.peerConnection.broadcast(event);
	}
}

