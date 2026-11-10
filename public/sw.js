// Minimal service worker: makes the site installable (PWA / APK). It does not cache pages, so updates are always instant.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
