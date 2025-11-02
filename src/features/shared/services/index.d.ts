import { Container } from 'inversify';
export { UIState } from '../state/ui.svelte';
export { UserState } from '../state/user.svelte';
export { PersistenceManager } from '../state/persistence.svelte';
export type { UserPreferences, UserProfile } from '../state/user.svelte';
/**
 * Register all shared services in the DI container
 */
export declare function registerSharedServices(container: Container): void;
