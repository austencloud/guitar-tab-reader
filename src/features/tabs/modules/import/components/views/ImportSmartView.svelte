<script lang="ts">
	import ImportActivityLog from '../ImportActivityLog.svelte';
	import type { AIMetadata, ProgressLogEntry } from '../../domain/types';

	interface Props {
		query: string;
		isLoading: boolean;
		loadingMessage: string;
		progressLog: ProgressLogEntry[];
		errorMessage: string;
		errorSuggestions: string[];
		aiMetadata: AIMetadata | null;
		onQueryChange: (query: string) => void;
		onSubmit: () => void;
		onKeyPress: (e: KeyboardEvent) => void;
		onShowPaste: () => void;
	}

	let {
		query = $bindable(),
		isLoading,
		loadingMessage,
		progressLog = [],
		errorMessage,
		errorSuggestions,
		aiMetadata,
		onSubmit,
		onKeyPress,
		onShowPaste
	}: Props = $props();

	function handleSuggestionClick(suggestion: string) {
		query = suggestion;
	}
</script>

<div class="smart-view">
	<div class="smart-input-group">
		<label for="smart-query">What do you want to import?</label>
		<input
			id="smart-query"
			type="text"
			bind:value={query}
			onkeypress={onKeyPress}
			placeholder="e.g., Fish in a Birdcage, Wonderwall by Oasis, or paste a URL..."
			disabled={isLoading}
		/>
		<p class="hint">
			Type an artist name to get all their tabs, or specify a song to import just that one!
		</p>
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
			<p>{loadingMessage || 'Processing your request with AI...'}</p>

			{#if aiMetadata}
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

	<ImportActivityLog entries={progressLog} />

	<div class="examples">
		<h3>Examples:</h3>
		<button class="example-chip" onclick={() => (query = 'Fish in a Birdcage')}>
			Fish in a Birdcage
		</button>
		<button class="example-chip" onclick={() => (query = 'Wonderwall by Oasis')}>
			Wonderwall by Oasis
		</button>
		<button class="example-chip" onclick={() => (query = 'Beatles')}>Beatles</button>
	</div>

	<button class="fetch-btn" onclick={onSubmit} disabled={!query.trim() || isLoading}>
		{isLoading ? 'Processing...' : '🚀 Smart Import'}
	</button>

	<div class="view-toggle">
		<button class="toggle-link" onclick={onShowPaste}> Or paste tab text directly → </button>
	</div>
</div>

<style>
	.smart-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.smart-input-group {
		margin-bottom: 1.5rem;
	}

	.smart-input-group label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.smart-input-group input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.smart-input-group input:focus {
		border-color: #9c27b0;
		outline: none;
	}

	.smart-input-group input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.hint {
		font-size: 0.85rem;
		color: #666;
		margin-top: 0.5rem;
		margin-bottom: 0;
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
		padding: 3rem 1rem;
		gap: 1rem;
		flex: 1;
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
		.smart-input-group label {
			color: #e0e0e0;
		}

		.smart-input-group input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.smart-input-group input:focus {
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
