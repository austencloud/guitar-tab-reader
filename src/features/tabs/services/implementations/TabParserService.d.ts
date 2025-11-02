import type { ITabParser } from '../contracts/ITabParser';
import type { ParserStep, ParseOptions, ParsedTab } from '../types';
/**
 * Tab parser service implementation
 * Parses raw guitar tab text into structured data using a pipeline of steps
 */
export declare class TabParserService implements ITabParser {
    private options;
    private steps;
    constructor(options?: ParseOptions);
    addStep(step: ParserStep): void;
    registerSteps(steps: ParserStep[]): void;
    parse(tabText: string): ParsedTab;
}
