import type { Container } from 'inversify';
/**
 * Register all session-related services with the DI container
 * Now using refactored, focused services instead of monolithic SessionManagerService
 */
export declare function registerSessionServices(container: Container): void;
