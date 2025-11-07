import type { ModalOrchestrator } from './ModalOrchestrator';
import type { ScrollBehaviorService } from './ScrollBehaviorService';
import type { LayoutState } from '../state/layout.svelte';
/**
 * Context manager service
 * Creates and manages Svelte context objects for child components
 *
 * Extracted from +layout.svelte to separate context management
 */
export declare class ContextManager {
    private modalOrchestrator;
    private scrollBehavior;
    private layoutState;
    constructor(modalOrchestrator: ModalOrchestrator, scrollBehavior: ScrollBehaviorService, layoutState: LayoutState);
    /**
     * Create tuner context for child components
     */
    createTunerContext(): {
        open: () => void;
        close: () => void;
        toggle: () => void;
    };
    /**
     * Create scroll visibility context for child routes
     * Returns a function instead of a getter to ensure proper reactive tracking in Svelte 5
     */
    createScrollVisibilityContext(): {
        getVisible: () => boolean;
        hide: () => void;
        show: () => void;
        handleContainerScroll: (scrollTop: number, lastScroll: number) => void;
    };
    /**
     * Create navigation context for child components
     */
    createNavigationContext(): {
        openAddTab: () => void;
        openSettings: () => void;
        openTuner: () => void;
        openSessions: () => void;
    };
}
