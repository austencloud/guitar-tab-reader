<script lang="ts">
	import { Drawer } from 'vaul-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		title?: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
		snapPoints?: number[];
		fadeFromIndex?: number;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		title,
		description,
		children,
		footer,
		snapPoints,
		fadeFromIndex
	}: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
	}
</script>

<Drawer.Root {open} onOpenChange={handleOpenChange} {snapPoints} {fadeFromIndex}>
	<Drawer.Portal>
		<Drawer.Overlay class="bottom-sheet-overlay" />
		<Drawer.Content class="bottom-sheet-content">
			<!-- Drag Handle -->
			<div class="bottom-sheet-handle-container">
				<div class="bottom-sheet-handle" aria-hidden="true"></div>
			</div>

			<!-- Header -->
			{#if title || description}
				<div class="bottom-sheet-header">
					{#if title}
						<Drawer.Title class="bottom-sheet-title">{title}</Drawer.Title>
					{/if}
					{#if description}
						<Drawer.Description class="bottom-sheet-description">{description}</Drawer.Description>
					{/if}
				</div>
			{/if}

			<!-- Body -->
			<div class="bottom-sheet-body">
				{@render children()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="bottom-sheet-footer">
					{@render footer()}
				</div>
			{/if}
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<style>
	/* Overlay - Glassmorphism backdrop */
	:global(.bottom-sheet-overlay) {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: var(--z-modal-backdrop, 1000);
		animation: fadeIn 200ms ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Content - Modern dark sheet */
	:global(.bottom-sheet-content) {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-modal, 1001);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;

		/* Modern dark styling */
		background: var(--color-background);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		box-shadow:
			0 -8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px var(--color-border-strong),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		border: 1px solid var(--color-border-strong);
		border-bottom: none;

		/* Animation */
		animation: slideUp 300ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Handle Container */
	.bottom-sheet-handle-container {
		display: flex;
		justify-content: center;
		padding: var(--spacing-md, 1rem) 0 var(--spacing-sm, 0.5rem);
		cursor: grab;
		touch-action: none;
	}

	.bottom-sheet-handle-container:active {
		cursor: grabbing;
	}

	/* Drag Handle */
	.bottom-sheet-handle {
		width: 3rem;
		height: 0.25rem;
		border-radius: var(--radius-full);
		background-color: var(--color-border);
		transition: var(--transition-all);
	}

	.bottom-sheet-handle-container:hover .bottom-sheet-handle {
		background-color: var(--color-border-strong);
	}

	/* Header */
	.bottom-sheet-header {
		padding: 0 var(--spacing-xl) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-low);
	}

	:global(.bottom-sheet-title) {
		margin: 0;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		line-height: 1.4;
		letter-spacing: -0.02em;
	}

	:global(.bottom-sheet-description) {
		margin: var(--spacing-xs) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
		opacity: 0.9;
	}

	/* Body */
	.bottom-sheet-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-xl, 1.5rem);
		overscroll-behavior: contain;
		/* Prevent horizontal overflow */
		overflow-x: hidden;
		box-sizing: border-box;
		width: 100%;
	}

	/* Custom scrollbar for body */
	.bottom-sheet-body::-webkit-scrollbar {
		width: 8px;
	}

	.bottom-sheet-body::-webkit-scrollbar-track {
		background: transparent;
	}

	.bottom-sheet-body::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-full);
	}

	.bottom-sheet-body::-webkit-scrollbar-thumb:hover {
		background: var(--color-border-strong);
	}

	/* Footer */
	.bottom-sheet-footer {
		padding: var(--spacing-lg) var(--spacing-xl);
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-low);
		backdrop-filter: blur(10px);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		:global(.bottom-sheet-content) {
			max-height: 95vh;
		}

		.bottom-sheet-body {
			padding: var(--spacing-lg, 1.25rem);
		}
	}

	/* Extra compact for very small screens */
	@media (max-width: 380px) {
		.bottom-sheet-body {
			padding: var(--spacing-md, 1rem);
		}
	}

	/* Landscape mode - more compact */
	@media (max-height: 500px) {
		:global(.bottom-sheet-content) {
			max-height: 98vh;
		}

		.bottom-sheet-body {
			padding: var(--spacing-md, 1rem);
		}
	}

	/* Accessibility - Reduce motion */
	@media (prefers-reduced-motion: reduce) {
		:global(.bottom-sheet-overlay),
		:global(.bottom-sheet-content) {
			animation: none;
		}
	}
</style>
