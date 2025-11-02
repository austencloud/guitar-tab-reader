import { injectable } from 'inversify';
import type { ITabParser } from '../contracts/ITabParser';
import type {
	ParserContext,
	ParserStep,
	ParseOptions,
	ParsedTab
} from '../types';

/**
 * Tab parser service implementation
 * Parses raw guitar tab text into structured data using a pipeline of steps
 */
@injectable()
export class TabParserService implements ITabParser {
	private steps: ParserStep[] = [];

	constructor(private options: ParseOptions = {}) {}

	addStep(step: ParserStep): void {
		this.steps.push(step);
	}

	registerSteps(steps: ParserStep[]): void {
		this.steps.push(...steps);
	}

	parse(tabText: string): ParsedTab {
		const context: ParserContext = {
			lines: tabText.split('\n'),
			options: this.options,
			result: {
				sections: [],
				stringCount: 6,
				stringNames: ['e', 'B', 'G', 'D', 'A', 'E']
			}
		};

		// Run each step in the pipeline
		for (const step of this.steps) {
			try {
				step.process(context);
			} catch (error) {
				console.error(`Error in parser step '${step.name}':`, error);
				// Continue with other steps instead of failing completely
			}
		}

		if (tabText) {
			context.result.rawContent = tabText;
		}

		return context.result as ParsedTab;
	}
}
