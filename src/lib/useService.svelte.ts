/**
 * Svelte utility for accessing DI container services
 * Provides a clean way to inject services into components
 */

import { getService } from '$core/di';

/**
 * Get a service from the DI container
 * Use this in Svelte components to access injectable services
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { TYPES } from '$core/di';
 * import { useService } from '$lib/useService.svelte';
 * import type { UIState } from '$features/shared/services';
 *
 * const uiState = useService<UIState>(TYPES.UIState);
 * </script>
 * ```
 */
export function useService<T>(serviceIdentifier: symbol): T {
	return getService<T>(serviceIdentifier);
}
