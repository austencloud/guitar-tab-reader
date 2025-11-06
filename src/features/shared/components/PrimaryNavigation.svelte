<!-- Utility Bar - Bottom/Side Navigation for Tools & Actions -->
<!-- Automatically adapts between bottom (portrait) and side (landscape) layouts -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Radio, PlusCircle, User } from 'lucide-svelte';

	let {
		currentSection = $bindable('tabs'),
		onAddTab,
		onOpenTuner,
		onOpenSettings,
		onOpenSessions
	} = $props<{
		currentSection?: string;
		onAddTab?: () => void;
		onOpenTuner?: () => void;
		onOpenSettings?: () => void;
		onOpenSessions?: () => void;
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
			id: 'sessions',
			label: 'Jam Session',
			compactLabel: 'Jam',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>`,
			color: '#e91e63',
			gradient: 'linear-gradient(135deg, #e91e63, #ec407a)',
			action: 'sessions'
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
		} else if (section.action === 'sessions') {
			onOpenSessions?.();
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
	class="utility-bar"
	class:layout-bottom={!isLandscape}
	class:layout-side={isLandscape}
	bind:this={navElement}
>
	<!-- Tuner Button (Left) -->
	<button class="utility-button tuner-button" onclick={onOpenTuner} aria-label="Open Tuner">
		<span class="button-icon">
			<Radio />
		</span>
		<span class="button-label">Tuner</span>
	</button>

	<!-- Add Tab Button (Center - Primary Action) -->
	<button class="utility-button add-button" onclick={onAddTab} aria-label="Add Tab">
		<span class="button-icon">
			<PlusCircle />
		</span>
		<span class="button-label">Add Tab</span>
	</button>

	<!-- Profile/Settings Button (Right) -->
	<button class="utility-button profile-button" onclick={onOpenSettings} aria-label="Profile & Settings">
		<span class="button-icon">
			<User />
		</span>
		<span class="button-label">Profile</span>
	</button>
</nav>

<style>
	/* ============================================================================
	   BASE UTILITY BAR STYLES
	   ============================================================================ */
	.utility-bar {
		position: fixed;
		display: flex;
		background: rgba(30, 30, 30, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 100;
		box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.3);
	}

	/* ============================================================================
	   BOTTOM LAYOUT (Portrait Mobile - Default)
	   ============================================================================ */
	.utility-bar.layout-bottom {
		bottom: 0;
		left: 0;
		right: 0;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		padding: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		/* Account for iOS safe area */
		padding-bottom: max(8px, env(safe-area-inset-bottom));
		min-height: 68px;
	}

	/* ============================================================================
	   SIDE LAYOUT (Landscape Mobile)
	   ============================================================================ */
	.utility-bar.layout-side {
		left: 0;
		top: 0;
		bottom: 0;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 8px 6px;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		width: 76px;
		/* Account for safe area on sides */
		padding-left: max(6px, env(safe-area-inset-left));
		min-height: 100vh;
	}

	/* ============================================================================
	   BUTTON STYLES
	   ============================================================================ */
	.utility-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		border: 1.5px solid transparent;
		border-radius: 14px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		-webkit-tap-highlight-color: transparent;
		user-select: none;
		-webkit-user-select: none;
		min-height: 44px;
		font-weight: 600;
		font-size: 11px;
	}

	/* Bottom layout - equal width buttons */
	.layout-bottom .utility-button {
		flex: 1;
		padding: 8px 12px;
	}

	/* Side layout - stacked buttons */
	.layout-side .utility-button {
		width: 60px;
		padding: 10px;
	}

	/* Tuner Button (Outlined, Purple) */
	.tuner-button {
		background: rgba(156, 39, 176, 0.1);
		border-color: rgba(156, 39, 176, 0.4);
		color: #ba68c8;
	}

	.tuner-button:hover {
		background: rgba(156, 39, 176, 0.2);
		border-color: rgba(156, 39, 176, 0.6);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
	}

	.tuner-button:active {
		transform: translateY(0);
	}

	/* Add Tab Button (Filled, Green - Primary Action) */
	.add-button {
		background: linear-gradient(135deg, #4caf50, #66bb6a);
		border-color: #4caf50;
		color: #ffffff;
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	.add-button:hover {
		background: linear-gradient(135deg, #66bb6a, #81c784);
		border-color: #66bb6a;
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
	}

	.add-button:active {
		transform: translateY(0) scale(1);
	}

	/* Profile Button (Outlined, White/Gray) */
	.profile-button {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.9);
	}

	.profile-button:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
	}

	.profile-button:active {
		transform: translateY(0);
	}

	/* Focus states */
	.utility-button:focus-visible {
		outline: 2px solid var(--color-focus, #4caf50);
		outline-offset: 3px;
	}

	/* Button Icon */
	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
	}

	.button-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
		stroke-width: 2;
	}

	/* Button Label */
	.button-label {
		line-height: 1.2;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	/* Hide labels in side layout (icon-only) */
	.layout-side .button-label {
		display: none;
	}

	/* ============================================================================
	   RESPONSIVE - HIDE LABELS ON SMALL SCREENS
	   ============================================================================ */
	@media (max-width: 380px) {
		.layout-bottom .button-label {
			display: none;
		}

		.layout-bottom .utility-button {
			gap: 0;
			padding: 10px 8px;
		}

		.layout-bottom .button-icon {
			width: 32px;
			height: 32px;
		}
	}

	/* ============================================================================
	   ACCESSIBILITY
	   ============================================================================ */
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.utility-bar {
			background: rgba(0, 0, 0, 0.98);
			border-color: rgba(255, 255, 255, 0.4);
		}

		.utility-bar.layout-bottom {
			border-top: 2px solid rgba(255, 255, 255, 0.5);
		}

		.utility-bar.layout-side {
			border-right: 2px solid rgba(255, 255, 255, 0.5);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.utility-button {
			transition: none;
		}

		.utility-button:active,
		.utility-button:hover {
			transform: none;
		}
	}

	/* Touch device optimizations */
	@media (hover: none) and (pointer: coarse) {
		.utility-button:hover {
			transform: none;
		}
	}
</style>
