<script lang="ts">
	export let content: string;
	export let fontSize: number = 14;

	let container: HTMLDivElement;

	// Explicitly expose the container element to parent components
	export { container };
</script>

<div class="tab-viewer" bind:this={container} style="--font-size: {fontSize}px;">
	<pre><code>{content}</code></pre>
</div>

<style>
	.tab-viewer {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: auto;
		background-color: #f5f5f5;
		border-radius: 4px;
		padding: 1rem;
	}

	pre {
		font-family: 'Courier New', monospace;
		font-size: var(--font-size);
		white-space: pre-wrap;
		margin: 0;
		tab-size: 4;
	}

	code {
		display: block;
		line-height: 1.5;
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-viewer {
			padding: 0.5rem;
			touch-action: pan-y;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.tab-viewer {
			background-color: #1e1e1e;
			color: #e0e0e0;
		}
	}
</style>
