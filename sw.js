const CACHE_NAME = '27-06-25-v1.1.0';
const STATIC_CACHE = '27-06-25-static-v1.1.0';
const DYNAMIC_CACHE = '27-06-25-dynamic-v1.1.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Dynamic assets to cache as they're requested
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: [
    /\.(js|css|woff2|woff|ttf|ico)$/,
    /\/styles\//,
    /\/components\//
  ],
  // Network first for dynamic content
  NETWORK_FIRST: [
    /\/api\//,
    /\/data\//
  ],
  // Stale while revalidate for images and icons
  STALE_WHILE_REVALIDATE: [
    /\.(png|jpg|jpeg|svg|gif|webp)$/,
    /\/app-icon/
  ]
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing v1.1.0...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('⚠️ Service Worker: Some static assets failed to cache:', error);
          // Don't fail installation if some assets fail
          return Promise.resolve();
        });
      }),
      // Immediately take control
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Utility function to determine cache strategy
function getCacheStrategy(url) {
  const urlPath = new URL(url).pathname;
  
  for (const pattern of CACHE_STRATEGIES.CACHE_FIRST) {
    if (pattern.test(urlPath)) return 'cache-first';
  }
  
  for (const pattern of CACHE_STRATEGIES.NETWORK_FIRST) {
    if (pattern.test(urlPath)) return 'network-first';
  }
  
  for (const pattern of CACHE_STRATEGIES.STALE_WHILE_REVALIDATE) {
    if (pattern.test(urlPath)) return 'stale-while-revalidate';
  }
  
  // Default strategy for HTML and other content
  return 'network-first';
}

// Cache First Strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('💾 Cache First: Serving from cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('🚫 Cache First: Network failed for:', request.url);
    throw error;
  }
}

// Network First Strategy
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      console.log('🌐 Network First: Serving from network and caching:', request.url);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('💾 Network First: Network failed, trying cache for:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  // Always try to fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Silent fail for background updates
  });
  
  if (cached) {
    console.log('💾 Stale While Revalidate: Serving from cache:', request.url);
    // Return cached immediately, update in background
    fetchPromise;
    return cached;
  }
  
  // If not cached, wait for network
  console.log('🌐 Stale While Revalidate: No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Main fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { method, url } = request;
  
  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except for fonts and images)
  if (!url.startsWith(self.location.origin) && 
      !url.includes('fonts.') && 
      !url.includes('images.') &&
      !url.includes('esm.sh')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        const strategy = getCacheStrategy(url);
        
        switch (strategy) {
          case 'cache-first':
            return await cacheFirst(request);
          case 'network-first':
            return await networkFirst(request);
          case 'stale-while-revalidate':
            return await staleWhileRevalidate(request);
          default:
            return await networkFirst(request);
        }
      } catch (error) {
        console.warn('🚫 Service Worker: All strategies failed for:', url);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return getOfflinePage();
        }
        
        // Return offline response for other requests
        return new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      }
    })()
  );
});

// Generate offline page
function getOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>27.06.25 - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #eff6ff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 48px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        h1 {
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        h2 {
          color: #6b7280;
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        p {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .buttons {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }
        button {
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
        }
        .secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .status {
          margin-top: 24px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 8px;
          font-size: 14px;
          color: #92400e;
        }
        .online { background: #d1fae5; color: #065f46; }
        .offline { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">💕</div>
        <h1>27.06.25</h1>
        <h2>Modalità Offline</h2>
        <p>L'app sta funzionando offline. I tuoi dati sono al sicuro e verranno sincronizzati quando tornerai online.</p>
        
        <div class="buttons">
          <button onclick="window.location.reload()">
            🔄 Riprova Connessione
          </button>
          <button class="secondary" onclick="window.history.back()">
            ← Torna Indietro
          </button>
        </div>
        
        <div class="status offline" id="status">
          🔴 Offline - Controlla la tua connessione internet
        </div>
      </div>
      
      <script>
        // Check online status
        function updateStatus() {
          const status = document.getElementById('status');
          if (navigator.onLine) {
            status.className = 'status online';
            status.innerHTML = '🟢 Connesso - Ricarica la pagina per continuare';
          } else {
            status.className = 'status offline';
            status.innerHTML = '🔴 Offline - Controlla la tua connessione internet';
          }
        }
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
        
        // Auto-reload when back online
        window.addEventListener('online', () => {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('⚡ Service Worker: Skipping waiting and taking control...');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        Promise.all([
          caches.delete(STATIC_CACHE),
          caches.delete(DYNAMIC_CACHE)
        ]).then(() => {
          console.log('🗑️ Service Worker: All caches cleared');
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    default:
      console.log('📨 Service Worker: Unknown message type:', type);
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Nuova notifica da 27.06.25',
        icon: '/app-icon-192.png',
        badge: '/app-icon-192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: data.id || 1,
          url: data.url || '/'
        },
        actions: [
          {
            action: 'open',
            title: 'Apri App',
            icon: '/app-icon-192.png'
          },
          {
            action: 'close',
            title: 'Chiudi'
          }
        ]
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || '27.06.25', options)
      );
    } catch (error) {
      console.error('🚫 Push notification error:', error);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  const url = data?.url || '/';
  
  if (action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Placeholder for background sync logic
      console.log('🔄 Background sync triggered')
    );
  }
});

// Service Worker lifecycle logging
self.addEventListener('install', () => {
  console.log('🎯 Service Worker: Installation complete');
});

self.addEventListener('activate', () => {
  console.log('✅ Service Worker: Activation complete');
});

console.log('🚀 Service Worker: Script loaded and ready (v1.1.0)');