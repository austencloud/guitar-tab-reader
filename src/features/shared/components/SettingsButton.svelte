<script lang="ts">
	interface Props {
		onclick?: () => void;
	}

	let { onclick }: Props = $props();

	let hovered = $state(false);
	let rotation = $state(0);
	let animationFrame: number | null = null;
	let velocity = $state(0);

	// Spring animation constants
	const STIFFNESS = 0.1;
	const DAMPING = 0.25;

	// Spring physics animation
	function animateSpring(target: number) {
		function animate() {
			const delta = target - rotation;
			const springForce = delta * STIFFNESS;
			velocity += springForce;
			velocity *= DAMPING;
			rotation += velocity;

			// Continue animation if there's still movement
			if (Math.abs(velocity) > 0.01 || Math.abs(delta) > 0.01) {
				animationFrame = requestAnimationFrame(animate);
			} else {
				rotation = target;
				velocity = 0;
			}
		}

		if (animationFrame !== null) {
			cancelAnimationFrame(animationFrame);
		}
		animationFrame = requestAnimationFrame(animate);
	}

	$effect(() => {
		animateSpring(hovered ? 45 : 0);

		return () => {
			if (animationFrame !== null) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});

	function handleClick() {
		onclick?.();
	}
</script>

<button
	class="settings-button"
	onclick={handleClick}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
	aria-label="Settings"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style="transform: rotate({rotation}deg);"
	>
		<path
			fill="currentColor"
			d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
		/>
	</svg>
</button>

<style>
	.settings-button {
		background-color: var(--color-primary);
		border: none;
		color: var(--color-text-inverse);
		cursor: pointer;
		padding: var(--spacing-sm);
		border-radius: var(--radius-full);
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-sm);
		transition: var(--transition-all);
	}

	.settings-button:hover {
		background-color: var(--color-primary-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.settings-button:active {
		background-color: var(--color-primary-active);
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.settings-button:focus {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Mobile optimization */
	@media (max-width: 600px) {
		.settings-button {
			width: 2.25rem;
			height: 2.25rem;
			padding: var(--spacing-xs);
		}
	}
</style>
