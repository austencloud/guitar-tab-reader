import { ParserStep, ParserContext, ParsedSection } from '../types';

export class SectionDetectionStep implements ParserStep {
	name = 'SectionDetection';

	process(context: ParserContext): void {
		context.result.sections = [];
		let currentSection: Partial<ParsedSection> | null = null;
		let sectionLines: string[] = [];
		let inSection = false;

		for (let i = 0; i < context.lines.length; i++) {
			const line = context.lines[i].trim();

			// Detect section start (e.g., [Intro], [Verse 1], etc.)
			const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
			if (sectionMatch) {
				// Finalize previous section if exists
				if (currentSection) {
					currentSection.lines = sectionLines;
					currentSection.endLine = i - 1;
					context.result.sections.push(currentSection as ParsedSection);
				}

				// Start new section
				currentSection = {
					title: sectionMatch[1].trim(),
					startLine: i,
					chords: [],
					positions: []
				};
				sectionLines = [];
				inSection = true;
				continue; // Don't add the title line to sectionLines
			}

			// If it's a blank line and we are between sections, ignore it
			if (!inSection && line === '') {
				continue;
			}

			// If it's the first non-blank, non-title line, start the default section
			if (!inSection && line !== '') {
				currentSection = {
					title: undefined, // Default section might not have a title
					startLine: i,
					chords: [],
					positions: []
				};
				sectionLines = [];
				inSection = true;
			}

			// Add line to current section if we are in one
			if (inSection && currentSection) {
				// Only add non-empty lines or lines that are part of the tab structure
				if (line !== '' || context.lines[i].match(/^\s*[eBGDAE]-\|/)) {
					sectionLines.push(context.lines[i]); // Store original line with leading/trailing whitespace
				}
			}
		}

		// Finalize the last section
		if (currentSection) {
			currentSection.lines = sectionLines;
			currentSection.endLine = context.lines.length - 1;
			context.result.sections.push(currentSection as ParsedSection);
		}

		// If no sections were detected but there are lines, create a single default section
		if (context.result.sections.length === 0 && context.lines.some((l) => l.trim() !== '')) {
			context.result.sections.push({
				title: undefined,
				startLine: 0,
				endLine: context.lines.length - 1,
				lines: context.lines.filter((l) => l.trim() !== ''), // Store non-empty original lines
				chords: [],
				positions: []
			});
		}
	}
}
