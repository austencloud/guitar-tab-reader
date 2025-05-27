import { ParserStep, ParserContext, ParsedNote, ParsedSection } from '../types';

export class NoteParsingStep implements ParserStep {
	name = 'NoteParsing';

	process(context: ParserContext): void {
		const { result } = context;
		const sections = result.sections || [];
		const stringCount = result.stringCount || 6;

		for (const section of sections) {
			this.parseNotesInSection(section, stringCount);
		}
	}

	private parseNotesInSection(section: ParsedSection, stringCount: number): void {
		const { lines } = section;
		const notes: ParsedNote[] = [];

		// Find the tab lines within the section
		const tabLineGroups: number[][] = [];
		let currentGroup: number[] = [];

		const isTabLine = (line: string): boolean => {
			return /^[a-zA-Z]?[|:][-|]/.test(line.trim()) || /^[-|]/.test(line.trim());
		};

		for (let i = 0; i < lines.length; i++) {
			if (isTabLine(lines[i].trim())) {
				currentGroup.push(i);
			} else if (currentGroup.length > 0) {
				if (currentGroup.length >= stringCount) {
					tabLineGroups.push([...currentGroup]);
				}
				currentGroup = [];
			}
		}

		if (currentGroup.length >= stringCount) {
			tabLineGroups.push(currentGroup);
		}

		// Process each group of tab lines
		for (const group of tabLineGroups) {
			// Only process complete groups (matching string count)
			if (group.length >= stringCount) {
				const tabLines = group.slice(0, stringCount).map((idx) => lines[idx]);
				this.parseTabLines(tabLines, notes);
			}
		}

		// Store notes in positions array
		if (!section.positions) {
			section.positions = [];
		}

		// Group notes by position
		const notesByPosition: { [pos: number]: ParsedNote[] } = {};
		for (const note of notes) {
			if (!notesByPosition[note.position]) {
				notesByPosition[note.position] = [];
			}
			notesByPosition[note.position].push(note);
		}

		// Add to positions array
		for (const [pos, posNotes] of Object.entries(notesByPosition)) {
			const position = parseInt(pos);
			const existingPos = section.positions.find((p) => p.position === position);
			if (existingPos) {
				existingPos.notes.push(...posNotes);
			} else {
				section.positions.push({
					position,
					isMeasureLine: false,
					notes: posNotes
				});
			}
		}
	}

	private parseTabLines(tabLines: string[], notes: ParsedNote[]): void {
		// Find maximum content length to avoid out-of-bounds access
		const maxLength = tabLines.reduce((max, line) => Math.max(max, line.length), 0);

		// Find the starting position of the tab notation (after string name and | or :)
		const startPositions = tabLines.map((line) => {
			const match = line.match(/^[a-zA-Z]?[|:]/);
			return match ? match[0].length : 0;
		});

		// Process each position across all strings
		for (let pos = 0; pos < maxLength; pos++) {
			for (let stringIndex = 0; stringIndex < tabLines.length; stringIndex++) {
				const line = tabLines[stringIndex];
				const startPos = startPositions[stringIndex];

				if (pos + startPos < line.length) {
					const char = line[pos + startPos];

					// If the character is a digit, we've found a note
					if (/[0-9xX]/.test(char)) {
						// Check if it's a single or double digit (or more)
						let fretStr = char;
						let nextPos = pos + startPos + 1;

						while (nextPos < line.length && /[0-9]/.test(line[nextPos])) {
							fretStr += line[nextPos];
							nextPos++;
						}

						const fret = /[xX]/.test(char) ? 'x' : parseInt(fretStr, 10);

						const note: ParsedNote = {
							string: stringIndex,
							position: pos,
							fret
						};

						// Check for technique markers after the note (h, p, b, etc)
						if (nextPos < line.length) {
							const technique = this.parseTechnique(line, nextPos);
							if (technique) {
								note.technique = technique.type;

								// For pull-offs, hammer-ons, and bends, look for target fret
								if (['h', 'p', 'b', '/'].includes(technique.type) && nextPos + 1 < line.length) {
									const targetMatch = line.substring(nextPos + 1).match(/^([0-9]+)/);
									if (targetMatch) {
										note.targetFret = parseInt(targetMatch[1], 10);
									}
								}
							}
						}

						notes.push(note);
					}
				}
			}
		}
	}

	private parseTechnique(line: string, position: number): { type: string; length: number } | null {
		if (position >= line.length) return null;

		const char = line[position];
		const techniqueMap: Record<string, string> = {
			h: 'h', // hammer-on
			p: 'p', // pull-off
			b: 'b', // bend
			r: 'r', // release
			'/': '/', // slide up
			'\\': '\\', // slide down
			'~': '~', // vibrato
			t: 't', // tap
			s: 's' // slap (bass)
		};

		if (techniqueMap[char]) {
			return { type: techniqueMap[char], length: 1 };
		}

		// Check for more complex techniques
		if (char === '(' && position + 1 < line.length) {
			// Could be (h), (p), etc.
			if (techniqueMap[line[position + 1]] && line[position + 2] === ')') {
				return { type: techniqueMap[line[position + 1]], length: 3 };
			}
		}

		return null;
	}
}
