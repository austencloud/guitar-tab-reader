import { ParserContext, ParserStep, ParseOptions, ParsedTab } from './types';

export class TabParser {
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
				stringCount: 6, // default
				stringNames: ['e', 'B', 'G', 'D', 'A', 'E'] // default
			}
		};

		// Run each step
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
