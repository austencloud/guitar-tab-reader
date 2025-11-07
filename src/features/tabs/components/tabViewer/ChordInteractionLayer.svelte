<script lang="ts">
	/**
	 * ChordInteractionLayer Component
	 * Handles chord click/hover/focus interactions
	 * Emits events for tooltip and modal display
	 */

	import type { ProcessedChord } from '$lib/utils/chordDb';

	interface Props {
		/** Map of chord names to chord data */
		chordsMap: Map<string, ProcessedChord>;
		/** Whether chord diagrams are enabled */
		showChordDiagrams: boolean;
		/** Whether device is touch-enabled */
		isTouch: boolean;
		/** Callback when tooltip should be shown */
		onshowTooltip: (chord: ProcessedChord, target: HTMLElement) => void;
		/** Callback when tooltip should be hidden */
		onhideTooltip: (delay?: number) => void;
		/** Callback when modal should be shown */
		onshowModal: (chord: ProcessedChord) => void;
		/** Callback when touch is detected */
		ontouchDetected?: () => void;
	}

	let {
		chordsMap,
		showChordDiagrams,
		isTouch,
		onshowTooltip,
		onhideTooltip,
		onshowModal,
		ontouchDetected
	}: Props = $props();

	/**
	 * Handle interaction start (mouseenter or touchstart)
	 */
	export function handleInteractionStart(event: MouseEvent | TouchEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;

		const chord = chordsMap.get(chordName);
		if (!chord) return;

		if (event.type === 'touchstart') {
			event.preventDefault(); // Prevent mouse events on touch devices
			ontouchDetected?.();
			onshowTooltip(chord, target);
		} else if (event.type === 'mouseenter' && !isTouch) {
			onshowTooltip(chord, target);
		}
	}

	/**
	 * Handle interaction end (mouseleave)
	 */
	export function handleInteractionEnd(event: MouseEvent | TouchEvent) {
		const target = event.target as HTMLElement;
		if (event.type === 'mouseleave' && !isTouch && target.classList.contains('chord')) {
			onhideTooltip();
		}
		// Touch end doesn't hide the tooltip, it stays until document click
	}

	/**
	 * Handle chord click (open modal)
	 */
	export function handleChordClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;

		const chord = chordsMap.get(chordName);
		if (!chord) {
			console.warn(`Chord data not found for: ${chordName}`);
			return;
		}

		onshowModal(chord);
		onhideTooltip(0); // Hide tooltip immediately when modal opens
		event.stopPropagation(); // Prevent document click handler from closing modal instantly
	}

	/**
	 * Handle focus in (keyboard navigation)
	 */
	export function handleFocusIn(event: FocusEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord') || !showChordDiagrams) return;

		const chordName = target.dataset.chord;
		if (!chordName) return;
		const chord = chordsMap.get(chordName);
		if (!chord) return;

		// Show tooltip on focus, like mouseenter but without delay
		onshowTooltip(chord, target);
	}

	/**
	 * Handle focus out (keyboard navigation)
	 */
	export function handleFocusOut(event: FocusEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord')) return;

		// Hide tooltip on blur, like mouseleave
		onhideTooltip();
	}

	/**
	 * Handle keyboard events (Enter/Space to open modal)
	 */
	export function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains('chord')) return;

		// Trigger click (modal) on Enter or Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault(); // Prevent space from scrolling page
			// Create a synthetic mouse event for keyboard activation
			const syntheticEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			Object.defineProperty(syntheticEvent, 'target', {
				value: event.target,
				enumerable: true
			});
			handleChordClick(syntheticEvent);
		}
	}
</script>

<!-- This component has no visual representation -->
<!-- It only handles interaction events -->

