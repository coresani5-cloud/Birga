// Birga — SMS yuborish (butun dunyo bo'ylab, davlatga qarab yo'naltirish)
//
// Provayderlar:
//   gateway — o'zingizning Android telefoningiz + SIM karta (SMS Gateway for Android, sms-gate.app).
//             Eng arzon: faqat operator tarifi (O'zbekistonda cheksiz SMS paketlari bor).
//   eskiz   — Eskiz.uz (O'zbekiston raqamlari)
//   twilio  — Twilio (barcha davlatlar)
//   console — test rejimi (kod ekranda)
//
// SMS_ROUTES — davlat kodi bo'yicha qaysi provayder ishlatilishi:
//   SMS_ROUTES=998:gateway,7:twilio,*:twilio
// Agar SMS_ROUTES bo'lmasa, hamma raqamlar SMS_PROVIDER (standart: console) orqali ketadi.

const DEFAULT = (process.env.SMS_PROVIDER || 'console').toLowerCase();
const ROUTES = String(process.env.SMS_ROUTES || '')
  .split(',').map((s) => s.trim()).filter(Boolean)
  .map((r) => { const [prefix, prov] = r.split(':'); return { prefix: prefix.replace('+', ''), prov: (prov || '').toLowerCase() }; })
  .sort((a, b) => (b.prefix === '*' ? -1 : a.prefix === '*' ? 1 : b.prefix.length - a.prefix.length));

function providerFor(phone) {
  const d = phone.replace('+', '');
  for (const r of ROUTES) if (r.prefix === '*' || d.startsWith(r.prefix)) return r.prov;
  return DEFAULT;
}

/* ---------- Android SMS Gateway (o'z SIM kartangiz) ---------- */
async function sendGateway(phone, text) {
  const url = (process.env.GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1').replace(/\/$/, '') + '/messages';
  const auth = Buffer.from(`${process.env.GATEWAY_USER}:${process.env.GATEWAY_PASS}`).toString('base64');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone], ttl: 300, priority: 100 }),
  });
  if (!r.ok) throw new Error('Gateway xatosi: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json().catch(() => ({}));
}

/* ---------- Eskiz.uz ---------- */
let eskizToken = null, eskizTokenTime = 0;
async function eskizLogin() {
  if (eskizToken && Date.now() - eskizTokenTime < 20 * 24 * 3600e3) return eskizToken;
  const form = new FormData();
  form.append('email', process.env.ESKIZ_EMAIL);
  form.append('password', process.env.ESKIZ_PASSWORD);
  const j = await (await fetch('https://notify.eskiz.uz/api/auth/login', { method: 'POST', body: form })).json();
  if (!j?.data?.token) throw new Error('Eskiz login xatosi');
  eskizToken = j.data.token; eskizTokenTime = Date.now();
  return eskizToken;
}
async function sendEskiz(phone, text) {
  const token = await eskizLogin();
  const form = new FormData();
  form.append('mobile_phone', phone.replace('+', ''));
  form.append('message', text);
  form.append('from', process.env.ESKIZ_FROM || '4546');
  const r = await fetch('https://notify.eskiz.uz/api/message/sms/send', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
  if (r.status === 401) { eskizToken = null; throw new Error('Eskiz token eskirgan'); }
  if (!r.ok) throw new Error('Eskiz SMS xatosi: ' + (await r.text()).slice(0, 200));
}

/* ---------- Twilio ---------- */
async function sendTwilio(phone, text) {
  const sid = process.env.TWILIO_SID, tok = process.env.TWILIO_TOKEN;
  const body = new URLSearchParams({ To: phone, Body: text });
  if (process.env.TWILIO_MESSAGING_SERVICE) body.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE);
  else body.set('From', process.env.TWILIO_FROM);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64') }, body,
  });
  if (!r.ok) throw new Error('Twilio xatosi: ' + (await r.text()).slice(0, 200));
}

const TEXTS = {
  uz: 'Birga kodi: {code}. Uni hech kimga bermang.',
  ru: 'Код Birga: {code}. Никому его не сообщайте.',
  en: 'Your Birga code: {code}. Do not share it.',
};

async function sendCode(phone, code, lang = 'en') {
  const prov = providerFor(phone);
  const tpl = (prov === 'eskiz' && process.env.SMS_TEXT) || TEXTS[lang] || TEXTS.en;
  const text = tpl.replace('{code}', code);
  if (prov === 'gateway') return sendGateway(phone, text);
  if (prov === 'eskiz') return sendEskiz(phone, text);
  if (prov === 'twilio') return sendTwilio(phone, text);
  console.log(`📩 [TEST SMS] ${phone} → ${text}`);
  return { dev: true };
}

const isDevFor = (phone) => providerFor(phone) === 'console';
module.exports = { sendCode, isDevFor, providerFor, anyReal: DEFAULT !== 'console' || ROUTES.some((r) => r.prov !== 'console') };
