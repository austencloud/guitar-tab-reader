<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();
	let mounted = $state(false);

	onMount(() => {
		// Force a microtask delay to ensure we're completely client-side
		Promise.resolve().then(() => {
			mounted = true;
		});
	});
</script>

{#if mounted}
	{@render children()}
{/if}
