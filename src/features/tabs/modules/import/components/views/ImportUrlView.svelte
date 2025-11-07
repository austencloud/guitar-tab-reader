<script lang="ts">
	interface Props {
		url: string;
		isLoading: boolean;
		errorMessage: string;
		onUrlChange: (url: string) => void;
		onFetch: () => void;
		onKeyPress: (e: KeyboardEvent) => void;
	}

	let { url = $bindable(), isLoading, errorMessage, onFetch, onKeyPress }: Props = $props();
</script>

<div class="url-view">
	<div class="url-input-group">
		<label for="tab-url">Ultimate Guitar Tab URL</label>
		<input
			id="tab-url"
			type="url"
			bind:value={url}
			onkeypress={onKeyPress}
			placeholder="https://tabs.ultimate-guitar.com/tab/..."
			disabled={isLoading}
		/>
		<p class="hint">Paste the full URL from Ultimate Guitar's website</p>
	</div>

	{#if errorMessage}
		<div class="error-message">⚠️ {errorMessage}</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Fetching tab from Ultimate Guitar...</p>
		</div>
	{/if}

	<button class="fetch-btn" onclick={onFetch} disabled={!url.trim() || isLoading}>
		{isLoading ? 'Fetching...' : 'Fetch Tab'}
	</button>
</div>

<style>
	.url-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.url-input-group {
		margin-bottom: 1.5rem;
	}

	.url-input-group label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.url-input-group input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.url-input-group input:focus {
		border-color: #4caf50;
		outline: none;
	}

	.url-input-group input:disabled {
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

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.url-input-group label {
			color: #e0e0e0;
		}

		.url-input-group input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.hint {
			color: #aaa;
		}
	}
</style>

