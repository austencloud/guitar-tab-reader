// Export types
export * from './types';
export * from './TabParser';

// Export parser steps
export { PreprocessStep } from './steps/PreprocessStep';
export { StringCountDetectionStep } from './steps/StringCountDetectionStep';
export { TuningDetectionStep } from './steps/TuningDetectionStep';
export { SectionDetectionStep } from './steps/SectionDetectionStep';
export { NoteParsingStep } from './steps/NoteParsingStep';
export { ChordDetectionStep } from './steps/ChordDetectionStep';

// Create and export a default configured parser
import { TabParser } from './TabParser';
import { PreprocessStep } from './steps/PreprocessStep';
import { StringCountDetectionStep } from './steps/StringCountDetectionStep';
import { TuningDetectionStep } from './steps/TuningDetectionStep';
import { SectionDetectionStep } from './steps/SectionDetectionStep';
import { NoteParsingStep } from './steps/NoteParsingStep';
import { ChordDetectionStep } from './steps/ChordDetectionStep';

export function createTabParser(options = {}) {
	const parser = new TabParser(options);

	// Register default steps in the optimal processing order
	parser.registerSteps([
		new PreprocessStep(),
		new StringCountDetectionStep(),
		new TuningDetectionStep(),
		new SectionDetectionStep(),
		new NoteParsingStep(),
		new ChordDetectionStep()
	]);

	return parser;
}
