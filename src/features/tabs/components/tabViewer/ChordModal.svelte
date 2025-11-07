<script lang="ts">
	import { scale } from 'svelte/transition';
	import ChordDiagram from '../ChordDiagram.svelte';
	import type { ProcessedChord } from '$lib/utils/chordDb';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		visible?: boolean;
		chord?: ProcessedChord | null;
		onclose?: () => void;
	}

	let { visible = false, chord = null, onclose }: Props = $props();
	let currentPositionIndex = $state(0);

	// Convert ChordPosition to old format
	function convertToOldFormat(chord: ProcessedChord, index: number) {
		const position = chord.positions[index];
		if (!position) return { positions: [], barre: undefined, baseFret: 1 };

		// frets is already an array of numbers from the chord database
		// Just use it directly (it's already in the correct format)
		const positions = position.frets;

		// Get first barre if exists
		const barre = position.barres && position.barres.length > 0 ? position.barres[0] : undefined;

		return {
			positions,
			barre,
			baseFret: position.baseFret || 1
		};
	}

	const chordData = $derived(
		chord ? convertToOldFormat(chord, currentPositionIndex) : { positions: [], barre: undefined, baseFret: 1 }
	);

	function nextPosition() {
		if (chord && currentPositionIndex < chord.positions.length - 1) {
			currentPositionIndex++;
		}
	}

	function previousPosition() {
		if (currentPositionIndex > 0) {
			currentPositionIndex--;
		}
	}

	// Reset position index when chord changes
	$effect(() => {
		if (chord) {
			currentPositionIndex = 0;
		}
	});

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
			<div class="modal-header">
				<h3 id="chord-modal-title">{chord.name}</h3>
				{#if chord.fullName && chord.fullName !== chord.name}
					<p class="chord-full-name">{chord.fullName}</p>
				{/if}
			</div>

			<!-- Navigation controls for multiple voicings -->
			{#if chord.positions.length > 1}
				<div class="navigation-header">
					<button
						class="nav-button"
						onclick={previousPosition}
						disabled={currentPositionIndex === 0}
						aria-label="Previous voicing"
					>
						<ChevronLeft size={20} />
					</button>

					<span class="position-indicator">
						Position {currentPositionIndex + 1} of {chord.positions.length}
					</span>

					<button
						class="nav-button"
						onclick={nextPosition}
						disabled={currentPositionIndex === chord.positions.length - 1}
						aria-label="Next voicing"
					>
						<ChevronRight size={20} />
					</button>
				</div>
			{/if}

			<ChordDiagram
				name={chord.name}
				positions={chordData.positions}
				barre={chordData.barre}
				baseFret={chordData.baseFret}
				size="lg"
			/>

			{#if chordData.baseFret > 1}
				<p class="base-fret-info">Starting at fret {chordData.baseFret}</p>
			{/if}

			<button class="close-button" onclick={closeModal}>Close</button>
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

	.modal-header {
		text-align: center;
		margin-bottom: var(--spacing-md);
	}

	.chord-modal-content h3 {
		margin-top: 0;
		margin-bottom: var(--spacing-xs);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		letter-spacing: var(--letter-spacing-tight);
	}

	.chord-full-name {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.close-button {
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

	.navigation-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.nav-button {
		background: var(--color-surface-medium);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xs);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
		color: var(--color-text-primary);
	}

	.nav-button:hover:not(:disabled) {
		background: var(--color-surface-high);
		border-color: var(--color-primary);
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.position-indicator {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		min-width: 120px;
		text-align: center;
	}

	.base-fret-info {
		margin-top: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}
</style>
