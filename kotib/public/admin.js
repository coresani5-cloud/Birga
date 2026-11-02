// Kotib — platforma egasining admin paneli
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ');
const date = (t) => (t ? new Date(t).toLocaleDateString('ru-RU') : '—');
const STATE = { trial: ['Sinov', 'warn'], paid: ['To‘lagan', 'ok'], expired: ['Tugagan', 'bad'], blocked: ['Bloklangan', 'bad'] };
const KEYS = {
  PUBLIC_URL: 'Sayt manzili (https://...)', GEMINI_API_KEY: 'Gemini AI kaliti (erkin suhbat)', AISHA_API_KEY: "Aisha kaliti (o'zbekcha ovoz)",
  AISHA_VOICE_ID: 'Aisha ovoz ID', ELEVENLABS_API_KEY: 'ElevenLabs kaliti', ELEVENLABS_VOICE_ID: 'ElevenLabs ovoz ID', MUXLISA_API_KEY: 'Muxlisa kaliti',
  AZURE_SPEECH_KEY: 'Azure Speech kaliti', AZURE_SPEECH_REGION: 'Azure mintaqasi', TWILIO_ACCOUNT_SID: 'Twilio Account SID (platforma)',
  TWILIO_AUTH_TOKEN: 'Twilio Auth Token (platforma)', TWILIO_FROM: 'Twilio SMS raqami', TG_BOT_TOKEN: 'Telegram bot tokeni (umumiy — tavsiya etilmaydi)',
  ADMIN_TG_BOT_TOKEN: 'Sizga xabar beruvchi Telegram bot tokeni', ADMIN_TG_CHAT_ID: 'Sizning Telegram chat ID',
};
let token = localStorage.getItem('kotib_admin') || '';
let tenants = [], numbers = [], cfg = null;

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800); }
async function api(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('/login') && !url.includes('/setup')) { logout(); throw new Error('Kirish kerak'); }
  if (!r.ok) throw new Error(j.error || 'Xato ' + r.status);
  return j;
}
function logout() { token = ''; localStorage.removeItem('kotib_admin'); location.reload(); }
$('#logout').onclick = logout;

async function boot() {
  if (token) { try { await start(); return; } catch { /* */ } }
  const { setup } = await fetch('/api/admin/status').then((r) => r.json());
  $('#login').classList.remove('hidden');
  if (setup) { $('#setup-code').classList.remove('hidden'); $('#login-btn').textContent = "Parol o'rnatish"; }
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const j = setup ? await api('/api/admin/setup', { method: 'POST', body: { code: $('#setup-code').value, password: $('#login-pass').value } })
        : await api('/api/admin/login', { method: 'POST', body: { password: $('#login-pass').value } });
      token = j.token; localStorage.setItem('kotib_admin', token);
      $('#login').classList.add('hidden'); await start();
    } catch (err) { $('#login-err').textContent = err.message; }
  };
}
async function start() {
  await loadTenants();
  $('#app').classList.remove('hidden');
  loadPayments().catch(() => {});
}

$$('#tabs button').forEach((b) => b.onclick = () => {
  $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $$('.view').forEach((v) => v.classList.toggle('hidden', v.id !== 'v-' + b.dataset.v));
  ({ tenants: loadTenants, payments: loadPayments, numbers: loadNumbers, settings: loadSettings })[b.dataset.v]().catch((e) => toast(e.message));
});

// ---------- Bizneslar ----------
async function loadTenants() {
  tenants = await api('/api/admin/tenants');
  if (!numbers.length) numbers = await api('/api/admin/numbers').catch(() => []);
  const paid = tenants.filter((t) => t.state === 'paid'), trial = tenants.filter((t) => t.state === 'trial');
  $('#stats').innerHTML = [
    [tenants.length, 'Jami bizneslar'], [paid.length, "To'layotgan"], [trial.length, 'Sinovda'],
    [tenants.reduce((a, t) => a + (t.stats.calls || 0) + (t.stats.chats || 0), 0), 'Murojaatlar (30 kun)'],
  ].map(([v, k]) => `<div class="mini"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
  renderTenants();
}
function renderTenants() {
  const q = $('#q').value.trim().toLowerCase();
  const list = tenants.filter((t) => !q || (t.name + ' ' + t.phone).toLowerCase().includes(q));
  const numOpts = (cur) => '<option value="">Raqam biriktirish…</option>' + numbers.map((n) => `<option value="${n.sid}" ${n.number === cur ? 'selected' : ''}>${esc(n.number)}${n.tenantName && n.number !== cur ? ' (' + esc(n.tenantName) + ')' : ''}</option>`).join('');
  $('#tenants').innerHTML = list.length ? list.map((t) => `<div class="biz" data-id="${t.id}">
    <div class="top-line"><b>${esc(t.name)}</b> <span class="tag ${STATE[t.state]?.[1] || ''}">${STATE[t.state]?.[0] || t.state}</span>
      <span class="muted small">${t.state === 'expired' ? 'tugagan: ' + date(t.until) : t.daysLeft + ' kun qoldi'}</span></div>
    <div class="kv"><span>📞 ${esc(t.phone)}</span><span>🇺🇿 Ishxona: ${esc(t.uzNumber || '—')}</span><span>☎️ Twilio: ${esc(t.kotibNumber || '—')}</span><span>📅 ${date(t.createdAt)}</span><span>🔑 Oxirgi kirish: ${date(t.lastLogin)}</span></div>
    <div class="kv"><span>Qo'ng'iroq: ${t.stats.calls || 0}</span><span>Yozishma: ${t.stats.chats || 0}</span><span>Uchrashuv: ${t.stats.bookings || 0}</span><span>Zakaz: ${t.stats.orders || 0}</span><span>Mijozlar: ${t.stats.customers || 0}</span><span>${t.stats.telegram ? '✈️ Bot bor' : ''}</span></div>
    <div class="acts">
      <button class="btn small" data-ext="30">+30 kun</button><button class="btn small" data-ext="365">+1 yil</button>
      <button class="btn small ghost" data-reset>Parolni tiklash</button>
      <button class="btn small ${t.blocked ? 'ok' : 'danger'}" data-block="${t.blocked ? 0 : 1}">${t.blocked ? 'Blokdan chiqarish' : 'Bloklash'}</button>
      ${numbers.length ? `<select data-num>${numOpts(t.kotibNumber)}</select>` : ''}
    </div></div>`).join('') : '<div class="empty">Bizneslar yo‘q</div>';
  $$('#tenants .biz').forEach((el) => {
    const id = el.dataset.id;
    $$('[data-ext]', el).forEach((b) => b.onclick = async () => { await api(`/api/admin/tenants/${id}`, { method: 'PATCH', body: { extendDays: Number(b.dataset.ext) } }); toast('Obuna uzaytirildi'); loadTenants(); });
    $('[data-reset]', el).onclick = async () => {
      if (!confirm('Biznes egasiga yangi vaqtinchalik parol berasizmi? Eski parol ishlamay qoladi.')) return;
      try { const r = await api(`/api/admin/tenants/${id}/reset-password`, { method: 'POST' }); alert(`Yangi vaqtinchalik parol: ${r.password}\n\nUni biznes egasiga yuboring. U kirgach "Sozlamalar → Xavfsizlik"da o'z parolini o'rnatadi.`); } catch (e) { toast(e.message); }
    };
    const bl = $('[data-block]', el);
    bl.onclick = async () => { if (bl.dataset.block === '1' && !confirm('Biznesni bloklaysizmi? Kotibi ishlamay qoladi.')) return; await api(`/api/admin/tenants/${id}`, { method: 'PATCH', body: { blocked: bl.dataset.block === '1' } }); loadTenants(); };
    const sel = $('[data-num]', el);
    if (sel) sel.onchange = async () => { if (!sel.value) return; try { const r = await api(`/api/admin/tenants/${id}/number`, { method: 'POST', body: { sid: sel.value } }); toast(`✅ ${r.number} biriktirildi`); numbers = []; loadTenants(); } catch (e) { toast(e.message); } };
  });
}
$('#q').oninput = renderTenants;

// ---------- To'lovlar ----------
async function loadPayments() {
  const list = await api('/api/admin/payments');
  const pend = list.filter((p) => p.status === 'pending').length;
  $('#pend-badge').textContent = pend ? `(${pend})` : '';
  const st = { pending: ['Kutmoqda', 'warn'], approved: ['Tasdiqlangan', 'ok'], rejected: ['Rad etilgan', 'bad'] };
  $('#payments').innerHTML = list.length ? list.map((p) => `<div class="row" style="cursor:default" data-id="${p.id}">
    <div class="info"><b>${esc(p.tenantName)}</b> <span class="tag ${st[p.status][1]}">${st[p.status][0]}</span>
      <div class="muted small">${esc(p.tenantPhone)} · ${new Date(p.at).toLocaleString('ru-RU')} · ${esc(p.planName)}</div>
      ${p.note ? `<div class="small note">${esc(p.note)}</div>` : ''}</div>
    <div class="right">${money(p.amount)}<small>so‘m</small></div>
    ${p.status === 'pending' ? '<div class="acts" style="display:flex;gap:6px"><button class="btn small ok" data-ok>✓</button><button class="btn small danger" data-no>✕</button></div>' : ''}
  </div>`).join('') : '<div class="empty">To‘lovlar yo‘q</div>';
  $$('#payments [data-ok], #payments [data-no]').forEach((b) => b.onclick = async () => {
    const id = b.closest('.row').dataset.id, approve = b.hasAttribute('data-ok');
    if (!confirm(approve ? "To'lovni tasdiqlaysizmi? Obuna uzaytiriladi." : "To'lovni rad etasizmi?")) return;
    try { await api(`/api/admin/payments/${id}`, { method: 'POST', body: { approve } }); toast(approve ? 'Tasdiqlandi ✅' : 'Rad etildi'); loadPayments(); } catch (e) { toast(e.message); }
  });
}

// ---------- Raqamlar ----------
async function loadNumbers() {
  const base = location.origin;
  $('#sip-voice').textContent = base + '/sip/voice';
  $('#sip-status').textContent = base + '/sip/status';
  if (!tenants.length) tenants = await api('/api/admin/tenants');
  const uz = tenants.filter((t) => t.uzNumber);
  $('#uz-list').innerHTML = uz.length ? uz.map((t) => `<div class="row" style="cursor:default"><div class="info"><b>${esc(t.uzNumber)}</b><div class="muted small">${esc(t.name)}</div></div></div>`).join('') : '<div class="empty">Hali hech bir biznes o‘zbek raqamini kiritmagan</div>';
  try { numbers = await api('/api/admin/numbers'); } catch (e) { $('#numbers').innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  if (!tenants.length) tenants = await api('/api/admin/tenants');
  const opts = (cur) => '<option value="">— biznes tanlang —</option>' + tenants.map((t) => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  $('#numbers').innerHTML = numbers.length ? numbers.map((n) => `<div class="row" style="cursor:default" data-sid="${n.sid}">
    <div class="info"><b>${esc(n.number)}</b><div class="muted small">${esc(n.name)}</div></div>
    <select style="width:auto">${opts(n.tenantId)}</select></div>`).join('') : '<div class="empty">Raqamlar yo‘q. "Sozlamalar → Umumiy kalitlar"ga Twilio Account SID va Auth Token kiriting, so‘ng Twilio saytida raqam sotib oling.</div>';
  $$('#numbers select').forEach((s) => s.onchange = async () => {
    if (!s.value) return;
    try { const r = await api(`/api/admin/tenants/${s.value}/number`, { method: 'POST', body: { sid: s.closest('.row').dataset.sid } }); toast(`✅ ${r.number} biriktirildi`); loadNumbers(); } catch (e) { toast(e.message); }
  });
}

// ---------- Sozlamalar ----------
async function loadSettings() {
  cfg = await api('/api/admin/settings');
  renderPlans();
  $('#trial').value = cfg.trialDays;
  $('#payinfo').value = cfg.payInfo;
  $('#support').value = cfg.support || '';
  $('#sipdomain').value = cfg.sipDomain || '';
  $('#admin-pass-card').classList.toggle('hidden', cfg.adminEnv);
  $('#keys').innerHTML = cfg.keys.map((k) => `<label>${esc(KEYS[k.key] || k.key)} ${k.set ? '<span class="tag ok">bor</span>' : ''}${k.env ? ' <span class="tag">server</span>' : ''}
    <input data-key="${k.key}" ${k.secret ? 'type="password" autocomplete="off"' : ''} value="${esc(k.value)}" ${k.env ? 'disabled placeholder="Server sozlamasida berilgan"' : ''}></label>`).join('');
}
function renderPlans() {
  $('#plans').innerHTML = cfg.plans.map((p, i) => `<div class="svc" data-i="${i}"><div class="row4">
    <label>Nomi<input class="pn" value="${esc(p.name)}"></label><label>Narxi (so‘m)<input class="pp" type="number" value="${p.price}"></label>
    <label>Kun<input class="pd" type="number" value="${p.days}"></label><button class="btn small danger pdel">✕</button></div></div>`).join('');
  $$('.pdel').forEach((b) => b.onclick = () => { collectPlans(); cfg.plans.splice(Number(b.closest('.svc').dataset.i), 1); renderPlans(); });
}
function collectPlans() { cfg.plans = $$('#plans .svc').map((el, i) => ({ id: cfg.plans[i]?.id || 'p' + Date.now().toString(36) + i, name: $('.pn', el).value, price: Number($('.pp', el).value), days: Number($('.pd', el).value) })); }
$('#add-plan').onclick = () => { collectPlans(); cfg.plans.push({ name: '', price: 0, days: 30 }); renderPlans(); };
$('#save').onclick = async () => {
  collectPlans();
  const keys = {}; $$('#keys input:not([disabled])').forEach((i) => keys[i.dataset.key] = i.value);
  try { await api('/api/admin/settings', { method: 'PUT', body: { plans: cfg.plans, trialDays: Number($('#trial').value), payInfo: $('#payinfo').value, support: $('#support').value, sipDomain: $('#sipdomain').value, keys } }); toast('Saqlandi ✅'); loadSettings(); } catch (e) { toast(e.message); }
};

$('#admin-pass-btn').onclick = async () => {
  try { const r = await api('/api/admin/password', { method: 'POST', body: { password: $('#admin-pass').value } }); token = r.token; localStorage.setItem('kotib_admin', token); $('#admin-pass').value = ''; toast('Parol almashtirildi ✅'); } catch (e) { toast(e.message); }
};
// Raqamlar: Twilio ulanmagan bo'lsa — yo'riqnoma
const _loadNumbers = loadNumbers;
loadNumbers = async () => { await _loadNumbers(); if (!numbers.length && !$('#numbers .empty')) $('#numbers').innerHTML = '<div class="empty">Raqamlar yo‘q. "Sozlamalar → Umumiy kalitlar"ga Twilio Account SID va Auth Token kiriting.</div>'; };

boot();
