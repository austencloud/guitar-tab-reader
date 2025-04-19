import { ParserStep, ParserContext } from '../types';

export class ChordDetectionStep implements ParserStep {
	name = 'ChordDetection';

	process(context: ParserContext): void {
		const { result } = context;
		const sections = result.sections || [];

		// Common chord patterns
		const chordRegex =
			/\b([A-G][#b]?(?:maj|min|m|dim|aug|sus[24]?|add\d|[2-9]|1[0-3])?(?:\/[A-G][#b]?)?)\b/g;

		for (const section of sections) {
			const { lines } = section;

			// Look for chord name patterns at the beginning of lines
			// or in a line by themselves before tab notation
			const chordsInSection: string[] = [];

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim();

				// Skip tab notation lines
				if (line.match(/^[a-zA-Z]?[|:][|-]/)) {
					continue;
				}

				// Look for lines that might be chord names
				const matches = line.match(chordRegex);
				if (matches) {
					// If the line ONLY contains chord names and spacing
					// or if the chords are evenly spaced (like chord charts)
					const nonChordContent = line.replace(chordRegex, '').trim();
					if (nonChordContent === '' || nonChordContent.match(/^[\s-|:]+$/)) {
						chordsInSection.push(...matches);
					}
				}
			}

			// Add unique chords to section metadata
			if (chordsInSection.length > 0) {
				section.chords = [...new Set(chordsInSection)];
			}

			// Analyze notes to find potential chord shapes
			if (section.notes && section.notes.length > 0) {
				this.detectChordShapesFromNotes(section);
			}
		}
	}

	private detectChordShapesFromNotes(section: any): void {
		const { notes, stringCount } = section;
		const chordShapes: { position: number; notes: number[] }[] = [];

		// Group notes by position
		const notesByPosition: Record<number, any[]> = {};

		for (const note of notes) {
			if (!notesByPosition[note.position]) {
				notesByPosition[note.position] = [];
			}
			notesByPosition[note.position].push(note);
		}

		// Find positions with multiple notes (potential chords)
		for (const [position, notesAtPosition] of Object.entries(notesByPosition)) {
			// If we have at least 3 notes at the same position, it's likely a chord
			if (notesAtPosition.length >= 3) {
				const chordShape = {
					position: parseInt(position),
					notes: notesAtPosition.map((n) => (typeof n.fret === 'number' ? n.fret : -1))
				};

				// Fill in muted strings as -1
				while (chordShape.notes.length < stringCount) {
					chordShape.notes.push(-1);
				}

				chordShapes.push(chordShape);
			}
		}

		if (chordShapes.length > 0) {
			section.chordShapes = chordShapes;
		}
	}
}
