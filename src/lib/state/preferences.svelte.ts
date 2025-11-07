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

function loadPreferences(): UserPreferences {
	if (!browser) return defaultPreferences;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : defaultPreferences;
	} catch {
		return defaultPreferences;
	}
}

function savePreferences(prefs: UserPreferences): void {
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
	}
}

// Modern Svelte 5 runes-based preferences state
class PreferencesState {
	#isLeftHanded = $state(loadPreferences().isLeftHanded);
	#fontSize = $state(loadPreferences().fontSize);
	#showChordDiagrams = $state(loadPreferences().showChordDiagrams);

	get isLeftHanded(): boolean {
		return this.#isLeftHanded;
	}

	get fontSize(): number {
		return this.#fontSize;
	}

	get showChordDiagrams(): boolean {
		return this.#showChordDiagrams;
	}

	setLeftHanded(value: boolean): void {
		this.#isLeftHanded = value;
		this.#save();
	}

	setFontSize(value: number): void {
		this.#fontSize = value;
		this.#save();
	}

	setShowChordDiagrams(value: boolean): void {
		this.#showChordDiagrams = value;
		this.#save();
	}

	#save(): void {
		savePreferences({
			isLeftHanded: this.#isLeftHanded,
			fontSize: this.#fontSize,
			showChordDiagrams: this.#showChordDiagrams
		});
	}
}

// Export singleton instance
export const preferences = new PreferencesState();
export default preferences;
