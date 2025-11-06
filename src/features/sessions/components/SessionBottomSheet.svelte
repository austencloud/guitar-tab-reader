<script lang="ts">
	import { Music2, UserPlus, Plus, History } from 'lucide-svelte';
	import BottomSheet from '$features/shared/components/BottomSheet.svelte';
	import type { SessionState } from '$features/sessions/state/session.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		sessionState?: SessionState;
	}

	let { isOpen, onClose, sessionState }: Props = $props();

	function handleCreateSession() {
		sessionState?.openCreateModal();
		onClose();
	}

	function handleJoinSession() {
		sessionState?.openJoinModal();
		onClose();
	}

	function handleViewRooms() {
		// TODO: Implement persistent rooms view
		console.log('View rooms');
	}

	function handleViewHistory() {
		sessionState?.toggleHistoryView();
		onClose();
	}
</script>

<BottomSheet open={isOpen} {onClose} title="Jam Sessions">
	<div class="session-options">
		<button class="option-card primary" onclick={handleCreateSession}>
			<div class="option-icon">
				<Plus size={24} />
			</div>
			<div class="option-content">
				<h3>Create Session</h3>
				<p>Start a new jam session and invite friends</p>
			</div>
		</button>

		<button class="option-card" onclick={handleJoinSession}>
			<div class="option-icon">
				<UserPlus size={24} />
			</div>
			<div class="option-content">
				<h3>Join Session</h3>
				<p>Enter a code to join an existing session</p>
			</div>
		</button>

		{#if sessionState?.persistentRooms && sessionState.persistentRooms.length > 0}
			<button class="option-card" onclick={handleViewRooms}>
				<div class="option-icon">
					<Music2 size={24} />
				</div>
				<div class="option-content">
					<h3>My Rooms</h3>
					<p>{sessionState.persistentRooms.length} saved rooms</p>
				</div>
			</button>
		{/if}

		<button class="option-card" onclick={handleViewHistory}>
			<div class="option-icon">
				<History size={24} />
			</div>
			<div class="option-content">
				<h3>Session History</h3>
				<p>View past jam sessions</p>
			</div>
		</button>
	</div>
</BottomSheet>

<style>
	.session-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
	}

	.option-card:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.option-card.primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border-color: #3b82f6;
		color: white;
	}

	.option-card.primary:hover {
		border-color: #2563eb;
	}

	.option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.option-card:not(.primary) .option-icon {
		background: #f3f4f6;
		color: #3b82f6;
	}

	.option-content {
		flex: 1;
		min-width: 0;
	}

	.option-content h3 {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
		color: inherit;
	}

	.option-content p {
		font-size: 0.875rem;
		margin: 0;
		opacity: 0.8;
	}

	.option-card:not(.primary) .option-content h3 {
		color: #111827;
	}

	.option-card:not(.primary) .option-content p {
		color: #6b7280;
	}

	@media (prefers-color-scheme: dark) {
		.option-card {
			background: #1f2937;
			border-color: #374151;
		}

		.option-card:hover {
			border-color: #3b82f6;
		}

		.option-card:not(.primary) .option-icon {
			background: #374151;
		}

		.option-card:not(.primary) .option-content h3 {
			color: #f9fafb;
		}

		.option-card:not(.primary) .option-content p {
			color: #9ca3af;
		}
	}
</style>
