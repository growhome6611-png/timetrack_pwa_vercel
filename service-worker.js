const CACHE_NAME = 'timetrack-drive-v3-domain-fixed';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname === '/index.html' || url.pathname === '/') {
    event.respondWith(fetch(event.request).then(resp => {
      if (url.pathname === '/' || url.pathname === '/index.html') caches.open(CACHE_NAME).then(c => c.put('/index.html', resp.clone()));
      return resp;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)); return resp;
  })));
});
