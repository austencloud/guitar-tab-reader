<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { spring } from 'svelte/motion';

	const dispatch = createEventDispatcher<{
		click: void;
	}>();

	let hovered = false;

	const rotation = spring(0, {
		stiffness: 0.1,
		damping: 0.25
	});

	$: if (hovered) {
		rotation.set(45);
	} else {
		rotation.set(0);
	}

	function handleClick() {
		dispatch('click');
	}
</script>

<button
	class="settings-button"
	on:click={handleClick}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
	aria-label="Settings"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style="transform: rotate({$rotation}deg);"
	>
		<path
			fill="currentColor"
			d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
		/>
	</svg>
</button>

<style>
	.settings-button {
		background-color: #4caf50;
		border: none;
		color: white;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
	}

	.settings-button:hover {
		background-color: #45a049;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.settings-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	@media (prefers-color-scheme: dark) {
		.settings-button {
			background-color: #388e3c;
		}

		.settings-button:hover {
			background-color: #2e7d32;
		}
	}

	/* Mobile optimization */
	@media (max-width: 600px) {
		.settings-button {
			width: 2.25rem;
			height: 2.25rem;
			padding: 0.4rem;
		}
	}
</style>
