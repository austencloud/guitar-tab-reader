export interface Tab {
	id: string;
	title: string;
	content: string;
	artist?: string;
	album?: string;
	createdAt: number;
	updatedAt?: number;
}

const STORAGE_KEY = 'tabscroll-tabs';

function loadFromStorage(): Tab[] {
	if (typeof localStorage === 'undefined') {
		return [];
	}

	try {
		const storedTabs = localStorage.getItem(STORAGE_KEY);
		return storedTabs ? JSON.parse(storedTabs) : [];
	} catch (error) {
		console.error('Failed to load tabs from localStorage:', error);
		return [];
	}
}

function saveToStorage(tabs: Tab[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
	}
}

// Modern Svelte 5 runes-based tabs state
class TabsState {
	#tabs = $state<Tab[]>(loadFromStorage());

	get tabs(): Tab[] {
		return this.#tabs;
	}

	add(tab: Omit<Tab, 'id' | 'createdAt'>): string {
		const newTab: Tab = {
			...tab,
			id: crypto.randomUUID(),
			createdAt: Date.now()
		};

		this.#tabs = [...this.#tabs, newTab];
		saveToStorage(this.#tabs);
		return newTab.id;
	}

	update(id: string, updatedTab: Partial<Omit<Tab, 'id' | 'createdAt'>>): void {
		this.#tabs = this.#tabs.map((tab) =>
			tab.id === id ? { ...tab, ...updatedTab, updatedAt: Date.now() } : tab
		);
		saveToStorage(this.#tabs);
	}

	delete(id: string): void {
		this.#tabs = this.#tabs.filter((tab) => tab.id !== id);
		saveToStorage(this.#tabs);
	}

	reset(): void {
		this.#tabs = [];
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	getById(id: string): Tab | undefined {
		return this.#tabs.find((tab) => tab.id === id);
	}
}

// Export singleton instance
export const tabs = new TabsState();
