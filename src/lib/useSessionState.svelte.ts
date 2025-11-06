import { getService } from '$core/di/container';
import { TYPES } from '$core/di/types';
import type { SessionState } from '$features/sessions/state/session.svelte';

/**
 * Hook to access SessionState in Svelte components
 * Returns a singleton instance from the DI container
 */
export function useSessionState(): SessionState {
	return getService<SessionState>(TYPES.SessionState);
}
