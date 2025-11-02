import { ParserStep, ParserContext } from '../../types';
export declare class ChordDetectionStep implements ParserStep {
    name: string;
    process(context: ParserContext): void;
}
