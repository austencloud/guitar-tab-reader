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

	/* Content - Glassmorphism sheet */
	:global(.bottom-sheet-content) {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-modal, 1001);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-xl, 1rem) var(--radius-xl, 1rem) 0 0;

		/* Glassmorphism styling */
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		box-shadow:
			0 -8px 32px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(255, 255, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.18);
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

	/* Dark mode styling */
	:global([data-theme='dark']) :global(.bottom-sheet-content) {
		background: rgba(45, 45, 45, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		box-shadow:
			0 -8px 32px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: none;
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
		border-radius: var(--radius-full, 9999px);
		background-color: var(--color-border, #e5e5e5);
		transition: background-color 150ms ease;
	}

	.bottom-sheet-handle-container:hover .bottom-sheet-handle {
		background-color: var(--color-border-strong, #d4d4d4);
	}

	:global([data-theme='dark']) .bottom-sheet-handle {
		background-color: var(--color-border, #404040);
	}

	:global([data-theme='dark']) .bottom-sheet-handle-container:hover .bottom-sheet-handle {
		background-color: var(--color-border-strong, #525252);
	}

	/* Header */
	.bottom-sheet-header {
		padding: 0 var(--spacing-xl, 1.5rem) var(--spacing-lg, 1.25rem);
		border-bottom: 1px solid var(--color-border, #e5e5e5);
	}

	:global(.bottom-sheet-title) {
		margin: 0;
		font-size: var(--font-size-xl, 1.25rem);
		font-weight: var(--font-weight-semibold, 600);
		color: var(--color-text-primary, #0a0a0a);
		line-height: 1.4;
	}

	:global(.bottom-sheet-description) {
		margin: var(--spacing-xs, 0.25rem) 0 0;
		font-size: var(--font-size-sm, 0.875rem);
		color: var(--color-text-secondary, #737373);
		line-height: 1.5;
	}

	/* Body */
	.bottom-sheet-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-xl, 1.5rem);
		overscroll-behavior: contain;
	}

	/* Custom scrollbar for body */
	.bottom-sheet-body::-webkit-scrollbar {
		width: 8px;
	}

	.bottom-sheet-body::-webkit-scrollbar-track {
		background: transparent;
	}

	.bottom-sheet-body::-webkit-scrollbar-thumb {
		background: var(--color-border, #e5e5e5);
		border-radius: var(--radius-full, 9999px);
	}

	.bottom-sheet-body::-webkit-scrollbar-thumb:hover {
		background: var(--color-border-strong, #d4d4d4);
	}

	:global([data-theme='dark']) .bottom-sheet-body::-webkit-scrollbar-thumb {
		background: var(--color-border, #404040);
	}

	:global([data-theme='dark']) .bottom-sheet-body::-webkit-scrollbar-thumb:hover {
		background: var(--color-border-strong, #525252);
	}

	/* Footer */
	.bottom-sheet-footer {
		padding: var(--spacing-lg, 1.25rem) var(--spacing-xl, 1.5rem);
		border-top: 1px solid var(--color-border, #e5e5e5);
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(10px);
	}

	:global([data-theme='dark']) .bottom-sheet-footer {
		background: rgba(45, 45, 45, 0.5);
		border-top-color: var(--color-border, #404040);
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

	/* Accessibility - Reduce motion */
	@media (prefers-reduced-motion: reduce) {
		:global(.bottom-sheet-overlay),
		:global(.bottom-sheet-content) {
			animation: none;
		}
	}
</style>
