<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Tab } from '$lib/state/tabs.svelte';

	interface Props {
		tab: Tab;
		index: number;
		onselect: (id: string) => void;
	}

	let { tab, index, onselect }: Props = $props();

	function handleClick() {
		onselect(tab.id);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			onselect(tab.id);
		}
	}
</script>

<div
	class="tab-item"
	transition:fade={{ duration: 150 }}
	style="--delay: {index * 50}ms"
	onclick={handleClick}
	onkeydown={handleKeydown}
	tabindex="0"
	role="button"
	aria-label="Open tab: {tab.title} by {tab.artist || 'Unknown Artist'}"
>
	<div class="tab-info">
		<div class="tab-title">{tab.title}</div>
		<div class="tab-artist">{tab.artist || 'Unknown Artist'}</div>
	</div>
	<div class="tab-date">
		{new Date(tab.updatedAt ?? 0).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})}
	</div>
</div>

<style>
	.tab-item {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--spacing-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		background: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: var(--transition-all);
		animation: fadeIn 0.3s ease forwards;
		animation-delay: var(--delay);
		opacity: 0;
		min-height: var(--touch-target-comfortable);
		align-items: center;
		box-shadow: var(--shadow-sm);
	}

	.tab-item:hover {
		background-color: var(--color-surface-high);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary);
	}

	.tab-item:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.tab-item:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tab-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		min-width: 0;
	}

	.tab-title {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-artist {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-style: italic;
	}

	.tab-date {
		color: var(--color-text-tertiary);
		text-align: right;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		flex-shrink: 0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Tablet breakpoint - 768px */
	@media (max-width: 768px) {
		.tab-item {
			padding: var(--spacing-md);
		}
	}

	/* Mobile breakpoint - 480px */
	@media (max-width: 480px) {
		.tab-item {
			padding: var(--spacing-sm) var(--spacing-md);
			margin-bottom: 0.25rem;
			border-radius: var(--radius-md);
		}

		.tab-date {
			display: none;
		}

		.tab-title {
			font-size: var(--font-size-sm);
		}

		.tab-artist {
			font-size: var(--font-size-xs);
		}
	}

	/* Extra small devices - 360px */
	@media (max-width: 360px) {
		.tab-title {
			font-size: 0.8125rem;
		}

		.tab-artist {
			font-size: 0.625rem;
		}
	}
</style>
