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
		padding: 2rem 1rem;
	}

	.tuner-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: #4caf50;
		font-weight: 500;
		transition: transform 0.2s;
	}

	.back-button:hover {
		transform: translateX(-3px);
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.tuner-container {
		margin: 0 auto;
		max-width: 500px;
	}

	.tuner-help {
		margin-top: 3rem;
		padding: 1.5rem;
		background-color: #f5f5f5;
		border-radius: 8px;
	}

	.tuner-help h2 {
		margin-top: 0;
		font-size: 1.5rem;
	}

	.tuner-info {
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		margin-top: 2rem;
		gap: 1rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.info-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
	}

	.info-icon.flat {
		background-color: rgba(33, 150, 243, 0.2);
		color: #2196f3;
	}

	.info-icon.in-tune {
		background-color: rgba(76, 175, 80, 0.2);
		color: #4caf50;
	}

	.info-icon.sharp {
		background-color: rgba(244, 67, 54, 0.2);
		color: #f44336;
	}

	@media (prefers-color-scheme: dark) {
		.tuner-help {
			background-color: #222;
		}

		.back-button {
			color: #66bb6a;
		}
	}

	@media (max-width: 600px) {
		.tuner-page {
			padding: 1rem 0.5rem;
		}

		.tuner-header {
			margin-bottom: 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.tuner-help {
			padding: 1rem;
		}

		.tuner-info {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
