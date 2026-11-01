// Kotib — ma'lumotlarni saqlash.
// DATABASE_URL berilsa PostgreSQL'da (Render/Supabase — doimiy), aks holda data/kotib.json faylida.
const fs = require('fs');
const path = require('path');

const PG = !!process.env.DATABASE_URL;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'kotib.json');
let pool = null;
let state = null;
let timer = null;
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

async function load() {
  let raw = null;
  if (PG) {
    const { Pool } = require('pg');
    const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false }, max: 2 });
    await pool.query('CREATE TABLE IF NOT EXISTS kotib_state(k TEXT PRIMARY KEY, v TEXT)');
    await pool.query('CREATE TABLE IF NOT EXISTS kotib_blobs(k TEXT PRIMARY KEY, type TEXT, data BYTEA, at BIGINT)');
    const r = await pool.query("SELECT v FROM kotib_state WHERE k='main'");
    raw = r.rows[0]?.v || null;
  } else {
    fs.mkdirSync(DIR, { recursive: true });
    if (fs.existsSync(FILE)) raw = fs.readFileSync(FILE, 'utf8');
  }
  const base = defaults();
  const saved = raw ? JSON.parse(raw) : {};
  state = { ...base, ...saved, business: { ...base.business, ...(saved.business || {}) }, admin: { ...base.admin, ...(saved.admin || {}) } };
  return state;
}

const get = () => state;

async function flush() {
  const json = JSON.stringify(state);
  writing = writing.then(async () => {
    if (PG) {
      await pool.query("INSERT INTO kotib_state(k, v) VALUES('main', $1) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [json]);
    } else {
      const tmp = FILE + '.tmp';
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, FILE);
    }
  }).catch((e) => console.error('Saqlashda xato:', e.message));
  return writing;
}

// O'zgarishlar 300 ms ichida birlashtirilib yoziladi
function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
}

function nextId(prefix) {
  state.seq = (state.seq || 1) + 1;
  return prefix + state.seq.toString(36) + Math.random().toString(36).slice(2, 5);
}

// Fayllar (salomlashish ovozi va h.k.): PostgreSQL'da yoki data/blobs papkasida
const BLOB_DIR = path.join(DIR, 'blobs');
const safeKey = (k) => String(k).replace(/[^\w.-]/g, '_');
async function putBlob(key, buf, type) {
  if (PG) await pool.query('INSERT INTO kotib_blobs(k, type, data, at) VALUES($1, $2, $3, $4) ON CONFLICT (k) DO UPDATE SET type = EXCLUDED.type, data = EXCLUDED.data, at = EXCLUDED.at', [key, type, buf, Date.now()]);
  else { fs.mkdirSync(BLOB_DIR, { recursive: true }); fs.writeFileSync(path.join(BLOB_DIR, safeKey(key)), buf); fs.writeFileSync(path.join(BLOB_DIR, safeKey(key) + '.type'), type); }
}
async function getBlob(key) {
  if (PG) { const r = await pool.query('SELECT type, data FROM kotib_blobs WHERE k = $1', [key]); return r.rows[0] ? { type: r.rows[0].type, data: r.rows[0].data } : null; }
  const f = path.join(BLOB_DIR, safeKey(key));
  return fs.existsSync(f) ? { type: fs.readFileSync(f + '.type', 'utf8'), data: fs.readFileSync(f) } : null;
}
async function delBlob(key) {
  if (PG) await pool.query('DELETE FROM kotib_blobs WHERE k = $1', [key]);
  else for (const f of [safeKey(key), safeKey(key) + '.type']) fs.rmSync(path.join(BLOB_DIR, f), { force: true });
}

module.exports = { load, get, save, flush, nextId, putBlob, getBlob, delBlob, PG, DIR };
