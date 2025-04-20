import { createTabParser } from './parsing';
import type {
	ParsedTab as NewParsedTab,
	ParsedNote,
	ParsedSection as NewTabSection,
	ParsedChord
} from './parsing';

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
	// Use the new parser pipeline
	const parser = createTabParser({
		detectStringCount: true,
		detectTuning: true
	});

	const newParsedTab: NewParsedTab = parser.parse(tabText);

	// Convert to the old format for backward compatibility
	return convertToLegacyFormat(newParsedTab);
}

/**
 * Convert the new parser output format to the legacy format
 */
function convertToLegacyFormat(newTab: NewParsedTab): ParsedTab {
	const sections: TabSection[] = newTab.sections.map((section) => {
		// Convert notes to positions
		const positions = convertNotesToPositions(section);

		// Map ParsedChord objects to the structure expected by TabChord (if different)
		// Assuming TabChord is { name: string; position: number; }
		const chords: TabChord[] = (section.chords || []).map((chord: ParsedChord) => {
			// If TabChord structure is different, adjust the return object here
			return { name: chord.name, position: chord.position };
		});

		return {
			title: section.title,
			lines: section.lines,
			positions,
			chords,
			startPosition: section.startLine,
			endPosition: section.endLine
		};
	});

	return {
		sections,
		stringCount: newTab.stringCount,
		stringNames: newTab.stringNames
	};
}

/**
 * Convert the new notes format to the legacy positions format
 */
function convertNotesToPositions(section: NewTabSection): TabPosition[] {
	// Group notes by position
	const notesByPosition: Record<number, ParsedNote[]> = {};
	const measurePositions = new Set<number>();

	// Identify measure line positions
	for (const line of section.lines) {
		for (let i = 0; i < line.length; i++) {
			if (line[i] === '|') {
				measurePositions.add(i);
			}
		}
	}

	// Group notes by position
	for (const note of section.notes) {
		if (!notesByPosition[note.position]) {
			notesByPosition[note.position] = [];
		}
		notesByPosition[note.position].push(note);
	}

	// Convert to positions
	const positions: TabPosition[] = [];

	// Add measure positions first
	for (const pos of measurePositions) {
		positions.push({
			position: pos,
			notes: new Map(),
			isMeasureLine: true
		});
	}

	// Add note positions
	for (const [pos, notes] of Object.entries(notesByPosition)) {
		const position = parseInt(pos);

		// Skip if already added as a measure line
		if (measurePositions.has(position)) {
			const existingPosition = positions.find((p) => p.position === position);
			if (existingPosition) {
				// Add notes to existing position
				for (const note of notes) {
					existingPosition.notes.set(note.string, {
						fret: typeof note.fret === 'number' ? note.fret : 0,
						...(note.technique ? { technique: note.technique } : {}),
						...(note.targetFret !== undefined ? { techniqueFret: note.targetFret } : {})
					});
				}
				continue;
			}
		}

		// Create new position
		const tabPosition: TabPosition = {
			position,
			notes: new Map(),
			isMeasureLine: measurePositions.has(position)
		};

		// Add notes
		for (const note of notes) {
			tabPosition.notes.set(note.string, {
				fret: typeof note.fret === 'number' ? note.fret : 0,
				...(note.technique ? { technique: note.technique } : {}),
				...(note.targetFret !== undefined ? { techniqueFret: note.targetFret } : {})
			});
		}

		positions.push(tabPosition);
	}

	// Sort positions
	return positions.sort((a, b) => a.position - b.position);
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
