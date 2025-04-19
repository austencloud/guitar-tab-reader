import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface UserPreferences {
	isLeftHanded: boolean;
	fontSize: number;
	showChordDiagrams: boolean;
}

const STORAGE_KEY = 'tabscroll-preferences';

const defaultPreferences: UserPreferences = {
	isLeftHanded: false,
	fontSize: 14,
	showChordDiagrams: true
};

const loadPreferences = (): UserPreferences => {
	if (!browser) return defaultPreferences;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : defaultPreferences;
	} catch {
		return defaultPreferences;
	}
};

const preferences = writable<UserPreferences>(loadPreferences());

preferences.subscribe((value) => {
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	}
});

export default {
	subscribe: preferences.subscribe,
	setLeftHanded: (isLeftHanded: boolean) =>
		preferences.update((prefs) => ({ ...prefs, isLeftHanded })),
	setFontSize: (fontSize: number) => preferences.update((prefs) => ({ ...prefs, fontSize })),
	setShowChordDiagrams: (showChordDiagrams: boolean) =>
		preferences.update((prefs) => ({ ...prefs, showChordDiagrams }))
};
