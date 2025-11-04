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
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		padding-bottom: var(--spacing-xs);
		justify-content: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
		width: 100%;
	}

	.string-button {
		position: relative;
		flex-shrink: 0;
		min-height: var(--touch-target-min);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-surface-high);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
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
