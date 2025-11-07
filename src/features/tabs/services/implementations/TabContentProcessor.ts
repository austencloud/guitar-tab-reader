import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import { findChordsInText, type ProcessedChord } from '$lib/utils/chordDb';
import type { ITabContentProcessor } from '../contracts/ITabContentProcessor';
import type { IChordDictionaryService } from '../contracts/IChordDictionaryService';

/**
 * Tab content processor service implementation
 * Pure business logic with zero Svelte dependencies
 */
@injectable()
export class TabContentProcessor implements ITabContentProcessor {
	constructor(
		@inject(TYPES.IChordDictionaryService) private chordDictionaryService: IChordDictionaryService
	) {}

	findChords(content: string): ProcessedChord[] {
		if (!content || !this.chordDictionaryService.isLoaded()) {
			return [];
		}

		return findChordsInText(content);
	}

	generateHtmlWithChords(content: string, chords: ProcessedChord[]): string {
		if (!content) {
			return '';
		}

		if (chords.length === 0) {
			return content; // No chords, return plain text
		}

		// Sort chords by start index to process in order
		const sortedChords = [...chords].sort((a, b) => a.startIndex - b.startIndex);

		let result = '';
		let lastEnd = 0;

		for (const chord of sortedChords) {
			// Add text before chord
			result += this.escapeHtml(content.substring(lastEnd, chord.startIndex));
			
			// Add chord span with tabindex for keyboard accessibility
			result += `<span class="chord" data-chord="${this.escapeHtml(chord.name)}" tabindex="0">${this.escapeHtml(chord.name)}</span>`;
			
			lastEnd = chord.endIndex;
		}

		// Add remaining text after last chord
		result += this.escapeHtml(content.substring(lastEnd));

		return result;
	}

	hashContent(content: string): string {
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0; // Convert to 32bit integer
		}
		return hash.toString();
	}

	escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}
}

