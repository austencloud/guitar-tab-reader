import { ParserStep, ParserContext } from '../../types';
export declare class PreprocessStep implements ParserStep {
    name: string;
    process(context: ParserContext): void;
}
