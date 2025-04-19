<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
	/>
	<meta name="theme-color" content="#4caf50" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<div class="app-container">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		background-color: #f9f9f9;
		color: #333;
		overscroll-behavior: none;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app-container {
		width: 100%;
		min-height: 100vh;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		:global(body) {
			background-color: #1a1a1a;
			color: #eee;
		}
	}
</style>
