// Birga — messenjer serveri (Express + Socket.IO + SQLite/PostgreSQL)
require('./env');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { parsePhoneNumberFromString } = require('libphonenumber-js/max');
const db = require('./db');
const storage = require('./storage');
const sms = require('./sms');
const media = require('./media');
const { createPush } = require('./push');

const PORT = process.env.PORT || 3000;
let JWT_SECRET = process.env.JWT_SECRET || ''; // bo'sh bo'lsa bazada saqlanadigan doimiy kalit ishlatiladi
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const now = () => Date.now();
const hash = (s) => crypto.createHmac('sha256', JWT_SECRET).update(String(s)).digest('hex');
const online = new Map(); // userId -> sockets soni
const getUser = (id) => db.get('SELECT * FROM users WHERE id=?', [Number(id) || 0]);
const STORY_TTL = 24 * 3600e3;
let push = null;

// Telefon raqami faqat egasiga ko'rinadi (maxfiylik)
// Birga egasi/adminlari: ADMIN_EMAILS (vergul bilan), standart — loyiha egasi
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'coresani5@gmail.com').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const isAdminUser = (u) => !!u?.email && ADMIN_EMAILS.includes(String(u.email).toLowerCase());
function publicUser(u, self = false) {
  if (!u) return null;
  if (u.deleted) return { id: u.id, name: null, deleted: true, username: null, bio: '', avatar: null, last_seen: null, online: false };
  const hide = !!u.hide_seen && !self; // "oxirgi faollik" yashirilgan — boshqalarga "yaqinda" ko'rinadi
  const o = { id: u.id, name: u.name, username: u.username, bio: u.bio, avatar: u.avatar, last_seen: hide ? null : u.last_seen, online: hide ? false : online.has(u.id), country: u.country, birthday: u.birthday || null };
  if (self) { o.phone = String(u.phone || '').startsWith('mail:') ? null : u.phone; o.email = u.email || null; o.lang = u.lang; o.hide_seen = !!u.hide_seen; o.has2fa = !!u.pass_hash; o.pass_hint = u.pass_hint || ''; o.isAdmin = isAdminUser(u); try { o.region = JSON.parse(u.region || 'null'); } catch { o.region = null; } }
  return o;
}

function parsePhone(input, defaultCountry) {
  const s = String(input || '').trim();
  if (!s) return null;
  let p;
  if (s.startsWith('+')) p = parsePhoneNumberFromString(s);
  else if (defaultCountry) p = parsePhoneNumberFromString(s, defaultCountry);
  else p = parsePhoneNumberFromString('+' + s.replace(/\D/g, ''));
  if (!p || !p.isValid()) return null;
  return { e164: p.number, country: p.country || null };
}

const LANGS = ['uz', 'ru', 'en'];
const tr = (lang, uz, ru, en) => ({ uz, ru, en }[LANGS.includes(lang) ? lang : 'en']);
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch((e) => { console.error(e); res.status(500).json({ error: 'server' }); });

// ---------- TURN (qo'ng'iroqlar boshqa davlat/tarmoqlar orasida ham ulanishi uchun) ----------
function iceServersFor(uid) {
  const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
  if (process.env.TURN_SECRET && process.env.TURN_HOST) { // o'z coturn serveringiz
    const user = `${Math.floor(now() / 1000) + 12 * 3600}:${uid}`;
    const credential = crypto.createHmac('sha1', process.env.TURN_SECRET).update(user).digest('base64');
    const h = process.env.TURN_HOST;
    const urls = [`stun:${h}:3478`, `turn:${h}:3478?transport=udp`, `turn:${h}:3478?transport=tcp`];
    if (process.env.TURN_TLS_PORT) urls.push(`turns:${h}:${process.env.TURN_TLS_PORT}?transport=tcp`);
    list.push({ urls, username: user, credential });
  }
  if (process.env.TURN_URL) list.push({ urls: process.env.TURN_URL.split(',').map((s) => s.trim()), username: process.env.TURN_USER, credential: process.env.TURN_PASS });
  // O'z TURN serveri yo'q bo'lsa — bepul ochiq "Open Relay" (metered.ca, oyiga ~20 GB): turli operatorlar/NAT orqasida ham ulanish uchun.
  // 80/443 portlari — ko'p mobil tarmoqlar va ofis Wi-Fi'lari faqat shularni ochiq qoldiradi. O'chirish: PUBLIC_TURN=0
  if (!process.env.TURN_SECRET && !process.env.TURN_URL && process.env.PUBLIC_TURN !== '0') {
    const h = process.env.PUBLIC_TURN_HOST || 'staticauth.openrelay.metered.ca';
    const user = `${Math.floor(now() / 1000) + 12 * 3600}:birga${uid}`;
    const credential = crypto.createHmac('sha1', process.env.PUBLIC_TURN_SECRET || 'openrelayprojectsecret').update(user).digest('base64');
    list.push({ urls: [`turn:${h}:80`, `turn:${h}:80?transport=tcp`, `turn:${h}:443`, `turn:${h}:443?transport=tcp`, `turns:${h}:443?transport=tcp`], username: user, credential });
  }
  return list;
}
// Metered (Open Relay) — foydalanuvchiga eng yaqin TURN serverlar: METERED_DOMAIN (masalan birga.metered.live) + METERED_API_KEY
let mtIce = null, mtIceAt = 0;
async function meteredIce() {
  const d = process.env.METERED_DOMAIN, k = process.env.METERED_API_KEY; if (!d || !k) return [];
  if (mtIce && now() - mtIceAt < 3600e3) return mtIce;
  try { const r = await fetch(`https://${d}/api/v1/turn/credentials?apiKey=${encodeURIComponent(k)}`); if (r.ok) { const j = await r.json(); if (Array.isArray(j)) { mtIce = j; mtIceAt = now(); } } } catch (e) { console.error('metered:', e.message); }
  return mtIce || [];
}
// Cloudflare TURN (oyiga 1000 GB bepul): CF_TURN_KEY_ID + CF_TURN_API_TOKEN
let cfIce = null, cfIceAt = 0;
async function cloudflareIce() {
  const id = process.env.CF_TURN_KEY_ID, tok = process.env.CF_TURN_API_TOKEN;
  if (!id || !tok) return [];
  if (cfIce && now() - cfIceAt < 6 * 3600e3) return cfIce;
  try {
    const r = await fetch(`${process.env.CF_TURN_API || 'https://rtc.live.cloudflare.com'}/v1/turn/keys/${id}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json();
    const arr = Array.isArray(j.iceServers) ? j.iceServers : [j.iceServers];
    cfIce = arr.filter(Boolean).map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) })).filter((s) => s.urls.length);
    cfIceAt = now();
    return cfIce;
  } catch (e) { console.error('Cloudflare TURN:', e.message); return cfIce || []; }
}

// ---------- Express ----------
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)' });
  next();
});
// Birga'ning o'z javoblari belgisi: service worker hosting'ning "uyg'onish" sahifasini keshlab qo'ymasligi uchun
app.use((req, res, next) => { res.set('X-Birga', '1'); next(); });
app.use('/api/ai', express.json({ limit: '8mb' })); // Birga AI ga rasm ham yuboriladi
app.use(express.json({ limit: '1mb' }));

// Ilova fayllari public/ papkasida yoki (GitHub'ga papkasiz yuklangan bo'lsa) ildizda turadi
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public', 'index.html')) ? path.join(__dirname, 'public') : null;
const INDEX_HTML = PUBLIC_DIR ? path.join(PUBLIC_DIR, 'index.html') : path.join(__dirname, 'index.html');
// index.html ichiga joriy versiya yoziladi — ilova o'zi eskirganini bila oladi
let INDEX_CACHE = null;
function sendIndex(req, res) {
  if (!INDEX_CACHE) INDEX_CACHE = fs.readFileSync(INDEX_HTML, 'utf8').replace('__APP_VERSION__', APP_VERSION);
  res.set('Cache-Control', 'no-cache').type('html').send(INDEX_CACHE);
}
app.get('/manifest.webmanifest', (req, res, next) => {
  const f = [path.join(__dirname, 'public', 'manifest.webmanifest'), path.join(__dirname, 'manifest.webmanifest')].find((x) => fs.existsSync(x)); if (!f) return next();
  try { const m = JSON.parse(fs.readFileSync(f, 'utf8')); m.prefer_related_applications = true; m.related_applications = [{ platform: 'play', id: 'uz.birga.app' }]; res.set('Cache-Control', 'no-cache').type('application/manifest+json').send(JSON.stringify(m)); } catch { next(); }
});
app.get(['/', '/index.html'], sendIndex);
if (PUBLIC_DIR) app.use(express.static(PUBLIC_DIR, { setHeaders: (res, p) => { if (p.endsWith('sw.js')) res.set('Cache-Control', 'no-cache'); } }));
else {
  const FLAT = {
    '/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/i18n.js': 'i18n.js', '/styles.css': 'styles.css',
    '/sw.js': 'sw.js', '/manifest.webmanifest': 'manifest.webmanifest', '/icons/icon-192.png': 'icon-192.png',
    '/icons/icon-512.png': 'icon-512.png', '/icons/mark.png': 'mark.png', '/icons/logo-full.jpg': 'logo-full.jpg', '/icons/badge-96.png': 'badge-96.png', '/games.js': 'games.js',
  };
  app.get(Object.keys(FLAT), (req, res) => {
    if (req.path.endsWith('.webmanifest')) res.type('application/manifest+json');
    res.sendFile(path.join(__dirname, FLAT[req.path]), { headers: req.path === '/sw.js' ? { 'Cache-Control': 'no-cache' } : {} });
  });
}
// Ilova versiyasi: fayllar o'zgarsa (yangi deploy) — mijozlar avtomatik yangilanadi
const APP_VERSION = (() => {
  const h = crypto.createHash('sha1');
  for (const f of ['index.html', 'app.js', 'styles.css', 'i18n.js', 'sw.js']) { try { h.update(fs.readFileSync(PUBLIC_DIR ? path.join(PUBLIC_DIR, f) : path.join(__dirname, f))); } catch {} }
  return h.digest('hex').slice(0, 10);
})();
app.get('/api/version', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ v: APP_VERSION }); });
const PN_DIR = path.join(__dirname, 'node_modules', 'libphonenumber-js');
app.get('/vendor/phone.js', (req, res) => res.sendFile(path.join(PN_DIR, 'bundle', 'libphonenumber-mobile.js'), { maxAge: '7d' }));
app.get('/vendor/phone-examples.json', (req, res) => res.sendFile(path.join(PN_DIR, 'examples.mobile.json'), { maxAge: '7d' }));
// Yuklangan fayllar hech qachon sayt nomidan skript sifatida ishlamasin (HTML/SVG orqali XSS'dan himoya)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, setHeaders: (res, p) => {
  res.set({ 'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'", 'X-Content-Type-Options': 'nosniff' });
  if (!/\.(jpe?g|png|gif|webp|avif|heic|mp4|webm|mov|m4a|mp3|ogg|oga|opus|wav|aac)$/i.test(p)) res.set('Content-Disposition', 'attachment');
} }));

// IP bo'yicha cheklov
const hits = new Map();
function rateLimit(key, max, windowMs) {
  return (req, res, next) => {
    const k = key + ':' + req.ip; const t = now();
    const arr = (hits.get(k) || []).filter((x) => t - x < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: tr(req.body?.lang || req.query.lang, 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring', 'Слишком много попыток. Попробуйте позже', 'Too many attempts. Please try again later') });
    arr.push(t); hits.set(k, arr); next();
  };
}

function rateOk(k, max, windowMs) { const t = now(); const arr = (hits.get(k) || []).filter((x) => t - x < windowMs); if (arr.length >= max) return false; arr.push(t); hits.set(k, arr); return true; }

const tokenFor = (u, sid) => jwt.sign({ uid: u.id, pv: hash(u.phone).slice(0, 12), ...(sid ? { sid } : {}) }, JWT_SECRET, { expiresIn: '365d' });
// ===== Sessiyalar (qurilmalar): har bir kirish — alohida qurilma, istalganini masofadan chiqarib yuborish mumkin =====
const sessCache = new Map(); // sid -> { revoked, last }
function deviceName(ua) {
  ua = String(ua || '');
  const app = /BirgaApp/.test(ua) ? 'Birga ilovasi' : /YaBrowser/.test(ua) ? 'Yandex Browser' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /EdgA?\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Brauzer';
  let os = '', model = '';
  const an = /Android ([\d.]+)(?:;\s*([^;)]+))?/.exec(ua);
  if (an) { os = 'Android ' + an[1].split('.')[0]; model = (an[2] || '').replace(/Build\/.*$/, '').trim(); if (/^(K|wv)$/.test(model)) model = ''; }
  else if (/iPhone/.test(ua)) { os = 'iOS'; model = 'iPhone'; } else if (/iPad/.test(ua)) { os = 'iPadOS'; model = 'iPad'; }
  else if (/Windows NT/.test(ua)) os = 'Windows'; else if (/Mac OS X/.test(ua)) os = 'macOS'; else if (/Linux/.test(ua)) os = 'Linux';
  return { app, os, model };
}
const geoCache = new Map();
async function ipGeo(ip) {
  ip = String(ip || '').replace(/^::ffff:/, '');
  if (!ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/.test(ip)) return { city: '', country: '' };
  if (geoCache.has(ip)) return geoCache.get(ip);
  try { const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country,country_code`, { signal: AbortSignal.timeout(5000) }); const j = await r.json(); const g = j.success ? { city: j.city || j.region || '', country: j.country || '', cc: j.country_code || '' } : { city: '', country: '' }; geoCache.set(ip, g); if (geoCache.size > 3000) geoCache.delete(geoCache.keys().next().value); return g; }
  catch { return { city: '', country: '' }; }
}
async function createSession(req, user) {
  const id = crypto.randomBytes(12).toString('hex'); const ua = String(req.headers['user-agent'] || '').slice(0, 400);
  const d = deviceName(ua);
  await db.run('INSERT INTO sessions(id,user_id,ua,app,os,model,ip,city,country,created,last,revoked) VALUES(?,?,?,?,?,?,?,?,?,?,?,0)', [id, user.id, ua, d.app, d.os, d.model, req.ip || '', '', '', now(), now()]);
  ipGeo(req.ip).then(async (g) => {
    await db.run('UPDATE sessions SET city=?, country=? WHERE id=?', [g.city, g.country, id]);
    const u = await getUser(user.id);
    if (u && !u.reg_info) await db.run('UPDATE users SET reg_info=? WHERE id=?', [JSON.stringify({ at: u.created_at || now(), app: d.app, os: d.os, model: d.model, city: g.city, country: g.country, first: !user.name }), user.id]);
  }).catch(() => {});
  sessCache.set(id, { revoked: 0, last: now() });
  return id;
}
async function sessionOk(sid) {
  let c = sessCache.get(sid);
  if (!c) { const r = await db.get('SELECT revoked, last FROM sessions WHERE id=?', [sid]); c = r ? { revoked: Number(r.revoked), last: Number(r.last) } : { revoked: 1 }; sessCache.set(sid, c); }
  return !c.revoked;
}
function touchSession(sid, req) {
  const c = sessCache.get(sid); if (!c || now() - (c.last || 0) < 5 * 60e3) return; c.last = now();
  db.run('UPDATE sessions SET last=?, ip=? WHERE id=?', [now(), req?.ip || '', sid]).catch(() => {});
}
async function userFromToken(t) {
  const { uid, pv, sid } = jwt.verify(t, JWT_SECRET);
  const u = await getUser(uid);
  // baza yangilangan bo'lsa eski token boshqa odamga tegib qolmasligi uchun telefon ham tekshiriladi
  if (!u || hash(u.phone).slice(0, 12) !== pv) throw new Error('bad token');
  if (u.banned) throw new Error('banned');
  if (sid && !(await sessionOk(sid))) throw new Error('revoked');
  u._sid = sid || null;
  return u;
}
// Doimiy sessiya: token localStorage'dan tashqari HttpOnly cookie'da ham saqlanadi (Safari 7 kunlik tozalashidan himoya)
const COOKIE = 'birga_s';
function cookieToken(req) { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)birga_s=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
function setSession(req, res, token) {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: req.secure, maxAge: 365 * 24 * 3600e3, path: '/' });
}
// ===== Xavfsizlik kodi (ikki bosqichli himoya) =====
// Email/SMS kodidan keyin foydalanuvchi o'zi qo'ygan kod so'raladi. Kod scrypt bilan tuzlangan holda saqlanadi.
const PASS_MIN = 4, PASS_MAX = 64;
function hashPass(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return 'scrypt$' + salt + '$' + crypto.scryptSync(String(pw), salt, 32).toString('hex');
}
function checkPass(pw, stored) {
  const [, salt, h] = String(stored || '').split('$'); if (!salt || !h) return false;
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(String(pw), salt, 32));
}
// bir akkauntga noto'g'ri kod: 5 urinishdan keyin 15 daqiqa kutish (IP almashtirib taxmin qilib bo'lmasin)
const passFails = new Map();
function passLocked(uid) { const f = passFails.get(uid); return f && f.n >= 5 && Date.now() - f.at < 15 * 60e3 ? Math.ceil((15 * 60e3 - (Date.now() - f.at)) / 60e3) : 0; }
function passFail(uid) { const f = passFails.get(uid); const n = f && Date.now() - f.at < 15 * 60e3 ? f.n + 1 : 1; passFails.set(uid, { n, at: Date.now() }); }
// login muvaffaqiyatli: kod qo'yilgan bo'lsa token o'rniga 10 daqiqalik "chipta" beriladi
function finishLogin(req, res, user, isNew) {
  if (user.banned) return res.status(403).json({ error: tr(req.body?.lang, 'Bu akkaunt qoidalarni buzgani uchun bloklangan', 'Этот аккаунт заблокирован за нарушение правил', 'This account has been banned for violating the rules') });
  if (user.pass_hash) {
    const ticket = jwt.sign({ t2: user.id }, JWT_SECRET, { expiresIn: '10m' });
    return res.json({ need2fa: true, ticket, hint: user.pass_hint || '' });
  }
  createSession(req, user).then((sid) => { const token = tokenFor(user, sid); setSession(req, res, token); res.json({ token, user: publicUser(user, true), isNew }); }).catch((e) => { console.error('session:', e.message); res.status(500).json({ error: 'server' }); });
}

const auth = wrap(async (req, res, next) => {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '').trim();
  try { req.user = await userFromToken(bearer); }
  catch {
    try { req.user = await userFromToken(cookieToken(req)); } // localStorage tozalangan bo'lsa ham profil saqlanadi
    catch { return res.status(401).json({ error: 'unauthorized' }); }
  }
  req.sid = req.user._sid; if (req.sid) touchSession(req.sid, req);
  next();
});
app.post('/api/auth/logout', async (req, res) => {
  try { const t = (req.headers.authorization || '').replace('Bearer ', '').trim() || cookieToken(req); const { uid, sid } = jwt.verify(t, JWT_SECRET); if (sid) await revokeSessions(uid, [sid]); } catch {}
  res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true });
});

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => cb(null, crypto.randomBytes(16).toString('hex') + (path.extname(f.originalname) || '').slice(0, 8).replace(/[^.\w]/g, '')),
  }),
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || storage.maxMb) * 1024 * 1024 },
});

app.get('/api/config', (req, res) => res.json({ v: APP_VERSION, pushKey: push?.publicKey, devSms: !sms.anyReal, maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || storage.maxMb, email: !!mailer, gifs: !!process.env.TENOR_API_KEY }));
// Server va bazani "uyg'oq" ushlab turish uchun (cron-job.org shu manzilni chaqiradi)
// ===== /holat — oddiy odam uchun bitta sahifada tekshiruv (✅ / ⚠️ / ❌) =====
const STARTED = Date.now();
// ===== Android ilova (APK) =====
// Digital Asset Links: Birga ilovasi (uz.birga.app) shu sayt bilan bog'langan — ilova to'liq ekranli ochiladi (manzil qatorisiz)
const APK_SHA256 = (process.env.APK_SHA256 || '30:2B:1B:47:84:FF:7A:3D:1F:DC:C6:E2:36:44:7B:1B:36:50:1E:E0:65:92:55:0B:8E:33:6C:4D:E9:47:FC:FE').split(',').map((x) => x.trim()).filter(Boolean);
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').json([{ relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: 'uz.birga.app', sha256_cert_fingerprints: APK_SHA256 } }]);
});
// APK fayli (repo ildizida yoki public/ ichida bo'lsa)
// Yangi APK matn (base64) ko'rinishida ham yuklanishi mumkin: birga-apk.txt — GitHub'ga oddiy matn sifatida qo'yish oson
let apkB64 = null;
function apkFromText() {
  if (apkB64 !== null) return apkB64;
  apkB64 = false;
  for (const f of [path.join(__dirname, 'birga-apk.txt'), path.join(__dirname, 'public', 'birga-apk.txt')]) {
    try { const buf = Buffer.from(fs.readFileSync(f, 'utf8').replace(/[^A-Za-z0-9+/=]/g, ''), 'base64'); if (buf.length > 10000 && buf[0] === 0x50 && buf[1] === 0x4b) { apkB64 = buf; break; } } catch {}
  }
  return apkB64;
}
app.get('/birga.apk', (req, res) => {
  const txt = apkFromText();
  if (txt) { res.set({ 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': 'attachment; filename="Birga.apk"', 'Cache-Control': 'no-cache', 'Content-Length': txt.length }); return res.end(txt); }
  const f = [path.join(__dirname, 'birga.apk'), path.join(__dirname, 'public', 'birga.apk')].find((x) => fs.existsSync(x));
  if (!f) return res.redirect('https://raw.githubusercontent.com/coresani5-cloud/Birga/main/birga.apk');
  res.set({ 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': 'attachment; filename="Birga.apk"', 'Cache-Control': 'no-cache' });
  res.sendFile(f);
});

app.get('/holat', wrap(async (req, res) => {
  const rows = [];
  const add = (ok, name, text, fix = '') => rows.push({ ok, name, text, fix });
  try { await db.get('SELECT 1 AS ok'); add(db.kind === 'postgres' ? 1 : process.env.RENDER ? 0 : 2, 'Baza (profillar, xabarlar)', db.kind === 'postgres' ? 'Supabase/PostgreSQL — doimiy saqlanadi' : 'SQLite — server diskida',
    db.kind === 'postgres' ? '' : 'Render’da DATABASE_URL qo‘shing, aks holda server qayta ishga tushganda hamma profil o‘chadi'); }
  catch (e) { add(0, 'Baza', 'Ulanib bo‘lmadi: ' + e.message, 'DATABASE_URL ni tekshiring'); }
  if (storage.remote) {
    try { const f = path.join(UPLOAD_DIR, 'holat-' + crypto.randomBytes(4).toString('hex') + '.txt'); fs.writeFileSync(f, 'ok'); const u = await storage.save(f, 'text/plain'); await storage.remove(u, UPLOAD_DIR); add(1, 'Fayl ombori', 'Supabase Storage ishlayapti (yozish/o‘chirish sinovi o‘tdi)'); }
    catch (e) { add(0, 'Fayl ombori', 'Supabase Storage xatosi: ' + e.message.slice(0, 120), 'SUPABASE_URL va SUPABASE_SERVICE_KEY ni tekshiring'); }
  } else add(process.env.RENDER ? 0 : 2, 'Fayl ombori', 'Server diski', process.env.RENDER ? 'SUPABASE_URL va SUPABASE_SERVICE_KEY qo‘shing' : '');
  add(mailer ? 1 : 0, 'Email kodi', mailer ? mailProviders.map((p) => p.name).join(' → ') + ' orqali yuboriladi' : 'TEST rejimi — kod ekranda chiqadi (xavfsizlik kodi himoya qiladi)', mailer ? '' : 'BREVO_API_KEY yoki GMAIL_SCRIPT_URL qo‘shing');
  const turn = process.env.CF_TURN_KEY_ID || process.env.TURN_SECRET || process.env.TURN_URL;
  const pub = !turn && process.env.PUBLIC_TURN !== '0';
  add(turn ? 1 : pub ? 1 : 2, 'Qo‘ng‘iroqlar (TURN)', turn ? 'Ulangan — turli tarmoqlar orasida ham ulanadi' : pub ? 'Bepul Open Relay (oyiga ~20 GB) — turli tarmoqlar orasida ham ulanadi' : 'Ulanmagan — ba’zi mobil tarmoqlarda qo‘ng‘iroq ulanmasligi mumkin', turn ? '' : 'Ko‘proq hajm: Cloudflare TURN (oyiga 1000 GB bepul): CF_TURN_KEY_ID va CF_TURN_API_TOKEN');
  add(media.available ? 1 : 2, 'Ovoz/video qayta ishlash (ffmpeg)', media.available ? 'Bor' : 'Yo‘q — ba’zi ovozli xabarlar iPhone’da ochilmasligi mumkin');
  add(push ? 1 : 2, 'Bildirishnomalar (push)', push ? 'Tayyor' : 'O‘chiq');
  add(MEDIA_DELETE ? 1 : 2, 'Media saqlash', MEDIA_DELETE ? 'Qurilmalarda; yetkazilgach serverdan o‘chadi' : 'Hammasi serverda saqlanadi (MEDIA_KEEP=1)');
  add(JWT_SECRET ? 1 : 0, 'Kirish xavfsizligi', 'Sessiya kaliti o‘rnatilgan');
  const c = async (sql) => { try { return (await db.get(sql)).c; } catch { return '?'; } };
  const stats = { users: await c('SELECT COUNT(*) AS c FROM users WHERE name IS NOT NULL'), msgs: await c('SELECT COUNT(*) AS c FROM messages'), groups: await c("SELECT COUNT(*) AS c FROM chats WHERE type<>'private'"), online: online.size };
  const up = Math.round((Date.now() - STARTED) / 60000);
  const ic = ['❌', '✅', '⚠️'];
  const bad = rows.filter((r) => r.ok === 0).length;
  res.type('html').send(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Birga — holat</title>
<style>body{font-family:system-ui,sans-serif;background:#EEF2FA;color:#0F1C3A;margin:0;padding:16px}main{max-width:640px;margin:auto}h1{margin:8px 0 4px;color:#1F6BFF}
.top{padding:16px;border-radius:16px;color:#fff;background:${bad ? '#E5484D' : 'linear-gradient(135deg,#00A8D6,#1F6BFF,#8A2BE2)'};font-weight:700;font-size:18px;margin:12px 0}
.r{background:#fff;border-radius:14px;padding:12px 14px;margin:8px 0;display:flex;gap:12px}.r i{font-style:normal;font-size:22px}.r b{display:block}.r small{color:#6A7895}.fix{color:#C2410C;font-size:13.5px;margin-top:4px}
.st{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.st div{background:#fff;border-radius:14px;padding:10px;text-align:center}.st b{display:block;font-size:22px;color:#1F6BFF}.st small{color:#6A7895;font-size:12px}</style></head>
<body><main><h1>BIRGA — holat</h1><small>Server ishlayapti: ${up} daqiqa · ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</small>
<div class="top">${bad ? `❌ ${bad} ta muhim muammo bor — pastdagi qizil qatorlarni to‘g‘rilang` : '✅ Hammasi joyida — platforma ishlashga tayyor'}</div>
${rows.map((r) => `<div class="r"><i>${ic[r.ok]}</i><div><b>${r.name}</b><small>${r.text}</small>${r.fix ? `<div class="fix">👉 ${r.fix}</div>` : ''}</div></div>`).join('')}
<h3>Statistika</h3><div class="st"><div><b>${stats.users}</b><small>foydalanuvchi</small></div><div><b>${stats.online}</b><small>hozir onlayn</small></div><div><b>${stats.msgs}</b><small>xabar</small></div><div><b>${stats.groups}</b><small>guruh/kanal</small></div></div>
</main></body></html>`);
}));
app.get('/api/health', wrap(async (req, res) => { await db.get('SELECT 1 AS ok'); res.json({ ok: true, db: db.kind, storage: storage.remote ? 'supabase' : 'disk', email: mailer ? 'on' : 'test', media: MEDIA_DELETE ? 'device' : 'server' }); }));
app.get('/api/ice', auth, wrap(async (req, res) => { const [cf, mt] = await Promise.all([cloudflareIce(), meteredIce()]); res.json({ iceServers: [...iceServersFor(req.user.id), ...cf, ...mt], strong: !!(cf.length || mt.length || process.env.TURN_SECRET || process.env.TURN_URL) }); }));

// ===== 1) SMS kod =====
const SMS_PER_PHONE_DAY = Number(process.env.SMS_PER_PHONE_DAY) || 6;
const SMS_PER_IP_DAY = Number(process.env.SMS_PER_IP_DAY) || 12;
const SMS_PER_COUNTRY_HOUR = Number(process.env.SMS_PER_COUNTRY_HOUR) || 300;
const BLOCKED = new Set(String(process.env.SMS_BLOCKED_COUNTRIES || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));

app.post('/api/auth/send-code', rateLimit('code', 8, 3600e3), wrap(async (req, res) => {
  if (!sms.anyReal && process.env.ALLOW_DEV_SMS !== '1') return res.status(503).json({ error: tr(req.body?.lang, 'Raqam orqali kirish o‘chirilgan — email orqali kiring', 'Вход по номеру отключён — войдите через email', 'Phone sign-in is disabled — use email') });
  const lang = req.body.lang;
  const p = parsePhone(req.body.phone);
  if (!p) return res.status(400).json({ error: tr(lang, 'Telefon raqam noto‘g‘ri. Davlat va raqamni tekshiring', 'Неверный номер. Проверьте страну и номер', 'Invalid phone number. Check the country and number') });
  const phone = p.e164;
  if (p.country && BLOCKED.has(p.country)) return res.status(403).json({ error: tr(lang, 'Bu davlatga SMS vaqtincha yuborilmaydi', 'SMS в эту страну временно недоступны', 'SMS to this country is temporarily unavailable') });
  const prev = await db.get('SELECT * FROM codes WHERE phone=?', [phone]);
  if (prev && now() - prev.sent_at < 60_000)
    return res.status(429).json({ phone, error: tr(lang, 'Kod yuborilgan. Biroz kuting', 'Код уже отправлен. Подождите', 'Code already sent. Please wait'), wait: Math.ceil((60_000 - (now() - prev.sent_at)) / 1000) });
  const day = now() - 24 * 3600e3;
  const byPhone = (await db.get('SELECT COUNT(*) AS c FROM sms_log WHERE phone=? AND at>?', [phone, day])).c;
  const byIp = (await db.get('SELECT COUNT(*) AS c FROM sms_log WHERE ip=? AND at>?', [req.ip, day])).c;
  const byCountry = (await db.get('SELECT COUNT(*) AS c FROM sms_log WHERE country=? AND at>?', [p.country, now() - 3600e3])).c;
  if (byPhone >= SMS_PER_PHONE_DAY || byIp >= SMS_PER_IP_DAY || byCountry >= SMS_PER_COUNTRY_HOUR)
    return res.status(429).json({ error: tr(lang, 'Bugun juda ko‘p kod so‘raldi. Ertaga urinib ko‘ring', 'Слишком много запросов кода сегодня. Попробуйте завтра', 'Too many code requests today. Try again tomorrow') });
  const code = String(crypto.randomInt(10000, 100000));
  try { await sms.sendCode(phone, code, lang); }
  catch (e) { console.error('SMS:', e.message); return res.status(502).json({ error: tr(lang, 'SMS yuborib bo‘lmadi, keyinroq urinib ko‘ring', 'Не удалось отправить SMS, попробуйте позже', 'Could not send SMS, please try again later') }); }
  await db.run('INSERT INTO codes(phone,code_hash,expires,attempts,sent_at,email) VALUES(?,?,?,?,?,NULL) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, attempts=0, sent_at=excluded.sent_at, email=NULL',
    [phone, hash(phone + code), now() + 5 * 60_000, 0, now()]);
  await db.run('INSERT INTO sms_log(phone,ip,country,at) VALUES(?,?,?,?)', [phone, req.ip, p.country, now()]);
  const out = { ok: true, phone, country: p.country, timeout: 60 };
  if (sms.isDevFor(phone)) out.devCode = code;
  res.json(out);
}));

// ===== 1b) Kodni email orqali olish (SMS kelmasa — bepul, istalgan davlatdan) =====
let mailer = null;
// Email yuborish: bir nechta bepul xizmat ketma-ket sinab ko'riladi (biri limitga yetsa — keyingisi).
// 1) Brevo (kuniga 300) 2) Mailjet (kuniga 200) 3) Gmail — Google Apps Script orqali (kuniga 100) 4) SMTP (VPS uchun)
const mailProviders = [];
const fromParts = () => { const from = process.env.MAIL_FROM || ''; const m = from.match(/^(.*)<(.+)>$/); return m ? { name: m[1].trim() || 'Birga', email: m[2].trim() } : { name: 'Birga', email: from.trim() }; };
if (process.env.BREVO_API_KEY) mailProviders.push({ name: 'Brevo', async send({ to, subject, text, html }) {
  const r = await fetch(process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender: fromParts(), to: [{ email: to }], subject, textContent: text, htmlContent: html }) });
  if (!r.ok) throw new Error('Brevo ' + r.status + ' ' + (await r.text()).slice(0, 200));
} });
if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) mailProviders.push({ name: 'Mailjet', async send({ to, subject, text, html }) {
  const f = fromParts(); const r = await fetch('https://api.mailjet.com/v3.1/send', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(process.env.MAILJET_API_KEY + ':' + process.env.MAILJET_SECRET_KEY).toString('base64'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ Messages: [{ From: { Email: f.email, Name: f.name }, To: [{ Email: to }], Subject: subject, TextPart: text, HTMLPart: html }] }) });
  if (!r.ok) throw new Error('Mailjet ' + r.status + ' ' + (await r.text()).slice(0, 200));
} });
if (process.env.GMAIL_SCRIPT_URL) mailProviders.push({ name: 'Gmail', async send({ to, subject, text, html }) {
  const r = await fetch(process.env.GMAIL_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: process.env.GMAIL_SCRIPT_SECRET || '', to, subject, text, html }), redirect: 'follow' });
  const out = (await r.text()).slice(0, 200); if (!r.ok || !/ok/i.test(out)) throw new Error('Gmail script ' + r.status + ' ' + out);
} });
if (process.env.SMTP_HOST && process.env.SMTP_USER) { const nm = require('nodemailer'); const tp = nm.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 465, secure: (Number(process.env.SMTP_PORT) || 465) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  mailProviders.push({ name: 'SMTP', send: (m) => tp.sendMail({ from: process.env.MAIL_FROM || `Birga <${process.env.SMTP_USER}>`, ...m }) }); }
const mailDown = new Map(); // provayder -> qachongacha o'tkazib yuboriladi (limit tugagan)
if (mailProviders.length) mailer = { async sendMail(m) {
  const errs = [];
  for (const p of mailProviders) {
    if ((mailDown.get(p.name) || 0) > now()) continue;
    try { await p.send(m); return p.name; }
    catch (e) { errs.push(e.message); if (/\b(429|402|403|limit|quota|exceed)/i.test(e.message)) mailDown.set(p.name, now() + 3600e3); }
  }
  throw new Error(errs.join(' | ') || 'all providers down');
} };
app.post('/api/auth/send-email', rateLimit('email', 8, 3600e3), wrap(async (req, res) => {
  // eski "raqam + email" usuli: begona email orqali raqamli akkauntni egallab olish mumkin edi — yopildi
  return res.status(410).json({ error: tr(req.body?.lang, 'Bu usul o‘chirilgan — email orqali kiring', 'Этот способ отключён — войдите через email', 'This method is disabled — use email sign-in') });
  const lang = req.body.lang;
  if (!mailer) return res.status(503).json({ error: tr(lang, 'Email orqali kirish hozircha yoqilmagan', 'Вход через email пока не включён', 'Email sign-in is not enabled yet') });
  const p = parsePhone(req.body.phone);
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!p) return res.status(400).json({ error: tr(lang, 'Telefon raqam noto‘g‘ri', 'Неверный номер', 'Invalid phone number') });
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ error: tr(lang, 'Email noto‘g‘ri', 'Неверный email', 'Invalid email') });
  const user = await db.get('SELECT email FROM users WHERE phone=?', [p.e164]);
  if (user?.email && user.email !== email) return res.status(403).json({ error: tr(lang, 'Bu raqam boshqa email bilan bog‘langan. SMS orqali kiring', 'Этот номер привязан к другому email. Войдите через SMS', 'This number is linked to another email. Sign in via SMS') });
  const prev = await db.get('SELECT * FROM codes WHERE phone=?', [p.e164]);
  if (prev && prev.email === email && now() - prev.sent_at < 60_000) return res.status(429).json({ error: tr(lang, 'Biroz kuting', 'Подождите', 'Please wait'), wait: Math.ceil((60_000 - (now() - prev.sent_at)) / 1000) });
  const code = String(crypto.randomInt(10000, 100000));
  const subj = tr(lang, 'Birga kirish kodi', 'Код входа Birga', 'Your Birga code');
  const body = tr(lang, `Birga kirish kodi: ${code}\nRaqam: ${p.e164}\nKod 10 daqiqa amal qiladi. Uni hech kimga bermang.`, `Код входа Birga: ${code}\nНомер: ${p.e164}\nКод действует 10 минут. Никому его не сообщайте.`, `Your Birga code: ${code}\nNumber: ${p.e164}\nThe code is valid for 10 minutes. Do not share it.`);
  try {
    await mailer.sendMail({ from: process.env.MAIL_FROM || `Birga <${process.env.SMTP_USER}>`, to: email, subject: `${subj}: ${code}`, text: body,
      html: `<div style="font-family:sans-serif;font-size:16px"><p>${subj}:</p><p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p><p style="color:#777">${p.e164}</p></div>` });
  } catch (e) { console.error('Email:', e.message); return res.status(502).json({ error: tr(lang, 'Email yuborib bo‘lmadi', 'Не удалось отправить email', 'Could not send email') }); }
  await db.run('INSERT INTO codes(phone,code_hash,expires,attempts,sent_at,email) VALUES(?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, attempts=0, sent_at=excluded.sent_at, email=excluded.email',
    [p.e164, hash(p.e164 + code), now() + 10 * 60_000, 0, now(), email]);
  res.json({ ok: true, phone: p.e164 });
}));

// ===== 1c) EMAIL + KOD bilan kirish (asosiy usul) =====
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const EMAIL_PER_DAY = Number(process.env.EMAIL_PER_DAY) || 10;
const EMAIL_PER_IP_DAY = Number(process.env.EMAIL_PER_IP_DAY) || 30;
const normEmail = (e) => String(e || '').trim().toLowerCase();
async function mailCode(email, code, lang, extra = '') {
  const subj = tr(lang, 'Birga kirish kodi', 'Код входа Birga', 'Your Birga code');
  const body = tr(lang, `Birga kirish kodi: ${code}\nKod 10 daqiqa amal qiladi. Uni hech kimga bermang.`, `Код входа Birga: ${code}\nКод действует 10 минут. Никому его не сообщайте.`, `Your Birga code: ${code}\nThe code is valid for 10 minutes. Do not share it.`) + extra;
  await mailer.sendMail({ from: process.env.MAIL_FROM || `Birga <${process.env.SMTP_USER}>`, to: email, subject: `${subj}: ${code}`, text: body,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border-radius:18px;background:#f4f7ff;color:#0F1C3A"><h2 style="margin:0 0 6px;color:#1F6BFF;letter-spacing:2px">BIRGA</h2><p>${subj}:</p><p style="font-size:36px;font-weight:800;letter-spacing:8px;margin:10px 0">${code}</p><p style="color:#6A7895;font-size:13px">${tr(lang, 'Kod 10 daqiqa amal qiladi. Uni hech kimga bermang.', 'Код действует 10 минут. Никому его не сообщайте.', 'Valid for 10 minutes. Do not share it.')}</p></div>` });
}
const mxCache = new Map();
async function emailDomainReal(email) {
  const d = String(email).split('@')[1] || '';
  if (!d || !d.includes('.') || /^(example\.(com|org|net)|test\.com|localhost|mailinator\.com|10minutemail\.com|guerrillamail\.com|tempmail\.com|yopmail\.com)$/i.test(d)) return false;
  const c = mxCache.get(d); if (c && now() - c.at < 6 * 3600e3) return c.ok;
  const dns = require('dns').promises; let ok;
  const lim = (pr) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), 4000))]);
  try { ok = (await lim(dns.resolveMx(d))).length > 0; }
  catch (e) { if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') { try { ok = (await lim(dns.resolve4(d))).length > 0; } catch { ok = false; } } else ok = true; }
  mxCache.set(d, { ok, at: now() }); return ok;
}
async function issueEmailCode(req, res, key, email) {
  const lang = req.body.lang;
  if (!(await emailDomainReal(email))) return res.status(400).json({ error: tr(lang, 'Bunday email manzil topilmadi. Haqiqiy emailingizni kiriting', 'Такой email не найден. Введите настоящий email', 'This email address was not found. Enter your real email') });
  const prev = await db.get('SELECT * FROM codes WHERE phone=?', [key]);
  if (prev && now() - prev.sent_at < 60_000) return res.status(429).json({ email, error: tr(lang, 'Kod yuborilgan. Biroz kuting', 'Код уже отправлен. Подождите', 'Code already sent. Please wait'), wait: Math.ceil((60_000 - (now() - prev.sent_at)) / 1000) });
  const day = now() - 24 * 3600e3;
  const byMail = (await db.get('SELECT COUNT(*) AS c FROM sms_log WHERE phone=? AND at>?', [key, day])).c;
  const byIp = (await db.get("SELECT COUNT(*) AS c FROM sms_log WHERE ip=? AND country='EMAIL' AND at>?", [req.ip, day])).c;
  if (byMail >= EMAIL_PER_DAY || byIp >= EMAIL_PER_IP_DAY) return res.status(429).json({ error: tr(lang, 'Bugun juda ko‘p kod so‘raldi. Keyinroq urinib ko‘ring', 'Слишком много запросов. Попробуйте позже', 'Too many requests. Try again later') });
  const code = String(crypto.randomInt(10000, 100000));
  let fallback = false;
  try { if (!mailer) throw new Error('email xizmati ulanmagan'); await mailCode(email, code, lang); }
  catch (e) {
      console.error('Email:', e.message);
      // email xizmati yo'q yoki barcha xizmatlar limitga yetgan — avvalgi holat: kod ekranda (faqat xavfsizlik kodi bor yoki yangi akkauntlar uchun; ular baribir xavfsizlik kodi bilan himoyalangan)
      const u = key.startsWith('mail:') ? await db.get('SELECT pass_hash FROM users WHERE email=? ORDER BY id LIMIT 1', [email]) : null;
      if (process.env.DEV_CODES !== '0' && (!u || u.pass_hash)) fallback = 'down';
      else return res.status(502).json({ error: (u && !u.pass_hash) ? tr(lang, 'Bu akkauntda xavfsizlik kodi yo‘q, shuning uchun kod ekranda ko‘rsatilmaydi. Avval ilovaga kirgan qurilmangizda Sozlamalar → Xavfsizlik kodini o‘rnating.', 'В этом аккаунте нет кода безопасности, поэтому код не показывается на экране. Сначала задайте код безопасности в настройках на устройстве, где вы уже вошли.', 'This account has no security code yet, so the code is not shown on screen. Set a security code in Settings on a device where you are already signed in.') : tr(lang, 'Email yuborib bo‘lmadi. Keyinroq urinib ko‘ring', 'Не удалось отправить письмо. Попробуйте позже', 'Could not send the email. Try again later') });
  }
  if (fallback) console.log(`📧 [TEST EMAIL] ${email} → ${code}`);
  await db.run('INSERT INTO codes(phone,code_hash,expires,attempts,sent_at,email) VALUES(?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, attempts=0, sent_at=excluded.sent_at, email=excluded.email',
    [key, hash(key + code), now() + 10 * 60_000, 0, now(), email]);
  await db.run('INSERT INTO sms_log(phone,ip,country,at) VALUES(?,?,?,?)', [key, req.ip, 'EMAIL', now()]);
  const out = { ok: true, email, timeout: 60, sent: !fallback };
  // email xizmati ulanmagan yoki limit tugagan — kod ekranda. Admin akkauntlari uchun kod hech qachon ekranda ko'rsatilmaydi.
  if (fallback && process.env.DEV_CODES !== '0') { out.devCode = code; out.mailDown = fallback === 'down'; out.needSecurity = true; }
  res.json(out);
}
async function checkEmailCode(req, res, key) {
  const lang = req.body.lang;
  const code = String(req.body.code || '').trim();
  const row = await db.get('SELECT * FROM codes WHERE phone=?', [key]);
  if (!row) { res.status(400).json({ error: tr(lang, 'Avval kod so‘rang', 'Сначала запросите код', 'Request a code first') }); return false; }
  if (row.expires < now()) { res.status(400).json({ error: tr(lang, 'Kod muddati tugagan. Yangi kod so‘rang', 'Срок кода истёк. Запросите новый', 'The code has expired. Request a new one') }); return false; }
  if (row.attempts >= 5) { res.status(429).json({ error: tr(lang, 'Urinishlar ko‘p. Yangi kod so‘rang', 'Слишком много попыток. Запросите новый код', 'Too many attempts. Request a new code') }); return false; }
  if (!crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(hash(key + code)))) {
    await db.run('UPDATE codes SET attempts=attempts+1 WHERE phone=?', [key]);
    res.status(400).json({ error: tr(lang, 'Kod noto‘g‘ri', 'Неверный код', 'Wrong code') }); return false;
  }
  await db.run('DELETE FROM codes WHERE phone=?', [key]);
  return true;
}
app.post('/api/auth/email/send', rateLimit('email', 12, 3600e3), wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: tr(req.body.lang, 'Email manzil noto‘g‘ri', 'Неверный email', 'Invalid email address') });
  await issueEmailCode(req, res, 'mail:' + email, email);
}));
app.post('/api/auth/email/verify', rateLimit('verify', 30, 3600e3), wrap(async (req, res) => {
  const lang = req.body.lang;
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: tr(lang, 'Email manzil noto‘g‘ri', 'Неверный email', 'Invalid email address') });
  if (!(await checkEmailCode(req, res, 'mail:' + email))) return;
  let user = await db.get('SELECT * FROM users WHERE email=? ORDER BY id LIMIT 1', [email]);
  if (!user) {
    const id = await db.insert('INSERT INTO users(phone,country,lang,email,created_at,last_seen) VALUES(?,?,?,?,?,?)', ['mail:' + email, null, LANGS.includes(lang) ? lang : 'en', email, now(), now()]);
    user = await getUser(id);
  }
  finishLogin(req, res, user, !user.name);
}));
// Kirgan foydalanuvchi emailini bog'lashi/almashtirishi (eski raqam bilan kirganlar uchun)
app.post('/api/me/email/send', auth, rateLimit('email', 12, 3600e3), wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: tr(req.body.lang, 'Email manzil noto‘g‘ri', 'Неверный email', 'Invalid email address') });
  const other = await db.get('SELECT id FROM users WHERE email=? AND id<>?', [email, req.user.id]);
  if (other) return res.status(400).json({ error: tr(req.body.lang, 'Bu email boshqa profilga bog‘langan', 'Этот email привязан к другому профилю', 'This email is linked to another profile') });
  await issueEmailCode(req, res, 'bind:' + req.user.id + ':' + email, email);
}));
app.post('/api/me/email/verify', auth, rateLimit('verify', 30, 3600e3), wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!(await checkEmailCode(req, res, 'bind:' + req.user.id + ':' + email))) return;
  if (await db.get('SELECT id FROM users WHERE email=? AND id<>?', [email, req.user.id])) return res.status(400).json({ error: tr(req.body.lang, 'Bu email boshqa profilga bog‘langan', 'Этот email привязан к другому профилю', 'This email is linked to another profile') });
  await db.run('UPDATE users SET email=? WHERE id=?', [email, req.user.id]);
  const u = await getUser(req.user.id);
  res.json(publicUser(u, true));
}));

// ===== 2) Kodni tekshirish =====
app.post('/api/auth/verify', rateLimit('verify', 30, 3600e3), wrap(async (req, res) => {
  const lang = req.body.lang;
  const p = parsePhone(req.body.phone);
  const phone = p?.e164;
  const code = String(req.body.code || '').trim();
  const row = phone && await db.get('SELECT * FROM codes WHERE phone=?', [phone]);
  if (!row) return res.status(400).json({ error: tr(lang, 'Avval kod so‘rang', 'Сначала запросите код', 'Request a code first') });
  if (row.expires < now()) return res.status(400).json({ error: tr(lang, 'Kod muddati tugagan. Yangi kod so‘rang', 'Срок кода истёк. Запросите новый', 'The code has expired. Request a new one') });
  if (row.attempts >= 5) return res.status(429).json({ error: tr(lang, 'Urinishlar ko‘p. Yangi kod so‘rang', 'Слишком много попыток. Запросите новый код', 'Too many attempts. Request a new code') });
  if (!crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(hash(phone + code)))) {
    await db.run('UPDATE codes SET attempts=attempts+1 WHERE phone=?', [phone]);
    return res.status(400).json({ error: tr(lang, 'Kod noto‘g‘ri', 'Неверный код', 'Wrong code') });
  }
  let user = await db.get('SELECT * FROM users WHERE phone=?', [phone]);
  // Email orqali kirish: raqam boshqa email bilan bog'langan bo'lsa ruxsat yo'q (raqam egasi SMS bilan kiradi)
  if (row.email && user?.email && user.email !== row.email)
    return res.status(403).json({ error: tr(lang, 'Bu raqam boshqa email bilan bog‘langan. SMS orqali kiring', 'Этот номер привязан к другому email. Войдите через SMS', 'This number is linked to another email. Sign in via SMS') });
  await db.run('DELETE FROM codes WHERE phone=?', [phone]);
  if (!user) {
    const id = await db.insert('INSERT INTO users(phone,country,lang,email,created_at,last_seen) VALUES(?,?,?,?,?,?)', [phone, p.country, LANGS.includes(lang) ? lang : 'en', row.email || null, now(), now()]);
    user = await getUser(id);
  } else if (row.email && !user.email) await db.run('UPDATE users SET email=? WHERE id=?', [row.email, user.id]);
  else if (!row.email && user.email) await db.run('UPDATE users SET email=NULL WHERE id=?', [user.id]); // SMS bilan kirgan haqiqiy egasi
  finishLogin(req, res, user, !user.name);
}));

// 2-bosqich: xavfsizlik kodini tekshirish
app.post('/api/auth/2fa', rateLimit('2fa', 30, 3600e3), wrap(async (req, res) => {
  const lang = req.body.lang;
  let uid;
  try { uid = jwt.verify(String(req.body.ticket || ''), JWT_SECRET).t2; } catch {}
  const user = uid && await getUser(uid);
  if (!user || user.deleted) return res.status(400).json({ error: tr(lang, 'Vaqt tugadi. Qaytadan kiring', 'Время истекло. Войдите заново', 'Session expired. Please sign in again'), expired: true });
  if (!user.pass_hash) return finishLogin(req, res, user, !user.name);
  const wait = passLocked(user.id);
  if (wait) return res.status(429).json({ error: tr(lang, `Urinishlar ko‘p. ${wait} daqiqadan keyin qayta urining`, `Слишком много попыток. Повторите через ${wait} мин`, `Too many attempts. Try again in ${wait} min`) });
  if (!checkPass(req.body.password, user.pass_hash)) {
    passFail(user.id);
    return res.status(400).json({ error: tr(lang, 'Xavfsizlik kodi noto‘g‘ri', 'Неверный код безопасности', 'Wrong security code') });
  }
  passFails.delete(user.id);
  const sid = await createSession(req, user);
  const token = tokenFor(user, sid); setSession(req, res, token);
  res.json({ token, user: publicUser(user, true), isNew: !user.name });
}));
// Xavfsizlik kodini qo'yish / almashtirish / o'chirish (eskisi bo'lsa — eskisini kiritish shart)
app.post('/api/me/2fa', auth, rateLimit('2faset', 20, 3600e3), wrap(async (req, res) => {
  const lang = req.body.lang; const u = req.user;
  if (u.pass_hash) {
    const wait = passLocked(u.id);
    if (wait) return res.status(429).json({ error: tr(lang, `Urinishlar ko‘p. ${wait} daqiqadan keyin qayta urining`, `Слишком много попыток. Повторите через ${wait} мин`, `Too many attempts. Try again in ${wait} min`) });
    if (!checkPass(req.body.current, u.pass_hash)) { passFail(u.id); return res.status(400).json({ error: tr(lang, 'Joriy kod noto‘g‘ri', 'Текущий код неверный', 'Current code is wrong') }); }
    passFails.delete(u.id);
  }
  if (req.body.off) {
    if (process.env.ALLOW_2FA_OFF !== '1') return res.status(400).json({ error: tr(lang, 'Xavfsizlik kodi majburiy — uni faqat almashtirish mumkin', 'Код безопасности обязателен — его можно только изменить', 'The security code is required — you can only change it') });
    await db.run('UPDATE users SET pass_hash=NULL, pass_hint=NULL WHERE id=?', [u.id]);
  } else {
    const pw = String(req.body.password || '');
    if (pw.length < PASS_MIN || pw.length > PASS_MAX) return res.status(400).json({ error: tr(lang, `Kod ${PASS_MIN}–${PASS_MAX} belgidan iborat bo‘lsin`, `Код должен быть от ${PASS_MIN} до ${PASS_MAX} символов`, `The code must be ${PASS_MIN}–${PASS_MAX} characters`) });
    const hint = String(req.body.hint || '').trim().slice(0, 64);
    if (hint && hint.toLowerCase() === pw.toLowerCase()) return res.status(400).json({ error: tr(lang, 'Eslatma kodning o‘zi bo‘lmasin', 'Подсказка не должна совпадать с кодом', 'The hint must not be the code itself') });
    await db.run('UPDATE users SET pass_hash=?, pass_hint=? WHERE id=?', [hashPass(pw), hint || null, u.id]);
  }
  res.json(publicUser(await getUser(u.id), true));
}));

// har safar ochilganda token yangilanadi — faol foydalanuvchi hech qachon chiqib ketmaydi
app.get('/api/me', auth, wrap(async (req, res) => { const sid = req.sid || (await createSession(req, req.user)); const token = tokenFor(req.user, sid); setSession(req, res, token); res.json({ ...publicUser(req.user, true), token }); }));
// Qurilmalar paneli
app.get('/api/sessions', auth, wrap(async (req, res) => {
  const rows = await db.all('SELECT * FROM sessions WHERE user_id=? AND revoked=0 ORDER BY last DESC LIMIT 50', [req.user.id]);
  let reg = null; try { reg = JSON.parse(req.user.reg_info || 'null'); } catch {}
  res.json({ current: req.sid, created: Number(req.user.created_at) || null, reg, list: rows.map((r) => ({ id: r.id, app: r.app, os: r.os, model: r.model, city: r.city, country: r.country, created: Number(r.created), last: Number(r.last), online: [...io.sockets.sockets.values()].some((x) => x.sid === r.id) })) });
}));
async function revokeSessions(uid, ids) {
  for (const id of ids) { await db.run('UPDATE sessions SET revoked=1 WHERE id=? AND user_id=?', [id, uid]); sessCache.set(id, { revoked: 1 }); }
  for (const s2 of io.sockets.sockets.values()) if (s2.uid === uid && ids.includes(s2.sid)) s2.disconnect(true);
  await db.run('DELETE FROM native_devices WHERE user_id=? AND sid IN (' + ids.map(() => '?').join(',') + ')', [uid, ...ids]).catch(() => {});
}
app.post('/api/sessions/revoke', auth, wrap(async (req, res) => {
  const all = !!req.body?.others; const id = String(req.body?.id || '');
  const ids = all ? (await db.all('SELECT id FROM sessions WHERE user_id=? AND revoked=0 AND id<>?', [req.user.id, req.sid || ''])).map((r) => r.id) : id && id !== req.sid ? [id] : [];
  if (ids.length) await revokeSessions(req.user.id, ids);
  res.json({ ok: true, n: ids.length });
}));

// ===== 3) Profil =====
app.post('/api/profile', auth, wrap(async (req, res) => {
  const lang = req.body.lang || req.user.lang;
  const name = String(req.body.name || '').trim().slice(0, 64);
  let username = String(req.body.username || '').trim().replace(/^@/, '').toLowerCase();
  const bio = String(req.body.bio ?? req.user.bio ?? '').slice(0, 140);
  if (!name) return res.status(400).json({ error: tr(lang, 'Ism kiriting', 'Введите имя', 'Enter your name') });
  if (username) {
    if (!/^[a-z][a-z0-9_]{4,31}$/.test(username))
      return res.status(400).json({ error: tr(lang, 'Username: 5–32 belgi, lotin harflari, raqam va _ (harf bilan boshlansin)', 'Username: 5–32 символа, латиница, цифры и _ (начинается с буквы)', 'Username: 5–32 characters, latin letters, digits and _ (start with a letter)') });
    if (await db.get('SELECT id FROM users WHERE username=? AND id<>?', [username, req.user.id]))
      return res.status(400).json({ error: tr(lang, 'Bu username band', 'Этот username занят', 'This username is taken') });
  } else username = null;
  const newLang = LANGS.includes(req.body.lang) ? req.body.lang : req.user.lang;
  await db.run('UPDATE users SET name=?, username=?, bio=?, lang=?, search=? WHERE id=?', [name, username, bio, newLang, db.searchKey(name, username), req.user.id]);
  if (!req.user.name) { broadcastUserCount(); joinedByInvite(req.user.id, req.body.ref).catch((e) => console.error('invite:', e.message)); } // yangi foydalanuvchi ro'yxatdan o'tdi
  const u = await getUser(req.user.id);
  broadcastUser(u);
  res.json(publicUser(u, true));
}));

// ===== Birga Android ilovasi (brauzersiz): fon xizmati uchun bildirishnomalar (long-poll) =====
const nativeQ = new Map(); // uid -> { list: [], waiters: Set }
function nativeEnqueue(uid, payload) {
  const q = nativeQ.get(uid); if (!q) return; // faqat ilovasi bor (poll qilayotgan) foydalanuvchilar uchun
  const ev = { ...payload, at: now() + Math.random() };
  q.list.push(ev); q.list = q.list.filter((x) => now() - x.at < 15 * 60e3).slice(-40);
  q.waiters.forEach((w) => w()); q.waiters.clear();
}
app.post('/api/native/register', auth, wrap(async (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  if (req.sid) await db.run('DELETE FROM native_devices WHERE sid=?', [req.sid]);
  await db.run('INSERT INTO native_devices(token,user_id,sid,model,created,last) VALUES(?,?,?,?,?,?)', [token, req.user.id, req.sid || null, String(req.body?.model || '').slice(0, 80), now(), now()]);
  res.json({ token });
}));
app.post('/api/native/unregister', wrap(async (req, res) => { await db.run('DELETE FROM native_devices WHERE token=?', [String(req.body?.t || '')]); res.json({ ok: true }); }));
const nativeTok = new Map();
app.get('/api/native/poll', wrap(async (req, res) => {
  const t = String(req.query.t || ''); if (!/^[a-f0-9]{48}$/.test(t)) return res.status(401).json({ error: 'token' });
  let d = nativeTok.get(t);
  if (!d || now() - d.at > 10 * 60e3) { const r = await db.get('SELECT user_id, sid FROM native_devices WHERE token=?', [t]); if (!r) { nativeTok.delete(t); return res.status(401).json({ error: 'token' }); } d = { uid: Number(r.user_id), sid: r.sid, at: now() }; nativeTok.set(t, d); db.run('UPDATE native_devices SET last=? WHERE token=?', [now(), t]).catch(() => {}); }
  if (d.sid && !(await sessionOk(d.sid))) { nativeTok.delete(t); return res.status(401).json({ error: 'revoked' }); }
  const since = Number(req.query.since) || now() - 60e3;
  const q = nativeQ.get(d.uid) || { list: [], waiters: new Set() }; nativeQ.set(d.uid, q);
  const pick = () => q.list.filter((x) => x.at > since);
  let evs = pick();
  if (!evs.length) {
    await new Promise((r) => { const w = () => { clearTimeout(tm); r(); }; const tm = setTimeout(() => { q.waiters.delete(w); r(); }, 25000); q.waiters.add(w); req.on('close', () => { clearTimeout(tm); q.waiters.delete(w); r(); }); });
    evs = pick();
  }
  res.set('Cache-Control', 'no-store'); res.json({ events: evs, now: evs.length ? Math.max(...evs.map((x) => x.at)) : since });
}));

// ===== Qo'ng'iroqlar tarixi =====
app.get('/api/calls', auth, wrap(async (req, res) => {
  const uid = req.user.id;
  const rows = await db.all(`SELECT m.*, c.type AS ctype, c.title AS ctitle, c.avatar AS cavatar FROM messages m JOIN chat_members cm ON cm.chat_id=m.chat_id AND cm.user_id=? JOIN chats c ON c.id=m.chat_id
    WHERE m.type='call' AND m.deleted=0 AND m.id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY m.id DESC LIMIT 200`, [uid, uid]);
  const out = [];
  for (const r of rows) {
    const meta = r.meta ? JSON.parse(r.meta) : {};
    let peer = null;
    if (r.ctype === 'private') { const pid = await privatePeer(r.chat_id, uid); const pu = pid && (await getUser(pid)); if (pu) peer = publicUser(pu); }
    out.push({ id: Number(r.id), chatId: Number(r.chat_id), at: Number(r.created_at), out: Number(r.sender_id) === uid, video: !!meta.video, status: meta.status || '', duration: Number(r.duration) || 0, group: !!meta.group,
      peer, chat: r.ctype !== 'private' ? { id: Number(r.chat_id), title: r.ctitle, avatar: r.cavatar, type: r.ctype } : null });
  }
  res.json({ calls: out });
}));
// ===== Chat papkalari (Ish, Oila, Biznes...) — akkauntga saqlanadi, barcha qurilmalarda bir xil =====
app.get('/api/folders', auth, wrap(async (req, res) => { let f = []; try { f = JSON.parse(req.user.folders || '[]'); } catch {} res.json({ folders: f }); }));
app.post('/api/folders', auth, wrap(async (req, res) => {
  const list = (Array.isArray(req.body?.folders) ? req.body.folders : []).slice(0, 20).map((f) => ({ id: String(f.id || '').replace(/[^\w-]/g, '').slice(0, 24) || crypto.randomBytes(4).toString('hex'), name: String(f.name || '').trim().slice(0, 24), emoji: String(f.emoji || '📁').slice(0, 8),
    chats: [...new Set((Array.isArray(f.chats) ? f.chats : []).map(Number).filter((x) => x > 0))].slice(0, 500), types: (Array.isArray(f.types) ? f.types : []).filter((x) => ['private', 'group', 'channel', 'unread'].includes(x)) })).filter((f) => f.name);
  await db.run('UPDATE users SET folders=? WHERE id=?', [JSON.stringify(list), req.user.id]);
  res.json({ folders: list });
}));
// ===== Hudud va ob-havo (Open-Meteo, bepul) =====
app.post('/api/profile/region', auth, wrap(async (req, res) => {
  const lat = Number(req.body?.lat), lon = Number(req.body?.lon), name = String(req.body?.name || '').trim().slice(0, 60);
  if (!name || !(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return res.status(400).json({ error: 'bad' });
  const region = { name, lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 };
  await db.run('UPDATE users SET region=? WHERE id=?', [JSON.stringify(region), req.user.id]);
  res.json({ region });
}));
const wxCache = new Map();
const MET_CODE = (s) => { s = String(s || '').replace(/_(day|night|polartwilight)$/, ''); if (/thunder/.test(s)) return 95; if (/snow/.test(s)) return /heavy/.test(s) ? 75 : 73; if (/sleet/.test(s)) return 67; if (/heavyrain/.test(s)) return 65; if (/rainshowers/.test(s)) return 80; if (/lightrain/.test(s)) return 61; if (/rain/.test(s)) return 63; if (s === 'fog') return 45; if (s === 'clearsky') return 0; if (s === 'fair') return 1; if (s === 'partlycloudy') return 2; if (s === 'cloudy') return 3; return 2; };
async function metNoWeather(reg) {
  const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${reg.lat.toFixed(3)}&lon=${reg.lon.toFixed(3)}`, { headers: { 'User-Agent': 'Birga/1.0 github.com/coresani5-cloud/Birga' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('met ' + r.status);
  const ts = (await r.json()).properties.timeseries; const c0 = ts[0].data; const det = c0.instant.details;
  const sym = c0.next_1_hours?.summary?.symbol_code || c0.next_6_hours?.summary?.symbol_code || '';
  const byDay = new Map();
  for (const t of ts) {
    const d = t.time.slice(0, 10), v = t.data.instant.details.air_temperature, o = byDay.get(d) || { d, max: -99, min: 99, code: null, rain: 0 };
    o.max = Math.max(o.max, v); o.min = Math.min(o.min, v);
    const s6 = t.data.next_6_hours?.summary?.symbol_code; if (s6 && (!o.code || t.time.slice(11, 13) === '12')) o.code = s6;
    const pr = t.data.next_6_hours?.details?.precipitation_amount; if (pr) o.rain = Math.max(o.rain, pr > 0.2 ? 60 : 20);
    byDay.set(d, o);
  }
  const days = [...byDay.values()].slice(0, 4).map((o) => ({ d: o.d, code: MET_CODE(o.code || sym), max: o.max, min: o.min, rain: o.rain }));
  return { cur: { t: det.air_temperature, feels: det.air_temperature, hum: Math.round(det.relative_humidity ?? 0), code: MET_CODE(sym), wind: det.wind_speed ?? 0, day: !/_night$/.test(sym) }, days, sun: {}, at: now() };
}
app.get('/api/weather', auth, wrap(async (req, res) => {
  let reg = null; try { reg = JSON.parse(req.user.region || 'null'); } catch {}
  if (!reg) return res.json({ region: null });
  const key = reg.lat.toFixed(2) + ',' + reg.lon.toFixed(2);
  const c = wxCache.get(key); if (c && now() - c.at < 15 * 60e3) return res.json({ region: reg, ...c.data });
  try {
    const u = `${process.env.WEATHER_API || 'https://api.open-meteo.com'}/v1/forecast?latitude=${reg.lat}&longitude=${reg.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=4&wind_speed_unit=ms`;
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('wx ' + r.status); const j = await r.json();
    const data = { cur: { t: j.current.temperature_2m, feels: j.current.apparent_temperature, hum: j.current.relative_humidity_2m, code: j.current.weather_code, wind: j.current.wind_speed_10m, day: !!j.current.is_day },
      days: j.daily.time.map((d, i) => ({ d, code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], rain: j.daily.precipitation_probability_max?.[i] ?? null })),
      sun: { rise: j.daily.sunrise?.[0], set: j.daily.sunset?.[0] }, at: now() };
    wxCache.set(key, { at: now(), data }); if (wxCache.size > 500) wxCache.delete(wxCache.keys().next().value);
    res.json({ region: reg, ...data });
  } catch (e) {
    console.error('weather:', e.message);
    try { const d2 = await metNoWeather(reg); wxCache.set(key, { at: now(), data: d2 }); return res.json({ region: reg, ...d2 }); } catch (e2) { console.error('weather met.no:', e2.message); }
    if (c) return res.json({ region: reg, ...c.data, stale: true }); res.status(503).json({ region: reg, error: 'weather_unavailable' });
  }
}));

// ===== Do'stlarni taklif qilish =====
async function inviteCode(u) {
  if (u.invite_code) return u.invite_code;
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, '').slice(0, 7).toLowerCase();
    if (code.length < 6 || (await db.get('SELECT id FROM users WHERE invite_code=?', [code]))) continue;
    await db.run('UPDATE users SET invite_code=? WHERE id=?', [code, u.id]); return code;
  }
  throw new Error('code');
}
async function joinedByInvite(newId, ref) {
  ref = String(ref || '').toLowerCase(); if (!/^[a-z0-9]{6,12}$/.test(ref)) return;
  const inv = await db.get('SELECT * FROM users WHERE invite_code=?', [ref]);
  if (!inv || inv.id === newId || inv.deleted || inv.banned) return;
  await db.run('UPDATE users SET invited_by=? WHERE id=? AND invited_by IS NULL', [inv.id, newId]);
  const me = await getUser(newId);
  const cid = await privateChatId(newId, inv.id);
  await saveMessage(cid, newId, { type: 'text', text: tr(inv.lang, `👋 Salom! Taklifingiz bilan Birga’ga qo‘shildim`, `👋 Привет! Я присоединился к Birga по вашему приглашению`, `👋 Hi! I joined Birga with your invite`) }, null);
  for (const p of [newId, inv.id]) io.to('u' + p).emit('chat:update', await chatSummary(cid, p));
  void me;
}
app.get('/api/invite', auth, wrap(async (req, res) => {
  const code = await inviteCode(req.user);
  const base = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
  const rows = await db.all('SELECT * FROM users WHERE invited_by=? AND name IS NOT NULL AND COALESCE(deleted,0)=0 ORDER BY id DESC LIMIT 50', [req.user.id]);
  const n = Number((await db.get('SELECT COUNT(*) AS c FROM users WHERE invited_by=? AND name IS NOT NULL', [req.user.id])).c);
  res.json({ code, link: `${base.replace(/\/$/, '')}/?ref=${code}`, count: n, list: rows.map((u) => publicUser(u)) });
}));
app.get('/api/invite/:code', wrap(async (req, res) => { // taklif sahifasi uchun: kim taklif qildi
  const u = await db.get('SELECT * FROM users WHERE invite_code=?', [String(req.params.code || '').toLowerCase()]);
  if (!u || u.deleted || u.banned || !u.name) return res.status(404).json({ error: 'not_found' });
  res.json({ name: u.name, avatar: u.avatar });
}));

// ===== Kontaktlarni sinxronlash: telefon kontaktlaridan kim Birga'da borligini topish (kontaktlar serverda saqlanmaydi) =====
app.post('/api/contacts/match', auth, rateLimit('cmatch', 30, 3600e3), wrap(async (req, res) => {
  const country = req.user.country || 'UZ';
  const phones = new Set(), emails = new Set();
  for (const x of (Array.isArray(req.body?.phones) ? req.body.phones : []).slice(0, 1000)) { const p = parsePhone(String(x), country); if (p) phones.add(p.e164); }
  for (const x of (Array.isArray(req.body?.emails) ? req.body.emails : []).slice(0, 1000)) { const e = String(x).trim().toLowerCase(); if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) emails.add(e); }
  const found = new Map();
  const chunk = (arr) => { const out = []; for (let i = 0; i < arr.length; i += 100) out.push(arr.slice(i, i + 100)); return out; };
  for (const part of chunk([...phones])) for (const u of await db.all(`SELECT * FROM users WHERE phone IN (${part.map(() => '?').join(',')})`, part)) found.set(u.id, u);
  for (const part of chunk([...emails])) for (const u of await db.all(`SELECT * FROM users WHERE LOWER(email) IN (${part.map(() => '?').join(',')}) OR phone IN (${part.map(() => '?').join(',')})`, [...part, ...part.map((e) => 'mail:' + e)])) found.set(u.id, u);
  const out = [];
  for (const u of found.values()) {
    if (u.id === req.user.id || !u.name || u.deleted || u.banned) continue;
    if (await isBlocked(u.id, req.user.id)) continue;
    out.push(publicUser(u));
  }
  res.json({ users: out, checked: phones.size + emails.size });
}));

app.post('/api/profile/lang', auth, wrap(async (req, res) => {
  if (LANGS.includes(req.body.lang)) await db.run('UPDATE users SET lang=? WHERE id=?', [req.body.lang, req.user.id]);
  res.json({ ok: true });
}));

app.post('/api/profile/avatar/delete', auth, wrap(async (req, res) => {
  if (req.user.avatar) safeRemove(req.user.avatar);
  await db.run('UPDATE users SET avatar=NULL WHERE id=?', [req.user.id]);
  const u = await getUser(req.user.id);
  broadcastUser(u);
  res.json(publicUser(u, true));
}));
app.post('/api/profile/avatar', auth, upload.single('file'), wrap(async (req, res) => {
  if (!req.file || !/^image\//.test(req.file.mimetype)) return res.status(400).json({ error: 'image required' });
  const url = await storage.save(req.file.path, req.file.mimetype);
  if (req.user.avatar) safeRemove(req.user.avatar);
  await db.run('UPDATE users SET avatar=? WHERE id=?', [url, req.user.id]);
  const u = await getUser(req.user.id);
  broadcastUser(u);
  res.json(publicUser(u, true));
}));

// Global qidiruv: username, ism yoki telefon raqam bo'yicha
app.get('/api/users/search', auth, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  if (/^[+\d\s()-]{6,}$/.test(q)) {
    const p = parsePhone(q, req.user.country || undefined) || parsePhone(q);
    const u = p && await db.get('SELECT * FROM users WHERE phone=? AND name IS NOT NULL', [p.e164]);
    return res.json(u ? [publicUser(u)] : []);
  }
  const t = q.replace(/^@/, '').toLowerCase().replace(/[%_]/g, '');
  if (!t) return res.json([]);
  const rows = await db.all(`SELECT * FROM users WHERE name IS NOT NULL AND id<>? AND (username LIKE ? OR search LIKE ?)
    ORDER BY CASE WHEN username=? THEN 0 WHEN username LIKE ? THEN 1 ELSE 2 END, last_seen DESC LIMIT 30`, [req.user.id, t + '%', '%' + t + '%', t, t + '%']);
  res.json(rows.map((u) => publicUser(u)));
}));

app.get('/api/users/:id', auth, wrap(async (req, res) => {
  const u = await getUser(req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  const chat = await privateChatId(req.user.id, u.id, false);
  const ct = u.id === req.user.id ? null : await db.get('SELECT name FROM contacts WHERE owner_id=? AND user_id=?', [req.user.id, u.id]);
  res.json({ ...publicUser(u, u.id === req.user.id), chatId: chat || null, contactName: ct?.name || null });
}));

// Kontaktlar = telefon kontaktlaridan topilganlar + shaxsiy yozishgan odamlar
app.get('/api/contacts', auth, wrap(async (req, res) => {
  const saved = await db.all('SELECT u.*, c.name AS contact_name FROM contacts c JOIN users u ON u.id=c.user_id WHERE c.owner_id=? AND u.name IS NOT NULL', [req.user.id]);
  const peers = await db.all(`SELECT DISTINCT u.* FROM chat_members a JOIN chats ch ON ch.id=a.chat_id AND ch.type='private' JOIN chat_members b ON a.chat_id=b.chat_id AND b.user_id<>a.user_id
    JOIN users u ON u.id=b.user_id WHERE a.user_id=? AND u.name IS NOT NULL`, [req.user.id]);
  const map = new Map();
  for (const u of peers) map.set(u.id, publicUser(u));
  for (const u of saved) map.set(u.id, { ...publicUser(u), contactName: u.contact_name });
  res.json([...map.values()]);
}));
// Boshqa odamning ismini faqat o'zim uchun o'zgartirish (bo'sh ism — asl ismga qaytish)
app.post('/api/contacts/:id/name', auth, rateLimit('cname', 120, 3600e3), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const u = id && id !== req.user.id ? await getUser(id) : null;
  if (!u) return res.status(404).json({ error: 'not found' });
  const name = String(req.body?.name || '').replace(/\s+/g, ' ').trim().slice(0, 64) || null;
  await db.run('INSERT INTO contacts(owner_id,user_id,name,created) VALUES(?,?,?,?) ON CONFLICT(owner_id,user_id) DO UPDATE SET name=excluded.name', [req.user.id, id, name, now()]);
  res.json({ ok: true, id, contactName: name });
}));
// Telefon kontaktlaridan Birga'dagilarni topish (raqamlar saqlanmaydi, faqat topilgan foydalanuvchi bog'lanadi)
app.post('/api/contacts/match', auth, rateLimit('cmatch', 20, 3600e3), wrap(async (req, res) => {
  const list = Array.isArray(req.body.contacts) ? req.body.contacts.slice(0, 3000) : [];
  const byPhone = new Map();
  for (const c of list) for (const tel of [].concat(c.tel || []).slice(0, 5)) {
    const p = parsePhone(String(tel), req.user.country || undefined) || parsePhone(String(tel));
    if (p && !byPhone.has(p.e164)) byPhone.set(p.e164, String(c.name || '').slice(0, 64));
  }
  const phones = [...byPhone.keys()];
  const found = [];
  for (let i = 0; i < phones.length; i += 200) {
    const chunk = phones.slice(i, i + 200);
    const rows = await db.all(`SELECT * FROM users WHERE name IS NOT NULL AND id<>? AND phone IN (${chunk.map(() => '?').join(',')})`, [req.user.id, ...chunk]);
    for (const u of rows) {
      const name = byPhone.get(u.phone) || null;
      await db.run('INSERT INTO contacts(owner_id,user_id,name,created) VALUES(?,?,?,?) ON CONFLICT(owner_id,user_id) DO UPDATE SET name=COALESCE(contacts.name, excluded.name)', [req.user.id, u.id, name, now()]);
      const row = await db.get('SELECT name FROM contacts WHERE owner_id=? AND user_id=?', [req.user.id, u.id]);
      found.push({ ...publicUser(u), contactName: row?.name || name });
    }
  }
  res.json({ found, checked: phones.length });
}));

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '😡'];
async function reactionsFor(ids) {
  const out = new Map(); if (!ids.length) return out;
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const rows = await db.all(`SELECT message_id, user_id, emoji FROM reactions WHERE message_id IN (${chunk.map(() => '?').join(',')}) ORDER BY at`, chunk);
    for (const r of rows) { const o = out.get(r.message_id) || {}; (o[r.emoji] ||= []).push(r.user_id); out.set(r.message_id, o); }
  }
  return out;
}
async function withReactions(list) {
  const map = await reactionsFor(list.map((m) => m.id));
  for (const m of list) { const r = map.get(m.id); if (r) m.reactions = r; }
  return list;
}
function fmtMsg(m) { return { ...m, meta: m.meta ? JSON.parse(m.meta) : null, deleted: !!m.deleted, edited: !!m.edited, gone: !!m.gone }; }
const membersOf = async (chatId) => (await db.all('SELECT user_id FROM chat_members WHERE chat_id=?', [chatId])).map((r) => r.user_id);
const isMember = async (chatId, uid) => !!(await db.get('SELECT 1 AS x FROM chat_members WHERE chat_id=? AND user_id=?', [Number(chatId) || 0, uid]));
// "Yaqinlar" — shaxsiy chatdagi suhbatdoshlar (hikoyalar va onlayn holati shularga ko'rinadi)
async function peersOf(uid) {
  return (await db.all(`SELECT DISTINCT b.user_id FROM chat_members a JOIN chats ch ON ch.id=a.chat_id AND ch.type='private'
    JOIN chat_members b ON a.chat_id=b.chat_id AND b.user_id<>a.user_id WHERE a.user_id=?`, [uid])).map((r) => r.user_id);
}
const getChat = (id) => db.get('SELECT * FROM chats WHERE id=?', [Number(id) || 0]);
const roleOf = async (chatId, uid) => (await db.get('SELECT role FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, uid]))?.role || null;
const isAdmin = (role) => role === 'owner' || role === 'admin';
function publicChat(c, extra = {}) {
  return { id: c.id, type: c.type, title: c.title, about: c.about || '', avatar: c.avatar, username: c.username, ...extra };
}

async function chatSummary(chatId, uid) {
  const chat = await getChat(chatId);
  if (chat && chat.type !== 'private') {
    const me = await db.get('SELECT last_read_id, muted, role, pinned, archived FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, uid]);
    const last = await db.get('SELECT * FROM messages WHERE chat_id=? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY id DESC LIMIT 1', [chatId, uid]);
    const unread = (await db.get('SELECT COUNT(*) AS c FROM messages WHERE chat_id=? AND id>? AND sender_id<>? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?)', [chatId, me?.last_read_id || 0, uid, uid])).c;
    const members = (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE chat_id=?', [chatId])).c;
    const peerRead = (await db.get('SELECT MAX(last_read_id) AS m FROM chat_members WHERE chat_id=? AND user_id<>?', [chatId, uid]))?.m || 0;
    let lastOut = last ? fmtMsg(last) : null;
    if (lastOut && chat.type === 'group' && lastOut.sender_id !== uid) lastOut.sender_name = (await getUser(lastOut.sender_id))?.name;
    return { ...publicChat(chat, { members, role: me?.role || null, invite: isAdmin(me?.role) ? chat.invite : undefined }), last: lastOut, unread, peerReadId: peerRead, muted: !!me?.muted, pinned: Number(me?.pinned) || 0, archived: !!me?.archived };
  }
  const peer = (await db.get('SELECT u.* FROM chat_members m JOIN users u ON u.id=m.user_id WHERE m.chat_id=? AND m.user_id<>?', [chatId, uid])) || (await getUser(uid));
  const me = await db.get('SELECT last_read_id, muted, pinned, archived FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, uid]);
  const peerRead = await db.get('SELECT last_read_id FROM chat_members WHERE chat_id=? AND user_id<>?', [chatId, uid]);
  const last = await db.get('SELECT * FROM messages WHERE chat_id=? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY id DESC LIMIT 1', [chatId, uid]);
  const unread = (await db.get('SELECT COUNT(*) AS c FROM messages WHERE chat_id=? AND id>? AND sender_id<>? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?)', [chatId, me?.last_read_id || 0, uid, uid])).c;
  return { id: Number(chatId), type: 'private', peer: publicUser(peer, peer.id === uid), last: last ? fmtMsg(last) : null, unread, peerReadId: peerRead?.last_read_id || 0, self: peer.id === uid, muted: !!me?.muted, pinned: Number(me?.pinned) || 0, archived: !!me?.archived };
}

app.get('/api/chats', auth, wrap(async (req, res) => {
  const ids = (await db.all('SELECT chat_id FROM chat_members WHERE user_id=?', [req.user.id])).map((r) => r.chat_id);
  const list = await Promise.all(ids.map((id) => chatSummary(id, req.user.id)));
  res.json(list.sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)));
}));

async function privateChatId(a, b, create = true) {
  const row = a === b
    ? await db.get(`SELECT m.chat_id FROM chat_members m JOIN chats ch ON ch.id=m.chat_id AND ch.type='private' WHERE m.user_id=? AND (SELECT COUNT(*) FROM chat_members x WHERE x.chat_id=m.chat_id)=1`, [a])
    : await db.get(`SELECT a.chat_id FROM chat_members a JOIN chats ch ON ch.id=a.chat_id AND ch.type='private' JOIN chat_members b ON a.chat_id=b.chat_id WHERE a.user_id=? AND b.user_id=?`, [a, b]);
  if (row) return row.chat_id;
  if (!create) return null;
  const id = await db.insert('INSERT INTO chats(type,created_at) VALUES(?,?)', ['private', now()]);
  await db.run('INSERT INTO chat_members(chat_id,user_id) VALUES(?,?)', [id, a]);
  if (a !== b) await db.run('INSERT INTO chat_members(chat_id,user_id) VALUES(?,?)', [id, b]);
  return id;
}

app.post('/api/chats', auth, wrap(async (req, res) => {
  const peer = await getUser(req.body.userId);
  if (!peer || !peer.name) return res.status(404).json({ error: 'not found' });
  res.json(await chatSummary(await privateChatId(req.user.id, peer.id), req.user.id));
}));

app.post('/api/chats/:id/mute', auth, wrap(async (req, res) => {
  await db.run('UPDATE chat_members SET muted=? WHERE chat_id=? AND user_id=?', [req.body.muted ? 1 : 0, Number(req.params.id), req.user.id]);
  res.json({ ok: true, muted: !!req.body.muted });
}));

app.get('/api/chats/:id/messages', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  const around = Number(req.query.around) || 0;
  if (around) { // qidiruvdan xabarga o'tish: oldidan 25 ta va undan keyingi hammasi (oxirigacha)
    const older = await db.all('SELECT * FROM messages WHERE chat_id=? AND id<? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY id DESC LIMIT 25', [chatId, around, req.user.id]);
    const newer = await db.all('SELECT * FROM messages WHERE chat_id=? AND id>=? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY id ASC LIMIT 2000', [chatId, around, req.user.id]);
    return res.json(await withReactions([...older.reverse(), ...newer].map(fmtMsg)));
  }
  const before = Number(req.query.before) || 1e15;
  const rows = await db.all('SELECT * FROM messages WHERE chat_id=? AND id<? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY id DESC LIMIT 50', [chatId, before, req.user.id]);
  res.json(await withReactions(rows.reverse().map(fmtMsg)));
}));

// Chat ichida qidiruv
app.get('/api/chats/:id/search', auth, rateLimit('csearch', 300, 3600e3), wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
  if (q.length < 2) return res.json([]);
  const like = '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
  const rows = await db.all(`SELECT id, sender_id, type, text, created_at FROM messages WHERE chat_id=? AND deleted=0 AND text IS NOT NULL AND text<>''
    AND LOWER(text) LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 200`, [chatId, like]);
  res.json(rows.map((r) => ({ ...r, text: String(r.text).slice(0, 300) })));
}));

// Chatni tepaga qadash / arxivlash (faqat o'zim uchun)
app.post('/api/chats/:id/pin', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  if (req.body.on) {
    const n = (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE user_id=? AND pinned>0 AND chat_id<>?', [req.user.id, chatId])).c;
    if (n >= 5) return res.status(400).json({ error: tr(req.user.lang, 'Ko‘pi bilan 5 ta chatni qadash mumkin', 'Можно закрепить не более 5 чатов', 'You can pin up to 5 chats') });
  }
  await db.run('UPDATE chat_members SET pinned=?, archived=CASE WHEN ?>0 THEN 0 ELSE archived END WHERE chat_id=? AND user_id=?', [req.body.on ? now() : 0, req.body.on ? 1 : 0, chatId, req.user.id]);
  res.json(await chatSummary(chatId, req.user.id));
}));
app.post('/api/chats/:id/archive', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  await db.run('UPDATE chat_members SET archived=?, pinned=CASE WHEN ?>0 THEN 0 ELSE pinned END WHERE chat_id=? AND user_id=?', [req.body.on ? 1 : 0, req.body.on ? 1 : 0, chatId, req.user.id]);
  res.json(await chatSummary(chatId, req.user.id));
}));

// ===== Bloklash va shikoyat =====
app.get('/api/blocks', auth, wrap(async (req, res) => {
  const rows = await db.all('SELECT u.* FROM blocks b JOIN users u ON u.id=b.user_id WHERE b.owner_id=? ORDER BY b.at DESC', [req.user.id]);
  res.json(rows.map((u) => publicUser(u)));
}));
app.post('/api/blocks/:id', auth, rateLimit('block', 200, 3600e3), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id === req.user.id || !(await getUser(id))) return res.status(404).json({ error: 'not found' });
  if (req.body?.on === false) await db.run('DELETE FROM blocks WHERE owner_id=? AND user_id=?', [req.user.id, id]);
  else await db.run('INSERT INTO blocks(owner_id,user_id,at) VALUES(?,?,?) ON CONFLICT(owner_id,user_id) DO NOTHING', [req.user.id, id, now()]);
  res.json({ ok: true, blocked: req.body?.on !== false });
}));
const REPORT_REASONS = new Set(['spam', 'abuse', 'fraud', 'adult', 'violence', 'other']);
app.post('/api/reports', auth, rateLimit('report', 30, 3600e3), wrap(async (req, res) => {
  const reason = REPORT_REASONS.has(req.body?.reason) ? req.body.reason : 'other';
  let userId = Number(req.body?.userId) || null; const messageId = Number(req.body?.messageId) || null; let chatId = null, snapshot = null;
  if (messageId) {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [messageId]);
    if (!m || !(await isMember(m.chat_id, req.user.id))) return res.status(404).json({ error: 'not found' });
    userId = m.sender_id; chatId = m.chat_id;
    snapshot = JSON.stringify({ type: m.type, text: String(m.text || '').slice(0, 1000), file: m.file || null, at: m.created_at });
  }
  if (!userId || userId === req.user.id || !(await getUser(userId))) return res.status(400).json({ error: 'bad target' });
  await db.run('INSERT INTO reports(reporter_id,user_id,message_id,chat_id,reason,details,snapshot,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
    [req.user.id, userId, messageId, chatId, reason, String(req.body?.details || '').slice(0, 500), snapshot, 'open', now()]);
  if (req.body?.block) await db.run('INSERT INTO blocks(owner_id,user_id,at) VALUES(?,?,?) ON CONFLICT(owner_id,user_id) DO NOTHING', [req.user.id, userId, now()]);
  res.json({ ok: true });
}));

// ===== Admin panel (faqat ADMIN_EMAILS) =====
const adminOnly = (req, res, next) => (isAdminUser(req.user) ? next() : res.status(403).json({ error: 'forbidden' }));
app.get('/api/admin/stats', auth, adminOnly, wrap(async (req, res) => {
  const t = now(), day = 864e5;
  const one = async (sql, p = []) => Number((await db.get(sql, p))?.c) || 0;
  const reg = 'name IS NOT NULL AND COALESCE(deleted,0)=0';
  const out = {
    users: await one(`SELECT COUNT(*) AS c FROM users WHERE ${reg}`),
    banned: await one(`SELECT COUNT(*) AS c FROM users WHERE COALESCE(banned,0)=1`),
    newToday: await one(`SELECT COUNT(*) AS c FROM users WHERE ${reg} AND created_at>?`, [t - day]),
    new7: await one(`SELECT COUNT(*) AS c FROM users WHERE ${reg} AND created_at>?`, [t - 7 * day]),
    active24: await one(`SELECT COUNT(*) AS c FROM users WHERE ${reg} AND last_seen>?`, [t - day]),
    online: online.size,
    msgsToday: await one('SELECT COUNT(*) AS c FROM messages WHERE created_at>?', [t - day]),
    msgsTotal: await one('SELECT COUNT(*) AS c FROM messages'),
    groups: await one("SELECT COUNT(*) AS c FROM chats WHERE type='group'"),
    channels: await one("SELECT COUNT(*) AS c FROM chats WHERE type='channel'"),
    reportsOpen: await one("SELECT COUNT(*) AS c FROM reports WHERE status='open'"),
  };
  const rows = await db.all(`SELECT created_at FROM users WHERE ${reg} AND created_at>?`, [t - 30 * day]);
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(t - (29 - i) * day); return { d: d.toISOString().slice(0, 10), n: 0 }; });
  for (const r of rows) { const k = new Date(Number(r.created_at)).toISOString().slice(0, 10); const x = days.find((y) => y.d === k); if (x) x.n++; }
  out.signups = days;
  res.json(out);
}));
app.get('/api/admin/users', auth, adminOnly, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 64);
  const like = '%' + q.replace(/[%_]/g, '') + '%';
  const rows = await db.all(`SELECT * FROM users WHERE name IS NOT NULL AND COALESCE(deleted,0)=0 ${q ? 'AND (LOWER(search) LIKE ? OR LOWER(COALESCE(email,\'\')) LIKE ?)' : ''} ORDER BY id DESC LIMIT 200`, q ? [like, like] : []);
  const reports = await db.all("SELECT user_id, COUNT(*) AS c FROM reports GROUP BY user_id");
  const rc = new Map(reports.map((r) => [Number(r.user_id), Number(r.c)]));
  res.json(rows.map((u) => ({ ...publicUser(u), email: u.email, created_at: u.created_at, last_seen: u.last_seen, banned: !!u.banned, reports: rc.get(u.id) || 0, admin: isAdminUser(u) })));
}));
app.post('/api/admin/users/:id/ban', auth, adminOnly, wrap(async (req, res) => {
  const u = await getUser(req.params.id); if (!u) return res.status(404).json({ error: 'not found' });
  if (isAdminUser(u)) return res.status(400).json({ error: 'admin' });
  const on = req.body?.on !== false;
  await db.run('UPDATE users SET banned=? WHERE id=?', [on ? 1 : 0, u.id]);
  if (on) io.in('u' + u.id).disconnectSockets(true);
  broadcastUserCount();
  res.json({ ok: true, banned: on });
}));
app.get('/api/admin/reports', auth, adminOnly, wrap(async (req, res) => {
  const st = req.query.status === 'all' ? null : 'open';
  const rows = await db.all(`SELECT * FROM reports ${st ? "WHERE status='open'" : ''} ORDER BY id DESC LIMIT 200`);
  const users = new Map();
  for (const r of rows) for (const id of [r.reporter_id, r.user_id]) if (!users.has(id)) { const u = await getUser(id); users.set(id, u ? { id: u.id, name: u.name, username: u.username, avatar: u.avatar, banned: !!u.banned, email: u.email } : { id }); }
  res.json(rows.map((r) => ({ ...r, snapshot: r.snapshot ? JSON.parse(r.snapshot) : null, reporter: users.get(r.reporter_id), user: users.get(r.user_id) })));
}));
app.post('/api/admin/reports/:id', auth, adminOnly, wrap(async (req, res) => {
  const r = await db.get('SELECT * FROM reports WHERE id=?', [Number(req.params.id)]); if (!r) return res.status(404).json({ error: 'not found' });
  const a = req.body?.action;
  if (a === 'delete_msg' && r.message_id) {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [r.message_id]);
    if (m && !m.deleted) {
      await db.run("UPDATE messages SET deleted=1, text='', file=NULL, meta=NULL WHERE id=?", [m.id]);
      if (m.file) safeRemove(m.file);
      (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('message:deleted', { id: m.id, chatId: m.chat_id }));
    }
  }
  if (a === 'ban') { const u = await getUser(r.user_id); if (u && !isAdminUser(u)) { await db.run('UPDATE users SET banned=1 WHERE id=?', [u.id]); io.in('u' + u.id).disconnectSockets(true); broadcastUserCount(); } }
  await db.run("UPDATE reports SET status=?, resolved_at=? WHERE id=?", [a === 'reopen' ? 'open' : 'done', now(), r.id]);
  res.json({ ok: true });
}));

// ===== Kunlik qadamlar (foydalanuvchi o'zi yoqsa — yaqinlariga hikoyalar qatorida ko'rinadi) =====
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
app.post('/api/steps/toggle', auth, wrap(async (req, res) => {
  const on = req.body?.on ? 1 : 0;
  await db.run('UPDATE users SET steps_on=? WHERE id=?', [on, req.user.id]);
  if (!on) await db.run('DELETE FROM step_devices WHERE user_id=?', [req.user.id]); // telefondagi ilova keyingi urinishda o'zini to'xtatadi
  res.json({ on: !!on });
}));
// Android ilovasi (fon xizmati) uchun alohida token — faqat qadamlar sonini yuborishga yaraydi
app.post('/api/steps/device-token', auth, rateLimit('stepdt', 20, 3600e3), wrap(async (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  await db.run('DELETE FROM step_devices WHERE user_id=?', [req.user.id]);
  await db.run('INSERT INTO step_devices(token,user_id,created,last) VALUES(?,?,?,NULL)', [token, req.user.id, now()]);
  await db.run('UPDATE users SET steps_on=1 WHERE id=?', [req.user.id]);
  res.json({ token });
}));
app.post('/api/steps/device', rateLimit('stepdev', 240, 3600e3), wrap(async (req, res) => {
  const t = String(req.body?.t || ''); if (!/^[a-f0-9]{48}$/.test(t)) return res.status(401).json({ error: 'token' });
  const d = await db.get('SELECT user_id FROM step_devices WHERE token=?', [t]); if (!d) return res.status(401).json({ error: 'token' });
  const day = String(req.body?.day || ''), n = Math.floor(Number(req.body?.steps));
  if (!DAY_RE.test(day) || !(n >= 0 && n <= 150000) || Math.abs(Date.parse(day) - Date.now()) > 3 * 864e5) return res.status(400).json({ error: 'bad' });
  const u = await getUser(d.user_id); if (!u || u.deleted || u.banned) return res.status(410).json({ error: 'gone' });
  await db.run(`INSERT INTO steps(user_id,day,steps,updated) VALUES(?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET
    steps=CASE WHEN steps.steps<excluded.steps THEN excluded.steps ELSE steps.steps END, updated=excluded.updated`, [d.user_id, day, n, now()]);
  await db.run('UPDATE step_devices SET last=?, sensor=?, err=? WHERE token=?', [now(), String(req.body?.sensor || '').slice(0, 12), String(req.body?.err || '').slice(0, 12), t]);
  res.json({ ok: true });
}));
app.post('/api/steps', auth, rateLimit('steps', 240, 3600e3), wrap(async (req, res) => {
  const day = String(req.body?.day || ''), n = Math.floor(Number(req.body?.steps));
  if (!DAY_RE.test(day) || !(n >= 0 && n <= 150000)) return res.status(400).json({ error: 'bad' });
  await db.run(`INSERT INTO steps(user_id,day,steps,updated) VALUES(?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET
    steps=CASE WHEN steps.steps<excluded.steps THEN excluded.steps ELSE steps.steps END, updated=excluded.updated`, [req.user.id, day, n, now()]);
  res.json({ ok: true });
}));
app.get('/api/steps', auth, wrap(async (req, res) => {
  const day = String(req.query.day || ''); if (!DAY_RE.test(day)) return res.status(400).json({ error: 'bad' });
  const ids = [req.user.id, ...(await peersOf(req.user.id))].slice(0, 500);
  const out = [];
  for (const id of ids) {
    const u = await getUser(id); if (!u || !u.steps_on || u.deleted || u.banned) continue;
    if (id !== req.user.id && ((await isBlocked(id, req.user.id)) || (await isBlocked(req.user.id, id)))) continue;
    const r = await db.get('SELECT steps FROM steps WHERE user_id=? AND day=?', [id, day]);
    out.push({ user: publicUser(u), steps: Number(r?.steps) || 0 });
  }
  const dev = await db.get('SELECT last, sensor, err FROM step_devices WHERE user_id=?', [req.user.id]);
  res.json({ on: !!(await getUser(req.user.id))?.steps_on, list: out, device: dev ? { linked: true, last: Number(dev.last) || null, sensor: dev.sensor || '', err: dev.err || '' } : null });
}));

// ===== Birga AI — umumiy savollarga javob beruvchi yordamchi =====
// Bepul yo'l: Google AI Studio'dan GEMINI_API_KEY (Render → Environment). Yoki GROQ_API_KEY, yoki OpenAI-mos AI_API_URL + AI_API_KEY.
const AI_SYSTEM = `Sen "Birga yordamchi" — Birga messenjerining aqlli yordamchisisan (avval "Birga AI" deb atalgan). Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (odatda o'zbek tilida, lotin yozuvida).
ISHLASH TARZI (eng yaxshi suhbat yordamchilari kabi):
- Avval savolni to'liq tushun: maqsad nima, qanday javob kutilmoqda. Savol noaniq bo'lsa — eng ehtimolli ma'noda javob ber va oxirida bitta qisqa aniqlashtiruvchi savol ber.
- Eng muhim javobni birinchi gapda ber, keyin kerak bo'lsa tafsilot. Ortiqcha kirish so'zlari, takrorlar va "albatta, yordam beraman" kabi to'ldiruvchi gaplarsiz yoz.
- Hisob-kitob, mantiq va faktlarni ichingda tekshirib chiq; raqamlar va sanalarda xato qilma. Ishonching komil bo'lmasa — buni ochiq ayt, to'qib chiqarma.
- Kerak bo'lsa ro'yxat, qadamlar yoki jadval ishlat; oddiy savolga qisqa javob ber.
- Avvalgi suhbatni eslab qol va unga tayan; foydalanuvchi haqida eslab qolingan ma'lumotlar berilsa — javobni unga moslashtir.
Tibbiy, huquqiy yoki moliyaviy savollarda umumiy ma'lumot ber va mutaxassisga murojaat qilishni maslahat ber. Zararli, noqonuniy yoki xavfli ishlarga yordam berma.
O'ZBEK TILI QOIDALARI (o'zbekcha javob berganda albatta rioya qil):
- Sof adabiy o'zbek tilida, joriy lotin alifbosida yoz. "O‘" va "g‘" harflarini to'g'ri yoz (o‘, g‘, ʼ — tutuq belgisi), kirill harflarini aralashtirma.
- Rus, ingliz va turk so'zlarini ishlatma, o'zbekcha muqobilini ishlat: "konechno" emas "albatta", "normalno" emas "yaxshi", "ponyatno" emas "tushunarli", "voobshe" emas "umuman", "eshyo" emas "yana", "spasibo" emas "rahmat", "problema" emas "muammo", "vopros" emas "savol", "variant" o'rniga ko'pincha "yo'l" yoki "imkoniyat".
- Turkcha shakllardan qoch ("bilgi" emas "ma'lumot", "teşekkür" emas "rahmat", "-yor" qo'shimchasi emas "-yapti"). Grammatika va so'z tartibi tabiiy o'zbekcha bo'lsin, tarjima ohangi sezilmasin.
- Atamalar uchun o'zbek tilida qabul qilingan so'zni ishlat (kompyuter, internet, telefon kabi xalqaro so'zlar mumkin).
- Foydalanuvchi kirill yozuvida yozsa — kirill yozuvida, sof o'zbekcha javob ber.
Birga ilovasi va uning yaratuvchisi haqida ma'lumot (faqat shu haqda so'ralganda ishlat):
- Birga messenjerini (Birga platformasi va Birga yordamchini) Hayitboyev Sardorbek yaratgan.
- Hayitboyev Sardorbek 2002-yil 29-dekabrda tug'ilgan.
- U haqida boshqa ma'lumot hozircha yo'q. Shu ikki faktdan tashqari narsalarni (yashash joyi, ta'limi, oilasi va h.k.) to'qib chiqarma — "bu haqda hozircha ma'lumot yo'q" deb ayt.`;
async function aiFetch(url, opts, ms = 45000) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { ...opts, signal: ac.signal }); const txt = await r.text(); if (!r.ok) throw new Error(`${r.status} ${txt.slice(0, 200)}`); return JSON.parse(txt); }
  finally { clearTimeout(tm); }
}
const aiNow = () => new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', dateStyle: 'full', timeStyle: 'short' });
const aiSys = () => AI_SYSTEM + `\nHozirgi sana va vaqt (Toshkent): ${aiNow()}. Foydalanuvchi rasm yuborsa — uni diqqat bilan tahlil qil (matnni o'qi, narsalarni tanib ber, masalani yech).
Javobni Markdown'da yoz: **qalin**, ro'yxatlar, kod uchun \`\`\` bloklar. Juda uzun bo'lmasin, lekin to'liq va foydali bo'lsin.`;
// msgs: [{role, content, image?: 'data:image/jpeg;base64,...'}] — rasm faqat oxirgi savolda bo'ladi
async function aiAnswer(msgs, { web = true, fast = false, sys = '' } = {}) {
  const errs = [];
  const hasImg = msgs.some((m) => m.image);
  const split = (d) => { const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d || ''); return m ? { mime: m[1], data: m[2] } : null; };
  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const contents = msgs.map((m) => { const im = split(m.image); return { role: m.role === 'assistant' ? 'model' : 'user', parts: [...(im ? [{ inline_data: { mime_type: im.mime, data: im.data } }] : []), { text: m.content || ' ' }] }; });
    for (const grounding of web && process.env.AI_WEB !== '0' ? [true, false] : [false]) { // Google qidiruvi bilan (yangiliklar, ob-havo, narxlar...), xato bo'lsa — qidiruvsiz
      try {
        const j = await aiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: aiSys() + sys }] }, contents, ...(grounding ? { tools: [{ google_search: {} }] } : {}), generationConfig: { maxOutputTokens: 3000, temperature: fast ? 0.3 : 0.6, ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: fast ? 0 : Number(process.env.AI_THINK ?? 384) } } : {}) } }),
        });
        const c = j?.candidates?.[0]; const out = c?.content?.parts?.map((p) => p.text || '').join('').trim();
        if (out) {
          const src = (c.groundingMetadata?.groundingChunks || []).map((g) => g.web).filter((w) => w?.uri).slice(0, 5).map((w) => ({ title: String(w.title || '').slice(0, 80), url: w.uri }));
          return { text: out, sources: src };
        }
        errs.push('gemini: empty');
      } catch (e) { errs.push('gemini' + (grounding ? '+web' : '') + ': ' + e.message); }
    }
  }
  const compat = [];
  if (process.env.GROQ_API_KEY) compat.push(['https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, hasImg ? process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct' : process.env.GROQ_MODEL || 'llama-3.3-70b-versatile']);
  if (process.env.AI_API_URL && process.env.AI_API_KEY) compat.push([process.env.AI_API_URL, process.env.AI_API_KEY, process.env.AI_MODEL || 'gpt-4o-mini']);
  if (process.env.AI_FREE !== '0') compat.push(['https://text.pollinations.ai/openai', null, 'openai']); // kalitsiz bepul zaxira (cheklangan)
  const oaMsgs = msgs.map((m) => (m.image ? { role: m.role, content: [{ type: 'text', text: m.content || ' ' }, { type: 'image_url', image_url: { url: m.image } }] } : { role: m.role, content: m.content }));
  for (const [url, key, model] of compat) {
    try {
      const j = await aiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer ' + key } : {}) },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: aiSys() + sys }, ...oaMsgs], max_tokens: 3000, temperature: fast ? 0.3 : 0.6 }) });
      const out = String(j?.choices?.[0]?.message?.content || '').trim(); if (out) return { text: out, sources: [] };
      errs.push(url + ': empty');
    } catch (e) { errs.push(url.split('/')[2] + ': ' + e.message); }
  }
  console.error('Birga AI:', errs.join(' | '));
  return null;
}
app.post('/api/ai', auth, rateLimit('ai', 80, 3600e3), wrap(async (req, res) => {
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const msgs = raw.slice(-16).map((m, i, a) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content || '').slice(0, 6000),
    image: i === a.length - 1 && typeof m?.image === 'string' && m.image.length < 7e6 && /^data:image\/(jpeg|png|webp);base64,/.test(m.image) ? m.image : undefined }))
    .filter((m) => m.content.trim() || m.image);
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'empty' });
  // "Eslab qol: ..." — foydalanuvchi haqidagi ma'lumot keyingi suhbatlarda ham ishlatiladi
  const rem = /^\s*(eslab qol|yodda tut|esingda tursin|запомни|remember( that)?)[\s:,-]+(.{3,300})$/i.exec(msgs[msgs.length - 1].content);
  if (rem) { await db.run('INSERT INTO ai_memory(user_id, fact, at) VALUES(?,?,?)', [req.user.id, rem[3].trim(), now()]); await db.run('DELETE FROM ai_memory WHERE user_id=? AND at < (SELECT MIN(at) FROM (SELECT at FROM ai_memory WHERE user_id=? ORDER BY at DESC LIMIT 40) x)', [req.user.id, req.user.id]).catch(() => {}); }
  const mem = await db.all('SELECT fact FROM ai_memory WHERE user_id=? ORDER BY at DESC LIMIT 40', [req.user.id]).catch(() => []);
  const me = req.user; let reg = null; try { reg = JSON.parse(me.region || 'null'); } catch {}
  const sys = `\nFoydalanuvchi: ${me.name || ''}${reg?.name ? ', hududi: ' + reg.name : ''}.` + (mem.length ? `\nFoydalanuvchi so'rab eslab qolinganlar (kerak bo'lganda hisobga ol):\n${mem.map((x) => '- ' + x.fact).join('\n')}` : '') + (rem ? `\nFoydalanuvchi hozirgina "${rem[3].trim()}" ni eslab qolishni so'radi — eslab qolganingni qisqa tasdiqla.` : '');
  const out = await aiAnswer(msgs, { web: req.body?.web !== false, sys });
  if (!out) return res.status(503).json({ error: 'ai_unavailable' });
  res.json({ text: out.text.slice(0, 16000), sources: out.sources || [] });
}));
app.get('/api/ai/memory', auth, wrap(async (req, res) => res.json({ list: (await db.all('SELECT at, fact FROM ai_memory WHERE user_id=? ORDER BY at DESC LIMIT 40', [req.user.id])).map((r) => ({ id: Number(r.at), fact: r.fact })) })));
app.post('/api/ai/memory/clear', auth, wrap(async (req, res) => { const at = Number(req.body?.id); if (at) await db.run('DELETE FROM ai_memory WHERE user_id=? AND at=?', [req.user.id, at]); else await db.run('DELETE FROM ai_memory WHERE user_id=?', [req.user.id]); res.json({ ok: true }); }));

// ===== Tarjima (4 til) =====
const TR_LANGS = { uz: "o'zbek (lotin yozuvi, sof adabiy)", ru: 'rus', en: 'ingliz', tr: 'turk' };
const trCache = new Map();
async function msgVisible(id, uid) {
  const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(id) || 0]);
  if (!m || m.deleted || !(await isMember(m.chat_id, uid))) return null;
  return m;
}
app.post('/api/ai/translate', auth, rateLimit('aitr', 200, 3600e3), wrap(async (req, res) => {
  const to = String(req.body?.to || ''); if (!TR_LANGS[to]) return res.status(400).json({ error: 'lang' });
  let text = String(req.body?.text || '').slice(0, 4000);
  if (req.body?.id) { const m = await msgVisible(req.body.id, req.user.id); if (!m) return res.status(403).json({ error: 'forbidden' }); text = m.type === 'voice' || m.type === 'round' ? (await db.get('SELECT text FROM transcripts WHERE message_id=?', [m.id]))?.text || '' : m.text; }
  if (!text.trim()) return res.status(400).json({ error: 'empty' });
  const ck = to + ':' + crypto.createHash('sha1').update(text).digest('hex');
  if (trCache.has(ck)) return res.json({ text: trCache.get(ck) });
  const r = await aiAnswer([{ role: 'user', content: `Quyidagi matnni ${TR_LANGS[to]} tiliga tarjima qil. Ma'noni, ohangni va emojilarni saqla, ismlarni tarjima qilma. Faqat tarjimaning o'zini yoz — izoh, qo'shtirnoq va sarlavhasiz.\n---\n${text}` }], { web: false, fast: true });
  if (!r) return res.status(503).json({ error: 'ai_unavailable' });
  const out = r.text.replace(/^["'«“]+|["'»”]+$/g, '').trim();
  trCache.set(ck, out); if (trCache.size > 2000) trCache.delete(trCache.keys().next().value);
  res.json({ text: out });
}));

// ===== Ovozli xabarni matnga aylantirish =====
async function fileBytes(url) {
  if (/^https?:\/\//.test(url)) { const r = await fetch(url); if (!r.ok) throw new Error('file ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  return fs.readFileSync(path.join(UPLOAD_DIR, path.basename(url)));
}
app.post('/api/ai/transcribe', auth, rateLimit('aistt', 120, 3600e3), wrap(async (req, res) => {
  const m = await msgVisible(req.body?.id, req.user.id); if (!m || !['voice', 'round', 'video'].includes(m.type) || !m.file) return res.status(403).json({ error: 'forbidden' });
  const have = await db.get('SELECT text FROM transcripts WHERE message_id=?', [m.id]); if (have) return res.json({ text: have.text });
  const buf = await fileBytes(m.file); if (buf.length > 19e6) return res.status(413).json({ error: 'too_big' });
  const mime = (m.mime || (m.type === 'voice' ? 'audio/ogg' : 'video/mp4')).split(';')[0];
  const errs = []; let text = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const j = await aiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: buf.toString('base64') } }, { text: "Bu ovozli xabarni so'zma-so'z, aynan aytilgan tilda matnga aylantir. O'zbekcha bo'lsa — to'g'ri imlo bilan lotin yozuvida (o‘, g‘). Tinish belgilarini qo'y. Faqat matnning o'zini yoz, izohsiz. Nutq bo'lmasa — bo'sh qoldir." }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 4000, ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) } }) }, 90000);
      text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() ?? null;
    } catch (e) { errs.push('gemini: ' + e.message); }
  }
  if (text == null && process.env.GROQ_API_KEY) {
    try {
      const fd = new FormData(); fd.append('file', new Blob([buf], { type: mime }), 'audio.' + (mime.split('/')[1] || 'ogg').replace('mpeg', 'mp3')); fd.append('model', process.env.GROQ_STT_MODEL || 'whisper-large-v3'); fd.append('temperature', '0');
      const r = await fetch((process.env.GROQ_API_BASE || 'https://api.groq.com') + '/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: fd });
      const j = await r.json(); if (!r.ok) throw new Error(r.status + ' ' + JSON.stringify(j).slice(0, 150)); text = String(j.text || '').trim();
    } catch (e) { errs.push('groq: ' + e.message); }
  }
  if (text == null) { if (errs.length) console.error('STT:', errs.join(' | ')); return res.status(503).json({ error: process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY ? 'stt_failed' : 'no_stt' }); }
  await db.run('INSERT INTO transcripts(message_id, text, at) VALUES(?,?,?) ON CONFLICT(message_id) DO UPDATE SET text=excluded.text', [m.id, text.slice(0, 8000), now()]);
  res.json({ text });
}));

// ===== Stikerlar: o'z stikerlarim + Birga yordamchi chizgan stiker =====
app.get('/api/stickers/mine', auth, wrap(async (req, res) => res.json({ list: (await db.all('SELECT url, at FROM user_stickers WHERE user_id=? ORDER BY at DESC LIMIT 200', [req.user.id])).map((r) => r.url) })));
app.post('/api/stickers/mine', auth, rateLimit('stk', 120, 3600e3), wrap(async (req, res) => {
  const url = String(req.body?.url || '');
  if (!storage.isOurs(url)) return res.status(400).json({ error: 'bad' });
  if (req.body?.remove) await db.run('DELETE FROM user_stickers WHERE user_id=? AND url=?', [req.user.id, url]);
  else await db.run('INSERT INTO user_stickers(user_id, url, at) VALUES(?,?,?) ON CONFLICT(user_id, url) DO NOTHING', [req.user.id, url, now()]);
  res.json({ ok: true });
}));
app.post('/api/ai/sticker', auth, rateLimit('aistk', 25, 3600e3), wrap(async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim().slice(0, 300); if (!prompt) return res.status(400).json({ error: 'empty' });
  let en = prompt;
  if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) { try { const r = await aiAnswer([{ role: 'user', content: 'Translate to a short English description for an image generator (max 25 words), reply with the description only:\n' + prompt }], { web: false, fast: true }); if (r?.text && r.text.length < 300) en = r.text.replace(/^["'`]+|["'`]+$/g, ''); } catch {} }
  const full = `${en}, cute cartoon sticker, die-cut sticker with thick white outline, bold clean lines, vibrant colors, centered single subject, plain pure white background, no text`;
  const url = `${process.env.AI_IMAGE_URL || 'https://image.pollinations.ai/prompt/'}${encodeURIComponent(full)}?width=512&height=512&nologo=true&seed=${crypto.randomInt(1, 1e9)}`;
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 90000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: process.env.POLLINATIONS_TOKEN ? { Authorization: 'Bearer ' + process.env.POLLINATIONS_TOKEN } : {} });
    const type = (r.headers.get('content-type') || '').split(';')[0];
    if (!r.ok || !/^image\//.test(type)) throw new Error('status ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({ data: `data:${type};base64,${buf.toString('base64')}` }); // mijoz oq fonni olib tashlaydi va PNG qilib saqlaydi
  } catch (e) { console.error('stiker:', e.message); res.status(503).json({ error: 'image_unavailable' }); }
  finally { clearTimeout(tm); }
}));

// ===== Birga AI ovozi: Microsoft Azure neyron ovozlari (o'zbekcha: Madina — ayol, Sardor — erkak). Kalit: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION =====
const TTS_VOICES = { uz: ['uz-UZ-MadinaNeural', 'uz-UZ-SardorNeural'], ru: ['ru-RU-SvetlanaNeural', 'ru-RU-DmitryNeural'], en: ['en-US-JennyNeural', 'en-US-GuyNeural'] };
const ttsCache = new Map();
app.get('/api/ai/voice', auth, (req, res) => res.json({ neural: !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION), voices: TTS_VOICES }));
app.post('/api/ai/tts', auth, rateLimit('tts', 120, 3600e3), wrap(async (req, res) => {
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return res.status(501).json({ error: 'no_tts' });
  const lang = ['uz', 'ru', 'en'].includes(req.body?.lang) ? req.body.lang : 'uz';
  const voice = TTS_VOICES[lang][req.body?.voice === 1 ? 1 : 0];
  let text = String(req.body?.text || '').replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/[*#_`>|~\[\]]/g, '').replace(/[ʻ‘’`']/g, (c, i, s2) => (/[oOgG]/.test(s2[i - 1] || '') ? '‘' : 'ʼ')).replace(/\s+/g, ' ').trim().slice(0, 2500);
  if (!text) return res.status(400).json({ error: 'empty' });
  const ck = voice + ':' + crypto.createHash('sha1').update(text).digest('hex');
  let buf = ttsCache.get(ck);
  if (!buf) {
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ssml = `<speak version="1.0" xml:lang="${voice.slice(0, 5)}"><voice name="${voice}"><prosody rate="${lang === 'uz' ? '-4%' : '0%'}">${esc(text)}</prosody></voice></speak>`;
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'Birga' }, body: ssml });
    if (!r.ok) { console.error('TTS:', r.status, (await r.text()).slice(0, 200)); return res.status(502).json({ error: 'tts_failed' }); }
    buf = Buffer.from(await r.arrayBuffer());
    ttsCache.set(ck, buf); if (ttsCache.size > 200) ttsCache.delete(ttsCache.keys().next().value);
  }
  res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' }); res.end(buf);
}));
// Chat xulosasi (faqat so'ragan odamga ko'rinadi)
app.post('/api/ai/summary', auth, rateLimit('aisum', 30, 3600e3), wrap(async (req, res) => {
  const chatId = Number(req.body?.chatId); if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  const rows = (await db.all(`SELECT m.*, u.name AS sname FROM messages m LEFT JOIN users u ON u.id=m.sender_id WHERE m.chat_id=? AND m.deleted=0 AND m.id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) ORDER BY m.id DESC LIMIT 150`, [chatId, req.user.id])).reverse();
  if (!rows.length) return res.json({ text: '' });
  const lines = rows.map((m) => { let meta = {}; try { meta = JSON.parse(m.meta || '{}'); } catch {} const who = meta.ai ? 'Birga yordamchi' : m.sname || '?';
    const body = m.type === 'text' ? m.text : m.type === 'poll' ? `[so'rovnoma: ${meta.poll?.q}]` : `[${PREVIEW[m.type]?.[0] || m.type}]${m.text ? ' ' + m.text : ''}`;
    return `${new Date(Number(m.created_at)).toISOString().slice(5, 16).replace('T', ' ')} ${who}: ${String(body || '').slice(0, 400)}`; }).join('\n');
  const lang = LANGS.includes(req.body?.lang) ? req.body.lang : req.user.lang || 'uz';
  const r = await aiAnswer([{ role: 'user', content: `Quyidagi chat yozishmasining qisqa xulosasini ${lang === 'ru' ? 'rus' : lang === 'en' ? 'ingliz' : 'sof o‘zbek'} tilida yoz: asosiy mavzular, kelishilgan narsalar, savollar va bajarilishi kerak bo'lgan ishlar (ro'yxat ko'rinishida, 8 banddan oshmasin).\n---\n${lines}` }], { web: false });
  if (!r) return res.status(503).json({ error: 'ai_unavailable' });
  res.json({ text: r.text });
}));
// Chat tarixini faqat o'zi uchun tozalash
app.post('/api/chats/:id/clear', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id); if (!(await isMember(chatId, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  await db.run(`INSERT INTO hidden_messages(user_id, message_id, at) SELECT ?, id, ? FROM messages WHERE chat_id=? AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?)`, [req.user.id, now(), chatId, req.user.id]);
  io.to('u' + req.user.id).emit('chat:update', await chatSummary(chatId, req.user.id));
  res.json({ ok: true });
}));

// Birga AI — rasm chizish (bepul: Pollinations), natija Birga omboriga saqlanadi va chatga yuborish mumkin
app.post('/api/ai/image', auth, rateLimit('aiimg', 25, 3600e3), wrap(async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim().slice(0, 600); if (!prompt) return res.status(400).json({ error: 'empty' });
  let en = prompt;
  if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) { // tasvir modeli inglizchani yaxshiroq tushunadi
    try { const r = await aiAnswer([{ role: 'user', content: 'Translate this image description into a detailed English prompt for an image generator. Reply with the prompt only, no quotes:\n' + prompt }], { web: false }); if (r?.text && r.text.length < 900) en = r.text.replace(/^["'`]+|["'`]+$/g, ''); } catch {}
  }
  const seed = crypto.randomInt(1, 1e9);
  const url = `${process.env.AI_IMAGE_URL || 'https://image.pollinations.ai/prompt/'}${encodeURIComponent(en)}?width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 90000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: process.env.POLLINATIONS_TOKEN ? { Authorization: 'Bearer ' + process.env.POLLINATIONS_TOKEN } : {} });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\//.test(type)) throw new Error('status ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 2000) throw new Error('small');
    const f = path.join(UPLOAD_DIR, 'ai-' + crypto.randomBytes(8).toString('hex') + (type.includes('png') ? '.png' : '.jpg'));
    fs.writeFileSync(f, buf);
    const saved = await storage.save(f, type.split(';')[0]);
    await db.run('INSERT INTO uploads(url,user_id,at) VALUES(?,?,?) ON CONFLICT(url) DO NOTHING', [saved, req.user.id, now()]).catch(() => {});
    res.json({ url: saved, mime: type.split(';')[0], size: buf.length });
  } catch (e) { console.error('Birga AI rasm:', e.message); res.status(503).json({ error: 'image_unavailable' }); }
  finally { clearTimeout(tm); }
}));


// ===== O'yinlar: eng yaxshi natijalar va reyting =====
const GAMES = new Set(['snake', 'penalty', 'aim', '2048', 'flappy', 'blocks', 'memory', 'xo', 'breakout', 'mines', 'run', 'strike', 'football']);
// 2 kishilik (taklif bilan) o'yinlar — g'alabalar soni 'w_<id>' nomi bilan reytingga yoziladi
const AI_SECRET = crypto.randomBytes(8).toString('hex');
const MP_GAMES = new Set(['chess', 'checkers', 'connect4', 'gomoku', 'battleship']);
const TOP_GAMES = new Set([...GAMES, ...[...MP_GAMES].map((g) => 'w_' + g)]);
app.post('/api/games/score', auth, rateLimit('gscore', 600, 3600e3), wrap(async (req, res) => {
  const g = String(req.body?.game || ''); const sc = Math.floor(Number(req.body?.score));
  if (!GAMES.has(g) || !isFinite(sc) || sc < 0 || sc > 1e7) return res.status(400).json({ error: 'bad score' });
  const cur = await db.get('SELECT best FROM game_scores WHERE user_id=? AND game=?', [req.user.id, g]);
  await db.run(`INSERT INTO game_scores(user_id,game,best,plays,updated) VALUES(?,?,?,1,?) ON CONFLICT(user_id,game) DO UPDATE SET
    best=CASE WHEN game_scores.best<excluded.best THEN excluded.best ELSE game_scores.best END, plays=game_scores.plays+1, updated=excluded.updated`, [req.user.id, g, sc, now()]);
  const best = Math.max(sc, Number(cur?.best) || 0);
  const rank = Number((await db.get('SELECT COUNT(*) AS c FROM game_scores WHERE game=? AND best>?', [g, best])).c) + 1;
  res.json({ best, rank, record: !cur || sc > Number(cur.best) });
}));
app.get('/api/games/top', auth, wrap(async (req, res) => {
  const g = String(req.query.game || ''); if (!TOP_GAMES.has(g)) return res.status(400).json({ error: 'bad game' });
  const rows = await db.all('SELECT s.best, u.* FROM game_scores s JOIN users u ON u.id=s.user_id WHERE s.game=? AND u.name IS NOT NULL AND COALESCE(u.deleted,0)=0 AND COALESCE(u.banned,0)=0 ORDER BY s.best DESC, s.updated ASC LIMIT 20', [g]);
  const me = await db.get('SELECT best FROM game_scores WHERE user_id=? AND game=?', [req.user.id, g]);
  const rank = me ? Number((await db.get('SELECT COUNT(*) AS c FROM game_scores WHERE game=? AND best>?', [g, me.best])).c) + 1 : null;
  res.json({ top: rows.map((r) => ({ user: publicUser(r), best: Number(r.best) })), me: me ? { best: Number(me.best), rank } : null });
}));
app.get('/api/games/mine', auth, wrap(async (req, res) => {
  const rows = await db.all('SELECT game, best FROM game_scores WHERE user_id=?', [req.user.id]);
  res.json(Object.fromEntries(rows.map((r) => [r.game, Number(r.best)])));
}));

// Tug'ilgan kun: "YYYY-MM-DD" (yil yashirilsa "0000-MM-DD"); bo'sh — olib tashlash
app.post('/api/profile/birthday', auth, wrap(async (req, res) => {
  let v = String(req.body?.date || '').trim();
  if (v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); const y = m && +m[1], mo = m && +m[2], d = m && +m[3];
    const ok = m && mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(2024, mo, 0).getDate() && (y === 0 || (y >= 1900 && y <= new Date().getFullYear()));
    if (!ok) return res.status(400).json({ error: tr(req.user.lang, 'Sana noto‘g‘ri', 'Неверная дата', 'Invalid date') });
  } else v = null;
  await db.run('UPDATE users SET birthday=? WHERE id=?', [v, req.user.id]);
  const u = await getUser(req.user.id); broadcastUser(u).catch(() => {});
  res.json(publicUser(u, true));
}));
// Bugun tug'ilgan kuni bo'lgan yaqinlar (md = foydalanuvchi telefonidagi bugungi "MM-DD")
app.get('/api/birthdays', auth, wrap(async (req, res) => {
  const md = /^\d{2}-\d{2}$/.test(String(req.query.md)) ? String(req.query.md) : null; if (!md) return res.json([]);
  const ids = new Set(await peersOf(req.user.id));
  (await db.all('SELECT user_id FROM contacts WHERE owner_id=?', [req.user.id])).forEach((r) => ids.add(r.user_id));
  ids.delete(req.user.id);
  if (!ids.size) return res.json([]);
  const list = [...ids].slice(0, 2000);
  const rows = await db.all(`SELECT * FROM users WHERE birthday IS NOT NULL AND deleted=0 AND name IS NOT NULL AND id IN (${list.map(() => '?').join(',')})`, list);
  res.json(rows.filter((u) => String(u.birthday).slice(5) === md).map((u) => publicUser(u)));
}));

// Maxfiylik: oxirgi faollik vaqtini yashirish
app.post('/api/profile/privacy', auth, wrap(async (req, res) => {
  await db.run('UPDATE users SET hide_seen=? WHERE id=?', [req.body.hideSeen ? 1 : 0, req.user.id]);
  const u = await getUser(req.user.id); broadcastUser(u).catch(() => {});
  res.json(publicUser(u, true));
}));

// Akkauntni butunlay o'chirish
app.post('/api/me/delete', auth, rateLimit('delacc', 5, 3600e3), wrap(async (req, res) => {
  if (req.body?.confirm !== 'DELETE') return res.status(400).json({ error: 'confirm' });
  const uid = req.user.id; const t = now();
  // o'zi yaratgan guruh/kanallar: egalik eng eski a'zoga o'tadi; a'zolikdan chiqariladi
  const groups = await db.all("SELECT m.chat_id, m.role FROM chat_members m JOIN chats ch ON ch.id=m.chat_id WHERE m.user_id=? AND ch.type<>'private'", [uid]);
  for (const g of groups) {
    await db.run('DELETE FROM chat_members WHERE chat_id=? AND user_id=?', [g.chat_id, uid]);
    if (g.role === 'owner') {
      const heir = await db.get("SELECT user_id FROM chat_members WHERE chat_id=? ORDER BY CASE WHEN role='admin' THEN 0 ELSE 1 END, joined_at LIMIT 1", [g.chat_id]);
      if (heir) { await db.run("UPDATE chat_members SET role='owner' WHERE chat_id=? AND user_id=?", [g.chat_id, heir.user_id]); await db.run('UPDATE chats SET owner_id=? WHERE id=?', [heir.user_id, g.chat_id]); }
    }
    for (const m of await membersOf(g.chat_id)) io.to('u' + m).emit('chat:update', await chatSummary(g.chat_id, m));
  }
  // "Saqlangan xabarlar" butunlay o'chadi
  const self = await privateChatId(uid, uid, false);
  if (self) { await db.run('DELETE FROM messages WHERE chat_id=?', [self]); await db.run('DELETE FROM chat_members WHERE chat_id=?', [self]); await db.run('DELETE FROM chats WHERE id=?', [self]); }
  const stories = await db.all('SELECT id, file FROM stories WHERE user_id=?', [uid]);
  for (const st of stories) { await db.run('DELETE FROM story_views WHERE story_id=?', [st.id]); safeRemove(st.file); }
  await db.run('DELETE FROM stories WHERE user_id=?', [uid]);
  for (const r of await db.all('SELECT file FROM reels WHERE user_id=? AND file IS NOT NULL', [uid])) safeRemove(r.file);
  await db.run('DELETE FROM reels WHERE user_id=?', [uid]);
  await db.run('DELETE FROM story_views WHERE user_id=?', [uid]);
  await db.run('DELETE FROM contacts WHERE owner_id=? OR user_id=?', [uid, uid]);
  await db.run('DELETE FROM push_subs WHERE user_id=?', [uid]);
  await db.run('DELETE FROM reactions WHERE user_id=?', [uid]);
  if (req.user.email) await db.run('DELETE FROM codes WHERE phone=?', ['mail:' + req.user.email]).catch(() => {});
  if (req.user.avatar) safeRemove(req.user.avatar);
  // profil anonimlashtiriladi (shaxsiy chatlardagi yozishmalar suhbatdoshda "O'chirilgan akkaunt" nomi bilan qoladi)
  await db.run("UPDATE users SET phone=?, email=NULL, name=NULL, username=NULL, bio='', avatar=NULL, search='', deleted=1, last_seen=? WHERE id=?", ['deleted:' + uid + ':' + t, t, uid]);
  const u = await getUser(uid);
  await broadcastUser(u).catch(() => {});
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
  broadcastUserCount();
  setTimeout(() => io.in('u' + uid).disconnectSockets(true), 300);
}));

// Suhbatdagi materiallar turlarga ajratilgan holda (profil sahifasidagi bo'limlar)
const SHARED = { media: "type IN ('image','video','round')", voice: "type='voice'", files: "type='file'", links: "type='text' AND (text LIKE '%http://%' OR text LIKE '%https://%')" };
app.get('/api/chats/:id/shared', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  const cond = SHARED[req.query.kind];
  if (!cond || !(await isMember(chatId, req.user.id))) return res.status(400).json({ error: 'bad request' });
  const rows = await db.all(`SELECT * FROM messages WHERE chat_id=? AND deleted=0 AND id NOT IN (SELECT message_id FROM hidden_messages WHERE user_id=?) AND ${cond} ORDER BY id DESC LIMIT 300`, [chatId, req.user.id]);
  res.json(rows.map(fmtMsg));
}));

// ===== Media qurilmalarda saqlanadi, serverdan o'chiriladi (WhatsApp usuli) =====
// Qabul qiluvchilarning hammasi faylni o'z qurilmasiga yuklab olgach (ack), fayl serverdan o'chiriladi.
// Yuklab olmaganlar uchun fayl MEDIA_TTL_DAYS kun saqlanadi. Kanallar va "Saqlangan xabarlar" — faqat muddat bo'yicha / doimiy.
const MEDIA_TYPES = "('image','video','voice','round','file','gif')";
const MEDIA_TTL = (Number(process.env.MEDIA_TTL_DAYS) || 30) * 24 * 3600e3;
const MEDIA_DELETE = process.env.MEDIA_KEEP !== '1';
app.post('/api/media/ack', auth, wrap(async (req, res) => {
  const ids = [...new Set((Array.isArray(req.body.ids) ? req.body.ids : []).map(Number).filter(Boolean))].slice(0, 300);
  for (const id of ids) {
    const m = await db.get('SELECT id, chat_id, sender_id FROM messages WHERE id=?', [id]);
    if (!m || m.sender_id === req.user.id || !(await isMember(m.chat_id, req.user.id))) continue;
    await db.run('INSERT INTO media_acks(message_id,user_id,at) VALUES(?,?,?) ON CONFLICT(message_id,user_id) DO NOTHING', [id, req.user.id, now()]);
  }
  scheduleSweep();
  res.json({ ok: true });
}));
// Ilova yopiq paytda kelgan, hali qurilmaga yuklanmagan media ro'yxati
app.get('/api/media/pending', auth, wrap(async (req, res) => {
  const rows = await db.all(`SELECT m.* FROM messages m JOIN chat_members cm ON cm.chat_id=m.chat_id AND cm.user_id=?
    LEFT JOIN media_acks a ON a.message_id=m.id AND a.user_id=?
    WHERE m.type IN ${MEDIA_TYPES} AND m.file IS NOT NULL AND m.gone=0 AND m.deleted=0 AND m.sender_id<>? AND a.message_id IS NULL AND m.created_at>?
    ORDER BY m.id DESC LIMIT 200`, [req.user.id, req.user.id, req.user.id, now() - MEDIA_TTL]);
  res.json(rows.map(fmtMsg));
}));
let sweepT = null, sweeping = false;
function scheduleSweep(ms = Number(process.env.MEDIA_SWEEP_MS) || 20000) { if (!sweepT) sweepT = setTimeout(() => { sweepT = null; sweepMedia().catch((e) => console.error('sweep:', e.message)); }, ms); }
async function messageDone(m, chat) {
  if (now() - m.created_at > MEDIA_TTL) return true;
  if (chat.type === 'channel') return false;
  const rcp = (await db.all('SELECT user_id FROM chat_members WHERE chat_id=? AND user_id<>? AND (joined_at IS NULL OR joined_at<=?)', [m.chat_id, m.sender_id, m.created_at])).map((r) => r.user_id);
  if (!rcp.length) return false; // "Saqlangan xabarlar" — o'chirilmaydi
  const acked = (await db.get(`SELECT COUNT(*) AS c FROM media_acks WHERE message_id=? AND user_id IN (${rcp.map(() => '?').join(',')})`, [m.id, ...rcp])).c;
  return acked >= rcp.length;
}
async function sweepMedia() {
  if (!MEDIA_DELETE || sweeping) return;
  sweeping = true;
  try {
    const files = await db.all(`SELECT DISTINCT file FROM messages WHERE type IN ${MEDIA_TYPES} AND file IS NOT NULL AND gone=0
      AND (id IN (SELECT message_id FROM media_acks WHERE at>?) OR created_at<?) LIMIT 300`, [now() - 2 * 24 * 3600e3, now() - MEDIA_TTL]);
    let n = 0;
    for (const { file } of files) {
      const msgs = await db.all('SELECT * FROM messages WHERE file=? AND gone=0', [file]); // uzatilgan nusxalar ham shu faylni ishlatadi
      let done = true;
      for (const m of msgs) { if (m.deleted) continue; if (!(await messageDone(m, await getChat(m.chat_id)))) { done = false; break; } }
      if (!done) continue;
      await storage.remove(file, UPLOAD_DIR);
      for (const m of msgs) { try { const alt = JSON.parse(m.meta || '{}').alt; if (alt) await storage.remove(alt, UPLOAD_DIR); } catch {} }
      await db.run('UPDATE messages SET gone=1 WHERE file=?', [file]);
      n++;
    }
    if (n) console.log(`🧹 ${n} ta media fayl qurilmalarga yetkazilgani uchun serverdan o‘chirildi`);
  } finally { sweeping = false; }
}

// Fayl yuklash: ovozli/video xabarlar universal formatga o'tkaziladi va doimiy joyga saqlanadi
app.post('/api/upload', auth, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const kind = String(req.query.kind || '');
  let file = req.file.path, mime = req.file.mimetype, size = req.file.size, duration, altPath = null;
  if (['voice', 'round', 'video'].includes(kind)) {
    try {
      const r = await media.normalize(file, kind, mime);
      if (r) { altPath = file; file = r.file; mime = r.mime; size = r.size; duration = r.duration; }
    } catch (e) { console.error('media:', e.message); }
  }
  const url = await storage.save(file, mime);
  const alt = altPath ? await storage.save(altPath, req.file.mimetype) : null;
  for (const u of [url, alt]) if (u) await db.run('INSERT INTO uploads(url,user_id,at) VALUES(?,?,?) ON CONFLICT(url) DO NOTHING', [u, req.user.id, now()]).catch(() => {});
  res.json({ url, alt, mime, size, duration, name: req.file.originalname });
}));

app.post('/api/push/subscribe', auth, wrap(async (req, res) => res.json({ ok: await push.subscribe(req.user.id, req.body) })));
app.post('/api/push/unsubscribe', auth, wrap(async (req, res) => { await push.unsubscribe(req.body.endpoint); res.json({ ok: true }); }));

// ===== Hikoyalar (stories) =====
app.get('/api/stories', auth, wrap(async (req, res) => {
  const ids = [req.user.id, ...(await peersOf(req.user.id))];
  const ph = ids.map(() => '?').join(',');
  const rows = await db.all(`SELECT s.*, (SELECT COUNT(*) FROM story_views v WHERE v.story_id=s.id AND v.user_id=?) AS seen,
    (SELECT COUNT(*) FROM story_views v WHERE v.story_id=s.id) AS views
    FROM stories s WHERE s.user_id IN (${ph}) AND s.expires_at>? ORDER BY s.created_at`, [req.user.id, ...ids, now()]);
  const groups = new Map();
  for (const s of rows) {
    if (!groups.has(s.user_id)) groups.set(s.user_id, []);
    groups.get(s.user_id).push({ id: s.id, file: s.file, mime: s.mime, caption: s.caption, duration: s.duration, created_at: s.created_at, seen: !!s.seen, views: s.user_id === req.user.id ? s.views : undefined });
  }
  const out = [];
  for (const [uid, stories] of groups) out.push({ user: publicUser(await getUser(uid), uid === req.user.id), stories, allSeen: stories.every((x) => x.seen), last: stories.at(-1).created_at });
  out.sort((a, b) => (a.user.id === req.user.id ? -1 : b.user.id === req.user.id ? 1 : (a.allSeen - b.allSeen) || (b.last - a.last)));
  res.json(out);
}));

app.post('/api/stories', auth, wrap(async (req, res) => {
  const { file, mime } = req.body;
  if (!storage.isOurs(file) || !/^(image|video)\//.test(String(mime)) || !(await fileAllowed(file, req.user.id))) return res.status(400).json({ error: 'bad file' });
  const id = await db.insert('INSERT INTO stories(user_id,file,mime,caption,duration,pinned,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)',
    [req.user.id, file, mime, String(req.body.caption || '').slice(0, 300), Number(req.body.duration) || null, req.body.pinned === false ? 0 : 1, now(), now() + STORY_TTL]);
  (await peersOf(req.user.id)).concat(req.user.id).forEach((p) => io.to('u' + p).emit('story:new', { userId: req.user.id }));
  res.json({ ok: true, id });
}));

app.post('/api/stories/:id/view', auth, wrap(async (req, res) => {
  const s = await db.get('SELECT * FROM stories WHERE id=?', [Number(req.params.id)]);
  if (!s) return res.status(404).json({ error: 'not found' });
  if (s.user_id !== req.user.id) {
    await db.run('INSERT INTO story_views(story_id,user_id,at) VALUES(?,?,?) ON CONFLICT(story_id,user_id) DO NOTHING', [s.id, req.user.id, now()]);
    io.to('u' + s.user_id).emit('story:view', { storyId: s.id });
  }
  res.json({ ok: true });
}));

app.get('/api/stories/:id/viewers', auth, wrap(async (req, res) => {
  const s = await db.get('SELECT * FROM stories WHERE id=?', [Number(req.params.id)]);
  if (!s || s.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  const rows = await db.all('SELECT u.*, v.at AS viewed_at FROM story_views v JOIN users u ON u.id=v.user_id WHERE v.story_id=? ORDER BY v.at DESC', [s.id]);
  res.json(rows.map((u) => ({ ...publicUser(u), viewed_at: u.viewed_at })));
}));

app.delete('/api/stories/:id', auth, wrap(async (req, res) => {
  const s = await db.get('SELECT * FROM stories WHERE id=?', [Number(req.params.id)]);
  if (!s || s.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  await db.run('DELETE FROM story_views WHERE story_id=?', [s.id]);
  await db.run('DELETE FROM stories WHERE id=?', [s.id]);
  safeRemove(s.file);
  res.json({ ok: true });
}));

// ===== Reels: foydalanuvchilar O'ZLARI joylagan qisqa videolar (yoki o'z Instagram havolasi) =====
// Lentaga faqat shu yerda ataylab joylangan narsa tushadi — chat xabarlaridan hech narsa olinmaydi.
const IG_RX = /^https?:\/\/(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]{5,})/i;
const reelOutBase = async (r, me) => ({ id: r.id, kind: r.kind, file: r.file, mime: r.mime, igKind: r.ig_kind, igCode: r.ig_code, caption: r.caption, duration: r.duration,
  created_at: r.created_at, user: publicUser(await getUser(r.user_id), r.user_id === me), mine: r.user_id === me });
const reelOut = async (r, me) => {
  const o = await reelOutBase(r, me);
  try {
    o.likes = Number((await db.get('SELECT COUNT(*) AS c FROM reel_likes WHERE reel_id=?', [r.id])).c) || 0;
    o.liked = !!(await db.get('SELECT 1 AS x FROM reel_likes WHERE reel_id=? AND user_id=?', [r.id, me]));
    o.comments = Number((await db.get('SELECT COUNT(*) AS c FROM reel_comments WHERE reel_id=?', [r.id])).c) || 0;
  } catch { o.likes = 0; o.liked = false; o.comments = 0; }
  return o;
};
app.post('/api/reels/:id/like', auth, rateLimit('reellike', 600, 3600e3), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await db.get('SELECT id FROM reels WHERE id=?', [id]))) return res.status(404).json({ error: 'not found' });
  const had = await db.get('SELECT 1 AS x FROM reel_likes WHERE reel_id=? AND user_id=?', [id, req.user.id]);
  if (had) await db.run('DELETE FROM reel_likes WHERE reel_id=? AND user_id=?', [id, req.user.id]);
  else await db.run('INSERT INTO reel_likes(reel_id,user_id,at) VALUES(?,?,?) ON CONFLICT(reel_id,user_id) DO NOTHING', [id, req.user.id, now()]);
  res.json({ liked: !had, likes: Number((await db.get('SELECT COUNT(*) AS c FROM reel_likes WHERE reel_id=?', [id])).c) || 0 });
}));
app.get('/api/reels/:id/comments', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const reel = await db.get('SELECT user_id FROM reels WHERE id=?', [id]); if (!reel) return res.status(404).json({ error: 'not found' });
  const rows = await db.all('SELECT * FROM reel_comments WHERE reel_id=? ORDER BY id DESC LIMIT 100', [id]);
  const items = await Promise.all(rows.map(async (c) => { const u = await getUser(c.user_id); return { id: c.id, text: c.text, at: Number(c.at), mine: c.user_id === req.user.id, canDelete: c.user_id === req.user.id || reel.user_id === req.user.id, user: u ? publicUser(u, c.user_id === req.user.id) : { id: c.user_id, name: '?' } }; }));
  res.json({ items });
}));
app.post('/api/reels/:id/comments', auth, rateLimit('reelcmt', 120, 3600e3), wrap(async (req, res) => {
  const id = Number(req.params.id); const text = String(req.body.text || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'empty' });
  if (!(await db.get('SELECT id FROM reels WHERE id=?', [id]))) return res.status(404).json({ error: 'not found' });
  await db.insert('INSERT INTO reel_comments(reel_id,user_id,text,at) VALUES(?,?,?,?)', [id, req.user.id, text, now()]);
  res.json({ ok: true, comments: Number((await db.get('SELECT COUNT(*) AS c FROM reel_comments WHERE reel_id=?', [id])).c) || 0 });
}));
app.delete('/api/reels/:id/comments/:cid', auth, wrap(async (req, res) => {
  const c = await db.get('SELECT * FROM reel_comments WHERE id=? AND reel_id=?', [Number(req.params.cid), Number(req.params.id)]);
  if (!c) return res.json({ ok: true });
  const reel = await db.get('SELECT user_id FROM reels WHERE id=?', [c.reel_id]);
  if (c.user_id !== req.user.id && reel?.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  await db.run('DELETE FROM reel_comments WHERE id=?', [c.id]); res.json({ ok: true });
}));
app.get('/api/reels', auth, wrap(async (req, res) => {
  const before = Number(req.query.before) || 1e15;
  const rows = await db.all('SELECT r.* FROM reels r JOIN users u ON u.id=r.user_id WHERE r.id<? AND u.name IS NOT NULL ORDER BY r.id DESC LIMIT 20', [before]);
  res.json({ items: await Promise.all(rows.map((r) => reelOut(r, req.user.id))), next: rows.length === 20 ? rows[rows.length - 1].id : null });
}));
app.post('/api/reels', auth, rateLimit('reelpost', 30, 3600e3), wrap(async (req, res) => {
  const caption = String(req.body.caption || '').slice(0, 300);
  let row;
  if (req.body.ig) {
    const m = IG_RX.exec(String(req.body.ig).trim());
    if (!m) return res.status(400).json({ error: tr(req.body.lang, 'Instagram Reels havolasi noto‘g‘ri', 'Неверная ссылка Instagram', 'Invalid Instagram link') });
    row = ['ig', null, null, m[1].toLowerCase().startsWith('reel') ? 'reel' : m[1].toLowerCase(), m[2], null];
  } else {
    const { file, mime } = req.body;
    if (!storage.isOurs(file) || !/^video\//.test(String(mime)) || !(await fileAllowed(file, req.user.id))) return res.status(400).json({ error: 'bad file' });
    row = ['video', file, mime, null, null, Number(req.body.duration) || null];
  }
  const id = await db.insert('INSERT INTO reels(user_id,kind,file,mime,ig_kind,ig_code,duration,caption,created_at) VALUES(?,?,?,?,?,?,?,?,?)', [req.user.id, ...row, caption, now()]);
  res.json(await reelOut(await db.get('SELECT * FROM reels WHERE id=?', [id]), req.user.id));
}));
app.delete('/api/reels/:id', auth, wrap(async (req, res) => {
  const r = await db.get('SELECT * FROM reels WHERE id=?', [Number(req.params.id)]);
  if (!r || r.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  await db.run('DELETE FROM reels WHERE id=?', [r.id]);
  await db.run('DELETE FROM reel_likes WHERE reel_id=?', [r.id]).catch(() => {}); await db.run('DELETE FROM reel_comments WHERE reel_id=?', [r.id]).catch(() => {});
  if (r.file) safeRemove(r.file);
  res.json({ ok: true });
}));

// Profildagi "Postlar" — saqlangan hikoyalar
app.get('/api/users/:id/posts', auth, wrap(async (req, res) => {
  const uid = Number(req.params.id);
  const rows = await db.all('SELECT id,file,mime,caption,duration,created_at FROM stories WHERE user_id=? AND (pinned=1 OR expires_at>?) ORDER BY created_at DESC LIMIT 200', [uid, now()]);
  res.json(rows);
}));

// ===== Guruhlar va kanallar =====
const newInvite = () => crypto.randomBytes(9).toString('base64url');
const USERNAME_RE = /^[a-z][a-z0-9_]{4,31}$/;
async function usernameTaken(name, exceptChat) {
  return !!(await db.get('SELECT id FROM users WHERE username=?', [name])) || !!(await db.get('SELECT id FROM chats WHERE username=? AND id<>?', [name, exceptChat || 0]));
}
async function addMember(chatId, uid, role = 'member') {
  await db.run(`INSERT INTO chat_members(chat_id,user_id,role,joined_at) VALUES(?,?,?,?) ON CONFLICT(chat_id,user_id) DO NOTHING`, [chatId, uid, role, now()]);
}
async function systemMsg(chatId, uid, text, meta = {}) {
  const id = await db.insert('INSERT INTO messages(chat_id,sender_id,type,text,meta,created_at) VALUES(?,?,?,?,?,?)', [chatId, uid, 'service', text, JSON.stringify(meta), now()]);
  const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [id]));
  for (const m of await membersOf(chatId)) io.to('u' + m).emit('message:new', { message: msg, chat: await chatSummary(chatId, m) });
}
app.post('/api/groups', auth, wrap(async (req, res) => {
  const lang = req.body.lang;
  const type = req.body.type === 'channel' ? 'channel' : 'group';
  const title = String(req.body.title || '').trim().slice(0, 80);
  if (!title) return res.status(400).json({ error: tr(lang, 'Nom kiriting', 'Введите название', 'Enter a name') });
  let username = String(req.body.username || '').trim().replace(/^@/, '').toLowerCase() || null;
  if (username && (!USERNAME_RE.test(username) || await usernameTaken(username))) return res.status(400).json({ error: tr(lang, 'Bu havola band yoki noto‘g‘ri (5–32 lotin harf, raqam, _)', 'Ссылка занята или неверна (5–32 латиница, цифры, _)', 'Link is taken or invalid (5–32 latin letters, digits, _)') });
  const id = await db.insert('INSERT INTO chats(type,title,about,username,invite,owner_id,created_at) VALUES(?,?,?,?,?,?,?)',
    [type, title, String(req.body.about || '').slice(0, 255), username, newInvite(), req.user.id, now()]);
  await addMember(id, req.user.id, 'owner');
  const ids = Array.isArray(req.body.members) ? [...new Set(req.body.members.map(Number))].filter((x) => x && x !== req.user.id).slice(0, 200) : [];
  for (const uid of ids) if (await getUser(uid)) await addMember(id, uid, 'member');
  await systemMsg(id, req.user.id, 'created', { action: 'created', type });
  res.json(await chatSummary(id, req.user.id));
}));
app.get('/api/chats/:id/info', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  const role = chat && await roleOf(chat.id, req.user.id);
  if (!chat || chat.type === 'private') return res.status(404).json({ error: 'not found' });
  if (!role && !chat.username) return res.status(403).json({ error: 'forbidden' });
  const count = (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE chat_id=?', [chat.id])).c;
  const showMembers = chat.type === 'group' || isAdmin(role);
  const members = showMembers ? (await db.all(`SELECT u.*, m.role FROM chat_members m JOIN users u ON u.id=m.user_id WHERE m.chat_id=?
    ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.name LIMIT 300`, [chat.id])).map((u) => ({ ...publicUser(u), role: u.role })) : [];
  res.json({ ...publicChat(chat, { members: count, role, invite: isAdmin(role) ? chat.invite : undefined }), memberList: members });
}));
app.post('/api/chats/:id/edit', auth, wrap(async (req, res) => {
  const lang = req.body.lang;
  const chat = await getChat(req.params.id);
  if (!chat || chat.type === 'private' || !isAdmin(await roleOf(chat.id, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  const title = String(req.body.title ?? chat.title).trim().slice(0, 80) || chat.title;
  let username = req.body.username === undefined ? chat.username : (String(req.body.username || '').trim().replace(/^@/, '').toLowerCase() || null);
  if (username && username !== chat.username && (!USERNAME_RE.test(username) || await usernameTaken(username, chat.id)))
    return res.status(400).json({ error: tr(lang, 'Bu havola band yoki noto‘g‘ri', 'Ссылка занята или неверна', 'Link is taken or invalid') });
  await db.run('UPDATE chats SET title=?, about=?, username=? WHERE id=?', [title, String(req.body.about ?? chat.about ?? '').slice(0, 255), username, chat.id]);
  for (const m of await membersOf(chat.id)) io.to('u' + m).emit('chat:update', await chatSummary(chat.id, m));
  res.json(await chatSummary(chat.id, req.user.id));
}));
app.post('/api/chats/:id/avatar', auth, upload.single('file'), wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  if (!chat || chat.type === 'private' || !isAdmin(await roleOf(chat.id, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  if (!req.file || !/^image\//.test(req.file.mimetype)) return res.status(400).json({ error: 'image required' });
  const url = await storage.save(req.file.path, req.file.mimetype);
  if (chat.avatar) safeRemove(chat.avatar);
  await db.run('UPDATE chats SET avatar=? WHERE id=?', [url, chat.id]);
  for (const m of await membersOf(chat.id)) io.to('u' + m).emit('chat:update', await chatSummary(chat.id, m));
  res.json(await chatSummary(chat.id, req.user.id));
}));
app.post('/api/chats/:id/members', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  const role = chat && await roleOf(chat.id, req.user.id);
  if (!chat || chat.type === 'private' || !role || (chat.type === 'channel' && !isAdmin(role))) return res.status(403).json({ error: 'forbidden' });
  const ids = Array.isArray(req.body.userIds) ? req.body.userIds.map(Number).slice(0, 200) : [];
  const added = [];
  for (const uid of ids) { const u = await getUser(uid); if (u && !(await roleOf(chat.id, uid))) { await addMember(chat.id, uid); added.push(u.name); } }
  if (added.length) await systemMsg(chat.id, req.user.id, 'added', { action: 'added', names: added });
  res.json({ ok: true, added: added.length });
}));
app.post('/api/chats/:id/remove', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  const role = chat && await roleOf(chat.id, req.user.id);
  const target = Number(req.body.userId);
  const trole = chat && await roleOf(chat.id, target);
  if (!chat || chat.type === 'private' || !isAdmin(role) || !trole || trole === 'owner' || (trole === 'admin' && role !== 'owner')) return res.status(403).json({ error: 'forbidden' });
  await db.run('DELETE FROM chat_members WHERE chat_id=? AND user_id=?', [chat.id, target]);
  io.to('u' + target).emit('chat:removed', { chatId: chat.id });
  await systemMsg(chat.id, req.user.id, 'removed', { action: 'removed', names: [(await getUser(target))?.name] });
  res.json({ ok: true });
}));
app.post('/api/chats/:id/role', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  if (!chat || chat.type === 'private' || (await roleOf(chat.id, req.user.id)) !== 'owner') return res.status(403).json({ error: 'forbidden' });
  const target = Number(req.body.userId);
  if (!(await roleOf(chat.id, target)) || target === req.user.id) return res.status(400).json({ error: 'bad request' });
  await db.run('UPDATE chat_members SET role=? WHERE chat_id=? AND user_id=?', [req.body.admin ? 'admin' : 'member', chat.id, target]);
  io.to('u' + target).emit('chat:update', await chatSummary(chat.id, target));
  res.json({ ok: true });
}));
app.post('/api/chats/:id/leave', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  const role = chat && await roleOf(chat.id, req.user.id);
  if (!chat || chat.type === 'private' || !role) return res.status(400).json({ error: 'bad request' });
  await db.run('DELETE FROM chat_members WHERE chat_id=? AND user_id=?', [chat.id, req.user.id]);
  if (role === 'owner') { // egasi chiqsa — keyingi admin yoki birinchi a'zo egasi bo'ladi
    const next = await db.get("SELECT user_id FROM chat_members WHERE chat_id=? ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, joined_at LIMIT 1", [chat.id]);
    if (next) { await db.run("UPDATE chat_members SET role='owner' WHERE chat_id=? AND user_id=?", [chat.id, next.user_id]); await db.run('UPDATE chats SET owner_id=? WHERE id=?', [next.user_id, chat.id]); }
  }
  if (chat.type === 'group') await systemMsg(chat.id, req.user.id, 'left', { action: 'left', names: [req.user.name] }).catch(() => {});
  res.json({ ok: true });
}));
app.post('/api/chats/:id/delete', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  if (!chat || chat.type === 'private' || (await roleOf(chat.id, req.user.id)) !== 'owner') return res.status(403).json({ error: 'forbidden' });
  const members = await membersOf(chat.id);
  const files = await db.all('SELECT file FROM messages WHERE chat_id=? AND file IS NOT NULL', [chat.id]);
  await db.run('DELETE FROM messages WHERE chat_id=?', [chat.id]);
  await db.run('DELETE FROM chat_members WHERE chat_id=?', [chat.id]);
  await db.run('DELETE FROM chats WHERE id=?', [chat.id]);
  files.forEach((f) => safeRemove(f.file));
  if (chat.avatar) safeRemove(chat.avatar);
  members.forEach((m) => io.to('u' + m).emit('chat:removed', { chatId: chat.id }));
  res.json({ ok: true });
}));
app.post('/api/chats/:id/invite/reset', auth, wrap(async (req, res) => {
  const chat = await getChat(req.params.id);
  if (!chat || chat.type === 'private' || !isAdmin(await roleOf(chat.id, req.user.id))) return res.status(403).json({ error: 'forbidden' });
  const invite = newInvite();
  await db.run('UPDATE chats SET invite=? WHERE id=?', [invite, chat.id]);
  res.json({ invite });
}));
// Havola orqali qo'shilish: /?join=<taklif kodi yoki @username>
async function chatByCode(code) {
  code = String(code || '').replace(/^@/, '');
  if (!code) return null;
  return (await db.get("SELECT * FROM chats WHERE type<>'private' AND invite=?", [code])) || (await db.get("SELECT * FROM chats WHERE type<>'private' AND username=?", [code.toLowerCase()]));
}
app.get('/api/join/:code', auth, wrap(async (req, res) => {
  const chat = await chatByCode(req.params.code);
  if (!chat) return res.status(404).json({ error: 'not found' });
  const count = (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE chat_id=?', [chat.id])).c;
  res.json(publicChat(chat, { members: count, joined: !!(await roleOf(chat.id, req.user.id)) }));
}));
app.post('/api/join/:code', auth, wrap(async (req, res) => {
  const chat = await chatByCode(req.params.code);
  if (!chat) return res.status(404).json({ error: 'not found' });
  if (!(await roleOf(chat.id, req.user.id))) {
    await addMember(chat.id, req.user.id);
    if (chat.type === 'group') await systemMsg(chat.id, req.user.id, 'joined', { action: 'joined', names: [req.user.name] });
  }
  res.json(await chatSummary(chat.id, req.user.id));
}));
// Ochiq guruh va kanallarni qidirish
app.get('/api/chats/search', auth, wrap(async (req, res) => {
  const t = String(req.query.q || '').trim().replace(/^@/, '').toLowerCase().replace(/[%_]/g, '');
  if (t.length < 2) return res.json([]);
  const rows = await db.all("SELECT * FROM chats WHERE type<>'private' AND username IS NOT NULL AND (username LIKE ? OR LOWER(title) LIKE ?) LIMIT 20", [t + '%', '%' + t + '%']);
  const out = [];
  for (const c of rows) out.push(publicChat(c, { members: (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE chat_id=?', [c.id])).c }));
  res.json(out);
}));

// ===== Emoji, stikerlar, GIF =====
let EMOJI_CACHE = null;
app.get('/vendor/emoji.json', (req, res) => {
  if (!EMOJI_CACHE) {
    const groups = require('unicode-emoji-json/data-by-group.json');
    EMOJI_CACHE = JSON.stringify(groups.map((g) => ({ g: g.slug, e: g.emojis.map((e) => [e.emoji, e.name]) })));
  }
  res.set('Cache-Control', 'public, max-age=604800').type('application/json').send(EMOJI_CACHE);
});
let NOTO = null, NOTO_CHARS = null;
app.get('/stickers/:cp.svg', (req, res) => {
  if (!NOTO) { NOTO = require('@iconify-json/noto/icons.json'); NOTO_CHARS = require('@iconify-json/noto/chars.json'); }
  const cp = String(req.params.cp).toLowerCase().replace(/[^0-9a-f-]/g, '');
  const name = NOTO_CHARS[cp] || NOTO_CHARS[cp.replace(/-fe0f/g, '')];
  const icon = name && (NOTO.icons[name] || NOTO.icons[NOTO.aliases?.[name]?.parent]);
  if (!icon) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=2592000').type('image/svg+xml')
    .send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width || NOTO.width || 128} ${icon.height || NOTO.height || 128}">${icon.body}</svg>`);
});
// GIF qidiruv (Tenor). TENOR_API_KEY bo'lsa ishlaydi — kalit Google Cloud'da bepul
app.get('/api/gifs', auth, wrap(async (req, res) => {
  const key = process.env.TENOR_API_KEY;
  if (!key) return res.json([]);
  const q = String(req.query.q || '').slice(0, 80);
  const url = q ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}` : 'https://tenor.googleapis.com/v2/featured?';
  const r = await fetch(`${url}&key=${key}&client_key=birga&limit=30&media_filter=tinygif,mp4&locale=${req.user.lang || 'en'}`);
  if (!r.ok) return res.json([]);
  const j = await r.json();
  res.json((j.results || []).map((g) => ({ id: g.id, mp4: g.media_formats?.mp4?.url, preview: g.media_formats?.tinygif?.url, w: g.media_formats?.mp4?.dims?.[0], h: g.media_formats?.mp4?.dims?.[1] })).filter((g) => g.mp4));
}));

app.get(/^\/(?!api\/|uploads\/|socket\.io\/|vendor\/|stickers\/).*/, sendIndex);

// ---------- Socket.IO ----------
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6, pingInterval: 20000, pingTimeout: 25000 });

async function broadcastUser(raw) {
  try {
    const u = publicUser(raw);
    const peers = await peersOf(raw.id);
    peers.forEach((p) => io.to('u' + p).emit('user:update', u));
    io.to('u' + raw.id).emit('user:update', publicUser(raw, true));
  } catch (e) { console.error('broadcastUser:', e.message); }
}

const PREVIEW = {
  image: ['🖼 Rasm', '🖼 Фото', '🖼 Photo'], video: ['🎬 Video', '🎬 Видео', '🎬 Video'], voice: ['🎤 Ovozli xabar', '🎤 Голосовое сообщение', '🎤 Voice message'],
  round: ['⏺ Video xabar', '⏺ Видеосообщение', '⏺ Video message'], file: ['📎 Fayl', '📎 Файл', '📎 File'],
  sticker: ['Stiker', 'Стикер', 'Sticker'], gif: ['GIF', 'GIF', 'GIF'], location: ['📍 Joylashuv', '📍 Геопозиция', '📍 Location'], game: ['🎮 O‘yinga taklif', '🎮 Приглашение в игру', '🎮 Game invite'], poll: ['📊 So‘rovnoma', '📊 Опрос', '📊 Poll'], call: ['📞 Guruh qo‘ng‘irog‘i boshlandi — qo‘shiling', '📞 Начался групповой звонок — присоединяйтесь', '📞 Group call started — join'],
};
function previewFor(m, lang) {
  const i = Math.max(0, LANGS.indexOf(lang));
  if (m.type === 'text') return m.text.slice(0, 120);
  if (m.type === 'sticker') { let e = ''; try { e = (typeof m.meta === 'string' ? JSON.parse(m.meta || '{}') : m.meta || {}).e || ''; } catch {} return (e + ' ' + PREVIEW.sticker[i]).trim(); }
  return (PREVIEW[m.type]?.[i] || '') + (m.text ? ': ' + m.text.slice(0, 80) : '');
}
function cleanMeta(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const o = {};
  if (Array.isArray(meta.waveform)) o.waveform = meta.waveform.slice(0, 64).map((v) => Math.max(0, Math.min(1, Number(v) || 0)));
  if (typeof meta.name === 'string') o.name = meta.name.slice(0, 200);
  if (storage.isOurs(meta.alt)) o.alt = meta.alt;
  if (meta.fwd && typeof meta.fwd === 'object') o.fwd = { name: String(meta.fwd.name || '').slice(0, 80), uid: Number(meta.fwd.uid) || undefined };
  if (typeof meta.e === 'string' && meta.e.length <= 16) o.e = meta.e;
  if (typeof meta.cp === 'string' && /^[0-9a-f-]{2,60}$/.test(meta.cp)) o.cp = meta.cp;
  if (typeof meta.font === 'string' && /^[a-z0-9-]{1,24}$/.test(meta.font)) o.font = meta.font; // yozuvchi tanlagan shrift
  if (typeof meta.sk === 'string' && /^[a-z0-9_-]{1,20}\/[a-z0-9_-]{1,30}$/.test(meta.sk)) o.sk = meta.sk; // Birga stiker to'plami
  if (storage.isOurs(meta.su)) o.su = meta.su; // foydalanuvchi yasagan stiker
  if (meta.loc && typeof meta.loc === 'object') {
    const lat = Number(meta.loc.lat), lng = Number(meta.loc.lng);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && isFinite(lat) && isFinite(lng))
      o.loc = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, name: String(meta.loc.name || '').slice(0, 120), addr: String(meta.loc.addr || '').slice(0, 240) };
      const lv = Number(meta.loc.live); if (lv > now() - 5e3 && lv < now() + 61 * 60e3) { o.loc.live = Math.round(lv); o.loc.upd = Number(meta.loc.upd) || now(); if (meta.loc.acc) o.loc.acc = Math.min(5000, Math.round(Number(meta.loc.acc)) || 0); }
  }
  if (meta.poll && typeof meta.poll === 'object') {
    const q = String(meta.poll.q || '').trim().slice(0, 300);
    const opts = (Array.isArray(meta.poll.opts) ? meta.poll.opts : []).map((x) => String(x || '').trim().slice(0, 100)).filter(Boolean).slice(0, 10);
    if (q && opts.length >= 2) { o.poll = { q, opts, multi: !!meta.poll.multi }; const c = Number(meta.poll.quiz); if (Number.isInteger(c) && c >= 0 && c < opts.length) { o.poll.quiz = c; o.poll.multi = false; } if (meta.poll.expl) o.poll.expl = String(meta.poll.expl).slice(0, 200); }
  }
  if (meta.ai === 1 && meta._srv === AI_SECRET) o.ai = 1; // faqat server qo'yadi
  if (meta.group === 1 && meta._srv === AI_SECRET) Object.assign(o, { group: 1, gid: String(meta.gid || ''), status: String(meta.status || ''), video: !!meta.video });
  if (meta.game && typeof meta.game === 'object' && MP_GAMES.has(meta.game.g) && /^[a-f0-9]{12}$/.test(String(meta.game.room))) o.game = { g: meta.game.g, room: meta.game.room };
  for (const k of ['w', 'h']) { const v = Math.round(Number(meta[k])); if (v > 0 && v <= 20000) o[k] = v; }
  if (typeof meta.gif === 'string' && /^https:\/\/media\d*\.tenor\.com\/[\w./-]+$/.test(meta.gif)) { o.gif = meta.gif; o.w = Number(meta.w) || undefined; o.h = Number(meta.h) || undefined; }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}

// Birga'dagi jami foydalanuvchilar soni (ro'yxatdan to'liq o'tganlar) — hammaga jonli ko'rsatiladi
let userCount = null;
async function countUsers(fresh) {
  if (fresh || userCount == null) userCount = Number((await db.get('SELECT COUNT(*) AS c FROM users WHERE name IS NOT NULL AND COALESCE(deleted,0)=0 AND COALESCE(banned,0)=0')).c) || 0;
  return userCount;
}
async function broadcastUserCount() { try { io.emit('stats:users', { n: await countUsers(true) }); } catch (e) { console.error('count:', e.message); } }
app.get('/api/stats/users', wrap(async (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ n: await countUsers() }); }));

const sentCids = new Map();
setInterval(() => { const t = now(); for (const [k, v] of sentCids) if (t - v.at > 30 * 60e3) sentCids.delete(k); }, 300e3).unref();

io.use(async (socket, next) => {
  try { const u = await userFromToken(socket.handshake.auth?.token); socket.uid = u.id; socket.sid = u._sid; next(); }
  catch { next(new Error('unauthorized')); }
});

const MSG_TYPES = new Set(['text', 'image', 'video', 'voice', 'round', 'file', 'sticker', 'gif', 'location', 'poll']);
const NO_FILE = new Set(['text', 'sticker', 'gif', 'location', 'poll']);
// Xabar yuborish huquqi: kanalda faqat admin, guruh/shaxsiyda a'zolar
// Fayllar: kim yuklagani yoziladi; faylni boshqa joyda ishlatilayotgan bo'lsa o'chirilmaydi (uzatilgan nusxalar, hikoyalar...)
async function fileAllowed(url, uid) {
  const row = await db.get('SELECT user_id FROM uploads WHERE url=?', [url]).catch(() => null);
  return !row || Number(row.user_id) === Number(uid); // eski (yozuvsiz) fayllar — ruxsat
}
async function fileInUse(url) {
  if (!url) return false;
  const q = async (sql) => !!(await db.get(sql, [url]).catch(() => null));
  return (await q('SELECT 1 AS x FROM messages WHERE file=? AND deleted=0 AND gone=0 LIMIT 1')) || (await q('SELECT 1 AS x FROM stories WHERE file=? LIMIT 1'))
    || (await q('SELECT 1 AS x FROM reels WHERE file=? LIMIT 1')) || (await q('SELECT 1 AS x FROM users WHERE avatar=? LIMIT 1')) || (await q('SELECT 1 AS x FROM chats WHERE avatar=? LIMIT 1'));
}
// biroz kechiktirib tekshiriladi — chaqirgan joy bazani (o'chirish/yangilash) yangilab ulgursin
function safeRemove(url) {
  if (!url) return;
  setTimeout(async () => { try { if (!(await fileInUse(url))) { await storage.remove(url, UPLOAD_DIR); await db.run('DELETE FROM uploads WHERE url=?', [url]).catch(() => {}); } } catch (e) { console.error('remove:', e.message); } }, 3000).unref?.();
}

// Bloklash: blocker -> blocked
const isBlocked = async (blocker, blocked) => !!(await db.get('SELECT 1 AS x FROM blocks WHERE owner_id=? AND user_id=?', [blocker, blocked]));
async function privatePeer(chatId, uid) {
  const c = await getChat(chatId); if (c?.type !== 'private') return null;
  return (await db.get('SELECT user_id FROM chat_members WHERE chat_id=? AND user_id<>?', [chatId, uid]))?.user_id || null;
}
async function canPost(chatId, uid) {
  const chat = await getChat(chatId); const role = await roleOf(chatId, uid);
  if (!chat || !role) return false;
  return chat.type !== 'channel' || isAdmin(role);
}
async function saveMessage(chatId, uid, p, metaObj) {
  const id = await db.insert(`INSERT INTO messages(chat_id,sender_id,type,text,file,mime,size,duration,meta,reply_to,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [chatId, uid, p.type, String(p.text || '').slice(0, 4096), p.file || null, p.mime || null, Number(p.size) || null, Number(p.duration) || null, cleanMeta(metaObj), Number(p.replyTo) || null, now()]);
  const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [id]));
  await db.run('UPDATE chat_members SET last_read_id=? WHERE chat_id=? AND user_id=?', [msg.id, chatId, uid]);
  await db.run('UPDATE chat_members SET archived=0 WHERE chat_id=? AND archived=1 AND muted=0', [chatId]); // ovozi o'chirilmagan arxiv chatlari yangi xabarda qaytadi
  const sender = await getUser(uid); const chat = await getChat(chatId);
  for (const m of await membersOf(chatId)) {
    const summary = await chatSummary(chatId, m);
    io.to('u' + m).emit('message:new', { message: msg, chat: summary });
    if (m !== uid && !online.has(m) && !summary.muted) {
      const rcp = await getUser(m);
      const title = chat.type === 'private' ? sender.name : chat.title;
      const body = (chat.type === 'group' ? sender.name + ': ' : '') + previewFor(msg, rcp?.lang);
      push.send(m, { type: 'msg', chatId, title, body, icon: chat.type === 'private' ? sender.avatar : chat.avatar, tag: 'chat' + chatId }).catch(() => {});
    }
    else if (m !== uid && !summary.muted && nativeQ.has(m)) { // ilova fonda bo'lsa ham (socket ulangan) — telefonga bildirishnoma
      const rcp = await getUser(m);
      nativeEnqueue(m, { type: 'msg', chatId, title: chat.type === 'private' ? sender.name : chat.title, body: (chat.type === 'group' ? sender.name + ': ' : '') + previewFor(msg, rcp?.lang), tag: 'chat' + chatId });
    }
  }
  return msg;
}
// ===== Rejalashtirilgan xabarlarni vaqtida yuborish =====
async function sendScheduled(r) {
  const chatId = Number(r.chat_id), uid = Number(r.user_id);
  const peer = await privatePeer(chatId, uid);
  if (!(await canPost(chatId, uid)) || (peer && ((await isBlocked(peer, uid)) || (await isBlocked(uid, peer))))) return;
  await saveMessage(chatId, uid, { type: 'text', text: r.text, replyTo: r.reply_to }, null);
}
let schedBusy = false, SCHED_READY = false;
setInterval(async () => {
  if (schedBusy || !SCHED_READY) return; schedBusy = true;
  try {
    const due = await db.all('SELECT * FROM scheduled WHERE at<=? ORDER BY at ASC LIMIT 25', [now()]);
    for (const r of due) {
      await db.run('DELETE FROM scheduled WHERE id=?', [r.id]);
      try { await sendScheduled(r); } catch (e) { console.error('scheduled:', e.message); }
      io.to('u' + r.user_id).emit('msg:scheduled', { chatId: Number(r.chat_id) });
    }
  } catch (e) { if (!/no such table|does not exist/.test(e.message)) console.error('scheduler:', e.message); }
  schedBusy = false;
}, 15e3).unref();
// Render bepul rejimida server uxlab qolmasligi uchun: rejalashtirilgan xabar bo'lsa — o'ziga murojaat qiladi
setInterval(async () => {
  const base = process.env.RENDER_EXTERNAL_URL; if (!base) return;
  try { const n = Number((await db.get('SELECT COUNT(*) AS c FROM scheduled', [])).c); if (n > 0) await fetch(base + '/api/stats/users').catch(() => {}); } catch {}
}, 9 * 60e3).unref();

// ===== Chat ichida Birga AI: "@ai savol" — suhbatni o'qib, hammaga javob beradi =====
const AI_TRIGGER = /^\s*(@ai\b|@yordamchi\b|@birga\s*(ai|yordamchi)\b|@birgaai\b|\/ai\b)/i;
async function chatAI(chatId, uid, msg) {
  if (!rateOk('chatai' + uid, 30, 3600e3)) return;
  const members = await membersOf(chatId);
  const tell = (on) => members.forEach((u) => io.to('u' + u).emit('ai:thinking', { chatId, on, by: uid }));
  tell(true);
  try {
    const rows = (await db.all(`SELECT m.*, u.name AS sname FROM messages m LEFT JOIN users u ON u.id=m.sender_id WHERE m.chat_id=? AND m.deleted=0 AND m.id<=? ORDER BY m.id DESC LIMIT 20`, [chatId, msg.id])).reverse();
    const line = (m) => { const meta = (() => { try { return JSON.parse(m.meta || '{}'); } catch { return {}; } })();
      const who = meta.ai ? 'Birga yordamchi' : m.sname || '?';
      const body = m.type === 'text' ? m.text : m.type === 'poll' ? `[so'rovnoma: ${meta.poll?.q} — ${(meta.poll?.opts || []).join(' / ')}]` : `[${(PREVIEW[m.type]?.[0] || m.type)}]${m.text ? ' ' + m.text : ''}`;
      return `${who}: ${String(body || '').slice(0, 600)}`; };
    const q = msg.text.replace(AI_TRIGGER, '').trim();
    const asker = (await getUser(uid))?.name || '';
    const prompt = `Sen Birga messenjeridagi chatga chaqirilding. Quyida chatdagi so'nggi xabarlar:\n---\n${rows.map(line).join('\n')}\n---\n${asker} senga savol berdi: "${q || '(savolsiz chaqirdi — suhbat mazmuniga qarab foydali javob yoki xulosa ber)'}"\nSuhbatdoshlar ikkalasi ham javobingni ko'radi. Qisqa, aniq va foydali javob ber, suhbat tilida yoz. Nizoli savol bo'lsa — xolis bo'l.`;
    const r = await aiAnswer([{ role: 'user', content: prompt }]);
    const text = r?.text ? r.text + (r.sources?.length ? '\n\n' + r.sources.slice(0, 3).map((s, i) => `[${i + 1}. ${s.title || 'manba'}](${s.url})`).join('\n') : '') : '⚠️ Birga yordamchi hozir javob bera olmadi. Birozdan keyin qayta urinib ko‘ring.';
    await saveMessage(chatId, uid, { type: 'text', text: text.slice(0, 4096), replyTo: msg.id }, { ai: 1, _srv: AI_SECRET });
  } finally { tell(false); }
}

const gcalls = new Map(); // chatId -> guruh qo'ng'irog'i
const gcallView = (chatId) => { const g = gcalls.get(chatId); return g ? { active: true, gid: g.id, video: g.video, started: g.started, count: g.peers.size, peers: [...g.peers.keys()] } : { active: false }; };
async function broadcastGcall(chatId) { const v = gcallView(chatId); (await membersOf(chatId)).forEach((u) => io.to('u' + u).emit('gcall:update', { chatId, ...v })); }
async function gcallLeave(chatId, uid) {
  const g = gcalls.get(chatId); if (!g || !g.peers.has(uid)) return;
  g.peers.delete(uid); g.peers.forEach((_, x) => io.to('u' + x).emit('gcall:left', { chatId, uid }));
  if (!g.peers.size) setTimeout(() => endGcall(chatId, g.id).catch(() => {}), 20000); // hamma chiqsa — 20 soniyadan keyin tugaydi
  broadcastGcall(chatId);
}
async function endGcall(chatId, gid) {
  const g = gcalls.get(chatId); if (!g || g.id !== gid || g.peers.size) return;
  gcalls.delete(chatId);
  if (g.msgId) {
    await db.run('UPDATE messages SET meta=?, duration=? WHERE id=?', [JSON.stringify({ group: 1, gid: g.id, status: 'ended', video: g.video }), Math.round((now() - g.started) / 1000), g.msgId]);
    const full = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [g.msgId]));
    (await membersOf(chatId)).forEach((u) => io.to('u' + u).emit('message:edited', { message: full }));
  }
  broadcastGcall(chatId);
}
const rooms = new Map(), roomLoads = new Map(); // o'yin xonalari keshi
setInterval(() => { const t = now(); for (const [k, r] of rooms) if (t - r.updated > 3600e3) rooms.delete(k); }, 600e3).unref();
async function loadRoom(id) {
  id = String(id || ''); if (!/^[a-f0-9]{12}$/.test(id)) return null;
  if (rooms.has(id)) return rooms.get(id);
  if (roomLoads.has(id)) return roomLoads.get(id);
  const job = (async () => {
  const row = await db.get('SELECT * FROM game_rooms WHERE id=?', [id]); if (!row) return null;
  const j = (x, d) => { try { return JSON.parse(x) ?? d; } catch { return d; } };
  const r = { ...row, a: Number(row.a), b: row.b == null ? null : Number(row.b), chat_id: Number(row.chat_id), winner: row.winner == null ? null : Number(row.winner),
    moves: j(row.moves, []), claims: j(row.claims, {}), secret: j(row.secret, {}), updated: Number(row.updated) };
  rooms.set(id, r); return r;
  })().finally(() => roomLoads.delete(id));
  roomLoads.set(id, job); return job;
}
const pendingCalls = new Map(); // calleeId -> { offer, ice[], expires, callId, from }
const on = (socket, ev, fn) => socket.on(ev, (...a) => Promise.resolve(fn(...a)).catch((e) => { console.error(ev, e.message); const ack = a.find((x) => typeof x === 'function'); ack?.({ error: 'server' }); }));

io.on('connection', async (socket) => {
  const uid = socket.uid;
  socket.join('u' + uid);
  socket.emit('app:version', { v: APP_VERSION });
  countUsers().then((n) => socket.emit('stats:users', { n })).catch(() => {});
  online.set(uid, (online.get(uid) || 0) + 1);
  db.run('UPDATE users SET last_seen=? WHERE id=?', [now(), uid]).catch(() => {}); // kutilmaydi: hodisalar darhol qabul qilinishi kerak
  getUser(uid).then((u) => u && broadcastUser(u)).catch(() => {});

  const pc = pendingCalls.get(uid);
  if (pc && pc.expires > now()) {
    setTimeout(() => {
      socket.emit('call:offer', pc.offer);
      pc.ice.forEach((c) => socket.emit('call:ice', c));
      io.to('u' + pc.from).emit('call:ringing', { callId: pc.callId, from: uid });
    }, 300);
  }

  on(socket, 'message:send', async (p, ack) => {
    const chatId = Number(p?.chatId);
    if (!MSG_TYPES.has(p?.type) || !(await canPost(chatId, uid))) return ack?.({ error: 'forbidden' });
    const text = String(p.text || '').slice(0, 4096);
    if (p.type === 'text' && !text.trim()) return ack?.({ error: 'empty' });
    const file = storage.isOurs(p.file) && (await fileAllowed(p.file, uid)) ? p.file : null; // faqat o'zi yuklagan fayl
    if (!NO_FILE.has(p.type) && !file) return ack?.({ error: 'no file' });
    if (p.type === 'sticker' && !(p.meta?.e)) return ack?.({ error: 'bad sticker' });
    if (p.type === 'gif' && !cleanMeta({ gif: p.meta?.gif })) return ack?.({ error: 'bad gif' });
    if (p.type === 'location' && !cleanMeta({ loc: p.meta?.loc })) return ack?.({ error: 'bad location' });
    if (p.type === 'location' && [15, 30, 50].includes(Number(p.meta?.loc?.liveMin))) p = { ...p, meta: { ...p.meta, loc: { ...p.meta.loc, live: now() + Number(p.meta.loc.liveMin) * 60e3, upd: now() } } };
    else if (p.type === 'location' && p.meta?.loc) p = { ...p, meta: { ...p.meta, loc: { ...p.meta.loc, live: undefined } } };
    if (p.type === 'poll') { const pm = cleanMeta({ poll: p.meta?.poll }); if (!pm) return ack?.({ error: 'bad poll' }); p = { ...p, text: JSON.parse(pm).poll.q }; }
    if (p.meta && typeof p.meta === 'object') { p = { ...p, meta: { ...p.meta } }; delete p.meta.ai; delete p.meta._srv; }
    const peerId = await privatePeer(chatId, uid);
    if (peerId && (await isBlocked(peerId, uid))) return ack?.({ error: 'blocked' });
    if (peerId && (await isBlocked(uid, peerId))) return ack?.({ error: 'you_blocked' });
    // takroriy yuborish (javob yo'qolib, mijoz qayta urinsa) — bitta xabar bo'lib qoladi
    const cid = typeof p.cid === 'string' && p.cid.length <= 40 ? `${uid}:${p.cid}` : null;
    if (cid && sentCids.has(cid)) { try { return ack?.({ ok: true, message: await sentCids.get(cid).p }); } catch { sentCids.delete(cid); } }
    const job = saveMessage(chatId, uid, { ...p, text: p.type === 'poll' ? p.text : text, file }, p.meta);
    if (cid) sentCids.set(cid, { p: job, at: now() });
    try { const msg = await job; ack?.({ ok: true, message: msg }); if (p.type === 'text' && AI_TRIGGER.test(text)) chatAI(chatId, uid, msg).catch((e) => console.error('chat AI:', e.message)); }
    catch (e) { if (cid) sentCids.delete(cid); throw e; }
  });

  // ===== Jonli joylashuv: yuboruvchi har bir necha soniyada yangilaydi =====
  on(socket, 'loc:update', async (p, ack) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(p?.id) || 0]);
    if (!m || m.sender_id !== uid || m.type !== 'location' || m.deleted) return ack?.({ error: 'forbidden' });
    const meta = JSON.parse(m.meta || '{}'); const loc = meta.loc || {};
    if (!loc.live || loc.live < now()) return ack?.({ error: 'ended' });
    const lat = Number(p.lat), lng = Number(p.lng); if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return ack?.({ error: 'bad' });
    if (!rateOk('locu' + m.id, 40, 60e3)) return ack?.({ error: 'rate' });
    if (p.stop) loc.live = now(); else { loc.lat = Math.round(lat * 1e6) / 1e6; loc.lng = Math.round(lng * 1e6) / 1e6; loc.upd = now(); if (p.acc) loc.acc = Math.min(5000, Math.round(Number(p.acc)) || 0); if (typeof p.addr === 'string') loc.addr = p.addr.slice(0, 240); }
    meta.loc = loc; await db.run('UPDATE messages SET meta=? WHERE id=?', [JSON.stringify(meta), m.id]);
    (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('loc:moved', { id: m.id, chatId: m.chat_id, loc }));
    ack?.({ ok: true });
  });
  // ===== Xabarni chatda qadash =====
  const pinsOf = async (chatId) => {
    const rows = await db.all('SELECT p.message_id, p.at, m.* FROM chat_pins p JOIN messages m ON m.id=p.message_id WHERE p.chat_id=? AND m.deleted=0 ORDER BY p.at DESC LIMIT 20', [chatId]);
    return rows.map((r) => ({ id: Number(r.message_id), type: r.type, text: String(r.text || '').slice(0, 200), sender_id: Number(r.sender_id), meta: r.meta ? JSON.parse(r.meta) : null, at: Number(r.at) }));
  };
  on(socket, 'msg:pin', async (p, ack) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(p?.id) || 0]);
    if (!m || m.deleted || !(await isMember(m.chat_id, uid))) return ack?.({ error: 'forbidden' });
    const chat = await getChat(m.chat_id); if (chat.type !== 'private' && !isAdmin(await roleOf(m.chat_id, uid))) return ack?.({ error: 'admin_only' });
    if (p.on) await db.run('INSERT INTO chat_pins(chat_id, message_id, by, at) VALUES(?,?,?,?) ON CONFLICT(chat_id, message_id) DO UPDATE SET at=excluded.at', [m.chat_id, m.id, uid, now()]);
    else await db.run('DELETE FROM chat_pins WHERE chat_id=? AND message_id=?', [m.chat_id, m.id]);
    const pins = await pinsOf(m.chat_id);
    (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('chat:pins', { chatId: m.chat_id, pins }));
    ack?.({ ok: true, pins });
  });
  on(socket, 'chat:pins', async (p, ack) => { const cid = Number(p?.chatId); if (!(await isMember(cid, uid))) return ack?.({ error: 'forbidden' }); ack?.({ pins: await pinsOf(cid) }); });
  // ===== Guruh qo'ng'irog'i (10 kishigacha, jonli): signalizatsiya =====
  on(socket, 'gcall:start', async (p, ack) => {
    const chatId = Number(p?.chatId); const chat = await getChat(chatId);
    if (!chat || chat.type !== 'group' || !(await isMember(chatId, uid))) return ack?.({ error: 'forbidden' });
    if (gcalls.has(chatId)) return ack?.({ ok: true, existing: true, ...gcallView(chatId) });
    const g = { id: crypto.randomBytes(6).toString('hex'), chatId, starter: uid, video: !!p.video, started: now(), peers: new Map(), msgId: null };
    gcalls.set(chatId, g);
    const msg = await saveMessage(chatId, uid, { type: 'call', text: '' }, { group: 1, gid: g.id, status: 'live', video: g.video, _srv: AI_SECRET });
    g.msgId = msg.id;
    const me = await getUser(uid);
    for (const m of await membersOf(chatId)) if (m !== uid) io.to('u' + m).emit('gcall:ring', { chatId, gid: g.id, from: uid, name: me?.name, title: chat.title, video: g.video });
    ack?.({ ok: true, ...gcallView(chatId) });
  });
  on(socket, 'gcall:join', async (p, ack) => {
    const chatId = Number(p?.chatId); const g = gcalls.get(chatId);
    if (!g || !(await isMember(chatId, uid))) return ack?.({ error: 'ended' });
    if (!g.peers.has(uid) && g.peers.size >= 10) return ack?.({ error: 'full' });
    const others = [...g.peers.keys()].filter((x) => x !== uid);
    g.peers.set(uid, socket.id);
    others.forEach((x) => io.to('u' + x).emit('gcall:joined', { chatId, uid }));
    broadcastGcall(chatId);
    ack?.({ ok: true, gid: g.id, peers: others, video: g.video, started: g.started });
  });
  on(socket, 'gcall:signal', async (p) => {
    const g = gcalls.get(Number(p?.chatId)); const to = Number(p?.to);
    if (!g || !g.peers.has(uid) || !g.peers.has(to)) return;
    io.to('u' + to).emit('gcall:signal', { chatId: g.chatId, from: uid, data: p.data });
  });
  on(socket, 'gcall:media', async (p) => { const g = gcalls.get(Number(p?.chatId)); if (!g || !g.peers.has(uid)) return; [...g.peers.keys()].forEach((x) => x !== uid && io.to('u' + x).emit('gcall:media', { chatId: g.chatId, uid, mic: !!p.mic, cam: !!p.cam })); });
  on(socket, 'gcall:leave', async (p) => gcallLeave(Number(p?.chatId), uid));
  on(socket, 'gcall:state', async (p, ack) => { const cid = Number(p?.chatId); if (!(await isMember(cid, uid))) return ack?.({}); ack?.(gcalls.has(cid) ? gcallView(cid) : { active: false }); });
  socket.on('disconnect', () => { for (const g of gcalls.values()) if (g.peers.get(uid) === socket.id) gcallLeave(g.chatId, uid).catch(() => {}); });

  // ===== So'rovnoma: ovoz berish =====
  const pollState = async (mid, forUid) => {
    const rows = await db.all('SELECT user_id, opt FROM poll_votes WHERE message_id=?', [mid]);
    const m = await db.get('SELECT meta FROM messages WHERE id=?', [mid]); const pm = m?.meta ? JSON.parse(m.meta).poll : null;
    const counts = Array((pm?.opts || []).length).fill(0); const voters = new Set(); const mine = [];
    for (const r of rows) { if (counts[r.opt] !== undefined) counts[r.opt]++; voters.add(Number(r.user_id)); if (Number(r.user_id) === forUid) mine.push(Number(r.opt)); }
    return { counts, voters: voters.size, mine };
  };
  on(socket, 'poll:vote', async (p, ack) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(p?.id) || 0]);
    if (!m || m.type !== 'poll' || m.deleted || !(await isMember(m.chat_id, uid))) return ack?.({ error: 'forbidden' });
    const pm = JSON.parse(m.meta || '{}').poll; if (!pm) return ack?.({ error: 'bad' });
    let opts = [...new Set((Array.isArray(p.opts) ? p.opts : []).map(Number).filter((x) => Number.isInteger(x) && x >= 0 && x < pm.opts.length))];
    if (!pm.multi) opts = opts.slice(0, 1);
    const had = await db.get('SELECT 1 AS x FROM poll_votes WHERE message_id=? AND user_id=? LIMIT 1', [m.id, uid]);
    if (pm.quiz !== undefined && had) return ack?.({ error: 'already' }); // viktorinada javob bir marta
    await db.run('DELETE FROM poll_votes WHERE message_id=? AND user_id=?', [m.id, uid]);
    for (const o of opts) await db.run('INSERT INTO poll_votes(message_id,user_id,opt,at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING', [m.id, uid, o, now()]);
    const st = await pollState(m.id, uid);
    ack?.({ ok: true, ...st });
    (await membersOf(m.chat_id)).forEach((u) => u !== uid && io.to('u' + u).emit('poll:update', { id: m.id, chatId: m.chat_id, counts: st.counts, voters: st.voters }));
  });
  on(socket, 'poll:peek', async (p, ack) => {
    const out = {};
    for (const id of (Array.isArray(p?.ids) ? p.ids : []).slice(0, 80).map(Number)) {
      const m = await db.get('SELECT chat_id, type FROM messages WHERE id=?', [id]);
      if (m?.type === 'poll' && (await isMember(m.chat_id, uid))) out[id] = await pollState(id, uid);
    }
    ack?.(out);
  });
  // ===== Rejalashtirilgan xabarlar =====
  on(socket, 'msg:schedule', async (p, ack) => {
    const chatId = Number(p?.chatId), at = Number(p?.at), text = String(p?.text || '').slice(0, 4096);
    if (!text.trim() || !(await canPost(chatId, uid))) return ack?.({ error: 'forbidden' });
    if (!(at > now() + 20e3 && at < now() + 366 * 864e5)) return ack?.({ error: 'bad_time' });
    if (Number((await db.get('SELECT COUNT(*) AS c FROM scheduled WHERE user_id=?', [uid])).c) >= 100) return ack?.({ error: 'too_many' });
    const id = await db.insert('INSERT INTO scheduled(chat_id,user_id,text,reply_to,at,created) VALUES(?,?,?,?,?,?)', [chatId, uid, text, Number(p.replyTo) || null, at, now()]);
    ack?.({ ok: true, id }); io.to('u' + uid).emit('msg:scheduled', { chatId });
  });
  on(socket, 'msg:schedlist', async (p, ack) => {
    const rows = await db.all('SELECT id, chat_id, text, at FROM scheduled WHERE user_id=? AND chat_id=? ORDER BY at ASC LIMIT 100', [uid, Number(p?.chatId) || 0]);
    ack?.({ list: rows.map((r) => ({ id: Number(r.id), text: r.text, at: Number(r.at) })) });
  });
  on(socket, 'msg:unschedule', async (p, ack) => {
    const r = await db.get('SELECT * FROM scheduled WHERE id=? AND user_id=?', [Number(p?.id) || 0, uid]); if (!r) return ack?.({ error: 'not_found' });
    await db.run('DELETE FROM scheduled WHERE id=?', [r.id]);
    if (p.sendNow) await sendScheduled(r);
    ack?.({ ok: true }); io.to('u' + uid).emit('msg:scheduled', { chatId: Number(r.chat_id) });
  });

  // ===== 2 kishilik o'yinlar: taklif → qo'shilish → yurishlar (server faqat navbat/tartibni saqlaydi va uzatadi) =====
  const roomView = async (r) => {
    const ua = await getUser(r.a), ub = r.b ? await getUser(r.b) : null;
    return { id: r.id, game: r.game, chatId: r.chat_id, a: r.a, b: r.b, status: r.status, winner: r.winner, moves: r.moves,
      seat: r.a === uid ? 0 : r.b === uid ? 1 : -1, users: [ua && publicUser(ua), ub && publicUser(ub)],
      secret: r.a === uid ? r.secret[0] ?? null : r.b === uid ? r.secret[1] ?? null : null, turn: r.moves.length ? 1 - r.moves[r.moves.length - 1].s : 0 };
  };
  const roomPush = async (r) => { const v = await roomView(r); [r.a, r.b].filter(Boolean).forEach((x) => io.to('u' + x).emit('game:state', { ...v, seat: x === r.a ? 0 : 1, secret: undefined })); };
  on(socket, 'game:invite', async (p, ack) => {
    const chatId = Number(p?.chatId), g = String(p?.game || '');
    if (!MP_GAMES.has(g) || !(await canPost(chatId, uid))) return ack?.({ error: 'forbidden' });
    if (!rateOk('ginv' + uid, 30, 600e3)) return ack?.({ error: 'rate' });
    const peerId = await privatePeer(chatId, uid);
    if (peerId && ((await isBlocked(peerId, uid)) || (await isBlocked(uid, peerId)))) return ack?.({ error: 'blocked' });
    const chat = await getChat(chatId); if (chat.type === 'channel') return ack?.({ error: 'forbidden' });
    const id = crypto.randomBytes(6).toString('hex');
    const r = { id, game: g, chat_id: chatId, a: uid, b: peerId || null, moves: [], status: peerId ? 'play' : 'wait', winner: null, claims: {}, secret: {}, created: now(), updated: now() };
    if (peerId === uid || chat.type === 'private' && !peerId) r.b = null, r.status = 'wait'; // "Saqlangan xabarlar"
    await db.run('INSERT INTO game_rooms(id,game,chat_id,a,b,moves,status,winner,claims,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [id, g, chatId, r.a, r.b, '[]', r.status, null, '{}', r.created, r.updated]);
    rooms.set(id, r);
    const msg = await saveMessage(chatId, uid, { type: 'game', text: '' }, { game: { g, room: id } });
    ack?.({ ok: true, room: await roomView(r), message: msg });
  });
  on(socket, 'game:join', async (p, ack) => {
    const r = await loadRoom(p?.room); if (!r) return ack?.({ error: 'not_found' });
    if (r.a !== uid && r.b !== uid) {
      if (!(await isMember(r.chat_id, uid))) return ack?.({ error: 'forbidden' });
      if (!r.b && r.status === 'wait') {
        r.b = uid; r.status = 'play'; r.updated = now();
        await db.run('UPDATE game_rooms SET b=?, status=?, updated=? WHERE id=? AND b IS NULL', [uid, 'play', r.updated, r.id]);
        roomPush(r).catch(() => {});
      }
    }
    ack?.({ ok: true, room: await roomView(r) });
  });
  on(socket, 'game:secret', async (p, ack) => { // faqat o'sha o'yinchiga qaytariladigan maxfiy holat (masalan, kemalar joylashuvi)
    const r = await loadRoom(p?.room); if (!r) return ack?.({ error: 'not_found' });
    const seat = r.a === uid ? 0 : r.b === uid ? 1 : -1; const raw = JSON.stringify(p?.data ?? null);
    if (seat < 0 || r.status === 'over' || raw.length > 3000) return ack?.({ error: 'forbidden' });
    if (r.moves.some((m) => m.s === seat && m.m?.t === 'r')) return ack?.({ error: 'locked' }); // tayyor bo'lgandan keyin o'zgartirib bo'lmaydi
    r.secret[seat] = JSON.parse(raw); await db.run('UPDATE game_rooms SET secret=? WHERE id=?', [JSON.stringify(r.secret), r.id]);
    ack?.({ ok: true });
  });
  on(socket, 'game:mine', async (p, ack) => {
    const rows = await db.all("SELECT id FROM game_rooms WHERE (a=? OR b=?) AND status<>'over' AND updated>? ORDER BY updated DESC LIMIT 12", [uid, uid, now() - 14 * 864e5]);
    const out = []; for (const x of rows) { const r = await loadRoom(x.id); if (r) { const v = await roomView(r); delete v.moves; delete v.secret; out.push(v); } }
    ack?.({ rooms: out });
  });
  on(socket, 'game:peek', async (p, ack) => {
    const ids = (Array.isArray(p?.ids) ? p.ids : []).slice(0, 60).map(String);
    const out = {};
    for (const id of ids) { const r = await loadRoom(id); if (r && (await isMember(r.chat_id, uid) || r.a === uid || r.b === uid)) out[id] = { status: r.status, winner: r.winner, a: r.a, b: r.b, n: r.moves.length }; }
    ack?.(out);
  });
  on(socket, 'game:move', async (p, ack) => {
    const r = await loadRoom(p?.room); if (!r) return ack?.({ error: 'not_found' });
    const seat = r.a === uid ? 0 : r.b === uid ? 1 : -1;
    if (seat < 0 || r.status !== 'play') return ack?.({ error: 'forbidden', moves: r.moves, status: r.status });
    const raw = JSON.stringify(p?.m ?? null);
    if (raw.length > 800 || r.moves.length >= 4000) return ack?.({ error: 'bad' });
    if (Number(p?.n) !== r.moves.length) return ack?.({ error: 'sync', moves: r.moves });
    const mv = { s: seat, m: JSON.parse(raw) }; r.moves.push(mv); r.updated = now();
    await db.run('UPDATE game_rooms SET moves=?, updated=? WHERE id=?', [JSON.stringify(r.moves), r.updated, r.id]);
    const ev = { room: r.id, i: r.moves.length - 1, ...mv };
    [r.a, r.b].forEach((x) => io.to('u' + x).emit('game:move', ev));
    ack?.({ ok: true, i: ev.i });
    const other = seat ? r.a : r.b;
    if (!online.has(other) && (!r.pushed || now() - r.pushed > 10 * 60e3)) { // raqib ilovada bo'lmasa — eslatma
      r.pushed = now(); const me = await getUser(uid);
      push.send(other, { type: 'msg', chatId: r.chat_id, title: me?.name || 'Birga', body: '🎮 ' + (PREVIEW.game[0]), tag: 'game' + r.id }).catch(() => {});
    }
  });
  on(socket, 'game:over', async (p, ack) => {
    const r = await loadRoom(p?.room); if (!r) return ack?.({ error: 'not_found' });
    const seat = r.a === uid ? 0 : r.b === uid ? 1 : -1;
    if (seat < 0) return ack?.({ error: 'forbidden' });
    if (r.status === 'over') return ack?.({ ok: true, winner: r.winner });
    let w = null;
    if (p?.resign) w = r.b ? 1 - seat : 2;
    else {
      const c = [0, 1, 2].includes(Number(p?.w)) ? Number(p.w) : null; if (c === null) return ack?.({ error: 'bad' });
      r.claims[seat] = c;
      if (c === 1 - seat) w = c; // yutqazgan tomon tan oldi
      else if (r.claims[1 - seat] === c) w = c; // ikkala tomon bir xil natija
    }
    if (w === null) { await db.run('UPDATE game_rooms SET claims=? WHERE id=?', [JSON.stringify(r.claims), r.id]); return ack?.({ ok: true, pending: true }); }
    r.status = 'over'; r.winner = w; r.updated = now();
    await db.run('UPDATE game_rooms SET status=?, winner=?, claims=?, updated=? WHERE id=?', ['over', w, JSON.stringify(r.claims), r.updated, r.id]);
    const wu = w === 0 ? r.a : w === 1 ? r.b : null;
    if (wu) await db.run(`INSERT INTO game_scores(user_id,game,best,plays,updated) VALUES(?,?,1,1,?) ON CONFLICT(user_id,game) DO UPDATE SET best=game_scores.best+1, plays=game_scores.plays+1, updated=excluded.updated`, [wu, 'w_' + r.game, now()]);
    await roomPush(r); ack?.({ ok: true, winner: w });
  });

  // Xabarni boshqa chat(lar)ga uzatish
  on(socket, 'message:forward', async ({ ids, to } = {}, ack) => {
    const msgIds = [].concat(ids || []).map(Number).slice(0, 50);
    const targets = [...new Set([].concat(to || []).map(Number))].slice(0, 20);
    let sent = 0;
    for (const mid of msgIds) {
      const m = await db.get('SELECT * FROM messages WHERE id=?', [mid]);
      if (!m || m.deleted || m.type === 'call' || m.type === 'service' || !(await isMember(m.chat_id, uid))) continue;
      const src = fmtMsg(m); const srcChat = await getChat(m.chat_id);
      const fwd = src.meta?.fwd || (srcChat.type === 'channel' ? { name: srcChat.title } : { name: (await getUser(m.sender_id))?.name, uid: m.sender_id });
      for (const cid of targets) {
        if (!(await canPost(cid, uid))) continue;
        const peerId = await privatePeer(cid, uid); if (peerId && ((await isBlocked(peerId, uid)) || (await isBlocked(uid, peerId)))) continue;
        await saveMessage(cid, uid, { type: m.type, text: m.text, file: m.file, mime: m.mime, size: m.size, duration: m.duration }, { ...(src.meta || {}), fwd });
        sent++;
      }
    }
    ack?.({ ok: true, sent });
  });

  // Reaksiya: har kishidan bitta; xuddi shu emoji qayta bosilsa — olib tashlanadi
  on(socket, 'message:react', async ({ id, emoji } = {}, ack) => {
    const m = await db.get('SELECT id, chat_id, deleted, type FROM messages WHERE id=?', [Number(id) || 0]);
    if (!m || m.deleted || m.type === 'service' || !REACTIONS.includes(emoji) || !(await isMember(m.chat_id, uid))) return ack?.({ error: 'forbidden' });
    const cur = await db.get('SELECT emoji FROM reactions WHERE message_id=? AND user_id=?', [m.id, uid]);
    if (cur?.emoji === emoji) await db.run('DELETE FROM reactions WHERE message_id=? AND user_id=?', [m.id, uid]);
    else await db.run('INSERT INTO reactions(message_id,user_id,emoji,at) VALUES(?,?,?,?) ON CONFLICT(message_id,user_id) DO UPDATE SET emoji=excluded.emoji, at=excluded.at', [m.id, uid, emoji, now()]);
    const reactions = (await reactionsFor([m.id])).get(m.id) || {};
    for (const u of await membersOf(m.chat_id)) io.to('u' + u).emit('message:reactions', { id: m.id, chatId: m.chat_id, reactions, by: uid });
    ack?.({ ok: true, reactions });
  });

  on(socket, 'message:edit', async ({ id, text } = {}) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(id) || 0]);
    const t = String(text || '').slice(0, 4096);
    if (!m || m.sender_id !== uid || m.deleted || m.type === 'call' || m.type === 'service' || m.type === 'poll' || (m.type === 'text' && !t.trim())) return;
    if (/"ai":1/.test(m.meta || '')) return; // Birga AI javobini tahrirlab bo'lmaydi
    if (!(await canPost(m.chat_id, uid))) return;
    await db.run('UPDATE messages SET text=?, edited=1 WHERE id=?', [t, m.id]);
    const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [m.id]));
    (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('message:edited', { message: msg }));
  });

  // Xabarni o'chirish: forAll — hammadan (izsiz), aks holda faqat o'zidan
  on(socket, 'message:delete', async ({ id, forAll } = {}, ack) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(id) || 0]);
    if (!m || !(await isMember(m.chat_id, uid))) return ack?.({ error: 'forbidden' });
    if (!forAll) {
      await db.run('INSERT INTO hidden_messages(user_id,message_id,at) VALUES(?,?,?) ON CONFLICT(user_id,message_id) DO NOTHING', [uid, m.id, now()]);
      io.to('u' + uid).emit('message:deleted', { id: m.id, chatId: m.chat_id });
      return ack?.({ ok: true });
    }
    const chat = await getChat(m.chat_id);
    if (m.sender_id !== uid && chat?.type !== 'private' && !isAdmin(await roleOf(m.chat_id, uid))) return ack?.({ error: 'forbidden' });
    await db.run("UPDATE messages SET deleted=1, text='', file=NULL, meta=NULL WHERE id=?", [m.id]);
    await db.run('DELETE FROM reactions WHERE message_id=?', [m.id]).catch(() => {});
    ack?.({ ok: true });
    if (m.file) safeRemove(m.file);
    try { const alt = JSON.parse(m.meta || '{}').alt; if (alt) safeRemove(alt); } catch {}
    (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('message:deleted', { id: m.id, chatId: m.chat_id }));
  });

  on(socket, 'chat:read', async ({ chatId, messageId } = {}) => {
    chatId = Number(chatId); messageId = Number(messageId) || 0;
    if (!(await isMember(chatId, uid))) return;
    await db.run('UPDATE chat_members SET last_read_id=CASE WHEN last_read_id<? THEN ? ELSE last_read_id END WHERE chat_id=? AND user_id=?', [messageId, messageId, chatId, uid]);
    (await membersOf(chatId)).forEach((u) => u !== uid && io.to('u' + u).emit('chat:read', { chatId, userId: uid, messageId }));
  });

  on(socket, 'typing', async ({ chatId, kind } = {}) => {
    chatId = Number(chatId);
    if (!(await isMember(chatId, uid))) return;
    (await membersOf(chatId)).forEach((u) => u !== uid && io.to('u' + u).emit('typing', { chatId, userId: uid, kind: kind || 'text' }));
  });

  // ===== WebRTC signal almashinuvi =====
  on(socket, 'call:offer', async (p) => {
    const to = Number(p?.to); const callee = await getUser(to);
    if (!callee || to === uid || callee.deleted || callee.banned) return;
    if (await isBlocked(to, uid) || await isBlocked(uid, to)) { socket.emit('call:busy', { from: to, callId: p.callId }); return; }
    const offer = { ...p, from: uid, fromUser: publicUser(await getUser(uid)) };
    pendingCalls.set(to, { offer, ice: [], expires: now() + 45_000, callId: p.callId, from: uid });
    io.to('u' + to).emit('call:offer', offer);
    if (!online.has(to)) socket.emit('call:status', { callId: p.callId, status: 'offline' });
    push.send(to, { type: 'call', callId: p.callId, title: offer.fromUser.name, body: tr(callee.lang, p.video ? '📹 Kiruvchi video qo‘ng‘iroq' : '📞 Kiruvchi qo‘ng‘iroq', p.video ? '📹 Входящий видеозвонок' : '📞 Входящий звонок', p.video ? '📹 Incoming video call' : '📞 Incoming call'), tag: 'call' }, { ttl: 45, urgency: 'high' }).catch(() => {});
  });
  socket.on('call:ice', (p) => {
    const to = Number(p?.to); if (!to) return;
    const pc2 = pendingCalls.get(to);
    if (pc2 && pc2.callId === p.callId && pc2.from === uid) pc2.ice.push({ ...p, from: uid });
    io.to('u' + to).emit('call:ice', { ...p, from: uid });
  });
  const clearPending = (p) => { for (const [k, v] of pendingCalls) if (v.callId === p?.callId) pendingCalls.delete(k); };
  ['call:answer', 'call:reject', 'call:end', 'call:busy'].forEach((ev) => socket.on(ev, (p) => {
    clearPending(p);
    if (p?.to) io.to('u' + p.to).emit(ev, { ...p, from: uid });
    if (ev === 'call:end' && p?.to) nativeEnqueue(Number(p.to), { type: 'call_end', callId: p.callId }); // ilovada jiringlashni to'xtatish
    if (ev !== 'call:end') nativeEnqueue(uid, { type: 'call_end', callId: p?.callId }); // boshqa qurilmada javob berildi — jiringlash to'xtasin
    if (ev === 'call:answer' || ev === 'call:reject' || ev === 'call:busy') socket.to('u' + uid).emit('call:handled', { callId: p?.callId });
  }));
  ['call:ringing', 'call:media', 'call:renego'].forEach((ev) => socket.on(ev, (p) => { if (p?.to) io.to('u' + p.to).emit(ev, { ...p, from: uid }); }));

  on(socket, 'call:log', async ({ chatId, peerId, video, duration, status } = {}) => {
    if (!rateOk('calllog:' + uid, 30, 3600e3)) return;
    let cid = Number(chatId);
    if (!cid || !(await isMember(cid, uid)) || !(await privatePeer(cid, uid))) { const pu = await getUser(peerId); if (!pu || pu.id === uid) return; cid = await privateChatId(uid, pu.id); }
    const id = await db.insert('INSERT INTO messages(chat_id,sender_id,type,text,duration,meta,created_at) VALUES(?,?,?,?,?,?,?)',
      [cid, uid, 'call', '', Number(duration) || 0, JSON.stringify({ video: !!video, status: String(status || '') }), now()]);
    const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [id]));
    // bloklagan odamga bloklangan odamning qo'ng'iroq yozuvi ko'rsatilmaydi
    const peer = await privatePeer(cid, uid);
    const hideFor = peer && (await isBlocked(peer, uid)) ? peer : null;
    if (hideFor) await db.run('INSERT INTO hidden_messages(user_id,message_id,at) VALUES(?,?,?) ON CONFLICT(user_id,message_id) DO NOTHING', [hideFor, id, now()]);
    for (const m of await membersOf(cid)) if (m !== hideFor) io.to('u' + m).emit('message:new', { message: msg, chat: await chatSummary(cid, m) });
  });

  socket.on('disconnect', async () => {
    const n = (online.get(uid) || 1) - 1;
    if (n <= 0) online.delete(uid); else online.set(uid, n);
    try { await db.run('UPDATE users SET last_seen=? WHERE id=?', [now(), uid]); const u = await getUser(uid); if (u) broadcastUser(u); } catch {}
  });
});

// Tozalash: eski kodlar, loglar, muddati o'tgan va profilda saqlanmagan hikoyalar
setInterval(async () => {
  const t = now();
  for (const [k, a] of hits) if (!a.some((x) => t - x < 24 * 3600e3)) hits.delete(k);
  for (const [k, v] of pendingCalls) if (v.expires < t) pendingCalls.delete(k);
  try {
    await db.run('DELETE FROM sms_log WHERE at<?', [t - 7 * 24 * 3600e3]);
    await db.run('DELETE FROM codes WHERE expires<?', [t - 3600e3]);
    const old = await db.all('SELECT id, file FROM stories WHERE pinned=0 AND expires_at<?', [t]);
    for (const s of old) { await db.run('DELETE FROM story_views WHERE story_id=?', [s.id]); await db.run('DELETE FROM stories WHERE id=?', [s.id]); safeRemove(s.file); }
    await db.run('DELETE FROM media_acks WHERE message_id IN (SELECT id FROM messages WHERE gone=1)');
    scheduleSweep(1000);
  } catch (e) { console.error('cleanup:', e.message); }
}, 600e3).unref();

// ===== Xarita (OpenStreetMap): qidiruv, manzil, yo'nalish — server orqali, keshlab =====
// Bepul ochiq xizmatlar: Photon (qidiruv), Nominatim (manzil), OSRM/FOSSGIS (yo'nalish). Kalit kerak emas.
const MAPS = {
  photon: (process.env.MAP_PHOTON || 'https://photon.komoot.io').replace(/\/$/, ''),
  nominatim: (process.env.MAP_NOMINATIM || 'https://nominatim.openstreetmap.org').replace(/\/$/, ''),
  osrm: (process.env.MAP_OSRM || 'https://routing.openstreetmap.de').replace(/\/$/, ''),
  ua: 'Birga/1.0 (https://birga.onrender.com)',
};
const mapCache = new Map();
async function mapFetch(url, ttl = 24 * 3600e3) {
  const hit = mapCache.get(url); if (hit && hit.exp > now()) return hit.data;
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': MAPS.ua, Accept: 'application/json' }, signal: ctl.signal });
    if (!r.ok) throw new Error('map ' + r.status);
    const data = await r.json();
    if (mapCache.size > 3000) mapCache.delete(mapCache.keys().next().value);
    mapCache.set(url, { data, exp: now() + ttl });
    return data;
  } finally { clearTimeout(tm); }
}
let nomQ = Promise.resolve(); // Nominatim qoidasi: soniyasiga 1 ta so'rov
const nominatim = (url) => { const p = nomQ.then(() => mapFetch(url)); nomQ = p.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100))); return p; };
const mapLang = (l) => (['uz', 'ru', 'en'].includes(l) ? l : 'uz');
const num = (v, lim) => { const n = Number(v); return isFinite(n) && Math.abs(n) <= lim ? n : null; };
function placeFromPhoton(f) {
  const p = f.properties || {}; const [lng, lat] = f.geometry?.coordinates || [];
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const addr = [street, p.district, p.city || p.town || p.village, p.state, p.country].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', ');
  return { name: p.name || street || p.city || '', addr, lat, lng, kind: p.osm_value || p.type || '', extent: p.extent || null };
}
function placeFromNominatim(r) {
  const a = r.address || {};
  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const name = r.name || a.amenity || a.shop || a.building || street || a.neighbourhood || a.suburb || a.city || a.town || a.village || '';
  const addr = [street, a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county, a.state, a.country].filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(', ');
  return { name, addr: addr || r.display_name || '', lat: Number(r.lat), lng: Number(r.lon), kind: r.type || '' };
}
app.get('/api/map/search', auth, rateLimit('mapq', 600, 3600e3), wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 120); if (q.length < 2) return res.json([]);
  const lat = num(req.query.lat, 90), lon = num(req.query.lon, 180);
  const bias = lat != null && lon != null ? `&lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}` : '';
  try {
    const d = await mapFetch(`${MAPS.photon}/api/?q=${encodeURIComponent(q)}&limit=8${bias}`, 6 * 3600e3);
    const list = (d.features || []).map(placeFromPhoton).filter((p) => isFinite(p.lat) && isFinite(p.lng));
    if (list.length) return res.json(list);
  } catch (e) { console.error('photon:', e.message); }
  try { // zaxira: Nominatim
    const d = await nominatim(`${MAPS.nominatim}/search?format=jsonv2&addressdetails=1&limit=8&accept-language=${mapLang(req.user.lang)}&q=${encodeURIComponent(q)}`);
    res.json((d || []).map(placeFromNominatim));
  } catch (e) { console.error('nominatim:', e.message); res.status(502).json({ error: 'map' }); }
}));
app.get('/api/map/reverse', auth, rateLimit('maprev', 600, 3600e3), wrap(async (req, res) => {
  const lat = num(req.query.lat, 90), lon = num(req.query.lon, 180);
  if (lat == null || lon == null) return res.status(400).json({ error: 'bad coords' });
  try {
    const d = await nominatim(`${MAPS.nominatim}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=${mapLang(req.query.lang || req.user.lang)}&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`);
    if (!d || d.error) return res.json({ name: '', addr: '', lat, lng: lon });
    res.json({ ...placeFromNominatim(d), lat, lng: lon });
  } catch (e) { console.error('reverse:', e.message); res.json({ name: '', addr: '', lat, lng: lon }); }
}));
const ROUTE_PROFILES = { car: 'routed-car', foot: 'routed-foot', bike: 'routed-bike' };
app.get('/api/map/route', auth, rateLimit('maproute', 600, 3600e3), wrap(async (req, res) => {
  const pts = String(req.query.pts || '').split(';').map((x) => x.split(',').map(Number)).filter(([a, b]) => num(a, 180) != null && num(b, 90) != null);
  if (pts.length < 2 || pts.length > 6) return res.status(400).json({ error: 'bad points' });
  const prof = ROUTE_PROFILES[req.query.mode] || 'routed-car';
  const coords = pts.map(([a, b]) => `${a.toFixed(6)},${b.toFixed(6)}`).join(';');
  try {
    const d = await mapFetch(`${MAPS.osrm}/${prof}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&alternatives=${pts.length === 2 ? 'true' : 'false'}`, 600e3);
    if (d.code !== 'Ok') return res.status(404).json({ error: 'no route' });
    res.json({ routes: d.routes.slice(0, 3).map((r) => ({ distance: r.distance, duration: r.duration, geometry: r.geometry,
      steps: r.legs.flatMap((l) => l.steps).map((st) => ({ d: st.distance, t: st.duration, name: st.name || '', ref: st.ref || '', type: st.maneuver?.type, mod: st.maneuver?.modifier || '', exit: st.maneuver?.exit, loc: st.maneuver?.location })) })) });
  } catch (e) { console.error('route:', e.message); res.status(502).json({ error: 'map' }); }
}));
// MapLibre kutubxonasi o'zimizdan (CDN ishlamasa ham xarita ochiladi)
{
  const ml = path.join(__dirname, 'node_modules', 'maplibre-gl', 'dist');
  if (fs.existsSync(ml)) app.use('/vendor/maplibre', express.static(ml, { maxAge: '30d' }));
}

// v6 jadval/ustunlari (db.js ga tegmasdan)
async function extraSchema() {
  await db.run('CREATE TABLE IF NOT EXISTS reactions(message_id BIGINT, user_id BIGINT, emoji TEXT, at BIGINT, PRIMARY KEY(message_id, user_id))');
  await db.run('CREATE INDEX IF NOT EXISTS idx_react_msg ON reactions(message_id)');
  await db.run('CREATE TABLE IF NOT EXISTS hidden_messages(user_id BIGINT, message_id BIGINT, at BIGINT, PRIMARY KEY(user_id, message_id))');
  await db.run('CREATE TABLE IF NOT EXISTS blocks(owner_id BIGINT, user_id BIGINT, at BIGINT, PRIMARY KEY(owner_id, user_id))');
  await db.run('CREATE TABLE IF NOT EXISTS reel_likes(reel_id BIGINT, user_id BIGINT, at BIGINT, PRIMARY KEY(reel_id, user_id))');
  await db.run(`CREATE TABLE IF NOT EXISTS reel_comments(id ${db.kind === 'postgres' ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'}, reel_id BIGINT, user_id BIGINT, text TEXT, at BIGINT)`);
  await db.run('CREATE INDEX IF NOT EXISTS idx_reel_cmt ON reel_comments(reel_id)');
  await db.run('CREATE TABLE IF NOT EXISTS uploads(url TEXT PRIMARY KEY, user_id BIGINT, at BIGINT)');
  await db.run(`CREATE TABLE IF NOT EXISTS reports(id ${db.kind === 'postgres' ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'}, reporter_id BIGINT, user_id BIGINT, message_id BIGINT, chat_id BIGINT,
    reason TEXT, details TEXT, snapshot TEXT, status TEXT DEFAULT 'open', created_at BIGINT, resolved_at BIGINT)`);
  await db.run('CREATE TABLE IF NOT EXISTS game_scores(user_id BIGINT, game TEXT, best BIGINT, plays BIGINT DEFAULT 0, updated BIGINT, PRIMARY KEY(user_id, game))');
  await db.run('CREATE INDEX IF NOT EXISTS idx_scores_game ON game_scores(game, best)');
  await db.run('CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, user_id BIGINT, ua TEXT, app TEXT, os TEXT, model TEXT, ip TEXT, city TEXT, country TEXT, created BIGINT, last BIGINT, revoked INTEGER DEFAULT 0)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_sess_user ON sessions(user_id)');
  await db.run('CREATE TABLE IF NOT EXISTS native_devices(token TEXT PRIMARY KEY, user_id BIGINT, sid TEXT, model TEXT, created BIGINT, last BIGINT)');
  await db.run('CREATE TABLE IF NOT EXISTS ai_memory(user_id BIGINT, fact TEXT, at BIGINT)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_aimem ON ai_memory(user_id, at)');
  await db.run('CREATE TABLE IF NOT EXISTS transcripts(message_id BIGINT PRIMARY KEY, text TEXT, at BIGINT)');
  await db.run('CREATE TABLE IF NOT EXISTS user_stickers(user_id BIGINT, url TEXT, at BIGINT, PRIMARY KEY(user_id, url))');
  await db.run('CREATE TABLE IF NOT EXISTS chat_pins(chat_id BIGINT, message_id BIGINT, by BIGINT, at BIGINT, PRIMARY KEY(chat_id, message_id))');
  await db.run('CREATE TABLE IF NOT EXISTS poll_votes(message_id BIGINT, user_id BIGINT, opt INTEGER, at BIGINT, PRIMARY KEY(message_id, user_id, opt))');
  await db.run(`CREATE TABLE IF NOT EXISTS scheduled(id ${db.kind === 'postgres' ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'}, chat_id BIGINT, user_id BIGINT, text TEXT, reply_to BIGINT, at BIGINT, created BIGINT)`);
  await db.run('CREATE INDEX IF NOT EXISTS idx_sched_at ON scheduled(at)');
  await db.run('CREATE TABLE IF NOT EXISTS step_devices(token TEXT PRIMARY KEY, user_id BIGINT, created BIGINT, last BIGINT, sensor TEXT, err TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS steps(user_id BIGINT, day TEXT, steps BIGINT, updated BIGINT, PRIMARY KEY(user_id, day))');
  await db.run(`CREATE TABLE IF NOT EXISTS game_rooms(id TEXT PRIMARY KEY, game TEXT, chat_id BIGINT, a BIGINT, b BIGINT, moves TEXT, status TEXT, winner INTEGER, claims TEXT, created BIGINT, updated BIGINT)`);
  const cols = [['users', 'reg_info', 'TEXT'], ['users', 'folders', 'TEXT'], ['users', 'region', 'TEXT'], ['users', 'invite_code', 'TEXT'], ['users', 'invited_by', 'BIGINT'], ['game_rooms', 'secret', 'TEXT'], ['users', 'steps_on', 'INTEGER DEFAULT 0'], ['users', 'banned', 'INTEGER DEFAULT 0'], ['users', 'birthday', 'TEXT'], ['chat_members', 'pinned', 'BIGINT DEFAULT 0'], ['chat_members', 'archived', 'INTEGER DEFAULT 0'], ['users', 'hide_seen', 'INTEGER DEFAULT 0'], ['users', 'deleted', 'INTEGER DEFAULT 0']];
  for (const [t, c, type] of cols) {
    try { await db.get(`SELECT ${c} FROM ${t} LIMIT 1`); } catch { await db.run(`ALTER TABLE ${t} ADD COLUMN ${c} ${type}`); }
  }
}

// multer xatolari (juda katta fayl) — tushunarli JSON javob
app.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `Fayl juda katta (eng ko'pi ${Number(process.env.MAX_UPLOAD_MB) || storage.maxMb} MB)` });
  console.error(err); res.status(err?.status || 500).json({ error: 'server' });
});

process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e?.message || e));
process.on('uncaughtException', (e) => { console.error('uncaughtException:', e?.stack || e); process.exit(1); }); // holati noma'lum — Render qayta ishga tushiradi

(async () => {
  await db.init();
  await extraSchema(); SCHED_READY = true;
  if (!JWT_SECRET) { JWT_SECRET = await db.getMeta('jwt_secret'); if (!JWT_SECRET) { JWT_SECRET = crypto.randomBytes(32).toString('hex'); await db.setMeta('jwt_secret', JWT_SECRET); } }
  await storage.init();
  push = await createPush(db);
  { const base = push.send.bind(push); push.send = (uid, payload, opts) => { try { nativeEnqueue(uid, payload); } catch {} return base(uid, payload, opts); }; }
  server.listen(PORT, () => {
    console.log(`\n🟣 Birga ishga tushdi: http://localhost:${PORT}`);
    console.log(`   Baza: ${db.kind} · Fayllar: ${storage.remote ? 'Supabase Storage' : 'disk'} · SMS: ${sms.anyReal ? 'yoqilgan' : 'TEST rejimi (kod ekranda)'} · ffmpeg: ${media.available ? 'bor' : 'YO‘Q'} · TURN: ${process.env.TURN_SECRET || process.env.TURN_URL || process.env.CF_TURN_KEY_ID ? 'bor' : process.env.PUBLIC_TURN !== '0' ? 'Open Relay (bepul)' : 'YO‘Q'}`);
    if (db.kind === 'sqlite' && process.env.RENDER) console.warn('   ⚠️  DIQQAT: Render’da DATABASE_URL yo‘q — server qayta ishga tushganda barcha profillar O‘CHADI! Supabase ulang.');
    if (!mailer) console.warn('   ⚠️  Email xizmati ulanmagan (BREVO_API_KEY) — kod ekranda ko‘rinadi (TEST rejimi).');
  });
})().catch((e) => { console.error('Ishga tushmadi:', e); process.exit(1); });
