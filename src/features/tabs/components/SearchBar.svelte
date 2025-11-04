<script lang="ts">
	interface Props {
		value: string;
		onchange: (value: string) => void;
	}

	let { value = $bindable(''), onchange }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		onchange(value);
	}
</script>

<div class="search-container">
	<input
		type="search"
		placeholder="Search tabs..."
		{value}
		oninput={handleInput}
		aria-label="Search tabs"
	/>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="20"
		height="20"
		class="search-icon"
	>
		<path
			d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
		/>
	</svg>
</div>

<style>
	.search-container {
		position: relative;
		flex: 1;
	}

	input[type='search'] {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		background-color: var(--color-background);
		color: var(--color-text-primary);
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	input[type='search']:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow:
			0 0 0 3px var(--color-primary-dim),
			var(--glow-primary);
		transform: translateY(-1px);
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		fill: var(--color-text-tertiary);
		transition: var(--transition-colors);
		pointer-events: none;
	}

	input[type='search']:focus + .search-icon {
		fill: var(--color-primary);
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		input[type='search'] {
			padding: 0.75rem 0.875rem 0.75rem 2.5rem;
			font-size: var(--font-size-sm);
		}

		.search-icon {
			left: 0.75rem;
			width: 18px;
			height: 18px;
		}
	}
</style>
