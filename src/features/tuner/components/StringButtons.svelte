<script lang="ts">
	import type { StringDefinition } from '../services/types';

	interface Props {
		strings?: StringDefinition[];
		closestString?: StringDefinition | null;
		onplayNote?: (string: StringDefinition) => void;
	}

	let { strings = [], closestString = null, onplayNote }: Props = $props();

	function getDisplayNote(stringDef: StringDefinition): string {
		if (stringDef.string === 1 && stringDef.note === 'E') {
			return 'e';
		}
		return stringDef.note;
	}

	function handleClick(string: StringDefinition) {
		onplayNote?.(string);
	}
</script>

<div class="string-buttons">
	{#each strings as string (string.string)}
		<button
			class="string-button"
			class:active={closestString?.string === string.string}
			onclick={() => handleClick(string)}
		>
			{getDisplayNote(string)}
		</button>
	{/each}
</div>

<style>
	.string-buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-xs);
		margin-top: var(--spacing-md);
		width: 100%;
		max-width: 280px;
	}

	.string-button {
		position: relative;
		min-height: var(--touch-target-min);
		padding: var(--spacing-sm);
		background: var(--color-surface-high);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		letter-spacing: var(--letter-spacing-tight);
		cursor: pointer;
		transition: var(--transition-all);
		user-select: none;
	}

	.string-button:hover {
		background: var(--color-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.string-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.string-button.active {
		background: var(--color-success-bg);
		color: var(--color-success);
		border-color: var(--color-success);
		box-shadow: var(--glow-primary);
	}
</style>
