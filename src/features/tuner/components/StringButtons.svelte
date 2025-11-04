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
		flex-wrap: wrap;
		justify-content: center;
		gap: clamp(6px, 2vw, 10px);
		margin-top: clamp(12px, 3vw, 20px);
		width: 100%;
		padding: 0 4px;
	}

	.string-button {
		position: relative;
		flex-shrink: 0;
		/* Ensure minimum touch target size */
		min-width: var(--touch-target-min, 44px);
		min-height: var(--touch-target-min, 44px);
		padding: clamp(10px, 2.5vw, 12px) clamp(14px, 3.5vw, 18px);

		/* Modern 2025 glassmorphism design */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.1),
			rgba(255, 255, 255, 0.05)
		);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);

		border: 1.5px solid rgba(255, 255, 255, 0.15);
		border-radius: clamp(10px, 2.5vw, 12px);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			inset 0 1px 1px rgba(255, 255, 255, 0.2);

		color: var(--color-text-primary, #2c2c2c);
		font-weight: 700;
		font-size: clamp(1rem, 3vw, 1.125rem);
		letter-spacing: 0.5px;

		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		/* Prevent text selection */
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.string-button:hover {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.08)
		);
		border-color: rgba(76, 175, 80, 0.3);
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.15),
			0 0 20px rgba(76, 175, 80, 0.1),
			inset 0 1px 2px rgba(255, 255, 255, 0.3);
	}

	.string-button:active {
		transform: translateY(0) scale(0.98);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.string-button.active {
		background: linear-gradient(
			135deg,
			rgba(76, 175, 80, 0.25),
			rgba(76, 175, 80, 0.15)
		);
		border-color: rgba(76, 175, 80, 0.6);
		color: var(--in-tune-color, #2e7d32);
		box-shadow:
			0 4px 16px rgba(76, 175, 80, 0.3),
			0 0 24px rgba(76, 175, 80, 0.15),
			inset 0 1px 2px rgba(255, 255, 255, 0.3);
		animation: activePulse 2s ease-in-out infinite;
	}

	.string-button:focus-visible {
		outline: 2px solid var(--color-primary, #4ade80);
		outline-offset: 2px;
	}

	@keyframes activePulse {
		0%, 100% {
			box-shadow:
				0 4px 16px rgba(76, 175, 80, 0.3),
				0 0 24px rgba(76, 175, 80, 0.15),
				inset 0 1px 2px rgba(255, 255, 255, 0.3);
		}
		50% {
			box-shadow:
				0 4px 20px rgba(76, 175, 80, 0.4),
				0 0 32px rgba(76, 175, 80, 0.25),
				inset 0 1px 2px rgba(255, 255, 255, 0.4);
		}
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.string-button {
			background: linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.08),
				rgba(255, 255, 255, 0.03)
			);
			border-color: rgba(255, 255, 255, 0.1);
			color: var(--color-text-primary, #e0e0e0);
			box-shadow:
				0 4px 12px rgba(0, 0, 0, 0.3),
				inset 0 1px 1px rgba(255, 255, 255, 0.1);
		}

		.string-button:hover {
			background: linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.12),
				rgba(255, 255, 255, 0.06)
			);
			border-color: rgba(76, 175, 80, 0.4);
		}

		.string-button.active {
			background: linear-gradient(
				135deg,
				rgba(76, 175, 80, 0.3),
				rgba(76, 175, 80, 0.2)
			);
			border-color: rgba(76, 175, 80, 0.7);
			color: var(--in-tune-color, #a5d6a7);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.string-buttons {
			gap: 8px;
			margin-top: 12px;
		}

		.string-button {
			font-size: 1rem;
			padding: 12px 16px;
		}
	}

	/* Extra small devices */
	@media (max-width: 360px) {
		.string-buttons {
			gap: 6px;
		}

		.string-button {
			min-width: 44px;
			min-height: 44px;
			padding: 10px 12px;
			font-size: 0.938rem;
		}
	}
</style>
