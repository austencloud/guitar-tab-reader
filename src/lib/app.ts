/**
 * Application initialization
 * Sets up the DI container and initializes application state
 */

import 'reflect-metadata';
import { initializeContainer, getService } from '$core/di';
import { TYPES } from '$core/di';
import type { PersistenceManager } from '$features/shared/services';

let initialized = false;

/**
 * Initialize the application
 * Must be called once during app bootstrap (in root layout)
 */
export async function initializeApp(): Promise<void> {
	if (initialized) return;

	try {
		// Initialize DI container with all service bindings
		await initializeContainer();

		// Get the persistence manager and initialize it
		const persistenceManager = getService<PersistenceManager>(TYPES.PersistenceManager);
		await persistenceManager.initialize();

		initialized = true;
		console.log('✅ Application initialized successfully');
	} catch (error) {
		console.error('❌ Failed to initialize application:', error);
		throw error;
	}
}

/**
 * Check if the application has been initialized
 */
export function isAppInitialized(): boolean {
	return initialized;
}
