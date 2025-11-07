import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { AudioProcessorService } from './implementations/AudioProcessorService';
import { PitchDetectorService } from './implementations/PitchDetectorService';

// Export types
export * from './types';

// Export contracts
export type { IAudioProcessor } from './contracts/IAudioProcessor';
export type { IPitchDetector } from './contracts/IPitchDetector';

// Export implementations
export { AudioProcessorService } from './implementations/AudioProcessorService';
export { PitchDetectorService } from './implementations/PitchDetectorService';

// Export tuning definitions
export * from './TuningDefinitions.svelte';

// Export signal processing utilities
export * from './SignalProcessor';

// Export calibration settings
export * from './CalibrationSettings.svelte';

/**
 * Register all tuner-related services in the DI container
 */
export function registerTunerServices(container: Container): void {
	container.bind(TYPES.PitchDetector).to(PitchDetectorService).inSingletonScope();
	container.bind(TYPES.AudioProcessor).to(AudioProcessorService).inSingletonScope();
}
