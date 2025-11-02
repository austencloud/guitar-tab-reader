import { type Writable } from 'svelte/store';
import type { StringDefinition, Tunings } from './types';
export declare const standardTunings: Tunings;
export declare const tunings: Writable<Tunings>;
export declare const selectedTuning: Writable<string>;
export declare function addCustomTuning(name: string, strings: StringDefinition[]): void;
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
