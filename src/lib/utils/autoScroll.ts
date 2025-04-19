/**
 * Initiates auto-scrolling on a container element
 * @param container The HTML element to scroll
 * @param speed Scroll speed in pixels per animation frame
 * @returns Function to cancel scrolling
 */
export function startAutoScroll(container: HTMLElement, speed: number): () => void {
	let animationFrame: number;

	function step() {
		container.scrollTop += speed / 60; // Normalize for consistent speed across devices
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
