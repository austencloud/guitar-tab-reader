import { type ChordDictionary } from '$lib/utils/chordUtils';
import type { IChordDictionaryService } from '../contracts/IChordDictionaryService';
/**
 * Chord dictionary service implementation
 * Manages chord dictionary loading and access
 */
export declare class ChordDictionaryService implements IChordDictionaryService {
    private loaded;
    private loadingPromise;
    private dictionary;
    loadDictionary(): Promise<void>;
    isLoaded(): boolean;
    getDictionary(): ChordDictionary;
}
