<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { tabs } from '$lib/stores/tabs';
	import { goto } from '$app/navigation';
	import TabEditor from '$lib/components/TabEditor.svelte';

	let currentTab = null;

	$: id = $page.params.id;
	$: currentTab = $tabs.find((tab) => tab.id === id);

	function handleSaved(event: CustomEvent<{ id: string }>) {
		goto(`/tab/${event.detail.id}`);
	}

	function handleCanceled() {
		goto(`/tab/${id}`);
	}
</script>

<svelte:head>
	<title>Edit {currentTab?.title || 'Tab'} | TabScroll</title>
</svelte:head>

{#if currentTab}
	<div class="container">
		<h1>Edit Tab</h1>

		<TabEditor
			id={currentTab.id}
			title={currentTab.title}
			content={currentTab.content}
			on:saved={handleSaved}
			on:canceled={handleCanceled}
		/>
	</div>
{:else}
	<div class="not-found">
		<h1>Tab Not Found</h1>
		<p>Sorry, the tab you're looking for doesn't exist or has been deleted.</p>
		<button on:click={() => goto('/')}>Back to Home</button>
	</div>
{/if}

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

	.not-found {
		padding: 2rem;
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	.not-found button {
		padding: 0.75rem 1.5rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 1rem;
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
