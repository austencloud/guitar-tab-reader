import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { TabParserService } from './implementations/TabParserService';
import { createTabParser } from './implementations/TabParserFactory';
import { TabState } from '../state/tab.svelte';
import { UrlImportService, SmartImportService } from '../modules/import/services/implementations';
import type { IUrlImportService, ISmartImportService } from '../modules/import/services/contracts';
import { TabContentProcessor } from './implementations/TabContentProcessor';
import { ChordDictionaryService } from './implementations/ChordDictionaryService';
import { ResponsiveFontCalculator } from './implementations/ResponsiveFontCalculator';
import type { ITabContentProcessor } from './contracts/ITabContentProcessor';
import type { IChordDictionaryService } from './contracts/IChordDictionaryService';
import type { IResponsiveFontCalculator } from './contracts/IResponsiveFontCalculator';

// Export types
export * from './types';

// Export contracts
export type { ITabParser } from './contracts/ITabParser';
export type { ITabContentProcessor } from './contracts/ITabContentProcessor';
export type { IChordDictionaryService } from './contracts/IChordDictionaryService';
export type { IResponsiveFontCalculator } from './contracts/IResponsiveFontCalculator';

// Export implementations
export { TabParserService } from './implementations/TabParserService';
export { createTabParser } from './implementations/TabParserFactory';
export { TabContentProcessor } from './implementations/TabContentProcessor';
export { ChordDictionaryService } from './implementations/ChordDictionaryService';
export { ResponsiveFontCalculator } from './implementations/ResponsiveFontCalculator';

// Export parser steps
export { PreprocessStep } from './implementations/steps/PreprocessStep';
export { StringCountDetectionStep } from './implementations/steps/StringCountDetectionStep';
export { TuningDetectionStep } from './implementations/steps/TuningDetectionStep';
export { SectionDetectionStep } from './implementations/steps/SectionDetectionStep';
export { NoteParsingStep } from './implementations/steps/NoteParsingStep';
export { ChordDetectionStep } from './implementations/steps/ChordDetectionStep';

// Export state
export { TabState } from '../state/tab.svelte';
export { createTabViewerState } from '../state/tab-viewer-state.svelte';
export type { TabViewerState } from '../state/tab-viewer-state.svelte';

/**
 * Register all tab-related services in the DI container
 */
export function registerTabServices(container: Container): void {
	console.log('[DI] Registering tab services...');

	// Bind TabParser with factory that includes all steps
	container
		.bind(TYPES.TabParser)
		.toDynamicValue(() => createTabParser())
		.inSingletonScope();

	// Bind TabState
	container.bind(TYPES.TabState).to(TabState).inSingletonScope();

	// Bind tab viewer services
	console.log('[DI] Binding ITabContentProcessor...');
	container.bind<ITabContentProcessor>(TYPES.ITabContentProcessor).to(TabContentProcessor).inSingletonScope();
	console.log('[DI] ITabContentProcessor bound successfully');

	container.bind<IChordDictionaryService>(TYPES.IChordDictionaryService).to(ChordDictionaryService).inSingletonScope();
	container.bind<IResponsiveFontCalculator>(TYPES.IResponsiveFontCalculator).to(ResponsiveFontCalculator).inSingletonScope();

	// Bind import services
	container.bind<IUrlImportService>(TYPES.IUrlImportService).to(UrlImportService).inSingletonScope();
	container.bind<ISmartImportService>(TYPES.ISmartImportService).to(SmartImportService).inSingletonScope();

	console.log('[DI] Tab services registered successfully');
}
