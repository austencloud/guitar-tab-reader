import { describe, it, expect, beforeEach } from 'vitest';
import { ContextManager } from './ContextManager';
import type { ModalOrchestrator } from './ModalOrchestrator';
import type { ScrollBehaviorService } from './ScrollBehaviorService';
import type { LayoutState } from '../state/layout.svelte';

// Mock ModalOrchestrator
class MockModalOrchestrator implements Partial<ModalOrchestrator> {
	tunerOpened = false;
	tunerClosed = false;
	tunerToggled = false;

	openTuner(): void {
		this.tunerOpened = true;
	}

	closeTuner(): void {
		this.tunerClosed = true;
	}

	toggleTuner(): void {
		this.tunerToggled = true;
	}
}

// Mock ScrollBehaviorService
class MockScrollBehaviorService implements Partial<ScrollBehaviorService> {
	headerHidden = false;
	headerShown = false;
	containerScrollHandled = false;

	forceHideHeader(): void {
		this.headerHidden = true;
	}

	forceShowHeader(): void {
		this.headerShown = true;
	}

	handleContainerScroll(scrollTop: number, lastScroll: number): void {
		this.containerScrollHandled = true;
	}
}

// Mock LayoutState
class MockLayoutState implements Partial<LayoutState> {
	isHeaderVisible = true;
}

describe('ContextManager', () => {
	let contextManager: ContextManager;
	let mockModalOrchestrator: MockModalOrchestrator;
	let mockScrollBehavior: MockScrollBehaviorService;
	let mockLayoutState: MockLayoutState;

	beforeEach(() => {
		mockModalOrchestrator = new MockModalOrchestrator();
		mockScrollBehavior = new MockScrollBehaviorService();
		mockLayoutState = new MockLayoutState();
		contextManager = new ContextManager(
			mockModalOrchestrator as unknown as ModalOrchestrator,
			mockScrollBehavior as unknown as ScrollBehaviorService,
			mockLayoutState as unknown as LayoutState
		);
	});

	describe('createTunerContext', () => {
		it('should create tuner context with open method', () => {
			const tunerContext = contextManager.createTunerContext();
			tunerContext.open();
			expect(mockModalOrchestrator.tunerOpened).toBe(true);
		});

		it('should create tuner context with close method', () => {
			const tunerContext = contextManager.createTunerContext();
			tunerContext.close();
			expect(mockModalOrchestrator.tunerClosed).toBe(true);
		});

		it('should create tuner context with toggle method', () => {
			const tunerContext = contextManager.createTunerContext();
			tunerContext.toggle();
			expect(mockModalOrchestrator.tunerToggled).toBe(true);
		});

		it('should create context that can be called multiple times', () => {
			const tunerContext = contextManager.createTunerContext();
			tunerContext.open();
			tunerContext.close();
			tunerContext.toggle();
			expect(mockModalOrchestrator.tunerOpened).toBe(true);
			expect(mockModalOrchestrator.tunerClosed).toBe(true);
			expect(mockModalOrchestrator.tunerToggled).toBe(true);
		});
	});

	describe('createScrollVisibilityContext', () => {
		it('should create scroll visibility context with getVisible function', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			expect(scrollContext.getVisible()).toBe(true);
		});

		it('should reflect layout state visibility changes', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			mockLayoutState.isHeaderVisible = false;
			expect(scrollContext.getVisible()).toBe(false);
		});

		it('should create context with hide method', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			scrollContext.hide();
			expect(mockScrollBehavior.headerHidden).toBe(true);
		});

		it('should create context with show method', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			scrollContext.show();
			expect(mockScrollBehavior.headerShown).toBe(true);
		});

		it('should create context with handleContainerScroll method', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			scrollContext.handleContainerScroll(100, 50);
			expect(mockScrollBehavior.containerScrollHandled).toBe(true);
		});

		it('should create context that can be called multiple times', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			scrollContext.hide();
			scrollContext.show();
			scrollContext.handleContainerScroll(100, 50);
			expect(mockScrollBehavior.headerHidden).toBe(true);
			expect(mockScrollBehavior.headerShown).toBe(true);
			expect(mockScrollBehavior.containerScrollHandled).toBe(true);
		});
	});

	describe('Context Isolation', () => {
		it('should create independent tuner contexts', () => {
			const context1 = contextManager.createTunerContext();
			const context2 = contextManager.createTunerContext();

			context1.open();
			expect(mockModalOrchestrator.tunerOpened).toBe(true);

			// Both contexts should work independently
			mockModalOrchestrator.tunerOpened = false;
			context2.open();
			expect(mockModalOrchestrator.tunerOpened).toBe(true);
		});

		it('should create independent scroll visibility contexts', () => {
			const context1 = contextManager.createScrollVisibilityContext();
			const context2 = contextManager.createScrollVisibilityContext();

			context1.hide();
			expect(mockScrollBehavior.headerHidden).toBe(true);

			// Both contexts should work independently
			mockScrollBehavior.headerHidden = false;
			context2.hide();
			expect(mockScrollBehavior.headerHidden).toBe(true);
		});
	});

	describe('Context Type Safety', () => {
		it('should return tuner context with correct interface', () => {
			const tunerContext = contextManager.createTunerContext();
			expect(typeof tunerContext.open).toBe('function');
			expect(typeof tunerContext.close).toBe('function');
			expect(typeof tunerContext.toggle).toBe('function');
		});

		it('should return scroll visibility context with correct interface', () => {
			const scrollContext = contextManager.createScrollVisibilityContext();
			expect(typeof scrollContext.getVisible).toBe('function');
			expect(typeof scrollContext.hide).toBe('function');
			expect(typeof scrollContext.show).toBe('function');
			expect(typeof scrollContext.handleContainerScroll).toBe('function');
		});
	});
});

