import { ParserStep, ParserContext } from '../types';

export class StringCountDetectionStep implements ParserStep {
	name = 'StringCountDetection';

	process(context: ParserContext): void {
		const { lines, result, options } = context;

		if (!options.detectStringCount) {
			return; // Skip if detection is disabled
		}

		// Look for consecutive lines that look like tab notation
		const tabLineGroups: number[][] = [];
		let currentGroup: number[] = [];

		const isTabLine = (line: string): boolean => {
			// Tab lines typically start with a string name followed by | or :
			return /^[a-zA-Z][|:][|-]/.test(line.trim()) || /^[|-]/.test(line.trim());
		};

		for (let i = 0; i < lines.length; i++) {
			if (isTabLine(lines[i])) {
				currentGroup.push(i);
			} else if (currentGroup.length > 0) {
				tabLineGroups.push([...currentGroup]);
				currentGroup = [];
			}
		}

		if (currentGroup.length > 0) {
			tabLineGroups.push(currentGroup);
		}

		// Find the most common number of consecutive tab lines
		const groupSizes = tabLineGroups.map((group) => group.length);

		if (groupSizes.length === 0) {
			// Default to 6 strings if we couldn't detect
			result.stringCount = 6;
			return;
		}

		// Count occurrences of each group size
		const sizeCounts: Record<number, number> = {};
		groupSizes.forEach((size) => {
			sizeCounts[size] = (sizeCounts[size] || 0) + 1;
		});

		// Find the most common size
		let maxCount = 0;
		let mostCommonSize = 6; // Default

		Object.entries(sizeCounts).forEach(([size, count]) => {
			if (count > maxCount) {
				maxCount = count;
				mostCommonSize = parseInt(size);
			}
		});

		result.stringCount = mostCommonSize;
	}
}
