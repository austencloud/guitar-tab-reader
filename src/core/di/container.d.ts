import 'reflect-metadata';
import { Container } from 'inversify';
/**
 * Global DI container instance
 * This container is configured and initialized at application startup
 */
export declare const container: Container;
/**
 * Initialize the DI container with all service bindings
 * This should be called once during application bootstrap
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
