<script lang="ts">
	import { importTab, type TabImportOptions } from '$lib/utils/tabImporter';
	import type { Tab } from '$lib/stores/tabs';
	import { BottomSheet } from '$features/shared/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { open = $bindable(false), onclose, onimport }: Props = $props();

	let importMethod = $state<'url' | 'paste'>('url');
	let importUrl = $state('');
	let importContent = $state('');
	let tabTitle = $state('');
	let artist = $state('');
	let album = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let useAI = $state(true);
	let aiModel = $state('phi3');
	let aiEndpoint = $state('http://localhost:11434/api/generate');

	let isPreviewMode = $state(false);
	let previewContent = $state('');

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
		onclose?.();
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

		onimport?.(tab);
		closeModal();
	}
</script>

<BottomSheet bind:open onOpenChange={(newOpen) => !newOpen && closeModal()} title={isPreviewMode ? 'Preview Imported Tab' : 'Import Guitar Tab'}>
	<div class="import-tab-content">
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
				<button class="cancel-btn" onclick={closeModal}>Cancel</button>
				{#if !isPreviewMode}
					<button
						class="preview-btn"
						onclick={handlePreview}
						disabled={isLoading || (importMethod === 'url' ? !importUrl : !importContent)}
					>
						{isLoading ? 'Loading...' : 'Preview'}
					</button>
				{:else}
					<button class="back-btn" onclick={() => (isPreviewMode = false)}>Back</button>
					<button class="save-btn" onclick={handleImport}>Save to My Tabs</button>
				{/if}
			</div>
		</div>
</BottomSheet>

<style>
	.import-tab-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-content {
		padding: var(--spacing-lg);
		flex: 1;
		overflow-y: auto;
	}

	.error-message,
	.success-message {
		padding: var(--spacing-md);
		border-radius: var(--radius-lg);
		margin-bottom: var(--spacing-md);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: var(--font-size-sm);
	}

	.error-message {
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error);
		color: var(--color-error);
	}

	.success-message {
		background-color: var(--color-success-bg);
		border: 1px solid var(--color-success);
		color: var(--color-success);
	}

	.icon {
		font-size: var(--font-size-lg);
	}

	.option-selector {
		display: flex;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
	}

	.option-selector label {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
	}

	.input-group {
		margin-bottom: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.input-row {
		display: flex;
		gap: var(--spacing-md);
	}

	.input-row .input-group {
		flex: 1;
	}

	label {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	input[type='text'],
	input[type='url'],
	textarea,
	select {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-family: inherit;
		background: var(--color-background);
		color: var(--color-text-primary);
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	input[type='text']:focus,
	input[type='url']:focus,
	textarea:focus,
	select:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px var(--color-primary-dim), var(--glow-primary);
	}

	.hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--spacing-xs);
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.ai-settings {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.preview-content {
		margin-top: var(--spacing-md);
	}

	.preview-content pre {
		font-family: var(--font-family-mono);
		background-color: var(--color-surface-low);
		padding: var(--spacing-md);
		border-radius: var(--radius-lg);
		overflow-x: auto;
		white-space: pre-wrap;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		height: 300px;
		overflow-y: auto;
		border: 1px solid var(--color-border);
		color: var(--color-text-primary);
	}

	.modal-footer {
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid var(--color-border);
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	.cancel-btn,
	.back-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: 1px solid var(--color-border);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	.preview-btn,
	.save-btn {
		padding: var(--spacing-sm) var(--spacing-xl);
		border: none;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-md);
		min-height: var(--touch-target-min);
	}

	.preview-btn:hover,
	.save-btn:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.preview-btn:active,
	.save-btn:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.preview-btn:focus-visible,
	.save-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.preview-btn:disabled {
		background: var(--color-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
		opacity: 0.5;
	}

	.cancel-btn:hover,
	.back-btn:hover {
		background-color: var(--color-hover);
		transform: translateY(-1px);
	}

	.cancel-btn:active,
	.back-btn:active {
		transform: translateY(0);
	}

	.cancel-btn:focus-visible,
	.back-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
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
