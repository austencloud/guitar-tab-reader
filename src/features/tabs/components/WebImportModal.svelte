<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';
	import { browser } from '$app/environment';

	interface Props {
		visible?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { visible = false, onclose, onimport }: Props = $props();

	let currentView = $state<
		'menu' | 'url' | 'smart' | 'disambiguation' | 'bulk-results' | 'preview'
	>('menu');
	let tabUrl = $state('');
	let smartQuery = $state('');
	let disambiguationData = $state<{
		query: string;
		reason: string;
		suggestions: string[];
		possibleArtist?: string;
		possibleSong?: string;
	} | null>(null);
	let bulkResults = $state<any[]>([]);
	let pastedContent = $state('');
	let tabTitle = $state('');
	let tabArtist = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let aiMetadata = $state<{
		model: string;
		inputTokens: number;
		outputTokens: number;
		rawResponse: string;
	} | null>(null);

	function showUrlView() {
		currentView = 'url';
		tabUrl = '';
		errorMessage = '';
	}

	function showSmartView() {
		currentView = 'smart';
		smartQuery = '';
		errorMessage = '';
	}

	function openUltimateGuitar() {
		if (browser) {
			window.open('https://www.ultimate-guitar.com', '_blank');
		}
	}

	async function handleFetchTab() {
		if (!tabUrl.trim()) return;

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/parse-ug-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: tabUrl.trim() })
			});

			const data = await response.json();

			if (data.success) {
				tabTitle = data.title || 'Imported Tab';
				tabArtist = data.artist || '';
				pastedContent = data.content || '';
				currentView = 'preview';
			} else {
				errorMessage = data.error || 'Failed to fetch tab';
			}
		} catch (error) {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSmartImport() {
		if (!smartQuery.trim()) return;

		isLoading = true;
		errorMessage = '';
		aiMetadata = null;

		try {
			const response = await fetch('/api/smart-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: smartQuery.trim() })
			});

			const data = await response.json();

			// Capture AI metadata if available
			if (data._meta) {
				aiMetadata = data._meta;
			}

			if (data.success) {
				if (data.type === 'ambiguous') {
					// Show disambiguation options
					disambiguationData = {
						query: data.query,
						reason: data.ambiguityReason,
						suggestions: data.suggestions || [],
						possibleArtist: data.possibleArtist,
						possibleSong: data.possibleSong
					};
					currentView = 'disambiguation';
				} else if (data.type === 'artist_bulk') {
					// Show bulk results for user to choose from
					bulkResults = data.tabs || [];
					currentView = 'bulk-results';
				} else if (data.type === 'single_tab' || data.type === 'ai_generated') {
					// Direct import of single tab
					tabTitle = data.tab.title || 'Imported Tab';
					tabArtist = data.tab.artist || '';
					pastedContent = data.tab.content || '';
					currentView = 'preview';
				}
			} else {
				errorMessage = data.error || 'Could not import tabs';
			}
		} catch (error) {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	async function selectBulkTab(tab: any) {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/parse-ug-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: tab.url })
			});

			const data = await response.json();

			if (data.success) {
				tabTitle = data.title || tab.title;
				tabArtist = data.artist || tab.artist;
				pastedContent = data.content || '';
				currentView = 'preview';
			} else {
				errorMessage = data.error || 'Failed to fetch tab';
			}
		} catch (error) {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleImport() {
		if (!pastedContent.trim() || !tabTitle.trim()) return;

		const tab: Tab = {
			id: crypto.randomUUID(),
			title: tabTitle,
			artist: tabArtist,
			content: pastedContent,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		onimport?.(tab);
		resetAndClose();
	}

	async function handleDisambiguationChoice(choice: 'artist' | 'song' | 'suggestion', value?: string) {
		if (choice === 'suggestion' && value) {
			// User selected a suggestion (e.g., typo correction)
			smartQuery = value;
			currentView = 'smart';
			// Automatically re-run the query with the corrected value
			await handleSmartImport();
		} else if (choice === 'artist' && disambiguationData?.possibleArtist) {
			// User wants to import all tabs by this artist
			smartQuery = disambiguationData.possibleArtist;
			handleArtistImport(disambiguationData.possibleArtist);
		} else if (choice === 'song' && disambiguationData?.possibleSong) {
			// User wants to import a specific song
			smartQuery = disambiguationData.query;
			handleSongImport(disambiguationData.possibleSong, disambiguationData.possibleArtist);
		}
	}

	async function handleArtistImport(artistName: string) {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/scrape-artist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artistName })
			});

			const data = await response.json();

			if (data.success) {
				bulkResults = data.tabs || [];
				currentView = 'bulk-results';
			} else {
				errorMessage = data.error || 'Could not find tabs for this artist';
			}
		} catch (error) {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSongImport(songName: string, artistName?: string) {
		isLoading = true;
		errorMessage = '';

		try {
			// Search for the specific song
			const response = await fetch('/api/scrape-artist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artistName: artistName || songName })
			});

			const data = await response.json();

			if (data.success && data.tabs.length > 0) {
				// Find the matching tab
				const songLower = songName.toLowerCase();
				const matchingTab = data.tabs.find((tab: any) => tab.title.toLowerCase().includes(songLower));

				if (matchingTab) {
					// Fetch the actual content
					await selectBulkTab(matchingTab);
				} else {
					errorMessage = `Could not find "${songName}"`;
				}
			} else {
				errorMessage = 'Could not find this song';
			}
		} catch (error) {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	function resetAndClose() {
		currentView = 'menu';
		tabUrl = '';
		smartQuery = '';
		disambiguationData = null;
		bulkResults = [];
		pastedContent = '';
		tabTitle = '';
		tabArtist = '';
		errorMessage = '';
		onclose?.();
	}

	function goBack() {
		if (currentView === 'preview') {
			// Check where we came from
			if (bulkResults.length > 0) {
				currentView = 'bulk-results';
			} else if (disambiguationData) {
				currentView = 'disambiguation';
			} else if (smartQuery) {
				currentView = 'smart';
			} else {
				currentView = 'url';
			}
		} else if (currentView === 'bulk-results') {
			if (disambiguationData) {
				currentView = 'disambiguation';
			} else {
				currentView = 'smart';
			}
		} else if (currentView === 'disambiguation') {
			currentView = 'smart';
		} else if (currentView === 'url' || currentView === 'smart') {
			currentView = 'menu';
		}
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isLoading) {
			if (currentView === 'url' && tabUrl.trim()) {
				handleFetchTab();
			} else if (currentView === 'smart' && smartQuery.trim()) {
				handleSmartImport();
			}
		}
	}
</script>

{#if visible}
	<div
		class="modal-backdrop"
		onclick={resetAndClose}
		onkeydown={(e) => e.key === 'Escape' && resetAndClose()}
		role="button"
		tabindex="0"
	>
		<div class="modal-panel" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<div class="modal-header">
				<div class="header-left">
					{#if currentView !== 'menu'}
						<button class="back-btn" onclick={goBack} aria-label="Go back">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M19 12H5M12 19l-7-7 7-7" />
							</svg>
						</button>
					{/if}
					<h2>
						{#if currentView === 'menu'}
							Import from Web
						{:else if currentView === 'url'}
							Paste Tab URL
						{:else if currentView === 'smart'}
							Smart Import
						{:else if currentView === 'disambiguation'}
							Clarify Your Request
						{:else if currentView === 'bulk-results'}
							Choose Tab
						{:else}
							Preview & Save
						{/if}
					</h2>
				</div>
				<button class="close-btn" onclick={resetAndClose} aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
						<path
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
						></path>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				{#if currentView === 'menu'}
					<div class="menu-view">
						<p class="subtitle">Import guitar tabs directly from Ultimate Guitar</p>

						<button class="main-card featured" onclick={showSmartView}>
							<span class="card-icon">🤖</span>
							<span class="card-title">Smart Import (AI-Powered)</span>
							<span class="card-desc">Just type what you want: "Beatles" or "Wonderwall by Oasis"</span>
						</button>

						<button class="main-card" onclick={showUrlView}>
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

							<button class="open-ug-btn" onclick={openUltimateGuitar}>
								🎸 Open Ultimate Guitar
							</button>
						</div>
					</div>
				{:else if currentView === 'url'}
					<div class="url-view">
						<div class="url-input-group">
							<label for="tab-url">Ultimate Guitar Tab URL</label>
							<input
								id="tab-url"
								type="url"
								bind:value={tabUrl}
								onkeypress={handleKeyPress}
								placeholder="https://tabs.ultimate-guitar.com/tab/..."
								disabled={isLoading}
								autofocus
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

						<button
							class="fetch-btn"
							onclick={handleFetchTab}
							disabled={!tabUrl.trim() || isLoading}
						>
							{isLoading ? 'Fetching...' : 'Fetch Tab'}
						</button>
					</div>
				{:else if currentView === 'smart'}
					<div class="smart-view">
						<div class="smart-input-group">
							<label for="smart-query">What do you want to import?</label>
							<input
								id="smart-query"
								type="text"
								bind:value={smartQuery}
								onkeypress={handleKeyPress}
								placeholder="e.g., Fish in a Birdcage, Wonderwall by Oasis, or paste a URL..."
								disabled={isLoading}
								autofocus
							/>
							<p class="hint">
								Type an artist name to get all their tabs, or specify a song to import just that one!
							</p>
						</div>

						{#if errorMessage}
							<div class="error-message">⚠️ {errorMessage}</div>
						{/if}

						{#if isLoading}
							<div class="loading-state">
								<div class="spinner"></div>
								<p>Processing your request with AI...</p>

							{#if aiMetadata}
								<div class="ai-processing-details">
									<div class="ai-detail-item">
										<span class="detail-label">Model:</span>
										<span class="detail-value">{aiMetadata.model}</span>
									</div>
									<div class="ai-detail-item">
										<span class="detail-label">Token Usage:</span>
										<span class="detail-value">
											{aiMetadata.inputTokens} input + {aiMetadata.outputTokens} output = {aiMetadata.inputTokens + aiMetadata.outputTokens} total
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

						<div class="examples">
							<h3>Examples:</h3>
							<button class="example-chip" onclick={() => (smartQuery = 'Fish in a Birdcage')}>
								Fish in a Birdcage
							</button>
							<button class="example-chip" onclick={() => (smartQuery = 'Wonderwall by Oasis')}>
								Wonderwall by Oasis
							</button>
							<button class="example-chip" onclick={() => (smartQuery = 'Beatles')}>Beatles</button>
						</div>

						<button
							class="fetch-btn"
							onclick={handleSmartImport}
							disabled={!smartQuery.trim() || isLoading}
						>
							{isLoading ? 'Processing...' : '🚀 Smart Import'}
						</button>
					</div>
				{:else if currentView === 'disambiguation'}
					<div class="disambiguation-view">
						{#if disambiguationData}
							<div class="disambiguation-header">
								<p class="query-display">"{disambiguationData.query}"</p>
								<p class="reason-text">{disambiguationData.reason}</p>
							</div>

							<div class="options-container">
								<h3>What did you mean?</h3>

								{#if disambiguationData.suggestions && disambiguationData.suggestions.length > 0}
									<div class="suggestions-section">
										<h4>Did you mean:</h4>
										{#each disambiguationData.suggestions as suggestion}
											<button
												class="suggestion-option"
												onclick={() => handleDisambiguationChoice('suggestion', suggestion)}
											>
												<span class="option-icon">💡</span>
												<span class="option-text">{suggestion}</span>
											</button>
										{/each}
									</div>
								{/if}

								{#if disambiguationData.possibleArtist}
									<button
										class="choice-option"
										onclick={() => handleDisambiguationChoice('artist')}
									>
										<span class="option-icon">🎸</span>
										<div class="option-content">
											<span class="option-title">All tabs by artist</span>
											<span class="option-desc">{disambiguationData.possibleArtist}</span>
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

								{#if disambiguationData.possibleSong}
									<button class="choice-option" onclick={() => handleDisambiguationChoice('song')}>
										<span class="option-icon">🎵</span>
										<div class="option-content">
											<span class="option-title">Search for song</span>
											<span class="option-desc">{disambiguationData.possibleSong}</span>
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
						{/if}
					</div>
				{:else if currentView === 'bulk-results'}
					<div class="bulk-results-view">
						<p class="results-count">Found {bulkResults.length} tabs</p>

						<div class="tabs-list">
							{#each bulkResults as tab}
								<button class="tab-item" onclick={() => selectBulkTab(tab)}>
									<div class="tab-info">
										<span class="tab-title">{tab.title}</span>
										<span class="tab-meta">{tab.type}</span>
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
							{/each}
						</div>
					</div>
				{:else if currentView === 'preview'}
					<div class="preview-view">
						<div class="form-group">
							<label for="preview-title">Tab Title *</label>
							<input id="preview-title" type="text" bind:value={tabTitle} />
						</div>

						<div class="form-group">
							<label for="preview-artist">Artist</label>
							<input id="preview-artist" type="text" bind:value={tabArtist} />
						</div>

						<div class="form-group preview-content-group">
							<label for="preview-content">Tab Content *</label>
							<textarea
								id="preview-content"
								bind:value={pastedContent}
								rows="15"
								placeholder="Tab content will appear here..."
							></textarea>
							<p class="hint">You can edit the content before saving</p>
						</div>

						<button
							class="import-btn"
							onclick={handleImport}
							disabled={!pastedContent.trim() || !tabTitle.trim()}
						>
							💾 Save to My Tabs
						</button>
					</div>
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
		background-color: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--blur-md);
		z-index: var(--z-modal);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.modal-panel {
		background-color: var(--color-surface-high);
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
		box-shadow: var(--shadow-2xl);
		width: 100%;
		max-width: 800px;
		height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.modal-header {
		padding: var(--spacing-lg) var(--spacing-xl);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.back-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: var(--spacing-xs);
		min-height: var(--touch-target-min);
		min-width: var(--touch-target-min);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
		border-radius: var(--radius-lg);
	}

	.back-btn:hover {
		color: var(--color-text-primary);
		background-color: var(--color-hover);
	}

	.back-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: var(--spacing-xs);
		min-height: var(--touch-target-min);
		min-width: var(--touch-target-min);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
	}

	.close-btn:hover {
		background-color: var(--color-hover);
		color: var(--color-text-primary);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.close-btn svg {
		width: 24px;
		height: 24px;
		fill: currentColor;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* Menu View */
	.menu-view {
		padding: var(--spacing-xl);
	}

	.subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xl);
		text-align: center;
	}

	.main-card {
		background: var(--color-surface-low);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-2xl) var(--spacing-xl);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		transition: var(--transition-all);
		text-align: center;
		margin-bottom: var(--spacing-2xl);
		width: 100%;
		min-height: var(--touch-target-comfortable);
	}

	.main-card:hover {
		border-color: var(--color-primary);
		background-color: var(--color-hover);
		transform: translateY(-2px);
		box-shadow: var(--glow-primary);
	}

	.main-card:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.main-card.featured {
		border-color: var(--color-primary);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
	}

	.main-card.featured:hover {
		background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary));
		box-shadow: var(--glow-primary);
	}

	.card-icon {
		font-size: var(--font-size-2xl);
		line-height: 1;
	}

	.card-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.main-card.featured .card-title {
		color: var(--color-text-inverse);
	}

	.card-desc {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.main-card.featured .card-desc {
		color: var(--color-text-inverse);
		opacity: 0.9;
	}

	.instructions {
		background-color: var(--color-surface-low);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.instructions h3 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.instructions ol {
		margin: 0 0 var(--spacing-lg) 0;
		padding-left: var(--spacing-xl);
		color: var(--color-text-secondary);
	}

	.instructions li {
		margin-bottom: var(--spacing-sm);
	}

	.open-ug-btn {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-xl);
		min-height: var(--touch-target-min);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.open-ug-btn:hover {
		transform: translateY(-1px);
		box-shadow: var(--glow-primary);
	}

	.open-ug-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	/* URL View */
	.url-view {
		padding: var(--spacing-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.url-input-group {
		margin-bottom: var(--spacing-xl);
	}

	.url-input-group label {
		display: block;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		font-size: var(--font-size-sm);
	}

	.url-input-group input {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-lg);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-family: inherit;
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		transition: var(--transition-all);
	}

	.url-input-group input:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: var(--glow-primary);
	}

	.url-input-group input:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.url-input-group input:disabled {
		background-color: var(--color-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--spacing-sm);
		margin-bottom: 0;
	}

	.error-message {
		padding: var(--spacing-md);
		background-color: var(--color-error);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		color: var(--color-text-inverse);
		margin-bottom: var(--spacing-lg);
		text-align: center;
		opacity: 0.9;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl) var(--spacing-lg);
		gap: var(--spacing-lg);
		flex: 1;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-border);
		border-top: 4px solid var(--color-primary);
		border-radius: var(--radius-full);
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
		color: var(--color-text-secondary);
		margin: 0;
	}

	/* AI Processing Details */
	.ai-processing-details {
		margin-top: var(--spacing-2xl);
		padding: var(--spacing-xl);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-lg);
		border: 2px solid var(--color-border);
		text-align: left;
		width: 100%;
		max-width: 600px;
	}

	.ai-detail-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
		font-size: var(--font-size-sm);
	}

	.detail-label {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		min-width: 100px;
	}

	.detail-value {
		color: var(--color-text-primary);
		font-family: 'Courier New', monospace;
		font-size: var(--font-size-xs);
	}

	.ai-thinking-section {
		margin-top: var(--spacing-xl);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.ai-thinking-section .detail-label {
		display: block;
		margin-bottom: var(--spacing-sm);
	}

	.ai-response {
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		overflow-x: auto;
		max-height: 200px;
		overflow-y: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: 'Courier New', Courier, monospace;
	}

	.fetch-btn {
		padding: var(--spacing-lg) var(--spacing-2xl);
		min-height: var(--touch-target-min);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-full);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--letter-spacing-tight);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-lg);
		margin-top: auto;
	}

	.fetch-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--glow-primary);
	}

	.fetch-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.fetch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		background: var(--color-disabled);
	}

	/* Smart View */
	.smart-view {
		padding: var(--spacing-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.smart-input-group {
		margin-bottom: var(--spacing-xl);
	}

	.smart-input-group label {
		display: block;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		font-size: var(--font-size-sm);
	}

	.smart-input-group input {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-lg);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-family: inherit;
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		transition: var(--transition-all);
	}

	.smart-input-group input:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: var(--glow-primary);
	}

	.smart-input-group input:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.smart-input-group input:disabled {
		background-color: var(--color-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.examples {
		margin-bottom: var(--spacing-xl);
	}

	.examples h3 {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
		font-weight: var(--font-weight-semibold);
	}

	.example-chip {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-lg);
		min-height: var(--touch-target-min);
		background-color: var(--color-surface-low);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		margin-right: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		cursor: pointer;
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		transition: var(--transition-all);
	}

	.example-chip:hover {
		background-color: var(--color-hover);
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: translateY(-1px);
	}

	.example-chip:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	/* Disambiguation View */
	.disambiguation-view {
		padding: var(--spacing-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.disambiguation-header {
		margin-bottom: var(--spacing-xl);
		text-align: center;
	}

	.query-display {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
	}

	.reason-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.options-container h3 {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-lg);
		font-weight: var(--font-weight-semibold);
	}

	.suggestions-section {
		margin-bottom: var(--spacing-xl);
		padding: var(--spacing-lg);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.suggestions-section h4 {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-md) 0;
		font-weight: var(--font-weight-semibold);
	}

	.suggestion-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		min-height: var(--touch-target-min);
		background-color: var(--color-surface-high);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--spacing-sm);
		cursor: pointer;
		transition: var(--transition-all);
		width: 100%;
		text-align: left;
	}

	.suggestion-option:hover {
		background-color: var(--color-hover);
		border-color: var(--color-primary);
		transform: translateX(4px);
	}

	.suggestion-option:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.choice-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		min-height: var(--touch-target-min);
		background: var(--color-surface-low);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--spacing-md);
		cursor: pointer;
		transition: var(--transition-all);
		width: 100%;
		text-align: left;
	}

	.choice-option:hover {
		border-color: var(--color-primary);
		background-color: var(--color-hover);
		transform: translateX(4px);
	}

	.choice-option:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.option-icon {
		font-size: var(--font-size-xl);
		flex-shrink: 0;
	}

	.option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.option-title {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
	}

	.option-desc {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.option-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
	}

	.choice-option svg {
		color: var(--color-text-tertiary);
		transition: var(--transition-all);
	}

	.choice-option:hover svg {
		color: var(--color-primary);
	}

	/* Bulk Results View */
	.bulk-results-view {
		padding: var(--spacing-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.results-count {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		background-color: var(--color-surface-low);
		border-radius: var(--radius-lg);
		text-align: center;
		font-weight: var(--font-weight-semibold);
	}

	.tabs-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.tab-item {
		background: var(--color-surface-low);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		min-height: var(--touch-target-min);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: var(--transition-all);
		text-align: left;
		width: 100%;
	}

	.tab-item:hover {
		border-color: var(--color-primary);
		background-color: var(--color-hover);
		transform: translateX(4px);
	}

	.tab-item:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.tab-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.tab-title {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
	}

	.tab-meta {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.tab-item svg {
		color: var(--color-text-tertiary);
		transition: var(--transition-all);
	}

	.tab-item:hover svg {
		color: var(--color-primary);
	}

	/* Preview View */
	.preview-view {
		padding: var(--spacing-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: var(--spacing-lg);
	}

	.form-group label {
		display: block;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		font-size: var(--font-size-sm);
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: var(--spacing-md);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		font-family: inherit;
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		transition: var(--transition-all);
	}

	.form-group textarea {
		font-family: 'Courier New', monospace;
		resize: vertical;
		min-height: 300px;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: var(--glow-primary);
	}

	.form-group input:focus-visible,
	.form-group textarea:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.preview-content-group {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.preview-content-group textarea {
		flex: 1;
	}

	.import-btn {
		padding: var(--spacing-lg) var(--spacing-2xl);
		min-height: var(--touch-target-min);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-full);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--letter-spacing-tight);
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-lg);
		margin-top: var(--spacing-lg);
	}

	.import-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--glow-primary);
	}

	.import-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.import-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		background: var(--color-disabled);
	}


	/* Mobile Responsive */
	@media (max-width: 600px) {
		.modal-panel {
			max-height: 95vh;
		}
	}
</style>
