import { Container } from 'inversify';
export { AudioState } from '../state/audio.svelte';
export { PracticeState } from '../state/practice.svelte';
export type { AudioFeatures, Timestamp, PracticeSession } from '../state/audio.svelte';
export type { PracticeGoal, PracticeStats, PracticeNote, PracticeDifficulty } from '../state/practice.svelte';
/**
 * Register all practice-related services in the DI container
 */
export declare function registerPracticeServices(container: Container): void;
