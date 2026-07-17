// Bump this string on every deploy that changes index.html/manifest/icons.
// The browser only re-runs the SW install step (which refetches ASSETS and
// clears old caches) when sw.js itself changes byte-for-byte — if this
// string stays the same, an already-installed PWA keeps serving the old
// cached index.html forever via the cache-first fetch handler below, no
// matter what ships. This was very likely masking earlier iOS PWA fixes.
const CACHE = 'tabata-v8';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ASSETS))
    );
    // Deliberately NOT calling self.skipWaiting() here: a newly-installed SW
    // must stay in the 'waiting' state until the page explicitly confirms
    // the update (see the 'message' listener below). That's what lets the
    // page show a non-blocking "update available" banner instead of forcing
    // an update mid-workout.
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', e => {
    if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
    // Cache-first for same-origin requests
    if (e.request.url.startsWith(self.location.origin)) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                });
            })
        );
    }
});
