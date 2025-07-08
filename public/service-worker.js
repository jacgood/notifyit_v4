// Service Worker for OnCall Alert Manager
const CACHE_NAME = 'oncall-alerts-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/settings',
  '/offline.html'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)
          .then((response) => response || caches.match('/offline.html'))
        )
    );
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'New voicemail alert!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'voicemail-alert',
    requireInteraction: true,
    actions: [
      { action: 'acknowledge', title: 'Acknowledge' },
      { action: 'snooze', title: 'Snooze 5 min' }
    ],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
    
    // Store alert ID for acknowledgment
    if (data.alertId) {
      options.data.alertId = data.alertId;
    }
  }

  event.waitUntil(
    self.registration.showNotification('OnCall Alert! 🚨', options)
      .then(() => {
        // Schedule repeated notifications every 30 seconds
        return scheduleRepeatedNotification(options);
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'acknowledge') {
    // Cancel repeated notifications
    clearRepeatedNotification(event.notification.tag);
    
    // Send acknowledgment to server
    if (event.notification.data && event.notification.data.alertId) {
      event.waitUntil(
        fetch(`/api/alerts/${event.notification.data.alertId}/acknowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
  } else if (event.action === 'snooze') {
    // Snooze for 5 minutes
    clearRepeatedNotification(event.notification.tag);
    setTimeout(() => {
      self.registration.showNotification('OnCall Alert! (Snoozed) 🚨', event.notification.options);
      scheduleRepeatedNotification(event.notification.options);
    }, 5 * 60 * 1000);
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Repeated notification management
const repeatedNotifications = new Map();

function scheduleRepeatedNotification(options) {
  const tag = options.tag || 'default';
  
  // Clear any existing interval
  clearRepeatedNotification(tag);
  
  // Set up repeated notifications every 30 seconds
  const intervalId = setInterval(() => {
    self.registration.showNotification('OnCall Alert! 🚨', {
      ...options,
      body: `${options.body} (Reminder)`,
      timestamp: Date.now()
    });
  }, 30 * 1000);
  
  repeatedNotifications.set(tag, intervalId);
}

function clearRepeatedNotification(tag) {
  if (repeatedNotifications.has(tag)) {
    clearInterval(repeatedNotifications.get(tag));
    repeatedNotifications.delete(tag);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncAlerts() {
  try {
    const response = await fetch('/api/alerts/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}