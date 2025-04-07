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

// API endpoints to cache dynamically
const API_CACHE_NAME = 'arabic-jyothisham-api-cache-v1';
const apiEndpointsToCache = [
  `${import.meta.env.VITE_API_URL}/users`, // Adjust this to match your actual endpoint for getAllUsers
  `${import.meta.env.VITE_API_URL}/admin`, // Example for payment requests
];

// Install event: Cache static assets
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

// Fetch event: Handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle API requests (e.g., fetching user list)
  if (requestUrl.pathname.startsWith(`${import.meta.env.VITE_API_URL}/`)) {
    event.respondWith(
      networkFirst(event.request)
        .catch(() => caches.match(event.request)) // Fallback to cache if network fails
    );
    return;
  }

  // Handle navigation and static asset requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses for non-API requests
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

// NetworkFirst strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache the API response if it’s successful
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
    throw error; // Let the caller handle the offline case
  }
}

// Activate event: Clean up old caches
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