import { Container } from 'inversify';
export { UIState } from '../state/ui.svelte';
export { UserState } from '../state/user.svelte';
export { LayoutState } from '../state/layout.svelte';
export { PersistenceManager } from '../state/persistence.svelte';
export { ModalOrchestrator } from './ModalOrchestrator';
export { ScrollBehaviorService } from './ScrollBehaviorService';
export { NavigationCoordinator } from './NavigationCoordinator';
export { ContextManager } from './ContextManager';
export type { UserPreferences, UserProfile } from '../state/user.svelte';
/**
 * Register all shared services in the DI container
 */
export declare function registerSharedServices(container: Container): void;
