const CACHE_NAME = 'petbhai-cache-v7'; // Incremented version
const STATIC_CACHE = 'petbhai-static-v7';
const DYNAMIC_CACHE = 'petbhai-dynamic-v4';
const API_CACHE = 'petbhai-api-v2';

// Critical assets to precache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json?v=20260215',
  '/icon-192x192.png?v=20260215',
  '/icon-512x512.png?v=20260215',
  '/landing-hero.webp?v=20260215',
  '/landing-hero-mobile.webp?v=20260215',
];

// Cache size limits
const DYNAMIC_CACHE_LIMIT = 200; // Consolidated images, fonts, and assets
const API_CACHE_LIMIT = 100;

// API cache TTL (5 minutes for most data)
const API_CACHE_TTL = 5 * 60 * 1000;

// Trim cache to limit (FIFO eviction)
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
};

// Check if cached response is still valid
const isCacheValid = (response, maxAge) => {
  if (!response) return false;
  const dateHeader = response.headers.get('sw-cache-time');
  if (!dateHeader) return true; // No timestamp, assume valid
  const cacheTime = parseInt(dateHeader, 10);
  return Date.now() - cacheTime < maxAge;
};

// Add timestamp to response for cache validation
const addCacheTimestamp = async (response) => {
  const cloned = response.clone();
  const headers = new Headers(cloned.headers);
  headers.append('sw-cache-time', Date.now().toString());
  const body = await cloned.blob();
  return new Response(body, {
    status: cloned.status,
    statusText: cloned.statusText,
    headers,
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('Service Worker: Precaching static assets');
      const cacheResults = await Promise.allSettled(urlsToCache.map((url) => cache.add(url)));
      const failedAssets = cacheResults
        .map((result, index) => ({ result, url: urlsToCache[index] }))
        .filter((item) => item.result.status === 'rejected')
        .map((item) => item.url);

      if (failedAssets.length > 0) {
        console.warn('Service Worker: Failed to precache some assets', failedAssets);
      }
    })
  );
  // Immediately take control
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Service Worker: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Navigation requests: Network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the navigation response
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Font requests: Cache first with long TTL
  if (
    requestUrl.hostname.includes('fonts.googleapis.com') ||
    requestUrl.hostname.includes('fonts.gstatic.com') ||
    requestUrl.pathname.match(/\.(woff2?|ttf|otf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(FONT_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // API requests: Network first with cache fallback for GET requests
  if (event.request.url.includes('/api/')) {
    // Skip caching for auth and order endpoints (sensitive data)
    if (
      event.request.url.includes('/api/auth') ||
      event.request.url.includes('/api/orders') ||
      event.request.url.includes('/api/csrf')
    ) {
      event.respondWith(fetch(event.request));
      return;
    }

    // Cache-then-network for product/article data with short TTL
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            const responseWithTimestamp = await addCacheTimestamp(networkResponse.clone());
            cache.put(event.request, responseWithTimestamp);
            trimCache(API_CACHE, API_CACHE_LIMIT);
          }
          return networkResponse;
        } catch {
          // Network failed, try cache
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse && isCacheValid(cachedResponse, API_CACHE_TTL)) {
            return cachedResponse;
          }
          // Return a basic error response
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Image requests: Cache first with network fallback
  if (
    event.request.destination === 'image' ||
    requestUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Background refresh for stale images
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(IMAGE_CACHE).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {});
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
            if (event.request.url.startsWith('http')) {
              cache.put(event.request, responseToCache);
              trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
            }
          });
          return networkResponse;
        })
        .catch(() => {
          console.log('Service Worker: Network fetch failed for', event.request.url);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync for failed requests (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(
      // Handle any queued requests here
      Promise.resolve()
    );
  }
});

// Push notifications handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from PetBhai',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title || 'PetBhai', options));
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
