import { ParserStep, ParserContext } from '../types';

export class TuningDetectionStep implements ParserStep {
	name = 'TuningDetection';

	process(context: ParserContext): void {
		const { lines, result, options } = context;

		if (!options.detectTuning) {
			return; // Skip if detection is disabled
		}

		const stringNames: string[] = [];
		const stringCount = result.stringCount || 6;

		// Common tuning patterns in tab notation
		const tuningPatterns = [
			/^([eEADGBbfCF])[|:]/, // e|----, E|---- etc.
			/^String\s*(\d+)\s*:\s*([eEADGBbfCF])/i, // String 1: E etc.
			/^([eEADGBbfCF])\s*String/i, // E String etc.
			/Tuning:\s*([eEADGBbfCF][#b]?)\s*([eEADGBbfCF][#b]?)\s*([eEADGBbfCF][#b]?)\s*([eEADGBbfCF][#b]?)\s*([eEADGBbfCF][#b]?)\s*([eEADGBbfCF][#b]?)/i
		];

		// Look for lines that might indicate tuning
		for (let i = 0; i < Math.min(lines.length, 20); i++) {
			// Only check first 20 lines
			for (const pattern of tuningPatterns) {
				const match = lines[i].match(pattern);
				if (match) {
					if (pattern.toString().includes('Tuning:')) {
						// Extract all strings from a tuning declaration
						for (let j = 1; j <= stringCount; j++) {
							if (match[j]) {
								stringNames.push(match[j]);
							}
						}
						if (stringNames.length === stringCount) {
							result.stringNames = stringNames;
							return;
						}
					} else {
						// If line starts with a string name followed by | or :
						// Store it and look for consecutive lines
						const potentialStringNames = [];

						for (let j = 0; j < stringCount && i + j < lines.length; j++) {
							const lineMatch = lines[i + j].match(/^([eEADGBbfCF])[|:]/);
							if (lineMatch) {
								potentialStringNames.push(lineMatch[1]);
							} else {
								break;
							}
						}

						if (potentialStringNames.length === stringCount) {
							result.stringNames = potentialStringNames;
							return;
						}
					}
				}
			}
		}

		// If no tuning detected, set default based on string count
		if (stringCount === 6) {
			result.stringNames = ['e', 'B', 'G', 'D', 'A', 'E']; // Standard guitar tuning
		} else if (stringCount === 4) {
			result.stringNames = ['G', 'D', 'A', 'E']; // Standard bass tuning
		} else if (stringCount === 7) {
			result.stringNames = ['e', 'B', 'G', 'D', 'A', 'E', 'B']; // 7-string guitar
		} else if (stringCount === 5) {
			result.stringNames = ['G', 'D', 'A', 'E', 'B']; // 5-string bass
		} else {
			// Generate generic string names
			result.stringNames = Array(stringCount)
				.fill('')
				.map((_, i) => `String ${i + 1}`);
		}
	}
}
