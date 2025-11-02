/**
 * Tab parsing types
 */
export interface ParseOptions {
    detectStringCount?: boolean;
    detectTuning?: boolean;
    ignoreComments?: boolean;
}
export interface ParsedNote {
    string: number;
    position: number;
    fret: number | string;
    technique?: string;
    targetFret?: number;
    techniqueFret?: number;
}
export interface ParsedChord {
    name: string;
    position: number;
}
export interface ParsedSection {
    title?: string;
    startLine: number;
    endLine: number;
    lines: string[];
    positions: {
        position: number;
        isMeasureLine: boolean;
        notes: ParsedNote[];
    }[];
    chords: ParsedChord[];
}
export interface ParsedTab {
    sections: ParsedSection[];
    stringCount: number;
    stringNames: string[];
    rawContent?: string;
}
export interface ParserContext {
    lines: string[];
    options: ParseOptions;
    result: Partial<ParsedTab>;
    currentSection?: Partial<ParsedSection>;
}
export interface ParserStep {
    name: string;
    process(context: ParserContext): void;
}
