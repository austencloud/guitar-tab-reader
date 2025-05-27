import { ParserStep, ParserContext, ParsedChord } from '../types';

export class ChordDetectionStep implements ParserStep {
	name = 'ChordDetection';

	process(context: ParserContext): void {
		const { result } = context;
		const sections = result.sections || [];

		for (const section of sections) {
			// Find chords in the non-tab lines
			const chordLines = section.lines.filter((line) => !isTabLine(line));
			const chordsInSection: ParsedChord[] = [];
			chordLines.forEach((line) => {
				let match;
				const chordRegex =
					/\b([A-G][b#]?(?:m|maj|min|aug|dim|sus[24]|add\d|m?7|m?9|m?11|m?13|6|5)*)/g;
				while ((match = chordRegex.exec(line)) !== null) {
					chordsInSection.push({ name: match[1], position: match.index });
				}
			});

			// Assign unique chords found to the section
			// Use a Map to ensure uniqueness based on name and position for simplicity
			const uniqueChords = Array.from(
				new Map(chordsInSection.map((c) => [`${c.name}@${c.position}`, c])).values()
			);
			section.chords = uniqueChords;

			// Remove chord lines from the main lines if they don't contain tab elements
			// This part might need refinement based on desired behavior
			// section.lines = section.lines.filter(line => isTabLine(line, context.result.stringCount ?? 6) || line.trim() === '' || line.match(/^\s*\|/));

			// Note: The logic checking section.notes was removed as 'notes' is no longer directly on ParsedSection
		}
	}
}

// Helper function (assuming similar logic exists or is needed)
function isTabLine(line: string): boolean {
	// Basic check: does it start with a string name (eBGDAE) or contain typical tab characters?
	const tabLineRegex = new RegExp(`^\\s*[eBGDAE]-\\|`);
	const containsTabChars = /[\d\-hps/\\~xb]/g.test(line);
	return tabLineRegex.test(line) || (containsTabChars && line.includes('-'));
}
