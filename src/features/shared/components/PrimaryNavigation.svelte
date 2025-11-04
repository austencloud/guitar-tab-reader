<!-- Primary Navigation - Responsive Bottom/Side Navigation -->
<!-- Automatically adapts between bottom (portrait) and side (landscape) layouts -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let {
		currentSection = $bindable('tabs'),
		onAddTab,
		onOpenTuner,
		onOpenSettings
	} = $props<{
		currentSection?: string;
		onAddTab?: () => void;
		onOpenTuner?: () => void;
		onOpenSettings?: () => void;
	}>();

	// Layout state - detect landscape orientation
	let isLandscape = $state(false);
	let navElement = $state<HTMLElement | null>(null);

	// Navigation sections
	const sections = [
		{
			id: 'tabs',
			label: 'My Tabs',
			compactLabel: 'Tabs',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
			color: '#4caf50',
			gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)',
			href: '/'
		},
		{
			id: 'add',
			label: 'Add Tab',
			compactLabel: 'Add',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
			color: '#2196f3',
			gradient: 'linear-gradient(135deg, #2196f3, #42a5f5)',
			action: 'add'
		},
		{
			id: 'tuner',
			label: 'Tuner',
			compactLabel: 'Tune',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9h3c0-3.31 2.69-6 6-6s6 2.69 6 6h3a9 9 0 0 0-9-9zm3.14 12a3.01 3.01 0 0 1-2.14.9 3 3 0 0 1-3-3 2.97 2.97 0 0 1 .9-2.14L12 8.07l1.14 2.69c.58.59.9 1.35.9 2.14a2.99 2.99 0 0 1-.9 2.1z"/></svg>`,
			color: '#ff9800',
			gradient: 'linear-gradient(135deg, #ff9800, #ffa726)',
			action: 'tuner'
		}
	];

	// Handle section tap
	function handleSectionTap(section: (typeof sections)[number]) {
		if (section.action === 'add') {
			onAddTab?.();
		} else if (section.action === 'tuner') {
			onOpenTuner?.();
		} else if (section.href) {
			currentSection = section.id;
			goto(section.href);
		}
	}

	// Handle settings tap
	function handleSettingsTap() {
		onOpenSettings?.();
	}

	// Update layout based on orientation
	function updateLayout() {
		if (typeof window !== 'undefined') {
			isLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches;
		}
	}

	// Detect current section from page URL
	$effect(() => {
		const url = $page.url.pathname;
		if (url === '/') {
			currentSection = 'tabs';
		} else if (url.startsWith('/tab/')) {
			currentSection = 'tabs';
		} else if (url === '/tuner') {
			currentSection = 'tuner';
		}
	});

	onMount(() => {
		updateLayout();

		// Listen for orientation changes
		const mediaQuery = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
		const handleChange = () => updateLayout();
		mediaQuery.addEventListener('change', handleChange);

		// Also listen for resize events
		window.addEventListener('resize', updateLayout);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
			window.removeEventListener('resize', updateLayout);
		};
	});
</script>

<nav
	class="primary-navigation"
	class:layout-bottom={!isLandscape}
	class:layout-side={isLandscape}
	bind:this={navElement}
>
	<!-- Navigation Sections (includes settings at the right) -->
	<div class="sections">
		{#each sections as section}
			<button
				class="nav-button"
				class:active={currentSection === section.id}
				onclick={() => handleSectionTap(section)}
				aria-label={section.label}
				aria-current={currentSection === section.id ? 'page' : undefined}
				style="--section-color: {section.color}; --section-gradient: {section.gradient};"
			>
				<span class="nav-icon">{@html section.icon}</span>
				<span class="nav-label nav-label-full">{section.label}</span>
				<span class="nav-label nav-label-compact">{section.compactLabel}</span>
			</button>
		{/each}

		<!-- Settings Button (Right side) -->
		<button
			class="nav-button settings-button"
			onclick={handleSettingsTap}
			aria-label="Settings"
		>
			<span class="nav-icon">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
					/>
				</svg>
			</span>
			<span class="nav-label nav-label-full">Settings</span>
			<span class="nav-label nav-label-compact">Set</span>
		</button>
	</div>
</nav>

<style>
	/* ============================================================================
	   BASE PRIMARY NAVIGATION STYLES
	   ============================================================================ */
	.primary-navigation {
		position: fixed;
		display: flex;
		background: rgba(30, 30, 30, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 100;
		box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.3);
	}

	/* ============================================================================
	   BOTTOM LAYOUT (Portrait Mobile)
	   ============================================================================ */
	.primary-navigation.layout-bottom {
		bottom: 0;
		left: 0;
		right: 0;
		flex-direction: row;
		align-items: center;
		padding: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		/* Account for iOS safe area */
		padding-bottom: max(8px, env(safe-area-inset-bottom));
		min-height: 68px;

		/* Enable container queries for responsive labels */
		container-type: inline-size;
		container-name: primary-nav;
	}

	/* ============================================================================
	   SIDE LAYOUT (Landscape Mobile)
	   ============================================================================ */
	.primary-navigation.layout-side {
		left: 0;
		top: 0;
		bottom: 0;
		flex-direction: column;
		align-items: center;
		padding: 8px 6px;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		width: 76px;
		/* Account for safe area on sides */
		padding-left: max(6px, env(safe-area-inset-left));
		min-height: 100vh;
	}

	/* ============================================================================
	   SECTIONS CONTAINER
	   ============================================================================ */
	/* Bottom layout - horizontal sections with settings at right */
	.layout-bottom .sections {
		display: flex;
		flex-direction: row;
		gap: 6px;
		flex: 1;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	/* Side layout - vertical sections */
	.layout-side .sections {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
		justify-content: center;
		align-items: center;
		width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		/* Hide scrollbar but keep functionality */
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.layout-side .sections::-webkit-scrollbar {
		display: none;
	}

	/* ============================================================================
	   BUTTON STYLES
	   ============================================================================ */
	/* Base button styles */
	.nav-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
		-webkit-user-select: none;
	}

	/* Bottom layout - flexible sizing based on available space */
	.layout-bottom .nav-button {
		padding: 8px;
		min-width: 44px;
		min-height: 44px;
		flex: 1 1 0;
		border-radius: 14px;
	}

	/* Settings button in bottom layout - positioned at right */
	.layout-bottom .settings-button {
		flex: 0 1 auto;
		max-width: 64px;
	}

	/* Side layout - icon-only buttons */
	.layout-side .nav-button {
		padding: 10px;
		min-width: 56px;
		min-height: 56px;
		width: 60px;
		flex: 0 0 auto;
		border-radius: 14px;
	}

	/* Settings button circular style in side layout */
	.layout-side .settings-button {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		min-width: 48px;
		min-height: 48px;
		padding: 0;
		border-radius: 50%;
	}

	.nav-button:hover:not(:active) {
		background: rgba(255, 255, 255, 0.12);
		transform: scale(1.05);
	}

	.nav-button:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.08);
	}

	.nav-button.active {
		color: rgba(255, 255, 255, 1);
		background: rgba(255, 255, 255, 0.15);
	}

	/* Settings button hover - match circular style */
	.settings-button:hover:not(:active) {
		background: rgba(255, 255, 255, 0.12);
		transform: scale(1.05);
	}

	.nav-button:focus-visible {
		outline: 2px solid var(--color-focus, #4caf50);
		outline-offset: 3px;
	}

	.nav-icon {
		font-size: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		width: 26px;
		height: 26px;
	}

	.nav-icon svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	/* Color gradient for section icons */
	.nav-button:not(.settings-button) .nav-icon {
		color: var(--section-color);
		filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.3));
	}

	/* Inactive buttons have reduced opacity */
	.nav-button:not(.active):not(.settings-button) .nav-icon {
		opacity: 0.5;
	}

	.nav-button:hover:not(.settings-button) .nav-icon {
		opacity: 0.9;
		filter: drop-shadow(0 0 10px var(--section-color));
	}

	/* Active button has full color and glow */
	.nav-button.active:not(.settings-button) .nav-icon {
		opacity: 1;
		filter: drop-shadow(0 0 12px var(--section-color)) brightness(1.15);
	}

	/* Settings icon styling */
	.settings-button .nav-icon {
		color: rgba(255, 255, 255, 0.7);
	}

	.settings-button:hover .nav-icon {
		color: rgba(255, 255, 255, 0.95);
	}

	/* ============================================================================
	   LABEL SYSTEM
	   ============================================================================ */
	.nav-label {
		font-size: 11px;
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}

	/* Labels hidden by default */
	.nav-label-full,
	.nav-label-compact {
		display: none;
	}

	/* Side layout - always hide labels (icon-only) */
	.layout-side .nav-label {
		display: none !important;
	}

	/*
	  Bottom Layout Container Query Breakpoints:
	  Intelligent responsive sizing based on available space
	*/

	/* Full labels mode (spacious - 450px+) */
	@container primary-nav (min-width: 450px) {
		.layout-bottom .nav-label-full {
			display: block;
		}

		.layout-bottom .nav-button {
			gap: 4px;
			padding: 8px 12px;
		}

		.layout-bottom .nav-label {
			font-size: 12px;
		}

		.layout-bottom .settings-button {
			max-width: 80px;
		}
	}

	/* Compact labels mode (medium - 350px to 449px) */
	@container primary-nav (min-width: 350px) and (max-width: 449px) {
		.layout-bottom .nav-label-compact {
			display: block;
		}

		.layout-bottom .nav-button {
			gap: 3px;
			padding: 8px 6px;
		}

		.layout-bottom .nav-label {
			font-size: 11px;
		}

		.layout-bottom .nav-icon {
			font-size: 22px;
			width: 24px;
			height: 24px;
		}

		.layout-bottom .settings-button {
			max-width: 60px;
		}
	}

	/* Icon-only mode (compact - below 350px) */
	@container primary-nav (max-width: 349px) {
		.layout-bottom .nav-button {
			gap: 2px;
			padding: 6px;
			min-width: 48px;
		}

		.layout-bottom .nav-icon {
			font-size: 22px;
			width: 24px;
			height: 24px;
		}

		.layout-bottom .settings-button {
			max-width: 52px;
		}
	}

	/* Fallback for browsers without container query support */
	@supports not (container-type: inline-size) {
		/* Use viewport-based media queries as fallback */

		/* Full labels */
		@media (min-width: 450px) {
			.layout-bottom .nav-label-full {
				display: block;
			}

			.layout-bottom .nav-button {
				gap: 4px;
				padding: 8px 12px;
			}

			.layout-bottom .settings-button {
				max-width: 80px;
			}
		}

		/* Compact labels */
		@media (min-width: 350px) and (max-width: 449px) {
			.layout-bottom .nav-label-compact {
				display: block;
			}

			.layout-bottom .nav-button {
				gap: 3px;
				padding: 8px 6px;
			}

			.layout-bottom .nav-label {
				font-size: 11px;
			}

			.layout-bottom .nav-icon {
				font-size: 22px;
			}

			.layout-bottom .settings-button {
				max-width: 60px;
			}
		}

		/* Icon-only */
		@media (max-width: 349px) {
			.layout-bottom .nav-button {
				padding: 6px;
				min-width: 48px;
			}

			.layout-bottom .nav-icon {
				font-size: 22px;
			}

			.layout-bottom .settings-button {
				max-width: 52px;
			}
		}
	}

	/* ============================================================================
	   ACCESSIBILITY
	   ============================================================================ */
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.primary-navigation {
			background: rgba(0, 0, 0, 0.98);
			border-color: rgba(255, 255, 255, 0.4);
		}

		.primary-navigation.layout-bottom {
			border-top: 2px solid rgba(255, 255, 255, 0.5);
		}

		.primary-navigation.layout-side {
			border-right: 2px solid rgba(255, 255, 255, 0.5);
		}

		.nav-button.active {
			background: rgba(255, 255, 255, 0.35);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.nav-button {
			transition: none;
		}

		.nav-button:active {
			transform: none;
		}

		.nav-icon {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (hover: none) and (pointer: coarse) {
		.nav-button:hover {
			transform: none;
			background: transparent;
		}

		.nav-button.active {
			background: rgba(255, 255, 255, 0.15);
		}
	}
</style>
