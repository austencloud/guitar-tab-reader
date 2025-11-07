<script lang="ts">
	/**
	 * GestureHandler Component
	 * Handles pinch-to-zoom gestures for font size control
	 * Emits events for font size changes
	 */

	interface Props {
		/** Current font size */
		currentFontSize: number;
		/** Maximum safe font size */
		maxFontSize: number;
		/** Callback when font size changes */
		onfontSizeChange: (newSize: number) => void;
	}

	let { currentFontSize, maxFontSize, onfontSizeChange }: Props = $props();

	// Pinch gesture state
	let isPinching = $state(false);
	let initialPinchDistance = $state(0);
	let initialFontSize = $state(16);

	/**
	 * Calculate distance between two touch points
	 */
	function getPinchDistance(touches: TouchList): number {
		const touch1 = touches[0];
		const touch2 = touches[1];
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Handle touch start - detect pinch gesture
	 */
	export function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 2) {
			// Two-finger pinch gesture
			event.preventDefault(); // Prevent default zoom
			isPinching = true;
			initialPinchDistance = getPinchDistance(event.touches);
			initialFontSize = currentFontSize;
		}
	}

	/**
	 * Handle touch move - calculate font size change
	 */
	export function handleTouchMove(event: TouchEvent) {
		if (!isPinching || event.touches.length !== 2) return;

		event.preventDefault(); // Prevent scrolling/zooming

		const currentDistance = getPinchDistance(event.touches);
		const distanceChange = currentDistance - initialPinchDistance;

		// Calculate font size change (1px change per 20px of pinch distance change)
		const fontSizeChange = distanceChange / 20;
		const newFontSize = initialFontSize + fontSizeChange;

		// Constrain to safe bounds (8px minimum, maxFontSize maximum)
		const constrainedSize = Math.max(8, Math.min(newFontSize, maxFontSize));

		if (constrainedSize !== currentFontSize) {
			onfontSizeChange(constrainedSize);
		}
	}

	/**
	 * Handle touch end - reset pinch state
	 */
	export function handleTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) {
			isPinching = false;
			initialPinchDistance = 0;
		}
	}

	/**
	 * Get current pinch state (for external components)
	 */
	export function isPinchActive(): boolean {
		return isPinching;
	}
</script>

<!-- This component has no visual representation -->
<!-- It only handles gesture events -->

