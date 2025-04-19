/**
 * Initiates auto-scrolling on a container element
 * @param container The HTML element to scroll
 * @param speed Scroll speed in pixels per animation frame
 * @returns Function to cancel scrolling
 */
export function startAutoScroll(container: HTMLElement, speed: number): () => void {
	let lastTimestamp = 0;
	let accumulatedDelta = 0;
	let animationFrame: number;

	function step(timestamp: number) {
		if (!lastTimestamp) lastTimestamp = timestamp;

		const elapsed = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Accumulate partial pixels for smooth slow scrolling
		// Scale by elapsed time for consistent scrolling regardless of frame rate
		// Pixels per frame calculation: speed * (elapsed / 16.67)
		accumulatedDelta += speed * (elapsed / 16.67);

		if (Math.abs(accumulatedDelta) >= 0.1) {
			const scrollAmount = Math.floor(accumulatedDelta);
			container.scrollTop += scrollAmount;
			accumulatedDelta -= scrollAmount;
		}

		animationFrame = requestAnimationFrame(step);
	}

	animationFrame = requestAnimationFrame(step);

	return () => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			lastTimestamp = 0;
			accumulatedDelta = 0;
		}
	};
}

/**
 * Scroll to a specific position within a container
 * @param container The HTML element to scroll
 * @param position Target scroll position in pixels
 */
export function scrollToPosition(container: HTMLElement, position: number): void {
	container.scrollTop = position;
}
