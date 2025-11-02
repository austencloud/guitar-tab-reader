import { ParserStep, ParserContext } from '../../types';
export declare class SectionDetectionStep implements ParserStep {
    name: string;
    process(context: ParserContext): void;
}
