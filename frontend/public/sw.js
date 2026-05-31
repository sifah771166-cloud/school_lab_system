const CACHE_NAME = 'school-lab-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';
const IMAGE_CACHE_NAME = 'images-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

const installEvent = () => {
  self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        })
        .then(() => self.skipWaiting())
        .catch((error) => {
          console.error('[Service Worker] Install failed:', error);
        })
    );
  });
};

const activateEvent = () => {
  self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((cacheName) => {
                return cacheName !== STATIC_CACHE_NAME &&
                       cacheName !== DYNAMIC_CACHE_NAME &&
                       cacheName !== IMAGE_CACHE_NAME;
              })
              .map((cacheName) => {
                console.log('[Service Worker] Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              })
          );
        })
        .then(() => self.clients.claim())
    );
  });
};

const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    return new Response('Network error', { status: 408 });
  }
};

const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Network error', { status: 408 });
  }
};

const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[Service Worker] Fetch failed:', error);
      return cachedResponse || new Response('Network error', { status: 408 });
    });
  
  return cachedResponse || fetchPromise;
};

const handleImageRequest = async (request) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Image fetch failed:', error);
    return new Response('Image not available', { status: 404 });
  }
};

const fetchEvent = () => {
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') {
      return;
    }
    
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request));
      return;
    }
    
    if (request.destination === 'image') {
      event.respondWith(handleImageRequest(request));
      return;
    }
    
    if (STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    
    event.respondWith(staleWhileRevalidate(request));
  });
};

const pushEvent = () => {
  self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');
    
    let data = {
      title: 'School Lab System',
      body: 'New notification',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
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
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
      actions: data.actions || [],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
};

const notificationClickEvent = () => {
  self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })
    );
  });
};

const backgroundSyncEvent = () => {
  self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-attendance') {
      event.waitUntil(syncAttendance());
    }
    
    if (event.tag === 'sync-loans') {
      event.waitUntil(syncLoans());
    }
  });
};

const syncAttendance = async () => {
  try {
    const pendingAttendance = await getPendingData('attendance');
    
    for (const attendance of pendingAttendance) {
      await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendance),
      });
    }
    
    await clearPendingData('attendance');
  } catch (error) {
    console.error('[Service Worker] Attendance sync failed:', error);
  }
};

const syncLoans = async () => {
  try {
    const pendingLoans = await getPendingData('loans');
    
    for (const loan of pendingLoans) {
      await fetch('/api/v1/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan),
      });
    }
    
    await clearPendingData('loans');
  } catch (error) {
    console.error('[Service Worker] Loans sync failed:', error);
  }
};

const getPendingData = async (storeName) => {
  return [];
};

const clearPendingData = async (storeName) => {
  return true;
};

installEvent();
activateEvent();
fetchEvent();
pushEvent();
notificationClickEvent();
backgroundSyncEvent();

console.log('[Service Worker] Loaded');
