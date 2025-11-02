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
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.chord-modal-content {
		background-color: var(--modal-bg, white);
		color: var(--modal-text, #333);
		padding: 20px;
		border-radius: 8px;
		max-width: 90%;
		text-align: center;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}

	.chord-modal-content h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.chord-modal-content button {
		margin-top: 15px;
		padding: 8px 16px;
		background-color: var(--button-bg, #0066cc);
		color: var(--button-text, white);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.chord-modal-content button:hover {
		background-color: var(--button-hover-bg, #0055aa);
	}

	@media (prefers-color-scheme: dark) {
		.chord-modal-content {
			--modal-bg: #2d2d2d;
			--modal-text: #e0e0e0;
			--button-bg: #64b5f6;
			--button-text: #111;
			--button-hover-bg: #42a5f5;
		}
	}
</style>
