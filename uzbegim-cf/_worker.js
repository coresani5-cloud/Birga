// Uzbegim — Cloudflare Pages "ko'prik": uzbegim.pages.dev manziliga kelgan har bir so'rovni Render'dagi
// asosiy serverga uzatadi va javobni o'zgartirmasdan qaytaradi (sahifalar, API, rasmlar, jonli kuzatuv oqimi).
// Manzil qatorida doim uzbegim.pages.dev ko'rinadi. Asosiy server manzili Pages sozlamasidagi ORIGIN bilan
// o'zgartirilishi mumkin (masalan, keyin o'z domeningizga o'tsangiz).
const DEFAULT_ORIGIN = 'https://uzbegim-hvhk.onrender.com';

export default {
  async fetch(request, env) {
    const origin = ((env && env.ORIGIN) || DEFAULT_ORIGIN).replace(/\/$/, '');
    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    // Faqat ikki server orasidagi (hop-by-hop) sarlavhalar uzatilmaydi
    for (const k of ['host', 'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer']) headers.delete(k);
    headers.set('X-Forwarded-Host', url.host);
    headers.set('X-Forwarded-Proto', 'https');
    // Mijozning haqiqiy IP manzili (server cheklovlari Cloudflare IP'siga emas, mijozga qo'llanishi uchun)
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) headers.set('X-Forwarded-For', ip);
    const init = { method: request.method, headers, redirect: 'manual' };
    if (request.method !== 'GET' && request.method !== 'HEAD') { init.body = request.body; init.duplex = 'half'; }
    let res;
    try {
      res = await fetch(origin + url.pathname + url.search, init);
    } catch (e) {
      // Asosiy server uyg'onayotgan bo'lsa (bepul rejada kechasi uxlaydi)
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="15"><title>Uzbegim</title><body style="font-family:system-ui,sans-serif;background:#0f0c0a;color:#fbf3ea;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2>Uzbegim</h2><p>Sayt ochilmoqda, bir necha soniya kuting…</p></div>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '15', 'Cache-Control': 'no-store' } });
    }
    const out = new Headers(res.headers);
    out.delete('content-length'); // tana qayta siqilishi mumkin — uzunlikni Cloudflare o'zi qo'yadi
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  },
};
