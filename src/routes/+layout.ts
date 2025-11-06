// Disable SSR for the root layout
// This is necessary because:
// 1. The app heavily relies on browser APIs (IndexedDB, WebRTC)
// 2. Session state needs to be initialized before first render to avoid hydration mismatches
// 3. This is a PWA-first application designed for client-side usage
export const ssr = false;
