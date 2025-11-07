<script lang="ts">
	import { preferences } from '$lib/state/preferences.svelte';
</script>

<div class="chord-diagram-toggle">
	<div class="toggle-info">
		<span class="toggle-label">Chord Diagrams</span>
		<span class="toggle-description">Show visual chord diagrams above tabs</span>
	</div>
	<div class="toggle-control">
		<label class="switch">
			<input
				type="checkbox"
				checked={preferences.showChordDiagrams}
				onchange={() => preferences.setShowChordDiagrams(!preferences.showChordDiagrams)}
			/>
			<span class="slider"></span>
		</label>
	</div>
</div>

<style>
	.chord-diagram-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 48px;
	}

	.toggle-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.toggle-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
		letter-spacing: -0.01em;
	}

	.toggle-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
		opacity: 0.9;
	}

	.toggle-control {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 3.5rem;
		height: 2rem;
		cursor: pointer;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		inset: 0;
		background: var(--color-surface-low);
		border: 2px solid var(--color-border);
		transition: var(--transition-all);
		border-radius: var(--radius-full);
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 1.25rem;
		width: 1.25rem;
		left: 0.25rem;
		bottom: 0.25rem;
		background: var(--color-text-secondary);
		transition: var(--transition-all);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
	}

	.switch:hover .slider {
		border-color: var(--color-primary);
	}

	input:checked + .slider {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	input:checked + .slider:before {
		transform: translateX(1.5rem);
		background: white;
		box-shadow: var(--shadow-md);
	}

	input:focus-visible + .slider {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
		box-shadow: 0 0 0 3px var(--color-primary-glow);
	}

	@media (max-width: 600px) {
		.chord-diagram-toggle {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.toggle-control {
			align-self: flex-start;
		}
	}
</style>

