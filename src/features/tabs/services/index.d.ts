import { Container } from 'inversify';
export * from './types';
export type { ITabParser } from './contracts/ITabParser';
export type { ITabContentProcessor } from './contracts/ITabContentProcessor';
export type { IChordDictionaryService } from './contracts/IChordDictionaryService';
export type { IResponsiveFontCalculator } from './contracts/IResponsiveFontCalculator';
export { TabParserService } from './implementations/TabParserService';
export { createTabParser } from './implementations/TabParserFactory';
export { TabContentProcessor } from './implementations/TabContentProcessor';
export { ChordDictionaryService } from './implementations/ChordDictionaryService';
export { ResponsiveFontCalculator } from './implementations/ResponsiveFontCalculator';
export { PreprocessStep } from './implementations/steps/PreprocessStep';
export { StringCountDetectionStep } from './implementations/steps/StringCountDetectionStep';
export { TuningDetectionStep } from './implementations/steps/TuningDetectionStep';
export { SectionDetectionStep } from './implementations/steps/SectionDetectionStep';
export { NoteParsingStep } from './implementations/steps/NoteParsingStep';
export { ChordDetectionStep } from './implementations/steps/ChordDetectionStep';
export { TabState } from '../state/tab.svelte';
export { createTabViewerState } from '../state/tab-viewer-state.svelte';
export type { TabViewerState } from '../state/tab-viewer-state.svelte';
/**
 * Register all tab-related services in the DI container
 */
export declare function registerTabServices(container: Container): void;
