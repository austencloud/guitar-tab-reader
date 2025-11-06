export interface ProgressLogEntry {
	timestamp: string;
	level: 'info' | 'warn' | 'error';
	message: string;
}
