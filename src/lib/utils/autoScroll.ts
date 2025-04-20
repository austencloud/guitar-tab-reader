/**
 * Initiates auto-scrolling on a container element
 * @param container The HTML element to scroll
 * @param speed Scroll speed in pixels per second
 * @returns Function to cancel scrolling
 */
export function startAutoScroll(container: HTMLElement, speed: number): () => void {
	console.log('startAutoScroll called. Speed:', speed); // Log start
	console.log(
		`Container dimensions: scrollHeight=${container.scrollHeight}, clientHeight=${container.clientHeight}`
	); // Log dimensions

	// Check if scrolling is possible
	if (container.scrollHeight <= container.clientHeight) {
		console.warn('Container content is not taller than the container, no scrolling needed.');
		return () => {}; // Return an empty cancel function
	}

	let animationFrame: number;
	let lastTimestamp = 0;

	function step(timestamp: number) {
		if (!lastTimestamp) {
			lastTimestamp = timestamp;
			requestAnimationFrame(step);
			return;
		}

		const elapsed = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Calculate scroll amount based on speed and elapsed time
		// Assuming speed is pixels per second for more intuitive control
		const scrollAmount = (speed * elapsed) / 1000;

		// Log the speed being used in this frame
		console.log(
			`Step: speed=${speed}, elapsed=${elapsed.toFixed(2)}ms, scrollAmount=${scrollAmount.toFixed(2)}`
		);

		// Apply the scroll amount directly
		container.scrollTop += scrollAmount;

		// Stop scrolling if we've reached the bottom
		if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
			// Add a small buffer
			// Optionally dispatch an event or call a callback here
			return; // Stop requesting new frames
		}

		animationFrame = requestAnimationFrame(step);
	}

	animationFrame = requestAnimationFrame(step);

	return () => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
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
