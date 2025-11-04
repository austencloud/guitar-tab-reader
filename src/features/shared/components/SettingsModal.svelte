<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import preferences from '$lib/stores/preferences';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/theme';
	import { TuningSelector } from '$features/tabs/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = false, onclose }: Props = $props();

	let modalElement = $state<HTMLDivElement>();

	// Font size settings
	const MIN_FONT_SIZE = 10;
	const MAX_FONT_SIZE = 22;
	const FONT_SIZE_STEP = 1;

	function increaseFontSize() {
		if ($preferences.fontSize < MAX_FONT_SIZE) {
			preferences.setFontSize($preferences.fontSize + FONT_SIZE_STEP);
		}
	}

	function decreaseFontSize() {
		if ($preferences.fontSize > MIN_FONT_SIZE) {
			preferences.setFontSize($preferences.fontSize - FONT_SIZE_STEP);
		}
	}

	function handleFontSizeChange(event: Event) {
		const input = event.target as HTMLInputElement;
		preferences.setFontSize(parseInt(input.value));
	}

	function close() {
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	function handleOutsideClick(event: MouseEvent) {
		if (modalElement && !modalElement.contains(event.target as Node)) {
			close();
		}
	}

	onMount(() => {
		if (open && browser) {
			document.body.classList.add('overflow-hidden');
		}
		return () => {
			if (browser) document.body.classList.remove('overflow-hidden');
		};
	});

	$effect(() => {
		if (open && browser) {
			document.body.classList.add('overflow-hidden');
		} else if (!open && browser) {
			document.body.classList.remove('overflow-hidden');
		}
	});

	function handleBackdropKeydown(event: KeyboardEvent) {
		// Close modal if Enter or Space is pressed directly on the backdrop
		if (event.key === 'Enter' || event.key === ' ') {
			if (event.target === event.currentTarget) {
				event.preventDefault();
				close();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleOutsideClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="0"
		aria-label="Close settings"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="modal"
			bind:this={modalElement}
			transition:fly={{ y: -20, duration: 300, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
		>
			<div class="modal-header">
				<h2 id="settings-title">Settings</h2>
				<button class="close-btn" onclick={close} aria-label="Close settings"> × </button>
			</div>

			<div class="modal-body">
				<!-- Theme Section -->
				<div class="setting-section">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Theme</span>
							<span class="setting-description">Choose your preferred color scheme</span>
						</div>
						<div class="theme-options">
							<button
								class="theme-option-btn"
								class:active={$theme.mode === 'light'}
								onclick={() => theme.setMode('light')}
								aria-label="Light theme"
								title="Light theme"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
									<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
									<path
										d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
										stroke="currentColor"
										stroke-width="2"
									/>
								</svg>
							</button>
							<button
								class="theme-option-btn"
								class:active={$theme.mode === 'dark'}
								onclick={() => theme.setMode('dark')}
								aria-label="Dark theme"
								title="Dark theme"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
									<path
										d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
										stroke="currentColor"
										stroke-width="2"
									/>
								</svg>
							</button>
							<button
								class="theme-option-btn"
								class:active={$theme.mode === 'system'}
								onclick={() => theme.setMode('system')}
								aria-label="System theme"
								title="Follow system preference"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
									<rect
										x="2"
										y="3"
										width="20"
										height="14"
										rx="2"
										ry="2"
										stroke="currentColor"
										stroke-width="2"
									/>
									<line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" />
									<line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				<!-- Font Size Section -->
				<div class="setting-section">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Font Size</span>
							<span class="setting-description">Adjust the size of the tab text</span>
						</div>
						<div class="font-size-control">
							<button
								class="control-btn"
								onclick={decreaseFontSize}
								disabled={$preferences.fontSize <= MIN_FONT_SIZE}
								aria-label="Decrease font size"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
									<path d="M19 13H5v-2h14v2z" />
								</svg>
							</button>
							<input
								type="range"
								class="font-slider"
								min={MIN_FONT_SIZE}
								max={MAX_FONT_SIZE}
								step={FONT_SIZE_STEP}
								value={$preferences.fontSize}
								oninput={handleFontSizeChange}
								aria-label="Font size"
							/>
							<button
								class="control-btn"
								onclick={increaseFontSize}
								disabled={$preferences.fontSize >= MAX_FONT_SIZE}
								aria-label="Increase font size"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
									<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
								</svg>
							</button>
						</div>
					</div>
					<div class="font-size-info">
						<div class="font-size-value">{$preferences.fontSize}px</div>
						<div class="font-size-preview" style="font-size: {$preferences.fontSize}px">
							{`e|--3--2--0--|
B|--0--3--1--|
G|--0--2--0--|
D|--0--0--2--|
A|--2--x--3--|
E|--3--x--x--|`}
						</div>
					</div>
				</div>

				<!-- Settings Section -->
				<div class="setting-section">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Handedness</span>
							<span class="setting-description">Choose your dominant hand for chord diagrams</span>
						</div>
						<div class="hand-toggle">
							<button
								class="hand-btn left-hand"
								class:active={$preferences.isLeftHanded}
								onclick={() => preferences.setLeftHanded(true)}
								aria-label="Left-handed"
								aria-pressed={$preferences.isLeftHanded}
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
								class:active={!$preferences.isLeftHanded}
								onclick={() => preferences.setLeftHanded(false)}
								aria-label="Right-handed"
								aria-pressed={!$preferences.isLeftHanded}
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

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Chord Diagrams</span>
							<span class="setting-description">Show visual chord diagrams above tabs</span>
						</div>
						<div class="toggle-control">
							<label class="switch">
								<input
									type="checkbox"
									checked={$preferences.showChordDiagrams}
									onchange={() => preferences.setShowChordDiagrams(!$preferences.showChordDiagrams)}
								/>
								<span class="slider"></span>
							</label>
						</div>
					</div>

					<div class="setting-row">
						<TuningSelector />
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--blur-md);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: var(--z-modal);
		padding: var(--spacing-md);
	}

	.modal {
		background: var(--color-surface-high);
		backdrop-filter: var(--blur-md);
		-webkit-backdrop-filter: var(--blur-md);
		border-radius: var(--radius-2xl);
		box-shadow: var(--shadow-2xl);
		border: 1px solid var(--color-border);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		padding: 0;
		transition: var(--transition-colors);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		transition: var(--transition-colors);
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: var(--font-size-xl);
		color: var(--color-text-secondary);
		cursor: pointer;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
	}

	.close-btn:hover {
		background-color: var(--color-hover);
		color: var(--color-text-primary);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.modal-body {
		padding: var(--spacing-xl);
	}

	/* Setting Section Structure */
	.setting-section {
		margin-bottom: var(--spacing-2xl);
	}

	.setting-section:last-child {
		margin-bottom: 0;
	}

	.setting-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 40px;
	}

	.setting-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.setting-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
	}

	.setting-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-normal);
	}

	/* Theme Options */
	.theme-options {
		display: flex;
		gap: var(--spacing-xs);
		flex-shrink: 0;
	}

	.theme-option-btn {
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		background-color: var(--color-surface-low);
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.theme-option-btn.active {
		border-color: var(--color-primary);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		transform: scale(1.05);
		box-shadow: var(--glow-primary);
	}

	.theme-option-btn:hover:not(.active) {
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: scale(1.02);
		background-color: var(--color-hover);
	}

	.theme-option-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.theme-option-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Font size control styles */
	.font-size-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.control-btn {
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border-radius: var(--radius-full);
		border: none;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: var(--transition-all);
		flex-shrink: 0;
	}

	.control-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: var(--glow-primary);
	}

	.control-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.control-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.control-btn:disabled {
		background: var(--color-disabled);
		cursor: not-allowed;
		transform: none;
		opacity: 0.5;
	}

	.control-btn svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
	}

	.font-slider {
		flex: 1;
		min-width: 120px;
	}

	.font-size-info {
		margin-top: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.font-size-value {
		text-align: center;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.font-size-preview {
		font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
		white-space: pre-line;
		background-color: var(--color-surface-variant);
		color: var(--color-text-primary);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		overflow-x: auto;
		border: 1px solid var(--color-border);
		transition: var(--transition-colors);
		margin-top: var(--spacing-sm);
		text-align: left;
		line-height: 1.2;
	}

	/* Hand Toggle */
	.hand-toggle {
		display: flex;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.hand-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		background-color: var(--color-surface-low);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-all);
		min-width: 80px;
	}

	.left-hand {
		border-color: var(--color-info);
	}

	.right-hand {
		border-color: var(--color-error);
	}

	.left-hand.active {
		background: linear-gradient(135deg, var(--color-info), var(--color-info));
		color: var(--color-text-inverse);
		border-color: var(--color-info);
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	.right-hand.active {
		background: linear-gradient(135deg, var(--color-error), var(--color-error));
		color: var(--color-text-inverse);
		border-color: var(--color-error);
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	.hand-btn:not(.active):hover {
		background-color: var(--color-hover);
		transform: translateY(-1px);
	}

	.hand-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.hand-btn span {
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-sm);
	}

	.hand-btn svg {
		width: 24px;
		height: 24px;
		transition: var(--transition-transform);
	}

	/* Toggle switch styles */
	.toggle-control {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 52px;
		height: 28px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border-dark);
		transition: var(--transition-all);
		border-radius: 28px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 22px;
		width: 22px;
		left: 3px;
		bottom: 3px;
		background-color: var(--color-surface);
		transition: var(--transition-all);
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
	}

	input:checked + .slider {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
	}

	input:focus-visible + .slider {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

	/* Responsive Design */
	@media (max-width: 600px) {
		.modal {
			margin: var(--spacing-md);
			max-width: calc(100vw - 2rem);
		}

		.modal-body {
			padding: var(--spacing-lg);
		}

		.setting-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.setting-info {
			margin-bottom: var(--spacing-xs);
		}

		.theme-options,
		.hand-toggle,
		.toggle-control {
			align-self: flex-start;
		}
	}
</style>
