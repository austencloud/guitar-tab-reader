import { Container } from 'inversify';
export * from './types';
export type { IAudioProcessor } from './contracts/IAudioProcessor';
export type { IPitchDetector } from './contracts/IPitchDetector';
export { AudioProcessorService } from './implementations/AudioProcessorService';
export { PitchDetectorService } from './implementations/PitchDetectorService';
export * from './TuningDefinitions';
/**
 * Register all tuner-related services in the DI container
 */
export declare function registerTunerServices(container: Container): void;
