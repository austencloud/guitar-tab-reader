import type { StringDefinition, Tunings } from './types';
export declare const standardTunings: Tunings;
export declare function getTunings(): Tunings;
export declare function getSelectedTuning(): string;
export declare function setSelectedTuning(value: string): void;
export declare function addCustomTuning(name: string, strings: StringDefinition[]): void;
export declare const tunings: Tunings;
export declare const selectedTuning: string;
/**
 * Get the short display name for a tuning (e.g., "Standard" from "Standard (E-A-D-G-B-E)")
 */
export declare function getTuningDisplayName(tuningName: string): string;
/**
 * Get the string names for a tuning (e.g., ["E", "A", "D", "G", "B", "E"])
 */
export declare function getTuningStringNames(tuningName: string): string[];
export declare function getClosestString(frequency: number, activeStrings: StringDefinition[]): StringDefinition | null;
export declare function calculateCents(actual: number, target: number): number;
