const CACHE_NAME = 'petbhai-cache-v3'; // Incremented version
const STATIC_CACHE = 'petbhai-static-v3';
const DYNAMIC_CACHE = 'petbhai-dynamic-v1';
const IMAGE_CACHE = 'petbhai-images-v1';

const urlsToCache = ['/', '/index.html', '/manifest.json'];

// Cache size limits
const DYNAMIC_CACHE_LIMIT = 50;
const IMAGE_CACHE_LIMIT = 100;

// Trim cache to limit
const trimCache = (cacheName, maxItems) => {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Navigation requests: Network first, fall back to cache (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
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

  // Image requests: Cache first with network fallback
  if (
    event.request.destination === 'image' ||
    requestUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache);
                trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT);
              }
            });
            return networkResponse;
          })
          .catch(() => {
            // Return a placeholder image for offline
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f1f5f9" width="200" height="200"/><text fill="#94a3b8" font-family="sans-serif" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
      })
    );
    return;
  }

  // Static Assets (JS, CSS): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            // Ensure we don't cache unsupported schemes (like chrome-extension://)
            if (event.request.url.startsWith('http')) {
              cache.put(event.request, responseToCache);
              trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
            }
          });
          return networkResponse;
        })
        .catch((err) => {
          // Network failed, do nothing (we likely returned cachedResponse)
          console.log('Network fetch failed for', event.request.url);
        });

      return cachedResponse || fetchPromise;
    })
  );
});
