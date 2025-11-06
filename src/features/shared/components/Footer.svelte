<script lang="ts">
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	const version = '1.0.0';
	let showShortcuts = $state(false);

	// Try to get tuner context if available
	let tunerContext: any = null;
	try {
		tunerContext = getContext('tuner');
	} catch {
		// Context not available
	}

	function toggleShortcuts() {
		showShortcuts = !showShortcuts;
	}

	function handleQuickTuner() {
		if (tunerContext?.toggle) {
			tunerContext.toggle();
		}
	}

	// Define keyboard shortcuts for display
	const shortcuts = [
		{ key: 'Space', action: 'Play/Pause auto-scroll' },
		{ key: '↑/↓', action: 'Adjust scroll speed' },
		{ key: 'T', action: 'Open tuner' },
		{ key: 'Esc', action: 'Close modals' }
	];
</script>

<footer class="footer-panel">
	<div class="footer-content">
		<!-- App info -->
		<div class="footer-section app-info">
			<span class="app-name">TabScroll</span>
			<span class="version">v{version}</span>
		</div>

		<!-- Quick actions -->
		<div class="footer-section actions">
			<button class="quick-action" onclick={handleQuickTuner} aria-label="Quick tuner access">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
					<path
						fill="currentColor"
						d="M12 3a9 9 0 0 0-9 9h3c0-3.31 2.69-6 6-6s6 2.69 6 6h3a9 9 0 0 0-9-9zm3.14 12a3.01 3.01 0 0 1-2.14.9 3 3 0 0 1-3-3 2.97 2.97 0 0 1 .9-2.14L12 8.07l1.14 2.69c.58.59.9 1.35.9 2.14a2.99 2.99 0 0 1-.9 2.1z"
					/>
				</svg>
				<span class="action-label">Tuner</span>
			</button>

			<button
				class="quick-action shortcuts-btn"
				onclick={toggleShortcuts}
				aria-label="Keyboard shortcuts"
				aria-expanded={showShortcuts}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
					<path
						fill="currentColor"
						d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"
					/>
				</svg>
				<span class="action-label">Shortcuts</span>
			</button>

			<a href="/" class="quick-action" aria-label="Back to tabs">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
					<path
						fill="currentColor"
						d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
					/>
				</svg>
				<span class="action-label">My Tabs</span>
			</a>
		</div>

		<!-- Made with love -->
		<div class="footer-section credits">
			<span class="credit-text">Made for musicians</span>
		</div>
	</div>

	<!-- Keyboard shortcuts popup -->
	{#if showShortcuts}
		<div class="shortcuts-panel" transition:fade={{ duration: 150 }}>
			<div class="shortcuts-header">
				<h3>Keyboard Shortcuts</h3>
				<button class="close-btn" onclick={toggleShortcuts} aria-label="Close shortcuts">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
						<path
							fill="currentColor"
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
						/>
					</svg>
				</button>
			</div>
			<div class="shortcuts-list">
				{#each shortcuts as shortcut}
					<div class="shortcut-item">
						<kbd class="shortcut-key">{shortcut.key}</kbd>
						<span class="shortcut-action">{shortcut.action}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</footer>

<style>
	.footer-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-surface-high);
		border-top: 1px solid var(--color-border);
		box-shadow: var(--shadow-lg);
		z-index: 100;
		transition: var(--transition-all);
	}

	.footer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--spacing-sm) var(--spacing-md);
		gap: var(--spacing-md);
	}

	.footer-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	/* App info */
	.app-info {
		min-width: 120px;
	}

	.app-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.version {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		background: var(--color-surface-low);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full);
	}

	/* Quick actions */
	.actions {
		flex: 1;
		justify-content: center;
		gap: var(--spacing-xs);
	}

	.quick-action {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
		text-decoration: none;
		white-space: nowrap;
		min-height: var(--touch-target-min);
	}

	.quick-action:hover {
		background: var(--color-hover);
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: translateY(-1px);
		box-shadow: var(--glow-primary);
	}

	.quick-action:active {
		transform: translateY(0);
	}

	.quick-action:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.quick-action svg {
		flex-shrink: 0;
	}

	/* Credits */
	.credits {
		min-width: 120px;
		justify-content: flex-end;
	}

	.credit-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
	}

	/* Shortcuts panel */
	.shortcuts-panel {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-surface-high);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-2xl);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		min-width: 300px;
		max-width: 90vw;
		backdrop-filter: var(--blur-md);
	}

	.shortcuts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.shortcuts-header h3 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.close-btn {
		background: none;
		border: none;
		padding: var(--spacing-xs);
		cursor: pointer;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
		min-width: var(--touch-target-min);
	}

	.close-btn:hover {
		background: var(--color-hover);
		color: var(--color-text-primary);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.shortcut-key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-family: monospace;
		box-shadow: var(--shadow-sm);
	}

	.shortcut-action {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.footer-content {
			padding: var(--spacing-xs) var(--spacing-sm);
			gap: var(--spacing-sm);
		}

		.action-label {
			display: none;
		}

		.quick-action {
			padding: var(--spacing-sm);
			min-width: var(--touch-target-min);
			justify-content: center;
		}

		.app-info,
		.credits {
			min-width: auto;
		}

		.credit-text {
			display: none;
		}

		.shortcuts-panel {
			left: var(--spacing-sm);
			right: var(--spacing-sm);
			transform: none;
			min-width: auto;
		}
	}

	@media (max-width: 480px) {
		.app-name {
			display: none;
		}

		.actions {
			gap: var(--spacing-xs);
		}

		.quick-action {
			padding: var(--spacing-xs);
		}

		.quick-action svg {
			width: 14px;
			height: 14px;
		}
	}
</style>
