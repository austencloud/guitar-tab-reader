<script lang="ts">
	import BottomSheet from './BottomSheet.svelte';
	import preferences from '$lib/stores/preferences';
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
		margin-bottom: var(--spacing-xl, 2rem);
		padding: var(--spacing-lg, 1.25rem);
		background: var(--color-surface-low);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		transition: var(--transition-all);
	}

	.setting-section:hover {
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-sm);
	}

	.setting-section:last-child {
		margin-bottom: 0;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg, 1.25rem);
		min-height: 48px;
		margin-bottom: var(--spacing-md, 1rem);
		padding: var(--spacing-sm, 0.5rem) 0;
	}

	.setting-row:last-child {
		margin-bottom: 0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.setting-label {
		font-size: var(--font-size-base, 1rem);
		font-weight: var(--font-weight-semibold, 600);
		color: var(--color-text-primary);
		letter-spacing: -0.01em;
	}

	.setting-description {
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-text-secondary);
		line-height: 1.5;
		opacity: 0.9;
	}

	/* Font Size Control */
	.font-size-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-md, 1rem);
		flex-shrink: 0;
	}

	.control-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: var(--transition-all);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}

	.control-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-primary);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.control-btn svg {
		width: 1.125rem;
		height: 1.125rem;
		position: relative;
		z-index: 1;
		transition: var(--transition-all);
	}

	.control-btn:hover:not(:disabled) {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.control-btn:hover:not(:disabled)::before {
		opacity: 0.1;
	}

	.control-btn:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.control-btn:disabled {
		background: var(--color-surface-low);
		border-color: var(--color-border);
		color: var(--color-text-tertiary);
		cursor: not-allowed;
		transform: none;
		opacity: 0.4;
	}

	.font-slider {
		width: 140px;
		height: 6px;
		border-radius: var(--radius-full);
		background: linear-gradient(
			to right,
			var(--color-primary-dim) 0%,
			var(--color-primary) 100%
		);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		position: relative;
	}

	.font-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		cursor: pointer;
		transition: var(--transition-all);
		border: 3px solid var(--color-surface);
		box-shadow: var(--shadow-md);
	}

	.font-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.font-slider::-moz-range-thumb {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		cursor: pointer;
		border: 3px solid var(--color-surface);
		transition: var(--transition-all);
		box-shadow: var(--shadow-md);
	}

	.font-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.font-size-info {
		margin-top: var(--spacing-lg, 1.25rem);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md, 1rem);
		padding: var(--spacing-md, 1rem);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.font-size-value {
		font-size: var(--font-size-lg, 1.125rem);
		font-weight: var(--font-weight-bold, 700);
		color: var(--color-primary);
		text-align: center;
		letter-spacing: -0.02em;
	}

	.font-size-preview {
		font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
		background: var(--color-background);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg, 1.25rem);
		white-space: pre;
		overflow-x: auto;
		color: var(--color-text-primary);
		line-height: 1.4;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	/* Hand Toggle */
	.hand-toggle {
		display: flex;
		gap: var(--spacing-md, 1rem);
		flex-shrink: 0;
	}

	.hand-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm, 0.5rem);
		padding: var(--spacing-md, 1rem);
		border-radius: var(--radius-lg);
		border: 2px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-all);
		font-size: var(--font-size-sm, 0.875rem);
		font-weight: var(--font-weight-semibold, 600);
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
		position: relative;
		z-index: 1;
		transition: var(--transition-all);
	}

	.hand-btn span {
		position: relative;
		z-index: 1;
	}

	.hand-btn:hover:not(.active) {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.hand-btn:hover:not(.active)::before {
		opacity: 0.05;
	}

	.hand-btn.active {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: var(--color-text-inverse);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.hand-btn.active::before {
		opacity: 1;
	}

	/* Toggle Switch */
	.toggle-control {
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
		inset: 0;
		background: var(--color-surface-low);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-full);
		transition: var(--transition-all);
	}

	.slider::before {
		content: '';
		position: absolute;
		height: 1.25rem;
		width: 1.25rem;
		left: 0.25rem;
		bottom: 0.25rem;
		background: var(--color-text-secondary);
		border-radius: var(--radius-full);
		transition: var(--transition-all);
		box-shadow: var(--shadow-sm);
	}

	.switch:hover .slider {
		border-color: var(--color-primary);
	}

	input:checked + .slider {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	input:checked + .slider::before {
		transform: translateX(1.5rem);
		background: white;
		box-shadow: var(--shadow-md);
	}

	input:focus + .slider {
		box-shadow: 0 0 0 3px var(--color-primary-glow);
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.setting-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md, 1rem);
		}

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

