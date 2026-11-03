// Uzbegim — buyurtmalar serveri (qo'shimcha paketlarsiz, Node 18+).
// Ishga tushirish:  node uzbegim/server.js   →  http://localhost:8080
//
// Sozlamalar (env):
//   PORT                 — port (standart 8080)
//   ADMIN_PIN            — bosh admin PIN (standart 1234). Shu PIN bilan kirib xodimlar qo'shiladi.
//   COURIER_PIN          — umumiy kuryer PIN (ixtiyoriy). Xodim akkauntlari bo'lmasa ham kuryer kira oladi.
//   SUPABASE_URL, SUPABASE_SERVICE_KEY — berilsa, ma'lumotlar Supabase'da saqlanadi (aks holda data/ papkada)
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — berilsa, yangi buyurtma Telegram guruhga yuboriladi
//   OPEN_FROM, OPEN_TO   — ish vaqti, Toshkent vaqti bo'yicha soat (standart 9 va 3)
//   ALWAYS_OPEN=1        — ish vaqtini tekshirmaslik (sinov uchun)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8080;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
const COURIER_PIN = process.env.COURIER_PIN || '';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const OPEN_FROM = +(process.env.OPEN_FROM ?? 9), OPEN_TO = +(process.env.OPEN_TO ?? 3);
const ALWAYS_OPEN = process.env.ALWAYS_OPEN === '1';

// Holatlar tartibi. Mijoz faqat shu yerda belgilangan bosqichlarni ko'radi.
const FLOW = {
  d: ['new', 'accepted', 'cooking', 'ready', 'onway', 'delivered'],
  p: ['new', 'accepted', 'cooking', 'ready', 'delivered'],
};
const CAN = {
  admin: ['accepted', 'cooking', 'ready', 'onway', 'delivered', 'cancelled'],
  courier: ['onway', 'delivered'],
};

// Filiallar (mijoz sahifasidagi shared.js bilan bir xil)
const BRANCHES = [
  { name: 'Amir Temur', lat: 41.3111, lng: 69.2797 },
  { name: 'Chilonzor', lat: 41.2756, lng: 69.2034 },
  { name: 'Yunusobod', lat: 41.3640, lng: 69.2870 },
  { name: 'Samarqand Darvoza', lat: 41.3165, lng: 69.2290 },
  { name: 'Sergeli', lat: 41.2290, lng: 69.2200 },
  { name: 'Samarqand', lat: 39.6547, lng: 66.9758 },
];
// Yetkazish narxi eng yaqin filialgacha bo'lgan masofaga qarab (km → so'm)
const ZONES = [[3, 10000], [6, 14000], [10, 18000], [15, 24000]];
const MAX_KM = 15;

/* ================= Saqlash: JSON fayl yoki Supabase ================= */
const COLLS = ['orders', 'users', 'staff', 'settings', 'apps'];
const DB = Object.fromEntries(COLLS.map(c => [c, {}]));
const SB = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? { url: process.env.SUPABASE_URL.replace(/\/$/, ''), key: process.env.SUPABASE_SERVICE_KEY } : null;
const sbHeaders = () => ({ apikey: SB.key, Authorization: 'Bearer ' + SB.key, 'Content-Type': 'application/json' });

async function loadAll() {
  if (SB) {
    for (let from = 0; ; from += 1000) {
      const r = await fetch(`${SB.url}/rest/v1/uz_store?select=coll,id,data&order=coll,id`, { headers: { ...sbHeaders(), Range: `${from}-${from + 999}` } });
      if (!r.ok) throw new Error('Supabase: ' + r.status + ' ' + (await r.text()));
      const rows = await r.json();
      for (const row of rows) if (DB[row.coll]) DB[row.coll][row.id] = row.data;
      if (rows.length < 1000) break;
    }
    console.log('Saqlash: Supabase');
  } else {
    for (const c of COLLS) { try { DB[c] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, c + '.json'), 'utf8')); } catch { DB[c] = {}; } }
    console.log('Saqlash: fayl (' + DATA_DIR + ')');
  }
}
const dirty = new Map(); // "coll\u0000id" -> true
let flushT = null;
function put(coll, id) { dirty.set(coll + '\u0000' + id, 1); clearTimeout(flushT); flushT = setTimeout(flush, 250); }
async function flush() {
  const keys = [...dirty.keys()]; dirty.clear();
  if (!keys.length) return;
  if (SB) {
    const rows = keys.map(k => { const [coll, id] = k.split('\u0000'); return { coll, id, data: DB[coll][id] }; }).filter(r => r.data);
    try {
      const r = await fetch(`${SB.url}/rest/v1/uz_store?on_conflict=coll,id`, { method: 'POST', headers: { ...sbHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
      if (!r.ok) { console.error('Supabase yozish xatosi', r.status, await r.text()); keys.forEach(k => dirty.set(k, 1)); setTimeout(flush, 5000); }
    } catch (e) { console.error('Supabase yozish xatosi', e.message); keys.forEach(k => dirty.set(k, 1)); setTimeout(flush, 5000); }
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    for (const c of new Set(keys.map(k => k.split('\u0000')[0]))) {
      const f = path.join(DATA_DIR, c + '.json');
      fs.writeFileSync(f + '.tmp', JSON.stringify(DB[c])); fs.renameSync(f + '.tmp', f);
    }
  }
}
const settings = () => (DB.settings.main = DB.settings.main || { stop: [] });

/* ================= Yordamchilar ================= */
const digits = v => String(v ?? '').replace(/\D/g, '');
const str = (v, n = 200) => String(v ?? '').trim().slice(0, n);
const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(+v) ? +v : null);
const rid = (n = 6) => crypto.randomBytes(n).toString('hex');
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
const pwOk = (pw, u) => u && u.hash && crypto.timingSafeEqual(Buffer.from(hashPw(pw || '', u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
const km = (a, b) => { const R = 6371, r = x => (x * Math.PI) / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function nearest(p) { let best = 0, d = Infinity; BRANCHES.forEach((b, i) => { const x = km(p, b); if (x < d) { d = x; best = i; } }); return { branch: best, km: d }; }
function tashkentHour(t = Date.now()) { return new Date(t + 5 * 3600e3).getUTCHours(); }
function isOpen(t) { if (ALWAYS_OPEN) return true; const h = tashkentHour(t); return OPEN_FROM < OPEN_TO ? h >= OPEN_FROM && h < OPEN_TO : h >= OPEN_FROM || h < OPEN_TO; }
const hoursText = () => `${String(OPEN_FROM).padStart(2, '0')}:00 — ${String(OPEN_TO).padStart(2, '0')}:00`;

function body(req) {
  return new Promise((ok, bad) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e5) { bad(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { bad(e); } });
  });
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()', 'Strict-Transport-Security': 'max-age=31536000' };
function json(res, code, data) { res.writeHead(code, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }

// Parolni taxmin qilishdan himoya: bir IP'dan daqiqasiga 12 ta urinish
const tries = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of tries) if (!v.some(t => now - t < 60000)) tries.delete(k); }, 120000);
function limited(req, key) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const k = key + ip, now = Date.now(), list = (tries.get(k) || []).filter(t => now - t < 60000);
  list.push(now); tries.set(k, list);
  return list.length > 12;
}

/* ================= Menyu va narx (index.html dan) ================= */
function loadCatalog() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const P = JSON.parse(html.match(/const P=(\[.*?\])\.map\(/s)[1]);
  const PROMOS = Function('return ' + html.match(/const PROMOS=(\{.*?\});/)[1])();
  return { byId: Object.fromEntries(P.map(p => [p.id, p])), PROMOS, FREE_FROM: +html.match(/FREE_FROM=(\d+)/)[1] };
}
const CAT = loadCatalog();

// Promokod qoidalari: UZBEGIM10 — faqat birinchi buyurtmaga; qolganlari — har mijozga bir marta
function promoCheck(code, user) {
  if (!code) return null;
  const pr = CAT.PROMOS[code];
  if (!pr) return 'bad';
  if (!user) return null;
  const mine = Object.values(DB.orders).filter(o => o.userId === user.id && o.status !== 'cancelled');
  if (code === 'UZBEGIM10' && mine.length) return 'first';
  if (code !== 'UZBEGIM10' && mine.some(o => o.promo === code)) return 'used';
  return null;
}
function priceOrder(b, user) {
  const mode = b.mode === 'p' ? 'p' : 'd';
  const stop = new Set(settings().stop);
  const items = [], stopped = [];
  for (const i of (Array.isArray(b.items) ? b.items : []).slice(0, 60)) {
    const [pid, vi] = String(i.id || '').split(':');
    const p = CAT.byId[pid], v = p && p.v[+vi || 0];
    if (!v) continue;
    if (stop.has(pid)) { stopped.push(pid); continue; }
    const q = Math.max(1, Math.min(99, +i.q | 0));
    items.push({ id: pid + ':' + (+vi || 0), n: p.v.length > 1 ? `${p.n.uz} (${v.l.uz})` : p.n.uz, q, price: v.p });
  }
  const sub = items.reduce((a, i) => a + i.price * i.q, 0);
  let branch = Math.max(0, Math.min(BRANCHES.length - 1, +b.branch | 0)), dist = null, del = 0, zone = null;
  const lat = num(b.lat), lng = num(b.lng);
  if (mode === 'd') {
    if (lat == null || lng == null) zone = 'nopoint';
    else {
      const n = nearest({ lat, lng }); branch = n.branch; dist = +n.km.toFixed(2);
      if (n.km > MAX_KM) zone = 'far';
      else del = (ZONES.find(z => n.km <= z[0]) || ZONES[ZONES.length - 1])[1];
    }
    if (sub >= CAT.FREE_FROM) del = 0;
  }
  // Avtomatik aksiyalar (saytdagi Aksiyalar bo'limidagi va'dalar)
  const h = tashkentHour(), deals = [];
  if (h >= 12 && h < 16) { // 1+1: har ikkinchi lavash yarim narxda
    const units = items.filter(i => /^l[1-5]:/.test(i.id)).flatMap(i => Array(i.q).fill(i.price)).sort((a, b) => b - a);
    const v = units.reduce((a, p, i) => a + (i % 2 ? Math.round(p / 2 / 100) * 100 : 0), 0);
    if (v) deals.push({ id: 'lavash11', v });
  }
  if (h >= 23 || h < 3) { // tungi aksiya: kombolarga 20%
    const v = Math.round(items.filter(i => /^c\d:/.test(i.id)).reduce((a, i) => a + i.price * i.q, 0) * 0.2 / 100) * 100;
    if (v) deals.push({ id: 'night20', v });
  }
  const dealSum = deals.reduce((a, d) => a + d.v, 0);
  const code = str(b.promo, 20).toUpperCase() || null;
  const promoError = promoCheck(code, user);
  let disc = 0;
  const pr = code && !promoError ? CAT.PROMOS[code] : null;
  if (pr) { if (pr.t === 'pct') disc = Math.round((sub * pr.v) / 10000) * 100; if (pr.t === 'fix') disc = Math.min(pr.v, sub); if (pr.t === 'del') del = 0; }
  disc = Math.min(sub, disc + dealSum);
  return { mode, items, stopped, sub, disc, deals, del, total: Math.max(0, sub - disc + del), promo: pr ? code : null, promoError, branch, dist, zone, lat, lng, open: isOpen(), hours: hoursText() };
}

/* ================= Akkauntlar ================= */
const users = () => DB.users; // kalit: telefon raqam raqamlari
function userBy(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!t || t.startsWith('S.')) return null;
  return Object.values(users()).find(u => u.sessions?.includes(t)) || null;
}
const me = u => ({ id: u.id, name: u.name, phone: u.phone, addresses: u.addresses || [] });
function newSession(holder, coll, key) {
  const t = (coll === 'staff' ? 'S.' : '') + rid(24);
  holder.sessions = [t, ...(holder.sessions || [])].slice(0, 10);
  put(coll, key);
  return t;
}

// Xodimlar: bosh admin (ADMIN_PIN), umumiy kuryer (COURIER_PIN) va admin qo'shgan shaxsiy akkauntlar
const MASTER = { id: 'master', name: 'Bosh admin', role: 'admin', branch: null, active: true };
const sessions = new Map(); // master/umumiy kuryer sessiyalari xotirada
function staffBy(req, url) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '') || (url && url.searchParams.get('st')) || '';
  if (!t.startsWith('S.')) return null;
  if (sessions.has(t)) return sessions.get(t);
  const s = Object.values(DB.staff).find(x => x.sessions?.includes(t));
  return s && s.active ? s : null;
}
const staffPublic = s => ({ id: s.id, name: s.name, phone: s.phone || '', role: s.role, branch: s.branch ?? null, active: s.active !== false });
const canSee = (s, o) => s.branch == null || o.branch === s.branch;

/* ================= Jonli ulanishlar (SSE) ================= */
const orderSubs = new Map();
const staffSubs = new Set();
function sse(res) { res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); res.write('retry: 3000\n\n'); }
const send = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
setInterval(() => { for (const set of orderSubs.values()) for (const r of set) r.write(': ping\n\n'); for (const s of staffSubs) s.res.write(': ping\n\n'); }, 25000);

function publicView(o) {
  return {
    id: o.id, no: o.no, mode: o.mode, status: o.status, history: o.history,
    total: o.total, sub: o.sub, del: o.del, disc: o.disc, items: o.items, createdAt: o.createdAt,
    dest: o.lat != null ? { lat: o.lat, lng: o.lng } : null, addr: o.addr,
    courier: o.courier ? { name: o.courier.name, phone: o.courier.phone } : null,
    loc: o.loc || null, branch: o.branch, cancelReason: o.cancelReason || null, cancelledBy: o.cancelledBy || null,
    rating: o.rating || null,
  };
}
function staffView(o) { const { token, ...rest } = o; return rest; }
function broadcast(o) {
  const subs = orderSubs.get(o.id);
  if (subs) for (const r of subs) send(r, publicView(o));
  for (const s of staffSubs) if (canSee(s.staff, o)) send(s.res, { type: 'order', order: staffView(o) });
}
const broadcastMenu = () => { for (const s of staffSubs) send(s.res, { type: 'menu', stop: settings().stop }); };

/* ================= Telegram xabari ================= */
async function telegram(text) {
  const tk = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!tk || !chat) return;
  try { await fetch(`https://api.telegram.org/bot${tk}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }) }); }
  catch (e) { console.error('Telegram xatosi', e.message); }
}
const money = n => (n || 0).toLocaleString('ru-RU').replace(/[ ,]/g, ' ');

/* ================= Statik fayllar ================= */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
function serveStatic(url, res) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || file.startsWith(DATA_DIR) || file === __filename || /\.md$/.test(file)) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><meta charset="utf-8"><title>Topilmadi</title><body style="font-family:sans-serif;background:#0f0c0a;color:#fbf3ea;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h1>404</h1><p>Sahifa topilmadi</p><a href="/" style="color:#ffa62b">Bosh sahifaga</a></div>'); }
    const ext = path.extname(file);
    res.writeHead(200, { ...SEC, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.webp' || ext === '.svg' ? 'public, max-age=86400' : 'no-cache' });
    res.end(buf);
  });
}

let seq = 1000;

/* ================= Marshrutlar ================= */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const P = url.pathname, parts = P.split('/').filter(Boolean), M = req.method;
  try {
    if (parts[0] !== 'api') return serveStatic(url, res);
    if (P === '/api/ping') return json(res, 200, { ok: true });

    // ---- Menyu holati: ish vaqti va tugagan mahsulotlar
    if (P === '/api/menu' && M === 'GET') return json(res, 200, { stop: settings().stop, open: isOpen(), hours: hoursText(), zones: ZONES, maxKm: MAX_KM, freeFrom: CAT.FREE_FROM });

    // ---- Narxni oldindan hisoblash (savat va rasmiylashtirish oynasi uchun)
    if (P === '/api/quote' && M === 'POST') { const b = await body(req); return json(res, 200, priceOrder(b, userBy(req))); }

    // ---- Vakansiyaga ariza
    if (P === '/api/vacancy' && M === 'POST') {
      if (limited(req, 'vac')) return json(res, 429, { error: 'slow' });
      const b = await body(req), ph = digits(b.phone);
      if (!str(b.name) || ph.length !== 12) return json(res, 400, { error: 'name_phone' });
      const id = rid();
      DB.apps[id] = { id, pos: str(b.pos, 40), name: str(b.name, 60), phone: '+' + ph, age: Math.max(0, Math.min(99, +b.age | 0)) || null, exp: str(b.exp, 500), createdAt: Date.now(), seen: false };
      put('apps', id);
      telegram(`📝 Vakansiyaga ariza: ${DB.apps[id].pos}\n👤 ${DB.apps[id].name} ${DB.apps[id].phone}${DB.apps[id].age ? ', ' + DB.apps[id].age + ' yosh' : ''}\n${DB.apps[id].exp}`);
      return json(res, 201, { ok: true });
    }

    // ---- Mijoz akkaunti
    if (P === '/api/auth/register' && M === 'POST') {
      if (limited(req, 'reg')) return json(res, 429, { error: 'slow' });
      const b = await body(req);
      const ph = digits(b.phone), name = str(b.name, 60), pw = String(b.password || '');
      if (!name) return json(res, 400, { error: 'name' });
      if (ph.length !== 12 || !ph.startsWith('998')) return json(res, 400, { error: 'phone' });
      if (pw.length < 6) return json(res, 400, { error: 'password' });
      if (b.consent !== true) return json(res, 400, { error: 'consent' });
      if (users()[ph]) return json(res, 409, { error: 'exists' });
      const salt = rid(16);
      const u = users()[ph] = { id: rid(), name, phone: '+' + ph, salt, hash: hashPw(pw, salt), addresses: [], sessions: [], createdAt: Date.now(), consentAt: Date.now() };
      return json(res, 201, { token: newSession(u, 'users', ph), user: me(u) });
    }
    if (P === '/api/auth/login' && M === 'POST') {
      if (limited(req, 'login')) return json(res, 429, { error: 'slow' });
      const b = await body(req), key = digits(b.phone), u = users()[key];
      if (!pwOk(b.password, u)) return json(res, 401, { error: 'login' });
      return json(res, 200, { token: newSession(u, 'users', key), user: me(u) });
    }
    if (P === '/api/auth/logout' && M === 'POST') {
      const u = userBy(req);
      if (u) { const t = (req.headers.authorization || '').slice(7); u.sessions = u.sessions.filter(x => x !== t); put('users', digits(u.phone)); }
      return json(res, 200, { ok: true });
    }
    if (P === '/api/me') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      if (M === 'PUT') {
        const b = await body(req);
        if (str(b.name)) u.name = str(b.name, 60);
        if (Array.isArray(b.addresses)) u.addresses = b.addresses.slice(0, 10).map(a => ({ label: str(a.label, 30), addr: str(a.addr, 200), lat: num(a.lat), lng: num(a.lng) })).filter(a => a.addr);
        put('users', digits(u.phone));
      }
      return json(res, 200, me(u));
    }
    if (P === '/api/me/orders') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      return json(res, 200, Object.values(DB.orders).filter(o => o.userId === u.id).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30).map(o => ({ ...publicView(o), token: o.token })));
    }

    // ---- Yangi buyurtma (faqat ro'yxatdan o'tgan mijoz)
    if (P === '/api/orders' && M === 'POST') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      const b = await body(req);
      const q = priceOrder(b, u);
      if (!q.open) return json(res, 409, { error: 'closed', hours: q.hours });
      if (q.stopped.length) return json(res, 409, { error: 'stopped', ids: q.stopped });
      if (!q.items.length) return json(res, 400, { error: 'items' });
      if (q.promoError) return json(res, 400, { error: 'promo', reason: q.promoError });
      if (q.mode === 'd') {
        if (!str(b.addr)) return json(res, 400, { error: 'addr' });
        if (q.zone) return json(res, 400, { error: q.zone });
      }
      const id = rid();
      const o = {
        id, token: rid(12), no: ++seq, mode: q.mode, status: 'new', history: { new: Date.now() }, userId: u.id,
        name: u.name, phone: u.phone, addr: q.mode === 'd' ? str(b.addr, 200) : BRANCHES[q.branch].name, note: str(b.note, 300),
        lat: q.mode === 'd' ? q.lat : null, lng: q.mode === 'd' ? q.lng : null, branch: q.branch, dist: q.dist,
        items: q.items, sub: q.sub, disc: q.disc, del: q.del, total: q.total, promo: q.promo,
        courier: null, loc: null, createdAt: Date.now(),
      };
      DB.orders[id] = o; put('orders', id); broadcast(o);
      telegram(`🔔 Yangi buyurtma #${o.no} (${o.mode === 'd' ? 'yetkazish' : 'olib ketish'})\n👤 ${o.name} ${o.phone}\n📍 ${o.addr}${o.dist != null ? ` (${o.dist} km)` : ''}\n🏪 ${BRANCHES[o.branch].name}\n` + o.items.map(i => `• ${i.n} × ${i.q}`).join('\n') + `\n💰 ${money(o.total)} so'm${o.note ? '\n💬 ' + o.note : ''}`);
      return json(res, 201, { id, token: o.token, no: o.no });
    }

    // ---- Mijoz: buyurtma holati / jonli oqim / bekor qilish / baho
    if (parts[1] === 'orders' && parts[2]) {
      const o = DB.orders[parts[2]];
      const st = staffBy(req, url), u = userBy(req);
      const owner = o && (url.searchParams.get('t') === o.token || (u && u.id === o.userId));
      if (M === 'GET' && !parts[3] || parts[3] === 'stream' || parts[3] === 'cancel' || parts[3] === 'rate') {
        if (!o || !(owner || (st && canSee(st, o)))) return json(res, 404, { error: 'notfound' });
        if (parts[3] === 'stream') {
          sse(res); send(res, publicView(o));
          if (!orderSubs.has(o.id)) orderSubs.set(o.id, new Set());
          orderSubs.get(o.id).add(res);
          req.on('close', () => orderSubs.get(o.id)?.delete(res));
          return;
        }
        if (parts[3] === 'cancel' && M === 'POST') {
          if (!owner) return json(res, 403, { error: 'forbidden' });
          if (o.status !== 'new') return json(res, 409, { error: 'late' });
          const b = await body(req);
          o.status = 'cancelled'; o.history.cancelled = Date.now(); o.cancelledBy = 'customer'; o.cancelReason = str(b.reason, 200) || null;
          put('orders', o.id); broadcast(o);
          telegram(`✖️ Mijoz #${o.no} buyurtmani bekor qildi${o.cancelReason ? ': ' + o.cancelReason : ''}`);
          return json(res, 200, publicView(o));
        }
        if (parts[3] === 'rate' && M === 'POST') {
          if (!owner) return json(res, 403, { error: 'forbidden' });
          if (o.status !== 'delivered') return json(res, 409, { error: 'notyet' });
          const b = await body(req);
          o.rating = { stars: Math.max(1, Math.min(5, +b.stars | 0)), comment: str(b.comment, 300), at: Date.now() };
          put('orders', o.id); broadcast(o);
          return json(res, 200, publicView(o));
        }
        return json(res, 200, st ? staffView(o) : publicView(o));
      }
    }

    // ---- Xodim: kirish
    if (P === '/api/staff/login' && M === 'POST') {
      if (limited(req, 'staff')) return json(res, 429, { error: 'slow' });
      const b = await body(req);
      const pin = String(b.pin || req.headers['x-pin'] || ''), ph = digits(b.phone);
      // 1) shaxsiy akkaunt: telefon + PIN
      if (ph) {
        const s = Object.values(DB.staff).find(x => digits(x.phone) === ph && x.active !== false);
        if (s && pwOk(pin, s)) return json(res, 200, { token: newSession(s, 'staff', s.id), staff: staffPublic(s) });
      }
      // 2) bosh admin PIN
      if (pin && pin === ADMIN_PIN && !b.as) { const t = 'S.' + rid(24); sessions.set(t, MASTER); return json(res, 200, { token: t, staff: staffPublic(MASTER) }); }
      // 3) umumiy kuryer PIN (ism va telefon bilan)
      if (pin && COURIER_PIN && pin === COURIER_PIN && str(b.name) && ph.length === 12) {
        const t = 'S.' + rid(24), s = { id: 'c' + ph, name: str(b.name, 40), phone: '+' + ph, role: 'courier', branch: null, active: true };
        sessions.set(t, s); return json(res, 200, { token: t, staff: staffPublic(s) });
      }
      return json(res, 401, { error: 'pin' });
    }
    const S = staffBy(req, url);
    if (P.startsWith('/api/staff/') && !S) return json(res, 401, { error: 'auth' });

    if (P === '/api/staff/me') return json(res, 200, staffPublic(S));

    // ---- Xodim: jonli oqim
    if (P === '/api/staff/stream') {
      sse(res);
      const since = Date.now() - 36 * 3600e3;
      send(res, { type: 'all', me: staffPublic(S), branches: BRANCHES.map(b => b.name), stop: settings().stop, orders: Object.values(DB.orders).filter(o => (o.createdAt > since || !['delivered', 'cancelled'].includes(o.status)) && canSee(S, o)).map(staffView) });
      const sub = { res, staff: S }; staffSubs.add(sub);
      req.on('close', () => staffSubs.delete(sub));
      return;
    }

    // ---- Admin: xodimlarni boshqarish
    if (P === '/api/staff/list' && S.role === 'admin') return json(res, 200, Object.values(DB.staff).map(staffPublic));
    if (P === '/api/staff/save' && M === 'POST' && S.role === 'admin') {
      if (S.branch != null) return json(res, 403, { error: 'forbidden' });
      const b = await body(req);
      const ph = digits(b.phone);
      if (!str(b.name) || ph.length !== 12) return json(res, 400, { error: 'name_phone' });
      let s = b.id && DB.staff[b.id];
      const clash = Object.values(DB.staff).find(x => digits(x.phone) === ph && x.id !== b.id);
      if (clash) return json(res, 409, { error: 'exists' });
      if (!s) { if (!/^\d{6,}$/.test(String(b.pin || ''))) return json(res, 400, { error: 'pin' }); s = { id: rid(), sessions: [], createdAt: Date.now() }; DB.staff[s.id] = s; }
      s.name = str(b.name, 40); s.phone = '+' + ph; s.role = b.role === 'admin' ? 'admin' : 'courier';
      s.branch = b.branch === '' || b.branch == null ? null : Math.max(0, Math.min(BRANCHES.length - 1, +b.branch | 0));
      s.active = b.active !== false;
      if (b.pin) { if (!/^\d{6,}$/.test(String(b.pin))) return json(res, 400, { error: 'pin' }); s.salt = rid(16); s.hash = hashPw(b.pin, s.salt); s.sessions = []; }
      if (!s.active) s.sessions = [];
      put('staff', s.id);
      return json(res, 200, staffPublic(s));
    }

    // ---- Admin: vakansiya arizalari
    if (P === '/api/staff/apps' && S.role === 'admin') {
      if (M === 'POST') { const b = await body(req), a = DB.apps[str(b.id, 20)]; if (a) { a.seen = !!b.seen; put('apps', a.id); } }
      return json(res, 200, Object.values(DB.apps).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200));
    }

    // ---- Admin: tugagan mahsulotlar (stop-list)
    if (P === '/api/staff/stop' && M === 'POST' && S.role === 'admin') {
      const b = await body(req), id = str(b.id, 10);
      if (!CAT.byId[id]) return json(res, 400, { error: 'item' });
      const set = new Set(settings().stop);
      b.stop ? set.add(id) : set.delete(id);
      settings().stop = [...set]; put('settings', 'main'); broadcastMenu();
      return json(res, 200, { stop: settings().stop });
    }

    // ---- Admin: hisobot
    if (P === '/api/staff/stats' && S.role === 'admin') {
      const days = Math.max(1, Math.min(90, +url.searchParams.get('days') || 1));
      const start = (() => { const d = new Date(Date.now() + 5 * 3600e3); d.setUTCHours(0, 0, 0, 0); return d.getTime() - 5 * 3600e3 - (days - 1) * 86400e3; })();
      const list = Object.values(DB.orders).filter(o => o.createdAt >= start && canSee(S, o));
      const done = list.filter(o => o.status === 'delivered');
      const top = {};
      done.forEach(o => o.items.forEach(i => { top[i.n] = (top[i.n] || 0) + i.q; }));
      const rated = done.filter(o => o.rating);
      return json(res, 200, {
        days, orders: list.length, delivered: done.length, cancelled: list.filter(o => o.status === 'cancelled').length,
        revenue: done.reduce((a, o) => a + o.total, 0), avg: done.length ? Math.round(done.reduce((a, o) => a + o.total, 0) / done.length) : 0,
        rating: rated.length ? +(rated.reduce((a, o) => a + o.rating.stars, 0) / rated.length).toFixed(2) : null, ratedCount: rated.length,
        top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5),
        byBranch: BRANCHES.map((b, i) => ({ name: b.name, count: list.filter(o => o.branch === i).length, revenue: done.filter(o => o.branch === i).reduce((a, o) => a + o.total, 0) })).filter(x => x.count),
      });
    }

    // ---- Xodim: holatni o'zgartirish
    if (parts[1] === 'orders' && parts[3] === 'status' && M === 'POST') {
      if (!S) return json(res, 401, { error: 'auth' });
      const o = DB.orders[parts[2]];
      if (!o || !canSee(S, o)) return json(res, 404, { error: 'notfound' });
      const b = await body(req), st = str(b.status, 20);
      if (!CAN[S.role].includes(st)) return json(res, 403, { error: 'forbidden' });
      if (['delivered', 'cancelled'].includes(o.status)) return json(res, 409, { error: 'closed_order' });
      if (st !== 'cancelled' && !FLOW[o.mode].includes(st)) return json(res, 400, { error: 'status' });
      if (S.role === 'courier') {
        if (o.mode !== 'd') return json(res, 403, { error: 'forbidden' });
        if (st === 'onway' && o.status !== 'ready') return json(res, 409, { error: 'late' });
        if (st === 'delivered' && !(o.status === 'onway' && o.courier && o.courier.id === S.id)) return json(res, 409, { error: 'notyours' });
      }
      if (st === 'onway') {
        if (S.role === 'courier') o.courier = { id: S.id, name: S.name, phone: S.phone || '' };
        else { const c = b.courier || {}; const cs = c.id && DB.staff[c.id]; o.courier = cs ? { id: cs.id, name: cs.name, phone: cs.phone } : { id: 'manual', name: str(c.name, 40) || 'Kuryer', phone: str(c.phone, 20) }; }
      }
      if (st === 'cancelled') { o.cancelledBy = 'staff'; o.cancelReason = str(b.reason, 200) || null; }
      o.status = st; o.history[st] = Date.now(); o.by = o.by || {}; o.by[st] = S.name;
      if (st === 'delivered' || st === 'cancelled') o.loc = o.loc ? { ...o.loc, final: true } : null;
      put('orders', o.id); broadcast(o);
      return json(res, 200, staffView(o));
    }

    // ---- Kuryer: GPS joylashuvi (faqat buyurtmani olgan kuryer)
    if (parts[1] === 'orders' && parts[3] === 'location' && M === 'POST') {
      if (!S) return json(res, 401, { error: 'auth' });
      const o = DB.orders[parts[2]];
      if (!o) return json(res, 404, { error: 'notfound' });
      if (o.status !== 'onway') return json(res, 409, { error: 'notonway' });
      if (S.role === 'courier' && (!o.courier || o.courier.id !== S.id)) return json(res, 403, { error: 'notyours' });
      const b = await body(req), lat = num(b.lat), lng = num(b.lng);
      if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json(res, 400, { error: 'coords' });
      o.loc = { lat, lng, acc: num(b.acc), speed: num(b.speed), heading: num(b.heading), at: Date.now() };
      put('orders', o.id); broadcast(o);
      return json(res, 200, { ok: true });
    }

    json(res, 404, { error: 'notfound' });
  } catch (e) {
    console.error(e);
    json(res, 400, { error: 'bad_request' });
  }
});

loadAll().then(() => {
  seq = Object.values(DB.orders).reduce((m, o) => Math.max(m, o.no || 0), 1000);
  server.listen(PORT, () => {
    console.log(`Uzbegim: http://localhost:${PORT}`);
    console.log(`Oshxona: /admin.html  ·  Kuryer: /courier.html  ·  Ish vaqti: ${ALWAYS_OPEN ? 'doim ochiq' : hoursText()}`);
    if (!process.env.ADMIN_PIN) console.log('Diqqat: ADMIN_PIN berilmagan, standart 1234 ishlatilmoqda');
  });
}).catch(e => { console.error('Ma\'lumotlarni yuklab bo\'lmadi:', e.message); process.exit(1); });
process.on('SIGTERM', async () => { await flush(); process.exit(0); });
// Kutilmagan xato serverni to'xtatib qo'ymasin
process.on('uncaughtException', e => console.error('Kutilmagan xato:', e));
process.on('unhandledRejection', e => console.error('Kutilmagan xato (promise):', e));
