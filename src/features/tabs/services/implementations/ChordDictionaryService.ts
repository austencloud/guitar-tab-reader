import { injectable } from 'inversify';
import { loadChordDictionary, type ChordDictionary } from '$lib/utils/chordUtils';
import type { IChordDictionaryService } from '../contracts/IChordDictionaryService';

/**
 * Chord dictionary service implementation
 * Manages chord dictionary loading and access
 */
@injectable()
export class ChordDictionaryService implements IChordDictionaryService {
	private loaded = false;
	private loadingPromise: Promise<void> | null = null;
	private dictionary: ChordDictionary = {};

	async loadDictionary(): Promise<void> {
		// Return existing promise if already loading
		if (this.loadingPromise) {
			return this.loadingPromise;
		}

		// Return immediately if already loaded
		if (this.loaded) {
			return Promise.resolve();
		}

		// Start loading
		this.loadingPromise = loadChordDictionary().then((dict) => {
			this.dictionary = dict;
			this.loaded = true;
			this.loadingPromise = null;
		});

		return this.loadingPromise;
	}

	isLoaded(): boolean {
		return this.loaded;
	}

	getDictionary(): ChordDictionary {
		return this.dictionary;
	}
}

