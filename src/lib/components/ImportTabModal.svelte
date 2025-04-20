<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { importTab, type TabImportOptions } from '$lib/utils/tabImporter';
	import type { Tab } from '$lib/stores/tabs';

	export let visible = false;

	const dispatch = createEventDispatcher<{
		close: void;
		import: Tab;
	}>();

	let importMethod: 'url' | 'paste' = 'url';
	let importUrl = '';
	let importContent = '';
	let tabTitle = '';
	let artist = '';
	let album = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let useAI = true;
	let aiModel = 'phi3';
	let aiEndpoint = 'http://localhost:11434/api/generate';

	let isPreviewMode = false;
	let previewContent = '';

	function resetForm() {
		importMethod = 'url';
		importUrl = '';
		importContent = '';
		tabTitle = '';
		artist = '';
		album = '';
		errorMessage = '';
		successMessage = '';
		isPreviewMode = false;
		previewContent = '';
	}

	function closeModal() {
		resetForm();
		dispatch('close');
	}

	async function handlePreview() {
		errorMessage = '';
		successMessage = '';
		isLoading = true;

		try {
			const options: TabImportOptions = {
				url: importMethod === 'url' ? importUrl : undefined,
				rawContent: importMethod === 'paste' ? importContent : undefined,
				title: tabTitle || undefined,
				artist: artist || undefined,
				album: album || undefined,
				useAI,
				aiEndpoint,
				aiModel
			};

			const result = await importTab(options);

			if (result.success && result.tab) {
				previewContent = result.tab.content;
				if (!tabTitle && result.tab.title) tabTitle = result.tab.title;
				if (!artist && result.tab.artist) artist = result.tab.artist;
				isPreviewMode = true;
				successMessage = 'Tab imported successfully! Review and save it to your collection.';
			} else {
				errorMessage = result.error || 'Failed to import tab';
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
		} finally {
			isLoading = false;
		}
	}

	async function handleImport() {
		if (!previewContent) {
			await handlePreview();
			if (errorMessage) return;
		}

		// Create the final tab object
		const tab: Tab = {
			id: crypto.randomUUID(),
			title: tabTitle || 'Imported Tab',
			artist,
			album,
			content: previewContent,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		};

		dispatch('import', tab);
		closeModal();
	}
</script>

{#if visible}
	<div class="modal-backdrop">
		<div class="modal-container">
			<div class="modal-header">
				<h2>{isPreviewMode ? 'Preview Imported Tab' : 'Import Guitar Tab'}</h2>
				<button class="close-btn" on:click={closeModal} aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
						<path
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
						></path>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				{#if errorMessage}
					<div class="error-message">
						<span class="icon">⚠️</span>
						{errorMessage}
					</div>
				{/if}

				{#if successMessage}
					<div class="success-message">
						<span class="icon">✓</span>
						{successMessage}
					</div>
				{/if}

				{#if !isPreviewMode}
					<div class="import-options">
						<div class="option-selector">
							<label>
								<input type="radio" bind:group={importMethod} value="url" />
								Import from URL
							</label>
							<label>
								<input type="radio" bind:group={importMethod} value="paste" />
								Paste tab content
							</label>
						</div>

						{#if importMethod === 'url'}
							<div class="input-group">
								<label for="import-url">Tab URL</label>
								<input
									id="import-url"
									type="url"
									bind:value={importUrl}
									placeholder="https://tabs.ultimate-guitar.com/..."
								/>
								<span class="hint">Enter URL from Ultimate Guitar, Songsterr, etc.</span>
							</div>
						{:else}
							<div class="input-group">
								<label for="import-content">Tab Content</label>
								<textarea
									id="import-content"
									bind:value={importContent}
									placeholder="Paste tab content here..."
									rows="10"
								></textarea>
							</div>
						{/if}

						<div class="input-group">
							<label for="tab-title">Tab Title (optional)</label>
							<input
								id="tab-title"
								type="text"
								bind:value={tabTitle}
								placeholder="Enter tab title"
							/>
						</div>

						<div class="input-row">
							<div class="input-group">
								<label for="artist">Artist (optional)</label>
								<input
									id="artist"
									type="text"
									bind:value={artist}
									placeholder="Enter artist name"
								/>
							</div>

							<div class="input-group">
								<label for="album">Album (optional)</label>
								<input id="album" type="text" bind:value={album} placeholder="Enter album name" />
							</div>
						</div>

						<div class="ai-options">
							<div class="checkbox-group">
								<input type="checkbox" id="use-ai" bind:checked={useAI} />
								<label for="use-ai">Use AI to enhance formatting</label>
							</div>

							{#if useAI}
								<div class="input-row ai-settings">
									<div class="input-group">
										<label for="ai-endpoint">Ollama API Endpoint</label>
										<input
											id="ai-endpoint"
											type="text"
											bind:value={aiEndpoint}
											placeholder="http://localhost:11434/api/generate"
										/>
									</div>

									<div class="input-group">
										<label for="ai-model">Model</label>
										<select id="ai-model" bind:value={aiModel}>
											<option value="phi3">phi3</option>
											<option value="llama3">llama3</option>
											<option value="mistral">mistral</option>
											<option value="qwen">qwen</option>
										</select>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="preview-container">
						<div class="tab-details">
							<div class="input-group">
								<label for="preview-title">Tab Title</label>
								<input id="preview-title" type="text" bind:value={tabTitle} />
							</div>

							<div class="input-row">
								<div class="input-group">
									<label for="preview-artist">Artist</label>
									<input id="preview-artist" type="text" bind:value={artist} />
								</div>

								<div class="input-group">
									<label for="preview-album">Album</label>
									<input id="preview-album" type="text" bind:value={album} />
								</div>
							</div>
						</div>

						<div class="preview-content">
							<label for="preview-tab">Tab Content Preview</label>
							<pre id="preview-tab">{previewContent}</pre>
						</div>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="cancel-btn" on:click={closeModal}>Cancel</button>
				{#if !isPreviewMode}
					<button
						class="preview-btn"
						on:click={handlePreview}
						disabled={isLoading || (importMethod === 'url' ? !importUrl : !importContent)}
					>
						{isLoading ? 'Loading...' : 'Preview'}
					</button>
				{:else}
					<button class="back-btn" on:click={() => (isPreviewMode = false)}>Back</button>
					<button class="save-btn" on:click={handleImport}>Save to My Tabs</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
	}

	.modal-container {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 700px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 1.25rem;
		border-bottom: 1px solid #e5e5e5;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.close-btn svg {
		width: 24px;
		height: 24px;
		fill: currentColor;
	}

	.modal-content {
		padding: 1.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.error-message,
	.success-message {
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-message {
		background-color: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		color: #c62828;
	}

	.success-message {
		background-color: rgba(76, 175, 80, 0.1);
		border: 1px solid rgba(76, 175, 80, 0.3);
		color: #2e7d32;
	}

	.icon {
		font-size: 1.2rem;
	}

	.option-selector {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.option-selector label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.input-group {
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.input-row {
		display: flex;
		gap: 1rem;
	}

	.input-row .input-group {
		flex: 1;
	}

	label {
		font-weight: 500;
		color: #555;
		font-size: 0.9rem;
	}

	input[type='text'],
	input[type='url'],
	textarea,
	select {
		padding: 0.65rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	input[type='text']:focus,
	input[type='url']:focus,
	textarea:focus,
	select:focus {
		border-color: #4caf50;
		outline: none;
	}

	.hint {
		font-size: 0.8rem;
		color: #777;
		margin-top: 0.25rem;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.ai-settings {
		margin-top: 0.5rem;
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 4px;
	}

	.preview-content {
		margin-top: 1rem;
	}

	.preview-content pre {
		font-family: 'Courier New', monospace;
		background-color: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		white-space: pre-wrap;
		font-size: 0.9rem;
		line-height: 1.4;
		height: 300px;
		overflow-y: auto;
		border: 1px solid #e0e0e0;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e5e5e5;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.cancel-btn,
	.back-btn {
		padding: 0.65rem 1.25rem;
		border: 1px solid #ccc;
		background-color: white;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.preview-btn,
	.save-btn {
		padding: 0.65rem 1.5rem;
		border: none;
		background-color: #4caf50;
		color: white;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.preview-btn:hover,
	.save-btn:hover {
		background-color: #43a047;
	}

	.preview-btn:disabled {
		background-color: #a5d6a7;
		cursor: not-allowed;
	}

	.cancel-btn:hover,
	.back-btn:hover {
		background-color: #f5f5f5;
	}

	@media (prefers-color-scheme: dark) {
		.modal-container {
			background-color: #222;
			color: #e0e0e0;
		}

		.modal-header {
			border-color: #444;
		}

		.modal-header h2 {
			color: #e0e0e0;
		}

		.close-btn {
			color: #aaa;
		}

		.close-btn:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.modal-footer {
			border-color: #444;
		}

		input[type='text'],
		input[type='url'],
		textarea,
		select {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		input[type='text']:focus,
		input[type='url']:focus,
		textarea:focus,
		select:focus {
			border-color: #66bb6a;
		}

		label {
			color: #ccc;
		}

		.hint {
			color: #aaa;
		}

		.preview-content pre {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.cancel-btn,
		.back-btn {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.cancel-btn:hover,
		.back-btn:hover {
			background-color: #444;
		}

		.ai-settings {
			background-color: rgba(255, 255, 255, 0.05);
		}

		.error-message {
			background-color: rgba(244, 67, 54, 0.1);
			border-color: rgba(244, 67, 54, 0.3);
			color: #ef5350;
		}

		.success-message {
			background-color: rgba(76, 175, 80, 0.1);
			border-color: rgba(76, 175, 80, 0.3);
			color: #66bb6a;
		}
	}

	@media (max-width: 600px) {
		.input-row {
			flex-direction: column;
			gap: 1rem;
		}

		.option-selector {
			flex-direction: column;
			gap: 0.75rem;
		}

		.preview-content pre {
			font-size: 0.8rem;
			height: 200px;
		}
	}
</style>
