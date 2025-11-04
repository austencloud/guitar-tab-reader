<script lang="ts">
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { GuitarTuner } from '$features/tuner/components';

	let showTuner = true;
</script>

<div class="tuner-page" in:fly={{ y: 20, duration: 300 }}>
	<div class="tuner-header">
		<button class="back-button" onclick={() => goto('/')} aria-label="Go back to home">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
				<path
					fill="currentColor"
					d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
				/>
			</svg>
			<span>Back</span>
		</button>
		<h1>Guitar Tuner</h1>
	</div>

	<div class="tuner-container">
		<GuitarTuner {showTuner} />
	</div>

	<div class="tuner-help">
		<h2>How to use the tuner:</h2>
		<ol>
			<li>Click "Start" to activate your microphone</li>
			<li>Play a single string on your guitar</li>
			<li>The tuner will show which string you're playing and how in-tune it is</li>
			<li>Adjust your tuning until the needle is centered (green)</li>
		</ol>

		<div class="tuner-info">
			<div class="info-item">
				<div class="info-icon flat">♭</div>
				<p>String is flat (too low)</p>
			</div>
			<div class="info-item">
				<div class="info-icon in-tune">✓</div>
				<p>String is in tune</p>
			</div>
			<div class="info-item">
				<div class="info-icon sharp">♯</div>
				<p>String is sharp (too high)</p>
			</div>
		</div>
	</div>
</div>

<style>
	.tuner-page {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--spacing-xl) var(--spacing-md);
	}

	.tuner-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		min-height: var(--touch-target-min);
		background: none;
		border: none;
		padding: var(--spacing-sm);
		cursor: pointer;
		color: var(--color-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-transform);
		border-radius: var(--radius-lg);
	}

	.back-button:hover {
		transform: translateX(-3px);
		background-color: var(--color-hover);
	}

	.back-button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.tuner-container {
		margin: 0 auto;
		max-width: 500px;
	}

	.tuner-help {
		margin-top: var(--spacing-2xl);
		padding: var(--spacing-lg);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.tuner-help h2 {
		margin-top: 0;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.tuner-help ol {
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.tuner-info {
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		margin-top: var(--spacing-xl);
		gap: var(--spacing-md);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.info-item p {
		color: var(--color-text-secondary);
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.info-icon {
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
	}

	.info-icon.flat {
		background-color: var(--color-info-bg);
		color: var(--color-info);
		border: 1px solid var(--color-info);
	}

	.info-icon.in-tune {
		background-color: var(--color-success-bg);
		color: var(--color-success);
		border: 1px solid var(--color-success);
	}

	.info-icon.sharp {
		background-color: var(--color-error-bg);
		color: var(--color-error);
		border: 1px solid var(--color-error);
	}

	@media (max-width: 600px) {
		.tuner-page {
			padding: var(--spacing-md) var(--spacing-sm);
		}

		.tuner-header {
			margin-bottom: var(--spacing-md);
		}

		h1 {
			font-size: var(--font-size-2xl);
		}

		.tuner-help {
			padding: var(--spacing-md);
		}

		.tuner-info {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
