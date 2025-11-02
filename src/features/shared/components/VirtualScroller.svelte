<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props<T> {
		items: T[];
		itemHeight: number;
		containerHeight: number;
		overscan?: number;
		renderItem: Snippet<[T, number]>;
	}

	let { items, itemHeight, containerHeight, overscan = 5, renderItem }: Props<unknown> = $props();

	let scrollTop = $state(0);
	let containerElement: HTMLDivElement;

	// Calculate visible range
	const visibleRange = $derived(() => {
		const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const visibleCount = Math.ceil(containerHeight / itemHeight);
		const end = Math.min(items.length, start + visibleCount + overscan * 2);
		return { start, end };
	});

	// Calculate total height
	const totalHeight = $derived(items.length * itemHeight);

	// Calculate offset for visible items
	const offsetY = $derived(visibleRange().start * itemHeight);

	// Get visible items
	const visibleItems = $derived(
		items.slice(visibleRange().start, visibleRange().end).map((item, index) => ({
			item,
			index: visibleRange().start + index
		}))
	);

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	// Scroll to specific item
	export function scrollToItem(index: number) {
		if (containerElement) {
			const targetScrollTop = index * itemHeight;
			containerElement.scrollTop = targetScrollTop;
		}
	}

	// Get current scroll position as item index
	export function getCurrentIndex(): number {
		return Math.floor(scrollTop / itemHeight);
	}
</script>

<div
	bind:this={containerElement}
	class="virtual-scroller"
	style:height="{containerHeight}px"
	onscroll={handleScroll}
	role="list"
	aria-label="Virtual scrolled list"
>
	<div class="virtual-scroller-content" style:height="{totalHeight}px">
		<div class="virtual-scroller-items" style:transform="translateY({offsetY}px)">
			{#each visibleItems as { item, index } (index)}
				<div
					class="virtual-scroller-item"
					style:height="{itemHeight}px"
					role="listitem"
					aria-setsize={items.length}
					aria-posinset={index + 1}
				>
					{@render renderItem(item, index)}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-scroller {
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}

	.virtual-scroller::-webkit-scrollbar {
		width: 8px;
	}

	.virtual-scroller::-webkit-scrollbar-track {
		background: transparent;
	}

	.virtual-scroller::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-full);
	}

	.virtual-scroller::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary);
	}

	.virtual-scroller-content {
		position: relative;
		width: 100%;
	}

	.virtual-scroller-items {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
	}

	.virtual-scroller-item {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	/* Smooth scrolling for better UX */
	@media (prefers-reduced-motion: no-preference) {
		.virtual-scroller {
			scroll-behavior: smooth;
		}
	}

	/* Focus styles for accessibility */
	.virtual-scroller:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.virtual-scroller-item:focus-within {
		background: var(--color-surface-variant);
		outline: 1px solid var(--color-primary);
		outline-offset: -1px;
	}
</style>
