import type { ITabParser } from '../services/contracts/ITabParser';
import type { ParsedTab } from '../services/types';
/**
 * Tab state management using Svelte 5 runes
 * Replaces the old Svelte 4 stores with modern runes-based state
 */
export declare class TabState {
    private tabParser;
    content: string;
    currentSection: number;
    selectedChords: Set<string>;
    fontSize: number;
    showChordDiagrams: boolean;
    darkMode: boolean;
    constructor(tabParser: ITabParser);
    parsedTab: () => ParsedTab | null;
    sections: () => import("../services/types").ParsedSection[];
    stringCount: () => number;
    currentSectionData: () => import("../services/types").ParsedSection;
    hasContent: () => boolean;
    hasSections: () => boolean;
    canNavigateNext: () => boolean;
    canNavigatePrevious: () => boolean;
    updateContent(content: string): void;
    setCurrentSection(index: number): void;
    nextSection(): void;
    previousSection(): void;
    toggleChordSelection(chordName: string): void;
    clearChordSelection(): void;
    adjustFontSize(delta: number): void;
    setFontSize(size: number): void;
    toggleChordDiagrams(): void;
    toggleDarkMode(): void;
    reset(): void;
}
