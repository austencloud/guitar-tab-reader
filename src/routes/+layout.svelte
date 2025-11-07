<script lang="ts">
	import '../app.css';
	import { SettingsBottomSheet } from '$features/shared/components';
	import PrimaryNavigation from '$features/shared/components/PrimaryNavigation_Modern.svelte';
	import { GuitarTuner } from '$features/tuner/components';
import { ImportTabModal, WebImportModal } from '$features/tabs/components';
	import SessionIndicator from '$features/sessions/components/SessionIndicator.svelte';
	import SessionBottomSheet from '$features/sessions/components/SessionBottomSheet.svelte';
	import CreateSessionModal from '$features/sessions/components/CreateSessionModal.svelte';
	import JoinSessionModal from '$features/sessions/components/JoinSessionModal.svelte';
	import SessionQueueView from '$features/sessions/components/SessionQueueView.svelte';
	import PWAInstallPrompt from '$lib/components/PWAInstallPrompt.svelte';
	import PWAUpdateNotification from '$lib/components/PWAUpdateNotification.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';
	import { setContext, getContext } from 'svelte';
	import { page } from '$app/state';
	import { initializeApp } from '$lib/app';
	import { useService } from '$lib/useService.svelte';
	import { TYPES } from '$core/di';
	import type {
		UIState,
		LayoutState,
		ModalOrchestrator,
		ScrollBehaviorService,
		NavigationCoordinator,
		ContextManager
	} from '$features/shared/services';
	import { tabs } from '$lib/state/tabs.svelte';
	import type { Tab } from '$lib/state/tabs.svelte';
	import { useSessionState } from '$lib/useSessionState.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	// HMR: Accept updates to this component for fast refresh
	// Note: Changes to imported services will still cause full reload
	// as InversifyJS doesn't support hot-swapping singleton instances
	if (import.meta.hot) {
		import.meta.hot.accept();
	}

	interface TunerState {
		open: boolean;
		setOpen: (value: boolean) => void;
	}

	let { children } = $props();
	let childTunerState: TunerState | null = $state(null);

	// Services - all logic delegated to proper service layer
	let uiState = $state<UIState | undefined>(undefined);
	let layoutState = $state<LayoutState | undefined>(undefined);
	let modalOrchestrator = $state<ModalOrchestrator | undefined>(undefined);
	let scrollBehavior = $state<ScrollBehaviorService | undefined>(undefined);
	let navigationCoordinator = $state<NavigationCoordinator | undefined>(undefined);
	let contextManager = $state<ContextManager | undefined>(undefined);

	// Session state initialization
	let sessionState = $state<ReturnType<typeof useSessionState> | undefined>(undefined);
	let sessionsEnabled = $state(false);

	// Set up contexts SYNCHRONOUSLY so child components can access them
	// The contexts will reactively update when services are initialized
	setContext('tuner', {
		get open() { return () => modalOrchestrator?.openTuner(); },
		get close() { return () => modalOrchestrator?.closeTuner(); },
		get toggle() { return () => modalOrchestrator?.toggleTuner(); }
	});

	// Create a reactive context object that will be properly tracked
	// We need to return a function that accesses the state, not a getter
	setContext('scrollVisibility', {
		// Return a function so it's called in the child's reactive context
		getVisible: () => layoutState?.isHeaderVisible ?? true,
		hide: () => scrollBehavior?.forceHideHeader(),
		show: () => scrollBehavior?.forceShowHeader(),
		handleContainerScroll: (scrollTop: number, lastScroll: number) => {
			scrollBehavior?.handleContainerScroll(scrollTop, lastScroll);
		}
	});

	// Detect if we're viewing a tab and get current tab data
	const isViewingTab = $derived(
		navigationCoordinator?.isViewingTab(page.url.pathname) ?? false
	);
	const currentTabId = $derived(
		isViewingTab ? navigationCoordinator?.extractTabId(page.url.pathname, page.params) : null
	);
	const currentTab = $derived(currentTabId ? tabs.tabs.find((tab) => tab.id === currentTabId) : null);

	// Initialize application on mount using $effect (SSR is disabled so this is safe)
	$effect(() => {
		let scrollCleanup: (() => void) | undefined;

		(async () => {
			await initializeApp();

			// Get all services after initialization
			uiState = useService<UIState>(TYPES.UIState);
			layoutState = useService<LayoutState>(TYPES.LayoutState);
			modalOrchestrator = useService<ModalOrchestrator>(TYPES.ModalOrchestrator);
			scrollBehavior = useService<ScrollBehaviorService>(TYPES.ScrollBehaviorService);
			navigationCoordinator = useService<NavigationCoordinator>(TYPES.NavigationCoordinator);
			contextManager = useService<ContextManager>(TYPES.ContextManager);

			// Initialize session state
			try {
				sessionState = useSessionState();
				sessionsEnabled = true;
				console.log('✅ SessionState initialized successfully');
			} catch (error) {
				console.error('❌ Failed to initialize SessionState:', error);
			}

			// Set up scroll listener using service
			if (scrollBehavior) {
				scrollCleanup = scrollBehavior.createWindowScrollListener();
			}
		})();

		// Cleanup function must handle async case where scrollCleanup might not be set yet
		return () => {
			if (scrollCleanup) {
				scrollCleanup();
			}
		};
	});

	// Handle state synchronization between parent and child
	$effect(() => {
		if (childTunerState && uiState && childTunerState.open !== uiState.tunerModalOpen) {
			childTunerState.setOpen(uiState.tunerModalOpen);
		}
	});

	// Try to get context from child routes
	function handleContextMount(_node: HTMLElement) {
		try {
			// Try to get tuner state from a child route
			childTunerState = getContext<TunerState>('tunerState');
			if (childTunerState && uiState) {
				uiState.tunerModalOpen = childTunerState.open;
			}
		} catch {
			// Context not available, no problem
		}

		return {
			destroy() {
				// Cleanup if needed
			}
		};
	}

	// Event handlers - delegate to services
	function toggleSettings() {
		modalOrchestrator?.toggleSettings();
	}

	function closeSettings() {
		modalOrchestrator?.closeSettings();
	}

	function closeTuner() {
		modalOrchestrator?.closeTuner();
	}

	function handleOpenAddTab() {
		modalOrchestrator?.openAddTab();
	}

	function closeImportModal() {
		modalOrchestrator?.closeImportModal();
	}

	function closeWebImport() {
		modalOrchestrator?.closeWebImport();
	}

	function handleImportSubmit(newTab: Tab) {
		const actualTabId = tabs.add(newTab);
		modalOrchestrator?.closeImportModal();
		navigationCoordinator?.goToTabDelayed(actualTabId);
	}

	function handleWebImportSubmit(newTab: Tab) {
		const actualTabId = tabs.add(newTab);
		modalOrchestrator?.closeWebImport();
		navigationCoordinator?.goToTabDelayed(actualTabId);
	}

	function handleOpenSessions() {
		modalOrchestrator?.openSessions();
	}

	function handleCloseSessions() {
		modalOrchestrator?.closeSessions();
	}

	function goBackToLibrary() {
		navigationCoordinator?.goToLibrary();
	}

	// Dark mode is always active - no theme switching needed
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
	/>
	<meta name="theme-color" content="#4caf50" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<div class="app-container tabscroll-app-container">
	<header class="app-header tabscroll-app-header" class:header-hidden={layoutState?.isHeaderVisible === false}>
		{#if isViewingTab && currentTab}
			<!-- Tab viewing mode - show back button and song info -->
			<button class="back-button" onclick={goBackToLibrary} aria-label="Back to library">
				<ArrowLeft size={20} />
			</button>
			<div class="tab-header-info">
				<h1 class="tab-title">{currentTab.title}</h1>
				{#if currentTab.artist}
					<p class="tab-artist">{currentTab.artist}</p>
				{/if}
			</div>
			<div class="header-actions">
				<SessionIndicator sessionState={sessionState} />
			</div>
		{:else}
			<!-- Default mode - show app logo -->
			<div class="logo-area">
				<a href="/" class="logo-link">
					<h1 class="app-title">TabScroll</h1>
				</a>
			</div>
			<div class="header-actions">
				<SessionIndicator sessionState={sessionState} />
			</div>
		{/if}
	</header>

	<div class="content-wrapper tabscroll-content-wrapper" class:header-hidden={layoutState?.isHeaderVisible === false} use:handleContextMount>
		<PageTransition>
			{@render children()}
		</PageTransition>
	</div>

	<PrimaryNavigation
		onAddTab={handleOpenAddTab}
		onOpenSettings={toggleSettings}
		isHeaderVisible={layoutState?.isHeaderVisible ?? true}
	/>
</div>

{#if uiState && layoutState}
	<SettingsBottomSheet open={uiState.settingsModalOpen} onclose={closeSettings} />
	<GuitarTuner showTuner={uiState.tunerModalOpen} onclose={closeTuner} />
	<ImportTabModal
		open={layoutState.isImportModalOpen}
		onclose={closeImportModal}
		onimport={handleImportSubmit}
	/>
	<WebImportModal
		open={layoutState.isWebImportOpen}
		onclose={closeWebImport}
		onimport={handleWebImportSubmit}
	/>
{/if}

<!-- Session components - always rendered, handle their own visibility -->
{#if layoutState}
	<SessionBottomSheet
		isOpen={layoutState.isSessionSheetOpen}
		onClose={handleCloseSessions}
		sessionState={sessionState}
	/>
{/if}
<CreateSessionModal sessionState={sessionState} />
<JoinSessionModal sessionState={sessionState} />
<SessionQueueView sessionState={sessionState} />

<!-- PWA Components -->
<PWAInstallPrompt />
<PWAUpdateNotification />

<style>
	/* Global body styles are now in app.css */

	.app-container,
	.tabscroll-app-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
	}

	.app-header,
	.tabscroll-app-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		backdrop-filter: var(--blur-sm);
		transform: translateY(0);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.app-header.header-hidden,
	.tabscroll-app-header.header-hidden {
		transform: translateY(-100%);
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: var(--color-surface-variant);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: var(--color-text-primary);
		transition: var(--transition-all);
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		flex-shrink: 0;
		justify-self: start;
		grid-column: 1;
	}

	.back-button:hover {
		background: var(--color-hover);
		border-color: var(--color-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.back-button:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.tab-header-info {
		grid-column: 2;
		justify-self: center;
		min-width: 0;
		width: 100%;
		text-align: center;
	}

	.tab-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-artist {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0;
		margin-top: 0.125rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		justify-self: end;
		grid-column: 3;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		text-decoration: none;
		color: var(--color-text-primary);
		transition: var(--transition-all);
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
	}

	.logo-link:hover {
		color: var(--color-primary);
		background: var(--color-hover);
	}

	.logo-link:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.app-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: inherit;
		letter-spacing: var(--letter-spacing-tight);
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.content-wrapper,
	.tabscroll-content-wrapper {
		width: 100%;
		max-width: var(--container-lg);
		padding: 0;
		padding-top: 83px; /* Space for fixed header */
		padding-bottom: 5rem; /* Space for bottom navigation bar */
		margin: 0 auto;
		flex: 1;
		transition: padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* When header is hidden, remove top padding */
	.content-wrapper.header-hidden,
	.tabscroll-content-wrapper.header-hidden {
		padding-top: 0;
	}

	/* Landscape mode - add left padding for side navigation */
	@media (orientation: landscape) and (max-height: 600px) {
		.content-wrapper,
		.tabscroll-content-wrapper {
			padding-left: 80px;
			padding-bottom: 1rem;
		}
	}

	/* Reduced motion - disable header animations */
	@media (prefers-reduced-motion: reduce) {
		.app-header,
		.tabscroll-app-header {
			transition: none;
		}
	}
</style>
