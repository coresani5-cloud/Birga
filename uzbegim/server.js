// Uzbegim — buyurtmalar serveri (qo'shimcha paketlarsiz).
// Ishga tushirish:  node uzbegim/server.js   →  http://localhost:8080
// Sozlamalar (env): PORT, ADMIN_PIN (oshxona, standart 1234), COURIER_PIN (kuryer, standart 0000)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8080;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
const COURIER_PIN = process.env.COURIER_PIN || '0000';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB = path.join(DATA_DIR, 'orders.json');
const UDB = path.join(DATA_DIR, 'users.json');

// Holatlar tartibi. Mijoz faqat shu yerda belgilangan bosqichlarni ko'radi.
const FLOW = {
  d: ['new', 'accepted', 'cooking', 'ready', 'onway', 'delivered'],
  p: ['new', 'accepted', 'cooking', 'ready', 'delivered'],
};
// Kim qaysi holatga o'tkaza oladi
const CAN = {
  admin: ['accepted', 'cooking', 'ready', 'onway', 'delivered', 'cancelled'],
  courier: ['onway', 'delivered'],
};

let orders = {};
try { orders = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { orders = {}; }
// users: { [phoneDigits]: {id, name, phone, salt, hash, addresses:[], sessions:[] } }
let users = {};
try { users = JSON.parse(fs.readFileSync(UDB, 'utf8')); } catch { users = {}; }
const timers = {};
function write(file, data) {
  clearTimeout(timers[file]);
  timers[file] = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(data));
    fs.renameSync(file + '.tmp', file);
  }, 300);
}
const save = () => write(DB, orders);
const saveUsers = () => write(UDB, users);

// ---- Foydalanuvchilar
const digits = v => String(v ?? '').replace(/\D/g, '');
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
function newSession(u) {
  const t = crypto.randomBytes(24).toString('hex');
  u.sessions = [t, ...(u.sessions || [])].slice(0, 10);
  saveUsers();
  return t;
}
function userBy(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!t) return null;
  return Object.values(users).find(u => u.sessions?.includes(t)) || null;
}
const me = u => ({ id: u.id, name: u.name, phone: u.phone, addresses: u.addresses || [] });

// ---- Jonli ulanishlar (Server-Sent Events)
const orderSubs = new Map(); // orderId -> Set(res)
const staffSubs = new Set(); // {res, role}
function sse(res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('retry: 3000\n\n');
}
const send = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
setInterval(() => {
  for (const set of orderSubs.values()) for (const r of set) r.write(': ping\n\n');
  for (const s of staffSubs) s.res.write(': ping\n\n');
}, 25000);

// Mijozga faqat kerakli ma'lumot boradi (telefon/manzil boshqalarga ochilmaydi)
function publicView(o) {
  return {
    id: o.id, no: o.no, mode: o.mode, status: o.status, history: o.history,
    total: o.total, items: o.items, createdAt: o.createdAt,
    dest: o.lat != null ? { lat: o.lat, lng: o.lng } : null,
    courier: o.courier ? { name: o.courier.name, phone: o.courier.phone } : null,
    loc: o.loc || null, branch: o.branch,
  };
}
function staffView(o) { const { token, ...rest } = o; return rest; }

function broadcast(o) {
  const subs = orderSubs.get(o.id);
  if (subs) for (const r of subs) send(r, publicView(o));
  for (const s of staffSubs) send(s.res, { type: 'order', order: staffView(o) });
}

// ---- Yordamchilar
function body(req) {
  return new Promise((ok, bad) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e5) { bad(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { bad(e); } });
  });
}
function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function role(req, url) {
  const pin = req.headers['x-pin'] || url.searchParams.get('pin');
  if (pin === ADMIN_PIN) return 'admin';
  if (pin === COURIER_PIN) return 'courier';
  return null;
}
const str = (v, n = 200) => String(v ?? '').trim().slice(0, n);
const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(+v) ? +v : null);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8' };
function serveStatic(url, res) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || file.startsWith(DATA_DIR) || file === __filename) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}

let seq = Object.values(orders).reduce((m, o) => Math.max(m, o.no || 0), 1000);

// ---- Marshrutlar
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean); // api, orders, :id, action
  try {
    if (parts[0] !== 'api') return serveStatic(url, res);

    if (url.pathname === '/api/ping') return json(res, 200, { ok: true });

    // ---- Ro'yxatdan o'tish / kirish
    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const b = await body(req);
      const ph = digits(b.phone), name = str(b.name, 60), pw = String(b.password || '');
      if (!name || ph.length !== 12 || !ph.startsWith('998')) return json(res, 400, { error: 'phone' });
      if (pw.length < 6) return json(res, 400, { error: 'password' });
      if (users[ph]) return json(res, 409, { error: 'exists' });
      const salt = crypto.randomBytes(16).toString('hex');
      const u = users[ph] = { id: crypto.randomBytes(6).toString('hex'), name, phone: '+' + ph, salt, hash: hashPw(pw, salt), addresses: [], sessions: [], createdAt: Date.now() };
      return json(res, 201, { token: newSession(u), user: me(u) });
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const b = await body(req);
      const u = users[digits(b.phone)];
      if (!u || !crypto.timingSafeEqual(Buffer.from(hashPw(b.password || '', u.salt), 'hex'), Buffer.from(u.hash, 'hex'))) return json(res, 401, { error: 'login' });
      return json(res, 200, { token: newSession(u), user: me(u) });
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      const u = userBy(req);
      if (u) { const t = (req.headers.authorization || '').slice(7); u.sessions = u.sessions.filter(x => x !== t); saveUsers(); }
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/me') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      if (req.method === 'PUT') {
        const b = await body(req);
        if (str(b.name)) u.name = str(b.name, 60);
        if (Array.isArray(b.addresses)) u.addresses = b.addresses.slice(0, 10).map(a => ({ label: str(a.label, 30), addr: str(a.addr, 200), lat: num(a.lat), lng: num(a.lng) })).filter(a => a.addr);
        saveUsers();
      }
      return json(res, 200, me(u));
    }
    if (url.pathname === '/api/me/orders') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      return json(res, 200, Object.values(orders).filter(o => o.userId === u.id).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30).map(o => ({ ...publicView(o), token: o.token })));
    }

    // Yangi buyurtma (faqat ro'yxatdan o'tgan mijoz)
    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const u = userBy(req);
      if (!u) return json(res, 401, { error: 'auth' });
      const b = await body(req);
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 60).map(i => ({ id: str(i.id, 10), n: str(i.n, 80), q: Math.max(1, Math.min(99, +i.q | 0)), price: Math.max(0, +i.price | 0) }));
      const mode = b.mode === 'p' ? 'p' : 'd';
      if (!items.length) return json(res, 400, { error: 'items' });
      if (mode === 'd' && !str(b.addr)) return json(res, 400, { error: 'addr' });
      const id = crypto.randomBytes(6).toString('hex');
      const o = {
        id, token: crypto.randomBytes(12).toString('hex'), no: ++seq,
        mode, status: 'new', history: { new: Date.now() }, userId: u.id,
        name: u.name, phone: u.phone, addr: str(b.addr, 200), note: str(b.note, 300),
        lat: num(b.lat), lng: num(b.lng), branch: Math.max(0, +b.branch | 0),
        items, total: Math.max(0, +b.total | 0), promo: str(b.promo, 20) || null,
        courier: null, loc: null, createdAt: Date.now(),
      };
      orders[id] = o; save(); broadcast(o);
      return json(res, 201, { id, token: o.token, no: o.no });
    }

    // Mijoz: buyurtma holati / jonli oqim
    if (parts[1] === 'orders' && parts[2] && req.method === 'GET') {
      const o = orders[parts[2]];
      const r = role(req, url);
      if (!o || (url.searchParams.get('t') !== o.token && !r && userBy(req)?.id !== o.userId)) return json(res, 404, { error: 'Topilmadi' });
      if (parts[3] === 'stream') {
        sse(res); send(res, publicView(o));
        if (!orderSubs.has(o.id)) orderSubs.set(o.id, new Set());
        orderSubs.get(o.id).add(res);
        req.on('close', () => orderSubs.get(o.id)?.delete(res));
        return;
      }
      return json(res, 200, r ? staffView(o) : publicView(o));
    }

    // Xodimlar: kirish tekshiruvi
    if (url.pathname === '/api/staff/login' && req.method === 'POST') {
      const r = role(req, url);
      return r ? json(res, 200, { role: r }) : json(res, 401, { error: 'PIN noto\'g\'ri' });
    }

    // Xodimlar: barcha buyurtmalar jonli oqimi
    if (url.pathname === '/api/staff/stream') {
      const r = role(req, url);
      if (!r) return json(res, 401, { error: 'PIN kerak' });
      sse(res);
      const day = Date.now() - 36 * 3600e3;
      send(res, { type: 'all', orders: Object.values(orders).filter(o => o.createdAt > day).map(staffView) });
      const sub = { res, role: r }; staffSubs.add(sub);
      req.on('close', () => staffSubs.delete(sub));
      return;
    }

    // Xodimlar: holatni o'zgartirish
    if (parts[1] === 'orders' && parts[3] === 'status' && req.method === 'POST') {
      const r = role(req, url), o = orders[parts[2]];
      if (!r) return json(res, 401, { error: 'PIN kerak' });
      if (!o) return json(res, 404, { error: 'Topilmadi' });
      const b = await body(req);
      const st = str(b.status, 20);
      if (!CAN[r].includes(st)) return json(res, 403, { error: 'Bu holatni o\'zgartirishga ruxsat yo\'q' });
      if (st !== 'cancelled' && !FLOW[o.mode].includes(st)) return json(res, 400, { error: 'Noto\'g\'ri holat' });
      if (r === 'courier' && !((st === 'onway' && o.status === 'ready') || (st === 'delivered' && o.status === 'onway'))) return json(res, 409, { error: 'Hozir bu tugma ishlamaydi' });
      if (st === 'onway') {
        const c = b.courier || o.courier || {};
        o.courier = { name: str(c.name, 40) || 'Kuryer', phone: str(c.phone, 20) };
      }
      o.status = st; o.history[st] = Date.now();
      if (st === 'delivered' || st === 'cancelled') o.loc = o.loc ? { ...o.loc, final: true } : null;
      save(); broadcast(o);
      return json(res, 200, staffView(o));
    }

    // Kuryer: GPS joylashuvini yuborish
    if (parts[1] === 'orders' && parts[3] === 'location' && req.method === 'POST') {
      const r = role(req, url), o = orders[parts[2]];
      if (!r) return json(res, 401, { error: 'PIN kerak' });
      if (!o) return json(res, 404, { error: 'Topilmadi' });
      if (o.status !== 'onway') return json(res, 409, { error: 'Buyurtma yo\'lda emas' });
      const b = await body(req);
      const lat = num(b.lat), lng = num(b.lng);
      if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json(res, 400, { error: 'Koordinata xato' });
      o.loc = { lat, lng, acc: num(b.acc), speed: num(b.speed), heading: num(b.heading), at: Date.now() };
      save(); broadcast(o);
      return json(res, 200, { ok: true });
    }

    json(res, 404, { error: 'Topilmadi' });
  } catch (e) {
    json(res, 400, { error: 'So\'rov xato' });
  }
});

server.listen(PORT, () => {
  console.log(`Uzbegim: http://localhost:${PORT}`);
  console.log(`Oshxona paneli: http://localhost:${PORT}/admin.html  (PIN ${ADMIN_PIN === '1234' ? '1234' : '***'})`);
  console.log(`Kuryer sahifasi: http://localhost:${PORT}/courier.html (PIN ${COURIER_PIN === '0000' ? '0000' : '***'})`);
});
