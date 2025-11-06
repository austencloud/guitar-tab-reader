import type { Intent } from '../types';

/**
 * Service for caching intent analysis results
 */
export interface IIntentCache {
	/**
	 * Get cached intent for a query
	 * @param query The user query
	 * @returns Cached intent or null if not found/expired
	 */
	get(query: string): Intent | null;

	/**
	 * Cache an intent result
	 * @param query The user query
	 * @param intent The analyzed intent
	 */
	set(query: string, intent: Intent): void;

	/**
	 * Clear expired cache entries
	 */
	cleanup(): void;

	/**
	 * Clear all cache entries
	 */
	clear(): void;
}

