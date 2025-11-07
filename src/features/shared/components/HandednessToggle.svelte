<script lang="ts">
	import { preferences } from '$lib/state/preferences.svelte';
</script>

<div class="handedness-toggle">
	<label>
		<input
			type="checkbox"
			checked={preferences.isLeftHanded}
			onchange={(e) => preferences.setLeftHanded(e.currentTarget.checked)}
		/>
		<span>{preferences.isLeftHanded ? 'Left-handed' : 'Right-handed'}</span>
	</label>
</div>

<style>
	.handedness-toggle {
		padding: var(--spacing-sm);
		font-size: var(--font-size-sm);
		display: inline-flex;
	}

	label {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
		min-height: var(--touch-target-min);
		transition: var(--transition-all);
	}

	label:hover {
		color: var(--color-primary);
	}

	label:focus-within {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
		border-radius: var(--radius-lg);
	}

	input {
		cursor: pointer;
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary);
	}

	input:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	span {
		user-select: none;
		color: var(--color-text-secondary);
		transition: var(--transition-all);
	}

	label:hover span {
		color: var(--color-primary);
	}
</style>
