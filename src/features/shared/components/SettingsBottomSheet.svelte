<script lang="ts">
	import BottomSheet from './BottomSheet.svelte';
	import preferences from '$lib/stores/preferences';
	import { theme } from '$lib/stores/theme';
	import { TuningSelector } from '$features/tabs/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

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

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onclose?.();
		}
	}
</script>

<BottomSheet bind:open onOpenChange={handleOpenChange} title="Settings">
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
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
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
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
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
</BottomSheet>

<style>
	/* Setting Section Structure */
	.setting-section {
		margin-bottom: var(--spacing-2xl, 2rem);
	}

	.setting-section:last-child {
		margin-bottom: 0;
	}

	.setting-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-lg, 1.25rem);
		min-height: 40px;
		margin-bottom: var(--spacing-lg, 1.25rem);
	}

	.setting-row:last-child {
		margin-bottom: 0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs, 0.25rem);
		flex: 1;
	}

	.setting-label {
		font-size: var(--font-size-base, 1rem);
		font-weight: var(--font-weight-medium, 500);
		color: var(--color-text-primary, #0a0a0a);
	}

	.setting-description {
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-text-secondary, #737373);
		line-height: 1.4;
	}

	/* Theme Options */
	.theme-options {
		display: flex;
		gap: var(--spacing-sm, 0.5rem);
		flex-shrink: 0;
	}

	.theme-option-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 2px solid var(--color-border, #e5e5e5);
		background-color: var(--color-surface, #ffffff);
		color: var(--color-text-secondary, #737373);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: var(--transition-all, all 150ms ease);
		padding: 0;
	}

	.theme-option-btn svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
	}

	.theme-option-btn:hover {
		border-color: var(--color-primary, #4ade80);
		background-color: var(--color-hover, #f5f5f5);
		transform: translateY(-1px);
	}

	.theme-option-btn.active {
		border-color: var(--color-primary, #4ade80);
		background-color: var(--color-primary-dim, rgba(74, 222, 128, 0.1));
		color: var(--color-primary, #4ade80);
	}

	/* Font Size Control */
	.font-size-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm, 0.5rem);
		flex-shrink: 0;
	}

	.control-btn {
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full, 9999px);
		border: none;
		background-color: var(--color-primary, #4ade80);
		color: var(--color-text-inverse, #ffffff);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: var(--transition-all, all 150ms ease);
		flex-shrink: 0;
	}

	.control-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.control-btn:hover:not(:disabled) {
		background-color: var(--color-primary-hover, #22c55e);
		transform: translateY(-1px);
	}

	.control-btn:active:not(:disabled) {
		background-color: var(--color-primary-active, #16a34a);
	}

	.control-btn:disabled {
		background-color: var(--color-disabled, #d4d4d4);
		cursor: not-allowed;
		transform: none;
		opacity: 0.5;
	}

	.font-slider {
		width: 120px;
		height: 4px;
		border-radius: var(--radius-full, 9999px);
		background: var(--color-border, #e5e5e5);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.font-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1rem;
		height: 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--color-primary, #4ade80);
		cursor: pointer;
		transition: var(--transition-all, all 150ms ease);
	}

	.font-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.font-slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--color-primary, #4ade80);
		cursor: pointer;
		border: none;
		transition: var(--transition-all, all 150ms ease);
	}

	.font-slider::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	.font-size-info {
		margin-top: var(--spacing-md, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm, 0.5rem);
	}

	.font-size-value {
		font-size: var(--font-size-sm, 0.875rem);
		font-weight: var(--font-weight-medium, 500);
		color: var(--color-primary, #4ade80);
		text-align: center;
	}

	.font-size-preview {
		font-family: 'Courier New', monospace;
		background-color: var(--color-surface-low, #f5f5f5);
		border: 1px solid var(--color-border, #e5e5e5);
		border-radius: var(--radius-md, 0.5rem);
		padding: var(--spacing-md, 1rem);
		white-space: pre;
		overflow-x: auto;
		color: var(--color-text-primary, #0a0a0a);
	}

	/* Hand Toggle */
	.hand-toggle {
		display: flex;
		gap: var(--spacing-sm, 0.5rem);
		flex-shrink: 0;
	}

	.hand-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs, 0.25rem);
		padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
		border-radius: var(--radius-md, 0.5rem);
		border: 2px solid var(--color-border, #e5e5e5);
		background-color: var(--color-surface, #ffffff);
		color: var(--color-text-secondary, #737373);
		cursor: pointer;
		transition: var(--transition-all, all 150ms ease);
		font-size: var(--font-size-sm, 0.875rem);
		font-weight: var(--font-weight-medium, 500);
	}

	.hand-btn:hover {
		border-color: var(--color-primary, #4ade80);
		background-color: var(--color-hover, #f5f5f5);
		transform: translateY(-1px);
	}

	.hand-btn.active {
		border-color: var(--color-primary, #4ade80);
		background-color: var(--color-primary-dim, rgba(74, 222, 128, 0.1));
		color: var(--color-primary, #4ade80);
	}

	/* Toggle Switch */
	.toggle-control {
		flex-shrink: 0;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 3rem;
		height: 1.75rem;
		cursor: pointer;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		inset: 0;
		background-color: var(--color-border, #e5e5e5);
		border-radius: var(--radius-full, 9999px);
		transition: var(--transition-all, all 150ms ease);
	}

	.slider::before {
		content: '';
		position: absolute;
		height: 1.25rem;
		width: 1.25rem;
		left: 0.25rem;
		bottom: 0.25rem;
		background-color: white;
		border-radius: var(--radius-full, 9999px);
		transition: var(--transition-all, all 150ms ease);
	}

	input:checked + .slider {
		background-color: var(--color-primary, #4ade80);
	}

	input:checked + .slider::before {
		transform: translateX(1.25rem);
	}

	input:focus + .slider {
		box-shadow: 0 0 0 2px var(--color-primary-glow, rgba(74, 222, 128, 0.25));
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.setting-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md, 1rem);
		}

		.theme-options,
		.hand-toggle,
		.toggle-control {
			align-self: flex-start;
		}

		.font-size-control {
			width: 100%;
		}

		.font-slider {
			flex: 1;
		}
	}
</style>

