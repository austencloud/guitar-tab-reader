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
declare let container: Container;
export { container };
/**
 * Initialize the DI container with all service bindings
 * This should be called once during application bootstrap
 *
 * HMR Note: This function will be called again on HMR updates, but the
 * container instance is preserved. Service bindings are only registered
 * if they haven't been registered yet.
 */
export declare function initializeContainer(): Promise<void>;
/**
 * Helper function to resolve a service from the container
 */
export declare function getService<T>(serviceIdentifier: symbol): T;
/**
 * Helper function to check if a service is bound
 */
export declare function hasService(serviceIdentifier: symbol): boolean;
