import { ParserStep, ParserContext } from '../../types';
export declare class StringCountDetectionStep implements ParserStep {
    name: string;
    process(context: ParserContext): void;
}
