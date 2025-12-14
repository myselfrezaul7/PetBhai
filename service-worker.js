const CACHE_NAME = 'petbhai-cache-v2'; // Incremented version
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }),
        self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Navigation requests: Network first, fall back to cache (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // API or Data requests: Network only (or specific strategy if needed)
  if (event.request.url.includes('/api/')) {
      event.respondWith(fetch(event.request));
      return;
  }

  // Static Assets (JS, CSS, Images): Stale-While-Revalidate
  // This strategy serves content from cache immediately, then updates the cache in the background.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(
           networkResponse => {
             // Check if we received a valid response
             if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
             }
             
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => {
                // Ensure we don't cache unsupported schemes (like chrome-extension://)
                if (event.request.url.startsWith('http')) {
                    cache.put(event.request, responseToCache);
                }
             });
             return networkResponse;
           }
        ).catch(err => {
            // Network failed, do nothing (we likely returned cachedResponse)
            console.log('Network fetch failed for', event.request.url);
        });

        return cachedResponse || fetchPromise;
      })
  );
});