<script lang="ts">
	import type { DisambiguationData } from '../../domain/types';

	interface Props {
		data: DisambiguationData;
		onChoice: (choice: 'artist' | 'song' | 'suggestion', value?: string) => void;
	}

	let { data, onChoice }: Props = $props();
</script>

<div class="disambiguation-view">
	<div class="disambiguation-header">
		<p class="query-display">"{data.query}"</p>
		<p class="reason-text">{data.reason}</p>
	</div>

	<div class="options-container">
		<h3>What did you mean?</h3>

		{#if data.searchResults && data.searchResults.length > 0}
			<div class="search-results-section">
				<h4>Select the song you want:</h4>
				{#each data.searchResults.slice(0, 10) as result}
					<button class="search-result-option" onclick={() => onChoice('suggestion', `${result.artist} - ${result.title}`)}>
						<div class="result-content">
							<span class="result-title">{result.title}</span>
							<span class="result-artist">by {result.artist}</span>
						</div>
						{#if result.rating && result.votes}
							<div class="result-rating">
								<span class="rating-stars">⭐ {result.rating}</span>
								<span class="rating-votes">({result.votes} votes)</span>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{:else if data.suggestions && data.suggestions.length > 0}
			<div class="suggestions-section">
				<h4>Did you mean:</h4>
				{#each data.suggestions as suggestion}
					<button class="suggestion-option" onclick={() => onChoice('suggestion', suggestion)}>
						<span class="option-icon">💡</span>
						<span class="option-text">{suggestion}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if data.possibleArtist}
			<button class="choice-option" onclick={() => onChoice('artist')}>
				<span class="option-icon">🎸</span>
				<div class="option-content">
					<span class="option-title">All tabs by artist</span>
					<span class="option-desc">{data.possibleArtist}</span>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M9 18l6-6-6-6" />
				</svg>
			</button>
		{/if}

		{#if data.possibleSong}
			<button class="choice-option" onclick={() => onChoice('song')}>
				<span class="option-icon">🎵</span>
				<div class="option-content">
					<span class="option-title">Search for song</span>
					<span class="option-desc">{data.possibleSong}</span>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M9 18l6-6-6-6" />
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.disambiguation-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.disambiguation-header {
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.query-display {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.reason-text {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
	}

	.options-container h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.suggestions-section {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #fff3e0;
		border-radius: 8px;
		border: 1px solid #ffe0b2;
	}

	.search-results-section {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #f0f7ff;
		border-radius: 8px;
		border: 1px solid #cce4ff;
	}

	.search-results-section h4 {
		font-size: 0.9rem;
		color: #1976d2;
		margin: 0 0 0.75rem 0;
		font-weight: 600;
	}

	.search-result-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background-color: white;
		border: 2px solid #bbdefb;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
	}

	.search-result-option:hover {
		background-color: #e3f2fd;
		border-color: #2196f3;
		transform: translateX(4px);
	}

	.result-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.result-title {
		font-weight: 600;
		color: #333;
		font-size: 0.95rem;
	}

	.result-artist {
		font-size: 0.85rem;
		color: #666;
	}

	.result-rating {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
		font-size: 0.8rem;
	}

	.rating-stars {
		color: #ff9800;
		font-weight: 600;
	}

	.rating-votes {
		color: #999;
		font-size: 0.75rem;
	}

	.suggestions-section h4 {
		font-size: 0.9rem;
		color: #e65100;
		margin: 0 0 0.75rem 0;
		font-weight: 600;
	}

	.suggestion-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: white;
		border: 2px solid #ffb74d;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
	}

	.suggestion-option:hover {
		background-color: #fff8e1;
		border-color: #ff9800;
		transform: translateX(4px);
	}

	.choice-option {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: white;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		margin-bottom: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
	}

	.choice-option:hover {
		border-color: #4caf50;
		background-color: #f8fdf8;
		transform: translateX(4px);
	}

	.option-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.option-title {
		font-weight: 600;
		color: #333;
		font-size: 1rem;
	}

	.option-desc {
		font-size: 0.85rem;
		color: #666;
	}

	.option-text {
		font-size: 0.95rem;
		color: #333;
		font-weight: 500;
	}

	.choice-option svg {
		color: #999;
		transition: color 0.2s;
	}

	.choice-option:hover svg {
		color: #4caf50;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.query-display {
			color: #e0e0e0;
		}

		.reason-text {
			color: #aaa;
		}

		.options-container h3 {
			color: #e0e0e0;
		}

		.suggestions-section {
			background-color: rgba(255, 152, 0, 0.1);
			border-color: rgba(255, 152, 0, 0.3);
		}

		.search-results-section {
			background-color: rgba(33, 150, 243, 0.1);
			border-color: rgba(33, 150, 243, 0.3);
		}

		.search-results-section h4 {
			color: #64b5f6;
		}

		.search-result-option {
			background-color: #2a2a2a;
			border-color: #42a5f5;
		}

		.search-result-option:hover {
			background-color: rgba(33, 150, 243, 0.15);
			border-color: #64b5f6;
		}

		.result-title {
			color: #e0e0e0;
		}

		.result-artist {
			color: #aaa;
		}

		.suggestions-section h4 {
			color: #ffb74d;
		}

		.suggestion-option {
			background-color: #2a2a2a;
			border-color: #ff9800;
		}

		.suggestion-option:hover {
			background-color: rgba(255, 152, 0, 0.15);
			border-color: #ffb74d;
		}

		.choice-option {
			background-color: #2a2a2a;
			border-color: #444;
		}

		.choice-option:hover {
			background-color: #2d3d2d;
			border-color: #66bb6a;
		}

		.option-title {
			color: #e0e0e0;
		}

		.option-desc {
			color: #aaa;
		}

		.option-text {
			color: #e0e0e0;
		}

		.choice-option svg {
			color: #777;
		}

		.choice-option:hover svg {
			color: #66bb6a;
		}
	}
</style>

