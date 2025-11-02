import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { AudioState } from '../state/audio.svelte';
import { PracticeState } from '../state/practice.svelte';

// Export state
export { AudioState } from '../state/audio.svelte';
export { PracticeState } from '../state/practice.svelte';

// Export types
export type { AudioFeatures, Timestamp, PracticeSession } from '../state/audio.svelte';
export type {
	PracticeGoal,
	PracticeStats,
	PracticeNote,
	PracticeDifficulty
} from '../state/practice.svelte';

/**
 * Register all practice-related services in the DI container
 */
export function registerPracticeServices(container: Container): void {
	// Bind state
	container.bind(TYPES.AudioState).to(AudioState).inSingletonScope();
	container.bind(TYPES.PracticeState).to(PracticeState).inSingletonScope();
}
