import 'reflect-metadata';
import { Container } from 'inversify';

/**
 * Global DI container instance
 * This container is configured and initialized at application startup
 *
 * HMR Note: The container instance is preserved across HMR updates using
 * import.meta.hot.data. This prevents unnecessary full reloads when only
 * component files change. However, changes to service implementations will
 * still trigger full reloads as InversifyJS doesn't support hot-swapping
 * singleton instances.
 */
let container: Container;

// Preserve container across HMR updates
if (import.meta.hot?.data.container) {
	container = import.meta.hot.data.container;
	console.log('♻️ HMR: Reusing existing DI container');
} else {
	container = new Container({
		defaultScope: 'Singleton'
	});
	console.log('🆕 Creating new DI container');
}

// Store container for next HMR update
if (import.meta.hot) {
	import.meta.hot.data.container = container;
}

export { container };

/**
 * Initialize the DI container with all service bindings
 * This should be called once during application bootstrap
 *
 * HMR Note: This function will be called again on HMR updates, but the
 * container instance is preserved. Service bindings are only registered
 * if they haven't been registered yet.
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

	// Register all services (registration functions are idempotent)
	registerTabServices(container);
	registerTunerServices(container);
	registerPracticeServices(container);
	registerSharedServices(container);
	registerSessionServices(container);
}

// Accept HMR updates for this module
if (import.meta.hot) {
	import.meta.hot.accept((newModule) => {
		console.log('♻️ HMR: DI container module updated');
		// Container instance is preserved via import.meta.hot.data
		// No action needed here as the container is already in use
	});
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
