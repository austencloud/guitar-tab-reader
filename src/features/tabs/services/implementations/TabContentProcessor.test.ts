import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabContentProcessor } from './TabContentProcessor';
import type { IChordDictionaryService } from '../contracts/IChordDictionaryService';
import type { ProcessedChord } from '$lib/utils/chordDb';

// Mock the chordDb module to control the global chord dictionary
vi.mock('$lib/utils/chordDb', async () => {
	const actual = await vi.importActual<typeof import('$lib/utils/chordDb')>('$lib/utils/chordDb');

	// Create a mock chord dictionary that will be used by findChordsInText
	const mockChordDict = {
		C: { positions: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
		G: { positions: [3, 2, 0, 0, 0, 3], baseFret: 1 },
		Am: { positions: [-1, 0, 2, 2, 1, 0], baseFret: 1 }
	};

	return {
		...actual,
		loadChordDictionary: vi.fn().mockResolvedValue(mockChordDict),
		// Override findChordsInText to use our mock dictionary
		findChordsInText: (text: string) => {
			if (!text) return [];

			const chordMatches: any[] = [];
			const lines = text.split('\n');
			let currentPosition = 0;
			const CHORD_PATTERN = /\b([A-G][b#]?(?:m|maj|min|aug|dim|sus[24]|add\d|m?7|m?9|m?11|m?13|6|5)*)(?=\s|$|\]|\)|\|)/g;

			lines.forEach((line) => {
				const lineStartPosition = currentPosition;
				let match;
				CHORD_PATTERN.lastIndex = 0;

				while ((match = CHORD_PATTERN.exec(line)) !== null) {
					const chordName = match[1];
					const startIndex = lineStartPosition + match.index;
					const endIndex = startIndex + chordName.length;

					if (mockChordDict[chordName as keyof typeof mockChordDict]) {
						const chordDef = mockChordDict[chordName as keyof typeof mockChordDict];
						const { positions, baseFret } = chordDef;
						const barre = 'barre' in chordDef ? chordDef.barre : undefined;

						const isOverlapping = chordMatches.some(
							(existingChord) =>
								(startIndex > existingChord.startIndex && startIndex < existingChord.endIndex) ||
								(endIndex > existingChord.startIndex && endIndex < existingChord.endIndex)
						);

						if (!isOverlapping) {
							chordMatches.push({
								name: chordName,
								positions,
								...(barre !== undefined && { barre }),
								baseFret,
								startIndex,
								endIndex
							});
						}
					}
				}

				currentPosition += line.length + 1;
			});

			return chordMatches;
		}
	};
});

describe('TabContentProcessor', () => {
	let mockChordDictionaryService: IChordDictionaryService;
	let processor: TabContentProcessor;

	beforeEach(() => {
		// Mock chord dictionary service
		mockChordDictionaryService = {
			loadDictionary: vi.fn().mockResolvedValue(undefined),
			isLoaded: vi.fn().mockReturnValue(true),
			getDictionary: vi.fn().mockReturnValue({
				C: { positions: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
				G: { positions: [3, 2, 0, 0, 0, 3], baseFret: 1 },
				Am: { positions: [-1, 0, 2, 2, 1, 0], baseFret: 1 }
			})
		};

		processor = new TabContentProcessor(mockChordDictionaryService);
	});

	describe('findChords', () => {
		it('should find chords in tab content', () => {
			const content = 'C  Am  G\ne|--0--0--3--\nB|--1--1--0--';
			const chords = processor.findChords(content);

			expect(chords).toHaveLength(3);
			expect(chords[0].name).toBe('C');
			expect(chords[1].name).toBe('Am');
			expect(chords[2].name).toBe('G');
		});

		it('should return empty array when no chords found', () => {
			const content = 'e|--0--1--2--\nB|--3--4--5--';
			const chords = processor.findChords(content);

			expect(chords).toHaveLength(0);
		});

		it('should handle empty content', () => {
			const chords = processor.findChords('');
			expect(chords).toHaveLength(0);
		});

		it('should find chords with correct positions', () => {
			const content = 'C is at position 0, Am is at position 5';
			const chords = processor.findChords(content);

			expect(chords[0].startIndex).toBe(0);
			expect(chords[0].endIndex).toBe(1);
			expect(chords[1].startIndex).toBeGreaterThan(0);
		});
	});

	describe('generateHtmlWithChords', () => {
		it('should generate HTML with chord spans', () => {
			const content = 'C  Am  G';
			const chords: ProcessedChord[] = [
				{
					name: 'C',
					fullName: 'C major',
					startIndex: 0,
					endIndex: 1,
					positions: [{ frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 }],
					currentPositionIndex: 0
				},
				{
					name: 'Am',
					fullName: 'A minor',
					startIndex: 3,
					endIndex: 5,
					positions: [{ frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 }],
					currentPositionIndex: 0
				},
				{
					name: 'G',
					fullName: 'G major',
					startIndex: 7,
					endIndex: 8,
					positions: [{ frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 }],
					currentPositionIndex: 0
				}
			];

			const html = processor.generateHtmlWithChords(content, chords);

			expect(html).toContain('<span class="chord" data-chord="C"');
			expect(html).toContain('<span class="chord" data-chord="Am"');
			expect(html).toContain('<span class="chord" data-chord="G"');
			expect(html).toContain('tabindex="0"');
		});

		it('should escape HTML in content', () => {
			const content = '<script>alert("xss")</script> C';
			const chords: ProcessedChord[] = [
				{
					name: 'C',
					fullName: 'C major',
					startIndex: 30,
					endIndex: 31,
					positions: [{ frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 }],
					currentPositionIndex: 0
				}
			];

			const html = processor.generateHtmlWithChords(content, chords);

			expect(html).not.toContain('<script>');
			expect(html).toContain('&lt;script&gt;');
		});

		it('should handle empty chord array', () => {
			const content = 'No chords here';
			const html = processor.generateHtmlWithChords(content, []);

			expect(html).toBe(content);
		});
	});

	describe('escapeHtml', () => {
		it('should escape HTML special characters', () => {
			const unsafe = '<div>"test" & \'quote\'</div>';
			const escaped = processor.escapeHtml(unsafe);

			expect(escaped).toBe('&lt;div&gt;&quot;test&quot; &amp; &#039;quote&#039;&lt;/div&gt;');
		});

		it('should handle empty string', () => {
			expect(processor.escapeHtml('')).toBe('');
		});

		it('should handle string without special characters', () => {
			const safe = 'This is safe text';
			expect(processor.escapeHtml(safe)).toBe(safe);
		});
	});

	describe('hashContent', () => {
		it('should generate consistent hash for same content', () => {
			const content = 'test content';
			const hash1 = processor.hashContent(content);
			const hash2 = processor.hashContent(content);

			expect(hash1).toBe(hash2);
		});

		it('should generate different hashes for different content', () => {
			const hash1 = processor.hashContent('content 1');
			const hash2 = processor.hashContent('content 2');

			expect(hash1).not.toBe(hash2);
		});

		it('should handle empty string', () => {
			const hash = processor.hashContent('');
			expect(hash).toBeDefined();
			expect(typeof hash).toBe('string');
		});
	});
});
