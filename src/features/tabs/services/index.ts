import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { TabParserService } from './implementations/TabParserService';
import { createTabParser } from './implementations/TabParserFactory';
import { TabState } from '../state/tab.svelte';
import { UrlImportService, SmartImportService } from '../modules/import/services/implementations';
import type { IUrlImportService, ISmartImportService } from '../modules/import/services/contracts';

// Export types
export * from './types';

// Export contracts
export type { ITabParser } from './contracts/ITabParser';

// Export implementations
export { TabParserService } from './implementations/TabParserService';
export { createTabParser } from './implementations/TabParserFactory';

// Export parser steps
export { PreprocessStep } from './implementations/steps/PreprocessStep';
export { StringCountDetectionStep } from './implementations/steps/StringCountDetectionStep';
export { TuningDetectionStep } from './implementations/steps/TuningDetectionStep';
export { SectionDetectionStep } from './implementations/steps/SectionDetectionStep';
export { NoteParsingStep } from './implementations/steps/NoteParsingStep';
export { ChordDetectionStep } from './implementations/steps/ChordDetectionStep';

// Export state
export { TabState } from '../state/tab.svelte';

/**
 * Register all tab-related services in the DI container
 */
export function registerTabServices(container: Container): void {
	// Bind TabParser with factory that includes all steps
	container
		.bind(TYPES.TabParser)
		.toDynamicValue(() => createTabParser())
		.inSingletonScope();

	// Bind TabState
	container.bind(TYPES.TabState).to(TabState).inSingletonScope();

	// Bind import services
	container.bind<IUrlImportService>(TYPES.IUrlImportService).to(UrlImportService).inSingletonScope();
	container.bind<ISmartImportService>(TYPES.ISmartImportService).to(SmartImportService).inSingletonScope();
}
