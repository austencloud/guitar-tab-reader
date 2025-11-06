<script lang="ts">
	interface Props {
		content?: string;
		style?: string;
	}

	let { content = '', style = '' }: Props = $props();
</script>

<pre {style} class="tabscroll-tab-content">
  <code class="tabscroll-tab-code">{@html content}</code>
</pre>

<style>
	pre,
	.tabscroll-tab-content {
		margin: 0;
		tab-size: 4;
		white-space: pre; /* Prevent wrapping to maintain chord alignment */
		overflow-x: auto; /* Allow horizontal scrolling if needed */
		width: 100%;
		box-sizing: border-box;
	}

	code,
	.tabscroll-tab-code {
		display: block;
		width: 100%;
		max-width: none; /* Override any browser default max-width */
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		border: 0;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		white-space: inherit;
		overflow: visible; /* Ensure content isn't clipped */
	}
</style>
