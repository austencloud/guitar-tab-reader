<script lang="ts">
	import { theme } from '$lib/stores/theme';

	// Subscribe to theme store for reactivity
	let themeState = $state({ mode: 'system', resolvedTheme: 'light' });

	// Update local state when theme store changes
	theme.subscribe((state) => {
		themeState = state;
	});

	function handleToggle() {
		theme.toggle();
	}
</script>

<button
	class="theme-toggle-button"
	onclick={handleToggle}
	aria-label="Toggle theme"
	title="Toggle between light and dark theme"
>
	{#if themeState.resolvedTheme === 'dark'}
		<!-- Sun icon for dark mode (clicking will go to light) -->
		<svg class="theme-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
				stroke="currentColor"
				stroke-width="2"
			/>
		</svg>
	{:else}
		<!-- Moon icon for light mode (clicking will go to dark) -->
		<svg class="theme-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
				stroke="currentColor"
				stroke-width="2"
			/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: var(--transition-colors);
	}

	.theme-toggle-button:hover {
		background-color: var(--color-hover);
		border-color: var(--color-border-dark);
	}

	.theme-toggle-button:focus {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.theme-icon {
		width: 1.25rem;
		height: 1.25rem;
	}
</style>
