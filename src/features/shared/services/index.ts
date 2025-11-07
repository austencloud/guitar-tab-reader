import { Container } from 'inversify';
import { TYPES } from '$core/di';
import { UIState } from '../state/ui.svelte';
import { UserState } from '../state/user.svelte';
import { LayoutState } from '../state/layout.svelte';
import { PersistenceManager } from '../state/persistence.svelte';
import { ModalOrchestrator } from './ModalOrchestrator';
import { ScrollBehaviorService } from './ScrollBehaviorService';
import { NavigationCoordinator } from './NavigationCoordinator';
import { ContextManager } from './ContextManager';

// Export state
export { UIState } from '../state/ui.svelte';
export { UserState } from '../state/user.svelte';
export { LayoutState } from '../state/layout.svelte';
export { PersistenceManager } from '../state/persistence.svelte';

// Export services
export { ModalOrchestrator } from './ModalOrchestrator';
export { ScrollBehaviorService } from './ScrollBehaviorService';
export { NavigationCoordinator } from './NavigationCoordinator';
export { ContextManager } from './ContextManager';

// Export types
export type { UserPreferences, UserProfile } from '../state/user.svelte';

/**
 * Register all shared services in the DI container
 */
export function registerSharedServices(container: Container): void {
	// Bind state - order matters because services depend on state
	container.bind(TYPES.UIState).to(UIState).inSingletonScope();
	container.bind(TYPES.UserState).to(UserState).inSingletonScope();
	container.bind(TYPES.LayoutState).to(LayoutState).inSingletonScope();
	container.bind(TYPES.PersistenceManager).to(PersistenceManager).inSingletonScope();

	// Bind layout services
	container.bind(TYPES.ModalOrchestrator).to(ModalOrchestrator).inSingletonScope();
	container.bind(TYPES.ScrollBehaviorService).to(ScrollBehaviorService).inSingletonScope();
	container.bind(TYPES.NavigationCoordinator).to(NavigationCoordinator).inSingletonScope();
	container.bind(TYPES.ContextManager).to(ContextManager).inSingletonScope();
}
