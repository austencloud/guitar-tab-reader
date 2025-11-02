# Svelte 5 Runes Migration Guide

## Overview

This guide outlines the complete migration from Svelte 4 stores to pure Svelte 5 runes for TabScroll. We're eliminating all store patterns in favor of modern runes-based state management.

## Migration Strategy

### Phase 1: Core State Classes (Day 1-2)

#### 1.1 Create Runes-Based State Architecture

**Before (Svelte 4 Stores)**:

```typescript
// src/lib/stores/tabs.ts
import { writable } from 'svelte/store';

export const tabs = writable<Tab[]>([]);
export const currentTab = writable<Tab | null>(null);
export const fontSize = writable(14);
```

**After (Svelte 5 Runes)**:

```typescript
// src/lib/state/tab.svelte.ts
class TabState {
	// Core data
	tabs = $state<Tab[]>([]);
	currentTab = $state<Tab | null>(null);
	content = $state('');

	// UI preferences
	fontSize = $state(14);
	showChordDiagrams = $state(true);

	// Derived state
	parsedTab = $derived(() => (this.content ? parseTab(this.content) : null));
	sections = $derived(() => this.parsedTab?.sections || []);
	hasContent = $derived(() => this.content.trim().length > 0);

	// Actions
	setCurrentTab(tab: Tab | null) {
		this.currentTab = tab;
		this.content = tab?.content || '';
	}

	updateContent(content: string) {
		this.content = content;
		if (this.currentTab) {
			this.currentTab.content = content;
			this.saveTab(this.currentTab);
		}
	}

	adjustFontSize(delta: number) {
		this.fontSize = Math.max(8, Math.min(32, this.fontSize + delta));
	}

	private saveTab(tab: Tab) {
		// Auto-save logic
		const index = this.tabs.findIndex((t) => t.id === tab.id);
		if (index >= 0) {
			this.tabs[index] = { ...tab, updatedAt: Date.now() };
		}
	}
}

export const tabState = new TabState();
```

#### 1.2 UI State Management

```typescript
// src/lib/state/ui.svelte.ts
class UIState {
	// Modal states
	modals = $state({
		settings: false,
		chordEditor: false,
		import: false,
		tuner: false
	});

	// Tooltip state
	tooltip = $state({
		visible: false,
		x: 0,
		y: 0,
		content: null as any
	});

	// Loading and error states
	loading = $state({
		active: false,
		message: ''
	});

	error = $state<string | null>(null);

	// Derived state
	hasActiveModal = $derived(() => Object.values(this.modals).some((open) => open));

	// Actions
	openModal(modalType: keyof typeof this.modals) {
		// Close all modals first
		Object.keys(this.modals).forEach((key) => {
			this.modals[key as keyof typeof this.modals] = false;
		});
		this.modals[modalType] = true;
	}

	closeModal(modalType: keyof typeof this.modals) {
		this.modals[modalType] = false;
	}

	closeAllModals() {
		Object.keys(this.modals).forEach((key) => {
			this.modals[key as keyof typeof this.modals] = false;
		});
	}

	showTooltip(x: number, y: number, content: any) {
		this.tooltip.x = x;
		this.tooltip.y = y;
		this.tooltip.content = content;
		this.tooltip.visible = true;
	}

	hideTooltip() {
		this.tooltip.visible = false;
		this.tooltip.content = null;
	}

	setLoading(active: boolean, message = '') {
		this.loading.active = active;
		this.loading.message = message;
	}

	setError(error: string | null) {
		this.error = error;
	}
}

export const uiState = new UIState();
```

### Phase 2: Component Migration (Day 3-5)

#### 2.1 Update Component Patterns

**Before (Store Subscriptions)**:

```svelte
<!-- TabViewer.svelte -->
<script lang="ts">
	import { tabs, currentTab, fontSize } from '$lib/stores/tabs';
	import { onMount } from 'svelte';

	let currentTabValue: Tab | null = null;
	let fontSizeValue = 14;

	onMount(() => {
		const unsubscribeTab = currentTab.subscribe((value) => {
			currentTabValue = value;
		});

		const unsubscribeFontSize = fontSize.subscribe((value) => {
			fontSizeValue = value;
		});

		return () => {
			unsubscribeTab();
			unsubscribeFontSize();
		};
	});

	function handleFontSizeChange(delta: number) {
		fontSize.update((size) => Math.max(8, Math.min(32, size + delta)));
	}
</script>

<div style="font-size: {fontSizeValue}px">
	{#if currentTabValue}
		<h2>{currentTabValue.title}</h2>
		<pre>{currentTabValue.content}</pre>
	{/if}
</div>
```

**After (Direct Runes Access)**:

```svelte
<!-- TabViewer.svelte -->
<script lang="ts">
	import { tabState } from '$lib/state/tab.svelte.ts';
	import { uiState } from '$lib/state/ui.svelte.ts';

	// Direct access to reactive state - no subscriptions needed!
	function handleFontSizeChange(delta: number) {
		tabState.adjustFontSize(delta);
	}

	function handleChordClick(chordName: string) {
		uiState.openModal('chordEditor');
	}
</script>

<div style="font-size: {tabState.fontSize}px">
	{#if tabState.currentTab}
		<h2>{tabState.currentTab.title}</h2>

		{#if tabState.parsedTab}
			{#each tabState.sections as section}
				<section>
					<h3>{section.title}</h3>
					<!-- Section content -->
				</section>
			{/each}
		{:else}
			<pre>{tabState.content}</pre>
		{/if}
	{/if}
</div>

<!-- Font size controls -->
<div class="controls">
	<button onclick={() => handleFontSizeChange(-2)}>A-</button>
	<button onclick={() => handleFontSizeChange(2)}>A+</button>
</div>
```

#### 2.2 Props vs Global State Decision Matrix

**Use Props When**:

- Data is specific to component instance
- Parent needs to control the data
- Component should be reusable with different data
- Testing requires isolated state

**Use Global State When**:

- Data is shared across multiple components
- State persists across route changes
- User preferences and settings
- Application-wide UI state

**Example - Mixed Approach**:

```svelte
<!-- ChordDiagram.svelte -->
<script lang="ts">
	import { tabState } from '$lib/state/tab.svelte.ts';

	// Props for component-specific data
	let {
		chordName,
		formation,
		size = 'medium',
		interactive = false
	} = $props<{
		chordName: string;
		formation?: ChordFormation;
		size?: 'small' | 'medium' | 'large';
		interactive?: boolean;
	}>();

	// Global state for user preferences
	let showFingerNumbers = $derived(() => tabState.showChordDiagrams);

	function handleClick() {
		if (interactive) {
			tabState.toggleChordSelection(chordName);
		}
	}
</script>

<div class="chord-diagram {size}" class:interactive onclick={handleClick}>
	<!-- Diagram content -->
</div>
```

### Phase 3: Advanced Patterns (Day 6-7)

#### 3.1 State Persistence with Effects

```typescript
// src/lib/state/persistence.svelte.ts
import { tabState } from './tab.svelte.ts';
import { uiState } from './ui.svelte.ts';

class PersistenceManager {
	private readonly STORAGE_KEY = 'TabScroll-state';

	constructor() {
		this.initializeAutoSave();
		this.loadPersistedState();
	}

	private initializeAutoSave() {
		// Auto-save state changes with debouncing
		let saveTimeout: number;

		$effect(() => {
			// Track changes to persistent state
			const state = {
				tabs: tabState.tabs,
				currentTabId: tabState.currentTab?.id,
				fontSize: tabState.fontSize,
				showChordDiagrams: tabState.showChordDiagrams
			};

			clearTimeout(saveTimeout);
			saveTimeout = setTimeout(() => {
				this.saveState(state);
			}, 1000); // Debounce saves
		});
	}

	private saveState(state: any) {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
		} catch (error) {
			console.warn('Failed to save state:', error);
		}
	}

	private loadPersistedState() {
		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const state = JSON.parse(saved);

				// Restore state
				if (state.tabs) {
					tabState.tabs = state.tabs;
				}

				if (state.currentTabId) {
					const currentTab = tabState.tabs.find((t) => t.id === state.currentTabId);
					if (currentTab) {
						tabState.setCurrentTab(currentTab);
					}
				}

				if (state.fontSize) {
					tabState.fontSize = state.fontSize;
				}

				if (typeof state.showChordDiagrams === 'boolean') {
					tabState.showChordDiagrams = state.showChordDiagrams;
				}
			}
		} catch (error) {
			console.warn('Failed to load persisted state:', error);
		}
	}
}

export const persistenceManager = new PersistenceManager();
```

#### 3.2 Complex State Interactions

```typescript
// src/lib/state/practice.svelte.ts
import { tabState } from './tab.svelte.ts';
import { audioState } from './audio.svelte.ts';

class PracticeState {
	// Practice session data
	sessionActive = $state(false);
	startTime = $state<number | null>(null);
	currentSection = $state(0);
	loopCount = $state(0);

	// Derived state that depends on other state
	sessionDuration = $derived(() => {
		if (!this.sessionActive || !this.startTime) return 0;
		return Date.now() - this.startTime;
	});

	currentSectionData = $derived(() => {
		return tabState.sections[this.currentSection] || null;
	});

	canPractice = $derived(() => {
		return tabState.hasContent && tabState.sections.length > 0;
	});

	// Actions that coordinate multiple states
	startPracticeSession() {
		if (!this.canPractice) return;

		this.sessionActive = true;
		this.startTime = Date.now();
		this.currentSection = 0;
		this.loopCount = 0;

		// Reset audio state
		audioState.seek(0);
		audioState.clearLoop();
	}

	nextSection() {
		if (this.currentSection < tabState.sections.length - 1) {
			this.currentSection++;

			// Update audio position if timestamps available
			const sectionData = this.currentSectionData;
			if (sectionData?.timestamp) {
				audioState.seek(sectionData.timestamp.startTime);
			}
		}
	}

	previousSection() {
		if (this.currentSection > 0) {
			this.currentSection--;

			const sectionData = this.currentSectionData;
			if (sectionData?.timestamp) {
				audioState.seek(sectionData.timestamp.startTime);
			}
		}
	}

	toggleSectionLoop() {
		const sectionData = this.currentSectionData;
		if (!sectionData?.timestamp) return;

		if (audioState.isLooping) {
			audioState.clearLoop();
		} else {
			audioState.setLoop(sectionData.timestamp.startTime, sectionData.timestamp.endTime);
		}
	}
}

export const practiceState = new PracticeState();
```

## Migration Checklist

### ✅ Day 1-2: Core State

- [ ] Create `src/lib/state/` directory
- [ ] Implement `tab.svelte.ts` with TabState class
- [ ] Implement `ui.svelte.ts` with UIState class
- [ ] Implement `audio.svelte.ts` with AudioState class
- [ ] Remove all store imports from existing files

### ✅ Day 3-4: Component Updates

- [ ] Update `TabViewer.svelte` to use runes
- [ ] Update `TabEditor.svelte` to use runes
- [ ] Update `SettingsModal.svelte` to use runes
- [ ] Update `ScrollControls.svelte` to use runes
- [ ] Update all other components

### ✅ Day 5-6: Advanced Features

- [ ] Implement persistence with `$effect`
- [ ] Create practice state coordination
- [ ] Add state validation and error handling
- [ ] Update routing to work with runes

### ✅ Day 7: Testing & Cleanup

- [ ] Update all tests to work with runes
- [ ] Remove all store-related dependencies
- [ ] Verify no store imports remain
- [ ] Test all functionality works correctly

## Benefits Achieved

1. **Simpler Code**: No more store subscriptions and unsubscribe cleanup
2. **Better Performance**: Fine-grained reactivity with runes
3. **Type Safety**: Better TypeScript integration
4. **Modern Patterns**: Using latest Svelte 5 features
5. **Easier Testing**: Direct state access without mocking stores
6. **Reduced Bundle Size**: No store boilerplate code

This migration establishes a modern, maintainable foundation for all future TabScroll development.
