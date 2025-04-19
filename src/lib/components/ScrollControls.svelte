<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { startAutoScroll, scrollToPosition } from '../utils/autoScroll';

	export let container: HTMLElement;

	let isScrolling = false;
	let scrollSpeed = 2; // Default speed - pixels per animation frame
	let stopScroll: () => void;

	const dispatch = createEventDispatcher<{
		scrollStateChange: boolean;
	}>();

	function toggleScroll() {
		if (isScrolling) {
			pauseScroll();
		} else {
			startScroll();
		}
	}

	function startScroll() {
		if (!container) return;
		isScrolling = true;
		stopScroll = startAutoScroll(container, scrollSpeed);
		dispatch('scrollStateChange', isScrolling);
	}

	function pauseScroll() {
		if (stopScroll) {
			stopScroll();
		}
		isScrolling = false;
		dispatch('scrollStateChange', isScrolling);
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

		// If already scrolling, update the scroll speed
		if (isScrolling) {
			pauseScroll();
			startScroll();
		}
	}

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
		<button
			aria-label={isScrolling ? 'Pause' : 'Play'}
			class="control-button"
			on:click={toggleScroll}
		>
			{#if isScrolling}
				<span class="icon">⏸️</span>
			{:else}
				<span class="icon">▶️</span>
			{/if}
		</button>

		<button aria-label="Reset to top" class="control-button" on:click={resetScroll}>
			<span class="icon">⏮️</span>
		</button>
	</div>

	<div class="speed-control">
		<span class="speed-label">Slow</span>
		<input
			type="range"
			min="0.5"
			max="10"
			step="0.5"
			bind:value={scrollSpeed}
			on:change={handleSpeedChange}
		/>
		<span class="speed-label">Fast</span>
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
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.controls-row {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.control-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f0f0f0;
		transition: background-color 0.2s;
	}

	.control-button:hover {
		background-color: #e0e0e0;
	}

	.icon {
		font-size: 1.2rem;
	}

	.speed-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.speed-control input {
		flex: 1;
	}

	.speed-label {
		font-size: 0.8rem;
		color: #666;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.scroll-controls {
			background-color: rgba(30, 30, 30, 0.9);
		}

		.control-button {
			background-color: #333;
			color: #fff;
		}

		.control-button:hover {
			background-color: #444;
		}

		.speed-label {
			color: #aaa;
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.scroll-controls {
			padding: 0.5rem;
			width: 100%;
			box-sizing: border-box;
		}

		.control-button {
			width: 2.5rem;
			height: 2.5rem;
		}
	}
</style>
