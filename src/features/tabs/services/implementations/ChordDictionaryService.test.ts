import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChordDictionaryService } from './ChordDictionaryService';

// Mock the loadChordDictionary utility
vi.mock('$lib/utils/chordUtils', () => ({
	loadChordDictionary: vi.fn().mockResolvedValue({
		C: { positions: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
		G: { positions: [3, 2, 0, 0, 0, 3], baseFret: 1 },
		Am: { positions: [-1, 0, 2, 2, 1, 0], baseFret: 1 }
	})
}));

describe('ChordDictionaryService', () => {
	let service: ChordDictionaryService;

	beforeEach(() => {
		service = new ChordDictionaryService();
	});

	describe('loadDictionary', () => {
		it('should load chord dictionary', async () => {
			await service.loadDictionary();

			expect(service.isLoaded()).toBe(true);
		});

		it('should only load dictionary once (singleton pattern)', async () => {
			await service.loadDictionary();
			const dict1 = service.getDictionary();

			await service.loadDictionary();
			const dict2 = service.getDictionary();

			expect(dict1).toBe(dict2); // Same reference
		});

		it('should handle loading errors gracefully', async () => {
			// Create a new service instance that will fail
			const { loadChordDictionary } = await import('$lib/utils/chordUtils');
			vi.mocked(loadChordDictionary).mockRejectedValueOnce(new Error('Load failed'));

			const failingService = new ChordDictionaryService();

			await expect(failingService.loadDictionary()).rejects.toThrow('Load failed');
			expect(failingService.isLoaded()).toBe(false);
		});
	});

	describe('isLoaded', () => {
		it('should return false before loading', () => {
			expect(service.isLoaded()).toBe(false);
		});

		it('should return true after loading', async () => {
			await service.loadDictionary();
			expect(service.isLoaded()).toBe(true);
		});
	});

	describe('getDictionary', () => {
		it('should return empty object before loading', () => {
			const dict = service.getDictionary();
			expect(dict).toEqual({});
			expect(Object.keys(dict).length).toBe(0);
		});

		it('should return loaded dictionary after loading', async () => {
			await service.loadDictionary();
			const dict = service.getDictionary();

			expect(typeof dict).toBe('object');
			expect(Object.keys(dict).length).toBeGreaterThan(0);
			expect(dict['C']).toBeDefined();
			expect(dict['G']).toBeDefined();
			expect(dict['Am']).toBeDefined();
		});

		it('should return chord data with correct structure', async () => {
			await service.loadDictionary();
			const dict = service.getDictionary();
			const cChord = dict['C'];

			expect(cChord).toBeDefined();
			expect(cChord?.positions).toBeDefined();
			expect(Array.isArray(cChord?.positions)).toBe(true);
		});
	});
});

