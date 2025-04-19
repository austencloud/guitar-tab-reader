import { ParserStep, ParserContext } from '../types';

export class PreprocessStep implements ParserStep {
	name = 'Preprocess';

	process(context: ParserContext): void {
		const { lines, options } = context;

		// Remove empty lines at the beginning and end
		while (lines.length > 0 && lines[0].trim() === '') {
			lines.shift();
		}

		while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
			lines.pop();
		}

		// Handle comments if needed
		if (options.ignoreComments) {
			for (let i = 0; i < lines.length; i++) {
				// Remove common comment markers
				if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('#')) {
					lines[i] = '';
				}
			}
		}

		// Normalize whitespace in each line
		for (let i = 0; i < lines.length; i++) {
			// Replace tabs with appropriate number of spaces
			lines[i] = lines[i].replace(/\t/g, '  ');
		}
	}
}
