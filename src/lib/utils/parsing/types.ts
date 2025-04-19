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
}

export interface TabSection {
	title?: string;
	startLine: number;
	endLine: number;
	stringCount: number;
	lines: string[];
	notes: ParsedNote[];
	rawContent: string;
	chords?: string[];
	chordShapes?: { position: number; notes: number[] }[];
}

export interface ParsedTab {
	sections: TabSection[];
	stringCount: number;
	stringNames: string[];
	rawContent?: string;
}

export interface ParserContext {
	lines: string[];
	options: ParseOptions;
	result: Partial<ParsedTab>;
	currentSection?: Partial<TabSection>;
}

export interface ParserStep {
	name: string;
	process(context: ParserContext): void;
}
