const CACHE_NAME = 'petbhai-cache-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
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
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  if (event.request.url.includes('/api/')) {
      event.respondWith(fetch(event.request));
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(
           networkResponse => {
             if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
             }
             
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => {
                if (event.request.url.startsWith('http')) {
                    cache.put(event.request, responseToCache);
                }
             });
             return networkResponse;
           }
        ).catch(err => {
            console.log('Network fetch failed for', event.request.url);
        });

        return cachedResponse || fetchPromise;
      })
  );
});