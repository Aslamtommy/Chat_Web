const CACHE_NAME = 'arabic-jyothisham-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/index.css',
  '/home',
  '/files',
  '/notifications',
  '/offline.html',
];

const API_CACHE_NAME = 'arabic-jyothisham-api-cache-v1';
const apiEndpointsToCache = [
  `${import.meta.env.VITE_API_URL}/auth`,
  `${import.meta.env.VITE_API_URL}/admin`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith(`${import.meta.env.VITE_API_URL}/`)) {
    event.respondWith(
      networkFirst(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (requestUrl.pathname === '/' || requestUrl.pathname === '') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          const token = localStorage.getItem('token') || localStorage.getItem('adminToken'); // Fallback logic
          const checkEndpoint = token === localStorage.getItem('adminToken')
            ? `${import.meta.env.VITE_API_URL}/admin/check-token`
            : `${import.meta.env.VITE_API_URL}/auth/check-token`;

          return fetch(checkEndpoint, {
            method: 'HEAD',
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          })
            .then((response) => {
              if (response.ok) return cachedResponse;
              return fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAME).then((cache) =>
                    cache.put(event.request, networkResponse.clone())
                  );
                }
                return networkResponse;
              });
            })
            .catch(() => fetch(event.request));
        }
        return fetch(event.request);
      })
    );
    return;
  }

  if (requestUrl.pathname.includes('/admin/dashboard')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return fetch(`${import.meta.env.VITE_API_URL}/admin/check-token`, {
            method: 'HEAD',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
          })
            .then((response) => {
              if (response.ok) return cachedResponse;
              return fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAME).then((cache) =>
                    cache.put(event.request, networkResponse.clone())
                  );
                }
                return networkResponse;
              });
            })
            .catch(() => fetch(event.request));
        }
        return fetch(event.request);
      })
    );
    return;
  }

  if (requestUrl.pathname.includes('/home')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return fetch(`${import.meta.env.VITE_API_URL}/auth/check-token`, {
            method: 'HEAD',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          })
            .then((response) => {
              if (response.ok) return cachedResponse;
              return fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAME).then((cache) =>
                    cache.put(event.request, networkResponse.clone())
                  );
                }
                return networkResponse;
              });
            })
            .catch(() => fetch(event.request));
        }
        return fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (event.request.method === 'GET' && !requestUrl.pathname.startsWith('/api')) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});