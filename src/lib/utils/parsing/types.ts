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
	targetFret?: number; // Renamed from techniqueFret for clarity
	techniqueFret?: number; // Keep original for compatibility if needed, or remove if refactored
}

// Added ParsedChord based on ChordDetectionStep output
export interface ParsedChord {
	name: string;
	position: number; // Character position in the line
}

// Changed TabSection to ParsedSection and added missing fields
export interface ParsedSection {
	title?: string;
	startLine: number;
	endLine: number;
	lines: string[]; // Raw lines for this section
	positions: {
		// Array representing character positions within the section
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
