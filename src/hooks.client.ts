// Register service worker for PWA functionality
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((registration) => {
				console.log('ServiceWorker registration successful with scope:', registration.scope);
			})
			.catch((error) => {
				console.error('ServiceWorker registration failed:', error);
			});
	});
}

export {};
