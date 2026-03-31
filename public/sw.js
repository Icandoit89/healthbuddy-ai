const CACHE = 'healthbuddy-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Don't cache API calls
  if (e.request.url.includes('/api/') || e.request.url.includes('anthropic')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});

// Push notifications for medication reminders
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'HealthBuddy', body: 'Time for your medication!' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'HealthBuddy AI', {
      body: data.body || 'Time to take your medication!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'medication-reminder',
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'snooze', title: '⏰ Snooze 15min' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'taken') return;
  e.waitUntil(clients.openWindow('/'));
});
