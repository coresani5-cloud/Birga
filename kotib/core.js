// Kotib — biznes mantiqi: mijozlar, uchrashuvlar, zakazlar, vazifalar, xabarnomalar, eslatmalar, kunlik hisobot.
const store = require('./store');
const S = require('./slots');

const st = () => store.get();
let emit = () => {};
const setEmit = (fn) => { emit = fn; };

// ---------- Yordamchilar ----------
const phoneKey = (p) => String(p || '').replace(/\D/g, '').slice(-9);
const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ') + ' so‘m';
const priceNum = (p) => Number(String(p || '').replace(/[^\d]/g, '')) || 0;
// Vaqt belgisi (ms) -> biznes vaqt mintaqasidagi sana
const localDate = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: S.TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
// Sana+vaqt -> solishtirish uchun "mahalliy daqiqalar"
const absMin = (date, min) => Date.parse(date + 'T00:00:00Z') / 60000 + min;
function tsAbs(ts) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: S.TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return absMin(`${p.year}-${p.month}-${p.day}`, Number(p.hour) * 60 + Number(p.minute));
}

// ---------- Mijozlar ----------
function customer(phone) {
  const k = phoneKey(phone);
  return k.length >= 7 ? st().customers[k] || null : null;
}
// Mijoz bilan har bir aloqada chaqiriladi: yangi bo'lsa yaratadi, bo'lsa yangilaydi
function touchCustomer(phone, patch = {}) {
  const k = phoneKey(phone);
  if (k.length < 7) return null;
  const s = st();
  let c = s.customers[k];
  if (!c) c = s.customers[k] = { key: k, phone: String(phone), name: '', lang: '', notes: '', firstSeen: Date.now(), lastSeen: Date.now(), calls: 0, chats: 0 };
  if (patch.name && !c.name) c.name = String(patch.name).slice(0, 80);
  if (patch.lang) c.lang = patch.lang;
  if (patch.call) c.calls++;
  if (patch.chat) c.chats++;
  c.lastSeen = Date.now();
  store.save();
  return c;
}
// AI uchun mijoz tarixi: avvalgi uchrashuvlar, zakazlar va murojaatlar
function customerHistory(phone) {
  const k = phoneKey(phone);
  if (k.length < 7) return null;
  const s = st(), c = s.customers[k];
  const bookings = s.bookings.filter((b) => phoneKey(b.customer.phone) === k).slice(-5);
  const orders = s.orders.filter((o) => phoneKey(o.customer.phone) === k).slice(-5);
  const convs = Object.values(s.conversations).filter((v) => phoneKey(v.from) === k && v.messages.length).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  if (!c && !bookings.length && !orders.length) return null;
  return { customer: c, bookings, orders, convs };
}

// ---------- Uchrashuvlar ----------
function createBooking({ serviceId, date, start, duration, name, phone, notes, source, conversationId, force }) {
  const s = st();
  const svc = (s.services || []).find((x) => x.id === serviceId);
  const dur = Number(duration) || svc?.duration || 30;
  if (!force) {
    const err = S.check(s, date, start, dur);
    if (err) return { ok: false, error: err };
  } else if (!S.isDate(date) || !S.isTime(start)) return { ok: false, error: "Sana yoki vaqt noto'g'ri" };
  if (!String(name || '').trim()) return { ok: false, error: 'Mijoz ismi kerak' };
  const b = {
    id: store.nextId('b'), date, start, end: S.toHM(Math.min(1439, S.toMin(start) + dur)),
    serviceId: svc?.id || null, serviceName: svc?.name || 'Xizmat', price: svc?.price || '',
    customer: { name: String(name).trim().slice(0, 80), phone: String(phone || '').trim().slice(0, 30) },
    notes: String(notes || '').slice(0, 500), status: 'confirmed', source: source || 'manual',
    conversationId: conversationId || null, createdAt: Date.now(), reminded: [],
  };
  s.bookings.push(b);
  touchCustomer(b.customer.phone, { name: b.customer.name });
  store.save();
  emit('booking', b);
  if (b.source !== 'manual') {
    const src = SRC[b.source] || b.source;
    tg(`🗓 <b>Yangi uchrashuv</b> (${src})\n${S.human(b.date)}, ${b.start}–${b.end}\n${esc(b.serviceName)}${b.price ? ' — ' + esc(b.price) : ''}\n👤 ${esc(b.customer.name)} ${esc(b.customer.phone)}${b.notes ? '\n📝 ' + esc(b.notes) : ''}`);
    if (process.env.SMS_CONFIRM === '1') sms(b.customer.phone, `${s.business.name}: ${S.human(b.date)}, soat ${b.start} — "${b.serviceName}". Kutamiz!`);
  }
  return { ok: true, booking: b };
}

// ---------- Zakazlar (mahsulotlar) ----------
function findProduct(name) {
  const n = String(name || '').toLowerCase().trim();
  const list = st().products || [];
  return list.find((p) => p.name.toLowerCase() === n) || list.find((p) => n && (p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())));
}
function createOrder({ items, name, phone, address, notes, source, conversationId }) {
  const s = st();
  const lines = [];
  for (const it of items || []) {
    const p = it.productId ? s.products.find((x) => x.id === it.productId) : findProduct(it.product || it.name);
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    if (!p) return { ok: false, error: `"${it.product || it.name || '?'}" mahsuloti topilmadi` };
    if (p.stock !== null && p.stock !== undefined && p.stock !== '' && Number(p.stock) < qty) {
      return { ok: false, error: Number(p.stock) > 0 ? `"${p.name}" dan faqat ${p.stock} ${p.unit || 'dona'} qolgan` : `"${p.name}" hozir qolmagan` };
    }
    lines.push({ p, qty });
  }
  if (!lines.length) return { ok: false, error: 'Zakazda mahsulot yo‘q' };
  if (!String(name || '').trim()) return { ok: false, error: 'Mijoz ismi kerak' };
  for (const { p, qty } of lines) if (p.stock !== null && p.stock !== undefined && p.stock !== '') p.stock = Number(p.stock) - qty;
  const o = {
    id: store.nextId('o'),
    items: lines.map(({ p, qty }) => ({ productId: p.id, name: p.name, qty, price: Number(p.price) || 0, unit: p.unit || 'dona' })),
    total: lines.reduce((a, { p, qty }) => a + (Number(p.price) || 0) * qty, 0),
    customer: { name: String(name).trim().slice(0, 80), phone: String(phone || '').trim().slice(0, 30) },
    address: String(address || '').slice(0, 300), notes: String(notes || '').slice(0, 500),
    status: 'new', source: source || 'manual', conversationId: conversationId || null, createdAt: Date.now(),
  };
  s.orders.push(o);
  touchCustomer(o.customer.phone, { name: o.customer.name });
  store.save();
  emit('order', o);
  tg(`🛒 <b>Yangi zakaz</b> (${SRC[o.source] || o.source})\n${o.items.map((i) => `• ${esc(i.name)} × ${i.qty} = ${money(i.price * i.qty)}`).join('\n')}\n<b>Jami: ${money(o.total)}</b>\n👤 ${esc(o.customer.name)} ${esc(o.customer.phone)}${o.address ? '\n📍 ' + esc(o.address) : ''}${o.notes ? '\n📝 ' + esc(o.notes) : ''}`);
  return { ok: true, order: o };
}
// Zakaz bekor qilinsa — qoldiq qaytariladi
function setOrderStatus(o, status) {
  const s = st();
  if (status === o.status) return;
  const back = (sign) => { for (const it of o.items) { const p = s.products.find((x) => x.id === it.productId); if (p && p.stock !== null && p.stock !== undefined && p.stock !== '') p.stock = Number(p.stock) + sign * it.qty; } };
  if (status === 'cancelled') back(1);
  if (o.status === 'cancelled') back(-1);
  o.status = status;
}

// ---------- Vazifalar (qayta qo'ng'iroq, operatorga topshirish) ----------
function createTask({ type, phone, name, reason, conversationId }) {
  const s = st();
  // Bir raqam uchun ochiq vazifa bo'lsa — yangisini yaratmasdan sababini qo'shamiz
  const open = phone && s.tasks.find((t) => !t.done && phoneKey(t.phone) === phoneKey(phone));
  if (open) {
    if (reason && !open.reason.includes(reason)) open.reason += '; ' + reason;
    open.updatedAt = Date.now();
    store.save(); emit('task', open);
    return open;
  }
  const c = customer(phone);
  const t = { id: store.nextId('t'), type: type || 'callback', phone: phone || '', name: name || c?.name || '', reason: String(reason || '').slice(0, 500), conversationId: conversationId || null, done: false, createdAt: Date.now(), updatedAt: Date.now() };
  s.tasks.push(t);
  if (s.tasks.length > 1000) s.tasks = s.tasks.filter((x) => !x.done || Date.now() - x.createdAt < 90 * 864e5);
  store.save();
  emit('task', t);
  const title = { missed: '📵 Javobsiz qo‘ng‘iroq', handoff: '🙋 Mijoz inson bilan gaplashmoqchi', callback: '☎️ Qayta bog‘lanish kerak' }[t.type] || '☎️ Vazifa';
  tg(`<b>${title}</b>\n👤 ${esc(t.name || 'Noma’lum')} ${esc(t.phone)}\n${esc(t.reason)}`);
  return t;
}

// ---------- Xabarnomalar ----------
const SRC = { call: "qo'ng'iroq", sms: 'SMS', whatsapp: 'WhatsApp', web: 'sayt', test: 'sinov', manual: "qo'lda" };
const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const tgChat = () => process.env.TG_CHAT_ID || st().business.tgChatId;
const tgOn = () => !!(process.env.TG_BOT_TOKEN && tgChat());
async function tg(text) {
  if (!tgOn()) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgChat(), text, parse_mode: 'HTML', disable_web_page_preview: true }), signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) { console.error('Telegram:', r.status, (await r.text()).slice(0, 200)); return false; }
    return true;
  } catch (e) { console.error('Telegram:', e.message); return false; }
}
const smsOn = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
async function sms(to, body) {
  if (!smsOn() || !to) return false;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM, Body: body }), signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) { console.error('SMS:', r.status, (await r.text()).slice(0, 200)); return false; }
    return true;
  } catch (e) { console.error('SMS:', e.message); return false; }
}

// ---------- Kunlik hisobot ----------
// Hisobot: bitta kun yoki [from, to] oralig'i uchun
function report(from, to) {
  const s = st();
  from = from || S.now().date; to = to || from;
  const inR = (ts) => { const d = localDate(ts); return d >= from && d <= to; };
  const convs = Object.values(s.conversations).filter((c) => c.createdAt && inR(c.createdAt) && c.channel !== 'test');
  const calls = convs.filter((c) => c.channel === 'call');
  const newCustomers = Object.values(s.customers).filter((c) => inR(c.firstSeen)).length;
  const bookingsNew = s.bookings.filter((b) => inR(b.createdAt) && b.status !== 'cancelled' && b.source !== 'test');
  const visitsList = s.bookings.filter((b) => b.date >= from && b.date <= to && b.status !== 'cancelled');
  const done = visitsList.filter((b) => b.status === 'done');
  const orders = s.orders.filter((o) => inR(o.createdAt) && o.status !== 'cancelled' && o.source !== 'test');
  const keys = new Set([...convs.map((c) => c.from), ...bookingsNew.map((b) => b.customer.phone), ...orders.map((o) => o.customer.phone)].map(phoneKey).filter((k) => k.length >= 7));
  const sales = orders.reduce((a, o) => a + o.total, 0) + done.reduce((a, b) => a + priceNum(b.price), 0);
  const missed = s.tasks.filter((t) => inR(t.createdAt) && t.type === 'missed').length;
  const openTasks = s.tasks.filter((t) => !t.done).length;
  const tomorrow = s.bookings.filter((b) => b.date === S.addDays(to, 1) && b.status === 'confirmed').length;
  return {
    date: from, from, to, calls: calls.length, chats: convs.length - calls.length, customers: keys.size, newCustomers,
    bookings: bookingsNew.length, visits: visitsList.length, done: done.length,
    orders: orders.length, sales, missed, openTasks, tomorrow,
  };
}
// Grafik uchun: oxirgi N kun bo'yicha kunlik ko'rsatkichlar
function series(days = 30) {
  const today = S.now().date, out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = S.addDays(today, -i), r = report(d);
    out.push({ date: d, calls: r.calls, chats: r.chats, orders: r.orders, bookings: r.bookings, sales: r.sales });
  }
  return out;
}
function reportText(r) {
  return `📊 <b>${esc(st().business.name)} — kunlik hisobot</b>\n${S.human(r.date)}\n\n` +
    `📞 Qo‘ng‘iroqlar: <b>${r.calls}</b>${r.missed ? ` (javobsiz: ${r.missed})` : ''}\n` +
    `💬 Yozishmalar: <b>${r.chats}</b>\n` +
    `👥 Mijozlar: <b>${r.customers}</b> (yangi: ${r.newCustomers})\n` +
    `🗓 Yangi uchrashuvlar: <b>${r.bookings}</b>\n` +
    `✅ Bugungi uchrashuvlar: ${r.visits} (bajarildi: ${r.done})\n` +
    `🛒 Zakazlar: <b>${r.orders}</b>\n` +
    `💰 Savdo: <b>${money(r.sales)}</b>\n` +
    (r.openTasks ? `☎️ Ochiq vazifalar: <b>${r.openTasks}</b>\n` : '') +
    `\nErtaga: ${r.tomorrow} ta uchrashuv`;
}

// ---------- Rejalashtiruvchi: eslatmalar va hisobot (har daqiqada) ----------
function tick() {
  const s = st(), t = S.now(), nowAbs = absMin(t.date, t.min);
  const hrs = String(s.business.reminders || '').split(/[,\s]+/).map(Number).filter((h) => h > 0 && h <= 168);
  for (const b of s.bookings) {
    if (b.status !== 'confirmed' || !b.customer.phone || b.source === 'test') continue;
    const startAbs = absMin(b.date, S.toMin(b.start));
    if (startAbs < nowAbs) continue;
    b.reminded = b.reminded || [];
    // Muddati kelgan eslatmalar; bir nechtasi birdan kelsa ham bitta SMS yuboriladi
    const due = hrs.filter((h) => !b.reminded.includes(h) && startAbs - nowAbs <= h * 60);
    if (!due.length) continue;
    b.reminded.push(...due);
    store.save();
    // Uchrashuv eslatma oralig'i ichida yozilgan bo'lsa (masalan, 1 soat oldin) — eslatma kerak emas
    if (due.every((h) => tsAbs(b.createdAt) > startAbs - h * 60)) continue;
    const when = b.date === t.date ? `bugun soat ${b.start}` : `${S.human(b.date)}, soat ${b.start}`;
    sms(b.customer.phone, `Eslatma: ${s.business.name} — ${when}, "${b.serviceName}". ${s.business.address ? 'Manzil: ' + s.business.address + '. ' : ''}O'zgartirish uchun qo'ng'iroq qiling.`);
  }
  const rt = S.isTime(s.business.reportTime) ? s.business.reportTime : '';
  if (rt && s.meta.lastReport !== t.date && t.min >= S.toMin(rt)) {
    s.meta.lastReport = t.date;
    store.save();
    tg(reportText(report(t.date)));
  }
}
function startScheduler() {
  setInterval(() => { try { tick(); } catch (e) { console.error('Rejalashtiruvchi:', e); } }, 60e3).unref();
}

module.exports = { setEmit, phoneKey, money, priceNum, localDate, customer, touchCustomer, customerHistory, createBooking, createOrder, setOrderStatus, findProduct, createTask, tg, tgOn, sms, smsOn, report, series, reportText, tick, startScheduler, SRC };
