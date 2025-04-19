<script lang="ts">
	import '../app.css';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();
	let settingsOpen = $state(false);

	function toggleSettings() {
		settingsOpen = !settingsOpen;
	}
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
	<header class="app-header">
		<div class="logo-area">
			<svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path
					d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 10.5h-1V15H9.5v-1.5h-3V9H8v3h1.5V9H11v3h1v1.5zm6 1.5h-1.75l-1.75-2.25V15H13V9h1.5v2.25L16.25 9H18l-2.25 3L18 15z"
				/>
			</svg>
			<h1 class="app-title">Guitar Tab Reader</h1>
		</div>
		<div class="app-actions">
			<SettingsButton on:click={toggleSettings} />
		</div>
	</header>

	<div class="content-wrapper">
		{@render children()}
	</div>
</div>

<SettingsModal bind:open={settingsOpen} />

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
		display: flex;
		flex-direction: column;
		background: linear-gradient(to bottom right, #f9f9f9, #e9e9e9);
	}

	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #ddd;
		background-color: #fff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		width: 1.75rem;
		height: 1.75rem;
		fill: #4caf50;
	}

	.app-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.app-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.content-wrapper {
		width: 100%;
		max-width: 900px;
		padding: 1rem;
		margin: 0 auto;
		flex: 1;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		:global(body) {
			background-color: #1a1a1a;
			color: #eee;
		}

		.app-container {
			background: linear-gradient(to bottom right, #1a1a1a, #252525);
		}

		.app-header {
			background-color: #1a1a1a;
			border-color: #333;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}

		.logo-icon {
			fill: #66bb6a;
		}
	}

	/* Mobile optimization */
	@media (max-width: 600px) {
		.app-title {
			font-size: 1.1rem;
		}
	}
</style>
