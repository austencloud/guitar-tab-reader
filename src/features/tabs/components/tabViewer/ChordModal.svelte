<script lang="ts">
	import { scale } from 'svelte/transition';
	import ChordDiagram from '../ChordDiagram.svelte';
	import type { ProcessedChord } from '$lib/utils/chordUtils';

	interface Props {
		visible?: boolean;
		chord?: ProcessedChord | null;
		onclose?: () => void;
	}

	let { visible = false, chord = null, onclose }: Props = $props();

	function closeModal() {
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		// Close only if clicking the backdrop itself
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	// Focus management for accessibility
	let modalElement = $state<HTMLDivElement>();
	let previouslyFocusedElement = $state<HTMLElement | null>(null);

	$effect(() => {
		if (visible && modalElement) {
			previouslyFocusedElement = document.activeElement as HTMLElement;
			// Use requestAnimationFrame to ensure modal is rendered before focusing
			requestAnimationFrame(() => {
				modalElement?.focus();
			});
		} else if (!visible && previouslyFocusedElement) {
			previouslyFocusedElement?.focus();
			previouslyFocusedElement = null;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible && chord}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="chord-modal-backdrop"
		onclick={handleBackdropClick}
		transition:scale={{ duration: 150, start: 0.95, opacity: 0.7 }}
	>
		<div
			bind:this={modalElement}
			class="chord-modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="chord-modal-title"
			tabindex="-1"
		>
			<h3 id="chord-modal-title">{chord.name}</h3>
			<ChordDiagram
				name={chord.name}
				positions={chord.positions}
				barre={chord.barre}
				baseFret={chord.baseFret}
			/>
			<button onclick={closeModal}>Close</button>
		</div>
	</div>
{/if}

<style>
	.chord-modal-backdrop {
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
	}

	.chord-modal-content {
		background: var(--color-surface-high);
		color: var(--color-text-primary);
		padding: var(--spacing-xl);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-2xl);
		max-width: 90%;
		text-align: center;
		box-shadow: var(--shadow-2xl);
	}

	.chord-modal-content:focus {
		outline: none;
	}

	.chord-modal-content h3 {
		margin-top: 0;
		margin-bottom: var(--spacing-lg);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.chord-modal-content button {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-sm) var(--spacing-xl);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-xl);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--letter-spacing-tight);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
		box-shadow: var(--shadow-md);
	}

	.chord-modal-content button:hover {
		transform: translateY(-2px);
		box-shadow: var(--glow-primary);
	}

	.chord-modal-content button:active {
		transform: translateY(0);
	}

	.chord-modal-content button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}
</style>
