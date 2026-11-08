// Kotib — SaaS tekshiruvi: node test-saas.js
// Bir nechta biznes, ajratilgan ma'lumotlar, obuna, to'lov, admin panel va raqam biriktirish.
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const PORT = 3996, MOCK = 3995;
const base = `http://localhost:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kotib-saas-'));
const hooks = {};

// Soxta Twilio (platforma hisobi AC9)
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => body += c);
  req.on('end', () => {
    if (req.headers.authorization !== 'Basic ' + Buffer.from('AC9:ptok').toString('base64')) { res.writeHead(401); return res.end('{}'); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const sid = 'PN' + 'b'.repeat(32);
    if (req.method === 'GET') return res.end(JSON.stringify({ incoming_phone_numbers: [{ sid, phone_number: '+15550001111', friendly_name: 'Platforma 1', voice_url: hooks.voice || '' }] }));
    const f = new URLSearchParams(body); hooks.voice = f.get('VoiceUrl');
    res.end(JSON.stringify({ sid, phone_number: '+15550001111' }));
  });
}).listen(MOCK);

const env = { ...process.env, PORT: String(PORT), DATA_DIR: dir, DATABASE_URL: '', GEMINI_API_KEY: '', GROQ_API_KEY: '', AI_API_URL: '', AISHA_API_KEY: '', TWILIO_AUTH_TOKEN: '', TWILIO_ACCOUNT_SID: '', TG_BOT_TOKEN: '', PUBLIC_URL: '', ADMIN_PASSWORD: 'admin-parol-1', TWILIO_API_BASE: `http://localhost:${MOCK}` };
let srv;
const start = async () => {
  srv = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/health'); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
};
const stop = () => new Promise((r) => { srv.on('exit', r); srv.kill(); });
async function j(url, body, method, tok) {
  const r = await fetch(base + url, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}
const form = async (url, p) => (await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p) })).text();

async function main() {
  await start();
  // Ikki biznes ro'yxatdan o'tadi
  const A = (await j('/api/auth/register', { name: 'Salon A', phone: '+998901000001', password: 'parolA1' })).data;
  const B = (await j('/api/auth/register', { name: 'Do‘kon B', phone: '+998901000002', password: 'parolB1' })).data;
  assert.ok(A.token && B.token && A.id !== B.id);

  // Ma'lumotlar ajratilgan
  const hours = {}; for (let d = 0; d < 7; d++) hours[d] = { open: '09:00', close: '18:00', off: false, breaks: [] };
  await j('/api/settings', { hours, services: [{ name: 'Soch olish', duration: 60, price: '80 000' }] }, 'PUT', A.token);
  const sa = (await j('/api/settings', null, 'GET', A.token)).data;
  const tomorrow = new Date(Date.now() + 864e5 + 5 * 3600e3).toISOString().slice(0, 10);
  assert.equal((await j('/api/bookings', { serviceId: sa.services[0].id, date: tomorrow, start: '10:00', name: 'Ali' }, 'POST', A.token)).status, 200);
  assert.equal((await j(`/api/bookings?from=${tomorrow}&to=${tomorrow}`, null, 'GET', A.token)).data.length, 1);
  assert.equal((await j(`/api/bookings?from=${tomorrow}&to=${tomorrow}`, null, 'GET', B.token)).data.length, 0);
  assert.equal((await j('/api/settings', null, 'GET', B.token)).data.business.name, 'Do‘kon B');
  assert.equal((await j('/api/public?t=' + A.id)).data.name, 'Salon A');
  assert.equal((await j('/api/public?t=yoq')).status, 404);
  // Mijoz A chatida yozadi — B suhbatlarida ko'rinmaydi
  await j('/api/chat', { session: 's1', text: 'salom', t: A.id });
  assert.equal((await j('/api/conversations', null, 'GET', A.token)).data.length, 1);
  assert.equal((await j('/api/conversations', null, 'GET', B.token)).data.length, 0);
  assert.equal((await j('/api/conversations/web:s1', null, 'GET', B.token)).status, 404);
  // Biznes boshqa biznesning test-chatiga o'z tokeni bilan kira olmaydi
  const tc = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + B.token }, body: JSON.stringify({ session: 'x', text: 'salom', t: A.id, test: true }) });
  assert.equal(tc.status, 200);
  assert.ok((await j('/api/conversations', null, 'GET', A.token)).data.some((c) => c.id === 'web:x'), "begona token — oddiy mijoz sifatida");

  // Sinov davri
  let bill = (await j('/api/billing', null, 'GET', B.token)).data;
  assert.equal(bill.status.state, 'trial');
  assert.equal(bill.status.daysLeft, 7);

  // Admin: parolsiz kirib bo'lmaydi, biznes tokeni admin emas
  assert.equal((await j('/api/admin/tenants')).status, 401);
  assert.equal((await j('/api/admin/tenants', null, 'GET', A.token)).status, 401);
  assert.equal((await j('/api/admin/login', { password: 'xato' })).status, 401);
  const ADM = (await j('/api/admin/login', { password: 'admin-parol-1' })).data.token;
  let tenants = (await j('/api/admin/tenants', null, 'GET', ADM)).data;
  assert.equal(tenants.length, 2);
  assert.equal(tenants.find((t) => t.id === A.id).stats.bookings, 1);

  // Obuna tugadi → AI javob bermaydi, qo'ng'iroq egasiga o'tadi
  await j(`/api/admin/tenants/${B.id}`, { trialDays: 0 }, 'PATCH', ADM);
  assert.equal((await j('/api/billing', null, 'GET', B.token)).data.status.state, 'expired');
  const paused = (await j('/api/chat', { session: 'p1', text: "Ertaga bo'sh vaqt bormi?", t: B.id })).data;
  assert.match(paused.reply, /vaqtincha ishlamayapti/);
  let x = await form(`/t/${B.id}/twilio/voice`, { CallSid: 'CB1', From: '+998935550000', To: '+15550001111' });
  assert.match(x, /<Dial timeout="30" callerId="\+15550001111">\+998901000002<\/Dial>/, x);
  assert.equal((await j('/api/settings', null, 'GET', B.token)).status, 200, "panel ishlayveradi — to'lov uchun");

  // To'lov: biznes so'rov yuboradi, admin tasdiqlaydi
  const pay = await j('/api/billing/pay', { plan: 'oy', note: 'Karta *1234' }, 'POST', B.token);
  assert.equal(pay.status, 200);
  assert.equal((await j('/api/billing/pay', { plan: 'oy' }, 'POST', B.token)).status, 400); // ikkinchisi kutadi
  const pays = (await j('/api/admin/payments', null, 'GET', ADM)).data;
  assert.equal(pays[0].tenantName, 'Do‘kon B');
  assert.equal((await j(`/api/admin/payments/${pay.data.id}`, { approve: true }, 'POST', ADM)).data.status, 'approved');
  bill = (await j('/api/billing', null, 'GET', B.token)).data;
  assert.equal(bill.status.state, 'paid');
  assert.equal(bill.status.daysLeft, 30);
  assert.doesNotMatch((await j('/api/chat', { session: 'p1', text: 'salom', t: B.id })).data.reply, /vaqtincha/);

  // Bloklangan biznes kira olmaydi
  await j(`/api/admin/tenants/${B.id}`, { blocked: true }, 'PATCH', ADM);
  assert.equal((await j('/api/settings', null, 'GET', B.token)).status, 401);
  assert.equal((await j('/api/auth/login', { phone: '901000002', password: 'parolB1' })).status, 403);
  await j(`/api/admin/tenants/${B.id}`, { blocked: false }, 'PATCH', ADM);

  // Admin tariflar va umumiy kalitlarni sozlaydi; biznes "platforma beradi" deb ko'radi
  await j('/api/admin/settings', { plans: [{ id: 'oy', name: 'Oylik', price: 199000, days: 30 }], trialDays: 7, keys: { AISHA_API_KEY: 'umumiy-kalit', TWILIO_ACCOUNT_SID: 'AC9', TWILIO_AUTH_TOKEN: 'ptok' } }, 'PUT', ADM);
  assert.equal((await j('/api/billing', null, 'GET', A.token)).data.plans[0].price, 199000);
  const ka = (await j('/api/connections', null, 'GET', A.token)).data.keys.find((k) => k.key === 'AISHA_API_KEY');
  assert.equal(ka.shared, true);
  assert.equal(ka.value, '', 'umumiy kalit biznesga ko‘rsatilmaydi');
  // Biznes platforma Twilio raqamlarini ko'ra olmaydi
  assert.equal((await j('/api/phone/numbers', null, 'GET', A.token)).data.managed, true);
  assert.equal((await j('/api/phone/numbers', null, 'GET', A.token)).data.numbers.length, 0);

  // Admin platforma raqamini biznes A ga biriktiradi
  const nums = (await j('/api/admin/numbers', null, 'GET', ADM)).data;
  assert.equal(nums[0].number, '+15550001111');
  const asg = await j(`/api/admin/tenants/${A.id}/number`, { sid: nums[0].sid }, 'POST', ADM);
  assert.equal(asg.status, 200, JSON.stringify(asg.data));
  assert.match(hooks.voice, new RegExp(`/t/${A.id}/twilio/voice$`));
  assert.equal((await j('/api/settings', null, 'GET', A.token)).data.kotibNumber, '+15550001111');
  assert.equal((await j('/api/admin/numbers', null, 'GET', ADM)).data[0].tenantName, 'Salon A');

  // Ochiq tariflar (kirish sahifasi uchun) va yordam aloqasi
  await j('/api/admin/settings', { support: '@kotib_yordam' }, 'PUT', ADM);
  const pl = (await j('/api/plans')).data;
  assert.equal(pl.trialDays, 7);
  assert.equal(pl.support, '@kotib_yordam');
  assert.equal(pl.plans[0].price, 199000);

  // Parolni tiklash: admin vaqtinchalik parol beradi, eski token va parol ishlamaydi
  const rp = (await j(`/api/admin/tenants/${B.id}/reset-password`, null, 'POST', ADM)).data;
  assert.equal((await j('/api/settings', null, 'GET', B.token)).status, 401);
  assert.equal((await j('/api/auth/login', { phone: '901000002', password: 'parolB1' })).status, 401);
  const B2 = (await j('/api/auth/login', { phone: '901000002', password: rp.password })).data;
  assert.equal(B2.id, B.id);
  const B3 = (await j('/api/auth/password', { password: 'yangiParol9' }, 'POST', B2.token)).data;
  assert.equal((await j('/api/settings', null, 'GET', B3.token)).status, 200);
  B.token = B3.token;

  // Admin paroli server sozlamasida berilgan — paneldan o'zgartirib bo'lmaydi
  assert.equal((await j('/api/admin/password', { password: 'yangi-admin-1' }, 'POST', ADM)).status, 400);

  // O'zbek raqami (SIP): biznes ishxona raqamini kiritadi, qo'ng'iroq raqamga qarab o'sha biznesga boradi
  assert.equal((await j('/api/phone/uz', { number: '90 555 11 22' }, 'PUT', A.token)).data.number, '+998905551122');
  assert.equal((await j('/api/phone/uz', { number: '+998 90 555 11 22' }, 'PUT', B.token)).status, 400); // band
  assert.equal((await j('/api/phone/uz', { number: '+7 999 123 45 67' }, 'PUT', B.token)).status, 400); // O'zbekniki emas
  x = await form('/sip/voice', { CallSid: 'SIP1', From: 'sip:+998935551122@85.1.2.3:5060', To: 'sip:998905551122@kotib.sip.twilio.com' });
  assert.match(x, new RegExp(`<Redirect method="POST">${base}/t/${A.id}/twilio/voice</Redirect>`), x);
  x = await form('/sip/voice', { CallSid: 'SIP2', From: 'sip:+998935551122@85.1.2.3', To: 'sip:998909999999@kotib.sip.twilio.com' });
  assert.match(x, /ulanmagan/);
  // Biznes manziliga yo'naltirilgan qo'ng'iroq: SIP raqami to'g'ri o'qiladi
  x = await form(`/t/${A.id}/twilio/voice`, { CallSid: 'SIP1', From: 'sip:+998935551122@85.1.2.3:5060', To: 'sip:998905551122@kotib.sip.twilio.com' });
  assert.match(x, /<Gather|<Record/);
  const sipConv = (await j('/api/conversations/call:SIP1', null, 'GET', A.token)).data;
  assert.equal(sipConv.from, '+998935551122');
  // Qurilmasiz yo'l: admin biznesga O'zbekiston virtual raqamini beradi, biznes o'z raqamidan unga yo'naltiradi
  assert.equal((await j(`/api/admin/tenants/${A.id}`, { kotibUz: '+998 71 200 00 01' }, 'PATCH', ADM)).status, 200);
  assert.equal((await j(`/api/admin/tenants/${B.id}`, { kotibUz: '712000001' }, 'PATCH', ADM)).status, 400); // band
  assert.equal((await j('/api/settings', null, 'GET', A.token)).data.kotibUz, '+998712000001');
  x = await form('/sip/voice', { CallSid: 'FWD1', From: 'sip:+998935551122@provayder.uz', To: 'sip:998712000001@kotib.sip.twilio.com' });
  assert.match(x, new RegExp(`/t/${A.id}/twilio/voice</Redirect>`), x);
  assert.equal((await j('/api/phone/uz', { number: '+998 71 200 00 01' }, 'PUT', B.token)).status, 400); // virtual raqam band

  // Bitta umumiy kotib raqami: biznes o'z eski raqamidan yo'naltiradi, kotib asl raqamga qarab biznesni topadi
  await j('/api/admin/settings', { sharedNumber: '+998 71 299 99 99' }, 'PUT', ADM);
  await j('/api/phone/uz', { number: '+998 93 444 55 66' }, 'PUT', B.token);
  assert.equal((await j('/api/settings', null, 'GET', B.token)).data.forwardTo, '+998712999999');
  x = await form('/sip/voice', { CallSid: 'SH1', From: '+998901112233', To: '+998712999999', ForwardedFrom: '+998934445566' });
  assert.match(x, new RegExp(`/t/${B.id}/twilio/voice</Redirect>`), x);
  x = await form('/sip/voice', { CallSid: 'SH2', From: 'sip:+998901112233@prov.uz', To: 'sip:998712999999@kotib.sip.twilio.com', 'SipHeader_Diversion': '<sip:+998934445566@prov.uz>;reason=no-answer' });
  assert.match(x, new RegExp(`/t/${B.id}/twilio/voice</Redirect>`), x);
  x = await form('/sip/voice', { CallSid: 'SH3', From: '+998901112233', To: '+998712999999' }); // asl raqam uzatilmagan
  assert.match(x, /ulanmagan/);

  // Mijoz operator so'raydi: qo'ng'iroq egasiga SIM (shlyuz) orqali o'tadi — mahalliy tarif
  x = await form(`/t/${A.id}/twilio/voice/turn`, { CallSid: 'SIP1', From: 'sip:+998935551122@85.1.2.3:5060', To: 'sip:998905551122@kotib.sip.twilio.com', SpeechResult: 'Operator bilan gaplashmoqchiman' });
  assert.match(x, /<Dial timeout="25" action="\/t\/\w+\/twilio\/dial-done" method="POST"><Sip>sip:998901000001@85\.1\.2\.3:5060<\/Sip><\/Dial>/, x);
  x = await (await fetch(base + '/sip/status', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ CallSid: 'SIP1', From: 'sip:+998935551122@85.1.2.3', To: 'sip:998905551122@kotib.sip.twilio.com', CallStatus: 'completed', CallDuration: '40' }) })).status;
  assert.equal(x, 204);
  assert.equal((await j('/api/conversations/call:SIP1', null, 'GET', A.token)).data.call.duration, 40);

  // Server qayta ishga tushadi — hamma narsa saqlanib qoladi
  await stop();
  await start();
  const A2 = (await j('/api/auth/login', { phone: '+998 90 100 00 01', password: 'parolA1' })).data;
  assert.equal(A2.id, A.id);
  assert.equal((await j(`/api/bookings?from=${tomorrow}&to=${tomorrow}`, null, 'GET', A2.token)).data.length, 1);
  assert.equal((await j('/api/billing', null, 'GET', B.token)).data.status.state, 'paid');

  console.log("✅ SaaS tekshiruvlari o'tdi");
}
main().then(async () => { await stop(); mock.close(); fs.rmSync(dir, { recursive: true, force: true }); })
  .catch(async (e) => { console.error('❌', e.stack); await stop(); mock.close(); process.exit(1); });
