<!-- Jam Sessions Hub - Main landing page for jam session features -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Music2, Plus, UserPlus, History, Users, Clock, Play } from 'lucide-svelte';
	import { useSessionState } from '$lib/useSessionState.svelte';
	import { initializeApp } from '$lib/app';

	let sessionState = $state<ReturnType<typeof useSessionState> | undefined>(undefined);
	let mounted = $state(false);

	$effect(() => {
		let disposed = false;

		(async () => {
			try {
				await initializeApp();
				if (disposed) return;
				sessionState = useSessionState();
				mounted = true;
			} catch (error) {
				console.error('Failed to initialize session state:', error);
			}
		})();

		return () => {
			disposed = true;
		};
	});

	function handleCreateSession() {
		sessionState?.openCreateModal();
	}

	function handleJoinSession() {
		sessionState?.openJoinModal();
	}

	function handleViewHistory() {
		goto('/jam/history');
	}

	function handleViewRooms() {
		goto('/jam/rooms');
	}

	// If already in a session, show the active session
	const hasActiveSession = $derived(sessionState?.isInSession ?? false);
	const activeSession = $derived(sessionState?.currentSession);
</script>

<svelte:head>
	<title>Jam Sessions | TabScroll</title>
</svelte:head>

<div class="jam-hub">
	{#if mounted && sessionState}
		{#if hasActiveSession && activeSession}
			<!-- Active Session View -->
			<div class="active-session">
				<div class="session-header">
					<div class="session-icon">
						<Music2 size={32} />
					</div>
					<div class="session-info">
						<h1>{activeSession.name}</h1>
						<div class="session-meta">
							<span class="meta-item">
								<Users size={16} />
								{sessionState.members.length} online
							</span>
							<span class="meta-item">
								<Music2 size={16} />
								{sessionState.queue.length} in queue
							</span>
						</div>
					</div>
				</div>

				<div class="session-actions">
					<button class="action-card primary" onclick={() => sessionState?.toggleQueueView()}>
						<Music2 size={24} />
						<span>View Queue</span>
					</button>
					<button class="action-card" onclick={() => goto('/jam/session')}>
						<Play size={24} />
						<span>Session Details</span>
					</button>
				</div>
			</div>
		{:else}
			<!-- No Active Session - Show Options -->
			<div class="hub-header">
				<div class="header-icon">
					<Music2 size={48} />
				</div>
				<h1>Jam Sessions</h1>
				<p class="subtitle">Collaborate with friends in real-time</p>
			</div>

			<div class="hub-options">
				<button class="option-card primary" onclick={handleCreateSession}>
					<div class="card-icon">
						<Plus size={32} />
					</div>
					<div class="card-content">
						<h2>Create Session</h2>
						<p>Start a new jam session and invite friends to join</p>
					</div>
				</button>

				<button class="option-card" onclick={handleJoinSession}>
					<div class="card-icon">
						<UserPlus size={32} />
					</div>
					<div class="card-content">
						<h2>Join Session</h2>
						<p>Enter a room code to join an existing session</p>
					</div>
				</button>

				{#if sessionState.persistentRooms && sessionState.persistentRooms.length > 0}
					<button class="option-card" onclick={handleViewRooms}>
						<div class="card-icon">
							<Music2 size={32} />
						</div>
						<div class="card-content">
							<h2>My Rooms</h2>
							<p>{sessionState.persistentRooms.length} saved rooms</p>
						</div>
					</button>
				{/if}

				<button class="option-card" onclick={handleViewHistory}>
					<div class="card-icon">
						<History size={32} />
					</div>
					<div class="card-content">
						<h2>Session History</h2>
						<p>View and rejoin past jam sessions</p>
					</div>
				</button>
			</div>

			<!-- Feature Highlights -->
			<div class="features">
				<h3>What you can do</h3>
				<div class="feature-list">
					<div class="feature-item">
						<Users size={20} />
						<span>Real-time collaboration with friends</span>
					</div>
					<div class="feature-item">
						<Music2 size={20} />
						<span>Shared queue and synchronized playback</span>
					</div>
					<div class="feature-item">
						<Clock size={20} />
						<span>Session history and persistent rooms</span>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="loading">
			<Music2 size={48} />
			<p>Loading jam sessions...</p>
		</div>
	{/if}
</div>

<style>
	.jam-hub {
		height: calc(100vh - var(--banner-height, 79px) - var(--nav-height, 80px));
		height: calc(100dvh - var(--banner-height, 79px) - var(--nav-height, 80px));
		display: flex;
		flex-direction: column;
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
		overflow: hidden;
	}

	/* Header */
	.hub-header {
		text-align: center;
		flex-shrink: 0;
		padding: 0.5rem 0;
	}

	.header-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: linear-gradient(135deg, #ec4899, #f472b6);
		border-radius: 16px;
		margin-bottom: 0.75rem;
		color: white;
	}

	.hub-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
		color: var(--color-text-primary, #ffffff);
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
	}

	/* Options Grid */
	.hub-options {
		display: grid;
		gap: 0.75rem;
		flex: 1;
		align-content: center;
		min-height: 0;
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.option-card:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.option-card.primary {
		background: linear-gradient(135deg, #ec4899, #f472b6);
		border-color: transparent;
	}

	.option-card.primary:hover {
		background: linear-gradient(135deg, #f472b6, #fb7185);
	}

	.card-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
	}

	.option-card.primary .card-icon {
		background: rgba(255, 255, 255, 0.2);
	}

	.card-content h2 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.125rem;
		color: white;
	}

	.card-content p {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Features - Hidden to save space */
	.features {
		display: none;
	}

	/* Active Session */
	.active-session {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	.session-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: linear-gradient(135deg, #ec4899, #f472b6);
		border-radius: 16px;
		flex-shrink: 0;
	}

	.session-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: white;
		flex-shrink: 0;
	}

	.session-info {
		flex: 1;
		min-width: 0;
	}

	.session-info h1 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.session-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.session-actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		flex: 1;
		align-content: center;
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.25rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
	}

	.action-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	.action-card span {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Loading */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex: 1;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
	}

	/* Responsive adjustments */
	@media (min-width: 640px) {
		.hub-header h1 {
			font-size: 1.75rem;
		}

		.header-icon {
			width: 64px;
			height: 64px;
		}

		.option-card {
			padding: 1.25rem;
		}

		.card-icon {
			width: 56px;
			height: 56px;
		}

		.card-content h2 {
			font-size: 1.125rem;
		}

		.card-content p {
			font-size: 0.875rem;
		}
	}
</style>
