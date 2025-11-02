import { Container } from 'inversify';
export * from './types';
export type { ITabParser } from './contracts/ITabParser';
export { TabParserService } from './implementations/TabParserService';
export { createTabParser } from './implementations/TabParserFactory';
export { PreprocessStep } from './implementations/steps/PreprocessStep';
export { StringCountDetectionStep } from './implementations/steps/StringCountDetectionStep';
export { TuningDetectionStep } from './implementations/steps/TuningDetectionStep';
export { SectionDetectionStep } from './implementations/steps/SectionDetectionStep';
export { NoteParsingStep } from './implementations/steps/NoteParsingStep';
export { ChordDetectionStep } from './implementations/steps/ChordDetectionStep';
export { TabState } from '../state/tab.svelte';
/**
 * Register all tab-related services in the DI container
 */
export declare function registerTabServices(container: Container): void;
