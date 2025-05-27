/**
 * Auto-scroll controller that allows dynamic speed updates
 */
export class AutoScrollController {
	private animationFrame: number | null = null;
	private lastTimestamp = 0;
	private currentSpeed: number;
	private container: HTMLElement;
	private isActive = false;
	private accumulatedScroll = 0; // Track fractional scroll amounts

	constructor(container: HTMLElement, initialSpeed: number) {
		this.container = container;
		this.currentSpeed = initialSpeed;
	}

	/**
	 * Start the auto-scroll
	 */
	start(): boolean {
		// Check if scrolling is possible
		if (this.container.scrollHeight <= this.container.clientHeight) {
			return false;
		}

		if (this.isActive) {
			return false;
		}

		this.isActive = true;
		this.lastTimestamp = 0;
		this.accumulatedScroll = 0; // Reset fractional scroll accumulation
		// Use arrow function to maintain 'this' binding
		this.animationFrame = requestAnimationFrame((timestamp) => this.step(timestamp));
		return true;
	}

	/**
	 * Stop the auto-scroll
	 */
	stop(): void {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
		this.isActive = false;
		this.lastTimestamp = 0;
	}

	/**
	 * Update the scroll speed without stopping the animation
	 */
	updateSpeed(newSpeed: number): void {
		this.currentSpeed = newSpeed;
	}

	/**
	 * Check if auto-scroll is currently active
	 */
	get active(): boolean {
		return this.isActive;
	}

	/**
	 * Get current speed
	 */
	get speed(): number {
		return this.currentSpeed;
	}

	private step(timestamp: number): void {
		if (!this.isActive) return;

		if (!this.lastTimestamp) {
			this.lastTimestamp = timestamp;
			this.animationFrame = requestAnimationFrame((ts) => this.step(ts));
			return;
		}

		const elapsed = timestamp - this.lastTimestamp;
		this.lastTimestamp = timestamp;

		// Calculate scroll amount based on current speed and elapsed time
		const scrollAmount = (this.currentSpeed * elapsed) / 1000;

		// Accumulate fractional scroll amounts to handle very low speeds
		this.accumulatedScroll += scrollAmount;

		// Only apply scroll when we have at least 1 pixel to scroll
		if (this.accumulatedScroll >= 1) {
			const pixelsToScroll = Math.floor(this.accumulatedScroll);
			this.container.scrollTop += pixelsToScroll;
			this.accumulatedScroll -= pixelsToScroll; // Keep the fractional remainder
		}

		// Stop scrolling if we've reached the bottom
		if (this.container.scrollTop + this.container.clientHeight >= this.container.scrollHeight - 1) {
			this.stop();
			return;
		}

		this.animationFrame = requestAnimationFrame((ts) => this.step(ts));
	}
}

/**
 * Legacy function for backward compatibility
 * @param container The HTML element to scroll
 * @param speed Scroll speed in pixels per second
 * @returns Function to cancel scrolling
 */
export function startAutoScroll(container: HTMLElement, speed: number): () => void {
	const controller = new AutoScrollController(container, speed);
	controller.start();
	return () => controller.stop();
}

/**
 * Scroll to a specific position within a container
 * @param container The HTML element to scroll
 * @param position Target scroll position in pixels
 */
export function scrollToPosition(container: HTMLElement, position: number): void {
	container.scrollTop = position;
}
