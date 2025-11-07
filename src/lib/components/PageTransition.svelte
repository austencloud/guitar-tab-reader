<script lang="ts">
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	// Use SvelteKit's native onNavigate for View Transitions API support
	// This provides automatic cross-fade with modern browser support
	onNavigate((navigation) => {
		// Check if browser supports View Transitions API
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<div class="page-transition-wrapper">
	{@render children()}
</div>

<style>
	.page-transition-wrapper {
		width: 100%;
		height: 100%;
	}

	/* ===== VIEW TRANSITIONS API STYLES ===== */
	/* Modern 2025 page transitions using native browser API */

	/* Default cross-fade for all pages */
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation-duration: 0.3s;
		animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* Outgoing page - fade out with subtle scale down */
	:global(::view-transition-old(root)) {
		animation-name: fade-scale-out;
	}

	/* Incoming page - fade in with subtle scale and slide up */
	:global(::view-transition-new(root)) {
		animation-name: fade-scale-in;
	}

	@keyframes fade-scale-out {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.98);
		}
	}

	@keyframes fade-scale-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Fallback for browsers without View Transitions API */
	/* This creates a subtle fade effect using CSS transitions */
	@supports not (view-transition-name: root) {
		.page-transition-wrapper {
			animation: fallback-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		}

		@keyframes fallback-fade-in {
			from {
				opacity: 0;
				transform: translateY(8px) scale(0.98);
			}
			to {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}
	}

	/* ===== ACCESSIBILITY ===== */
	/* Respect reduced motion preferences - critical for accessibility */
	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(root)),
		:global(::view-transition-new(root)) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			animation-delay: 0s !important;
		}

		.page-transition-wrapper {
			animation: none !important;
		}
	}
</style>
