/**
 * Core dependency injection module
 * Exports container, service types, and helper functions
 */

export { container, initializeContainer, getService, hasService } from './container';
export { TYPES } from './types';
export type { ServiceType } from './types';
