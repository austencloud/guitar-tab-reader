<script lang="ts">
	import '../app.css';
	import { SettingsBottomSheet, PrimaryNavigation } from '$features/shared/components';
	import { GuitarTuner } from '$features/tuner/components';
	import { AddTabBottomSheet, ImportTabModal, WebImportModal } from '$features/tabs/components';
	import { setContext, getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { initializeApp } from '$lib/app';
	import { useService } from '$lib/useService.svelte';
	import { TYPES } from '$core/di';
	import type { UIState, UserState } from '$features/shared/services';
	import { tabs } from '$lib/stores/tabs';
	import type { Tab } from '$lib/stores/tabs';

	interface TunerState {
		open: boolean;
		setOpen: (value: boolean) => void;
	}

	let { children } = $props();
	let childTunerState: TunerState | null = $state(null);

	// Get services from DI container (stored in $state to maintain reactivity)
	let uiState = $state<UIState | undefined>(undefined);
	let userState = $state<UserState | undefined>(undefined);

	// State for AddTab bottom sheet and import modals
	let isAddTabPanelOpen = $state(false);
	let isImportModalOpen = $state(false);
	let isWebImportOpen = $state(false);

	// Initialize application on mount
	onMount(async () => {
		await initializeApp();

		// Get services after initialization
		uiState = useService<UIState>(TYPES.UIState);
		userState = useService<UserState>(TYPES.UserState);
	});

	// Create a global tuner context
	setContext('tuner', {
		open: () => uiState?.openModal('tuner'),
		close: () => uiState?.closeModal('tuner'),
		toggle: () => {
			if (uiState) {
				if (uiState.tunerModalOpen) {
					uiState.closeModal('tuner');
				} else {
					uiState.openModal('tuner');
				}
			}
		}
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

	function toggleSettings() {
		uiState?.openModal('settings');
	}

	function closeSettings() {
		uiState?.closeModal('settings');
	}

	function closeTuner() {
		uiState?.closeModal('tuner');
	}

	function toggleTuner() {
		if (uiState) {
			if (uiState.tunerModalOpen) {
				uiState.closeModal('tuner');
			} else {
				uiState.openModal('tuner');
			}
		}
	}

	function handleOpenAddTab() {
		isAddTabPanelOpen = true;
	}

	function handleCloseAddTab() {
		isAddTabPanelOpen = false;
	}

	function handleURLImport() {
		isAddTabPanelOpen = false;
		isWebImportOpen = true;
	}

	function handlePasteImport() {
		isAddTabPanelOpen = false;
		isImportModalOpen = true;
	}

	function closeImportModal() {
		isImportModalOpen = false;
	}

	function closeWebImport() {
		isWebImportOpen = false;
	}

	function handleImportSubmit(newTab: Tab) {
		tabs.add(newTab);
		isImportModalOpen = false;
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
	}

	function handleWebImportSubmit(newTab: Tab) {
		tabs.add(newTab);
		isWebImportOpen = false;
		setTimeout(() => {
			goto(`/tab/${newTab.id}`, {});
		}, 100);
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

<div class="app-container">
	<div class="content-wrapper" use:handleContextMount>
		{@render children()}
	</div>

	<PrimaryNavigation
		onAddTab={handleOpenAddTab}
		onOpenTuner={toggleTuner}
		onOpenSettings={toggleSettings}
	/>
</div>

{#if uiState}
	<SettingsBottomSheet open={uiState.settingsModalOpen} onclose={closeSettings} />
	<GuitarTuner showTuner={uiState.tunerModalOpen} onclose={closeTuner} />
	<AddTabBottomSheet
		open={isAddTabPanelOpen}
		onclose={handleCloseAddTab}
		onURLImport={handleURLImport}
		onPasteImport={handlePasteImport}
	/>
	<ImportTabModal
		open={isImportModalOpen}
		onclose={closeImportModal}
		onimport={handleImportSubmit}
	/>
	<WebImportModal
		open={isWebImportOpen}
		onclose={closeWebImport}
		onimport={handleWebImportSubmit}
	/>
{/if}

<style>
	/* Global body styles are now in app.css */

	.app-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
	}

	.content-wrapper {
		width: 100%;
		max-width: var(--container-lg);
		padding: 0;
		padding-bottom: 5rem; /* Space for bottom navigation bar */
		margin: 0 auto;
		flex: 1;
	}

	/* Landscape mode - add left padding for side navigation */
	@media (orientation: landscape) and (max-height: 600px) {
		.content-wrapper {
			padding-left: 80px;
			padding-bottom: 1rem;
		}
	}

</style>
