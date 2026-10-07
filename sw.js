// Birga service worker: ilova qobig'ini keshlash + push bildirishnomalar
const CACHE = 'birga-v4';
const SHELL = ['/', '/styles.css', '/app.js', '/i18n.js', '/vendor/phone.js', '/manifest.webmanifest', '/icons/mark.png', '/icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(CACHE)).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/socket.io/')) return;
  if (u.pathname.startsWith('/uploads/')) {
    if (e.request.headers.has('range')) return; // audio/video oqimi to'g'ridan-to'g'ri
    e.respondWith(caches.open(CACHE + '-media').then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok && r.status === 200) c.put(e.request, r.clone()); return r; })));
    return;
  }
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('/'))));
});

// ---- Push bildirishnomalar ----
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch {}
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = wins.some((w) => w.visibilityState === 'visible');
    if (d.type === 'msg' && visible) return; // ilova ochiq — ichida ko'rsatiladi
    if (d.type === 'call' && visible) return;
    await self.registration.showNotification(d.title || 'Birga', {
      body: d.body || '', icon: d.icon || '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: d.tag || 'birga',
      renotify: true, requireInteraction: d.type === 'call', vibrate: d.type === 'call' ? [500, 250, 500, 250, 500] : [120],
      data: { chatId: d.chatId || null, type: d.type },
    });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const chatId = e.notification.data?.chatId;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { if ('focus' in w) { await w.focus(); if (chatId) w.postMessage({ openChat: chatId }); return; } }
    await self.clients.openWindow(chatId ? '/?chat=' + chatId : '/');
  })());
});
