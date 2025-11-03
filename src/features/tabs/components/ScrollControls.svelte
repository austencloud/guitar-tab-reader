<script lang="ts">
	import { onMount } from 'svelte';
	import { AutoScrollController, scrollToPosition } from '$lib/utils/autoScroll';

	interface Props {
		container: HTMLElement;
		onscrollStateChange?: (isScrolling: boolean) => void;
		onstartScroll?: () => void;
		onstopScroll?: () => void;
	}

	let { container, onscrollStateChange, onstartScroll, onstopScroll }: Props = $props();

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
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (scrollController) {
			scrollController.stop();
		}
	});
</script>

<div class="scroll-controls">
	<div class="controls-row">
		<button aria-label={isScrolling ? 'Pause' : 'Play'} class="icon-button" onclick={toggleScroll}>
			{#if isScrolling}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg
				>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					><path d="M8 5v14l11-7-11-7z" /></svg
				>
			{/if}
		</button>

		<button aria-label="Reset to top" class="icon-button" onclick={resetScroll}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
		</button>
	</div>

	<div class="speed-control">
		<button
			class="speed-button"
			onclick={decreaseSpeed}
			aria-label="Decrease speed"
			disabled={scrollSpeed <= MIN_SPEED}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
				><path d="M19 13H5v-2h14v2z" /></svg
			>
		</button>

		<div class="speed-slider-container">
			<div class="slider-with-buttons">
				<input
					type="range"
					min={MIN_SPEED}
					max={MAX_SPEED}
					step={SPEED_STEP}
					bind:value={scrollSpeed}
					oninput={handleSpeedChange}
					aria-label="Scroll speed"
				/>
			</div>
			<div class="speed-feedback">
				<span class="speed-value">{formattedSpeed}</span>
				<span class="speed-percentage">({speedPercentage}%)</span>
			</div>
		</div>

		<button
			class="speed-button"
			onclick={increaseSpeed}
			aria-label="Increase speed"
			disabled={scrollSpeed >= MAX_SPEED}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
				><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg
			>
		</button>
	</div>

	<div class="keyboard-shortcuts">
		<span>Space: Play/Pause</span>
		<span>+/-: Speed</span>
	</div>
</div>

<style>
	.scroll-controls {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: var(--color-surface-high);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		margin-top: var(--spacing-md);
		border: 1px solid var(--color-border);
	}

	.controls-row {
		display: flex;
		gap: var(--spacing-md);
		justify-content: center;
	}

	.icon-button {
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-full);
		width: var(--touch-target-comfortable);
		height: var(--touch-target-comfortable);
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		transition: var(--transition-all);
		box-shadow: var(--shadow-md);
	}

	.icon-button:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.icon-button:active {
		transform: translateY(0) scale(0.95);
		box-shadow: var(--shadow-sm);
	}

	.icon-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.icon-button svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
	}

	.speed-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.speed-slider-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.slider-with-buttons {
		display: flex;
		align-items: center;
		position: relative;
		height: 30px;
	}

	.slider-with-buttons input {
		width: 100%;
	}

	.speed-feedback {
		display: flex;
		justify-content: center;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.speed-value {
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.speed-percentage {
		margin-left: var(--spacing-xs);
		opacity: 0.8;
	}

	.speed-button {
		width: var(--touch-target-min);
		height: var(--touch-target-min);
		border-radius: var(--radius-full);
		border: none;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
		box-shadow: var(--shadow-sm);
		align-self: center;
	}

	.speed-button svg {
		width: 1rem;
		height: 1rem;
		fill: currentColor;
	}

	.speed-button:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-1px);
		box-shadow: var(--shadow-md), var(--glow-primary);
	}

	.speed-button:active {
		transform: translateY(0) scale(0.95);
		box-shadow: var(--shadow-sm);
	}

	.speed-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.speed-button:disabled {
		background: var(--color-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
		opacity: 0.5;
	}

	.keyboard-shortcuts {
		display: flex;
		justify-content: space-around;
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--spacing-xs);
		gap: var(--spacing-sm);
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.scroll-controls {
			padding: var(--spacing-sm);
			width: 100%;
			box-sizing: border-box;
		}

		.icon-button {
			width: var(--touch-target-min);
			height: var(--touch-target-min);
		}

		.icon-button svg {
			width: 1rem;
			height: 1rem;
		}

		.speed-button {
			width: 40px;
			height: 40px;
		}

		.speed-button svg {
			width: 0.875rem;
			height: 0.875rem;
		}

		.keyboard-shortcuts {
			font-size: 0.625rem;
		}
	}
</style>
