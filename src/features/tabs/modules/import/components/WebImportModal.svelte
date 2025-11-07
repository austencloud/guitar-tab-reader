<script lang="ts">
	import type { Tab } from '$lib/state/tabs.svelte';
	import { groupTabVersions } from '$lib/utils/tabVersions';
	import { BottomSheet } from '$features/shared/components';
	import { getService, TYPES } from '$core/di';
	import type { IUrlImportService, ISmartImportService } from '../services/contracts';
	import { createImportState } from '../state/import-state.svelte';
import ImportUrlView from './views/ImportUrlView.svelte';
import ImportDualSearchView from './views/ImportDualSearchView.svelte';
import ImportPasteView from './views/ImportPasteView.svelte';
import ImportDisambiguationView from './views/ImportDisambiguationView.svelte';
import ImportBulkResultsView from './views/ImportBulkResultsView.svelte';
import ImportPreviewView from './views/ImportPreviewView.svelte';
import ImportActivityLog from './ImportActivityLog.svelte';
import type { ImportView } from '../domain/types';

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

type PrimaryMode = 'smart' | 'url' | 'paste';

const primaryModes: Array<{ id: PrimaryMode; label: string; description: string }> = [
	{
		id: 'smart',
		label: 'AI Search',
		description: 'Let AI find the right tab'
	},
	{
		id: 'url',
		label: 'Import Link',
		description: 'Fetch a tab from Ultimate Guitar'
	},
	{
		id: 'paste',
		label: 'Paste Text',
		description: 'Drop in tab content you already have'
	}
];

const primaryModeLookup = primaryModes.reduce(
	(acc, mode) => {
		acc[mode.id] = mode;
		return acc;
	},
	{} as Record<PrimaryMode, { id: PrimaryMode; label: string; description: string }>
);

const PRIMARY_VIEW_SET = new Set<ImportView>(['smart', 'url', 'paste']);

const viewTitles: Record<ImportView, string> = {
	menu: 'Choose how you want to add a tab',
	url: 'Import from a link',
	smart: 'Find tabs with AI',
	paste: 'Paste tab content',
	disambiguation: 'Clarify Your Request',
	'bulk-results': 'Choose a Tab',
	preview: 'Preview & Edit'
};

function getPrimaryMode(view: ImportView): PrimaryMode {
	if (view === 'url') return 'url';
	if (view === 'paste') return 'paste';
	return 'smart';
}

function selectPrimaryMode(mode: PrimaryMode) {
	state.navigateToView(mode);
	state.clearError();
	state.isLoading = false;
}

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
		// Construct query based on search mode
		let query = '';
		
		if (state.searchMode === 'artist') {
			query = state.artistQuery.trim();
		} else if (state.searchMode === 'song') {
			if (state.songArtistQuery.trim()) {
				query = `${state.songQuery.trim()} by ${state.songArtistQuery.trim()}`;
			} else {
				query = state.songQuery.trim();
			}
		} else {
			query = state.smartQuery.trim();
		}

		if (!query) {
			state.errorMessage = 'Please enter a search query';
			return;
		}

		state.isLoading = true;
		state.loadingMessage = 'Analyzing your request...';
		state.loadingLogs = [];
		state.clearError();

		// Progress callback to update loading message in real-time
		const onProgress = (step: string, details?: string) => {
			state.loadingMessage = details || step;
			console.log(`📊 Progress: ${step}${details ? ` - ${details}` : ''}`);
		};

		// For artist mode, force artist bulk import
		if (state.searchMode === 'artist') {
			const result = await getSmartImportService().fetchArtistTabs(query);
			state.isLoading = false;
			
			if (result.success) {
				state.bulkResults = result.tabs || [];
				state.groupedResults = groupTabVersions(state.bulkResults);
				state.currentView = 'bulk-results';
			} else {
				state.errorMessage = result.error || 'Could not find tabs for this artist';
			}
			return;
		}

		// For song mode, force song search
		if (state.searchMode === 'song') {
			const result = await getSmartImportService().searchSong(
				state.songQuery.trim(),
				state.songArtistQuery.trim() || undefined
			);
			state.isLoading = false;
			
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
				// Show disambiguation with search results if available
				if (result.tabs && result.tabs.length > 0) {
					state.bulkResults = result.tabs;
					state.groupedResults = groupTabVersions(state.bulkResults);
					state.currentView = 'bulk-results';
				} else {
					state.errorMessage = result.error || 'Could not find this song';
					state.errorSuggestions = result.suggestions || [];
				}
			}
			return;
		}

		// Smart mode - use AI
		const result = await getSmartImportService().processQuery(query, onProgress);
		state.loadingLogs = result.progressLog || [];

		console.log('🎯 Import result received:', result);
		console.log('🎯 Result type:', result.type);
		console.log('🎯 Result success:', result.success);
		console.log('🎯 Result tabs:', result.tabs);

		// Stop loading FIRST before changing views
		state.isLoading = false;

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
		if (state.currentView === 'preview' && state.hasBulkResults) {
			state.navigateToView('bulk-results');
		} else {
			state.navigateToView('smart');
		}
		state.isLoading = false;
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
				{#if !PRIMARY_VIEW_SET.has(state.currentView)}
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
			<div class="header-text">
				<h2>Add a Tab</h2>
				<p class="header-tagline">AI search · Import link · Paste text</p>
				<p class="header-status">
					{#if PRIMARY_VIEW_SET.has(state.currentView)}
						{@const activeMode = getPrimaryMode(state.currentView)}
						{primaryModeLookup[activeMode].label}
					{:else}
						{viewTitles[state.currentView]}
					{/if}
				</p>
			</div>
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

	<div class="mode-switcher" role="group" aria-label="Select how to add a tab">
		{#each primaryModes as mode}
			{@const activeMode = getPrimaryMode(state.currentView)}
			<button
				type="button"
				class="mode-pill"
				class:active={activeMode === mode.id}
				aria-pressed={activeMode === mode.id}
				onclick={() => selectPrimaryMode(mode.id)}
			>
				<span class="mode-label">{mode.label}</span>
				<span class="mode-description">{mode.description}</span>
			</button>
		{/each}
	</div>

		<div class="modal-content">
			{#if state.currentView === 'url'}
				<ImportUrlView
					bind:url={state.tabUrl}
					isLoading={state.isLoading}
					errorMessage={state.errorMessage}
					onUrlChange={(url) => (state.tabUrl = url)}
					onFetch={handleFetchFromUrl}
					onKeyPress={handleUrlKeyPress}
				/>
			{:else if state.currentView === 'smart'}
				<ImportDualSearchView
					bind:searchMode={state.searchMode}
					bind:artistQuery={state.artistQuery}
					bind:songQuery={state.songQuery}
					bind:songArtistQuery={state.songArtistQuery}
					bind:smartQuery={state.smartQuery}
					isLoading={state.isLoading}
					loadingMessage={state.loadingMessage}
					progressLog={state.loadingLogs}
					errorMessage={state.errorMessage}
					errorSuggestions={state.errorSuggestions}
					aiMetadata={state.aiMetadata}
					onSearchModeChange={(mode) => (state.searchMode = mode)}
					onArtistQueryChange={(query) => (state.artistQuery = query)}
					onSongQueryChange={(song) => (state.songQuery = song)}
					onSongArtistQueryChange={(artist) => (state.songArtistQuery = artist)}
					onSmartQueryChange={(query) => (state.smartQuery = query)}
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

	.header-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.header-tagline {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.header-status {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #111827;
		opacity: 0.8;
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

	.mode-switcher {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid #f1f5f9;
		background: #f8fafc;
	}

	.mode-pill {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		color: #111827;
	}

	.mode-pill:hover {
		border-color: #cbd5f5;
		box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
		transform: translateY(-1px);
	}

	.mode-pill.active {
		border-color: #4f46e5;
		background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(59, 130, 246, 0.08));
		color: #1e3a8a;
		box-shadow: 0 6px 18px rgba(79, 70, 229, 0.15);
	}

	.mode-pill.active .mode-label {
		color: inherit;
	}

	.mode-label {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.mode-description {
		font-size: 0.75rem;
		color: #475569;
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

		.header-tagline {
			color: #94a3b8;
		}

		.header-status {
			color: #cbd5f5;
			opacity: 1;
		}

		.back-btn,
		.close-btn {
			color: #aaa;
		}

		.back-btn:hover,
		.close-btn:hover {
			color: #e0e0e0;
		}

		.mode-switcher {
			border-bottom-color: rgba(148, 163, 184, 0.3);
			background: rgba(15, 23, 42, 0.6);
		}

		.mode-pill {
			background: rgba(15, 23, 42, 0.8);
			border-color: rgba(148, 163, 184, 0.35);
			color: #e2e8f0;
		}

		.mode-pill:hover {
			border-color: rgba(148, 163, 184, 0.6);
		}

		.mode-pill.active {
			border-color: rgba(165, 180, 252, 0.8);
			background: linear-gradient(
				135deg,
				rgba(129, 140, 248, 0.25),
				rgba(59, 130, 246, 0.25)
			);
			color: #cbd5f5;
		}

		.mode-description {
			color: rgba(203, 213, 225, 0.8);
		}
	}

	@media (max-width: 640px) {
		.mode-switcher {
			grid-template-columns: 1fr;
			padding: 0.75rem 1rem;
		}

		.header-left {
			align-items: flex-start;
		}
	}
</style>
