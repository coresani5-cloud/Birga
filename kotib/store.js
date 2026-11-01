// Kotib — ma'lumotlarni saqlash (ko'p biznesli SaaS).
// Har bir biznes — alohida hujjat ('t_<id>'), platforma — 'platform'.
// DATABASE_URL berilsa PostgreSQL'da (doimiy), aks holda data/*.json fayllarida.
const fs = require('fs');
const path = require('path');

const PG = !!process.env.DATABASE_URL;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'kotib.json');
let pool = null;
let writing = Promise.resolve();

function defaults() {
  const day = (open, close, off = false) => ({ open, close, off, breaks: [{ from: '13:00', to: '14:00' }] });
  return {
    business: {
      name: 'Mening biznesim',
      about: "Biz haqimizda qisqacha ma'lumot: nima bilan shug'ullanamiz, qanday afzalliklarimiz bor.",
      address: '',
      phone: '',
      greeting: 'Assalomu alaykum! Men {name} kotibiman. Sizga qanday yordam bera olaman?',
      extra: '',
      slotStep: 30,
      capacity: 1,
      bufferMin: 0,
      daysAhead: 30,
      operatorPhone: '',
      reminders: '24,2',
      reportTime: '20:00',
      tgChatId: '',
      langs: 'uz,ru',
    },
    // 0 = yakshanba, 1 = dushanba ... 6 = shanba
    hours: {
      0: day('10:00', '16:00', true),
      1: day('09:00', '18:00'), 2: day('09:00', '18:00'), 3: day('09:00', '18:00'),
      4: day('09:00', '18:00'), 5: day('09:00', '18:00'),
      6: { open: '10:00', close: '15:00', off: false, breaks: [] },
    },
    services: [
      { id: 's1', name: 'Konsultatsiya', duration: 30, price: '100 000 so‘m', desc: '' },
      { id: 's2', name: 'Asosiy xizmat', duration: 60, price: '250 000 so‘m', desc: '' },
    ],
    faq: [
      { id: 'f1', q: "To'lovni qanday qilsa bo'ladi?", a: "Naqd, Click, Payme yoki karta orqali to'lash mumkin." },
    ],
    // Mahsulotlar: narx (so'm) va qoldiq (null = cheklanmagan)
    products: [],
    closedDays: [],
    bookings: [],
    orders: [],
    customers: {},
    tasks: [],
    meta: { lastReport: '' },
    conversations: {},
    secrets: {},
    media: {},
    admin: { hash: '', salt: '', secret: '' },
    seq: 1,
  };
}

// ---------- Platforma (SaaS): bizneslar ro'yxati, tariflar, to'lovlar, umumiy kalitlar ----------
function platformDefaults() {
  return {
    tenants: {},            // id -> { id, name, phone, hash, salt, createdAt, trialUntil, paidUntil, plan, blocked, kotibNumber }
    plans: [
      { id: 'oy', name: 'Oylik', price: 299000, days: 30 },
      { id: 'yil', name: 'Yillik (2 oy bepul)', price: 2990000, days: 365 },
    ],
    trialDays: 7,
    payInfo: "To'lov uchun karta: 8600 0000 0000 0000 (Ism Familiya). To'lagach \"To'lov qildim\" tugmasini bosing — 1 soat ichida faollashtiramiz.",
    payments: [],
    secrets: {},
    admin: { secret: '' },
    seq: 1,
  };
}

// Har bir so'rov qaysi biznesga tegishli ekanini eslab turadi (AsyncLocalStorage)
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();
const docs = new Map();      // kalit -> hujjat ('platform' yoki 't_<id>')
const timers = new Map();
const tkey = (id) => 't_' + id;
const merge = (saved) => {
  const base = defaults();
  return { ...base, ...saved, business: { ...base.business, ...(saved.business || {}) }, meta: { ...base.meta, ...(saved.meta || {}) } };
};

async function load() {
  const raw = {};
  if (PG) {
    const { Pool } = require('pg');
    // Mahalliy yoki Render ichki manzili (domensiz, masalan dpg-xxx-a) — SSL'siz
    let host = ''; try { host = new URL(process.env.DATABASE_URL).hostname; } catch { /* */ }
    const local = /^(localhost|127\.0\.0\.1)$/.test(host) || (host && !host.includes('.'));
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false }, max: 3 });
    await pool.query('CREATE TABLE IF NOT EXISTS kotib_state(k TEXT PRIMARY KEY, v TEXT)');
    await pool.query('CREATE TABLE IF NOT EXISTS kotib_blobs(k TEXT PRIMARY KEY, type TEXT, data BYTEA, at BIGINT)');
    for (const r of (await pool.query('SELECT k, v FROM kotib_state')).rows) raw[r.k] = r.v;
  } else {
    fs.mkdirSync(DIR, { recursive: true });
    for (const f of fs.readdirSync(DIR)) {
      const m = /^(platform|t_\w+)\.json$/.exec(f);
      if (m) raw[m[1]] = fs.readFileSync(path.join(DIR, f), 'utf8');
    }
    if (fs.existsSync(FILE)) raw.main = fs.readFileSync(FILE, 'utf8'); // eski (bitta biznesli) versiya
  }
  const pbase = platformDefaults();
  const psaved = raw.platform ? JSON.parse(raw.platform) : {};
  const platform = { ...pbase, ...psaved, admin: { ...pbase.admin, ...(psaved.admin || {}) } };
  docs.set('platform', platform);
  for (const [k, v] of Object.entries(raw)) if (k.startsWith('t_')) docs.set(k, merge(JSON.parse(v)));

  // Eski bitta biznesli ma'lumotni birinchi biznes sifatida ko'chirish
  if (raw.main && !Object.keys(platform.tenants).length) {
    const old = JSON.parse(raw.main);
    const id = 'b' + (platform.seq++).toString(36) + Math.random().toString(36).slice(2, 6);
    platform.tenants[id] = {
      id, name: old.business?.name || 'Biznes', phone: old.business?.phone || '', hash: old.admin?.hash || '', salt: old.admin?.salt || '',
      createdAt: Date.now(), trialUntil: Date.now() + platform.trialDays * 864e5, paidUntil: 0, plan: '', blocked: false, kotibNumber: old.business?.kotibNumber || '',
    };
    const doc = merge(old);
    delete doc.admin;
    docs.set(tkey(id), doc);
    save(tkey(id)); save('platform');
  }
}

const current = () => als.getStore() || null;
// Joriy biznes hujjati (so'rov kontekstidan)
function get() {
  const k = current();
  const d = k && docs.get(k);
  if (!d) throw new Error('Biznes konteksti topilmadi');
  return d;
}
const platform = () => docs.get('platform');
const run = (id, fn) => als.run(tkey(id), fn);
const has = (id) => docs.has(tkey(id));
const tenantId = () => (current() || '').replace(/^t_/, '') || null;
const tenantIds = () => [...docs.keys()].filter((k) => k.startsWith('t_')).map((k) => k.slice(2));
function createTenant(id) {
  const d = merge({});
  delete d.admin;
  docs.set(tkey(id), d);
  save(tkey(id));
  return d;
}

async function writeKey(key) {
  const d = docs.get(key);
  if (!d) return;
  const json = JSON.stringify(d);
  writing = writing.then(async () => {
    if (PG) await pool.query('INSERT INTO kotib_state(k, v) VALUES($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v', [key, json]);
    else {
      const f = path.join(DIR, key + '.json'), tmp = f + '.tmp';
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, f);
    }
  }).catch((e) => console.error('Saqlashda xato:', e.message));
  return writing;
}
// O'zgarishlar 300 ms ichida birlashtirilib yoziladi
function save(key) {
  key = key || current();
  if (!key) return;
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(() => { timers.delete(key); writeKey(key); }, 300));
}
const savePlatform = () => save('platform');
async function flush() {
  for (const [k, t] of timers) { clearTimeout(t); timers.delete(k); writeKey(k); }
  return writing;
}

function nextId(prefix) {
  const st = get();
  st.seq = (st.seq || 1) + 1;
  return prefix + st.seq.toString(36) + Math.random().toString(36).slice(2, 5);
}

// Fayllar (salomlashish ovozi va h.k.): PostgreSQL'da yoki data/blobs papkasida
const BLOB_DIR = path.join(DIR, 'blobs');
const safeKey = (k) => String(k).replace(/[^\w.-]/g, '_');
async function putBlob(key, buf, type) {
  key = (current() || 'p') + ':' + key;
  if (PG) await pool.query('INSERT INTO kotib_blobs(k, type, data, at) VALUES($1, $2, $3, $4) ON CONFLICT (k) DO UPDATE SET type = EXCLUDED.type, data = EXCLUDED.data, at = EXCLUDED.at', [key, type, buf, Date.now()]);
  else { fs.mkdirSync(BLOB_DIR, { recursive: true }); fs.writeFileSync(path.join(BLOB_DIR, safeKey(key)), buf); fs.writeFileSync(path.join(BLOB_DIR, safeKey(key) + '.type'), type); }
}
async function getBlob(key) {
  key = (current() || 'p') + ':' + key;
  if (PG) { const r = await pool.query('SELECT type, data FROM kotib_blobs WHERE k = $1', [key]); return r.rows[0] ? { type: r.rows[0].type, data: r.rows[0].data } : null; }
  const f = path.join(BLOB_DIR, safeKey(key));
  return fs.existsSync(f) ? { type: fs.readFileSync(f + '.type', 'utf8'), data: fs.readFileSync(f) } : null;
}
async function delBlob(key) {
  key = (current() || 'p') + ':' + key;
  if (PG) await pool.query('DELETE FROM kotib_blobs WHERE k = $1', [key]);
  else for (const f of [safeKey(key), safeKey(key) + '.type']) fs.rmSync(path.join(BLOB_DIR, f), { force: true });
}

module.exports = { load, get, save, savePlatform, flush, nextId, putBlob, getBlob, delBlob, platform, run, has, tenantId, tenantIds, createTenant, current, PG, DIR };
