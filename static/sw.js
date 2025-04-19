const CACHE_NAME = 'tabscroll-cache-v1';
const urlsToCache = ['/', '/manifest.webmanifest', '/favicon.png'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				return response;
			}
			return fetch(event.request).then((response) => {
				// Don't cache responses that aren't successful
				if (!response || response.status !== 200 || response.type !== 'basic') {
					return response;
				}

				// Clone the response since the response is a stream and can only be used once
				const responseToCache = response.clone();

				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return response;
			});
		})
	);
});
