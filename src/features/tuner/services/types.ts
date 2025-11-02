export interface StringDefinition {
	note: string;
	octave: number;
	frequency: number;
	string: number;
}

export interface NoteInfo {
	name: string;
	octave: number;
	frequency: number;
}

export interface Tunings {
	[key: string]: StringDefinition[];
}

export type TunerStatus = 'inactive' | 'requesting' | 'active' | 'error';
