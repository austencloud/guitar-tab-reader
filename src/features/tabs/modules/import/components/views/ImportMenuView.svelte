<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		onSelectUrl: () => void;
		onSelectSmart: () => void;
	}

	let { onSelectUrl, onSelectSmart }: Props = $props();

	function openUltimateGuitar() {
		if (browser) {
			window.open('https://www.ultimate-guitar.com', '_blank');
		}
	}
</script>

<div class="menu-view">
	<p class="subtitle">Import guitar tabs directly from Ultimate Guitar</p>

	<button class="main-card featured" onclick={onSelectSmart}>
		<span class="card-icon">🤖</span>
		<span class="card-title">Smart Import (AI-Powered)</span>
		<span class="card-desc">Just type what you want: "Beatles" or "Wonderwall by Oasis"</span>
	</button>

	<button class="main-card" onclick={onSelectUrl}>
		<span class="card-icon">🔗</span>
		<span class="card-title">Import from URL</span>
		<span class="card-desc">Paste a Ultimate Guitar link</span>
	</button>

	<div class="instructions">
		<h3>How it works:</h3>
		<ol>
			<li>Click "Open Ultimate Guitar" below to browse tabs</li>
			<li>Find the tab you want on their website</li>
			<li>Copy the URL from your browser's address bar</li>
			<li>Return here and click "Import from URL"</li>
			<li>Paste the URL and we'll fetch it for you!</li>
		</ol>

		<button class="open-ug-btn" onclick={openUltimateGuitar}> 🎸 Open Ultimate Guitar </button>
	</div>
</div>

<style>
	.menu-view {
		padding: 1.5rem;
	}

	.subtitle {
		font-size: 1rem;
		color: #666;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.main-card {
		background: white;
		border: 2px solid #e5e5e5;
		border-radius: 12px;
		padding: 2rem 1.5rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
		text-align: center;
		margin-bottom: 2rem;
		width: 100%;
	}

	.main-card:hover {
		border-color: #4caf50;
		background-color: #f8fdf8;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
	}

	.main-card.featured {
		border-color: #9c27b0;
		background: linear-gradient(135deg, #f8f0fb 0%, #fef9ff 100%);
	}

	.main-card.featured:hover {
		border-color: #7b1fa2;
		background: linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%);
		box-shadow: 0 4px 12px rgba(156, 39, 176, 0.25);
	}

	.card-icon {
		font-size: 3rem;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
	}

	.card-desc {
		font-size: 0.9rem;
		color: #666;
	}

	.instructions {
		background-color: #f8f9fa;
		padding: 1.25rem;
		border-radius: 8px;
	}

	.instructions h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: #333;
	}

	.instructions ol {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
		color: #555;
	}

	.instructions li {
		margin-bottom: 0.5rem;
	}

	.open-ug-btn {
		width: 100%;
		padding: 0.875rem 1.5rem;
		background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.open-ug-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 180, 216, 0.3);
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.subtitle {
			color: #aaa;
		}

		.main-card {
			background-color: #2a2a2a;
			border-color: #444;
		}

		.main-card:hover {
			background-color: #2d3d2d;
			border-color: #66bb6a;
		}

		.card-title {
			color: #e0e0e0;
		}

		.card-desc {
			color: #aaa;
		}

		.instructions {
			background-color: rgba(255, 255, 255, 0.05);
		}

		.instructions h3 {
			color: #e0e0e0;
		}

		.instructions li {
			color: #ccc;
		}

		.main-card.featured {
			background: linear-gradient(135deg, #3a2a3e 0%, #2d1f31 100%);
			border-color: #7b1fa2;
		}

		.main-card.featured:hover {
			background: linear-gradient(135deg, #4a3a4e 0%, #3d2f41 100%);
			border-color: #9c27b0;
		}
	}
</style>

