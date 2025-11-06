<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';
	import { groupTabVersions } from '$lib/utils/tabVersions';
	import { BottomSheet } from '$features/shared/components';
	import { getService, TYPES } from '$core/di';
	import type { IUrlImportService, ISmartImportService } from '../services/contracts';
	import { createImportState } from '../state/import-state.svelte';
	import ImportMenuView from './views/ImportMenuView.svelte';
	import ImportUrlView from './views/ImportUrlView.svelte';
	import ImportSmartView from './views/ImportSmartView.svelte';
	import ImportPasteView from './views/ImportPasteView.svelte';
	import ImportDisambiguationView from './views/ImportDisambiguationView.svelte';
	import ImportBulkResultsView from './views/ImportBulkResultsView.svelte';
import ImportPreviewView from './views/ImportPreviewView.svelte';
import ImportActivityLog from './ImportActivityLog.svelte';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { open = $bindable(false), onclose, onimport }: Props = $props();

	// Lazy service resolution - only resolve when needed
	let urlImportService: IUrlImportService | null = null;
	let smartImportService: ISmartImportService | null = null;

	function getUrlImportService(): IUrlImportService {
		if (!urlImportService) {
			urlImportService = getService<IUrlImportService>(TYPES.IUrlImportService);
		}
		return urlImportService;
	}

	function getSmartImportService(): ISmartImportService {
		if (!smartImportService) {
			smartImportService = getService<ISmartImportService>(TYPES.ISmartImportService);
		}
		return smartImportService;
	}

	// Create state
	const state = createImportState();

	// View title mapping
	const viewTitles = {
		menu: 'Import from Web',
		url: 'Paste Tab URL',
		smart: 'Import Tab',
		paste: 'Paste Tab Content',
		disambiguation: 'Clarify Your Request',
		'bulk-results': 'Choose a Tab',
		preview: 'Preview & Edit'
	};

	// Keyboard event handlers
	function handleUrlKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && state.tabUrl.trim()) {
			handleFetchFromUrl();
		}
	}

	function handleSmartKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && state.smartQuery.trim()) {
			handleSmartImport();
		}
	}

	// URL Import
	async function handleFetchFromUrl() {
		state.isLoading = true;
		state.loadingMessage = 'Fetching tab from Ultimate Guitar...';
		state.clearError();

		const result = await getUrlImportService().fetchFromUrl(state.tabUrl);

		if (result.success) {
			state.setPreviewData(result.title || 'Imported Tab', result.artist || '', result.content || '');
		} else {
			state.errorMessage = result.error || 'Failed to fetch tab';
		}

		state.isLoading = false;
	}

	// Smart Import
	async function handleSmartImport() {
		state.isLoading = true;
		state.loadingMessage = 'Analyzing your request...';
		state.loadingLogs = [];
		state.clearError();

		// Progress callback to update loading message in real-time
		const onProgress = (step: string, details?: string) => {
			state.loadingMessage = details || step;
			console.log(`📊 Progress: ${step}${details ? ` - ${details}` : ''}`);
		};

		const result = await getSmartImportService().processQuery(state.smartQuery, onProgress);
		state.loadingLogs = result.progressLog || [];

		console.log('🎯 Import result received:', result);
		console.log('🎯 Result type:', result.type);
		console.log('🎯 Result success:', result.success);
		console.log('🎯 Result tabs:', result.tabs);

		if (result.success) {
			// Store AI metadata if available
			if (result._meta) {
				state.aiMetadata = {
					model: result._meta.model,
					inputTokens: result._meta.inputTokens,
					outputTokens: result._meta.outputTokens,
					rawResponse: result._meta.rawResponse
				};
			}

			// Handle different result types
			if (result.type === 'ambiguous' || result.type === 'ambiguous_with_results') {
				state.disambiguationData = {
					query: result.query || state.smartQuery,
					reason: result.ambiguityReason || 'Please clarify your request',
					suggestions: result.suggestions || [],
					possibleArtist: result.possibleArtist,
					possibleSong: result.possibleSong,
					searchResults: result.searchResults || []
				};
				state.currentView = 'disambiguation';
			} else if (result.type === 'artist_bulk') {
				state.loadingMessage = `Found ${result.count || result.tabs?.length || 0} tabs...`;
				state.bulkResults = result.tabs || [];
				state.groupedResults = groupTabVersions(state.bulkResults);
				state.currentView = 'bulk-results';

				// Show fallback message if applicable
				if (result.fallback && result.message) {
					state.errorMessage = result.message;
				}
			} else if (result.type === 'single_tab' || result.type === 'ai_generated') {
				state.loadingMessage = 'Loading tab content...';
				state.setPreviewData(
					result.tab?.title || 'Imported Tab',
					result.tab?.artist || '',
					result.tab?.content || ''
				);
			}
		} else {
			state.errorMessage = result.error || 'Failed to process your request';
			state.errorSuggestions = result.suggestions || [];
		}

		state.isLoading = false;
	}

	// Bulk Results - Select a tab
	async function handleSelectBulkTab(tab: any) {
		state.isLoading = true;
		state.clearError();

		const result = await getUrlImportService().fetchFromUrl(tab.url);

		if (result.success) {
			state.setPreviewData(
				result.title || tab.title,
				result.artist || tab.artist,
				result.content || ''
			);
		} else {
			state.errorMessage = result.error || 'Failed to fetch tab';
		}

		state.isLoading = false;
	}

	// Disambiguation - Handle user choice
	async function handleDisambiguationChoice(
		choice: 'artist' | 'song' | 'suggestion',
		value?: string
	) {
		if (!state.disambiguationData) return;

		if (choice === 'suggestion' && value) {
			// User selected a suggestion - run smart import again
			state.smartQuery = value;
			state.disambiguationData = null;
			await handleSmartImport();
		} else if (choice === 'artist' && state.disambiguationData.possibleArtist) {
			// Fetch all tabs by artist
			await handleArtistImport(state.disambiguationData.possibleArtist);
		} else if (choice === 'song') {
			// Search for specific song
			await handleSongImport(
				state.disambiguationData.possibleSong || state.disambiguationData.query,
				state.disambiguationData.possibleArtist
			);
		}
	}

	// Artist Import
	async function handleArtistImport(artistName: string) {
		state.isLoading = true;
		state.clearError();

		const result = await getSmartImportService().fetchArtistTabs(artistName);

		if (result.success) {
			state.bulkResults = result.tabs || [];
			state.groupedResults = groupTabVersions(state.bulkResults);
			state.currentView = 'bulk-results';
		} else {
			state.errorMessage = result.error || 'Could not find tabs for this artist';
		}

		state.isLoading = false;
	}

	// Song Import
	async function handleSongImport(songName: string, artistName?: string) {
		state.isLoading = true;
		state.clearError();

		const result = await getSmartImportService().searchSong(songName, artistName);

		if (result.success && result.tab) {
			// Fetch the full tab content
			const fetchResult = await getUrlImportService().fetchFromUrl(result.tab.url);

			if (fetchResult.success) {
				state.setPreviewData(
					fetchResult.title || result.tab.title,
					fetchResult.artist || result.tab.artist,
					fetchResult.content || ''
				);
			} else {
				state.errorMessage = fetchResult.error || 'Failed to fetch tab';
			}
		} else {
			state.errorMessage = result.error || 'Could not find this song';
		}

		state.isLoading = false;
	}

	// Final Import
	function handleImport() {
		if (!state.tabTitle.trim() || !state.pastedContent.trim()) {
			state.errorMessage = 'Title and content are required';
			return;
		}

		const newTab: Tab = {
			id: crypto.randomUUID(),
			title: state.tabTitle,
			artist: state.tabArtist || undefined,
			content: state.pastedContent,
			createdAt: Date.now()
		};

		onimport?.(newTab);
		resetAndClose();
	}

	// Navigation
	function goBack() {
		if (state.currentView === 'preview' || state.currentView === 'bulk-results') {
			state.currentView = 'smart';
		} else if (state.currentView === 'disambiguation') {
			state.currentView = 'smart';
		} else {
			state.currentView = 'smart';
		}
		state.clearError();
	}

	function resetAndClose() {
		state.reset();
		onclose?.();
	}
</script>

<BottomSheet bind:open onOpenChange={(newOpen) => !newOpen && resetAndClose()}>
	<div class="web-import-content">
		<div class="modal-header">
			<div class="header-left">
				{#if state.currentView !== 'smart'}
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
				<h2>{viewTitles[state.currentView]}</h2>
			</div>
			<button class="close-btn" onclick={resetAndClose} aria-label="Close">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="modal-content">
			{#if state.currentView === 'menu'}
				<ImportMenuView
					onSelectUrl={() => state.navigateToView('url')}
					onSelectSmart={() => state.navigateToView('smart')}
				/>
			{:else if state.currentView === 'url'}
				<ImportUrlView
					bind:url={state.tabUrl}
					isLoading={state.isLoading}
					errorMessage={state.errorMessage}
					onUrlChange={(url) => (state.tabUrl = url)}
					onFetch={handleFetchFromUrl}
					onKeyPress={handleUrlKeyPress}
				/>
			{:else if state.currentView === 'smart'}
				<ImportSmartView
					bind:query={state.smartQuery}
					isLoading={state.isLoading}
					loadingMessage={state.loadingMessage}
					progressLog={state.loadingLogs}
					errorMessage={state.errorMessage}
					errorSuggestions={state.errorSuggestions}
					aiMetadata={state.aiMetadata}
					onQueryChange={(query) => (state.smartQuery = query)}
					onSubmit={handleSmartImport}
					onKeyPress={handleSmartKeyPress}
					onShowPaste={() => state.navigateToView('paste')}
				/>
			{:else if state.currentView === 'paste'}
				<ImportPasteView
					bind:title={state.tabTitle}
					bind:artist={state.tabArtist}
					bind:content={state.pastedContent}
					errorMessage={state.errorMessage}
					onTitleChange={(title) => (state.tabTitle = title)}
					onArtistChange={(artist) => (state.tabArtist = artist)}
					onContentChange={(content) => (state.pastedContent = content)}
					onImport={handleImport}
					onShowSmart={() => state.navigateToView('smart')}
				/>
			{:else if state.currentView === 'disambiguation'}
				{#if state.disambiguationData}
					<ImportDisambiguationView
						data={state.disambiguationData}
						onChoice={handleDisambiguationChoice}
					/>
				{/if}
			{:else if state.currentView === 'bulk-results'}
				<ImportBulkResultsView
					results={state.bulkResults}
					groupedResults={state.groupedResults}
					expandedGroups={state.expandedGroups}
					onSelectTab={handleSelectBulkTab}
					onToggleGroup={(groupKey) => state.toggleGroupExpansion(groupKey)}
				/>
			{:else if state.currentView === 'preview'}
				<ImportPreviewView
					bind:title={state.tabTitle}
					bind:artist={state.tabArtist}
					bind:content={state.pastedContent}
					onTitleChange={(title) => (state.tabTitle = title)}
					onArtistChange={(artist) => (state.tabArtist = artist)}
					onContentChange={(content) => (state.pastedContent = content)}
					onImport={handleImport}
				/>
			{/if}

			{#if state.currentView !== 'smart' && state.loadingLogs.length > 0}
				<ImportActivityLog entries={state.loadingLogs} heading="AI Activity" />
			{/if}
		</div>
	</div>
</BottomSheet>

<style>
	.web-import-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-height: 85vh;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e5e5;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-btn,
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #666;
		transition: color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-btn:hover,
	.close-btn:hover {
		color: #333;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #333;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.modal-header {
			border-bottom-color: #444;
		}

		h2 {
			color: #e0e0e0;
		}

		.back-btn,
		.close-btn {
			color: #aaa;
		}

		.back-btn:hover,
		.close-btn:hover {
			color: #e0e0e0;
		}
	}
</style>
