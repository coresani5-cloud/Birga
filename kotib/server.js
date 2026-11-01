// Kotib — biznes egasi uchun aqlli kotib (virtual xodim).
// 24/7 telefon qo'ng'iroqlari va SMS'ga javob beradi (Twilio), o'zbek va rus tillarida gaplashadi,
// uchrashuv va zakaz qabul qiladi, kalendarni yuritadi, mijozlarni eslab qoladi,
// kerak bo'lsa operatorga ulaydi va Telegram orqali egasiga xabar/kunlik hisobot yuboradi.
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const store = require('./store');
const S = require('./slots');
const A = require('./assistant');
const C = require('./core');

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const st = () => store.get();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Kirish (biznes egasi) ----------
const hashPass = (p, salt) => crypto.scryptSync(String(p), salt, 32).toString('hex');
function secret() {
  const a = st().admin;
  if (process.env.SECRET) return process.env.SECRET;
  if (!a.secret) { a.secret = crypto.randomBytes(32).toString('hex'); store.save(); }
  return a.secret;
}
function makeToken() {
  const body = `admin.${Date.now() + 180 * 864e5}.${st().admin.salt || 'env'}`;
  return body + '.' + crypto.createHmac('sha256', secret()).update(body).digest('hex');
}
function validToken(tok) {
  const p = String(tok || '').split('.');
  if (p.length !== 4) return false;
  const body = p.slice(0, 3).join('.');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('hex');
  if (sig.length !== p[3].length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(p[3]))) return false;
  return Number(p[1]) > Date.now() && p[2] === (st().admin.salt || 'env');
}
function auth(req, res, next) {
  const tok = (req.headers.authorization || '').replace(/^Bearer\s+/, '') || req.query.token;
  if (!validToken(tok)) return res.status(401).json({ error: 'Kirish kerak' });
  next();
}
const hasPassword = () => !!(process.env.ADMIN_PASSWORD || st().admin.hash);

app.get('/api/auth/status', (req, res) => res.json({ setup: !hasPassword() }));
app.post('/api/auth/setup', (req, res) => {
  if (hasPassword()) return res.status(400).json({ error: "Parol allaqachon o'rnatilgan" });
  const p = String(req.body.password || '');
  if (p.length < 6) return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lsin" });
  const a = st().admin;
  a.salt = crypto.randomBytes(8).toString('hex');
  a.hash = hashPass(p, a.salt);
  if (req.body.name) st().business.name = String(req.body.name).slice(0, 100);
  store.save();
  res.json({ token: makeToken() });
});
const loginTries = new Map();
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip, now = Date.now();
  const tr = (loginTries.get(ip) || []).filter((t) => now - t < 10 * 60e3);
  if (tr.length >= 10) return res.status(429).json({ error: "Juda ko'p urinish. 10 daqiqadan keyin qayta urining" });
  const p = String(req.body.password || ''), a = st().admin;
  const ok = process.env.ADMIN_PASSWORD ? p === process.env.ADMIN_PASSWORD : (a.hash && hashPass(p, a.salt) === a.hash);
  if (!ok) { tr.push(now); loginTries.set(ip, tr); return res.status(401).json({ error: "Parol noto'g'ri" }); }
  res.json({ token: makeToken() });
});
app.post('/api/auth/password', auth, (req, res) => {
  if (process.env.ADMIN_PASSWORD) return res.status(400).json({ error: 'Parol ADMIN_PASSWORD orqali boshqariladi' });
  const p = String(req.body.password || '');
  if (p.length < 6) return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lsin" });
  const a = st().admin;
  a.salt = crypto.randomBytes(8).toString('hex'); // eski tokenlar bekor bo'ladi
  a.hash = hashPass(p, a.salt);
  store.save();
  res.json({ token: makeToken() });
});

// ---------- Jonli yangilanish (SSE) ----------
const clients = new Set();
function emit(type, data) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data || {})}\n\n`;
  for (const r of clients) r.write(msg);
}
C.setEmit(emit);
app.get('/api/events', auth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  clients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

// ---------- Uchrashuvlar ----------
app.get('/api/bookings', auth, (req, res) => {
  const { from = '0000', to = '9999', q } = req.query;
  let list = st().bookings.filter((b) => b.date >= from && b.date <= to);
  if (q) { const n = String(q).toLowerCase(); list = list.filter((b) => (b.customer.name + ' ' + b.customer.phone + ' ' + b.serviceName).toLowerCase().includes(n)); }
  list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  res.json(list);
});
app.post('/api/bookings', auth, (req, res) => {
  const r = C.createBooking({ ...req.body, source: 'manual' });
  if (!r.ok) return res.status(400).json({ error: r.error });
  res.json(r.booking);
});
app.patch('/api/bookings/:id', auth, (req, res) => {
  const s = st(), b = s.bookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Topilmadi' });
  const p = req.body;
  if (p.date || p.start || p.serviceId) {
    const svc = s.services.find((x) => x.id === (p.serviceId || b.serviceId));
    const date = p.date || b.date, start = p.start || b.start;
    const dur = Number(p.duration) || svc?.duration || (S.toMin(b.end) - S.toMin(b.start));
    if (!p.force) {
      const err = S.check(s, date, start, dur, b.id);
      if (err) return res.status(400).json({ error: err });
    }
    if (date !== b.date || start !== b.start) b.reminded = [];
    Object.assign(b, { date, start, end: S.toHM(Math.min(1439, S.toMin(start) + dur)), serviceId: svc?.id || b.serviceId, serviceName: svc?.name || b.serviceName, price: svc?.price ?? b.price });
  }
  if (p.status && ['confirmed', 'done', 'cancelled', 'noshow'].includes(p.status)) b.status = p.status;
  if (p.name !== undefined) b.customer.name = String(p.name).slice(0, 80);
  if (p.phone !== undefined) b.customer.phone = String(p.phone).slice(0, 30);
  if (p.notes !== undefined) b.notes = String(p.notes).slice(0, 500);
  store.save();
  emit('booking', b);
  res.json(b);
});
app.delete('/api/bookings/:id', auth, (req, res) => {
  const s = st(), i = s.bookings.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Topilmadi' });
  s.bookings.splice(i, 1);
  store.save();
  emit('booking', { id: req.params.id, deleted: true });
  res.json({ ok: true });
});

// Oy ko'rinishi: har kun uchun uchrashuvlar soni va bo'sh vaqt bormi
app.get('/api/month', auth, (req, res) => {
  const ym = /^\d{4}-\d{2}$/.test(req.query.ym || '') ? req.query.ym : S.now().date.slice(0, 7);
  const s = st(), out = {};
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let d = 1; d <= days; d++) {
    const date = `${ym}-${String(d).padStart(2, '0')}`;
    const list = s.bookings.filter((b) => b.date === date && b.status !== 'cancelled');
    out[date] = { count: list.length, open: !!S.dayHours(s, date), closed: s.closedDays.includes(date), free: S.freeRanges(s, date).reduce((a, [x, z]) => a + z - x, 0) };
  }
  res.json({ ym, today: S.now().date, days: out });
});
app.get('/api/free', auth, (req, res) => {
  const s = st(), date = req.query.date;
  if (!S.isDate(date)) return res.status(400).json({ error: "Sana noto'g'ri" });
  const svc = s.services.find((x) => x.id === req.query.service);
  res.json({ date, human: S.human(date), open: !!S.dayHours(s, date), ranges: S.freeRanges(s, date).map(([a, b]) => [S.toHM(a), S.toHM(b)]), starts: S.freeStarts(s, date, Number(req.query.duration) || svc?.duration || 30) });
});

// ---------- Zakazlar ----------
app.get('/api/orders', auth, (req, res) => {
  let list = [...st().orders].reverse();
  if (req.query.status) list = list.filter((o) => req.query.status.split(',').includes(o.status));
  if (req.query.q) { const n = String(req.query.q).toLowerCase(); list = list.filter((o) => (o.customer.name + ' ' + o.customer.phone + ' ' + o.items.map((i) => i.name).join(' ')).toLowerCase().includes(n)); }
  res.json(list.slice(0, 300));
});
app.post('/api/orders', auth, (req, res) => {
  const r = C.createOrder({ ...req.body, source: 'manual' });
  if (!r.ok) return res.status(400).json({ error: r.error });
  res.json(r.order);
});
app.patch('/api/orders/:id', auth, (req, res) => {
  const o = st().orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Topilmadi' });
  if (['new', 'confirmed', 'delivered', 'cancelled'].includes(req.body.status)) C.setOrderStatus(o, req.body.status);
  if (req.body.notes !== undefined) o.notes = String(req.body.notes).slice(0, 500);
  store.save();
  emit('order', o);
  res.json(o);
});

// ---------- Mijozlar ----------
app.get('/api/customers', auth, (req, res) => {
  const s = st(), q = String(req.query.q || '').toLowerCase();
  let list = Object.values(s.customers);
  if (q) list = list.filter((c) => (c.name + ' ' + c.phone + ' ' + c.notes).toLowerCase().includes(q));
  list.sort((a, b) => b.lastSeen - a.lastSeen);
  res.json(list.slice(0, 300).map((c) => ({
    ...c,
    bookings: s.bookings.filter((b) => C.phoneKey(b.customer.phone) === c.key && b.status !== 'cancelled').length,
    orders: s.orders.filter((o) => C.phoneKey(o.customer.phone) === c.key && o.status !== 'cancelled').length,
  })));
});
app.get('/api/customers/:key', auth, (req, res) => {
  const s = st(), c = s.customers[req.params.key];
  if (!c) return res.status(404).json({ error: 'Topilmadi' });
  const k = c.key;
  res.json({
    ...c,
    bookings: s.bookings.filter((b) => C.phoneKey(b.customer.phone) === k).reverse(),
    orders: s.orders.filter((o) => C.phoneKey(o.customer.phone) === k).reverse(),
    conversations: Object.values(s.conversations).filter((v) => C.phoneKey(v.from) === k).sort((a, b) => b.updatedAt - a.updatedAt).map(convSummary),
    tasks: s.tasks.filter((t) => C.phoneKey(t.phone) === k).reverse(),
  });
});
app.patch('/api/customers/:key', auth, (req, res) => {
  const c = st().customers[req.params.key];
  if (!c) return res.status(404).json({ error: 'Topilmadi' });
  if (req.body.name !== undefined) c.name = String(req.body.name).slice(0, 80);
  if (req.body.notes !== undefined) c.notes = String(req.body.notes).slice(0, 1000);
  store.save();
  res.json(c);
});

// ---------- Vazifalar ----------
app.get('/api/tasks', auth, (req, res) => {
  const list = [...st().tasks].sort((a, b) => (a.done - b.done) || (b.createdAt - a.createdAt));
  res.json(list.slice(0, 300));
});
app.post('/api/tasks', auth, (req, res) => res.json(C.createTask({ type: 'callback', ...req.body })));
app.patch('/api/tasks/:id', auth, (req, res) => {
  const t = st().tasks.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topilmadi' });
  if (req.body.done !== undefined) { t.done = !!req.body.done; t.doneAt = t.done ? Date.now() : null; }
  if (req.body.result !== undefined) t.result = String(req.body.result).slice(0, 500);
  store.save();
  emit('task', t);
  res.json(t);
});

// ---------- Hisobot ----------
app.get('/api/report', auth, (req, res) => {
  const from = S.isDate(req.query.from) ? req.query.from : S.isDate(req.query.date) ? req.query.date : undefined;
  res.json(C.report(from, S.isDate(req.query.to) ? req.query.to : undefined));
});
app.get('/api/series', auth, (req, res) => res.json(C.series(Math.min(90, Math.max(7, Number(req.query.days) || 30)))));
app.post('/api/report/send', auth, wrap(async (req, res) => {
  if (!C.tgOn()) return res.status(400).json({ error: 'Telegram ulanmagan: TG_BOT_TOKEN va chat ID kerak' });
  const ok = await C.tg(C.reportText(C.report()));
  res.status(ok ? 200 : 502).json(ok ? { ok } : { error: "Telegramga yuborib bo'lmadi" });
}));
app.post('/api/telegram/test', auth, wrap(async (req, res) => {
  if (!process.env.TG_BOT_TOKEN) return res.status(400).json({ error: "Serverga TG_BOT_TOKEN qo'shilmagan" });
  if (!C.tgOn()) return res.status(400).json({ error: 'Telegram chat ID kiritilmagan' });
  const ok = await C.tg(`✅ ${st().business.name}: Kotib Telegramga ulandi. Yangi uchrashuv, zakaz, javobsiz qo'ng'iroqlar va kunlik hisobot shu yerga keladi.`);
  res.status(ok ? 200 : 502).json(ok ? { ok } : { error: "Yuborib bo'lmadi — bot tokeni va chat ID'ni tekshiring, botga /start yozing" });
}));

// ---------- Sozlamalar ----------
app.get('/api/settings', auth, (req, res) => {
  const { business, hours, services, products, faq, closedDays } = st();
  res.json({
    business, hours, services, products, faq, closedDays, ai: A.aiOn(), twilio: !!process.env.TWILIO_AUTH_TOKEN, sms: C.smsOn(),
    telegram: C.tgOn(), tgToken: !!process.env.TG_BOT_TOKEN, tgEnvChat: !!process.env.TG_CHAT_ID, operator: !!operatorPhone(),
    publicUrl: PUBLIC_URL, db: store.PG ? 'postgres' : 'file', tz: S.TZ, adminEnv: !!process.env.ADMIN_PASSWORD,
  });
});
app.put('/api/settings', auth, (req, res) => {
  const s = st(), p = req.body || {};
  if (p.business) {
    const allowed = ['name', 'about', 'address', 'phone', 'greeting', 'extra', 'slotStep', 'capacity', 'bufferMin', 'daysAhead', 'operatorPhone', 'reminders', 'reportTime', 'tgChatId', 'langs'];
    for (const k of allowed) if (p.business[k] !== undefined) s.business[k] = typeof s.business[k] === 'number' ? Math.max(0, Number(p.business[k]) || 0) : String(p.business[k]).slice(0, 4000);
    s.business.slotStep = Math.max(5, Math.round((s.business.slotStep || 30) / 5) * 5);
    s.business.capacity = Math.max(1, s.business.capacity || 1);
    if (s.business.reportTime && !S.isTime(s.business.reportTime)) s.business.reportTime = '20:00';
  }
  if (p.hours) {
    for (let d = 0; d < 7; d++) {
      const h = p.hours[d];
      if (!h) continue;
      s.hours[d] = {
        open: S.isTime(h.open) ? h.open : '09:00', close: S.isTime(h.close) ? h.close : '18:00', off: !!h.off,
        breaks: (h.breaks || []).filter((b) => S.isTime(b.from) && S.isTime(b.to) && b.from < b.to).slice(0, 5),
      };
    }
  }
  if (Array.isArray(p.services)) {
    s.services = p.services.filter((x) => String(x.name || '').trim()).slice(0, 100).map((x) => ({
      id: x.id || store.nextId('s'), name: String(x.name).trim().slice(0, 100), duration: Math.max(5, Math.min(720, Number(x.duration) || 30)),
      price: String(x.price || '').slice(0, 60), desc: String(x.desc || '').slice(0, 300),
    }));
  }
  if (Array.isArray(p.products)) {
    s.products = p.products.filter((x) => String(x.name || '').trim()).slice(0, 1000).map((x) => ({
      id: x.id || store.nextId('p'), name: String(x.name).trim().slice(0, 100), price: Math.max(0, Number(String(x.price).replace(/[^\d.]/g, '')) || 0),
      unit: String(x.unit || 'dona').slice(0, 20), stock: x.stock === '' || x.stock === null || x.stock === undefined ? null : Math.max(0, Math.floor(Number(x.stock) || 0)),
      desc: String(x.desc || '').slice(0, 300),
    }));
  }
  if (Array.isArray(p.faq)) s.faq = p.faq.filter((x) => String(x.q || '').trim() && String(x.a || '').trim()).slice(0, 200).map((x) => ({ id: x.id || store.nextId('f'), q: String(x.q).slice(0, 300), a: String(x.a).slice(0, 2000) }));
  if (Array.isArray(p.closedDays)) s.closedDays = [...new Set(p.closedDays.filter(S.isDate))].sort();
  store.save();
  emit('settings', {});
  res.json({ ok: true });
});

// ---------- Suhbatlar ----------
function conversation(id, channel, from) {
  const s = st();
  let c = s.conversations[id];
  if (!c) {
    c = s.conversations[id] = { id, channel, from: from || '', messages: [], draft: {}, customer: null, lang: null, createdAt: Date.now(), updatedAt: Date.now() };
    // Mijozni taniymiz: ismi, tili
    const cu = from ? C.touchCustomer(from, channel === 'call' ? { call: true } : { chat: true }) : null;
    if (cu) { if (cu.name) c.customer = { name: cu.name, phone: cu.phone }; if (cu.lang) c.lang = cu.lang; }
    const ids = Object.keys(s.conversations);
    if (ids.length > 2000) ids.sort((a, b) => s.conversations[a].updatedAt - s.conversations[b].updatedAt).slice(0, ids.length - 2000).forEach((k) => delete s.conversations[k]);
    store.save();
  }
  return c;
}
const convSummary = (c) => ({
  id: c.id, channel: c.channel, from: c.from, customer: c.customer, lang: c.lang, createdAt: c.createdAt, updatedAt: c.updatedAt,
  count: c.messages.filter((m) => m.role === 'user').length, last: c.messages[c.messages.length - 1]?.content?.slice(0, 120) || '', call: c.call || null, handoff: !!c.handoff,
});
const operatorPhone = () => st().business.operatorPhone || process.env.OPERATOR_PHONE || '';

async function talk(conv, text) {
  const r = await A.respond(st(), conv, text, { createBooking: C.createBooking, createOrder: C.createOrder, history: C.customerHistory });
  if (conv.from && r.lang) C.touchCustomer(conv.from, { lang: r.lang, name: conv.customer?.name });
  const who = conv.customer?.name || '';
  // Telefonda operatorga ulash alohida bajariladi; boshqa kanallarda — vazifa yaratamiz
  if (r.handoff && conv.channel !== 'call') {
    conv.handoff = true;
    C.createTask({ type: 'handoff', phone: conv.from, name: who, reason: `Inson bilan gaplashmoqchi (${C.SRC[conv.channel] || conv.channel}): "${text.slice(0, 150)}"`, conversationId: conv.id });
    if (!conv.from) r.reply += A.L(r.lang, " Iltimos, telefon raqamingizni qoldiring — xodimimiz siz bilan bog'lanadi.", ' Оставьте, пожалуйста, номер телефона — сотрудник свяжется с вами.');
    else r.reply += A.L(r.lang, " Xodimimiz tez orada siz bilan bog'lanadi.", ' Сотрудник скоро свяжется с вами.');
    conv.messages[conv.messages.length - 1].content = r.reply;
  }
  if (r.callback && conv.channel !== 'test') C.createTask({ type: 'callback', phone: conv.from, name: who, reason: r.callback, conversationId: conv.id });
  store.save();
  emit('conversation', { id: conv.id });
  return r;
}

app.get('/api/conversations', auth, (req, res) => {
  let list = Object.values(st().conversations);
  if (req.query.channel) list = list.filter((c) => c.channel === req.query.channel);
  res.json(list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 300).map(convSummary));
});
app.get('/api/conversations/:id', auth, (req, res) => {
  const c = st().conversations[req.params.id];
  if (!c) return res.status(404).json({ error: 'Topilmadi' });
  res.json(c);
});

// Mijoz chati (sayt / ilovadagi sinov). Oddiy cheklov: IP bo'yicha daqiqasiga 20 xabar.
const chatHits = new Map();
app.get('/api/public', (req, res) => res.json({ name: st().business.name, greeting: A.greeting(st(), req.query.lang), phone: st().business.phone }));
app.post('/api/chat', wrap(async (req, res) => {
  const now = Date.now(), hits = (chatHits.get(req.ip) || []).filter((t) => now - t < 60e3);
  if (hits.length >= 20) return res.status(429).json({ error: 'Juda tez yozyapsiz, biroz kuting' });
  hits.push(now); chatHits.set(req.ip, hits);
  const sid = String(req.body.session || '').replace(/[^\w-]/g, '').slice(0, 40);
  const text = String(req.body.text || '').trim().slice(0, 2000);
  if (!sid || !text) return res.status(400).json({ error: "Xabar bo'sh" });
  const test = req.body.test && validToken((req.headers.authorization || '').replace(/^Bearer\s+/, ''));
  const conv = conversation((test ? 'test:' : 'web:') + sid, test ? 'test' : 'web', test ? String(req.body.from || '') : '');
  // Sayt mijozi telefon raqamini yozsa — uni eslab qolamiz
  if (!conv.from) { const ph = String(text).replace(/[^\d+]/g, ''); if (ph.replace(/\D/g, '').length >= 9 && ph.replace(/\D/g, '').length <= 15) { conv.from = ph; C.touchCustomer(ph, { chat: true }); } }
  const r = await talk(conv, text);
  res.json({ reply: r.reply, booking: r.booking ? { date: r.booking.date, start: r.booking.start, service: r.booking.serviceName } : null, order: r.order ? { total: r.order.total, items: r.order.items.length } : null, handoff: r.handoff, via: r.via });
}));

// ---------- Twilio: telefon qo'ng'iroqlari va SMS ----------
const VOICES = {
  // Twilio'da o'zbekcha ovoz yo'q: standart holatda turkcha ovoz o'zbek lotin matnini o'qiydi. CALL_VOICE_UZ bilan almashtiring.
  uz: { voice: process.env.CALL_VOICE_UZ || 'Polly.Filiz', lang: process.env.CALL_VOICE_LANG_UZ || 'tr-TR', stt: process.env.CALL_STT_UZ || 'uz-UZ' },
  ru: { voice: process.env.CALL_VOICE_RU || 'Polly.Tatyana', lang: process.env.CALL_VOICE_LANG_RU || 'ru-RU', stt: process.env.CALL_STT_RU || 'ru-RU' },
};
const xml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const say = (t, lang = 'uz') => { const v = VOICES[lang] || VOICES.uz; return `<Say voice="${xml(v.voice)}" language="${xml(v.lang)}">${xml(String(t).replace(/[*_#`]/g, ''))}</Say>`; };
const gather = (inner, lang = 'uz', q = '', input = 'speech') => `<Gather input="${input}" language="${xml((VOICES[lang] || VOICES.uz).stt)}" speechTimeout="auto" timeout="7"${input.includes('dtmf') ? ' numDigits="1"' : ''} action="/twilio/voice/turn${q}" method="POST">${inner}</Gather>`;
const twiml = (res, body) => res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`);
const langsOn = () => String(st().business.langs || 'uz,ru').split(/[,\s]+/).filter((l) => VOICES[l]);

// Twilio imzosini tekshirish (TWILIO_AUTH_TOKEN va PUBLIC_URL berilgan bo'lsa)
function twilioCheck(req, res, next) {
  const tok = process.env.TWILIO_AUTH_TOKEN;
  if (!tok || !PUBLIC_URL) return next();
  const data = Object.keys(req.body || {}).sort().reduce((a, k) => a + k + req.body[k], PUBLIC_URL + req.originalUrl);
  const sig = crypto.createHmac('sha1', tok).update(data).digest('base64');
  const got = String(req.headers['x-twilio-signature'] || '');
  if (got.length === sig.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(sig))) return next();
  res.status(403).send('Bad signature');
}
const callConv = (req) => conversation('call:' + (req.body.CallSid || 'x'), 'call', req.body.From);
const logBot = (conv, text) => { conv.messages.push({ role: 'assistant', content: text, at: Date.now() }); conv.updatedAt = Date.now(); store.save(); emit('conversation', { id: conv.id }); };

app.post('/twilio/voice', twilioCheck, (req, res) => {
  const conv = callConv(req);
  const langs = langsOn();
  if (!conv.lang && langs.length === 1) conv.lang = langs[0];
  const name = conv.customer?.name;
  if (conv.lang) {
    // Tanish mijoz yoki bitta til — darhol suhbat
    const hello = A.greeting(st(), conv.lang) + (name ? A.L(conv.lang, ` ${name}, sizni yana eshitganimdan xursandman.`, ` ${name}, рады снова вас слышать.`) : '');
    logBot(conv, hello);
    return twiml(res, gather(say(hello, conv.lang), conv.lang) + say(A.L(conv.lang, "Sizni eshitmadim. Keyinroq qayta qo'ng'iroq qiling. Xayr!", 'Вас не слышно. Перезвоните, пожалуйста, позже. До свидания!'), conv.lang));
  }
  // Til tanlash: 1 — o'zbekcha (yoki shunchaki gapirish), 2 — ruscha
  const hello = A.greeting(st(), 'uz');
  logBot(conv, hello + ' / Для русского языка нажмите 2.');
  twiml(res, gather(say(hello, 'uz') + say("O'zbek tili uchun gapiring yoki 1 ni bosing.", 'uz') + say('Для русского языка нажмите 2.', 'ru'), 'uz', '?menu=1', 'dtmf speech') + say('Xayr! До свидания!', 'uz'));
});

app.post('/twilio/voice/turn', twilioCheck, wrap(async (req, res) => {
  const conv = callConv(req);
  const digits = String(req.body.Digits || '');
  let text = String(req.body.SpeechResult || '').trim();
  const n = Number(req.query.n) || 0;
  if (req.query.menu && digits) {
    conv.lang = digits === '2' ? 'ru' : 'uz';
    if (conv.from) C.touchCustomer(conv.from, { lang: conv.lang });
    const ask = A.L(conv.lang, 'Eshitaman, gapiring.', 'Слушаю вас, говорите.');
    logBot(conv, ask);
    return twiml(res, gather(say(ask, conv.lang), conv.lang) + say(A.L(conv.lang, 'Xayr!', 'До свидания!'), conv.lang));
  }
  if (req.query.menu && !conv.lang) conv.lang = A.detectLang(text) || 'uz';
  const lang = conv.lang || 'uz';
  if (!text) {
    if (n >= 2) return twiml(res, say(A.L(lang, "Aloqa yomon shekilli. Keyinroq qayta qo'ng'iroq qiling. Xayr!", 'Плохо слышно. Перезвоните позже. До свидания!'), lang) + '<Hangup/>');
    return twiml(res, gather(say(A.L(lang, 'Eshitmadim, qaytadan ayting.', 'Не расслышал, повторите, пожалуйста.'), lang), lang, `?n=${n + 1}`) + say(A.L(lang, 'Xayr!', 'До свидания!'), lang));
  }
  if (/^(xayr|rahmat,? xayr|hammasi|boshqa savol yo'q|до свидания|пока|спасибо,? до свидания|всё|все)\.?$/i.test(text)) {
    conv.messages.push({ role: 'user', content: text, at: Date.now() }); store.save();
    return twiml(res, say(A.L(lang, "Qo'ng'irog'ingiz uchun rahmat! Xayr!", 'Спасибо за звонок! До свидания!'), lang) + '<Hangup/>');
  }
  const r = await talk(conv, text);
  const l = r.lang || lang;
  if (r.handoff) {
    conv.handoff = true;
    const op = operatorPhone();
    if (op) {
      // Operatorga ulaymiz; javob bermasa /twilio/dial-done vazifa yaratadi
      const callerId = req.body.To ? ` callerId="${xml(req.body.To)}"` : '';
      return twiml(res, say(r.reply, l) + `<Dial timeout="25" action="/twilio/dial-done" method="POST"${callerId}>${xml(op)}</Dial>`);
    }
    C.createTask({ type: 'handoff', phone: conv.from, name: conv.customer?.name, reason: `Qo'ng'iroqda inson bilan gaplashmoqchi: "${text.slice(0, 150)}"`, conversationId: conv.id });
    const msg = A.L(l, "Hozir xodimlarimiz band. Sizga tez orada qayta qo'ng'iroq qilamiz. Yana savolingiz bormi?", 'Сейчас все сотрудники заняты. Мы скоро вам перезвоним. Есть ещё вопросы?');
    logBot(conv, msg);
    return twiml(res, gather(say(r.reply, l) + say(msg, l), l) + say(A.L(l, 'Rahmat, xayr!', 'Спасибо, до свидания!'), l));
  }
  const more = r.booking || r.order ? say(A.L(l, 'Yana savolingiz bormi?', 'Есть ещё вопросы?'), l) : '';
  twiml(res, gather(say(r.reply, l) + more, l) + say(A.L(l, 'Rahmat, xayr!', 'Спасибо, до свидания!'), l));
}));

// Operatorga ulanish natijasi
app.post('/twilio/dial-done', twilioCheck, (req, res) => {
  const conv = callConv(req), l = conv.lang || 'uz';
  const status = String(req.body.DialCallStatus || '');
  if (status === 'completed' || status === 'answered') { conv.operator = 'connected'; store.save(); return twiml(res, '<Hangup/>'); }
  conv.operator = status || 'failed';
  C.createTask({ type: 'handoff', phone: conv.from, name: conv.customer?.name, reason: `Operatorga ulanib bo'lmadi (${status || 'javob yo‘q'}) — mijoz inson bilan gaplashmoqchi edi`, conversationId: conv.id });
  const msg = A.L(l, "Kechirasiz, operator hozir band. Sizga tez orada qayta qo'ng'iroq qilamiz. Yana savolingiz bormi?", 'Извините, оператор сейчас занят. Мы скоро вам перезвоним. Есть ещё вопросы?');
  logBot(conv, msg);
  twiml(res, gather(say(msg, l), l) + say(A.L(l, 'Xayr!', 'До свидания!'), l));
});

// Qo'ng'iroq holati (Twilio: "Call status changes" webhook) — tarix va javobsiz qo'ng'iroqlar
app.post('/twilio/status', twilioCheck, (req, res) => {
  const status = String(req.body.CallStatus || '');
  if (!['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(status)) return res.sendStatus(204);
  const conv = callConv(req);
  conv.call = { status, duration: Number(req.body.CallDuration) || 0, endedAt: Date.now() };
  const spoke = conv.messages.some((m) => m.role === 'user');
  if (status !== 'completed' || !spoke) {
    const reason = status === 'completed' ? `Mijoz gapirmasdan qo'ng'iroqni tugatdi (${conv.call.duration} s)` : `Qo'ng'iroq javobsiz qoldi (${status})`;
    C.createTask({ type: 'missed', phone: conv.from, name: conv.customer?.name, reason, conversationId: conv.id });
  }
  conv.updatedAt = Date.now();
  store.save();
  emit('conversation', { id: conv.id });
  res.sendStatus(204);
});

app.post('/twilio/sms', twilioCheck, wrap(async (req, res) => {
  const from = String(req.body.From || '');
  const id = 'sms:' + from;
  const old = st().conversations[id];
  if (old && Date.now() - old.updatedAt > 6 * 3600e3) { old.messages = []; old.draft = {}; } // 6 soatdan keyin yangi suhbat
  const conv = conversation(id, from.startsWith('whatsapp:') ? 'whatsapp' : 'sms', from.replace(/^whatsapp:/, ''));
  const r = await talk(conv, String(req.body.Body || ''));
  twiml(res, `<Message>${xml(r.reply)}</Message>`);
}));

// ---------- Statik fayllar ----------
app.get('/api/health', (req, res) => res.json({ ok: true, db: store.PG ? 'postgres' : 'file', ai: A.aiOn(), twilio: !!process.env.TWILIO_AUTH_TOKEN, telegram: C.tgOn() }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], setHeaders: (res, p) => { if (/\.(html|js|css|webmanifest)$/.test(p)) res.set('Cache-Control', 'no-cache'); } }));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/twilio/voice')) return twiml(res, say("Kechirasiz, texnik nosozlik. Birozdan keyin qayta qo'ng'iroq qiling.") + '<Hangup/>');
  res.status(500).json({ error: 'Server xatosi' });
});

const PORT = Number(process.env.PORT) || 3100;
store.load().then(() => {
  C.startScheduler();
  const server = app.listen(PORT, () => console.log(`Kotib ishga tushdi: http://localhost:${PORT} (ma'lumotlar: ${store.PG ? 'PostgreSQL' : 'fayl'}, AI: ${A.aiOn() ? 'yoqilgan' : "yo'q — qoidalar asosida"}, Telegram: ${C.tgOn() ? 'ulangan' : "yo'q"})`));
  const stop = () => { store.flush().finally(() => server.close(() => process.exit(0))); setTimeout(() => process.exit(0), 3000).unref(); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}).catch((e) => { console.error("Ma'lumotlarni yuklab bo'lmadi:", e); process.exit(1); });
