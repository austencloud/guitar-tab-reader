import { TabParserService } from './TabParserService';
import { PreprocessStep } from './steps/PreprocessStep';
import { StringCountDetectionStep } from './steps/StringCountDetectionStep';
import { TuningDetectionStep } from './steps/TuningDetectionStep';
import { SectionDetectionStep } from './steps/SectionDetectionStep';
import { NoteParsingStep } from './steps/NoteParsingStep';
import { ChordDetectionStep } from './steps/ChordDetectionStep';
import type { ParseOptions } from '../types';

/**
 * Factory function to create a fully configured tab parser
 * with all default parsing steps registered
 */
export function createTabParser(options: ParseOptions = {}): TabParserService {
	const parser = new TabParserService(options);

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
