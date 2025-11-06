<script lang="ts">
	import type { ProgressLogEntry } from '../domain/types';

	interface Props {
		entries: ProgressLogEntry[];
		heading?: string;
	}

	let { entries = [], heading = 'AI Activity' }: Props = $props();

	function formatTimestamp(timestamp: string) {
		try {
			return new Date(timestamp).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch {
			return timestamp;
		}
	}
</script>

{#if entries.length > 0}
	<div class="activity-log">
		<h3>{heading}</h3>
		<div class="log-stream" aria-live="polite">
			{#each entries as entry (entry.timestamp + entry.message)}
				<div class={`log-entry ${entry.level}`}>
					<span class="log-time">{formatTimestamp(entry.timestamp)}</span>
					<span class="log-message">{entry.message}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.activity-log {
		margin-top: 1.5rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #f8f9fa;
	}

	h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		color: #333;
	}

	.log-stream {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 180px;
		overflow-y: auto;
	}

	.log-entry {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: #444;
	}

	.log-entry.warn .log-message {
		color: #b26a00;
	}

	.log-entry.error .log-message {
		color: #c62828;
	}

	.log-time {
		min-width: 70px;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.8rem;
		color: #888;
	}

	.log-message {
		flex: 1;
		white-space: pre-wrap;
	}

	@media (prefers-color-scheme: dark) {
		.activity-log {
			background-color: rgba(255, 255, 255, 0.04);
			border-color: #444;
		}

		h3 {
			color: #e0e0e0;
		}

		.log-entry {
			color: #ccc;
		}

		.log-entry.warn .log-message {
			color: #ffb74d;
		}

		.log-entry.error .log-message {
			color: #ef9a9a;
		}

		.log-time {
			color: #aaa;
		}

		.log-message {
			color: #e0e0e0;
		}
	}
</style>
