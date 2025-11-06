<script lang="ts">
	import type { StringDefinition } from '../services/types';

	interface Props {
		closestString?: StringDefinition | null;
		statusMessage?: string;
		isCurrentlyTuned?: boolean;
	}

	let { closestString = null, statusMessage = '', isCurrentlyTuned = false }: Props = $props();
</script>

<div class="note-info">
	{#if closestString}
		<span class="string-label">String {closestString.string}</span>
		<div class="note-name-wrapper">
			<span class="note-name">{closestString.note}{closestString.octave}</span>
		</div>
		<span class="frequency">{closestString.frequency.toFixed(1)}Hz</span>
	{:else}
		<span class="string-label">{statusMessage || 'Select a string'}</span>
		<div class="note-name-wrapper">
			<span class="note-name empty">--</span>
		</div>
		<span class="frequency">0.0Hz</span>
	{/if}
	<div class="perfect-indicator-wrapper">
		<span class="perfect-indicator" class:active={isCurrentlyTuned}> ✓ Perfect! </span>
	</div>
</div>

<style>
	.note-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: var(--spacing-sm);
		min-height: 90px; /* Changed from fixed height to min-height for flexibility */
		justify-content: center;
	}

	/* Compact mode for very small screens or landscape */
	@media (max-height: 500px), (max-width: 380px) {
		.note-info {
			min-height: 70px;
			margin-bottom: var(--spacing-xs);
		}
	}

	.string-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wide);
		font-weight: var(--font-weight-medium);
	}

	.note-name-wrapper {
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.note-name {
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-tight);
		margin: var(--spacing-xs) 0;
		color: var(--color-success);
		transition: var(--transition-colors);
		text-shadow: var(--glow-primary);
	}

	/* Smaller font size for compact layouts */
	@media (max-height: 500px), (max-width: 380px) {
		.note-name {
			font-size: var(--font-size-2xl);
			margin: var(--spacing-2xs) 0;
		}
	}

	/* Inherit perfect state styling from parent */
	:global(.tuning-meter.perfect) .note-name {
		color: var(--in-tune-color);
		text-shadow: var(--glow-primary);
	}

	.note-name.empty {
		color: var(--color-text-tertiary);
		text-shadow: none;
	}

	.frequency {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
	}

	.perfect-indicator-wrapper {
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.perfect-indicator {
		color: var(--in-tune-color);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		opacity: 0;
		transform: scale(0);
		transition: var(--transition-all);
	}

	.perfect-indicator.active {
		opacity: 1;
		transform: scale(1);
		animation: pulse 1.5s infinite ease-in-out;
	}
</style>
