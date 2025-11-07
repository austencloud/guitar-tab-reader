import type { TabGroup } from '$lib/utils/tabVersions';
import type {
	ImportView,
	DisambiguationData,
	AIMetadata,
	ProgressLogEntry,
	ScrapedTab
} from '../domain/types';

/**
 * Import state factory function
 * Creates reactive state for the import modal using Svelte 5 runes
 */
export function createImportState() {
	// View state
	let currentView = $state<ImportView>('smart');

	// Search mode for the new dual/triple search UI
	let searchMode = $state<'artist' | 'song' | 'smart'>('smart');

	// Input state
	let tabUrl = $state('');
	let smartQuery = $state('');
	let artistQuery = $state(''); // For explicit artist search
	let songQuery = $state(''); // For explicit song search
	let songArtistQuery = $state(''); // Artist name when searching for a song
	let pastedContent = $state('');
	let tabTitle = $state('');
	let tabArtist = $state('');

	// Results state
	let disambiguationData = $state<DisambiguationData | null>(null);
	let bulkResults = $state<ScrapedTab[]>([]);
	let groupedResults = $state<Map<string, TabGroup>>(new Map());
	let expandedGroups = $state<Set<string>>(new Set());

	// UI state
	let isLoading = $state(false);
	let loadingMessage = $state('');
	let errorMessage = $state('');
	let errorSuggestions = $state<string[]>([]);
	let aiMetadata = $state<AIMetadata | null>(null);
	let loadingLogs = $state<ProgressLogEntry[]>([]);

	// Derived state
	const hasError = $derived(() => errorMessage.length > 0);
	const hasDisambiguation = $derived(() => disambiguationData !== null);
	const hasBulkResults = $derived(() => bulkResults.length > 0);
	const canImport = $derived(() => pastedContent.trim().length > 0 && tabTitle.trim().length > 0);

	return {
		// View state
		get currentView() {
			return currentView;
		},
		set currentView(value: ImportView) {
			currentView = value;
		},

		// Search mode
		get searchMode() {
			return searchMode;
		},
		set searchMode(value: 'artist' | 'song' | 'smart') {
			searchMode = value;
		},

		// Input state
		get tabUrl() {
			return tabUrl;
		},
		set tabUrl(value: string) {
			tabUrl = value;
		},

		get smartQuery() {
			return smartQuery;
		},
		set smartQuery(value: string) {
			smartQuery = value;
		},

		get artistQuery() {
			return artistQuery;
		},
		set artistQuery(value: string) {
			artistQuery = value;
		},

		get songQuery() {
			return songQuery;
		},
		set songQuery(value: string) {
			songQuery = value;
		},

		get songArtistQuery() {
			return songArtistQuery;
		},
		set songArtistQuery(value: string) {
			songArtistQuery = value;
		},

		get pastedContent() {
			return pastedContent;
		},
		set pastedContent(value: string) {
			pastedContent = value;
		},

		get tabTitle() {
			return tabTitle;
		},
		set tabTitle(value: string) {
			tabTitle = value;
		},

		get tabArtist() {
			return tabArtist;
		},
		set tabArtist(value: string) {
			tabArtist = value;
		},

		// Results state
		get disambiguationData() {
			return disambiguationData;
		},
		set disambiguationData(value: DisambiguationData | null) {
			disambiguationData = value;
		},

		get bulkResults() {
			return bulkResults;
		},
		set bulkResults(value: ScrapedTab[]) {
			bulkResults = value;
		},

		get groupedResults() {
			return groupedResults;
		},
		set groupedResults(value: Map<string, TabGroup>) {
			groupedResults = value;
		},

		get expandedGroups() {
			return expandedGroups;
		},
		set expandedGroups(value: Set<string>) {
			expandedGroups = value;
		},

		// UI state
		get isLoading() {
			return isLoading;
		},
		set isLoading(value: boolean) {
			isLoading = value;
		},

		get loadingMessage() {
			return loadingMessage;
		},
		set loadingMessage(value: string) {
			loadingMessage = value;
		},

		get errorMessage() {
			return errorMessage;
		},
		set errorMessage(value: string) {
			errorMessage = value;
		},

		get errorSuggestions() {
			return errorSuggestions;
		},
		set errorSuggestions(value: string[]) {
			errorSuggestions = value;
		},

		get aiMetadata() {
			return aiMetadata;
		},
		set aiMetadata(value: AIMetadata | null) {
			aiMetadata = value;
		},

		get loadingLogs() {
			return loadingLogs;
		},
		set loadingLogs(value: ProgressLogEntry[]) {
			loadingLogs = value;
		},

		// Derived state
		get hasError() {
			return hasError();
		},
		get hasDisambiguation() {
			return hasDisambiguation();
		},
		get hasBulkResults() {
			return hasBulkResults();
		},
		get canImport() {
			return canImport();
		},

		// Actions
		reset() {
			currentView = 'smart';
			searchMode = 'smart';
			tabUrl = '';
			smartQuery = '';
			artistQuery = '';
			songQuery = '';
			songArtistQuery = '';
			pastedContent = '';
			tabTitle = '';
			tabArtist = '';
			disambiguationData = null;
			bulkResults = [];
			groupedResults = new Map();
			expandedGroups = new Set();
			isLoading = false;
			loadingMessage = '';
			errorMessage = '';
			errorSuggestions = [];
			aiMetadata = null;
			loadingLogs = [];
		},

		clearError() {
			errorMessage = '';
			errorSuggestions = [];
		},

		toggleGroupExpansion(groupKey: string) {
			if (expandedGroups.has(groupKey)) {
				expandedGroups.delete(groupKey);
			} else {
				expandedGroups.add(groupKey);
			}
			// Trigger reactivity
			expandedGroups = new Set(expandedGroups);
		},

		navigateToView(view: ImportView) {
			currentView = view;
			errorMessage = '';
			errorSuggestions = [];
		},

		setPreviewData(title: string, artist: string, content: string) {
			tabTitle = title;
			tabArtist = artist;
			pastedContent = content;
			currentView = 'preview';
		}
	};
}

export type ImportState = ReturnType<typeof createImportState>;
