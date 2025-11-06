<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AutoScrollController, scrollToPosition } from '$lib/utils/autoScroll';

	let {
		container = $bindable(),
		onscrollStateChange,
		onstartScroll,
		onstopScroll,
		onhideNavigation
	}: {
		container: HTMLElement;
		onscrollStateChange?: (isScrolling: boolean) => void;
		onstartScroll?: () => void;
		onstopScroll?: () => void;
		onhideNavigation?: () => void;
	} = $props();

	let isScrolling = $state(false);
	let scrollSpeed = $state(20);
	let scrollController: AutoScrollController | null = null;

	// Speed adjustment settings (pixels per second)
	const MIN_SPEED = 1;
	const MAX_SPEED = 100;
	const SPEED_STEP = 5;
	const FORMAT_PRECISION = 0;

	function toggleScroll() {
		if (isScrolling) {
			pauseScroll();
		} else {
			startScroll();
		}
	}

	function startScroll() {
		if (!container) {
			console.error('Cannot start scroll: container is null or undefined');
			return;
		}

		// Create new controller if needed
		if (!scrollController) {
			scrollController = new AutoScrollController(container, scrollSpeed);
		}

		// Start scrolling
		const started = scrollController.start();

		if (started) {
			isScrolling = true;
			onscrollStateChange?.(isScrolling);
			onstartScroll?.();
			// Hide navigation when auto-scroll starts
			onhideNavigation?.();
		} else {
			console.warn('Cannot start auto-scroll: content does not overflow container');
		}
	}

	function pauseScroll() {
		if (scrollController) {
			scrollController.stop();
		}
		isScrolling = false;
		onscrollStateChange?.(isScrolling);
		onstopScroll?.();
	}

	function resetScroll() {
		const wasScrolling = isScrolling;
		if (wasScrolling) {
			pauseScroll();
		}

		if (container) {
			scrollToPosition(container, 0);
		}

		if (wasScrolling) {
			startScroll();
		}
	}

	function handleSpeedChange(event: Event) {
		const input = event.target as HTMLInputElement;
		scrollSpeed = parseFloat(input.value);
		updateScrollWithNewSpeed();
	}

	function updateScrollWithNewSpeed() {
		// If already scrolling, update the speed dynamically without stopping
		if (isScrolling && scrollController) {
			scrollController.updateSpeed(scrollSpeed);
		}
	}

	function increaseSpeed() {
		scrollSpeed = Math.min(MAX_SPEED, scrollSpeed + SPEED_STEP);
		updateScrollWithNewSpeed();
	}

	function decreaseSpeed() {
		scrollSpeed = Math.max(MIN_SPEED, scrollSpeed - SPEED_STEP);
		updateScrollWithNewSpeed();
	}

	function handleKeydown(event: KeyboardEvent) {
		// Only handle keyboard events when the container is in focus/view
		if (!container || !isElementInViewport(container)) return;

		if (event.code === 'Space') {
			event.preventDefault(); // Prevent page scrolling
			toggleScroll();
		} else if (event.code === 'Equal' || event.code === 'NumpadAdd') {
			event.preventDefault();
			increaseSpeed();
		} else if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
			event.preventDefault();
			decreaseSpeed();
		}
	}

	function isElementInViewport(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= window.innerHeight &&
			rect.right <= window.innerWidth
		);
	}

	const formattedSpeed = $derived(scrollSpeed.toFixed(FORMAT_PRECISION));
	const speedPercentage = $derived(Math.round((scrollSpeed / MAX_SPEED) * 100));

	// Track container changes and clean up when needed
	let previousContainer: HTMLElement | null = null;
	$effect(() => {
		// Only reset when container actually changes
		if (container !== previousContainer) {
			// Clean up existing controller when container changes
			if (scrollController) {
				scrollController.stop();
				scrollController = null;
			}

			// Reset scrolling state
			if (isScrolling) {
				isScrolling = false;
				onscrollStateChange?.(false);
				onstopScroll?.();
			}

			previousContainer = container;
		}
	});

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	// Clean up on component destroy
	onDestroy(() => {
		if (scrollController) {
			scrollController.stop();
		}
	});
</script>

<div class="scroll-controls">
	<!-- Compact single-row layout -->
	<div class="controls-row">
		<!-- Play/Pause button -->
		<button 
			class="control-btn primary-btn" 
			onclick={toggleScroll}
			aria-label={isScrolling ? 'Pause auto-scroll' : 'Start auto-scroll'}
		>
			{#if isScrolling}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z" />
				</svg>
			{/if}
		</button>

		<!-- Speed control -->
		<div class="speed-section">
			<button
				class="control-btn speed-btn"
				onclick={decreaseSpeed}
				aria-label="Decrease speed"
				disabled={scrollSpeed <= MIN_SPEED}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19 13H5v-2h14v2z" />
				</svg>
			</button>

			<div class="speed-display">
				<div class="speed-label">Speed</div>
				<div class="speed-value">{formattedSpeed}</div>
			</div>

			<button
				class="control-btn speed-btn"
				onclick={increaseSpeed}
				aria-label="Increase speed"
				disabled={scrollSpeed >= MAX_SPEED}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
				</svg>
			</button>
		</div>

		<!-- Reset button -->
		<button 
			class="control-btn reset-btn" 
			onclick={resetScroll}
			aria-label="Reset to top"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
			</svg>
		</button>
	</div>

	<!-- Hidden range input for fine control (accessible) -->
	<input
		type="range"
		class="speed-slider"
		min={MIN_SPEED}
		max={MAX_SPEED}
		step={SPEED_STEP}
		bind:value={scrollSpeed}
		oninput={handleSpeedChange}
		aria-label="Fine-tune scroll speed"
	/>
</div>

<style>
	.scroll-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0;
	}

	.controls-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	/* Modern glassmorphic button base */
	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		-webkit-tap-highlight-color: transparent;
		min-width: 44px;
		min-height: 44px;
		padding: 0.5rem;
	}

	.control-btn svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.control-btn:active {
		transform: scale(0.96);
		background: rgba(255, 255, 255, 0.1);
	}

	.control-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		transform: none;
	}

	.control-btn:disabled:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
		transform: none;
	}

	/* Primary play/pause button - emphasis with color */
	.primary-btn {
		background: linear-gradient(135deg, #10b981, #059669);
		border-color: rgba(255, 255, 255, 0.2);
		color: white;
		min-width: 48px;
		min-height: 48px;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.primary-btn:hover {
		background: linear-gradient(135deg, #059669, #047857);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
		transform: translateY(-2px);
	}

	.primary-btn:active {
		transform: scale(0.94);
		box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
	}

	/* Speed section - compact inline layout */
	.speed-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		max-width: 240px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 0.25rem;
	}

	.speed-btn {
		min-width: 36px;
		min-height: 36px;
		padding: 0.375rem;
	}

	.speed-btn svg {
		width: 16px;
		height: 16px;
	}

	.speed-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		min-width: 60px;
	}

	.speed-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.5);
		line-height: 1;
	}

	.speed-value {
		font-size: 1rem;
		font-weight: 700;
		color: #10b981;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
	}

	/* Reset button */
	.reset-btn {
		min-width: 44px;
		min-height: 44px;
	}

	.reset-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Hidden slider for fine control */
	.speed-slider {
		width: 100%;
		height: 4px;
		-webkit-appearance: none;
		appearance: none;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
		margin-top: 0.25rem;
	}

	.speed-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: #10b981;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
		transition: all 0.2s;
	}

	.speed-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 0 12px rgba(16, 185, 129, 0.7);
	}

	.speed-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: #10b981;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
		transition: all 0.2s;
	}

	.speed-slider::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 0 12px rgba(16, 185, 129, 0.7);
	}

	/* Focus styles for accessibility */
	.control-btn:focus-visible {
		outline: 2px solid #10b981;
		outline-offset: 2px;
	}

	.speed-slider:focus-visible {
		outline: 2px solid #10b981;
		outline-offset: 2px;
	}

	/* Small mobile screens - more compact */
	@media (max-width: 380px) {
		.controls-row {
			gap: 0.375rem;
		}

		.primary-btn {
			min-width: 44px;
			min-height: 44px;
		}

		.control-btn svg {
			width: 18px;
			height: 18px;
		}

		.speed-section {
			max-width: 200px;
		}

		.speed-display {
			min-width: 50px;
		}

		.speed-value {
			font-size: 0.875rem;
		}

		.speed-label {
			font-size: 0.5625rem;
		}
	}

	/* Larger screens - more breathing room */
	@media (min-width: 640px) {
		.controls-row {
			gap: 0.75rem;
		}

		.speed-section {
			max-width: 280px;
			gap: 0.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.control-btn,
		.speed-slider::-webkit-slider-thumb,
		.speed-slider::-moz-range-thumb {
			transition: none;
		}

		.control-btn:hover,
		.primary-btn:hover {
			transform: none;
		}

		.control-btn:active,
		.primary-btn:active {
			transform: none;
		}
	}
</style>
