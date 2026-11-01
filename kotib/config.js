// Kotib — ulanishlar (API kalitlari), ko'p biznesli.
// Qiymat qidirish tartibi: 1) biznesning o'z kaliti ("Ulanishlar" bo'limi), 2) server muhiti (Render Environment),
// 3) platforma egasining umumiy kaliti (admin panel). Shunday qilib biznes o'z kalitisiz ham ishlay oladi.
const store = require('./store');

// [nomi, maxfiymi, biznes o'zi kirita oladimi]
const KEYS = [
  ['GEMINI_API_KEY', true, true],
  ['AISHA_API_KEY', true, true],
  ['AISHA_VOICE_ID', false, true],
  ['ELEVENLABS_API_KEY', true, true],
  ['ELEVENLABS_VOICE_ID', false, true],
  ['MUXLISA_API_KEY', true, true],
  ['AZURE_SPEECH_KEY', true, true],
  ['AZURE_SPEECH_REGION', false, true],
  ['TWILIO_ACCOUNT_SID', false, true],
  ['TWILIO_AUTH_TOKEN', true, true],
  ['TWILIO_FROM', false, true],
  ['TG_BOT_TOKEN', true, true],
  ['PUBLIC_URL', false, false],     // faqat platforma
  ['ADMIN_TG_BOT_TOKEN', true, false], // platforma egasiga xabarlar (yangi biznes, to'lov)
  ['ADMIN_TG_CHAT_ID', false, false],
];
const NAMES = KEYS.map(([k]) => k);
const SECRET = new Set(KEYS.filter(([, s]) => s).map(([k]) => k));
const TENANT = new Set(KEYS.filter(([, , t]) => t).map(([k]) => k));

function tenantSecrets() {
  if (!store.current()) return {};
  try { return store.get().secrets || {}; } catch { return {}; }
}
// Joriy biznes uchun qiymat
function env(name) {
  const t = TENANT.has(name) ? tenantSecrets()[name] : '';
  return t || process.env[name] || store.platform()?.secrets?.[name] || '';
}
// Qiymat qayerdan kelyapti: 'tenant' | 'env' | 'platform' | ''
function source(name) {
  if (TENANT.has(name) && tenantSecrets()[name]) return 'tenant';
  if (process.env[name]) return 'env';
  if (store.platform()?.secrets?.[name]) return 'platform';
  return '';
}

const clean = (k, v) => { v = String(v || '').trim().slice(0, 500); return k === 'PUBLIC_URL' ? v.replace(/\/+$/, '') : v; };
// Biznes o'z kalitlarini saqlaydi
function set(values) {
  const s = store.get();
  s.secrets = s.secrets || {};
  for (const k of TENANT) {
    if (values[k] === undefined) continue;
    const v = clean(k, values[k]);
    if (v.startsWith('••••')) continue; // o'zgartirilmagan maxfiy qiymat
    if (v) s.secrets[k] = v; else delete s.secrets[k];
  }
  store.save();
}
// Platforma egasi umumiy kalitlarni saqlaydi
function setPlatform(values) {
  const p = store.platform();
  p.secrets = p.secrets || {};
  for (const k of NAMES) {
    if (values[k] === undefined) continue;
    const v = clean(k, values[k]);
    if (v.startsWith('••••')) continue;
    if (v) p.secrets[k] = v; else delete p.secrets[k];
  }
  store.savePlatform();
}
const mask = (secret, v) => (secret ? (v ? '••••' + v.slice(-4) : '') : v);
// Biznesga ko'rsatish: o'z kalitlari; umumiy kalit bo'lsa — "platforma beradi" deb belgilanadi
function view() {
  const sec = tenantSecrets();
  return KEYS.filter(([k, , t]) => t).map(([k, secret]) => {
    const own = sec[k] || '';
    const src = source(k);
    return { key: k, secret, own: !!own, shared: !own && !!src, set: !!src, value: mask(secret, own) };
  });
}
function viewPlatform() {
  const sec = store.platform()?.secrets || {};
  return KEYS.map(([k, secret]) => ({ key: k, secret, env: !!process.env[k], set: !!(sec[k] || process.env[k]), value: mask(secret, sec[k] || '') }));
}
const publicUrl = () => String(process.env.PUBLIC_URL || store.platform()?.secrets?.PUBLIC_URL || '').replace(/\/+$/, '');
// Biznes Twilio'ni o'zi ulaganmi (aks holda platforma raqamlari admin orqali biriktiriladi)
const ownTwilio = () => !!(tenantSecrets().TWILIO_ACCOUNT_SID && tenantSecrets().TWILIO_AUTH_TOKEN);

module.exports = { env, source, set, setPlatform, view, viewPlatform, publicUrl, ownTwilio, NAMES, SECRET };
