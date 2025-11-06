<script lang="ts">
	import type { SessionState } from '$features/sessions/state/session.svelte';

	interface Props {
		sessionState?: SessionState;
	}

	let { sessionState }: Props = $props();
</script>

{#if sessionState?.isInSession}
	<button
		class="session-indicator"
		onclick={() => sessionState?.toggleQueueView()}
		aria-label="Open session queue"
	>
		<span class="pulse-dot"></span>
		<span class="label">Live</span>
	</button>
{/if}

<style>
	.session-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgb(239, 68, 68);
		border-radius: 9999px;
		color: rgb(239, 68, 68);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.session-indicator:hover {
		background: rgba(239, 68, 68, 0.2);
		transform: scale(1.05);
	}

	.pulse-dot {
		position: relative;
		width: 8px;
		height: 8px;
		background: rgb(239, 68, 68);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	.pulse-dot::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgb(239, 68, 68);
		animation: ping 2s ease-in-out infinite;
	}

	.label {
		user-select: none;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes ping {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		75%,
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>
