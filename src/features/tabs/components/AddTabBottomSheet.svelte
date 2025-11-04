<script lang="ts">
	import { BottomSheet } from '$features/shared/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onURLImport: () => void;
		onPasteImport: () => void;
	}

	let { open = $bindable(false), onclose, onURLImport, onPasteImport }: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onclose?.();
		}
	}

	function handleURLImport() {
		onURLImport();
		open = false;
	}

	function handlePasteImport() {
		onPasteImport();
		open = false;
	}
</script>

<BottomSheet bind:open onOpenChange={handleOpenChange} title="Add a Tab">
	<div class="add-tab-content">
		<button class="option-card url-option" onclick={handleURLImport}>
			<div class="option-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
					></path>
				</svg>
			</div>
			<div class="option-text">
				<h3>AI-Powered Import</h3>
				<p>Search for any song or artist, or paste a URL</p>
			</div>
			<div class="option-arrow">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</div>
		</button>

		<button class="option-card paste-option" onclick={handlePasteImport}>
			<div class="option-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
					<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
				</svg>
			</div>
			<div class="option-text">
				<h3>Import via Paste</h3>
				<p>Paste tab content directly from your clipboard</p>
			</div>
			<div class="option-arrow">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</div>
		</button>
	</div>
</BottomSheet>

<style>
	.add-tab-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md, 1rem);
		padding: var(--spacing-sm, 0.5rem) 0;
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-md, 1rem);
		padding: var(--spacing-lg, 1.25rem);
		background: var(--color-surface-low, #f5f5f5);
		border: 1px solid var(--color-border, #e5e5e5);
		border-radius: var(--radius-xl, 1rem);
		cursor: pointer;
		transition: var(--transition-all, all 150ms ease);
		text-align: left;
		min-height: 100px;
		position: relative;
		overflow: hidden;
	}

	.option-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
		transition: left 0.5s ease;
	}

	.option-card:hover::before {
		left: 100%;
	}

	.option-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
		border-color: currentColor;
	}

	.option-card:active {
		transform: translateY(0);
		box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
	}

	.option-card:focus-visible {
		outline: 2px solid var(--color-focus, #4ade80);
		outline-offset: 2px;
	}

	/* URL Option - Purple/Blue gradient */
	.url-option {
		background: linear-gradient(
			135deg,
			rgba(102, 126, 234, 0.08) 0%,
			rgba(118, 75, 162, 0.08) 100%
		);
		border-color: var(--color-secondary, #667eea);
		color: var(--color-secondary, #667eea);
	}

	.url-option:hover {
		background: linear-gradient(
			135deg,
			rgba(102, 126, 234, 0.15) 0%,
			rgba(118, 75, 162, 0.15) 100%
		);
		box-shadow:
			var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1)),
			0 0 20px rgba(102, 126, 234, 0.3);
	}

	/* Paste Option - Green gradient */
	.paste-option {
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%);
		border-color: var(--color-primary, #4ade80);
		color: var(--color-primary, #4ade80);
	}

	.paste-option:hover {
		background: linear-gradient(
			135deg,
			rgba(74, 222, 128, 0.15) 0%,
			rgba(34, 197, 94, 0.15) 100%
		);
		box-shadow:
			var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1)),
			0 0 20px rgba(74, 222, 128, 0.3);
	}

	.option-icon {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: currentColor;
		border-radius: var(--radius-lg, 0.75rem);
		color: white;
	}

	.option-icon svg {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.option-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.option-text h3 {
		margin: 0;
		font-size: var(--font-size-lg, 1.125rem);
		font-weight: var(--font-weight-bold, 700);
		color: var(--color-text-primary, #0a0a0a);
	}

	.option-text p {
		margin: 0;
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-text-secondary, #737373);
		line-height: 1.5;
	}

	.option-arrow {
		flex-shrink: 0;
		color: currentColor;
		opacity: 0.6;
		transition: var(--transition-all, all 150ms ease);
	}

	.option-card:hover .option-arrow {
		opacity: 1;
		transform: translateX(4px);
	}

	/* Dark Mode */
	:global([data-theme='dark']) .option-card {
		background: var(--color-surface-low, #1a1a1a);
		border-color: var(--color-border, #404040);
	}

	:global([data-theme='dark']) .url-option {
		background: linear-gradient(
			135deg,
			rgba(102, 126, 234, 0.12) 0%,
			rgba(118, 75, 162, 0.12) 100%
		);
	}

	:global([data-theme='dark']) .url-option:hover {
		background: linear-gradient(
			135deg,
			rgba(102, 126, 234, 0.2) 0%,
			rgba(118, 75, 162, 0.2) 100%
		);
	}

	:global([data-theme='dark']) .paste-option {
		background: linear-gradient(
			135deg,
			rgba(74, 222, 128, 0.12) 0%,
			rgba(34, 197, 94, 0.12) 100%
		);
	}

	:global([data-theme='dark']) .paste-option:hover {
		background: linear-gradient(
			135deg,
			rgba(74, 222, 128, 0.2) 0%,
			rgba(34, 197, 94, 0.2) 100%
		);
	}

	/* Mobile optimization */
	@media (max-width: 640px) {
		.option-card {
			padding: var(--spacing-md, 1rem);
			min-height: 80px;
		}

		.option-icon {
			width: 48px;
			height: 48px;
		}

		.option-icon svg {
			width: 24px;
			height: 24px;
		}

		.option-text h3 {
			font-size: var(--font-size-base, 1rem);
		}

		.option-text p {
			font-size: var(--font-size-xs, 0.75rem);
		}
	}

	@media (max-width: 480px) {
		.option-card {
			padding: var(--spacing-sm, 0.5rem);
			gap: var(--spacing-sm, 0.5rem);
		}

		.option-icon {
			width: 40px;
			height: 40px;
		}

		.option-icon svg {
			width: 20px;
			height: 20px;
		}

		.option-arrow {
			display: none;
		}
	}
</style>

