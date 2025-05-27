import { writable } from 'svelte/store';

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

function createTabsStore() {
	// Initialize store with data from localStorage or empty array
	const initialTabs = loadFromStorage();
	const { subscribe, set, update } = writable<Tab[]>(initialTabs);

	return {
		subscribe,
		add: (tab: Omit<Tab, 'id' | 'createdAt'>) => {
			const newTab: Tab = {
				...tab,
				id: crypto.randomUUID(),
				createdAt: Date.now()
			};

			update((tabs) => {
				const updatedTabs = [...tabs, newTab];
				saveToStorage(updatedTabs);
				return updatedTabs;
			});

			return newTab.id;
		},
		update: (id: string, updatedTab: Partial<Omit<Tab, 'id' | 'createdAt'>>) => {
			update((tabs) => {
				const updatedTabs = tabs.map((tab) => (tab.id === id ? { ...tab, ...updatedTab } : tab));
				saveToStorage(updatedTabs);
				return updatedTabs;
			});
		},
		delete: (id: string) => {
			update((tabs) => {
				const updatedTabs = tabs.filter((tab) => tab.id !== id);
				saveToStorage(updatedTabs);
				return updatedTabs;
			});
		},
		reset: () => {
			set([]);
			localStorage.removeItem(STORAGE_KEY);
		}
	};
}

function saveToStorage(tabs: Tab[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
	}
}

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

export const tabs = createTabsStore();
