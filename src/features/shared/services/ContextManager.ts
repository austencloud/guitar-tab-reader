import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';
import type { ModalOrchestrator } from './ModalOrchestrator';
import type { ScrollBehaviorService } from './ScrollBehaviorService';
import type { LayoutState } from '../state/layout.svelte';

/**
 * Context manager service
 * Creates and manages Svelte context objects for child components
 * 
 * Extracted from +layout.svelte to separate context management
 */
@injectable()
export class ContextManager {
	constructor(
		@inject(TYPES.ModalOrchestrator) private modalOrchestrator: ModalOrchestrator,
		@inject(TYPES.ScrollBehaviorService) private scrollBehavior: ScrollBehaviorService,
		@inject(TYPES.LayoutState) private layoutState: LayoutState
	) {}

	/**
	 * Create tuner context for child components
	 */
	createTunerContext() {
		return {
			open: () => this.modalOrchestrator.openTuner(),
			close: () => this.modalOrchestrator.closeTuner(),
			toggle: () => this.modalOrchestrator.toggleTuner()
		};
	}

	/**
	 * Create scroll visibility context for child routes
	 * Returns a function instead of a getter to ensure proper reactive tracking in Svelte 5
	 */
	createScrollVisibilityContext() {
		const layoutState = this.layoutState;
		const scrollBehavior = this.scrollBehavior;

		return {
			// Return a function so it's called in the child's reactive context
			getVisible: (): boolean => {
				return layoutState.isHeaderVisible;
			},
			hide: () => scrollBehavior.forceHideHeader(),
			show: () => scrollBehavior.forceShowHeader(),
			handleContainerScroll: (scrollTop: number, lastScroll: number) => {
				scrollBehavior.handleContainerScroll(scrollTop, lastScroll);
			}
		};
	}

	/**
	 * Create navigation context for child components
	 */
	createNavigationContext() {
		return {
			openAddTab: () => this.modalOrchestrator.openAddTab(),
			openSettings: () => this.modalOrchestrator.openSettings(),
			openTuner: () => this.modalOrchestrator.openTuner(),
			openSessions: () => this.modalOrchestrator.openSessions()
		};
	}
}

