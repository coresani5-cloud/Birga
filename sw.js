// Birga service worker: ilova qobig'ini keshlash + push bildirishnomalar
const CACHE = 'birga-v12';
const MEDIA = 'birga-media'; // foydalanuvchi mediasi — versiya almashganda O'CHIRILMAYDI
const SHELL = ['/', '/styles.css', '/app.js', '/i18n.js', '/vendor/phone.js', '/manifest.webmanifest', '/icons/mark.png', '/icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== MEDIA).map((k) => caches.delete(k)))));
  self.clients.claim();
});
const isMedia = (u) => (u.origin === location.origin && u.pathname.startsWith('/uploads/')) || u.pathname.includes('/storage/v1/object/public/');
// Range so'rovlari (audio/video) uchun keshdagi fayldan kerakli bo'lakni beramiz
async function fromCache(req, cached) {
  const range = req.headers.get('range');
  if (!range) return cached;
  const blob = await cached.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const size = blob.size;
  let start = m[1] ? Number(m[1]) : 0, end = m[2] ? Number(m[2]) : size - 1;
  if (!m[1] && m[2]) { start = size - Number(m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(blob.slice(start, end + 1), { status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': cached.headers.get('Content-Type') || blob.type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (isMedia(u)) {
    const key = u.origin + u.pathname;
    e.respondWith((async () => {
      const c = await caches.open(MEDIA);
      const hit = await c.match(key);
      if (hit) return fromCache(e.request, hit); // qurilmadan — internet va server kerak emas
      if (e.request.headers.has('range')) return fetch(e.request);
      try {
        const r = await fetch(key, { mode: 'cors', credentials: 'omit' });
        if (r.ok && r.status === 200) c.put(key, r.clone());
        return r;
      } catch { return fetch(e.request); }
    })());
    return;
  }
  if (u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/socket.io/')) return;
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
