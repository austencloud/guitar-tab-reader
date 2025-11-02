import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import type { ITabParser } from '../services/contracts/ITabParser';
import type { ParsedTab } from '../services/types';

/**
 * Tab state management using Svelte 5 runes
 * Replaces the old Svelte 4 stores with modern runes-based state
 */
@injectable()
export class TabState {
	// Core tab data
	content = $state('');
	currentSection = $state(0);
	selectedChords = $state(new Set<string>());

	// UI preferences
	fontSize = $state(14);
	showChordDiagrams = $state(true);
	darkMode = $state(false);

	constructor(@inject(TYPES.TabParser) private tabParser: ITabParser) {}

	// Derived state using $derived
	parsedTab = $derived(() => (this.content ? this.tabParser.parse(this.content) : null));
	sections = $derived(() => this.parsedTab()?.sections || []);
	stringCount = $derived(() => this.parsedTab()?.stringCount || 6);
	currentSectionData = $derived(() => this.sections()[this.currentSection] || null);

	// Computed properties for UI
	hasContent = $derived(() => this.content.trim().length > 0);
	hasSections = $derived(() => this.sections().length > 0);
	canNavigateNext = $derived(() => this.currentSection < this.sections().length - 1);
	canNavigatePrevious = $derived(() => this.currentSection > 0);

	// Actions
	updateContent(content: string) {
		this.content = content;
		this.currentSection = 0; // Reset to first section
		this.selectedChords.clear(); // Clear selected chords
	}

	setCurrentSection(index: number) {
		if (index >= 0 && index < this.sections().length) {
			this.currentSection = index;
		}
	}

	nextSection() {
		if (this.canNavigateNext()) {
			this.currentSection++;
		}
	}

	previousSection() {
		if (this.canNavigatePrevious()) {
			this.currentSection--;
		}
	}

	toggleChordSelection(chordName: string) {
		if (this.selectedChords.has(chordName)) {
			this.selectedChords.delete(chordName);
		} else {
			this.selectedChords.add(chordName);
		}
	}

	clearChordSelection() {
		this.selectedChords.clear();
	}

	adjustFontSize(delta: number) {
		this.fontSize = Math.max(8, Math.min(32, this.fontSize + delta));
	}

	setFontSize(size: number) {
		this.fontSize = Math.max(8, Math.min(32, size));
	}

	toggleChordDiagrams() {
		this.showChordDiagrams = !this.showChordDiagrams;
	}

	toggleDarkMode() {
		this.darkMode = !this.darkMode;
	}

	// Reset all state
	reset() {
		this.content = '';
		this.currentSection = 0;
		this.selectedChords.clear();
		this.fontSize = 14;
		this.showChordDiagrams = true;
		this.darkMode = false;
	}
}

// Note: TabState is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.TabState) instead
