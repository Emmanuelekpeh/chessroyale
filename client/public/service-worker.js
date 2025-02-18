const CACHE_NAME = 'chess-crunch-v1';
const API_CACHE_NAME = 'chess-crunch-api-v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 1 week

function cleanOldCache() {
  const now = Date.now();
  caches.open(API_CACHE_NAME).then(cache => {
    cache.keys().then(keys => {
      keys.forEach(key => {
        cache.match(key).then(response => {
          if (response && response.headers.get('date')) {
            const date = new Date(response.headers.get('date')!).getTime();
            if (now - date > CACHE_MAX_AGE) {
              cache.delete(key);
            }
          }
        });
      });
    });
  });
}

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/chess.svg',
  '/offline.html'
];

const API_ROUTES = [
  '/api/tutorials',
  '/api/puzzles',
  '/api/leaderboard',
  '/api/games',
  '/api/chess-com',
  '/api/lichess'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/offline.html']); 
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  cleanOldCache();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser-sync and HMR requests in development
  if (event.request.url.includes('browser-sync') || 
      event.request.url.includes('hot-update') ||
      event.request.url.includes('__vite')) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Check if this is a navigation request
  const isNavigationRequest = request.mode === 'navigate';

  // Handle API requests
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(async () => {
          // Return cached API response if offline
          const cachedResponse = await caches.match(request);
          return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle navigation requests and static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // For navigation requests or static assets, cache successful responses
        if (response.ok && (isNavigationRequest || STATIC_ASSETS.includes(url.pathname))) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        // For navigation requests, always fall back to index.html
        if (isNavigationRequest) {
          return caches.match('/index.html') || caches.match('/offline.html');
        }
        // For other requests, try cached response or offline page
        return cachedResponse || caches.match('/offline.html');
      })
  );
});