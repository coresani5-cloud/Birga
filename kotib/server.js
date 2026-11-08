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
const V = require('./voice');
const CFG = require('./config');
const { env } = CFG;
const TG = require('./telegram');

const app = express();
app.set('trust proxy', true);
app.use((req, res, next) => (['/api/media/greeting', '/api/voice/clone', '/api/chat/voice'].includes(req.path) ? next() : express.json({ limit: '1mb' })(req, res, next)));
app.use(express.urlencoded({ extended: false }));

const st = () => store.get();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Kirish, ro'yxatdan o'tish, obuna va admin panel (SaaS) ----------
const SA = require('./saas');
const { auth, adminAuth: SA_admin, validToken, withTenant } = SA.mount(app, { C, onTenantCreated: () => prewarm() });

// ---------- Jonli yangilanish (SSE) ----------
const clients = new Set(); // { res, tid }
function emit(type, data) {
  const tid = store.tenantId();
  const msg = `event: ${type}\ndata: ${JSON.stringify(data || {})}\n\n`;
  for (const c of clients) if (c.tid === tid) c.res.write(msg);
}
C.setEmit(emit);
app.get('/api/events', auth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  const c = { res, tid: req.tenantId };
  clients.add(c);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(c); });
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
  if (!env("TG_BOT_TOKEN")) return res.status(400).json({ error: "Serverga TG_BOT_TOKEN qo'shilmagan" });
  if (!C.tgOn()) return res.status(400).json({ error: 'Telegram chat ID kiritilmagan' });
  const ok = await C.tg(`✅ ${st().business.name}: Kotib Telegramga ulandi. Yangi uchrashuv, zakaz, javobsiz qo'ng'iroqlar va kunlik hisobot shu yerga keladi.`);
  res.status(ok ? 200 : 502).json(ok ? { ok } : { error: "Yuborib bo'lmadi — bot tokeni va chat ID'ni tekshiring, botga /start yozing" });
}));

// ---------- Sozlamalar ----------
app.get('/api/settings', auth, (req, res) => {
  const { business, hours, services, products, faq, closedDays } = st();
  res.json({
    business, hours, services, products, faq, closedDays, ai: A.aiOn(), twilio: !!env("TWILIO_AUTH_TOKEN"), sms: C.smsOn(),
    telegram: C.tgOn(), tgToken: !!env("TG_BOT_TOKEN"), tgEnvChat: false, operator: !!operatorPhone(),
    publicUrl: CFG.publicUrl(), tenantId: req.tenantId, chatUrl: `${CFG.publicUrl() || baseUrl(req)}/c/${req.tenantId}`, subscription: SA.status(), ownTwilio: CFG.ownTwilio(), voice: V.status(), kotibNumber: st().business.kotibNumber || '', uzNumber: st().business.uzNumber || '', kotibUz: store.platform().tenants[req.tenantId]?.kotibUz || '', forwardTo: store.platform().tenants[req.tenantId]?.kotibUz || store.platform().sharedNumber || '', sipDomain: store.platform().sipDomain || '', tgBot: st().meta?.tgBot || '', greetingAudio: !!st().media?.greeting, db: store.PG ? 'postgres' : 'file', tz: S.TZ, support: store.platform().support || '',
  });
});
app.put('/api/settings', auth, (req, res) => {
  setTimeout(prewarm, 500);
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
const operatorPhone = () => st().business.operatorPhone || '';

const PAUSED = { uz: "Kechirasiz, onlayn kotib vaqtincha ishlamayapti. Iltimos, to'g'ridan-to'g'ri qo'ng'iroq qiling", ru: 'Извините, онлайн-секретарь временно не работает. Пожалуйста, позвоните напрямую' };
async function talk(conv, text) {
  if (!SA.active()) {
    const lang = conv.lang || A.detectLang(text) || 'uz', ph = st().business.phone;
    conv.messages.push({ role: 'user', content: String(text).slice(0, 2000), at: Date.now() });
    const reply = PAUSED[lang] + (ph ? `: ${ph}.` : '.');
    conv.messages.push({ role: 'assistant', content: reply, at: Date.now() });
    conv.updatedAt = Date.now(); store.save();
    return { reply, lang, paused: true };
  }
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
app.get('/api/public', withTenant((req) => req.query.t || req.body?.t), (req, res) => res.json({ name: st().business.name, greeting: A.greeting(st(), req.query.lang), phone: st().business.phone }));
app.post('/api/chat', withTenant((req) => req.query.t || req.body?.t), wrap(async (req, res) => {
  const now = Date.now(), hits = (chatHits.get(req.ip) || []).filter((t) => now - t < 60e3);
  if (hits.length >= 20) return res.status(429).json({ error: 'Juda tez yozyapsiz, biroz kuting' });
  hits.push(now); chatHits.set(req.ip, hits);
  const sid = String(req.body.session || '').replace(/[^\w-]/g, '').slice(0, 40);
  const text = String(req.body.text || '').trim().slice(0, 2000);
  if (!sid || !text) return res.status(400).json({ error: "Xabar bo'sh" });
  const test = req.body.test && validToken((req.headers.authorization || '').replace(/^Bearer\s+/, '')) === req.tenantId;
  const conv = conversation((test ? 'test:' : 'web:') + sid, test ? 'test' : 'web', test ? String(req.body.from || '') : '');
  // Sayt mijozi telefon raqamini yozsa — uni eslab qolamiz
  if (!conv.from) { const ph = String(text).replace(/[^\d+]/g, ''); if (ph.replace(/\D/g, '').length >= 9 && ph.replace(/\D/g, '').length <= 15) { conv.from = ph; C.touchCustomer(ph, { chat: true }); } }
  const r = await talk(conv, text);
  res.json({ reply: r.reply, booking: r.booking ? { date: r.booking.date, start: r.booking.start, service: r.booking.serviceName } : null, order: r.order ? { total: r.order.total, items: r.order.items.length } : null, handoff: r.handoff, via: r.via });
}));

// ---------- Twilio: telefon qo'ng'iroqlari va SMS ----------
const VOICES = {
  // Tashqi o'zbekcha ovoz (Aisha / Muxlisa / Azure) ulanmagan bo'lsa — Twilio ovozi ishlatiladi (o'zbekcha ovozi yo'q, turkcha o'qiydi)
  uz: { voice: process.env.CALL_VOICE_UZ || 'Polly.Filiz', lang: process.env.CALL_VOICE_LANG_UZ || 'tr-TR', stt: process.env.CALL_STT_UZ || 'uz-UZ' },
  ru: { voice: process.env.CALL_VOICE_RU || 'Polly.Tatyana', lang: process.env.CALL_VOICE_LANG_RU || 'ru-RU', stt: process.env.CALL_STT_RU || 'ru-RU' },
};
const xml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const say = (t, lang = 'uz') => { const v = VOICES[lang] || VOICES.uz; return `<Say voice="${xml(v.voice)}" language="${xml(v.lang)}">${xml(String(t).replace(/[*_#`]/g, ''))}</Say>`; };
const baseUrl = (req) => CFG.publicUrl() || `${req.protocol}://${req.get('host')}`;
// Gapirish: o'zbekcha ovoz ulangan bo'lsa — tayyor audio (<Play>), aks holda Twilio ovozi (<Say>)
async function speak(req, text, lang = 'uz') {
  if (V.ttsOn(lang)) {
    const name = await V.tts(text, lang, 6000);
    if (name) return `<Play>${xml(baseUrl(req))}/tts/${name}</Play>`;
  }
  return say(text, lang);
}
// Tinglash: o'zbekcha STT ulangan bo'lsa — yozib olib Aisha/Muxlisa'ga beramiz, aks holda Twilio'ning o'zi taniydi
function listen(inner, lang = 'uz', q = '', input = 'speech') {
  if (input === 'speech' && V.sttOn(lang)) return `${inner}<Record action="${tp('/twilio/voice/rec')}${q}" method="POST" maxLength="30" timeout="3" playBeep="false" trim="trim-silence"/>`;
  return `<Gather input="${input}" language="${xml((VOICES[lang] || VOICES.uz).stt)}" speechTimeout="auto" timeout="7"${input.includes('dtmf') ? ' numDigits="1"' : ''} action="${tp('/twilio/voice/turn')}${q}" method="POST">${inner}</Gather>`;
}
const tp = (p) => `/t/${store.tenantId()}${p}`; // biznes manzili
const tw = express.Router({ mergeParams: true });
app.use('/t/:tid', withTenant((req) => req.params.tid), tw);
const twiml = (res, body) => res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`);
const langsOn = () => String(st().business.langs || 'uz,ru').split(/[,\s]+/).filter((l) => VOICES[l]);
const greetingAudio = (req) => (st().media?.greeting ? `<Play>${xml(baseUrl(req))}/media/greeting?t=${store.tenantId()}&amp;v=${st().media.greeting.at}</Play>` : '');

// Twilio imzosini tekshirish (TWILIO_AUTH_TOKEN va PUBLIC_URL berilgan bo'lsa)
function twilioCheck(req, res, next) {
  const tok = env("TWILIO_AUTH_TOKEN"), pub = CFG.publicUrl();
  if (!tok || !pub) return next();
  const data = Object.keys(req.body || {}).sort().reduce((a, k) => a + k + req.body[k], pub + req.originalUrl);
  const sig = crypto.createHmac('sha1', tok).update(data).digest('base64');
  const got = String(req.headers['x-twilio-signature'] || '');
  if (got.length === sig.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(sig))) return next();
  res.status(403).send('Bad signature');
}
// O'zbek raqamlari GSM shlyuz / SIP orqali keladi: From = "sip:+998901234567@1.2.3.4:5060"
const isSip = (req) => /^sip:/i.test(String(req.body.From || ''));
const sipHost = (req) => (/@([^;>]+)/.exec(String(req.body.From || '')) || [])[1] || '';
function phoneOf(v) {
  const user = /^sips?:([^@;]+)/i.exec(String(v || ''));
  const d = String(user ? user[1] : v || '').replace(/\D/g, '');
  if (!d) return String(v || '');
  return '+' + (d.length === 9 ? '998' + d : d);
}
// Operatorga ulash: SIP qo'ng'iroqda — o'sha shlyuz (SIM) orqali, mahalliy tarifda
function dialTarget(req, number) {
  if (isSip(req) && sipHost(req)) return `<Sip>sip:${xml(String(number).replace(/\D/g, ''))}@${xml(sipHost(req))}</Sip>`;
  return xml(number);
}
const dialCallerId = (req) => (!isSip(req) && req.body.To ? ` callerId="${xml(req.body.To)}"` : '');
const callConv = (req) => conversation('call:' + (req.body.CallSid || 'x'), 'call', phoneOf(req.body.From));
const logBot = (conv, text) => { conv.messages.push({ role: 'assistant', content: text, at: Date.now() }); conv.updatedAt = Date.now(); store.save(); emit('conversation', { id: conv.id }); };
const BYE = { uz: 'Rahmat, xayr!', ru: 'Спасибо, до свидания!' };

tw.post('/twilio/voice', twilioCheck, wrap(async (req, res) => {
  const conv = callConv(req);
  // Obuna tugagan: qo'ng'iroq egasining o'z raqamiga o'tadi (mijoz yo'qolmaydi)
  if (!SA.active()) {
    const op = operatorPhone();
    logBot(conv, '⛔ Obuna tugagan — qo\'ng\'iroq egasiga yo\'naltirildi');
    return twiml(res, op ? `<Dial timeout="30"${dialCallerId(req)}>${dialTarget(req, op)}</Dial>` : say("Kechirasiz, hozir javob bera olmaymiz. Keyinroq qo'ng'iroq qiling.") + '<Hangup/>');
  }
  const langs = langsOn();
  if (!conv.lang && langs.length === 1) conv.lang = langs[0];
  const name = conv.customer?.name;
  const rec = greetingAudio(req);
  if (conv.lang) {
    // Tanish mijoz yoki bitta til — darhol suhbat
    const welcome = name ? A.L(conv.lang, `${name}, sizni yana eshitganimdan xursandman.`, `${name}, рады снова вас слышать.`) : '';
    const hello = rec && conv.lang === 'uz' ? welcome : (A.greeting(st(), conv.lang) + (welcome ? ' ' + welcome : ''));
    logBot(conv, (rec && conv.lang === 'uz' ? '🔊 [Salomlashish yozuvi] ' : '') + hello);
    const intro = (conv.lang === 'uz' ? rec : '') + (hello ? await speak(req, hello, conv.lang) : '');
    return twiml(res, listen(intro, conv.lang) + await speak(req, A.L(conv.lang, "Sizni eshitmadim. Keyinroq qayta qo'ng'iroq qiling. Xayr!", 'Вас не слышно. Перезвоните, пожалуйста, позже. До свидания!'), conv.lang));
  }
  // Til tanlash: 1 — o'zbekcha (yoki shunchaki gapirish), 2 — ruscha
  const hello = A.greeting(st(), 'uz');
  logBot(conv, (rec ? '🔊 [Salomlashish yozuvi] ' : hello + ' ') + "O'zbek tili uchun gapiring yoki birni bosing. / Для русского языка нажмите 2.");
  const intro = (rec || await speak(req, hello, 'uz')) + await speak(req, "O'zbek tili uchun gapiring yoki birni bosing.", 'uz') + say('Для русского языка нажмите 2.', 'ru');
  twiml(res, listen(intro, 'uz', '?menu=1', 'dtmf speech') + await speak(req, 'Xayr!', 'uz'));
}));

// Mijoz gapini qayta ishlash (Twilio tanigan matn yoki yozuvdan olingan matn)
async function handleSpeech(req, res, conv, text) {
  const n = Number(req.query.n) || 0;
  const lang = conv.lang || 'uz';
  if (!text) {
    if (n >= 2) return twiml(res, await speak(req, A.L(lang, "Aloqa yomon shekilli. Keyinroq qayta qo'ng'iroq qiling. Xayr!", 'Плохо слышно. Перезвоните позже. До свидания!'), lang) + '<Hangup/>');
    return twiml(res, listen(await speak(req, A.L(lang, 'Eshitmadim, qaytadan ayting.', 'Не расслышал, повторите, пожалуйста.'), lang), lang, `?n=${n + 1}`) + await speak(req, A.L(lang, 'Xayr!', 'До свидания!'), lang));
  }
  if (/^(xayr|rahmat,? xayr|hammasi|boshqa savol yo'q|до свидания|пока|спасибо,? до свидания|всё|все)[.!]?$/i.test(text.trim())) {
    conv.messages.push({ role: 'user', content: text, at: Date.now() }); store.save();
    return twiml(res, await speak(req, A.L(lang, "Qo'ng'irog'ingiz uchun rahmat! Xayr!", 'Спасибо за звонок! До свидания!'), lang) + '<Hangup/>');
  }
  const r = await talk(conv, text);
  const l = r.lang || lang;
  if (r.handoff) {
    conv.handoff = true;
    const op = operatorPhone();
    if (op) {
      // Operatorga ulaymiz; javob bermasa /twilio/dial-done vazifa yaratadi
      return twiml(res, await speak(req, r.reply, l) + `<Dial timeout="25" action="${tp('/twilio/dial-done')}" method="POST"${dialCallerId(req)}>${dialTarget(req, op)}</Dial>`);
    }
    C.createTask({ type: 'handoff', phone: conv.from, name: conv.customer?.name, reason: `Qo'ng'iroqda inson bilan gaplashmoqchi: "${text.slice(0, 150)}"`, conversationId: conv.id });
    const msg = A.L(l, "Hozir xodimlarimiz band. Sizga tez orada qayta qo'ng'iroq qilamiz. Yana savolingiz bormi?", 'Сейчас все сотрудники заняты. Мы скоро вам перезвоним. Есть ещё вопросы?');
    logBot(conv, msg);
    return twiml(res, listen(await speak(req, r.reply + ' ' + msg, l), l) + await speak(req, BYE[l] || BYE.uz, l));
  }
  const more = r.booking || r.order ? ' ' + A.L(l, 'Yana savolingiz bormi?', 'Есть ещё вопросы?') : '';
  twiml(res, listen(await speak(req, r.reply + more, l), l) + await speak(req, BYE[l] || BYE.uz, l));
}

tw.post('/twilio/voice/turn', twilioCheck, wrap(async (req, res) => {
  const conv = callConv(req);
  const digits = String(req.body.Digits || '');
  const text = String(req.body.SpeechResult || '').trim();
  if (req.query.menu && digits) {
    conv.lang = digits === '2' ? 'ru' : 'uz';
    if (conv.from) C.touchCustomer(conv.from, { lang: conv.lang });
    const ask = A.L(conv.lang, 'Eshitaman, gapiring.', 'Слушаю вас, говорите.');
    logBot(conv, ask);
    return twiml(res, listen(await speak(req, ask, conv.lang), conv.lang) + await speak(req, A.L(conv.lang, 'Xayr!', 'До свидания!'), conv.lang));
  }
  if (req.query.menu && !conv.lang) conv.lang = A.detectLang(text) || 'uz';
  await handleSpeech(req, res, conv, text);
}));

// Yozib olingan gap (o'zbekcha STT: Aisha / Muxlisa)
tw.post('/twilio/voice/rec', twilioCheck, wrap(async (req, res) => {
  const conv = callConv(req);
  const url = String(req.body.RecordingUrl || '');
  let text = '';
  if (url && Number(req.body.RecordingDuration || 0) >= 1) {
    try { text = await V.stt(await V.twilioRecording(url), conv.lang || 'uz', 8000); } catch (e) { console.error('STT:', e.message); }
    V.deleteRecording(url);
  }
  await handleSpeech(req, res, conv, text);
}));

// Operatorga ulanish natijasi
tw.post('/twilio/dial-done', twilioCheck, wrap(async (req, res) => {
  const conv = callConv(req), l = conv.lang || 'uz';
  const status = String(req.body.DialCallStatus || '');
  if (status === 'completed' || status === 'answered') { conv.operator = 'connected'; store.save(); return twiml(res, '<Hangup/>'); }
  conv.operator = status || 'failed';
  C.createTask({ type: 'handoff', phone: conv.from, name: conv.customer?.name, reason: `Operatorga ulanib bo'lmadi (${status || 'javob yo‘q'}) — mijoz inson bilan gaplashmoqchi edi`, conversationId: conv.id });
  const msg = A.L(l, "Kechirasiz, operator hozir band. Sizga tez orada qayta qo'ng'iroq qilamiz. Yana savolingiz bormi?", 'Извините, оператор сейчас занят. Мы скоро вам перезвоним. Есть ещё вопросы?');
  logBot(conv, msg);
  twiml(res, listen(await speak(req, msg, l), l) + await speak(req, A.L(l, 'Xayr!', 'До свидания!'), l));
}));

// Qo'ng'iroq holati (Twilio: "Call status changes" webhook) — tarix va javobsiz qo'ng'iroqlar
function callStatus(req, res) {
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
}
tw.post('/twilio/status', twilioCheck, callStatus);

// ---------- O'zbek raqamlari (SIP): GSM shlyuz yoki mahalliy SIP provayder → Twilio SIP Domain → shu yer ----------
// Chaqirilgan raqam (To) qaysi biznesning "ishxona raqami" ekaniga qarab qo'ng'iroq o'sha biznes kotibiga yo'naltiriladi.
const digits9 = (v) => String(v || '').replace(/\D/g, '').slice(-9);
// Yo'naltirilgan qo'ng'iroqda asl chaqirilgan raqam (biznesning o'z raqami): Twilio ForwardedFrom
// yoki SIP Diversion sarlavhasi (provayder uzatsa). Shunda bitta umumiy kotib raqami barcha bizneslarga xizmat qiladi.
function forwardedFrom(req) {
  const b = req.body || {};
  const cands = [b.ForwardedFrom, b['SipHeader_Diversion'], b['SipHeader_X-Diversion'], b['SipHeader_X-Original-To'], b['SipHeader_X-Forwarded-From'], b.CalledVia];
  for (const c of cands) {
    if (!c) continue;
    const m = /(?:sips?:|tel:)?\+?(\d{9,15})/.exec(String(c));
    if (m) return m[1];
  }
  return '';
}
function tenantBySip(req) {
  const tenants = Object.values(store.platform().tenants).filter((x) => !x.blocked && store.has(x.id));
  // 1) Asl raqam bo'yicha: mijoz biznesning o'z (eski) raqamiga qo'ng'iroq qilgan, operator yo'naltirgan
  const orig = digits9(forwardedFrom(req));
  if (orig.length === 9) {
    const t = tenants.find((x) => digits9(x.uzNumber) === orig);
    if (t) return t.id;
  }
  // 2) Chaqirilgan raqam bo'yicha: biznesga alohida biriktirilgan kotib raqami yoki shlyuzdagi o'z raqami
  const called = digits9(phoneOf(req.body.To));
  if (called.length < 9) return null;
  const t = tenants.find((x) => digits9(x.uzNumber) === called || digits9(x.kotibUz) === called);
  return t ? t.id : null;
}
app.post('/sip/voice', twilioCheck, (req, res) => {
  const tid = tenantBySip(req);
  if (!tid) return twiml(res, say("Kechirasiz, bu raqam hali kotibga ulanmagan.") + '<Hangup/>');
  // Biznesning o'z manziliga yo'naltiramiz — keyingi hammasi oddiy qo'ng'iroq kabi ishlaydi
  twiml(res, `<Redirect method="POST">${xml(baseUrl(req))}/t/${tid}/twilio/voice</Redirect>`);
});
app.post('/sip/status', twilioCheck, (req, res) => {
  const tid = tenantBySip(req);
  if (!tid) return res.sendStatus(204);
  store.run(tid, () => callStatus(req, res));
});

// Biznes o'z ishxona raqamini (O'zbekiston) kiritadi
app.put('/api/phone/uz', auth, (req, res) => {
  const raw = String(req.body.number || '').trim();
  const d = raw.replace(/\D/g, '');
  const t = store.platform().tenants[req.tenantId];
  if (!raw) { t.uzNumber = ''; st().business.uzNumber = ''; store.savePlatform(); store.save(); return res.json({ ok: true, number: '' }); }
  const full = d.length === 9 ? '998' + d : d;
  if (!/^998\d{9}$/.test(full)) return res.status(400).json({ error: "O'zbekiston raqamini kiriting: +998 XX XXX XX XX" });
  const busy = Object.values(store.platform().tenants).find((x) => (x.id !== req.tenantId && digits9(x.uzNumber) === full.slice(-9)) || digits9(x.kotibUz) === full.slice(-9));
  if (busy) return res.status(400).json({ error: "Bu raqam boshqa biznesga ulangan. Yordam xizmatiga murojaat qiling" });
  t.uzNumber = '+' + full; st().business.uzNumber = '+' + full;
  store.savePlatform(); store.save();
  res.json({ ok: true, number: '+' + full });
});

tw.post('/twilio/sms', twilioCheck, wrap(async (req, res) => {
  const from = String(req.body.From || '');
  const id = 'sms:' + from;
  const old = st().conversations[id];
  if (old && Date.now() - old.updatedAt > 6 * 3600e3) { old.messages = []; old.draft = {}; } // 6 soatdan keyin yangi suhbat
  const conv = conversation(id, from.startsWith('whatsapp:') ? 'whatsapp' : 'sms', from.replace(/^whatsapp:/, ''));
  const r = await talk(conv, String(req.body.Body || ''));
  twiml(res, `<Message>${xml(r.reply)}</Message>`);
}));

// ---------- Telegram bot (mijozlar uchun, bepul) ----------
app.post('/telegram/hook/:tid/:secret', withTenant((req) => req.params.tid), (req, res) => {
  if (req.params.secret !== TG.secret() || req.get('x-telegram-bot-api-secret-token') !== TG.secret()) return res.sendStatus(403);
  res.sendStatus(200); // Telegram kutib qolmasin — javobni alohida yuboramiz
  TG.handle(req.body || {}, { conversation, talk, A, C }).catch((e) => console.error('Telegram:', e.message));
});
app.post('/api/telegram/setup', auth, wrap(async (req, res) => {
  const r = await TG.setup(true);
  if (!r.ok) return res.status(400).json({ error: r.reason === 'token' ? 'Avval "Ulanishlar"ga Telegram bot tokenini kiriting' : r.reason === 'url' ? 'Sayt manzili (https://...) kiritilmagan' : r.reason });
  res.json(r);
}));

// ---------- Saytda ovozli suhbat (bepul "qo'ng'iroq") ----------
app.post('/api/chat/voice', express.json({ limit: '6mb' }), withTenant((req) => req.query.t || req.body?.t), wrap(async (req, res) => {
  const now = Date.now(), hits = (chatHits.get(req.ip) || []).filter((t) => now - t < 60e3);
  if (hits.length >= 20) return res.status(429).json({ error: 'Juda tez, biroz kuting' });
  hits.push(now); chatHits.set(req.ip, hits);
  const sid = String(req.body.session || '').replace(/[^\w-]/g, '').slice(0, 40);
  const buf = Buffer.from(String(req.body.data || ''), 'base64');
  if (!sid || buf.length < 2000) return res.status(400).json({ error: 'Ovoz yozilmadi' });
  const test = req.body.test && validToken((req.headers.authorization || '').replace(/^Bearer\s+/, '')) === req.tenantId;
  const conv = conversation((test ? 'test:' : 'web:') + sid, test ? 'test' : 'web', '');
  let text = '';
  try { text = await V.transcribe(buf, String(req.body.mime || 'audio/wav'), conv.lang || 'uz', 15000); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (!text) return res.json({ text: '', reply: A.L(conv.lang || 'uz', 'Eshitmadim, qaytadan ayting.', 'Не расслышал, повторите.'), audio: null });
  const r = await talk(conv, text);
  const lang = r.lang || conv.lang || 'uz';
  const audio = V.ttsOn(lang) ? await V.tts(r.reply, lang, 10000) : null;
  res.json({ text, reply: r.reply, lang, audio: audio ? '/tts/' + audio : null, booking: r.booking ? { date: r.booking.date, start: r.booking.start } : null, order: r.order ? { total: r.order.total } : null, handoff: r.handoff });
}));

// ---------- Ovoz fayllari (Twilio shu manzillardan o'qiydi) ----------
app.get('/tts/:name', (req, res) => {
  const f = V.ttsFile(req.params.name);
  if (!f) return res.sendStatus(404);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(f);
});
app.get('/media/greeting', withTenant((req) => req.query.t), wrap(async (req, res) => {
  const b = st().media?.greeting && await store.getBlob('greeting');
  if (!b) return res.sendStatus(404);
  res.set({ 'Content-Type': b.type, 'Cache-Control': 'no-cache' });
  res.send(b.data);
}));

// Tez-tez aytiladigan iboralarni oldindan tayyorlab qo'yamiz — qo'ng'iroqda kutish kamayadi
function prewarm() {
  if (!V.ttsOn('uz')) return;
  const phrases = [A.greeting(st(), 'uz'), "O'zbek tili uchun gapiring yoki birni bosing.", 'Eshitaman, gapiring.', 'Eshitmadim, qaytadan ayting.', 'Xayr!', BYE.uz,
    "Sizni eshitmadim. Keyinroq qayta qo'ng'iroq qiling. Xayr!", "Qo'ng'irog'ingiz uchun rahmat! Xayr!", 'Yana savolingiz bormi?'];
  (async () => { for (const p of phrases) await V.tts(p, 'uz', 20000); })().catch(() => {});
}

// ---------- Kotib raqami: Twilio raqamini avtomatik ulash ----------
const TWILIO_API = process.env.TWILIO_API_BASE || 'https://api.twilio.com'; // TWILIO_API_BASE — faqat test uchun
async function twilioApi(pathname, form) {
  const sid = env("TWILIO_ACCOUNT_SID"), tok = env("TWILIO_AUTH_TOKEN");
  if (!sid || !tok) { const e = new Error("Avval \"Ulanishlar\"ga Twilio Account SID va Auth Token kiriting"); e.status = 400; throw e; }
  const r = await fetch(`${TWILIO_API}/2010-04-01/Accounts/${encodeURIComponent(sid)}${pathname}`, {
    method: form ? 'POST' : 'GET',
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'), ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: form ? new URLSearchParams(form) : undefined, signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(r.status === 401 ? "Twilio kaliti noto'g'ri (Account SID yoki Auth Token)" : `Twilio: ${j.message || r.status}`); e.status = 400; throw e; }
  return j;
}
const hooks = (base, tid) => ({ voice: `${base}/t/${tid}/twilio/voice`, status: `${base}/t/${tid}/twilio/status`, sms: `${base}/t/${tid}/twilio/sms` });
// Akkauntdagi raqamlar va qaysi biri kotibga ulanganligi
app.get('/api/phone/numbers', auth, wrap(async (req, res) => {
  if (!CFG.ownTwilio()) return res.json({ managed: true, current: st().business.kotibNumber || '', numbers: [] });
  try {
    const j = await twilioApi('/IncomingPhoneNumbers.json?PageSize=50');
    const h = hooks(baseUrl(req), req.tenantId);
    res.json({
      base: baseUrl(req), current: st().business.kotibNumber || '',
      numbers: (j.incoming_phone_numbers || []).map((n) => ({ sid: n.sid, number: n.phone_number, name: n.friendly_name, voiceUrl: n.voice_url || '', connected: n.voice_url === h.voice, sms: !!n.capabilities?.sms })),
    });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}));
// Raqamni kotibga ulash: qo'ng'iroq, qo'ng'iroq holati va SMS shu ilovaga keladi
app.post('/api/phone/connect', auth, wrap(async (req, res) => {
  if (!CFG.ownTwilio()) return res.status(403).json({ error: "Kotib raqamini platforma ma'muri biriktiradi" });
  try {
    const sid = String(req.body.sid || '');
    if (!/^PN[a-f0-9]{32}$/i.test(sid)) return res.status(400).json({ error: "Raqam tanlanmagan" });
    const base = baseUrl(req);
    if (!/^https:\/\//.test(base) && !/localhost|127\.0\.0\.1/.test(base)) return res.status(400).json({ error: 'Sayt manzili https bilan boshlanishi kerak' });
    const h = hooks(base, req.tenantId);
    const n = await twilioApi(`/IncomingPhoneNumbers/${sid}.json`, { VoiceUrl: h.voice, VoiceMethod: 'POST', StatusCallback: h.status, StatusCallbackMethod: 'POST', SmsUrl: h.sms, SmsMethod: 'POST' });
    st().business.kotibNumber = n.phone_number;
    store.platform().tenants[req.tenantId].kotibNumber = n.phone_number;
    store.savePlatform();
    store.save();
    emit('settings', {});
    res.json({ ok: true, number: n.phone_number });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}));

// ---------- Admin: platforma Twilio raqamlarini bizneslarga biriktirish ----------
app.get('/api/admin/numbers', SA_admin, wrap(async (req, res) => {
  if (!env('TWILIO_ACCOUNT_SID') || !env('TWILIO_AUTH_TOKEN')) return res.json([]);
  try {
    const j = await twilioApi('/IncomingPhoneNumbers.json?PageSize=100');
    const byUrl = Object.fromEntries(Object.values(store.platform().tenants).map((t) => [t.id, t.name]));
    res.json((j.incoming_phone_numbers || []).map((n) => {
      const m = /\/t\/(\w+)\/twilio\/voice$/.exec(n.voice_url || '');
      return { sid: n.sid, number: n.phone_number, name: n.friendly_name, tenantId: m ? m[1] : null, tenantName: m ? byUrl[m[1]] || '?' : null };
    }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}));
app.post('/api/admin/tenants/:id/number', SA_admin, wrap(async (req, res) => {
  const t = store.platform().tenants[req.params.id];
  if (!t) return res.status(404).json({ error: 'Biznes topilmadi' });
  try {
    const sid = String(req.body.sid || '');
    if (!/^PN[a-f0-9]{32}$/i.test(sid)) return res.status(400).json({ error: 'Raqam tanlanmagan' });
    const base = baseUrl(req), h = hooks(base, t.id);
    const n = await twilioApi(`/IncomingPhoneNumbers/${sid}.json`, { VoiceUrl: h.voice, VoiceMethod: 'POST', StatusCallback: h.status, StatusCallbackMethod: 'POST', SmsUrl: h.sms, SmsMethod: 'POST' });
    // Shu raqam avval boshqa biznesda bo'lsa — undan olib tashlaymiz
    for (const o of Object.values(store.platform().tenants)) if (o.kotibNumber === n.phone_number) { o.kotibNumber = ''; store.run(o.id, () => { st().business.kotibNumber = ''; store.save(); }); }
    t.kotibNumber = n.phone_number;
    store.savePlatform();
    store.run(t.id, () => { st().business.kotibNumber = n.phone_number; store.save(); C.tg(`📞 Sizga kotib raqami biriktirildi: ${n.phone_number}. Ilovada "Sozlamalar → Kotib raqami" bo'limidan o'z raqamingizdan yo'naltirishni yoqing.`); });
    res.json({ ok: true, number: n.phone_number });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
}));

// ---------- Ulanishlar va ovoz sozlamalari (egasi uchun) ----------
app.get('/api/connections', auth, (req, res) => res.json({ keys: CFG.view(), voice: V.status(), greeting: st().media?.greeting || null, clone: st().media?.clone || null }));
app.put('/api/connections', auth, (req, res) => {
  CFG.set(req.body || {});
  V.resetDown();
  prewarm();
  TG.setup(true).catch(() => {});
  emit('settings', {});
  res.json({ keys: CFG.view(), voice: V.status() });
});
// Ovozni sinash: matnni o'zbekcha ovozda eshittirish
app.post('/api/voice/test', auth, wrap(async (req, res) => {
  const text = String(req.body.text || A.greeting(st(), 'uz')).slice(0, 500);
  if (!V.ttsOn('uz')) {
    const errs = Object.entries(V.status().errors || {}).map(([k, v]) => `${k}: ${v}`).join('; ');
    return res.status(400).json({ error: errs ? `Ovoz xizmati xato berdi (${errs}). Kalit va balansni tekshiring, so'ng "Ulanishlarni saqlash"ni bosing.` : "O'zbekcha ovoz ulanmagan: Aisha, Muxlisa yoki Azure kalitini kiriting" });
  }
  const name = await V.tts(text, 'uz', 20000);
  if (!name) {
    const errs = Object.entries(V.status().errors || {}).map(([k, v]) => `${k}: ${v}`).join('; ');
    return res.status(502).json({ error: `Ovoz yaratib bo'lmadi${errs ? ` (${errs})` : ''}. Kalit va balansni tekshiring. Hozircha kotib zaxira ovozda gapiradi.` });
  }
  res.json({ url: '/tts/' + name, spoken: V.uzSpeech(text) });
}));
// Egasining ovozini klonlash: namuna (1–3 daqiqa) ElevenLabs'ga yuboriladi, kotib shu ovozda gapiradi
app.post('/api/voice/clone', auth, express.json({ limit: '16mb' }), wrap(async (req, res) => {
  if (!req.body.consent) return res.status(400).json({ error: 'Bu sizning o‘z ovozingiz ekanini tasdiqlang' });
  const buf = Buffer.from(String(req.body.data || ''), 'base64');
  if (buf.length < 50000) return res.status(400).json({ error: 'Namuna juda qisqa — kamida 30 soniya gapiring (yaxshisi 1–2 daqiqa)' });
  try {
    const id = await V.cloneVoice(buf, `${st().business.name} — kotib`);
    CFG.set({ ELEVENLABS_VOICE_ID: id });
    st().media = { ...(st().media || {}), clone: { at: Date.now(), seconds: Number(req.body.seconds) || null } };
    store.save();
    prewarm();
    res.json({ ok: true, voice: V.status() });
  } catch (e) { res.status(400).json({ error: e.message }); }
}));
app.delete('/api/voice/clone', auth, (req, res) => {
  CFG.set({ ELEVENLABS_VOICE_ID: '' });
  if (st().media) delete st().media.clone;
  store.save();
  res.json({ ok: true, voice: V.status() });
});
// Egasining o'z ovozidagi salomlashish (ilovada WAV'ga aylantirilib yuboriladi)
app.post('/api/media/greeting', auth, express.json({ limit: '12mb' }), wrap(async (req, res) => {
  const type = String(req.body.type || '');
  if (!/^audio\/(wav|x-wav|mpeg|mp3)$/.test(type)) return res.status(400).json({ error: 'Faqat WAV yoki MP3' });
  const buf = Buffer.from(String(req.body.data || ''), 'base64');
  if (buf.length < 1000 || buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: "Fayl hajmi 8 MB dan oshmasin" });
  await store.putBlob('greeting', buf, type === 'audio/x-wav' ? 'audio/wav' : type === 'audio/mp3' ? 'audio/mpeg' : type);
  st().media = { ...(st().media || {}), greeting: { type, size: buf.length, seconds: Number(req.body.seconds) || null, at: Date.now() } };
  store.save();
  res.json({ ok: true, greeting: st().media.greeting });
}));
app.delete('/api/media/greeting', auth, wrap(async (req, res) => {
  await store.delBlob('greeting');
  if (st().media) delete st().media.greeting;
  store.save();
  res.json({ ok: true });
}));

// ---------- Statik fayllar ----------
app.get('/api/health', (req, res) => res.json({ ok: true, db: store.PG ? 'postgres' : 'file', tenants: store.tenantIds().length }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], setHeaders: (res, p) => { if (/\.(html|js|css|webmanifest)$/.test(p)) res.set('Cache-Control', 'no-cache'); } }));
app.get('/c/:tid', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/twilio/voice')) return twiml(res, say("Kechirasiz, texnik nosozlik. Birozdan keyin qayta qo'ng'iroq qiling.") + '<Hangup/>');
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Fayl juda katta' });
  res.status(500).json({ error: 'Server xatosi' });
});

const PORT = Number(process.env.PORT) || 3100;
store.load().then(() => {
  C.startScheduler();
  // Har bir biznes uchun Telegram botni ulash va iboralarni tayyorlash
  (async () => { for (const id of store.tenantIds()) await store.run(id, async () => { await TG.setup().catch(() => {}); prewarm(); }); })();
  const server = app.listen(PORT, () => console.log(`Kotib ishga tushdi: http://localhost:${PORT} (ma'lumotlar: ${store.PG ? 'PostgreSQL' : 'fayl'}, bizneslar: ${store.tenantIds().length})`));
  const stop = () => { store.flush().finally(() => server.close(() => process.exit(0))); setTimeout(() => process.exit(0), 3000).unref(); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}).catch((e) => { console.error("Ma'lumotlarni yuklab bo'lmadi:", e); process.exit(1); });
