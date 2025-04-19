export interface TabNote {
	fret: number;
	technique?: string;
	techniqueFret?: number;
	duration?: number;
}

export interface TabPosition {
	position: number;
	notes: Map<number, TabNote>; // string index to note
	isMeasureLine: boolean;
}

export interface TabChord {
	name: string;
	position: number;
}

export interface TabSection {
	title?: string;
	lines: string[];
	positions: TabPosition[];
	chords: TabChord[];
	startPosition: number;
	endPosition: number;
}

export interface ParsedTab {
	sections: TabSection[];
	stringCount: number;
	stringNames: string[];
}

/**
 * Parse guitar tab text into structured data format
 */
export function parseTab(tabText: string): ParsedTab {
	const lines = tabText.split('\n');
	const sections: TabSection[] = [];

	// Default to 6-string guitar
	let stringCount = 6;
	let stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];

	// Find tab sections
	let currentSectionLines: string[] = [];
	let currentTitle: string | undefined;
	let startPosition = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check for section headers (typically in brackets or separated by empty lines)
		if (line.trim() === '' && currentSectionLines.length > 0) {
			// Process completed section
			const parsedSection = parseTabSection(currentSectionLines, currentTitle, startPosition);
			sections.push(parsedSection);

			// Reset for next section
			currentSectionLines = [];
			currentTitle = undefined;
			startPosition = i + 1;
			continue;
		}

		// Check if this is a potential section header
		if (
			currentSectionLines.length === 0 &&
			(line.match(/^\[.*\]$/) || line.match(/^[A-Za-z\s]+:$/))
		) {
			currentTitle = line.replace(/[\[\]:]/g, '').trim();
			startPosition = i + 1;
			continue;
		}

		// Add line to current section
		currentSectionLines.push(line);
	}

	// Process final section if it exists
	if (currentSectionLines.length > 0) {
		const parsedSection = parseTabSection(currentSectionLines, currentTitle, startPosition);
		sections.push(parsedSection);
	}

	// Determine string count from the sections
	const detectedStringCount = detectStringCount(sections);
	if (detectedStringCount > 0) {
		stringCount = detectedStringCount;

		// Update string names based on detected count
		if (stringCount === 4) {
			// Bass guitar
			stringNames = ['G', 'D', 'A', 'E'];
		} else if (stringCount === 7) {
			// 7-string guitar
			stringNames = ['e', 'B', 'G', 'D', 'A', 'E', 'B'];
		} else if (stringCount === 8) {
			// 8-string guitar
			stringNames = ['e', 'B', 'G', 'D', 'A', 'E', 'B', 'F#'];
		}
	}

	return {
		sections,
		stringCount,
		stringNames
	};
}

/**
 * Parse tab section into structured format
 */
function parseTabSection(sectionLines: string[], title?: string, startPosition = 0): TabSection {
	// Identify tab lines vs chord/lyric lines
	const tabLines: string[] = [];
	const chordLines: string[] = [];
	const positions: TabPosition[] = [];
	const chords: TabChord[] = [];

	// First identify which lines are tab lines (contain string indicators like |-----|)
	sectionLines.forEach((line, index) => {
		if (
			line.includes('--') ||
			line.includes('|') ||
			line.match(/^[eEADGBbf]:?\|?-+/) ||
			line.match(/^[eEADGBbf]\|/) ||
			line.match(/^\|?-+\|?$/) ||
			line.includes('-')
		) {
			tabLines.push(line);
		} else if (line.trim().length > 0) {
			// This might be a chord line
			chordLines.push(line);
		}
	});

	// Process tab lines to find notes and measures
	if (tabLines.length > 0) {
		// Find all positions where notes or measures exist
		const allPositions = new Set<number>();
		const measurePositions = new Set<number>();

		tabLines.forEach((line) => {
			// Find all positions with content
			Array.from(line).forEach((char, pos) => {
				if (char !== '-' && char !== '|') {
					allPositions.add(pos);
				}
				if (char === '|') {
					measurePositions.add(pos);
					allPositions.add(pos);
				}
			});
		});

		// Sort positions
		const sortedPositions = Array.from(allPositions).sort((a, b) => a - b);

		// Create tab positions
		sortedPositions.forEach((pos) => {
			const tabPosition: TabPosition = {
				position: pos,
				notes: new Map(),
				isMeasureLine: measurePositions.has(pos)
			};

			// Find notes at this position
			tabLines.forEach((line, stringIndex) => {
				if (pos < line.length) {
					const char = line[pos];

					if (char !== '-' && char !== '|') {
						// This is a note
						const note = parseNote(line, pos);
						if (note) {
							tabPosition.notes.set(stringIndex, note);
						}
					}
				}
			});

			positions.push(tabPosition);
		});
	}

	// Look for chord names above tab lines
	if (chordLines.length > 0 && tabLines.length > 0) {
		chordLines.forEach((line) => {
			const foundChords = findChords(line, tabLines[0]);
			chords.push(...foundChords);
		});
	}

	return {
		title,
		lines: tabLines,
		positions,
		chords,
		startPosition,
		endPosition: startPosition + sectionLines.length
	};
}

/**
 * Parse a note and any techniques at the given position
 */
function parseNote(line: string, position: number): TabNote | null {
	if (position >= line.length) {
		return null;
	}

	const char = line[position];
	if (char === '-' || char === '|') {
		return null;
	}

	// Parse the fret number
	let fretStr = char;
	let pos = position + 1;

	// Handle multi-digit fret numbers (e.g., 10, 12, etc)
	while (pos < line.length && /\d/.test(line[pos])) {
		fretStr += line[pos];
		pos++;
	}

	const fret = parseInt(fretStr, 10);

	if (isNaN(fret)) {
		return null;
	}

	// Look for techniques after the fret number
	let technique = '';
	let techniqueFret: number | undefined;

	if (pos < line.length) {
		// Check for hammer-ons
		if (line[pos] === 'h') {
			technique = 'h';
			// Look for the target fret
			pos++;
			let techFretStr = '';
			while (pos < line.length && /\d/.test(line[pos])) {
				techFretStr += line[pos];
				pos++;
			}
			if (techFretStr) {
				techniqueFret = parseInt(techFretStr, 10);
			}
		}
		// Check for pull-offs
		else if (line[pos] === 'p') {
			technique = 'p';
			// Look for the target fret
			pos++;
			let techFretStr = '';
			while (pos < line.length && /\d/.test(line[pos])) {
				techFretStr += line[pos];
				pos++;
			}
			if (techFretStr) {
				techniqueFret = parseInt(techFretStr, 10);
			}
		}
		// Check for bends
		else if (line[pos] === 'b') {
			technique = 'b';
			pos++;
			// Look for bend amount like b1/2 or b1
			if (pos < line.length && /[\d\/]/.test(line[pos])) {
				let bendAmount = '';
				while (pos < line.length && /[\d\/]/.test(line[pos])) {
					bendAmount += line[pos];
					pos++;
				}
				if (bendAmount) {
					technique = `b${bendAmount}`;
				}
			}
		}
		// Check for slides
		else if (line[pos] === '/' || line[pos] === '\\') {
			technique = line[pos];
			// Look for the target fret
			pos++;
			let techFretStr = '';
			while (pos < line.length && /\d/.test(line[pos])) {
				techFretStr += line[pos];
				pos++;
			}
			if (techFretStr) {
				techniqueFret = parseInt(techFretStr, 10);
			}
		}
		// Check for vibrato
		else if (line[pos] === '~') {
			technique = '~';
		}
	}

	return {
		fret,
		...(technique ? { technique } : {}),
		...(techniqueFret !== undefined ? { techniqueFret } : {})
	};
}

/**
 * Find chords in a chord line, matching positions with the tab line
 */
function findChords(chordLine: string, tabLine: string): TabChord[] {
	const chords: TabChord[] = [];
	let currentChord = '';
	let chordStartPos = -1;

	// Track chords in the line
	for (let i = 0; i < chordLine.length; i++) {
		const char = chordLine[i];

		if (char.trim() !== '') {
			if (currentChord === '') {
				// Start of new chord
				chordStartPos = i;
			}
			currentChord += char;
		} else if (currentChord !== '') {
			// End of chord
			if (chordStartPos >= 0) {
				chords.push({
					name: currentChord,
					position: chordStartPos
				});
			}
			currentChord = '';
			chordStartPos = -1;
		}
	}

	// Handle last chord if exists
	if (currentChord !== '' && chordStartPos >= 0) {
		chords.push({
			name: currentChord,
			position: chordStartPos
		});
	}

	return chords;
}

/**
 * Detect the number of strings used in the tab
 */
function detectStringCount(sections: TabSection[]): number {
	const stringCounts = new Map<number, number>();

	sections.forEach((section) => {
		// Count lines that appear to be tab lines
		const count = section.lines.length;
		if (count >= 4 && count <= 8) {
			// Common string counts
			stringCounts.set(count, (stringCounts.get(count) || 0) + 1);
		}
	});

	// Find the most common string count
	let maxCount = 0;
	let mostCommonStringCount = 6; // Default to 6-string guitar

	for (const [count, occurrences] of stringCounts.entries()) {
		if (occurrences > maxCount) {
			maxCount = occurrences;
			mostCommonStringCount = count;
		}
	}

	return mostCommonStringCount;
}

/**
 * Get a standard chord diagram for common chords
 */
export function getChordDiagram(chordName: string): { positions: number[]; barre?: number } | null {
	const chords: Record<string, { positions: number[]; barre?: number }> = {
		C: { positions: [0, 1, 0, 2, 3, -1] },
		D: { positions: [-1, -1, 0, 2, 3, 2] },
		E: { positions: [0, 0, 1, 2, 2, 0] },
		F: { positions: [1, 1, 2, 3, 3, 1], barre: 1 },
		G: { positions: [3, 0, 0, 0, 2, 3] },
		A: { positions: [0, 0, 2, 2, 2, 0] },
		B: { positions: [-1, 2, 4, 4, 4, 2], barre: 2 },
		Am: { positions: [0, 1, 2, 2, 0, 0] },
		Em: { positions: [0, 0, 0, 2, 2, 0] },
		Dm: { positions: [-1, -1, 0, 2, 3, 1] },
		G7: { positions: [3, 0, 0, 0, 2, 1] },
		C7: { positions: [0, 1, 3, 2, 3, -1] },
		D7: { positions: [-1, -1, 0, 2, 1, 2] },
		E7: { positions: [0, 0, 1, 0, 2, 0] },
		A7: { positions: [0, 0, 2, 0, 2, 0] }
	};

	// Try exact match first
	if (chords[chordName]) {
		return chords[chordName];
	}

	// Try to match by removing any modifiers after the base chord
	const baseChord = chordName.match(/^[A-G][#b]?(m|maj|min|sus|aug|dim)?/);
	if (baseChord && chords[baseChord[0]]) {
		return chords[baseChord[0]];
	}

	return null;
}
