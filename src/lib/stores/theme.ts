import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tabscroll-theme';

// Get system theme preference
function getSystemTheme(): ResolvedTheme {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Load theme from localStorage or default to system
function loadThemeMode(): ThemeMode {
	if (!browser) return 'system';

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			return stored as ThemeMode;
		}
	} catch {
		// localStorage not available or error
	}

	// Default to system preference
	return 'system';
}

// Resolve theme mode to actual theme
function resolveTheme(mode: ThemeMode): ResolvedTheme {
	if (mode === 'system') {
		return getSystemTheme();
	}
	return mode;
}

// Apply theme to document
function applyTheme(theme: ResolvedTheme) {
	if (!browser) return;

	const root = document.documentElement;

	// Remove existing theme classes
	root.classList.remove('light', 'dark');

	// Add new theme class
	root.classList.add(theme);

	// Set data attribute for CSS targeting
	root.setAttribute('data-theme', theme);

	// Update meta theme-color for mobile browsers
	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#4caf50');
	}
}

// Save theme mode to localStorage
function saveThemeMode(mode: ThemeMode) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// localStorage not available
	}
}

// Modern Svelte 5 runes-based theme state
class ThemeState {
	#mode = $state<ThemeMode>(loadThemeMode());
	#resolvedTheme = $state<ResolvedTheme>(resolveTheme(loadThemeMode()));

	constructor() {
		// Listen for system theme changes
		if (browser) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', () => {
				if (this.#mode === 'system') {
					this.#resolvedTheme = getSystemTheme();
					applyTheme(this.#resolvedTheme);
				}
			});

			// Apply initial theme
			$effect(() => {
				applyTheme(this.#resolvedTheme);
			});
		}
	}

	get mode(): ThemeMode {
		return this.#mode;
	}

	get resolvedTheme(): ResolvedTheme {
		return this.#resolvedTheme;
	}

	setMode(mode: ThemeMode): void {
		this.#mode = mode;
		this.#resolvedTheme = resolveTheme(mode);
		saveThemeMode(mode);
		applyTheme(this.#resolvedTheme);
	}

	setLight(): void {
		this.setMode('light');
	}

	setDark(): void {
		this.setMode('dark');
	}

	setSystem(): void {
		this.setMode('system');
	}

	toggle(): void {
		if (this.#mode === 'system') {
			// If system, override with opposite of current resolved theme
			this.setMode(this.#resolvedTheme === 'dark' ? 'light' : 'dark');
		} else {
			// If manual mode, toggle between light and dark
			this.setMode(this.#mode === 'dark' ? 'light' : 'dark');
		}
	}
}

// Export singleton instance
export const theme = new ThemeState();

// Initialize theme on import
if (browser) {
	// Ensure theme is applied on page load
	requestAnimationFrame(() => {
		applyTheme(theme.resolvedTheme);
	});
}
