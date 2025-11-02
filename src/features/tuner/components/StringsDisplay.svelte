<script lang="ts">
	import type { StringDefinition } from '../services/types';

	interface Props {
		activeStrings?: StringDefinition[];
		closestString?: StringDefinition | null;
		detectedCents?: number;
	}

	let { activeStrings = [], closestString = null, detectedCents = 0 }: Props = $props();

	// Sort strings to display in standard order (low E to high e)
	const sortedStrings = $derived(
		[...activeStrings].sort((a, b) => {
			// Standard 6-string guitar strings are typically numbered 1 (high E) to 6 (low E)
			// We want to display them in reverse order (6 to 1) to show low E on left
			return b.string - a.string;
		})
	);

	// Function to get the display note (e.g., 'e' for high E)
	function getDisplayNote(stringDef: StringDefinition): string {
		// Assuming string 1 is the high E string
		if (stringDef.string === 1 && stringDef.note === 'E') {
			return 'e';
		}
		return stringDef.note;
	}
</script>

<div class="strings-display" role="group" aria-label="Guitar strings tuning status">
	{#each sortedStrings as string}
		{@const isActive = closestString && closestString.string === string.string}
		{@const isInTune = isActive && Math.abs(detectedCents) < 5}
		{@const isFlat = isActive && detectedCents < -5}
		{@const isSharp = isActive && detectedCents > 5}
		{@const tuningStatus = isInTune
			? 'in tune'
			: isFlat
				? 'flat'
				: isSharp
					? 'sharp'
					: 'not detected'}

		<div
			class="string-indicator"
			class:active={isActive}
			class:in-tune={isInTune}
			class:flat={isFlat}
			class:sharp={isSharp}
			role="status"
			aria-label="String {string.string} ({getDisplayNote(string)}): {tuningStatus}"
			aria-live="polite"
		>
			<span aria-hidden="true">{getDisplayNote(string)}</span>
		</div>
	{/each}
</div>

<style>
	.strings-display {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: 1rem;
	}

	.string-indicator {
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-bold);
		border: 2px solid var(--color-border);
		background-color: var(--color-surface-variant);
		color: var(--color-text-primary);
		width: 40px;
		text-align: center;
		transition: var(--transition-all);
		cursor: default;
		user-select: none;
	}

	.string-indicator.active {
		border-color: var(--color-text-primary);
		background-color: var(--color-surface-elevated);
		transform: scale(1.05);
		box-shadow: var(--shadow-md);
	}

	.string-indicator.in-tune {
		border-color: var(--color-success);
		background-color: color-mix(in srgb, var(--color-success) 10%, transparent);
		color: var(--color-success);
		animation: pulse-success 1.5s infinite ease-in-out;
	}

	.string-indicator.flat {
		border-color: var(--color-info);
		background-color: color-mix(in srgb, var(--color-info) 10%, transparent);
		color: var(--color-info);
	}

	.string-indicator.sharp {
		border-color: var(--color-error);
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
	}

	@keyframes pulse-success {
		0%,
		100% {
			transform: scale(1.05);
			box-shadow: var(--shadow-md);
		}
		50% {
			transform: scale(1.1);
			box-shadow: var(--shadow-lg);
		}
	}

	@media (max-width: 500px) {
		.strings-display {
			/* Remove flex-wrap to keep it single line */
			/* flex-wrap: wrap; */
			gap: 0.5rem;
			justify-content: center;
			/* Allow horizontal scrolling if needed on small screens */
			overflow-x: auto;
			padding-bottom: 5px; /* Add padding for scrollbar */
		}

		.string-indicator {
			width: 35px;
			padding: 0.4rem;
			font-size: 0.9rem;
		}
	}
</style>
