<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import preferences from '../stores/preferences';
	import { browser } from '$app/environment';

	export let open = false;

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	let modalElement: HTMLDivElement;

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
		open = false;
		dispatch('close');
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

	$: if (open && browser) document.body.classList.add('overflow-hidden');
	$: if (!open && browser) document.body.classList.remove('overflow-hidden');

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

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop"
		on:click={handleOutsideClick}
		on:keydown={handleBackdropKeydown}
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
				<button class="close-btn" on:click={close} aria-label="Close settings"> × </button>
			</div>

			<div class="modal-body">
				<div class="setting-group">
					<h3>Font Size</h3>
					<p class="setting-description">Adjust the size of the tab text</p>
					<div class="font-size-control">
						<button
							class="control-btn"
							on:click={decreaseFontSize}
							disabled={$preferences.fontSize <= MIN_FONT_SIZE}
							aria-label="Decrease font size"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M19 13H5v-2h14v2z" />
							</svg>
						</button>

						<div class="slider-container">
							<input
								type="range"
								min={MIN_FONT_SIZE}
								max={MAX_FONT_SIZE}
								step={FONT_SIZE_STEP}
								value={$preferences.fontSize}
								on:input={handleFontSizeChange}
								aria-label="Font size"
							/>
							<div class="font-size-value">{$preferences.fontSize}px</div>
						</div>

						<button
							class="control-btn"
							on:click={increaseFontSize}
							disabled={$preferences.fontSize >= MAX_FONT_SIZE}
							aria-label="Increase font size"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
							</svg>
						</button>
					</div>
					<div class="font-size-preview" style="font-size: {$preferences.fontSize}px">
						e|----3--5--7--|<br />
						B|--5----------|<br />
						G|--------------|
					</div>
				</div>

				<div class="setting-group">
					<h3>Handedness</h3>
					<p class="setting-description">Choose which hand you use to fret the guitar</p>
					<div class="hand-toggle">
						<button
							class="hand-btn left-hand"
							class:active={$preferences.isLeftHanded}
							on:click={() => preferences.setLeftHanded(true)}
							aria-label="Left-handed"
							aria-pressed={$preferences.isLeftHanded}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
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
							on:click={() => preferences.setLeftHanded(false)}
							aria-label="Right-handed"
							aria-pressed={!$preferences.isLeftHanded}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
								<path
									fill="currentColor"
									d="M11 24c3.26 0 6.19-1.99 7.4-5.02l3.03-7.61a2 2 0 0 0-2.56-2.56l-.17.07a.8.8 0 0 1-.72-.07l-1.88-1.17a2 2 0 0 0-2.74.65l-.62 1.03c-.29.48-.87.7-1.4.56l-.68-.19a2 2 0 0 0-2.16.8l-.69 1.04c-.31.47-.84.75-1.4.75H5.2a2 2 0 0 0-2 2v6c0 1.85 1.28 3.4 3 3.81V24h4.8zm1-5c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-2c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-1c0 .55-.45 1-1 1s-1-.45-1-1v-5a1 1 0 1 1 2 0v5zm3-2c0 .55-.45 1-1 1s-1-.45-1-1v-4a1 1 0 1 1 2 0v4z"
								/>
							</svg>
							<span>Right</span>
						</button>
					</div>
				</div>

				<div class="setting-group">
					<h3>Chord Diagrams</h3>
					<p class="setting-description">Show or hide chord diagrams in the tab visualizer</p>
					<div class="toggle-control">
						<label class="switch">
							<input
								type="checkbox"
								checked={$preferences.showChordDiagrams}
								on:change={() => preferences.setShowChordDiagrams(!$preferences.showChordDiagrams)}
							/>
							<span class="slider"></span>
						</label>
						<span class="toggle-label">
							{$preferences.showChordDiagrams ? 'Showing chord diagrams' : 'Hiding chord diagrams'}
						</span>
					</div>
				</div>

				<!-- Additional settings groups can be added here in the future -->
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
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background-color: #fff;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		padding: 0;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.modal-body {
		padding: 1.5rem;
	}

	.setting-group {
		margin-bottom: 2rem;
	}

	.setting-group h3 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
	}

	.setting-description {
		margin: 0 0 1rem;
		color: #666;
		font-size: 0.9rem;
	}

	/* New font size control styles */
	.font-size-control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.control-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: none;
		background-color: #4caf50;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background-color: #45a049;
		transform: translateY(-1px);
	}

	.control-btn:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
		transform: none;
	}

	.control-btn svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
	}

	.slider-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slider-container input {
		width: 100%;
	}

	.font-size-value {
		text-align: center;
		font-size: 0.875rem;
		color: #555;
	}

	.font-size-preview {
		font-family: 'Courier New', monospace;
		white-space: pre;
		background-color: #f5f5f5;
		padding: 0.75rem;
		border-radius: 4px;
		overflow-x: auto;
		max-width: 100%;
		border: 1px solid #ddd;
	}

	.hand-toggle {
		display: flex;
		gap: 1rem;
	}

	.hand-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		background-color: #f5f5f5;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.left-hand {
		color: #1565c0;
	}

	.right-hand {
		color: #c62828;
	}

	.hand-btn.active {
		border-color: currentColor;
		background-color: #fff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.hand-btn span {
		font-weight: 500;
	}

	.hand-btn svg {
		width: 48px;
		height: 48px;
		transition: transform 0.3s ease;
	}

	.hand-btn:hover svg {
		transform: translateY(-4px);
	}

	/* Toggle switch styles */
	.toggle-control {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 24px;
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
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 24px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #4caf50;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #4caf50;
	}

	input:checked + .slider:before {
		transform: translateX(26px);
	}

	.toggle-label {
		font-size: 0.95rem;
	}

	@media (prefers-color-scheme: dark) {
		.modal {
			background-color: #222;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		}

		.modal-header {
			border-bottom-color: #333;
		}

		.close-btn:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.setting-description {
			color: #aaa;
		}

		.font-size-value {
			color: #aaa;
		}

		.font-size-preview {
			background-color: #2a2a2a;
			border-color: #444;
		}

		.control-btn {
			background-color: #388e3c;
		}

		.control-btn:hover {
			background-color: #2e7d32;
		}

		.control-btn:disabled {
			background-color: #424242;
		}

		.hand-btn {
			background-color: #333;
			border-color: #555;
		}

		.hand-btn.active {
			background-color: #2d2d2d;
		}

		.switch .slider {
			background-color: #444;
		}

		.toggle-label {
			color: #aaa;
		}
	}
</style>
