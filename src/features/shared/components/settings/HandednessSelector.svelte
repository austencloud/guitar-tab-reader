<script lang="ts">
	import { preferences } from '$lib/state/preferences.svelte';
</script>

<div class="handedness-selector">
	<div class="selector-info">
		<span class="selector-label">Handedness</span>
		<span class="selector-description">Choose your dominant hand for chord diagrams</span>
	</div>
	<div class="selector-buttons">
		<button
			class="hand-btn left-hand"
			class:active={preferences.isLeftHanded}
			onclick={() => preferences.setLeftHanded(true)}
			aria-label="Left-handed"
			aria-pressed={preferences.isLeftHanded}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
				<path
					fill="currentColor"
					d="M13 24c-3.26 0-6.19-1.99-7.4-5.02l-3.03-7.61a2 2 0 0 1 2.56-2.56l.17.07a.8.8 0 0 0 .72-.07l1.88-1.17a2 2 0 0 1 2.74.65l.62 1.03c.29.48.87.7 1.4.56l.68-.19a2 2 0 0 1 2.16.8l.69 1.04c.31.47.84.75 1.4.75h1.21a2 2 0 0 1 2 2v6c0 1.85-1.28 3.4-3 3.81V24H13zm-1-5c0 .55.45 1 1 1s1-.45 1-1v-5a1 1 0 1 0-2 0v5zm-3-2c0 .55.45 1 1 1s1-.45 1-1v-5a1 1 0 1 0-2 0v5zm-3-1c0 .55.45 1 1 1s1-.45 1-1v-5a1 1 0 1 0-2 0v5zm-3-2c0 .55.45 1 1 1s1-.45 1-1v-4a1 1 0 1 0-2 0v4z"
				/>
			</svg>
			<span>Left</span>
		</button>
		<button
			class="hand-btn right-hand"
			class:active={!preferences.isLeftHanded}
			onclick={() => preferences.setLeftHanded(false)}
			aria-label="Right-handed"
			aria-pressed={!preferences.isLeftHanded}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
				<path
					fill="currentColor"
					d="M11 24c3.26 0 6.19-1.99 7.4-5.02l3.03-7.61a2 2 0 0 0-2.56-2.56l-.17.07a.8.8 0 0 1-.72-.07l-1.88-1.17a2 2 0 0 0-2.74.65l-.62 1.03c-.29.48-.87.7-1.4.56l-.68-.19a2 2 0 0 0-2.16.8l-.69 1.04c-.31.47-.84.75-1.4.75H5.2a2 2 0 0 0-2 2v6c0 1.85 1.28 3.4 3 3.81V24h4.8zm1-5c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-2c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-1c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-2c0 .55-.45 1-1 1s-1-.45-1-1v-4a1 1 0 1 1 2 0v4z"
				/>
			</svg>
			<span>Right</span>
		</button>
	</div>
</div>

<style>
	.handedness-selector {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 48px;
	}

	.selector-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.selector-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
		letter-spacing: -0.01em;
	}

	.selector-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
		opacity: 0.9;
	}

	.selector-buttons {
		display: flex;
		gap: var(--spacing-md);
		flex-shrink: 0;
	}

	.hand-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-all);
		min-width: 90px;
		position: relative;
		overflow: hidden;
	}

	.hand-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-primary);
		opacity: 0;
		transition: opacity 0.3s;
	}

	.hand-btn svg {
		width: 24px;
		height: 24px;
		transition: var(--transition-all);
		position: relative;
		z-index: 1;
	}

	.hand-btn span {
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-sm);
		position: relative;
		z-index: 1;
	}

	.hand-btn:not(.active):hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.hand-btn:not(.active):hover::before {
		opacity: 0.05;
	}

	.hand-btn.active {
		background: var(--color-primary);
		color: var(--color-text-inverse);
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.hand-btn.active::before {
		opacity: 1;
	}

	.hand-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	@media (max-width: 600px) {
		.handedness-selector {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.selector-buttons {
			align-self: flex-start;
		}
	}
</style>

