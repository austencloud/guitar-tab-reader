<script lang="ts">
	let { children } = $props();
	let mounted = $state(false);

	$effect(() => {
		// Force a microtask delay to ensure we're completely client-side
		Promise.resolve().then(() => {
			mounted = true;
		});
	});
</script>

{#if mounted}
	{@render children()}
{/if}
