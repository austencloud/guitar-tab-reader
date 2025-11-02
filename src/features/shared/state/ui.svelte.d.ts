/**
 * UI state management using Svelte 5 runes
 * Manages modal states, tooltips, loading states, and error handling
 */
export declare class UIState {
    settingsModalOpen: boolean;
    chordEditorModalOpen: boolean;
    importModalOpen: boolean;
    tunerModalOpen: boolean;
    tooltipVisible: boolean;
    tooltipX: number;
    tooltipY: number;
    tooltipContent: any;
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    errorDetails: any;
    notifications: {
        id: string;
        type: "success" | "error" | "warning" | "info";
        message: string;
        timeout?: number;
    }[];
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    hasActiveModal: () => boolean;
    hasError: () => boolean;
    hasNotifications: () => boolean;
    openModal(modalType: 'settings' | 'chordEditor' | 'import' | 'tuner'): void;
    closeAllModals(): void;
    closeModal(modalType?: 'settings' | 'chordEditor' | 'import' | 'tuner'): void;
    showTooltip(x: number, y: number, content: any): void;
    hideTooltip(): void;
    setLoading(loading: boolean, message?: string): void;
    setError(error: string | null, details?: any): void;
    clearError(): void;
    addNotification(type: 'success' | 'error' | 'warning' | 'info', message: string, timeout?: number): `${string}-${string}-${string}-${string}-${string}`;
    removeNotification(id: string): void;
    clearAllNotifications(): void;
    toggleSidebar(): void;
    closeSidebar(): void;
    toggleMobileMenu(): void;
    closeMobileMenu(): void;
    reset(): void;
}
