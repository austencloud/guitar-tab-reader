import { type ProcessedChord } from '$lib/utils/chordDb';
import type { ITabContentProcessor } from '../contracts/ITabContentProcessor';
import type { IChordDictionaryService } from '../contracts/IChordDictionaryService';
/**
 * Tab content processor service implementation
 * Pure business logic with zero Svelte dependencies
 */
export declare class TabContentProcessor implements ITabContentProcessor {
    private chordDictionaryService;
    constructor(chordDictionaryService: IChordDictionaryService);
    findChords(content: string): ProcessedChord[];
    generateHtmlWithChords(content: string, chords: ProcessedChord[]): string;
    hashContent(content: string): string;
    escapeHtml(text: string): string;
}
