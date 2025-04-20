<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { startAutoScroll, scrollToPosition } from '../utils/autoScroll';

	export let container: HTMLElement;

	let isScrolling = false;
	let scrollSpeed = 20; // Default speed in pixels per second
	let stopScroll: () => void;

	// Speed adjustment settings (pixels per second)
	const MIN_SPEED = 1;
	const MAX_SPEED = 100;
	const SPEED_STEP = 5;
	const FORMAT_PRECISION = 0; // No decimals needed for px/s

	const dispatch = createEventDispatcher<{
		scrollStateChange: boolean;
		startScroll: void;
		stopScroll: void;
	}>();

	function toggleScroll() {
		if (isScrolling) {
			pauseScroll();
		} else {
			startScroll();
		}
	}

	function startScroll() {
		console.log('Attempting to start scroll. Container:', container); // Log container
		if (!container) {
			console.error('Scroll container not found!');
			return;
		}
		isScrolling = true;
		stopScroll = startAutoScroll(container, scrollSpeed);
		dispatch('scrollStateChange', isScrolling);
		dispatch('startScroll');
	}

	function pauseScroll() {
		if (stopScroll) {
			stopScroll();
		}
		isScrolling = false;
		dispatch('scrollStateChange', isScrolling);
		dispatch('stopScroll');
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
		// If already scrolling, update the scroll speed
		if (isScrolling) {
			pauseScroll();
			startScroll();
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

	$: formattedSpeed = scrollSpeed.toFixed(FORMAT_PRECISION);
	$: speedPercentage = Math.round((scrollSpeed / MAX_SPEED) * 100);

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	// Clean up on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (stopScroll) {
			stopScroll();
		}
	});
</script>

<div class="scroll-controls">
	<div class="controls-row">
		<button aria-label={isScrolling ? 'Pause' : 'Play'} class="icon-button" on:click={toggleScroll}>
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

		<button aria-label="Reset to top" class="icon-button" on:click={resetScroll}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
		</button>
	</div>

	<div class="speed-control">
		<button
			class="speed-button"
			on:click={decreaseSpeed}
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
					on:input={handleSpeedChange}
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
			on:click={increaseSpeed}
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
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-top: 1rem;
	}

	.controls-row {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.icon-button {
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #4caf50;
		color: white;
		transition: all 0.2s;
	}

	.icon-button:hover {
		background-color: #45a049;
		transform: translateY(-2px);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.icon-button:active {
		transform: translateY(0);
	}

	.icon-button svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
	}

	.speed-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.speed-slider-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
		font-size: 0.8rem;
		color: #666;
	}

	.speed-value {
		font-weight: bold;
	}

	.speed-percentage {
		margin-left: 0.25rem;
		opacity: 0.8;
	}

	.speed-button {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: none;
		background-color: #4caf50;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		margin-top: 0;
		align-self: center; /* Align with the slider */
	}

	.speed-button svg {
		width: 1rem;
		height: 1rem;
		fill: currentColor;
	}

	.speed-button:hover {
		background-color: #45a049;
		transform: translateY(-1px);
	}

	.speed-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
		transform: none;
	}

	.keyboard-shortcuts {
		display: flex;
		justify-content: space-around;
		font-size: 0.7rem;
		color: #888;
		margin-top: 0.25rem;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.scroll-controls {
			background-color: rgba(33, 33, 33, 0.9);
		}

		.icon-button {
			background-color: #388e3c;
		}

		.icon-button:hover {
			background-color: #2e7d32;
		}

		.speed-feedback {
			color: #aaa;
		}

		.keyboard-shortcuts {
			color: #777;
		}

		.speed-button {
			background-color: #388e3c;
		}

		.speed-button:hover {
			background-color: #2e7d32;
		}

		.speed-button:disabled {
			background-color: #424242;
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.scroll-controls {
			padding: 0.5rem;
			width: 100%;
			box-sizing: border-box;
		}

		.icon-button {
			width: 2.25rem;
			height: 2.25rem;
		}

		.speed-button {
			width: 1.5rem;
			height: 1.5rem;
		}
	}
</style>
