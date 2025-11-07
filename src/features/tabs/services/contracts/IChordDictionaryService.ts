import type { ChordDictionary } from '$lib/utils/chordUtils';

/**
 * Chord dictionary service contract
 * Handles loading and managing the chord dictionary
 */
export interface IChordDictionaryService {
	/**
	 * Load the chord dictionary
	 * @returns Promise that resolves when dictionary is loaded
	 */
	loadDictionary(): Promise<void>;

	/**
	 * Check if the dictionary is loaded
	 * @returns True if dictionary is loaded
	 */
	isLoaded(): boolean;

	/**
	 * Get the chord dictionary
	 * @returns The chord dictionary
	 */
	getDictionary(): ChordDictionary;
}

