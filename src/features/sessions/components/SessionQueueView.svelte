<script lang="ts">
	import { Music, Play, Save, Trash2, Users, Copy, X } from 'lucide-svelte';
	import { formatRoomCode } from '../utils/roomCodeGenerator';
	import type { QueueTab } from '../types';
	import type { SessionState } from '$features/sessions/state/session.svelte';

	interface Props {
		sessionState?: SessionState;
	}

	let { sessionState }: Props = $props();

	let draggedItem: QueueTab | null = $state(null);
	let dragOverIndex: number | null = $state(null);
	let showCopiedFeedback = $state(false);

	function handleDragStart(e: DragEvent, item: QueueTab) {
		draggedItem = item;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(e: DragEvent, targetIndex: number) {
		e.preventDefault();

		if (!draggedItem || !sessionState) return;

		const items = [...sessionState.queue];
		const draggedIndex = items.findIndex((item) => item.id === draggedItem!.id);

		if (draggedIndex === -1) return;

		// Remove from old position
		const [removed] = items.splice(draggedIndex, 1);

		// Insert at new position
		items.splice(targetIndex, 0, removed);

		// Update order property
		items.forEach((item, idx) => {
			item.order = idx;
		});

		// Update queue
		sessionState.reorderQueue(items);

		draggedItem = null;
		dragOverIndex = null;
	}

	function handleDragEnd() {
		draggedItem = null;
		dragOverIndex = null;
	}

	async function handlePlayTab(queueTab: QueueTab) {
		await sessionState?.setCurrentTab(queueTab.id);
	}

	async function handleRemoveTab(queueTabId: string) {
		await sessionState?.removeTabFromQueue(queueTabId);
	}

	async function handleSaveTab(queueTab: QueueTab) {
		await sessionState?.saveTabToLibrary(queueTab);
	}

	async function copyRoomCode() {
		if (sessionState?.currentSession) {
			await navigator.clipboard.writeText(sessionState.currentSession.code);
			showCopiedFeedback = true;
			setTimeout(() => {
				showCopiedFeedback = false;
			}, 2000);
		}
	}

	function handleClose() {
		sessionState?.toggleQueueView();
	}

	async function handleLeaveSession() {
		if (confirm('Are you sure you want to leave this session?')) {
			await sessionState?.leaveSession(true);
		}
	}

	const formattedCode = $derived(
		sessionState?.currentSession ? formatRoomCode(sessionState.currentSession.code) : ''
	);
</script>

{#if sessionState?.showQueueView && sessionState?.currentSession}
	<div class="queue-overlay" onclick={handleClose}>
		<div class="queue-container" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="queue-header">
				<div class="header-content">
					<h2>{sessionState.currentSession.name}</h2>
					<div class="session-info">
						<div class="info-item">
							<Users size={16} />
							<span>{sessionState.members.length} online</span>
						</div>
						<button class="code-button" onclick={copyRoomCode}>
							<span class="code">{formattedCode}</span>
							<Copy size={14} />
							{#if showCopiedFeedback}
								<span class="copied-feedback">Copied!</span>
							{/if}
						</button>
					</div>
				</div>
				<button class="close-button" onclick={handleClose}>
					<X size={24} />
				</button>
			</div>

			<!-- Current Tab -->
			{#if sessionState?.currentTab}
				<div class="current-tab">
					<div class="tab-label">NOW PLAYING</div>
					<div class="tab-info">
						<Music size={20} />
						<div class="tab-details">
							<div class="tab-title">{sessionState.currentTab.tab.title}</div>
							{#if sessionState.currentTab.tab.artist}
								<div class="tab-artist">{sessionState.currentTab.tab.artist}</div>
							{/if}
						</div>
					</div>
					<div class="tab-actions">
						<button
							class="action-button"
							onclick={() => handleSaveTab(sessionState?.currentTab!)}
							title="Save to library"
						>
							<Save size={18} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Queue -->
			<div class="queue-section">
				<div class="queue-label">
					QUEUE ({sessionState?.queue.length})
				</div>

				{#if sessionState?.queue.length === 0}
					<div class="empty-queue">
						<Music size={48} />
						<p>No tabs in queue</p>
						<p class="empty-hint">Add tabs from your library to get started</p>
					</div>
				{:else}
					<div class="queue-list">
						{#each sessionState?.queue as item, index (item.id)}
							<div
								class="queue-item"
								class:dragging={draggedItem?.id === item.id}
								class:drag-over={dragOverIndex === index}
								class:is-current={item.id === sessionState?.currentSession?.currentTabId}
								draggable="true"
								ondragstart={(e) => handleDragStart(e, item)}
								ondragover={(e) => handleDragOver(e, index)}
								ondragleave={handleDragLeave}
								ondrop={(e) => handleDrop(e, index)}
								ondragend={handleDragEnd}
							>
								<div class="drag-handle">
									<div class="handle-bars">
										<div class="bar"></div>
										<div class="bar"></div>
										<div class="bar"></div>
									</div>
								</div>
								<div class="item-content">
									<div class="item-info">
										<div class="item-title">{item.tab.title}</div>
										{#if item.tab.artist}
											<div class="item-artist">{item.tab.artist}</div>
										{/if}
										<div class="item-meta">
											Added by {sessionState?.members.find((m) => m.id === item.addedBy)?.deviceName || 'Unknown'}
										</div>
									</div>
									<div class="item-actions">
										<button
											class="action-button"
											onclick={() => handlePlayTab(item)}
											title="Play now"
										>
											<Play size={18} />
										</button>
										<button
											class="action-button"
											onclick={() => handleSaveTab(item)}
											title="Save to library"
										>
											<Save size={18} />
										</button>
										<button
											class="action-button danger"
											onclick={() => handleRemoveTab(item.id)}
											title="Remove from queue"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="queue-footer">
				<button class="button-secondary" onclick={handleLeaveSession}>
					Leave Session
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.queue-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
	}

	@media (min-width: 768px) {
		.queue-overlay {
			align-items: center;
			justify-content: center;
			padding: 1rem;
		}
	}

	.queue-container {
		background: white;
		width: 100%;
		max-height: 90vh;
		border-radius: 1.5rem 1.5rem 0 0;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	@media (min-width: 768px) {
		.queue-container {
			max-width: 42rem;
			max-height: 80vh;
			border-radius: 1.5rem;
		}
	}

	.queue-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.header-content {
		flex: 1;
	}

	.queue-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.75rem 0;
		color: #111827;
	}

	.session-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.code-button {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #f3f4f6;
		border: none;
		border-radius: 0.5rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.code-button:hover {
		background: #e5e7eb;
	}

	.code {
		letter-spacing: 0.1em;
	}

	.copied-feedback {
		position: absolute;
		top: -2rem;
		left: 50%;
		transform: translateX(-50%);
		background: #111827;
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		white-space: nowrap;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-50%) translateY(0.25rem); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	.close-button {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: #6b7280;
		border-radius: 0.5rem;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.current-tab {
		padding: 1.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}

	.tab-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		opacity: 0.9;
	}

	.tab-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.tab-details {
		flex: 1;
		min-width: 0;
	}

	.tab-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.tab-artist {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.tab-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-button {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-button:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.action-button.danger:hover {
		background: rgba(239, 68, 68, 0.9);
	}

	.queue-section {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.queue-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #6b7280;
		padding: 1rem 1.5rem 0.5rem;
	}

	.empty-queue {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		color: #9ca3af;
		text-align: center;
	}

	.empty-queue p {
		margin: 1rem 0 0.25rem;
		font-weight: 600;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: #d1d5db !important;
		margin: 0 !important;
	}

	.queue-list {
		padding: 0 1.5rem 1.5rem;
	}

	.queue-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		margin-bottom: 0.5rem;
		background: white;
		cursor: move;
		transition: all 0.2s;
	}

	.queue-item:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.queue-item.dragging {
		opacity: 0.5;
	}

	.queue-item.drag-over {
		border-color: #3b82f6;
		border-width: 2px;
		background: rgba(59, 130, 246, 0.05);
	}

	.queue-item.is-current {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.05);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		padding: 0.25rem 0;
		cursor: grab;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.handle-bars {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bar {
		width: 16px;
		height: 2px;
		background: #d1d5db;
		border-radius: 1px;
	}

	.item-content {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-title {
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-artist {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-meta {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.item-actions {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.item-actions .action-button {
		background: #f3f4f6;
		color: #6b7280;
	}

	.item-actions .action-button:hover {
		background: #e5e7eb;
		color: #111827;
	}

	.item-actions .action-button.danger:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	.queue-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.button-secondary {
		width: 100%;
		padding: 0.75rem;
		background: #f3f4f6;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		color: #374151;
	}

	.button-secondary:hover {
		background: #e5e7eb;
	}

	@media (prefers-color-scheme: dark) {
		.queue-container {
			background: #1f2937;
		}

		.queue-header {
			border-bottom-color: #374151;
		}

		.queue-header h2 {
			color: #f9fafb;
		}

		.info-item {
			color: #9ca3af;
		}

		.code-button {
			background: #374151;
			color: #f9fafb;
		}

		.code-button:hover {
			background: #4b5563;
		}

		.close-button {
			color: #9ca3af;
		}

		.close-button:hover {
			background: #374151;
			color: #f9fafb;
		}

		.queue-label {
			color: #9ca3af;
		}

		.queue-item {
			background: #111827;
			border-color: #374151;
		}

		.queue-item:hover {
			border-color: #3b82f6;
		}

		.bar {
			background: #4b5563;
		}

		.item-title {
			color: #f9fafb;
		}

		.item-artist {
			color: #9ca3af;
		}

		.item-meta {
			color: #6b7280;
		}

		.item-actions .action-button {
			background: #374151;
			color: #9ca3af;
		}

		.item-actions .action-button:hover {
			background: #4b5563;
			color: #f9fafb;
		}

		.queue-footer {
			border-top-color: #374151;
		}

		.button-secondary {
			background: #374151;
			color: #d1d5db;
		}

		.button-secondary:hover {
			background: #4b5563;
		}
	}
</style>
