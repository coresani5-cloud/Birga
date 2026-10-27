// Birga service worker: ilova qobig'ini keshlash + push bildirishnomalar
const CACHE = 'birga-v23';
const MEDIA = 'birga-media'; // foydalanuvchi mediasi — versiya almashganda O'CHIRILMAYDI
const SHELL = ['/', '/styles.css', '/app.js', '/i18n.js', '/vendor/phone.js', '/manifest.webmanifest', '/icons/mark.png', '/icons/icon-192.png', '/icons/badge-96.png', '/socket.io/socket.io.js'];
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
// Katta fayl (qurilmadan qurilmaga): sahifa bo'laklarni MessagePort orqali beradi, SW ularni to'g'ridan-to'g'ri diskka yuklab olish sifatida uzatadi
const P2PDL = new Map();
self.addEventListener('message', (e) => {
  const d = e.data; if (!d || d.t !== 'p2p-dl' || !e.ports[0]) return;
  const port = e.ports[0]; let ctl; const stream = new ReadableStream({ start(c) { ctl = c; }, cancel() { try { port.postMessage({ t: 'cancel' }); } catch {} } });
  port.onmessage = (m) => { const x = m.data; if (x === 'end') { try { ctl.close(); } catch {} } else if (x === 'abort') { try { ctl.error(new Error('abort')); } catch {} } else if (x instanceof ArrayBuffer || ArrayBuffer.isView(x)) ctl.enqueue(new Uint8Array(x.buffer || x)); };
  P2PDL.set(d.id, { stream, d }); setTimeout(() => P2PDL.delete(d.id), 60e3); port.postMessage({ t: 'ready' });
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && u.pathname.startsWith('/__p2pdl/')) {
    const x = P2PDL.get(u.pathname.slice(9)); if (!x) return;
    P2PDL.delete(u.pathname.slice(9));
    const name = String(x.d.name || 'file').replace(/["\\\r\n]/g, '_');
    e.respondWith(new Response(x.stream, { headers: { 'Content-Type': x.d.mime || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`, ...(x.d.size ? { 'Content-Length': String(x.d.size) } : {}) } }));
    return;
  }
  if (e.request.method !== 'GET') return;
  if (u.searchParams.has('bp')) return; // katta fayl bo'laklari keshlanmaydi
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
  if (u.origin !== location.origin || u.pathname.startsWith('/api/') || (u.pathname.startsWith('/socket.io/') && !u.pathname.endsWith('.js')) || u.pathname === '/holat') return;
  // Ilova qobig'i: keshdan DARHOL ochiladi (server uxlab yotsa ham Birga logotipi ko'rinadi), fonda yangilanadi.
  // Faqat Birga'ning o'z javoblari (X-Birga) keshlanadi — hostingning "uyg'onish" sahifasi hech qachon.
  const key = e.request.mode === 'navigate' ? '/' : e.request;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(key);
    const net = fetch(e.request).then((r) => { if (r.ok && r.headers.get('x-birga')) c.put(key, r.clone()); return r; }).catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }
    const r = await net;
    if (r && (r.headers.get('x-birga') || e.request.mode !== 'navigate')) return r;
    return (await caches.match('/')) || r || Response.error();
  })());
});

// Yangi versiya: ilova so'raganda qobiq fayllarini serverdan qayta oladi
self.addEventListener('message', (e) => {
  if (e.data !== 'refresh-shell') return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(async (u) => { try { const r = await fetch(u, { cache: 'reload' }); if (r.ok && r.headers.get('x-birga')) await c.put(u, r); } catch {} }));
    e.source?.postMessage('shell-ready');
  })());
});

// ---- Push bildirishnomalar ----
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch {}
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = wins.some((w) => w.visibilityState === 'visible');
    if (d.type === 'msg' && visible) return; // ilova ochiq — ichida ko'rsatiladi
    if (d.type === 'call' && visible) return;
    // bir chatdan bir nechta xabar: "3 ta yangi xabar" — raqam bilan
    const tag = d.tag || 'birga'; let n = 1, lines = [];
    if (d.type === 'msg') { const prev = await self.registration.getNotifications({ tag }).catch(() => []); const pd = prev[0]?.data; if (pd?.n) { n = pd.n + 1; lines = (pd.lines || []).slice(-4); } }
    lines.push(d.body || '');
    const many = d.type === 'msg' && n > 1;
    await self.registration.showNotification(many ? `${d.title || 'Birga'} (${n})` : d.title || 'Birga', {
      body: many ? lines.join('\n') : d.body || '', icon: d.icon || '/icons/icon-192.png', badge: '/icons/badge-96.png', tag,
      renotify: true, requireInteraction: d.type === 'call', vibrate: d.type === 'call' ? [800, 400, 800, 400, 800, 400, 800] : [120],
      actions: d.type === 'call' ? [{ action: 'open', title: '📞' }] : [],
      data: { chatId: d.chatId || null, type: d.type, n, lines },
    });
    try { const all = await self.registration.getNotifications(); const tot = all.reduce((a, x) => a + (x.data?.type === 'msg' ? x.data.n || 1 : 0), 0); if (self.navigator.setAppBadge) await self.navigator.setAppBadge(tot); } catch {}
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
