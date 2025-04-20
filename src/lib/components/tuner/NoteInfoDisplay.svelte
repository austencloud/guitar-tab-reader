<script lang="ts">
	import type { StringDefinition } from '../../utils/tuner/types';

	export let closestString: StringDefinition | null = null;
	export let statusMessage: string = '';
	export let isCurrentlyTuned: boolean = false;
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
		margin-bottom: 1.5rem;
		height: 160px; /* Fixed height to prevent layout shifts */
		justify-content: center;
	}

	.string-label {
		font-size: 0.875rem;
		color: #78909c;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 500;
	}

	.note-name-wrapper {
		height: 4.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.note-name {
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		margin: 0.5rem 0;
		color: #4caf50; /* Use solid color */
		transition: color 0.2s ease; /* Add transition */
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
	}

	/* Inherit perfect state styling from parent */
	:global(.tuning-meter.perfect) .note-name {
		color: var(--in-tune-color); /* Ensure it stays green */
		text-shadow: 0 2px 15px rgba(76, 175, 80, 0.4); /* Slightly stronger shadow */
	}

	.note-name.empty {
		color: #9e9e9e;
		text-shadow: none;
	}

	.frequency {
		font-size: 1rem;
		color: #607d8b;
		margin-bottom: 0.5rem;
	}

	.perfect-indicator-wrapper {
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.perfect-indicator {
		color: var(--in-tune-color);
		font-weight: 600;
		font-size: 0.9rem;
		opacity: 0;
		transform: scale(0);
		transition: all 0.3s ease;
	}

	.perfect-indicator.active {
		opacity: 1;
		transform: scale(1);
		animation: pulse 1.5s infinite ease-in-out; /* Smoother pulse */
	}

	@media (prefers-color-scheme: dark) {
		.string-label {
			color: #b0bec5;
		}

		.note-name {
			color: #66bb6a;
		}

		.frequency {
			color: #90a4ae;
		}
	}
</style>
