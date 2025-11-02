import { injectable } from 'inversify';

/**
 * UI state management using Svelte 5 runes
 * Manages modal states, tooltips, loading states, and error handling
 */
@injectable()
export class UIState {
	// Modal states
	settingsModalOpen = $state(false);
	chordEditorModalOpen = $state(false);
	importModalOpen = $state(false);
	tunerModalOpen = $state(false);

	// Tooltip state
	tooltipVisible = $state(false);
	tooltipX = $state(0);
	tooltipY = $state(0);
	tooltipContent = $state<any>(null);

	// Loading states
	isLoading = $state(false);
	loadingMessage = $state('');

	// Error handling
	error = $state<string | null>(null);
	errorDetails = $state<any>(null);

	// Notification system
	notifications = $state<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; timeout?: number }>>([]);

	// Sidebar and navigation
	sidebarOpen = $state(false);
	mobileMenuOpen = $state(false);

	// Derived UI state
	hasActiveModal = $derived(
		() => this.settingsModalOpen || this.chordEditorModalOpen || this.importModalOpen || this.tunerModalOpen
	);

	hasError = $derived(() => this.error !== null);
	hasNotifications = $derived(() => this.notifications.length > 0);

	// Modal actions
	openModal(modalType: 'settings' | 'chordEditor' | 'import' | 'tuner') {
		this.closeAllModals();
		switch (modalType) {
			case 'settings':
				this.settingsModalOpen = true;
				break;
			case 'chordEditor':
				this.chordEditorModalOpen = true;
				break;
			case 'import':
				this.importModalOpen = true;
				break;
			case 'tuner':
				this.tunerModalOpen = true;
				break;
		}
	}

	closeAllModals() {
		this.settingsModalOpen = false;
		this.chordEditorModalOpen = false;
		this.importModalOpen = false;
		this.tunerModalOpen = false;
	}

	closeModal(modalType?: 'settings' | 'chordEditor' | 'import' | 'tuner') {
		if (modalType) {
			switch (modalType) {
				case 'settings':
					this.settingsModalOpen = false;
					break;
				case 'chordEditor':
					this.chordEditorModalOpen = false;
					break;
				case 'import':
					this.importModalOpen = false;
					break;
				case 'tuner':
					this.tunerModalOpen = false;
					break;
			}
		} else {
			this.closeAllModals();
		}
	}

	// Tooltip actions
	showTooltip(x: number, y: number, content: any) {
		this.tooltipX = x;
		this.tooltipY = y;
		this.tooltipContent = content;
		this.tooltipVisible = true;
	}

	hideTooltip() {
		this.tooltipVisible = false;
		this.tooltipContent = null;
	}

	// Loading actions
	setLoading(loading: boolean, message = '') {
		this.isLoading = loading;
		this.loadingMessage = message;
	}

	// Error actions
	setError(error: string | null, details?: any) {
		this.error = error;
		this.errorDetails = details;
	}

	clearError() {
		this.error = null;
		this.errorDetails = null;
	}

	// Notification actions
	addNotification(type: 'success' | 'error' | 'warning' | 'info', message: string, timeout = 5000) {
		const id = crypto.randomUUID();
		const notification = { id, type, message, timeout };
		
		this.notifications.push(notification);

		// Auto-remove notification after timeout
		if (timeout > 0) {
			setTimeout(() => {
				this.removeNotification(id);
			}, timeout);
		}

		return id;
	}

	removeNotification(id: string) {
		this.notifications = this.notifications.filter(n => n.id !== id);
	}

	clearAllNotifications() {
		this.notifications = [];
	}

	// Navigation actions
	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}

	closeSidebar() {
		this.sidebarOpen = false;
	}

	toggleMobileMenu() {
		this.mobileMenuOpen = !this.mobileMenuOpen;
	}

	closeMobileMenu() {
		this.mobileMenuOpen = false;
	}

	// Utility actions
	reset() {
		this.closeAllModals();
		this.hideTooltip();
		this.setLoading(false);
		this.clearError();
		this.clearAllNotifications();
		this.closeSidebar();
		this.closeMobileMenu();
	}
}

// Note: UIState is now injectable - get instances from DI container
// Legacy singleton export removed - use getService(TYPES.UIState) instead
