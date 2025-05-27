const CACHE_NAME = 'tabscroll-cache-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.png'];

const TAB_DATA_CACHE = 'tabscroll-data-v1';

// Install event - cache app shell
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(APP_SHELL))
			.then(() => self.skipWaiting()) // Ensure new service worker activates immediately
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	const currentCaches = [CACHE_NAME, TAB_DATA_CACHE];
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
			})
			.then((cachesToDelete) => {
				return Promise.all(
					cachesToDelete.map((cacheToDelete) => {
						return caches.delete(cacheToDelete);
					})
				);
			})
			.then(() => self.clients.claim()) // Take control of clients immediately
	);
});

// Fetch event - network-first strategy for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
	// Special handling for tab data API requests
	if (event.request.url.includes('/api/tabs')) {
		return event.respondWith(
			fetch(event.request)
				.then((response) => {
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(TAB_DATA_CACHE).then((cache) => cache.put(event.request, responseToCache));
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache if network fails
					return caches.match(event.request);
				})
		);
	}

	// Standard cache strategy for other requests
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((response) => {
					// Don't cache non-successful responses or non-GET requests
					if (!response || response.status !== 200 || event.request.method !== 'GET') {
						return response;
					}

					// Clone the response
					const responseToCache = response.clone();

					// Determine which cache to use
					const cacheKey = APP_SHELL.includes(new URL(event.request.url).pathname)
						? CACHE_NAME
						: TAB_DATA_CACHE;

					caches.open(cacheKey).then((cache) => cache.put(event.request, responseToCache));

					return response;
				})
				.catch(() => {
					// For HTML navigation, return the offline page
					if (event.request.mode === 'navigate') {
						return caches.match('/');
					}

					return new Response('Network error', {
						status: 408,
						headers: new Headers({ 'Content-Type': 'text/plain' })
					});
				});
		})
	);
});

// Handle sync events for offline data
self.addEventListener('sync', (event) => {
	if (event.tag === 'sync-tabs') {
		event.waitUntil(syncTabs());
	}
});

// Function to sync tabs when back online
async function syncTabs() {
	// Implementation would go here
	// This would read from IndexedDB and sync with server
}

// Make the PWA installable on Safari by handling beforeinstallprompt
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
