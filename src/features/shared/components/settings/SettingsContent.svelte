<script lang="ts">
	import { TuningSelector } from '$features/tabs/components';
	import FontSizeAdjuster from './FontSizeAdjuster.svelte';
	import HandednessSelector from './HandednessSelector.svelte';
	import ChordDiagramToggle from './ChordDiagramToggle.svelte';
</script>

<div class="settings-content">
	<!-- Font Size Section -->
	<div class="setting-section">
		<FontSizeAdjuster />
	</div>

	<!-- Display Settings Section -->
	<div class="setting-section">
		<HandednessSelector />
		<ChordDiagramToggle />
		<div class="setting-row">
			<TuningSelector />
		</div>
	</div>
</div>

<style>
	.settings-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.setting-section {
		padding: var(--spacing-lg);
		background: var(--color-surface-low);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		transition: var(--transition-all);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.setting-section:hover {
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-sm);
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-lg);
		min-height: 48px;
	}

	@media (max-width: 600px) {
		.setting-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}
	}
</style>

