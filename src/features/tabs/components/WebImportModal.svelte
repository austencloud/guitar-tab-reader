<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';
	import { browser } from '$app/environment';
	import { groupTabVersions, type TabGroup } from '$lib/utils/tabVersions';
	import { BottomSheet } from '$features/shared/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { open = $bindable(false), onclose, onimport }: Props = $props();

	let currentView = $state<
		'menu' | 'url' | 'smart' | 'paste' | 'disambiguation' | 'bulk-results' | 'preview'
	>('smart');
	let tabUrl = $state('');
	let smartQuery = $state('');
	let disambiguationData = $state<{
		query: string;
		reason: string;
		suggestions: string[];
		possibleArtist?: string;
		possibleSong?: string;
		searchResults?: any[];
	} | null>(null);
	let bulkResults = $state<any[]>([]);
	let groupedResults = $state<Map<string, TabGroup>>(new Map());
	let expandedGroups = $state<Set<string>>(new Set());
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

	function showPasteView() {
		currentView = 'paste';
		pastedContent = '';
		tabTitle = '';
		tabArtist = '';
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
				if (data.type === 'ambiguous' || data.type === 'ambiguous_with_results') {
					// Show disambiguation options (with or without live search results)
					disambiguationData = {
						query: data.query,
						reason: data.ambiguityReason,
						suggestions: data.suggestions || [],
						possibleArtist: data.possibleArtist,
						possibleSong: data.possibleSong,
						searchResults: data.searchResults || []
					};
					currentView = 'disambiguation';
				} else if (data.type === 'artist_bulk') {
					// Show bulk results for user to choose from
					bulkResults = data.tabs || [];
					groupedResults = groupTabVersions(bulkResults);
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

	function toggleGroupExpansion(groupKey: string) {
		if (expandedGroups.has(groupKey)) {
			expandedGroups.delete(groupKey);
		} else {
			expandedGroups.add(groupKey);
		}
		// Trigger reactivity
		expandedGroups = new Set(expandedGroups);
	}

	function formatVotes(votes?: number): string {
		if (!votes) return '';
		if (votes >= 1000) {
			return `${(votes / 1000).toFixed(1)}k`;
		}
		return votes.toString();
	}

	function renderStars(rating?: number): string {
		if (!rating) return '';
		const filled = '★'.repeat(rating);
		const empty = '☆'.repeat(5 - rating);
		return filled + empty;
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
				groupedResults = groupTabVersions(bulkResults);
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
		currentView = 'smart';
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
			} else {
				currentView = 'smart';
			}
		} else if (currentView === 'bulk-results') {
			if (disambiguationData) {
				currentView = 'disambiguation';
			} else {
				currentView = 'smart';
			}
		} else if (currentView === 'disambiguation') {
			currentView = 'smart';
		} else if (currentView === 'paste') {
			currentView = 'smart';
		} else if (currentView === 'url' || currentView === 'smart') {
			// Close the modal instead of going back to menu
			resetAndClose();
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

<BottomSheet bind:open onOpenChange={(newOpen) => !newOpen && resetAndClose()}>
	<div class="web-import-content">
		<div class="modal-header">
				<div class="header-left">
					{#if currentView !== 'smart'}
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
							Import Tab
						{:else if currentView === 'paste'}
							Paste Tab Content
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

						<div class="view-toggle">
							<button class="toggle-link" onclick={showPasteView}>
								Or paste tab text directly →
							</button>
						</div>
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
							{#each Array.from(groupedResults.values()) as group}
								{@const groupKey = `${group.baseTitle}|${group.type}`}
								{@const isExpanded = expandedGroups.has(groupKey)}
								{@const hasMultiple = group.versions.length > 1}

								<div class="tab-group">
									<!-- Recommended version (always shown) -->
									<button
										class="tab-item recommended"
										onclick={() => selectBulkTab(group.recommendedVersion)}
									>
										<div class="tab-info">
											<div class="tab-title-row">
												<span class="tab-title">{group.recommendedVersion.title}</span>
												{#if hasMultiple && group.recommendedVersion.rating}
													<span class="recommended-badge">Recommended</span>
												{/if}
											</div>
											<div class="tab-meta-row">
												<span class="tab-type">{group.type}</span>
												{#if group.recommendedVersion.rating}
													<span class="tab-rating">
														{renderStars(group.recommendedVersion.rating)}
														<span class="vote-count"
															>({formatVotes(group.recommendedVersion.votes)} votes)</span
														>
													</span>
												{/if}
											</div>
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

									<!-- Show alternate versions button if there are multiple versions -->
									{#if hasMultiple}
										<button
											class="show-alternates-btn"
											onclick={() => toggleGroupExpansion(groupKey)}
										>
											<span>
												{isExpanded ? '▼' : '▶'} {group.alternateVersions.length} alternate version{group.alternateVersions.length !==
												1
													? 's'
													: ''}
											</span>
										</button>

										<!-- Alternate versions (shown when expanded) -->
										{#if isExpanded}
											<div class="alternate-versions">
												{#each group.alternateVersions as altVersion}
													<button
														class="tab-item alternate"
														onclick={() => selectBulkTab(altVersion)}
													>
														<div class="tab-info">
															<div class="tab-title-row">
																<span class="tab-title">{altVersion.title}</span>
															</div>
															<div class="tab-meta-row">
																{#if altVersion.rating}
																	<span class="tab-rating">
																		{renderStars(altVersion.rating)}
																		<span class="vote-count"
																			>({formatVotes(altVersion.votes)} votes)</span
																		>
																	</span>
																{/if}
															</div>
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
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else if currentView === 'paste'}
					<div class="paste-view">
						<p class="paste-instructions">
							Paste tab content directly from Ultimate Guitar or any other source:
						</p>

						<div class="form-group">
							<label for="paste-title">Tab Title *</label>
							<input
								id="paste-title"
								type="text"
								bind:value={tabTitle}
								placeholder="e.g., Wonderwall"
							/>
						</div>

						<div class="form-group">
							<label for="paste-artist">Artist</label>
							<input
								id="paste-artist"
								type="text"
								bind:value={tabArtist}
								placeholder="e.g., Oasis"
							/>
						</div>

						<div class="form-group paste-content-group">
							<label for="paste-content">Tab Content *</label>
							<textarea
								id="paste-content"
								bind:value={pastedContent}
								rows="15"
								placeholder="Paste tab content here..."
								autofocus
							></textarea>
						</div>

						{#if errorMessage}
							<div class="error-message">⚠️ {errorMessage}</div>
						{/if}

						<button
							class="import-btn"
							onclick={handleImport}
							disabled={!pastedContent.trim() || !tabTitle.trim()}
						>
							💾 Save Tab
						</button>

						<div class="view-toggle">
							<button class="toggle-link" onclick={showSmartView}>
								← Back to smart search
							</button>
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
</BottomSheet>

<style>
	.web-import-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e5e5;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.back-btn:hover {
		color: #333;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
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
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* Menu View */
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

	/* URL View */
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

	/* AI Processing Details */
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

	/* Smart View */
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

	.examples {
		margin-bottom: 1.5rem;
	}

	.examples h3 {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.75rem;
		font-weight: 600;
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

	/* Paste View */
	.paste-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.paste-instructions {
		font-size: 0.95rem;
		color: #666;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.paste-content-group {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.paste-content-group textarea {
		flex: 1;
		min-height: 300px;
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

	/* Disambiguation View */
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

	/* Bulk Results View */
	.bulk-results-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.results-count {
		font-size: 0.95rem;
		color: #666;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
	}

	.tabs-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tab-item {
		background: white;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.tab-item:hover {
		border-color: #4caf50;
		background-color: #f8fdf8;
		transform: translateX(4px);
	}

	.tab-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tab-title {
		font-weight: 600;
		color: #333;
		font-size: 1rem;
	}

	.tab-item svg {
		color: #999;
		transition: color 0.2s;
	}

	.tab-item:hover svg {
		color: #4caf50;
	}

	/* Tab versioning styles */
	.tab-group {
		margin-bottom: 0.75rem;
	}

	.tab-item.recommended {
		border-color: #4caf50;
		background: linear-gradient(135deg, #f8fdf8 0%, #ffffff 100%);
	}

	.tab-item.recommended:hover {
		border-color: #45a049;
		background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f1 100%);
	}

	.tab-item.alternate {
		border-color: #e0e0e0;
		background: #fafafa;
		margin-left: 1.5rem;
	}

	.tab-item.alternate:hover {
		border-color: #9e9e9e;
		background: #f5f5f5;
	}

	.tab-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.tab-meta-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
	}

	.tab-type {
		color: #666;
		font-weight: 500;
	}

	.tab-rating {
		color: #ff9800;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.vote-count {
		color: #999;
		font-size: 0.8rem;
	}

	.recommended-badge {
		background: #4caf50;
		color: white;
		font-size: 0.7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.show-alternates-btn {
		background: transparent;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
		color: #666;
		font-size: 0.85rem;
		text-align: left;
		width: 100%;
		transition: color 0.2s, background-color 0.2s;
		border-radius: 4px;
		margin-top: 0.25rem;
	}

	.show-alternates-btn:hover {
		color: #4caf50;
		background-color: rgba(76, 175, 80, 0.05);
	}

	.show-alternates-btn span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alternate-versions {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Preview View */
	.preview-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.form-group textarea {
		font-family: 'Courier New', monospace;
		resize: vertical;
		min-height: 300px;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		border-color: #4caf50;
		outline: none;
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
		margin-top: 1rem;
	}

	.import-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
	}

	.import-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.modal-header {
			border-color: #444;
		}

		.modal-header h2 {
			color: #e0e0e0;
		}

		.back-btn,
		.close-btn {
			color: #aaa;
		}

		.back-btn:hover,
		.close-btn:hover {
			color: #fff;
			background-color: rgba(255, 255, 255, 0.1);
		}

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

		.form-group label {
			color: #e0e0e0;
		}

		.form-group input,
		.form-group textarea,
		.url-input-group input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.hint {
			color: #aaa;
		}

		.main-card.featured {
			background: linear-gradient(135deg, #3a2a3e 0%, #2d1f31 100%);
			border-color: #7b1fa2;
		}

		.main-card.featured:hover {
			background: linear-gradient(135deg, #4a3a4e 0%, #3d2f41 100%);
			border-color: #9c27b0;
		}

		.smart-input-group input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.smart-input-group input:focus {
			border-color: #9c27b0;
		}

		.smart-input-group label {
			color: #e0e0e0;
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

		.results-count {
			background-color: rgba(255, 255, 255, 0.05);
			color: #ccc;
		}

		.tab-item {
			background-color: #2a2a2a;
			border-color: #444;
		}

		.tab-item:hover {
			background-color: #2d3d2d;
			border-color: #66bb6a;
		}

		.tab-title {
			color: #e0e0e0;
		}

		.tab-item svg {
			color: #777;
		}

		.tab-item:hover svg {
			color: #66bb6a;
		}

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

		/* AI Processing Details - Dark Mode */
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
