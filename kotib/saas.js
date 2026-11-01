// Kotib — SaaS: bizneslarni ro'yxatdan o'tkazish, kirish, obuna, to'lovlar va platforma egasining admin paneli.
const express = require('express');
const crypto = require('crypto');
const store = require('./store');
const CFG = require('./config');

const P = () => store.platform();
const hashPass = (p, salt) => crypto.scryptSync(String(p), salt, 32).toString('hex');
const normPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 9 ? '998' + d : d; };
const DAY = 864e5;

// ---------- Tokenlar ----------
function secret() {
  if (process.env.SECRET) return process.env.SECRET;
  const a = P().admin;
  if (!a.secret) { a.secret = crypto.randomBytes(32).toString('hex'); store.savePlatform(); }
  return a.secret;
}
const sign = (body) => crypto.createHmac('sha256', secret()).update(body).digest('hex');
function makeToken(kind, id, salt) {
  const body = `${kind}.${id}.${Date.now() + 180 * DAY}.${salt || 'x'}`;
  return body + '.' + sign(body);
}
function readToken(tok) {
  const p = String(tok || '').split('.');
  if (p.length !== 5) return null;
  const body = p.slice(0, 4).join('.'), sig = sign(body);
  if (sig.length !== p[4].length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(p[4]))) return null;
  if (Number(p[2]) < Date.now()) return null;
  return { kind: p[0], id: p[1], salt: p[3] };
}
const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/, '') || req.query.token;
// Biznes tokeni: joriy biznes uchun haqiqiymi
function validToken(tok) {
  const t = readToken(tok);
  if (!t || t.kind !== 'b') return null;
  const ten = P().tenants[t.id];
  if (!ten || ten.blocked || t.salt !== (ten.salt || 'x')) return null;
  return t.id;
}

// ---------- Obuna holati ----------
function status(id) {
  const t = P().tenants[id || store.tenantId()];
  if (!t) return { active: false, state: 'none' };
  const until = Math.max(t.trialUntil || 0, t.paidUntil || 0);
  const now = Date.now();
  const state = t.blocked ? 'blocked' : until > now ? ((t.paidUntil || 0) > now ? 'paid' : 'trial') : 'expired';
  return { active: state === 'paid' || state === 'trial', state, until, daysLeft: Math.max(0, Math.ceil((until - now) / DAY)), plan: t.plan || '' };
}
const active = () => status().active;

// ---------- Middleware ----------
// Biznes egasi (panel) — so'rovni shu biznes kontekstida bajaradi
function auth(req, res, next) {
  const id = validToken(bearer(req));
  if (!id || !store.has(id)) return res.status(401).json({ error: 'Kirish kerak' });
  req.tenantId = id;
  store.run(id, () => next());
}
// Ochiq so'rovlar (mijoz chati, Twilio, Telegram): biznes id manzildan yoki so'rovdan olinadi
const withTenant = (pick) => (req, res, next) => {
  const id = String(pick(req) || '').replace(/[^\w]/g, '');
  if (!id || !store.has(id) || P().tenants[id]?.blocked) return res.status(404).json({ error: 'Biznes topilmadi' });
  req.tenantId = id;
  store.run(id, () => next());
};
function adminToken(tok) {
  const t = readToken(tok);
  return !!(t && t.kind === 'a' && t.salt === (process.env.ADMIN_PASSWORD ? 'env' : P().admin.salt || 'x'));
}
function adminAuth(req, res, next) {
  if (!adminToken(bearer(req))) return res.status(401).json({ error: 'Admin sifatida kiring' });
  next();
}

// Platforma egasiga Telegram xabar (yangi biznes, to'lov so'rovi)
async function notifyAdmin(text) {
  const tok = process.env.ADMIN_TG_BOT_TOKEN || P().secrets?.ADMIN_TG_BOT_TOKEN, chat = process.env.ADMIN_TG_CHAT_ID || P().secrets?.ADMIN_TG_CHAT_ID;
  if (!tok || !chat) return;
  fetch(`https://api.telegram.org/bot${tok}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text }), signal: AbortSignal.timeout(10000) }).catch(() => {});
}

function mount(app, { C, onTenantCreated }) {
  const tries = new Map();
  const limited = (req, res) => {
    const now = Date.now(), tr = (tries.get(req.ip) || []).filter((t) => now - t < 10 * 60e3);
    tries.set(req.ip, tr);
    if (tr.length >= 10) { res.status(429).json({ error: "Juda ko'p urinish. 10 daqiqadan keyin qayta urining" }); return true; }
    return false;
  };
  const fail = (req) => tries.get(req.ip).push(Date.now());
  const findByPhone = (phone) => Object.values(P().tenants).find((t) => normPhone(t.phone) === normPhone(phone));

  // Ro'yxatdan o'tish: bepul sinov davri bilan
  app.post('/api/auth/register', (req, res) => {
    if (limited(req, res)) return;
    const name = String(req.body.name || '').trim().slice(0, 100), phone = normPhone(req.body.phone), pass = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ error: 'Biznes nomini kiriting' });
    if (phone.length < 9 || phone.length > 15) return res.status(400).json({ error: "Telefon raqam noto'g'ri" });
    if (pass.length < 6) return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lsin" });
    if (findByPhone(phone)) { fail(req); return res.status(400).json({ error: "Bu raqam bilan ro'yxatdan o'tilgan — kirish bo'limidan kiring" }); }
    const p = P();
    const id = 'b' + (p.seq = (p.seq || 1) + 1).toString(36) + crypto.randomBytes(3).toString('hex');
    const salt = crypto.randomBytes(8).toString('hex');
    p.tenants[id] = { id, name, phone: '+' + phone, hash: hashPass(pass, salt), salt, createdAt: Date.now(), lastLogin: Date.now(), trialUntil: Date.now() + (Number(p.trialDays) || 14) * DAY, paidUntil: 0, plan: '', blocked: false, kotibNumber: '' };
    store.savePlatform();
    const doc = store.createTenant(id);
    doc.business.name = name;
    doc.business.phone = '+' + phone;
    doc.business.operatorPhone = '+' + phone;
    store.run(id, () => { store.save(); onTenantCreated && onTenantCreated(id); });
    notifyAdmin(`🆕 Yangi biznes: ${name}\n📞 +${phone}\nSinov: ${p.trialDays} kun`);
    res.json({ token: makeToken('b', id, salt), id });
  });

  app.post('/api/auth/login', (req, res) => {
    if (limited(req, res)) return;
    const t = findByPhone(req.body.phone);
    if (!t || !t.hash || hashPass(String(req.body.password || ''), t.salt) !== t.hash) { fail(req); return res.status(401).json({ error: "Telefon yoki parol noto'g'ri" }); }
    if (t.blocked) return res.status(403).json({ error: "Hisob bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling" });
    t.lastLogin = Date.now(); store.savePlatform();
    res.json({ token: makeToken('b', t.id, t.salt), id: t.id });
  });

  app.post('/api/auth/password', auth, (req, res) => {
    const pass = String(req.body.password || '');
    if (pass.length < 6) return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lsin" });
    const t = P().tenants[req.tenantId];
    t.salt = crypto.randomBytes(8).toString('hex'); // eski tokenlar bekor bo'ladi
    t.hash = hashPass(pass, t.salt);
    store.savePlatform();
    res.json({ token: makeToken('b', t.id, t.salt) });
  });

  // ---------- Obuna va to'lov (biznes uchun) ----------
  app.get('/api/billing', auth, (req, res) => {
    const p = P();
    res.json({ status: status(), plans: p.plans, payInfo: p.payInfo, payments: p.payments.filter((x) => x.tenantId === req.tenantId).slice(-20).reverse() });
  });
  app.post('/api/billing/pay', auth, (req, res) => {
    const p = P(), plan = p.plans.find((x) => x.id === req.body.plan);
    if (!plan) return res.status(400).json({ error: 'Tarifni tanlang' });
    if (p.payments.some((x) => x.tenantId === req.tenantId && x.status === 'pending')) return res.status(400).json({ error: "Oldingi to'lovingiz tekshirilmoqda — biroz kuting" });
    const pay = { id: 'p' + Date.now().toString(36), tenantId: req.tenantId, plan: plan.id, planName: plan.name, amount: plan.price, days: plan.days, note: String(req.body.note || '').slice(0, 300), status: 'pending', at: Date.now() };
    p.payments.push(pay);
    if (p.payments.length > 5000) p.payments = p.payments.slice(-5000);
    store.savePlatform();
    const t = p.tenants[req.tenantId];
    notifyAdmin(`💳 To'lov so'rovi: ${t.name} (${t.phone})\n${plan.name} — ${plan.price.toLocaleString('ru-RU')} so'm\n${pay.note || ''}`);
    res.json(pay);
  });

  // ---------- Admin (platforma egasi) ----------
  app.post('/api/admin/login', (req, res) => {
    if (limited(req, res)) return;
    const pass = String(req.body.password || ''), a = P().admin;
    const ok = process.env.ADMIN_PASSWORD ? pass === process.env.ADMIN_PASSWORD : (a.hash && hashPass(pass, a.salt) === a.hash);
    if (!ok) { fail(req); return res.status(401).json({ error: "Parol noto'g'ri" }); }
    res.json({ token: makeToken('a', 'admin', process.env.ADMIN_PASSWORD ? 'env' : a.salt) });
  });
  app.get('/api/admin/status', (req, res) => res.json({ setup: !process.env.ADMIN_PASSWORD && !P().admin.hash }));
  // Birinchi marta: admin parolini o'rnatish (faqat ADMIN_SETUP_CODE bilan — begona odam egallab olmasligi uchun)
  app.post('/api/admin/setup', (req, res) => {
    if (process.env.ADMIN_PASSWORD || P().admin.hash) return res.status(400).json({ error: "Admin paroli allaqachon o'rnatilgan" });
    const code = process.env.ADMIN_SETUP_CODE;
    if (!code || String(req.body.code || '') !== code) { if (!limited(req, res)) fail(req); return res.headersSent || res.status(403).json({ error: "O'rnatish kodi noto'g'ri" }); }
    const pass = String(req.body.password || '');
    if (pass.length < 8) return res.status(400).json({ error: "Parol kamida 8 belgidan iborat bo'lsin" });
    const a = P().admin;
    a.salt = crypto.randomBytes(8).toString('hex'); a.hash = hashPass(pass, a.salt);
    store.savePlatform();
    res.json({ token: makeToken('a', 'admin', a.salt) });
  });

  app.get('/api/admin/tenants', adminAuth, (req, res) => {
    const since = Date.now() - 30 * DAY;
    const list = Object.values(P().tenants).map((t) => {
      let stats = {};
      if (store.has(t.id)) store.run(t.id, () => {
        const d = store.get();
        const convs = Object.values(d.conversations || {}).filter((c) => c.createdAt > since && c.channel !== 'test');
        stats = {
          calls: convs.filter((c) => c.channel === 'call').length, chats: convs.filter((c) => c.channel !== 'call').length,
          bookings: (d.bookings || []).filter((b) => b.createdAt > since).length, orders: (d.orders || []).filter((o) => o.createdAt > since).length,
          customers: Object.keys(d.customers || {}).length, telegram: !!d.meta?.tgBot, ai: !!CFG.env('GEMINI_API_KEY'),
        };
      });
      return { id: t.id, name: t.name, phone: t.phone, createdAt: t.createdAt, lastLogin: t.lastLogin || null, kotibNumber: t.kotibNumber || '', blocked: !!t.blocked, plan: t.plan, ...status(t.id), stats };
    }).sort((a, b) => b.createdAt - a.createdAt);
    res.json(list);
  });
  // Obunani uzaytirish, bloklash, raqam biriktirish
  app.patch('/api/admin/tenants/:id', adminAuth, (req, res) => {
    const t = P().tenants[req.params.id];
    if (!t) return res.status(404).json({ error: 'Topilmadi' });
    const b = req.body || {};
    if (b.extendDays) { const base = Math.max(Date.now(), t.paidUntil || 0); t.paidUntil = base + Number(b.extendDays) * DAY; if (b.plan) t.plan = b.plan; }
    if (b.blocked !== undefined) t.blocked = !!b.blocked;
    if (b.trialDays !== undefined) t.trialUntil = Date.now() + Number(b.trialDays) * DAY;
    store.savePlatform();
    res.json({ ...t, hash: undefined, salt: undefined, ...status(t.id) });
  });
  app.get('/api/admin/payments', adminAuth, (req, res) => {
    const p = P();
    res.json(p.payments.slice(-300).reverse().map((x) => ({ ...x, tenantName: p.tenants[x.tenantId]?.name || '?', tenantPhone: p.tenants[x.tenantId]?.phone || '' })));
  });
  app.post('/api/admin/payments/:id', adminAuth, (req, res) => {
    const p = P(), pay = p.payments.find((x) => x.id === req.params.id);
    if (!pay) return res.status(404).json({ error: 'Topilmadi' });
    if (pay.status !== 'pending') return res.status(400).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });
    const t = p.tenants[pay.tenantId];
    if (req.body.approve) {
      pay.status = 'approved';
      if (t) { t.paidUntil = Math.max(Date.now(), t.paidUntil || 0) + pay.days * DAY; t.plan = pay.plan; }
    } else pay.status = 'rejected';
    pay.decidedAt = Date.now();
    store.savePlatform();
    // Biznes egasiga Telegram orqali xabar
    if (t && store.has(t.id)) store.run(t.id, () => C.tg(pay.status === 'approved' ? `✅ To'lov tasdiqlandi. Obuna ${new Date(t.paidUntil).toLocaleDateString('ru-RU')} gacha faol. Rahmat!` : "❌ To'lov tasdiqlanmadi. Iltimos, qo'llab-quvvatlash xizmatiga yozing."));
    res.json(pay);
  });
  app.get('/api/admin/settings', adminAuth, (req, res) => {
    const p = P();
    res.json({ plans: p.plans, trialDays: p.trialDays, payInfo: p.payInfo, keys: CFG.viewPlatform(), publicUrl: CFG.publicUrl() });
  });
  app.put('/api/admin/settings', adminAuth, (req, res) => {
    const p = P(), b = req.body || {};
    if (Array.isArray(b.plans)) p.plans = b.plans.filter((x) => String(x.name || '').trim() && Number(x.price) > 0 && Number(x.days) > 0).slice(0, 10)
      .map((x, i) => ({ id: String(x.id || 'p' + i).replace(/\W/g, '').slice(0, 20) || 'p' + i, name: String(x.name).slice(0, 60), price: Math.round(Number(x.price)), days: Math.round(Number(x.days)) }));
    if (b.trialDays !== undefined) p.trialDays = Math.max(0, Math.min(90, Number(b.trialDays) || 0));
    if (b.payInfo !== undefined) p.payInfo = String(b.payInfo).slice(0, 2000);
    if (b.keys) CFG.setPlatform(b.keys);
    store.savePlatform();
    res.json({ ok: true });
  });

  // Har kuni: obuna tugashiga 3 va 1 kun qolganda biznesga eslatma
  function billingTick() {
    for (const id of store.tenantIds()) {
      const s = status(id), t = P().tenants[id];
      if (!t || s.state === 'blocked') continue;
      for (const d of [3, 1, 0]) {
        const key = `${d}:${s.until}`;
        if (s.daysLeft === d && t.lastReminder !== key && (d > 0 || s.state === 'expired')) {
          t.lastReminder = key; store.savePlatform();
          store.run(id, () => C.tg(d > 0 ? `⏳ Kotib obunasi ${d} kundan keyin tugaydi. Uzluksiz ishlashi uchun ilovada "Sozlamalar → Obuna" bo'limidan to'lang.` : "⛔ Kotib obunasi tugadi — AI javob bermayapti, qo'ng'iroqlar operator raqamingizga o'tadi. Ilovada \"Sozlamalar → Obuna\" bo'limidan to'lang."));
        }
      }
    }
  }
  setInterval(() => { try { billingTick(); } catch (e) { console.error('Obuna:', e.message); } }, 60 * 60e3).unref();

  return { auth, adminAuth, validToken, withTenant, status, active };
}

module.exports = { mount, status, active, normPhone };
