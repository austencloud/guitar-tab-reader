<script lang="ts">
	interface Props {
		content?: string;
		style?: string;
	}

	let { content = '', style = '' }: Props = $props();
</script>

<pre {style}>
  <code>{@html content}</code>
</pre>

<style>
	pre {
		margin: 0;
		tab-size: 4;
		white-space: pre-wrap; /* Ensure wrapping */
		word-wrap: break-word; /* Ensure long lines break */
	}
</style>
