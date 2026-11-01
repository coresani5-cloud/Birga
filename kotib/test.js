// Kotib — tezkor tekshiruv: node test.js
// Vaqtinchalik papkada serverni AI'siz ishga tushirib, asosiy yo'llarni sinaydi.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const PORT = 3999;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kotib-'));
const env = { ...process.env, PORT: String(PORT), DATA_DIR: dir, DATABASE_URL: '', GEMINI_API_KEY: '', GROQ_API_KEY: '', AI_API_URL: '', TWILIO_AUTH_TOKEN: '', ADMIN_PASSWORD: '' };
const srv = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
const base = `http://localhost:${PORT}`;
let token = '';

async function j(url, body, method) {
  const r = await fetch(base + url, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}
async function form(url, params) {
  const r = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  return r.text();
}
const chat = async (session, text) => (await j('/api/chat', { session, text })).data;

async function main() {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/health'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }

  // Kirish
  assert.equal((await j('/api/auth/status')).data.setup, true);
  token = (await j('/api/auth/setup', { password: 'sirli123', name: 'Go‘zallik saloni' })).data.token;
  assert.ok(token);
  assert.equal((await j('/api/auth/login', { password: 'xato' })).status, 401);

  // Har kuni ochiq qilib qo'yamiz, shunda test istalgan kunda ishlaydi
  const hours = {}; for (let d = 0; d < 7; d++) hours[d] = { open: '09:00', close: '18:00', off: false, breaks: [{ from: '13:00', to: '14:00' }] };
  await j('/api/settings', { hours, services: [{ name: 'Soch olish', duration: 60, price: '80 000 so‘m' }, { name: 'Manikyur', duration: 90, price: '120 000 so‘m' }], products: [{ name: 'Shampun', price: '45000', stock: 3, unit: 'dona' }] }, 'PUT');
  const set = (await j('/api/settings')).data;
  assert.equal(set.services.length, 2);
  const tomorrow = new Date(Date.now() + 864e5 + 5 * 3600e3).toISOString().slice(0, 10);
  let x;

  // Bo'sh vaqt
  const free = (await j('/api/free?date=' + tomorrow)).data;
  assert.deepEqual(free.ranges, [['09:00', '13:00'], ['14:00', '18:00']]);

  // Chat orqali yozilish (qoidalar rejimi)
  let r = await chat('t1', "Ertaga bo'sh vaqt bormi?");
  assert.match(r.reply, /09:00–13:00/);
  r = await chat('t1', 'Soch olishga yozilmoqchiman, ertaga soat 10:00');
  assert.match(r.reply, /Ism/i);
  r = await chat('t1', 'Ali');
  assert.match(r.reply, /Telefon/i);
  r = await chat('t1', '+998 90 765 43 21');
  assert.ok(r.booking, 'buyurtma yaratilishi kerak: ' + r.reply);
  assert.equal(r.booking.start, '10:00');

  // Endi 10:00 band bo'lishi kerak
  const free2 = (await j('/api/free?date=' + tomorrow)).data;
  assert.deepEqual(free2.ranges[0], ['09:00', '10:00']);
  r = await chat('t2', 'Yozilmoqchiman soch olish ertaga 10:30');
  assert.match(r.reply, /band/);

  // Qo'lda buyurtma va to'qnashuv
  const bad = await j('/api/bookings', { serviceId: set.services[0].id, date: tomorrow, start: '10:00', name: 'Vali' });
  assert.equal(bad.status, 400);
  const ok = await j('/api/bookings', { serviceId: set.services[1].id, date: tomorrow, start: '15:00', name: 'Vali', phone: '901112233' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.end, '16:30');
  const month = (await j('/api/month?ym=' + tomorrow.slice(0, 7))).data;
  assert.equal(month.days[tomorrow].count, 2);

  // Twilio qo'ng'irog'i
  x = await form('/twilio/voice', { CallSid: 'CA1', From: '+998901234567' });
  assert.match(x, /<Gather input="dtmf speech"/);
  x = await form('/twilio/voice/turn', { CallSid: 'CA1', From: '+998901234567', SpeechResult: 'Narxlar qancha?' });
  assert.match(x, /80 000/);
  x = await form('/twilio/voice/turn', { CallSid: 'CA1', From: '+998901234567', SpeechResult: 'Manikyurga ertaga soat 11 da yozilaman, ismim Madina' });
  assert.match(x, /Yozib qo'ydim|Yozib qo&apos;ydim/, x);

  // SMS
  x = await form('/twilio/sms', { From: '+998935554433', Body: "Ertaga bo'sh vaqt bormi?" });
  assert.match(x, /<Message>/);

  const convs = (await j('/api/conversations')).data;
  assert.ok(convs.length >= 4);
  const list = (await j(`/api/bookings?from=${tomorrow}&to=${tomorrow}`)).data;
  assert.equal(list.length, 3);
  assert.ok(list.some((b) => b.source === 'call' && b.customer.name === 'Madina'));

  // Mahsulot: narx, qoldiq va zakaz
  r = await chat('p1', 'Shampun bormi?');
  assert.match(r.reply, /45 000.*3 dona bor/, r.reply);
  r = await chat('p1', '2 ta shampun zakaz qilaman');
  assert.match(r.reply, /Ism/i, r.reply);
  r = await chat('p1', 'Dilnoza');
  r = await chat('p1', '+998 97 777 77 77');
  assert.match(r.reply, /manzil/i, r.reply);
  r = await chat('p1', 'Chilonzor 5-kvartal');
  assert.ok(r.order, 'zakaz yaratilishi kerak: ' + r.reply);
  assert.equal(r.order.total, 90000);
  assert.equal((await j('/api/settings')).data.products[0].stock, 1);
  assert.equal((await j('/api/orders', { items: [{ product: 'Shampun', qty: 5 }], name: 'Test' })).status, 400);

  // Rus tili
  r = await chat('ru1', 'Здравствуйте, есть свободное время завтра?');
  assert.match(r.reply, /свободно/, r.reply);

  // Insonga topshirish
  r = await chat('h1', "Operator bilan gaplashmoqchiman, menga +998 91 000 11 22");
  assert.equal(r.handoff, true);

  // Qo'ng'iroq: til menyusi, ruscha, javobsiz qo'ng'iroq, tanish mijoz
  x = await form('/twilio/voice', { CallSid: 'CA3', From: '+998935550000' });
  assert.match(x, /numDigits="1"/);
  x = await form('/twilio/voice/turn?menu=1', { CallSid: 'CA3', From: '+998935550000', Digits: '2' });
  assert.match(x, /Tatyana/);
  x = await form('/twilio/voice/turn', { CallSid: 'CA3', From: '+998935550000', SpeechResult: 'Позовите оператора' });
  assert.match(x, /перезвоним/, x);
  await form('/twilio/status', { CallSid: 'CA9', From: '+998946660000', CallStatus: 'completed', CallDuration: '4' });
  x = await form('/twilio/voice', { CallSid: 'CA4', From: '+998901234567' });
  assert.match(x, /Madina/, x);

  const tasks = (await j('/api/tasks')).data;
  assert.ok(tasks.some((t) => t.type === 'missed' && t.phone === '+998946660000'), 'javobsiz qo‘ng‘iroq vazifasi');
  assert.ok(tasks.some((t) => t.type === 'handoff' && t.phone === '+998935550000'), 'operator vazifasi');
  assert.ok(tasks.some((t) => t.type === 'handoff' && /000/.test(t.phone)), 'chat orqali operator vazifasi');

  const customers = (await j('/api/customers')).data;
  const madina = customers.find((c) => c.name === 'Madina');
  assert.ok(madina && madina.calls === 2 && madina.bookings === 1, JSON.stringify(madina));
  const detail = (await j('/api/customers/' + madina.key)).data;
  assert.equal(detail.conversations.length, 2);

  const rep = (await j('/api/report')).data;
  assert.equal(rep.orders, 1);
  assert.equal(rep.sales, 90000);
  assert.ok(rep.calls >= 4 && rep.missed === 1, JSON.stringify(rep));

  console.log('✅ Hamma tekshiruvlar o‘tdi');
}

main().then(() => { srv.on('exit', () => fs.rmSync(dir, { recursive: true, force: true })); srv.kill(); })
  .catch((e) => { console.error('❌', e.message); srv.kill(); process.exit(1); });
