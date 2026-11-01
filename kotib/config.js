// Kotib — ulanishlar (API kalitlari). Server muhitida (Environment) berilgan qiymat ustun turadi,
// bo'lmasa — egasi ilovadagi "Ulanishlar" bo'limida kiritgan qiymat ishlatiladi.
const store = require('./store');

// [nomi, maxfiymi]
const KEYS = [
  ['PUBLIC_URL', false],
  ['GEMINI_API_KEY', true],
  ['AISHA_API_KEY', true],
  ['AISHA_VOICE_ID', false],
  ['MUXLISA_API_KEY', true],
  ['AZURE_SPEECH_KEY', true],
  ['AZURE_SPEECH_REGION', false],
  ['TWILIO_ACCOUNT_SID', false],
  ['TWILIO_AUTH_TOKEN', true],
  ['TWILIO_FROM', false],
  ['TG_BOT_TOKEN', true],
];
const NAMES = KEYS.map(([k]) => k);
const SECRET = new Set(KEYS.filter(([, s]) => s).map(([k]) => k));
const ORIG = Object.fromEntries(NAMES.map((k) => [k, process.env[k] || '']));

// Ilovada kiritilgan kalitlarni process.env ga qo'yamiz (barcha modullar shu yerdan o'qiydi)
function apply() {
  const sec = store.get().secrets || {};
  for (const k of NAMES) {
    if (ORIG[k]) continue;
    if (sec[k]) process.env[k] = sec[k];
    else delete process.env[k];
  }
}
function set(values) {
  const s = store.get();
  s.secrets = s.secrets || {};
  for (const k of NAMES) {
    if (values[k] === undefined || ORIG[k]) continue;
    const v = String(values[k] || '').trim().slice(0, 500);
    if (v.startsWith('••••')) continue; // o'zgartirilmagan maxfiy qiymat
    if (v) s.secrets[k] = k === 'PUBLIC_URL' ? v.replace(/\/+$/, '') : v; else delete s.secrets[k];
  }
  store.save();
  apply();
}
// Ilovaga ko'rsatish: maxfiy qiymatlar yashiriladi
function view() {
  const sec = store.get().secrets || {};
  return KEYS.map(([k, secret]) => {
    const val = ORIG[k] || sec[k] || '';
    return { key: k, secret, env: !!ORIG[k], set: !!val, value: secret ? (val ? '••••' + val.slice(-4) : '') : val };
  });
}
const publicUrl = () => String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');

module.exports = { apply, set, view, publicUrl, NAMES, SECRET };
