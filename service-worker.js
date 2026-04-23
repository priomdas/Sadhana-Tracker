const CACHE_NAME = 'sadhana-tracker-v3';
const ASSETS = [
    './',
    './index.html',
    './firebase-config.js',
    './libs/chart.min.js',
    './libs/lucide.min.js',
    './libs/xlsx.full.min.js',
    './fonts/outfit.css',
    './fonts/outfit-300.ttf',
    './fonts/outfit-400.ttf',
    './fonts/outfit-500.ttf',
    './fonts/outfit-600.ttf',
    './fonts/outfit-700.ttf',
    './fonts/outfit-800.ttf',
    './fonts/outfit-900.ttf',
    './manifest.json'
];

// Install — cache all core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching core assets');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — network-first for navigations, cache-first for assets
// IMPORTANT: Skip blob: URLs (used by XLSX.writeFile for downloads)
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Don't intercept blob: URLs or non-GET requests
    if (url.startsWith('blob:') || event.request.method !== 'GET') {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
