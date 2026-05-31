const CACHE_NAME = 'school-lab-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const API_CACHE = 'api-cache-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_ROUTES = [
  '/api/v1/labs',
  '/api/v1/items',
  '/api/v1/departments',
  '/api/v1/schedules'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE && 
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE)
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(request, RUNTIME_CACHE)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Handle other requests (images, scripts, styles)
  event.respondWith(
    cacheFirstStrategy(request, RUNTIME_CACHE)
  );
});

// Network first strategy - try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache first strategy - try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Fetch failed:', request.url);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
  
  if (event.tag === 'sync-loans') {
    event.waitUntil(syncLoans());
  }
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-96x96.png',
        data: data.data || {},
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error handling push:', error);
    event.waitUntil(
      self.registration.showNotification('Notification', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(data.url || '/');
      }
    })
  );
});

// Handle notification dismissal
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification dismissed');
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data.type);
  
  if (event.data.type === 'process-queue') {
    event.waitUntil(syncQueue());
  }
  
  if (event.data.type === 'clear-cache') {
    event.waitUntil(clearOldCaches());
  }
  
  if (event.data.type === 'update-sync-status') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        status: 'sync-completed',
        timestamp: new Date().toISOString()
      });
    }
  }
});

async function syncQueue() {
  try {
    console.log('[Service Worker] Syncing offline queue');
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'sync-queue-request'
        });
      });
    });
  } catch (error) {
    console.error('[Service Worker] Error syncing queue:', error);
  }
}

async function clearOldCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME && 
            cacheName !== RUNTIME_CACHE && 
            cacheName !== API_CACHE) {
          return caches.delete(cacheName);
        }
      })
    );
    console.log('[Service Worker] Old caches cleared');
  } catch (error) {
    console.error('[Service Worker] Error clearing caches:', error);
  }
}

async function syncData() {
  try {
    console.log('[Service Worker] Syncing general data');
    await syncQueue();
  } catch (error) {
    console.error('[Service Worker] Error syncing data:', error);
  }
}

async function syncAttendance() {
  try {
    // Get pending attendance from IndexedDB
    const db = await openDB();
    const pendingAttendance = await db.getAll('pendingAttendance');
    
    for (const attendance of pendingAttendance) {
      try {
        await fetch('/api/v1/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${attendance.token}`
          },
          body: JSON.stringify(attendance.data)
        });
        
        // Remove from pending after successful sync
        await db.delete('pendingAttendance', attendance.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync attendance:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync attendance error:', error);
  }
}

async function syncLoans() {
  try {
    const db = await openDB();
    const pendingLoans = await db.getAll('pendingLoans');
    
    for (const loan of pendingLoans) {
      try {
        await fetch('/api/v1/loans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loan.token}`
          },
          body: JSON.stringify(loan.data)
        });
        
        await db.delete('pendingLoans', loan.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync loan:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync loans error:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: 'School Lab System',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('school-lab-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingLoans')) {
        db.createObjectStore('pendingLoans', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[Service Worker] Loaded');
