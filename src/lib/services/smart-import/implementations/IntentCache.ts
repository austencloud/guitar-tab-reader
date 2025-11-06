import type { IIntentCache } from '../contracts/IIntentCache';
import type { Intent } from '../types';

/**
 * In-memory cache for intent analysis results
 */
export class IntentCache implements IIntentCache {
	private cache = new Map<string, { intent: Intent; timestamp: number }>();
	private readonly ttl: number;

	constructor(ttlMinutes: number = 15) {
		this.ttl = ttlMinutes * 60 * 1000;
	}

	get(query: string): Intent | null {
		const cacheKey = this.normalizeQuery(query);
		const cached = this.cache.get(cacheKey);

		if (!cached) {
			return null;
		}

		// Check if expired
		if (Date.now() - cached.timestamp >= this.ttl) {
			this.cache.delete(cacheKey);
			return null;
		}

		console.log(`💾 Cache hit for: "${query}"`);
		
		// Mark as cached in metadata
		return {
			...cached.intent,
			_meta: cached.intent._meta
				? { ...cached.intent._meta, cached: true }
				: undefined
		};
	}

	set(query: string, intent: Intent): void {
		const cacheKey = this.normalizeQuery(query);
		this.cache.set(cacheKey, { intent, timestamp: Date.now() });
		console.log(`💾 Cached intent for: "${query}"`);
	}

	cleanup(): void {
		if (this.cache.size <= 100) {
			return;
		}

		const now = Date.now();
		for (const [key, value] of this.cache.entries()) {
			if (now - value.timestamp >= this.ttl) {
				this.cache.delete(key);
			}
		}
	}

	clear(): void {
		this.cache.clear();
	}

	private normalizeQuery(query: string): string {
		return query.toLowerCase().trim();
	}
}

