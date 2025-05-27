import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
	mode: ThemeMode;
	resolvedTheme: ResolvedTheme;
}

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

// Initialize theme state using writable store for now
const initialMode = loadThemeMode();
const themeState = writable<ThemeState>({
	mode: initialMode,
	resolvedTheme: resolveTheme(initialMode)
});

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

// Listen for system theme changes
if (browser) {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		themeState.update((state) => {
			if (state.mode === 'system') {
				const newResolvedTheme = getSystemTheme();
				applyTheme(newResolvedTheme);
				return { ...state, resolvedTheme: newResolvedTheme };
			}
			return state;
		});
	});

	// Apply initial theme
	themeState.subscribe((state) => {
		applyTheme(state.resolvedTheme);
	});
}

// Theme store interface
export const theme = {
	// Subscribe method for reactivity
	subscribe: themeState.subscribe,

	// Actions
	setMode(mode: ThemeMode) {
		const newResolvedTheme = resolveTheme(mode);
		themeState.set({
			mode,
			resolvedTheme: newResolvedTheme
		});
		saveThemeMode(mode);
		applyTheme(newResolvedTheme);
	},

	setLight() {
		this.setMode('light');
	},

	setDark() {
		this.setMode('dark');
	},

	setSystem() {
		this.setMode('system');
	},

	toggle() {
		// Get current state to determine toggle behavior
		let currentState: ThemeState;
		themeState.subscribe((state) => (currentState = state))();

		if (currentState!.mode === 'system') {
			// If system, override with opposite of current resolved theme
			this.setMode(currentState!.resolvedTheme === 'dark' ? 'light' : 'dark');
		} else {
			// If manual mode, toggle between light and dark
			this.setMode(currentState!.mode === 'dark' ? 'light' : 'dark');
		}
	}
};

// Initialize theme on import
if (browser) {
	// Ensure theme is applied on page load
	let initialState: ThemeState;
	themeState.subscribe((state) => (initialState = state))();
	requestAnimationFrame(() => {
		applyTheme(initialState!.resolvedTheme);
	});
}
