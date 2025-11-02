import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { UIState } from '../state/ui.svelte';
import { UserState } from '../state/user.svelte';
import { PersistenceManager } from '../state/persistence.svelte';

// Export state
export { UIState } from '../state/ui.svelte';
export { UserState } from '../state/user.svelte';
export { PersistenceManager } from '../state/persistence.svelte';

// Export types
export type { UserPreferences, UserProfile } from '../state/user.svelte';

/**
 * Register all shared services in the DI container
 */
export function registerSharedServices(container: Container): void {
	// Bind state - order matters because PersistenceManager depends on all states
	container.bind(TYPES.UIState).to(UIState).inSingletonScope();
	container.bind(TYPES.UserState).to(UserState).inSingletonScope();
	container.bind(TYPES.PersistenceManager).to(PersistenceManager).inSingletonScope();
}
