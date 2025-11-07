<!-- Modern 2025 Navigation - Clean Icon-Based Design -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { LayoutGrid, Music2, Radio, Settings } from 'lucide-svelte';

	let {
		currentSection = $bindable('tabs'),
		onAddTab,
		onOpenSettings,
		isHeaderVisible = true
	} = $props<{
		currentSection?: string;
		onAddTab?: () => void;
		onOpenSettings?: () => void;
		isHeaderVisible?: boolean;
	}>();

	// Navigation items with modern lucide icons
	const navItems = [
		{
			id: 'play',
			label: 'Play',
			icon: LayoutGrid,
			color: '#10b981',
			href: '/'
		},
		{
			id: 'jam',
			label: 'Jam',
			icon: Music2,
			color: '#ec4899',
			href: '/jam'
		},
		{
			id: 'tuner',
			label: 'Tune',
			icon: Radio,
			color: '#f59e0b',
			href: '/tuner'
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: Settings,
			color: '#8b5cf6',
			action: 'settings'
		}
	];

	function handleTap(item: (typeof navItems)[number]) {
		if (item.action === 'add') {
			onAddTab?.();
		} else if (item.action === 'settings') {
			onOpenSettings?.();
		} else if (item.href) {
			currentSection = item.id;
			goto(item.href);
		}
	}
</script>

<nav class="modern-nav" class:nav-hidden={isHeaderVisible === false}>
	{#each navItems as item}
		{@const Icon = item.icon}
		<button
			class="nav-item"
			class:active={currentSection === item.id}
			onclick={() => handleTap(item)}
			aria-label={item.label}
			style="--item-color: {item.color}"
		>
			<span class="icon">
				<Icon size={24} strokeWidth={2.5} />
			</span>
			<span class="label">{item.label}</span>
		</button>
	{/each}
</nav>

<style>
	.modern-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0.375rem 0.5rem;
		padding-bottom: max(0.375rem, env(safe-area-inset-bottom));
		background: rgba(15, 15, 15, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 100;
		gap: 0.125rem;
		transform: translateY(0);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.modern-nav.nav-hidden {
		transform: translateY(100%);
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		padding: 0.625rem 0.875rem;
		background: transparent;
		border: none;
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		-webkit-tap-highlight-color: transparent;
		user-select: none;
		min-width: 64px;
		min-height: 56px;
		position: relative;
		flex: 1;
		max-width: 80px;
	}



	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		color: rgba(255, 255, 255, 0.6);
	}

	.label {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		line-height: 1;
	}

	/* Hover state */
	.nav-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.9);
	}

	.nav-item:hover .icon {
		color: var(--item-color);
		transform: translateY(-1px);
	}

	/* Active state */
	.nav-item.active {
		color: var(--item-color);
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-item.active .icon {
		color: var(--item-color);
		filter: drop-shadow(0 0 8px var(--item-color));
	}

	.nav-item.active .label {
		color: var(--item-color);
	}

	/* Active indicator dot */
	.nav-item.active::before {
		content: '';
		position: absolute;
		top: 0.25rem;
		width: 4px;
		height: 4px;
		background: var(--item-color);
		border-radius: 50%;
		box-shadow: 0 0 8px var(--item-color);
	}

	/* Press state */
	.nav-item:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.05);
	}

	/* Focus visible */
	.nav-item:focus-visible {
		outline: 2px solid var(--item-color);
		outline-offset: 2px;
	}

	/* Responsive - adjust for very small screens */
	@media (max-width: 360px) {
		.label {
			font-size: 0.625rem;
		}

		.nav-item {
			min-width: 56px;
			padding: 0.5rem 0.625rem;
			gap: 0.0625rem;
		}

		.icon {
			width: 24px;
			height: 24px;
		}
	}

	/* Larger screens - more comfortable spacing */
	@media (min-width: 640px) {
		.modern-nav {
			padding: 0.5rem 1rem;
			gap: 0.5rem;
		}

		.nav-item {
			min-width: 72px;
			max-width: 96px;
			padding: 0.75rem 1rem;
			gap: 0.25rem;
		}

		.icon {
			width: 32px;
			height: 32px;
		}

		.label {
			font-size: 0.75rem;
		}


	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.nav-item,
		.icon,
		.label {
			transition: none;
		}

		.nav-item:hover .icon {
			transform: none;
		}

		.nav-item:active {
			transform: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modern-nav {
			background: rgba(0, 0, 0, 0.95);
			border-top: 2px solid rgba(255, 255, 255, 0.3);
		}

		.nav-item.active {
			background: rgba(255, 255, 255, 0.2);
		}
	}
</style>

