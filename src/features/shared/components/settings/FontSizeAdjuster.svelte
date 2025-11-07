<script lang="ts">
	import { preferences } from '$lib/state/preferences.svelte';

	const MIN_FONT_SIZE = 10;
	const MAX_FONT_SIZE = 22;
	const FONT_SIZE_STEP = 1;

	function increaseFontSize() {
		if (preferences.fontSize < MAX_FONT_SIZE) {
			preferences.setFontSize(preferences.fontSize + FONT_SIZE_STEP);
		}
	}

	function decreaseFontSize() {
		if (preferences.fontSize > MIN_FONT_SIZE) {
			preferences.setFontSize(preferences.fontSize - FONT_SIZE_STEP);
		}
	}

	function handleFontSizeChange(event: Event) {
		const input = event.target as HTMLInputElement;
		preferences.setFontSize(parseInt(input.value));
	}
</script>

<div class="font-size-adjuster">
	<div class="adjuster-row">
		<div class="adjuster-info">
			<span class="adjuster-label">Font Size</span>
			<span class="adjuster-description">Adjust the size of the tab text</span>
		</div>
		<div class="adjuster-controls">
			<button
				class="control-btn"
				onclick={decreaseFontSize}
				disabled={preferences.fontSize <= MIN_FONT_SIZE}
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
				value={preferences.fontSize}
				oninput={handleFontSizeChange}
				aria-label="Font size"
			/>
			<button
				class="control-btn"
				onclick={increaseFontSize}
				disabled={preferences.fontSize >= MAX_FONT_SIZE}
				aria-label="Increase font size"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
				</svg>
			</button>
		</div>
	</div>
	<div class="adjuster-preview">
		<div class="preview-value">{preferences.fontSize}px</div>
		<div class="preview-content" style="font-size: {preferences.fontSize}px">
			{`e|--3--2--0--|
B|--0--3--1--|
G|--0--2--0--|
D|--0--0--2--|
A|--2--x--3--|
E|--3--x--x--|`}
		</div>
	</div>
</div>

<style>
	.font-size-adjuster {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.adjuster-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 48px;
	}

	.adjuster-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.adjuster-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
		letter-spacing: -0.01em;
	}

	.adjuster-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
		opacity: 0.9;
	}

	.adjuster-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
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
		fill: currentColor;
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

	.control-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
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
		flex: 1;
		min-width: 140px;
		height: 6px;
		border-radius: var(--radius-full);
		background: linear-gradient(to right, var(--color-primary-dim) 0%, var(--color-primary) 100%);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
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

	.adjuster-preview {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.preview-value {
		text-align: center;
		font-size: var(--font-size-lg);
		color: var(--color-primary);
		font-weight: var(--font-weight-bold);
		letter-spacing: -0.02em;
	}

	.preview-content {
		font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
		white-space: pre-line;
		background: var(--color-background);
		color: var(--color-text-primary);
		padding: var(--spacing-lg);
		border-radius: var(--radius-md);
		overflow-x: auto;
		border: 1px solid var(--color-border-strong);
		transition: var(--transition-all);
		text-align: left;
		line-height: 1.4;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 600px) {
		.adjuster-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.adjuster-controls {
			align-self: stretch;
		}
	}
</style>

