<script lang="ts">
	import TabEditor from '$lib/components/TabEditor.svelte';
	import { goto } from '$app/navigation';

	function handleSaved(event: CustomEvent<{ id: string }>) {
		// Navigate to the newly created tab
		goto(`/tab/${event.detail.id}`);
	}

	function handleCanceled() {
		// Go back to home page
		goto('/');
	}
</script>

<svelte:head>
	<title>Create New Tab | TabScroll</title>
</svelte:head>

<div class="container">
	<h1>Create New Tab</h1>

	<TabEditor on:saved={handleSaved} on:canceled={handleCanceled} />
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		margin-bottom: 2rem;
		text-align: center;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}

		.container {
			padding: 0.5rem;
		}
	}
</style>
