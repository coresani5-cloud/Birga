// Birga — fayllarni saqlash
// SUPABASE_URL + SUPABASE_SERVICE_KEY berilsa fayllar Supabase Storage'da (bepul 1 GB) doimiy saqlanadi.
// Aks holda server diskidagi uploads/ papkasida.
const fs = require('fs');
const path = require('path');

const URL_ = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'birga';
const REMOTE = !!(URL_ && KEY);
const PUBLIC_BASE = REMOTE ? `${URL_}/storage/v1/object/public/${BUCKET}/` : '/uploads/';
// Yangi "sb_secret_..." kalitlari faqat apikey sarlavhasida yuboriladi; eski service_role (JWT) kaliti ikkalasida ham
const headers = KEY.startsWith('sb_') ? { apikey: KEY } : { Authorization: 'Bearer ' + KEY, apikey: KEY };

async function init() {
  if (!REMOTE) return;
  try {
    const r = await fetch(`${URL_}/storage/v1/bucket/${BUCKET}`, { headers });
    if (r.ok) return;
    const c = await fetch(`${URL_}/storage/v1/bucket`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    if (!c.ok) console.error('Storage bucket yaratilmadi:', c.status, (await c.text()).slice(0, 200));
    else console.log(`   Storage: "${BUCKET}" bucket yaratildi`);
  } catch (e) { console.error('Storage:', e.message); }
}

// Mahalliy faylni doimiy joyga ko'chiradi va ommaviy manzilini qaytaradi
async function save(localPath, mime) {
  const name = path.basename(localPath);
  if (!REMOTE) return '/uploads/' + name;
  const body = fs.readFileSync(localPath);
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${name}`, {
    method: 'POST', headers: { ...headers, 'Content-Type': mime || 'application/octet-stream', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' }, body,
  });
  if (!r.ok) throw new Error('Storage yuklash xatosi: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  fs.unlink(localPath, () => {});
  return PUBLIC_BASE + name;
}

async function remove(url, uploadDir) {
  if (!url) return;
  const name = path.basename(String(url).split('?')[0]);
  if (!/^[\w.-]+$/.test(name)) return;
  if (String(url).startsWith('/uploads/')) return fs.unlink(path.join(uploadDir, name), () => {});
  if (REMOTE && String(url).startsWith(PUBLIC_BASE)) {
    await fetch(`${URL_}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [name] }),
    }).catch(() => {});
  }
}

// To'g'ridan-to'g'ri yuklash: telefon faylni serverdan o'tkazmasdan Supabase Storage'ga yuklaydi (tez, server xotirasiga yuk tushmaydi)
async function signUpload(name) {
  if (!REMOTE || !/^[\w.-]+$/.test(name)) return null;
  const r = await fetch(`${URL_}/storage/v1/object/upload/sign/${BUCKET}/${name}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'x-upsert': 'true' }, body: '{}' });
  if (!r.ok) throw new Error('Storage sign: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json(); const rel = j.url || j.signedURL || j.signedUrl; if (!rel) throw new Error('Storage sign: javob bo‘sh');
  return { upload: `${URL_}/storage/v1${rel.startsWith('/') ? '' : '/'}${rel}`, url: PUBLIC_BASE + name };
}
async function exists(url) {
  if (!REMOTE || !String(url).startsWith(PUBLIC_BASE)) return true;
  const r = await fetch(url, { method: 'HEAD' }).catch(() => null); return !!r?.ok;
}

const isOurs = (url) => typeof url === 'string' && (/^\/uploads\/[\w.-]+$/.test(url) || (REMOTE && url.startsWith(PUBLIC_BASE) && /^[\w.-]+$/.test(url.slice(PUBLIC_BASE.length))));

module.exports = { init, save, remove, isOurs, signUpload, exists, remote: REMOTE, maxMb: REMOTE ? 50 : 100 };
