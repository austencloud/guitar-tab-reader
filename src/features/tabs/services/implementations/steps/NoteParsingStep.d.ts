import { ParserStep, ParserContext } from '../../types';
export declare class NoteParsingStep implements ParserStep {
    name: string;
    process(context: ParserContext): void;
    private parseNotesInSection;
    private parseTabLines;
    private parseTechnique;
}
