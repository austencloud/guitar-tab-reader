import type { ProcessedChord } from '$lib/utils/chordDb';

/**
 * Tab content processor service contract
 * Handles processing tab content, finding chords, and generating HTML
 */
export interface ITabContentProcessor {
	/**
	 * Process tab content and find all chords
	 * @param content - Raw tab content
	 * @returns Array of processed chords with positions
	 */
	findChords(content: string): ProcessedChord[];

	/**
	 * Generate HTML with chord spans for interactive display
	 * @param content - Raw tab content
	 * @param chords - Array of processed chords
	 * @returns HTML string with chord spans
	 */
	generateHtmlWithChords(content: string, chords: ProcessedChord[]): string;

	/**
	 * Create a hash of content for change detection
	 * @param content - Content to hash
	 * @returns Hash string
	 */
	hashContent(content: string): string;

	/**
	 * Escape HTML special characters
	 * @param text - Text to escape
	 * @returns Escaped HTML string
	 */
	escapeHtml(text: string): string;
}

