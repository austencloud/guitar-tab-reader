<script lang="ts">
	import type { StringDefinition } from '../../utils/tuner/types';

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
		padding-bottom: 5px;
		justify-content: center;
		gap: 8px;
		margin-top: 20px;
		width: 100%;
	}

	.string-button {
		position: relative;
		flex-shrink: 0;
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.05);
		border: none;
		border-radius: 8px;
		color: #424242;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.string-button:hover {
		background: rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.string-button.active {
		background: rgba(76, 175, 80, 0.15);
		color: #2e7d32;
		box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
	}

	@media (prefers-color-scheme: dark) {
		.string-button {
			background: rgba(255, 255, 255, 0.1);
			color: #e0e0e0;
		}

		.string-button:hover {
			background: rgba(255, 255, 255, 0.15);
		}

		.string-button.active {
			background: rgba(76, 175, 80, 0.3);
			color: #a5d6a7;
		}
	}
</style>
