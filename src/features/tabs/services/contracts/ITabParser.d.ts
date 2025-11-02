import type { ParsedTab, ParserStep } from '../types';
/**
 * Tab parser service interface
 * Parses raw guitar tab text into structured data
 */
export interface ITabParser {
    /**
     * Parse raw tab text into structured format
     */
    parse(tabText: string): ParsedTab;
    /**
     * Add a single parser step to the pipeline
     */
    addStep(step: ParserStep): void;
    /**
     * Register multiple parser steps
     */
    registerSteps(steps: ParserStep[]): void;
}
