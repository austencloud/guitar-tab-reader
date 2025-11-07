<script lang="ts">
	import ImportActivityLog from '../ImportActivityLog.svelte';
	import type { AIMetadata, ProgressLogEntry } from '../../domain/types';

	interface Props {
		searchMode: 'artist' | 'song' | 'smart';
		artistQuery: string;
		songQuery: string;
		songArtistQuery: string;
		smartQuery: string;
		isLoading: boolean;
		loadingMessage: string;
		progressLog: ProgressLogEntry[];
		errorMessage: string;
		errorSuggestions: string[];
		aiMetadata: AIMetadata | null;
		onSearchModeChange: (mode: 'artist' | 'song' | 'smart') => void;
		onArtistQueryChange: (query: string) => void;
		onSongQueryChange: (song: string) => void;
		onSongArtistQueryChange: (artist: string) => void;
		onSmartQueryChange: (query: string) => void;
		onSubmit: () => void;
		onKeyPress: (e: KeyboardEvent) => void;
		onShowPaste: () => void;
	}

	let {
		searchMode = $bindable(),
		artistQuery = $bindable(),
		songQuery = $bindable(),
		songArtistQuery = $bindable(),
		smartQuery = $bindable(),
		isLoading,
		loadingMessage,
		progressLog = [],
		errorMessage,
		errorSuggestions,
		aiMetadata,
		onSearchModeChange,
		onSubmit,
		onKeyPress,
		onShowPaste
	}: Props = $props();

	/**
	 * Action to focus an input element when it's mounted
	 * This is more accessible than autofocus attribute
	 */
	function focusOnMount(node: HTMLInputElement) {
		// Use requestAnimationFrame to ensure the input is fully rendered
		requestAnimationFrame(() => {
			node.focus();
		});
	}

	function handleSuggestionClick(suggestion: string) {
		if (searchMode === 'smart') {
			smartQuery = suggestion;
		} else if (searchMode === 'artist') {
			artistQuery = suggestion;
		} else if (searchMode === 'song') {
			// Try to parse "Artist - Song" format
			const dashMatch = suggestion.match(/^(.+?)\s*-\s*(.+)$/);
			if (dashMatch) {
				songArtistQuery = dashMatch[1].trim();
				songQuery = dashMatch[2].trim();
			} else {
				songQuery = suggestion;
			}
		}
	}

	// Computed property for canSubmit
	let canSubmit = $derived(
		searchMode === 'artist'
			? artistQuery.trim().length > 0
			: searchMode === 'song'
				? songQuery.trim().length > 0
				: smartQuery.trim().length > 0
	);
</script>

<div class="dual-search-view">
	<!-- Search Mode Tabs -->
	<div class="search-mode-tabs">
		<button
			class="mode-tab"
			class:active={searchMode === 'artist'}
			onclick={() => onSearchModeChange('artist')}
			disabled={isLoading}
		>
			🎸 Artist
		</button>
		<button
			class="mode-tab"
			class:active={searchMode === 'song'}
			onclick={() => onSearchModeChange('song')}
			disabled={isLoading}
		>
			🎵 Song
		</button>
		<button
			class="mode-tab"
			class:active={searchMode === 'smart'}
			onclick={() => onSearchModeChange('smart')}
			disabled={isLoading}
		>
			🤖 Smart
		</button>
	</div>

	<!-- Search Forms -->
	<div class="search-forms">
		{#if searchMode === 'artist'}
			<div class="search-form artist-form">
				<label for="artist-query">Artist Name</label>
				<input
					id="artist-query"
					type="text"
					bind:value={artistQuery}
					onkeypress={onKeyPress}
					placeholder="e.g., The Beatles, Pink Floyd, Metallica..."
					disabled={isLoading}
					use:focusOnMount
				/>
				<p class="hint">Get all tabs by this artist</p>
			</div>
		{:else if searchMode === 'song'}
			<div class="search-form song-form">
				<label for="song-query">Song Title</label>
				<input
					id="song-query"
					type="text"
					bind:value={songQuery}
					onkeypress={onKeyPress}
					placeholder="e.g., Wonderwall, Stairway to Heaven, Crazy..."
					disabled={isLoading}
					use:focusOnMount
				/>
				<label for="song-artist-query">Artist (optional but recommended)</label>
				<input
					id="song-artist-query"
					type="text"
					bind:value={songArtistQuery}
					onkeypress={onKeyPress}
					placeholder="e.g., Oasis, Led Zeppelin, Gnarls Barkley..."
					disabled={isLoading}
				/>
				<p class="hint">
					{#if songArtistQuery.trim()}
						Search for "{songQuery || 'song'}" by {songArtistQuery}
					{:else}
						Search for "{songQuery || 'song'}" (all artists)
					{/if}
				</p>
			</div>
		{:else}
			<div class="search-form smart-form">
				<label for="smart-query">What do you want to import?</label>
				<input
					id="smart-query"
					type="text"
					bind:value={smartQuery}
					onkeypress={onKeyPress}
					placeholder="e.g., Fish in a Birdcage, Wonderwall by Oasis, or paste a URL..."
					disabled={isLoading}
					use:focusOnMount
				/>
				<p class="hint">
					AI will understand natural language! Try "artist name" or "song by artist"
				</p>
			</div>
		{/if}
	</div>

	{#if errorMessage}
		<div class="error-message">
			⚠️ {errorMessage}
			{#if errorSuggestions.length > 0}
				<div class="error-suggestions">
					{#each errorSuggestions as suggestion}
						<button class="suggestion-chip" onclick={() => handleSuggestionClick(suggestion)}>
							{suggestion}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>{loadingMessage || 'Processing your request...'}</p>

			{#if searchMode === 'smart' && aiMetadata}
				<div class="ai-processing-details">
					<div class="ai-detail-item">
						<span class="detail-label">Model:</span>
						<span class="detail-value">{aiMetadata.model}</span>
					</div>
					<div class="ai-detail-item">
						<span class="detail-label">Token Usage:</span>
						<span class="detail-value">
							{aiMetadata.inputTokens} input + {aiMetadata.outputTokens} output = {aiMetadata.inputTokens +
								aiMetadata.outputTokens} total
						</span>
					</div>
					<div class="ai-thinking-section">
						<span class="detail-label">AI Analysis:</span>
						<pre class="ai-response">{aiMetadata.rawResponse}</pre>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if searchMode === 'smart'}
		<ImportActivityLog entries={progressLog} />
	{/if}

	<div class="examples">
		<h3>Examples:</h3>
		{#if searchMode === 'artist'}
			<button class="example-chip" onclick={() => (artistQuery = 'The Beatles')}>
				The Beatles
			</button>
			<button class="example-chip" onclick={() => (artistQuery = 'Pink Floyd')}>
				Pink Floyd
			</button>
			<button class="example-chip" onclick={() => (artistQuery = 'Metallica')}>
				Metallica
			</button>
		{:else if searchMode === 'song'}
			<button
				class="example-chip"
				onclick={() => {
					songQuery = 'Wonderwall';
					songArtistQuery = 'Oasis';
				}}
			>
				Wonderwall by Oasis
			</button>
			<button
				class="example-chip"
				onclick={() => {
					songQuery = 'Crazy';
					songArtistQuery = 'Gnarls Barkley';
				}}
			>
				Crazy by Gnarls Barkley
			</button>
			<button
				class="example-chip"
				onclick={() => {
					songQuery = 'Stairway to Heaven';
					songArtistQuery = 'Led Zeppelin';
				}}
			>
				Stairway to Heaven
			</button>
		{:else}
			<button class="example-chip" onclick={() => (smartQuery = 'Fish in a Birdcage')}>
				Fish in a Birdcage
			</button>
			<button class="example-chip" onclick={() => (smartQuery = 'Wonderwall by Oasis')}>
				Wonderwall by Oasis
			</button>
			<button class="example-chip" onclick={() => (smartQuery = 'Beatles')}>Beatles</button>
		{/if}
	</div>

	<button class="fetch-btn" onclick={onSubmit} disabled={!canSubmit || isLoading}>
		{#if isLoading}
			Processing...
		{:else if searchMode === 'artist'}
			🎸 Get All Artist Tabs
		{:else if searchMode === 'song'}
			🎵 Find This Song
		{:else}
			🤖 Smart Import
		{/if}
	</button>

	<div class="view-toggle">
		<button class="toggle-link" onclick={onShowPaste}> Or paste tab text directly → </button>
	</div>
</div>

<style>
	.dual-search-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.search-mode-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e5e5e5;
	}

	.mode-tab {
		flex: 1;
		padding: 0.875rem 1rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		color: #666;
		transition: all 0.2s;
		position: relative;
		bottom: -2px;
	}

	.mode-tab:hover:not(:disabled) {
		color: #333;
		background-color: rgba(0, 0, 0, 0.03);
	}

	.mode-tab.active {
		color: #9c27b0;
		border-bottom-color: #9c27b0;
	}

	.mode-tab:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.search-forms {
		margin-bottom: 1.5rem;
		min-height: 200px;
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.search-form label {
		font-weight: 600;
		color: #333;
		font-size: 0.95rem;
		margin-top: 0.5rem;
	}

	.search-form label:first-child {
		margin-top: 0;
	}

	.search-form input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.search-form input:focus {
		border-color: #9c27b0;
		outline: none;
	}

	.search-form input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.hint {
		font-size: 0.85rem;
		color: #666;
		margin: 0;
		font-style: italic;
	}

	.error-message {
		padding: 0.875rem;
		background-color: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		border-radius: 8px;
		color: #c62828;
		margin-bottom: 1rem;
		text-align: center;
	}

	.error-suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
		justify-content: center;
	}

	.suggestion-chip {
		background-color: rgba(244, 67, 54, 0.15);
		border: 1px solid rgba(244, 67, 54, 0.4);
		border-radius: 20px;
		padding: 0.5rem 1rem;
		color: #c62828;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.suggestion-chip:hover {
		background-color: rgba(244, 67, 54, 0.25);
		border-color: rgba(244, 67, 54, 0.6);
		color: #b71c1c;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e5e5;
		border-top: 4px solid #4caf50;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: #666;
		margin: 0;
	}

	.ai-processing-details {
		margin-top: 2rem;
		padding: 1.5rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		border: 2px solid #e0e0e0;
		text-align: left;
		width: 100%;
		max-width: 600px;
	}

	.ai-detail-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.detail-label {
		font-weight: 600;
		color: #666;
		min-width: 100px;
	}

	.detail-value {
		color: #333;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
	}

	.ai-thinking-section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
	}

	.ai-thinking-section .detail-label {
		display: block;
		margin-bottom: 0.5rem;
	}

	.ai-response {
		background-color: #ffffff;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 1rem;
		font-size: 0.8rem;
		color: #333;
		overflow-x: auto;
		max-height: 200px;
		overflow-y: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: 'Courier New', Courier, monospace;
	}

	.examples {
		margin-bottom: 1.5rem;
	}

	.examples h3 {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.example-chip {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 20px;
		margin-right: 0.5rem;
		margin-bottom: 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: #555;
		transition: all 0.2s;
	}

	.example-chip:hover {
		background-color: #e8f5e9;
		border-color: #4caf50;
		color: #2e7d32;
	}

	.fetch-btn {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
		color: white;
		border: none;
		border-radius: 50px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
		margin-top: auto;
	}

	.fetch-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
	}

	.fetch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.view-toggle {
		text-align: center;
		margin-top: 1rem;
	}

	.toggle-link {
		background: none;
		border: none;
		color: #9c27b0;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.5rem 1rem;
		transition: all 0.2s;
		border-radius: 4px;
	}

	.toggle-link:hover {
		background-color: rgba(156, 39, 176, 0.05);
		text-decoration: underline;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.search-mode-tabs {
			border-bottom-color: #444;
		}

		.mode-tab {
			color: #aaa;
		}

		.mode-tab:hover:not(:disabled) {
			color: #e0e0e0;
			background-color: rgba(255, 255, 255, 0.05);
		}

		.mode-tab.active {
			color: #ce93d8;
			border-bottom-color: #ce93d8;
		}

		.search-form label {
			color: #e0e0e0;
		}

		.search-form input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.search-form input:focus {
			border-color: #9c27b0;
		}

		.hint {
			color: #aaa;
		}

		.examples h3 {
			color: #aaa;
		}

		.example-chip {
			background-color: #333;
			border-color: #555;
			color: #ccc;
		}

		.example-chip:hover {
			background-color: #2d3d2d;
			border-color: #66bb6a;
			color: #a5d6a7;
		}

		.ai-processing-details {
			background-color: rgba(255, 255, 255, 0.05);
			border-color: #444;
		}

		.detail-label {
			color: #aaa;
		}

		.detail-value {
			color: #e0e0e0;
		}

		.ai-thinking-section {
			border-top-color: #444;
		}

		.ai-response {
			background-color: #2a2a2a;
			border-color: #444;
			color: #e0e0e0;
		}
	}
</style>
