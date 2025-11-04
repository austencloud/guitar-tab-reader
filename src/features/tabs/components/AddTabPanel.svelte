<script lang="ts">
	interface Props {
		visible: boolean;
		onclose: () => void;
		onURLImport: () => void;
		onPasteImport: () => void;
	}

	let { visible = false, onclose, onURLImport, onPasteImport }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

{#if visible}
	<div
		class="panel-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="-1"
	>
		<div class="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
			<div class="panel-header">
				<h2 id="panel-title">Add a Tab</h2>
				<button class="close-btn" onclick={onclose} aria-label="Close panel">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="panel-content">
				<button class="option-card url-option" onclick={onURLImport}>
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
							<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
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

				<button class="option-card paste-option" onclick={onPasteImport}>
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
		</div>
	</div>
{/if}

<style>
	.panel-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--blur-md);
		z-index: var(--z-modal-backdrop);
		display: flex;
		justify-content: center;
		align-items: flex-end;
		animation: fadeIn var(--transition-base);
	}

	.panel {
		width: 100%;
		max-width: 600px;
		max-height: 85vh;
		background: var(--color-surface-high);
		box-shadow: var(--shadow-2xl);
		display: flex;
		flex-direction: column;
		animation: slideUp var(--transition-slow);
		overflow: hidden;
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
		border: 1px solid var(--color-border);
		border-bottom: none;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-high);
	}

	.panel-header h2 {
		margin: 0;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: var(--color-text-secondary);
		transition: var(--transition-all);
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
	}

	.close-btn:hover {
		background: var(--color-hover);
		color: var(--color-text-primary);
		transform: scale(1.05);
	}

	.close-btn:active {
		transform: scale(0.95);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.panel-content {
		flex: 1;
		padding: var(--spacing-lg);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		cursor: pointer;
		transition: var(--transition-all);
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
		transition: left var(--transition-slower);
	}

	.option-card:hover::before {
		left: 100%;
	}

	.option-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg);
		border-color: currentColor;
	}

	.option-card:active {
		transform: translateY(0);
		box-shadow: var(--shadow-md);
	}

	.option-card:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.url-option {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
		border-color: var(--color-secondary);
		color: var(--color-secondary);
	}

	.url-option:hover {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
		box-shadow: var(--shadow-lg), var(--glow-secondary);
	}

	.paste-option {
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.paste-option:hover {
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.option-icon {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: currentColor;
		border-radius: var(--radius-lg);
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
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.option-text p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-normal);
	}

	.option-arrow {
		flex-shrink: 0;
		color: currentColor;
		opacity: 0.6;
		transition: var(--transition-all);
	}

	.option-card:hover .option-arrow {
		opacity: 1;
		transform: translateX(4px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.panel {
			max-width: 100%;
		}

		.panel-header {
			padding: var(--spacing-md);
		}

		.panel-header h2 {
			font-size: var(--font-size-xl);
		}

		.panel-content {
			padding: var(--spacing-md);
		}

		.option-card {
			padding: var(--spacing-md);
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
			font-size: var(--font-size-base);
		}

		.option-text p {
			font-size: var(--font-size-xs);
		}
	}

	@media (max-width: 480px) {
		.panel-header {
			padding: var(--spacing-sm);
		}

		.panel-content {
			padding: var(--spacing-sm);
			gap: var(--spacing-sm);
		}

		.option-card {
			padding: var(--spacing-sm);
			gap: var(--spacing-sm);
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
