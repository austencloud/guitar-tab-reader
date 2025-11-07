<script lang="ts">
	import type { SignalStrength } from '../services/SignalProcessor';
	import { Volume, Volume1, Volume2, VolumeX } from 'lucide-svelte';

	interface Props {
		strength: SignalStrength;
		percentage: number;
	}

	let { strength, percentage }: Props = $props();

	const signalMessages = {
		'too-quiet': 'Too quiet - play louder',
		quiet: 'Signal weak',
		good: 'Good signal',
		loud: 'Signal strong',
		'too-loud': 'Too loud - reduce volume'
	};

	const signalColors = {
		'too-quiet': 'var(--color-error)',
		quiet: 'var(--color-warning)',
		good: 'var(--color-success)',
		loud: 'var(--color-info)',
		'too-loud': 'var(--color-error)'
	};

	const IconComponent = $derived(
		strength === 'too-quiet'
			? VolumeX
			: strength === 'quiet'
				? Volume
				: strength === 'good'
					? Volume1
					: Volume2
	);
</script>

<div class="signal-strength-meter" style="--signal-color: {signalColors[strength]}">
	<div class="signal-header">
		<IconComponent size={16} class="signal-icon" />
		<span class="signal-label">{signalMessages[strength]}</span>
	</div>

	<div class="signal-bar-container">
		<div class="signal-bar" style="width: {percentage}%"></div>
	</div>
</div>

<style>
	.signal-strength-meter {
		width: 100%;
		padding: var(--spacing-sm);
		background: var(--color-surface-low);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.signal-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
		color: var(--signal-color);
	}

	.signal-header :global(.signal-icon) {
		flex-shrink: 0;
	}

	.signal-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
	}

	.signal-bar-container {
		width: 100%;
		height: 6px;
		background: var(--color-surface);
		border-radius: var(--radius-full);
		overflow: hidden;
		box-shadow: inset var(--shadow-sm);
	}

	.signal-bar {
		height: 100%;
		background: var(--signal-color);
		transition: width 0.3s ease, background-color 0.2s ease;
		border-radius: var(--radius-full);
		box-shadow: 0 0 8px var(--signal-color);
	}

	/* Compact mode for small screens */
	@media (max-width: 380px), (max-height: 500px) {
		.signal-strength-meter {
			padding: var(--spacing-xs);
		}

		.signal-label {
			font-size: 0.65rem;
		}
	}
</style>
