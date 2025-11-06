import 'reflect-metadata';
import { Container } from 'inversify';

/**
 * Global DI container instance
 * This container is configured and initialized at application startup
 */
export const container = new Container({
	defaultScope: 'Singleton'
});

/**
 * Initialize the DI container with all service bindings
 * This should be called once during application bootstrap
 */
export async function initializeContainer(): Promise<void> {
	// Feature modules will register their services here
	// This keeps the container configuration modular

	// Import and register feature modules
	const { registerTabServices } = await import('$features/tabs/services');
	const { registerTunerServices } = await import('$features/tuner/services');
	const { registerPracticeServices } = await import('$features/practice/services');
	const { registerSharedServices } = await import('$features/shared/services');
	const { registerSessionServices } = await import('$features/sessions/services/registration');

	// Register all services
	registerTabServices(container);
	registerTunerServices(container);
	registerPracticeServices(container);
	registerSharedServices(container);
	registerSessionServices(container);
}

/**
 * Helper function to resolve a service from the container
 */
export function getService<T>(serviceIdentifier: symbol): T {
	return container.get<T>(serviceIdentifier);
}

/**
 * Helper function to check if a service is bound
 */
export function hasService(serviceIdentifier: symbol): boolean {
	return container.isBound(serviceIdentifier);
}
