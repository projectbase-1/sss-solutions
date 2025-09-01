const CACHE_NAME = 'sss-hrms-v3';
const STATIC_CACHE = 'sss-hrms-static-v3';
const DATA_CACHE = 'sss-hrms-data-v3';

// Static assets to cache
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const apiEndpoints = [
  '/rest/v1/employees',
  '/rest/v1/attendance',
  '/rest/v1/payroll',
  '/rest/v1/branches',
  '/rest/v1/settings'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Failed to cache static resources:', err);
        });
      }),
      caches.open(DATA_CACHE).then((cache) => {
        // Pre-cache some API endpoints if needed
        return Promise.resolve();
      })
    ])
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for auth requests
  if (request.url.includes('/auth/') || request.method !== 'GET') {
    return;
  }

  // Handle API requests (Supabase data)
  if (request.url.includes('supabase.co')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(request).then(response => {
          // Only cache successful GET requests for data
          if (response.ok && request.method === 'GET') {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached version if offline
          return caches.match(request);
        });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).catch(err => {
          console.error('Fetch failed:', err);
          // Return a basic offline response for documents
          if (request.destination === 'document') {
            return caches.match('/') || new Response('Offline - Please check your connection');
          }
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DATA_CACHE];
  
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
  // Claim clients immediately
  return self.clients.claim();
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Trigger sync with main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BACKGROUND_SYNC' });
        });
      })
    );
  }
});