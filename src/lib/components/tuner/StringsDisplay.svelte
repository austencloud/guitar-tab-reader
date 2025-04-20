<script lang="ts">
	import type { StringDefinition } from '../../utils/tuner/types';

	export let activeStrings: StringDefinition[] = [];
	export let closestString: StringDefinition | null = null;
	export let detectedCents: number = 0;

	// Sort strings to display in standard order (low E to high e)
	$: sortedStrings = [...activeStrings].sort((a, b) => {
		// Standard 6-string guitar strings are typically numbered 1 (high E) to 6 (low E)
		// We want to display them in reverse order (6 to 1) to show low E on left
		return b.string - a.string;
	});

	// Function to get the display note (e.g., 'e' for high E)
	function getDisplayNote(stringDef: StringDefinition): string {
		// Assuming string 1 is the high E string
		if (stringDef.string === 1 && stringDef.note === 'E') {
			return 'e';
		}
		return stringDef.note;
	}
</script>

<div class="strings-display">
	{#each sortedStrings as string}
		<div
			class="string-indicator"
			class:active={closestString && closestString.string === string.string}
			class:in-tune={closestString &&
				closestString.string === string.string &&
				Math.abs(detectedCents) < 5}
			class:flat={closestString && closestString.string === string.string && detectedCents < -5}
			class:sharp={closestString && closestString.string === string.string && detectedCents > 5}
		>
			{getDisplayNote(string)}
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
		padding: 0.5rem;
		border-radius: 4px;
		font-weight: bold;
		border: 2px solid #ddd;
		background-color: #eee;
		width: 40px;
		text-align: center;
		transition: all 0.2s;
	}

	.string-indicator.active {
		border-color: #333;
		background-color: #f9f9f9;
	}

	.string-indicator.in-tune {
		border-color: #4caf50;
		background-color: rgba(76, 175, 80, 0.1);
	}

	.string-indicator.flat {
		border-color: #2196f3;
		background-color: rgba(33, 150, 243, 0.1);
	}

	.string-indicator.sharp {
		border-color: #f44336;
		background-color: rgba(244, 67, 54, 0.1);
	}

	@media (prefers-color-scheme: dark) {
		.string-indicator {
			border-color: #444;
			background-color: #333;
		}

		.string-indicator.active {
			border-color: #ccc;
			background-color: #2d2d2d;
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
