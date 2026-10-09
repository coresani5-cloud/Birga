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
function publicUser(u, self = false) {
  if (!u) return null;
  const o = { id: u.id, name: u.name, username: u.username, bio: u.bio, avatar: u.avatar, last_seen: u.last_seen, online: online.has(u.id), country: u.country };
  if (self) { o.phone = String(u.phone || '').startsWith('mail:') ? null : u.phone; o.email = u.email || null; o.lang = u.lang; }
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
  const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
  if (process.env.TURN_SECRET && process.env.TURN_HOST) { // o'z coturn serveringiz
    const user = `${Math.floor(now() / 1000) + 12 * 3600}:${uid}`;
    const credential = crypto.createHmac('sha1', process.env.TURN_SECRET).update(user).digest('base64');
    const h = process.env.TURN_HOST;
    const urls = [`stun:${h}:3478`, `turn:${h}:3478?transport=udp`, `turn:${h}:3478?transport=tcp`];
    if (process.env.TURN_TLS_PORT) urls.push(`turns:${h}:${process.env.TURN_TLS_PORT}?transport=tcp`);
    list.push({ urls, username: user, credential });
  }
  if (process.env.TURN_URL) list.push({ urls: process.env.TURN_URL.split(',').map((s) => s.trim()), username: process.env.TURN_USER, credential: process.env.TURN_PASS });
  return list;
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
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()' });
  next();
});
// Birga'ning o'z javoblari belgisi: service worker hosting'ning "uyg'onish" sahifasini keshlab qo'ymasligi uchun
app.use((req, res, next) => { res.set('X-Birga', '1'); next(); });
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
app.get(['/', '/index.html'], sendIndex);
if (PUBLIC_DIR) app.use(express.static(PUBLIC_DIR, { setHeaders: (res, p) => { if (p.endsWith('sw.js')) res.set('Cache-Control', 'no-cache'); } }));
else {
  const FLAT = {
    '/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/i18n.js': 'i18n.js', '/styles.css': 'styles.css',
    '/sw.js': 'sw.js', '/manifest.webmanifest': 'manifest.webmanifest', '/icons/icon-192.png': 'icon-192.png',
    '/icons/icon-512.png': 'icon-512.png', '/icons/mark.png': 'mark.png', '/icons/logo-full.jpg': 'logo-full.jpg',
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
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

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

const tokenFor = (u) => jwt.sign({ uid: u.id, pv: hash(u.phone).slice(0, 12) }, JWT_SECRET, { expiresIn: '365d' });
async function userFromToken(t) {
  const { uid, pv } = jwt.verify(t, JWT_SECRET);
  const u = await getUser(uid);
  // baza yangilangan bo'lsa eski token boshqa odamga tegib qolmasligi uchun telefon ham tekshiriladi
  if (!u || hash(u.phone).slice(0, 12) !== pv) throw new Error('bad token');
  return u;
}
// Doimiy sessiya: token localStorage'dan tashqari HttpOnly cookie'da ham saqlanadi (Safari 7 kunlik tozalashidan himoya)
const COOKIE = 'birga_s';
function cookieToken(req) { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)birga_s=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
function setSession(req, res, token) {
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: req.secure, maxAge: 365 * 24 * 3600e3, path: '/' });
}
const auth = wrap(async (req, res, next) => {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '').trim();
  try { req.user = await userFromToken(bearer); }
  catch {
    try { req.user = await userFromToken(cookieToken(req)); } // localStorage tozalangan bo'lsa ham profil saqlanadi
    catch { return res.status(401).json({ error: 'unauthorized' }); }
  }
  next();
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true }); });

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
  add(mailer ? 1 : 0, 'Email kodi', mailer ? (process.env.BREVO_API_KEY ? 'Brevo orqali yuboriladi' : 'SMTP orqali yuboriladi') : 'TEST rejimi — kod ekranda chiqadi, istalgan odam istalgan email bilan kira oladi!', mailer ? '' : 'BREVO_API_KEY va MAIL_FROM qo‘shing');
  const turn = process.env.CF_TURN_KEY_ID || process.env.TURN_SECRET || process.env.TURN_URL;
  add(turn ? 1 : 2, 'Qo‘ng‘iroqlar (TURN)', turn ? 'Ulangan — turli tarmoqlar orasida ham ulanadi' : 'Ulanmagan — ko‘p hollarda ishlaydi, lekin ba’zi mobil tarmoqlarda qo‘ng‘iroq ulanmasligi mumkin', turn ? '' : 'Cloudflare TURN (bepul): CF_TURN_KEY_ID va CF_TURN_API_TOKEN');
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
app.get('/api/ice', auth, wrap(async (req, res) => res.json({ iceServers: [...iceServersFor(req.user.id), ...(await cloudflareIce())] })));

// ===== 1) SMS kod =====
const SMS_PER_PHONE_DAY = Number(process.env.SMS_PER_PHONE_DAY) || 6;
const SMS_PER_IP_DAY = Number(process.env.SMS_PER_IP_DAY) || 12;
const SMS_PER_COUNTRY_HOUR = Number(process.env.SMS_PER_COUNTRY_HOUR) || 300;
const BLOCKED = new Set(String(process.env.SMS_BLOCKED_COUNTRIES || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));

app.post('/api/auth/send-code', rateLimit('code', 8, 3600e3), wrap(async (req, res) => {
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
// 1) Brevo HTTP API (bepul: kuniga 300 ta email). Render bepul rejasi SMTP portlarini yopgan, HTTP API esa ishlaydi.
if (process.env.BREVO_API_KEY) {
  const from = process.env.MAIL_FROM || '';
  const m = from.match(/^(.*)<(.+)>$/);
  const sender = m ? { name: m[1].trim() || 'Birga', email: m[2].trim() } : { name: 'Birga', email: from.trim() };
  mailer = { async sendMail({ to, subject, text, html }) {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text, htmlContent: html }) });
    if (!r.ok) throw new Error('Brevo ' + r.status + ' ' + (await r.text()).slice(0, 200));
  } };
// 2) Oddiy SMTP (masalan Gmail ilova paroli) — VPS uchun
} else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  const nodemailer = require('nodemailer');
  mailer = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 465, secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}
app.post('/api/auth/send-email', rateLimit('email', 8, 3600e3), wrap(async (req, res) => {
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
async function issueEmailCode(req, res, key, email) {
  const lang = req.body.lang;
  const prev = await db.get('SELECT * FROM codes WHERE phone=?', [key]);
  if (prev && now() - prev.sent_at < 60_000) return res.status(429).json({ email, error: tr(lang, 'Kod yuborilgan. Biroz kuting', 'Код уже отправлен. Подождите', 'Code already sent. Please wait'), wait: Math.ceil((60_000 - (now() - prev.sent_at)) / 1000) });
  const day = now() - 24 * 3600e3;
  const byMail = (await db.get('SELECT COUNT(*) AS c FROM sms_log WHERE phone=? AND at>?', [key, day])).c;
  const byIp = (await db.get("SELECT COUNT(*) AS c FROM sms_log WHERE ip=? AND country='EMAIL' AND at>?", [req.ip, day])).c;
  if (byMail >= EMAIL_PER_DAY || byIp >= EMAIL_PER_IP_DAY) return res.status(429).json({ error: tr(lang, 'Bugun juda ko‘p kod so‘raldi. Keyinroq urinib ko‘ring', 'Слишком много запросов. Попробуйте позже', 'Too many requests. Try again later') });
  const code = String(crypto.randomInt(10000, 100000));
  if (mailer) {
    try { await mailCode(email, code, lang); }
    catch (e) { console.error('Email:', e.message); return res.status(502).json({ error: tr(lang, 'Email yuborib bo‘lmadi. Manzilni tekshiring yoki keyinroq urinib ko‘ring', 'Не удалось отправить письмо. Проверьте адрес или попробуйте позже', 'Could not send the email. Check the address or try later') }); }
  } else console.log(`📧 [TEST EMAIL] ${email} → ${code}`);
  await db.run('INSERT INTO codes(phone,code_hash,expires,attempts,sent_at,email) VALUES(?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, attempts=0, sent_at=excluded.sent_at, email=excluded.email',
    [key, hash(key + code), now() + 10 * 60_000, 0, now(), email]);
  await db.run('INSERT INTO sms_log(phone,ip,country,at) VALUES(?,?,?,?)', [key, req.ip, 'EMAIL', now()]);
  const out = { ok: true, email, timeout: 60 };
  if (!mailer) out.devCode = code; // email xizmati ulanmagan — TEST rejimi
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
  const token = tokenFor(user); setSession(req, res, token);
  res.json({ token, user: publicUser(user, true), isNew: !user.name });
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
  const token = tokenFor(user); setSession(req, res, token);
  res.json({ token, user: publicUser(user, true), isNew: !user.name });
}));

// har safar ochilganda token yangilanadi — faol foydalanuvchi hech qachon chiqib ketmaydi
app.get('/api/me', auth, (req, res) => { const token = tokenFor(req.user); setSession(req, res, token); res.json({ ...publicUser(req.user, true), token }); });

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
  const u = await getUser(req.user.id);
  broadcastUser(u);
  res.json(publicUser(u, true));
}));

app.post('/api/profile/lang', auth, wrap(async (req, res) => {
  if (LANGS.includes(req.body.lang)) await db.run('UPDATE users SET lang=? WHERE id=?', [req.body.lang, req.user.id]);
  res.json({ ok: true });
}));

app.post('/api/profile/avatar', auth, upload.single('file'), wrap(async (req, res) => {
  if (!req.file || !/^image\//.test(req.file.mimetype)) return res.status(400).json({ error: 'image required' });
  const url = await storage.save(req.file.path, req.file.mimetype);
  if (req.user.avatar) storage.remove(req.user.avatar, UPLOAD_DIR);
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
  res.json({ ...publicUser(u, u.id === req.user.id), chatId: chat || null });
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
      await db.run('INSERT INTO contacts(owner_id,user_id,name,created) VALUES(?,?,?,?) ON CONFLICT(owner_id,user_id) DO UPDATE SET name=excluded.name', [req.user.id, u.id, name, now()]);
      found.push({ ...publicUser(u), contactName: name });
    }
  }
  res.json({ found, checked: phones.length });
}));

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
    const me = await db.get('SELECT last_read_id, muted, role FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, uid]);
    const last = await db.get('SELECT * FROM messages WHERE chat_id=? ORDER BY id DESC LIMIT 1', [chatId]);
    const unread = (await db.get('SELECT COUNT(*) AS c FROM messages WHERE chat_id=? AND id>? AND sender_id<>?', [chatId, me?.last_read_id || 0, uid])).c;
    const members = (await db.get('SELECT COUNT(*) AS c FROM chat_members WHERE chat_id=?', [chatId])).c;
    const peerRead = (await db.get('SELECT MAX(last_read_id) AS m FROM chat_members WHERE chat_id=? AND user_id<>?', [chatId, uid]))?.m || 0;
    let lastOut = last ? fmtMsg(last) : null;
    if (lastOut && chat.type === 'group' && lastOut.sender_id !== uid) lastOut.sender_name = (await getUser(lastOut.sender_id))?.name;
    return { ...publicChat(chat, { members, role: me?.role || null, invite: isAdmin(me?.role) ? chat.invite : undefined }), last: lastOut, unread, peerReadId: peerRead, muted: !!me?.muted };
  }
  const peer = (await db.get('SELECT u.* FROM chat_members m JOIN users u ON u.id=m.user_id WHERE m.chat_id=? AND m.user_id<>?', [chatId, uid])) || (await getUser(uid));
  const me = await db.get('SELECT last_read_id, muted FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, uid]);
  const peerRead = await db.get('SELECT last_read_id FROM chat_members WHERE chat_id=? AND user_id<>?', [chatId, uid]);
  const last = await db.get('SELECT * FROM messages WHERE chat_id=? ORDER BY id DESC LIMIT 1', [chatId]);
  const unread = (await db.get('SELECT COUNT(*) AS c FROM messages WHERE chat_id=? AND id>? AND sender_id<>?', [chatId, me?.last_read_id || 0, uid])).c;
  return { id: Number(chatId), type: 'private', peer: publicUser(peer, peer.id === uid), last: last ? fmtMsg(last) : null, unread, peerReadId: peerRead?.last_read_id || 0, self: peer.id === uid, muted: !!me?.muted };
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
  const before = Number(req.query.before) || 1e15;
  const rows = await db.all('SELECT * FROM messages WHERE chat_id=? AND id<? ORDER BY id DESC LIMIT 50', [chatId, before]);
  res.json(rows.reverse().map(fmtMsg));
}));

// Suhbatdagi materiallar turlarga ajratilgan holda (profil sahifasidagi bo'limlar)
const SHARED = { media: "type IN ('image','video','round')", voice: "type='voice'", files: "type='file'", links: "type='text' AND (text LIKE '%http://%' OR text LIKE '%https://%')" };
app.get('/api/chats/:id/shared', auth, wrap(async (req, res) => {
  const chatId = Number(req.params.id);
  const cond = SHARED[req.query.kind];
  if (!cond || !(await isMember(chatId, req.user.id))) return res.status(400).json({ error: 'bad request' });
  const rows = await db.all(`SELECT * FROM messages WHERE chat_id=? AND deleted=0 AND ${cond} ORDER BY id DESC LIMIT 300`, [chatId]);
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
  if (!storage.isOurs(file) || !/^(image|video)\//.test(String(mime))) return res.status(400).json({ error: 'bad file' });
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
  storage.remove(s.file, UPLOAD_DIR);
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
  if (chat.avatar) storage.remove(chat.avatar, UPLOAD_DIR);
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
  files.forEach((f) => storage.remove(f.file, UPLOAD_DIR));
  if (chat.avatar) storage.remove(chat.avatar, UPLOAD_DIR);
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
  const u = publicUser(raw);
  const peers = await peersOf(raw.id);
  peers.forEach((p) => io.to('u' + p).emit('user:update', u));
  io.to('u' + raw.id).emit('user:update', publicUser(raw, true));
}

const PREVIEW = {
  image: ['🖼 Rasm', '🖼 Фото', '🖼 Photo'], video: ['🎬 Video', '🎬 Видео', '🎬 Video'], voice: ['🎤 Ovozli xabar', '🎤 Голосовое сообщение', '🎤 Voice message'],
  round: ['⏺ Video xabar', '⏺ Видеосообщение', '⏺ Video message'], file: ['📎 Fayl', '📎 Файл', '📎 File'],
  sticker: ['Stiker', 'Стикер', 'Sticker'], gif: ['GIF', 'GIF', 'GIF'],
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
  if (typeof meta.gif === 'string' && /^https:\/\/media\d*\.tenor\.com\/[\w./-]+$/.test(meta.gif)) { o.gif = meta.gif; o.w = Number(meta.w) || undefined; o.h = Number(meta.h) || undefined; }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}

io.use(async (socket, next) => {
  try { socket.uid = (await userFromToken(socket.handshake.auth?.token)).id; next(); }
  catch { next(new Error('unauthorized')); }
});

const MSG_TYPES = new Set(['text', 'image', 'video', 'voice', 'round', 'file', 'sticker', 'gif']);
const NO_FILE = new Set(['text', 'sticker', 'gif']);
// Xabar yuborish huquqi: kanalda faqat admin, guruh/shaxsiyda a'zolar
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
  }
  return msg;
}
const pendingCalls = new Map(); // calleeId -> { offer, ice[], expires, callId, from }
const on = (socket, ev, fn) => socket.on(ev, (...a) => Promise.resolve(fn(...a)).catch((e) => { console.error(ev, e.message); const ack = a.find((x) => typeof x === 'function'); ack?.({ error: 'server' }); }));

io.on('connection', async (socket) => {
  const uid = socket.uid;
  socket.join('u' + uid);
  socket.emit('app:version', { v: APP_VERSION });
  online.set(uid, (online.get(uid) || 0) + 1);
  await db.run('UPDATE users SET last_seen=? WHERE id=?', [now(), uid]).catch(() => {});
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
    const file = storage.isOurs(p.file) ? p.file : null;
    if (!NO_FILE.has(p.type) && !file) return ack?.({ error: 'no file' });
    if (p.type === 'sticker' && !(p.meta?.e)) return ack?.({ error: 'bad sticker' });
    if (p.type === 'gif' && !cleanMeta({ gif: p.meta?.gif })) return ack?.({ error: 'bad gif' });
    const msg = await saveMessage(chatId, uid, { ...p, text, file }, p.meta);
    ack?.({ ok: true, message: msg });
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
        await saveMessage(cid, uid, { type: m.type, text: m.text, file: m.file, mime: m.mime, size: m.size, duration: m.duration }, { ...(src.meta || {}), fwd });
        sent++;
      }
    }
    ack?.({ ok: true, sent });
  });

  on(socket, 'message:edit', async ({ id, text } = {}) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(id) || 0]);
    const t = String(text || '').slice(0, 4096);
    if (!m || m.sender_id !== uid || m.deleted || m.type === 'call' || (m.type === 'text' && !t.trim())) return;
    await db.run('UPDATE messages SET text=?, edited=1 WHERE id=?', [t, m.id]);
    const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [m.id]));
    (await membersOf(m.chat_id)).forEach((u) => io.to('u' + u).emit('message:edited', { message: msg }));
  });

  on(socket, 'message:delete', async ({ id } = {}) => {
    const m = await db.get('SELECT * FROM messages WHERE id=?', [Number(id) || 0]);
    if (!m) return;
    if (m.sender_id !== uid && !isAdmin(await roleOf(m.chat_id, uid))) return;
    await db.run("UPDATE messages SET deleted=1, text='', file=NULL WHERE id=?", [m.id]);
    if (m.file) storage.remove(m.file, UPLOAD_DIR);
    try { const alt = JSON.parse(m.meta || '{}').alt; if (alt) storage.remove(alt, UPLOAD_DIR); } catch {}
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
    if (!callee || to === uid) return;
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
    if (ev === 'call:answer' || ev === 'call:reject') socket.to('u' + uid).emit('call:handled', { callId: p?.callId });
  }));
  ['call:ringing', 'call:media', 'call:renego'].forEach((ev) => socket.on(ev, (p) => { if (p?.to) io.to('u' + p.to).emit(ev, { ...p, from: uid }); }));

  on(socket, 'call:log', async ({ chatId, peerId, video, duration, status } = {}) => {
    let cid = Number(chatId);
    if (!cid || !(await isMember(cid, uid))) { if (!(await getUser(peerId))) return; cid = await privateChatId(uid, Number(peerId)); }
    const id = await db.insert('INSERT INTO messages(chat_id,sender_id,type,text,duration,meta,created_at) VALUES(?,?,?,?,?,?,?)',
      [cid, uid, 'call', '', Number(duration) || 0, JSON.stringify({ video: !!video, status: String(status || '') }), now()]);
    const msg = fmtMsg(await db.get('SELECT * FROM messages WHERE id=?', [id]));
    for (const m of await membersOf(cid)) io.to('u' + m).emit('message:new', { message: msg, chat: await chatSummary(cid, m) });
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
    for (const s of old) { await db.run('DELETE FROM story_views WHERE story_id=?', [s.id]); await db.run('DELETE FROM stories WHERE id=?', [s.id]); storage.remove(s.file, UPLOAD_DIR); }
    await db.run('DELETE FROM media_acks WHERE message_id IN (SELECT id FROM messages WHERE gone=1)');
    scheduleSweep(1000);
  } catch (e) { console.error('cleanup:', e.message); }
}, 600e3).unref();

(async () => {
  await db.init();
  if (!JWT_SECRET) { JWT_SECRET = await db.getMeta('jwt_secret'); if (!JWT_SECRET) { JWT_SECRET = crypto.randomBytes(32).toString('hex'); await db.setMeta('jwt_secret', JWT_SECRET); } }
  await storage.init();
  push = await createPush(db);
  server.listen(PORT, () => {
    console.log(`\n🟣 Birga ishga tushdi: http://localhost:${PORT}`);
    console.log(`   Baza: ${db.kind} · Fayllar: ${storage.remote ? 'Supabase Storage' : 'disk'} · SMS: ${sms.anyReal ? 'yoqilgan' : 'TEST rejimi (kod ekranda)'} · ffmpeg: ${media.available ? 'bor' : 'YO‘Q'} · TURN: ${process.env.TURN_SECRET || process.env.TURN_URL || process.env.CF_TURN_KEY_ID ? 'bor' : 'YO‘Q'}`);
    if (db.kind === 'sqlite' && process.env.RENDER) console.warn('   ⚠️  DIQQAT: Render’da DATABASE_URL yo‘q — server qayta ishga tushganda barcha profillar O‘CHADI! Supabase ulang.');
    if (!mailer) console.warn('   ⚠️  Email xizmati ulanmagan (BREVO_API_KEY) — kod ekranda ko‘rinadi (TEST rejimi).');
  });
})().catch((e) => { console.error('Ishga tushmadi:', e); process.exit(1); });
