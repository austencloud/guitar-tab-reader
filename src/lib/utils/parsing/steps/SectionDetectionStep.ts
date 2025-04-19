import { ParserStep, ParserContext, TabSection } from '../types';

export class SectionDetectionStep implements ParserStep {
	name = 'SectionDetection';

	process(context: ParserContext): void {
		const { lines, result } = context;
		const sections: TabSection[] = [];
		const stringCount = result.stringCount || 6;

		// Check for tab line pattern (e|----, etc)
		const isTabLine = (line: string): boolean => {
			return /^[a-zA-Z][|:][|-]/.test(line.trim()) || /^[|-]/.test(line.trim());
		};

		// Find section titles (usually all caps or surrounded by [] or similar)
		const isSectionTitle = (line: string): boolean => {
			return (
				/^\s*\[.*\]\s*$/.test(line) || // [VERSE], [CHORUS], etc.
				/^\s*[A-Z\s]+:?\s*$/.test(line) || // VERSE:, CHORUS:, etc.
				/^\s*[A-Z][a-z]+\s+[0-9]+:?\s*$/.test(line)
			); // Verse 1:, Chorus 2:, etc.
		};

		let sectionStartLine = 0;
		let inTabSection = false;
		let currentTitle = '';
		let consecutiveTabLines = 0;
		let tabLinesInSection = 0;

		const tryFinishSection = (endLine: number): void => {
			if (tabLinesInSection > 0 && endLine - sectionStartLine > 0) {
				const sectionLines = lines.slice(sectionStartLine, endLine);
				sections.push({
					title: currentTitle,
					startLine: sectionStartLine,
					endLine: endLine - 1,
					stringCount,
					lines: sectionLines,
					notes: [], // Will be filled in by NoteParsingStep
					rawContent: sectionLines.join('\n')
				});
				currentTitle = '';
				tabLinesInSection = 0;
			}
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (isSectionTitle(line)) {
				if (inTabSection) {
					// End previous section
					tryFinishSection(i);
					sectionStartLine = i;
					inTabSection = false;
				}
				currentTitle = line
					.trim()
					.replace(/[\[\]:]/g, '')
					.trim();
				continue;
			}

			if (isTabLine(line)) {
				consecutiveTabLines++;
				tabLinesInSection++;

				if (consecutiveTabLines === 1) {
					// First tab line encountered after a non-tab sequence
					if (!inTabSection) {
						sectionStartLine = Math.max(0, i - 1); // Include the line before for context
						inTabSection = true;
					}
				}

				// If we've found a complete set of strings, check for section break
				if (consecutiveTabLines === stringCount) {
					// Look ahead to see if this is the end of a section
					if (i + 1 >= lines.length || !isTabLine(lines[i + 1])) {
						// Next line isn't a tab line, this might be the end of a section
						// Only end section if we've moved a good distance from the start
						if (i - sectionStartLine >= stringCount * 2) {
							tryFinishSection(i + 1);
							inTabSection = false;
						}
					}
					consecutiveTabLines = 0;
				}
			} else {
				consecutiveTabLines = 0;
			}
		}

		// Process any remaining section
		if (inTabSection) {
			tryFinishSection(lines.length);
		}

		// If no sections were found but we have tab content, create a default section
		if (sections.length === 0 && lines.length > 0) {
			sections.push({
				title: 'Tab',
				startLine: 0,
				endLine: lines.length - 1,
				stringCount,
				lines: lines.slice(),
				notes: [],
				rawContent: lines.join('\n')
			});
		}

		result.sections = sections;
	}
}
