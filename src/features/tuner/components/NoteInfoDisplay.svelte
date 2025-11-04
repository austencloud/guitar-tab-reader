<script lang="ts">
	import type { StringDefinition } from '../services/types';

	interface Props {
		closestString?: StringDefinition | null;
		statusMessage?: string;
		isCurrentlyTuned?: boolean;
	}

	let { closestString = null, statusMessage = '', isCurrentlyTuned = false }: Props = $props();
</script>

<div class="note-info">
	{#if closestString}
		<span class="string-label">String {closestString.string}</span>
		<div class="note-name-wrapper">
			<span class="note-name">{closestString.note}{closestString.octave}</span>
		</div>
		<span class="frequency">{closestString.frequency.toFixed(1)}Hz</span>
	{:else}
		<span class="string-label">{statusMessage || 'Select a string'}</span>
		<div class="note-name-wrapper">
			<span class="note-name empty">--</span>
		</div>
		<span class="frequency">0.0Hz</span>
	{/if}
	<div class="perfect-indicator-wrapper">
		<span class="perfect-indicator" class:active={isCurrentlyTuned}> ✓ Perfect! </span>
	</div>
</div>

<style>
	.note-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: clamp(0.75rem, 2vw, 1.5rem);
		min-height: clamp(100px, 20vh, 140px);
		justify-content: center;
		padding: clamp(8px, 2vw, 12px);
	}

	.string-label {
		font-size: clamp(0.75rem, 2vw, 0.875rem);
		color: #78909c;
		text-transform: uppercase;
		letter-spacing: clamp(0.5px, 0.15vw, 1px);
		font-weight: 600;
		margin-bottom: clamp(4px, 1vw, 8px);
	}

	.note-name-wrapper {
		min-height: clamp(2.5rem, 10vw, 4rem);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.note-name {
		/* Responsive font sizing for mobile */
		font-size: clamp(2.5rem, 12vw, 4rem);
		font-weight: 700;
		line-height: 1;
		margin: clamp(0.25rem, 1vw, 0.5rem) 0;

		/* Modern gradient text */
		background: linear-gradient(
			135deg,
			var(--in-tune-color, #4caf50) 0%,
			#66bb6a 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;

		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		/* Prevent text selection */
		user-select: none;
		-webkit-user-select: none;
	}

	/* Perfect state - enhanced glow */
	:global(.tuning-meter.perfect) .note-name {
		animation: perfectPulse 1.5s ease-in-out infinite;
		filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.4));
	}

	.note-name.empty {
		background: linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: none;
		filter: none;
	}

	.frequency {
		font-size: clamp(0.813rem, 2.2vw, 1rem);
		color: #607d8b;
		margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
		font-weight: 500;
		letter-spacing: 0.3px;
	}

	.perfect-indicator-wrapper {
		min-height: clamp(1.25rem, 3vw, 1.5rem);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.perfect-indicator {
		color: var(--in-tune-color, #4caf50);
		font-weight: 700;
		font-size: clamp(0.813rem, 2.2vw, 0.95rem);
		opacity: 0;
		transform: scale(0);
		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		padding: clamp(4px, 1vw, 6px) clamp(10px, 2.5vw, 14px);
		border-radius: clamp(8px, 2vw, 12px);
		background: linear-gradient(
			135deg,
			rgba(76, 175, 80, 0.15),
			rgba(76, 175, 80, 0.08)
		);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		border: 1px solid rgba(76, 175, 80, 0.3);
	}

	.perfect-indicator.active {
		opacity: 1;
		transform: scale(1);
		animation: indicatorPulse 2s ease-in-out infinite;
	}

	@keyframes perfectPulse {
		0%, 100% {
			filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.4));
		}
		50% {
			filter: drop-shadow(0 0 16px rgba(76, 175, 80, 0.6));
		}
	}

	@keyframes indicatorPulse {
		0%, 100% {
			transform: scale(1);
			box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
		}
		50% {
			transform: scale(1.05);
			box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
		}
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.string-label {
			color: #b0bec5;
		}

		.note-name {
			background: linear-gradient(
				135deg,
				#66bb6a 0%,
				#81c784 100%
			);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.frequency {
			color: #90a4ae;
		}

		.perfect-indicator {
			background: linear-gradient(
				135deg,
				rgba(76, 175, 80, 0.25),
				rgba(76, 175, 80, 0.15)
			);
			border-color: rgba(76, 175, 80, 0.4);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.note-info {
			margin-bottom: 0.75rem;
			min-height: 100px;
		}

		.note-name {
			font-size: 2.75rem;
			margin: 0.25rem 0;
		}
	}

	/* Extra small devices */
	@media (max-width: 360px) {
		.note-info {
			min-height: 90px;
			margin-bottom: 0.5rem;
		}

		.note-name {
			font-size: 2.5rem;
		}

		.string-label {
			font-size: 0.75rem;
		}

		.frequency {
			font-size: 0.813rem;
		}

		.perfect-indicator {
			font-size: 0.813rem;
			padding: 4px 10px;
		}
	}
</style>
