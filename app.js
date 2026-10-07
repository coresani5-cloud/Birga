/* Birga — klient ilovasi (v2) */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls = '') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};
const PN = window.libphonenumber;
const isTouch = () => matchMedia('(pointer:coarse)').matches;

const S = {
  token: store.get('birga_token'),
  me: null,
  chats: new Map(), msgs: new Map(), users: new Map(),
  current: null, replyTo: null, typing: new Map(),
  config: {}, socket: null,
};

/* ---------- yordamchilar ---------- */
function toast(text, ms = 2600) {
  const el = $('#toast'); el.textContent = text; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
async function api(path, opts = {}) {
  const headers = {};
  if (S.token) headers.Authorization = 'Bearer ' + S.token;
  let body = opts.body;
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify({ lang: LANG, ...body }); }
  let r;
  try { r = await fetch(path, { method: opts.method || (body ? 'POST' : 'GET'), headers, body }); }
  catch { throw new Error(t('net_err')); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && S.token) { toast(t('session_end')); logout(true); throw new Error(t('session_end')); }
  if (!r.ok) { const e = new Error(j.error || t('err')); e.data = j; throw e; }
  return j;
}
function uploadFile(file, onProgress, kind = '') {
  return new Promise((res, rej) => {
    const fd = new FormData(); fd.append('file', file, file.name || 'file');
    const x = new XMLHttpRequest();
    x.open('POST', '/api/upload?kind=' + kind); x.setRequestHeader('Authorization', 'Bearer ' + S.token);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    x.onload = () => (x.status < 300 ? res(JSON.parse(x.responseText)) : rej(new Error(t('upload_fail'))));
    x.onerror = () => rej(new Error(t('net_err')));
    x.send(fd);
  });
}
const GRADS = [['#27B8A0', '#4C8DC4'], ['#4C8DC4', '#7D58C6'], ['#7D58C6', '#C95BB5'], ['#F59E0B', '#EF6B4A'], ['#22C3D6', '#3B82F6'], ['#10B981', '#27B8A0'], ['#EC6B9A', '#7D58C6']];
function avatar(u, cls = '') {
  if (!u) return `<div class="av ${cls}"></div>`;
  if (u.self) return `<div class="av ${cls}" style="background:var(--grad)">${icon('bookmark')}</div>`;
  const on = u.online && u.id !== S.me?.id ? ' online' : '';
  if (u.avatar) return `<div class="av ${cls}${on}" style="background-image:url('${esc(u.avatar)}')"></div>`;
  const g = GRADS[(u.id || 0) % GRADS.length];
  const ini = (u.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="av ${cls}${on}" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${esc(ini)}</div>`;
}
const pad = (n) => String(n).padStart(2, '0');
const fmtDur = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const fmtTime = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function fmtDay(ts) {
  const d = new Date(ts), n = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 864e5);
  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
  return I18N[LANG].fmt_day(d.getDate(), t('months')[d.getMonth()], d.getFullYear() !== n.getFullYear() ? d.getFullYear() : '');
}
function fmtListTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), n = new Date();
  if (d.toDateString() === n.toDateString()) return fmtTime(ts);
  if (n - d < 6 * 864e5) return t('days')[d.getDay()];
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}
function lastSeen(u) {
  if (!u) return '';
  if (u.online) return t('online');
  if (!u.last_seen) return t('seen_recently');
  const m = Math.floor((Date.now() - u.last_seen) / 60000);
  if (m < 1) return t('seen_now');
  if (m < 60) return t('seen_min', { n: m });
  if (new Date(u.last_seen).toDateString() === new Date().toDateString()) return t('seen_today', { t: fmtTime(u.last_seen) });
  return t('seen_date', { d: fmtDay(u.last_seen), t: fmtTime(u.last_seen) });
}
function fmtPhone(p) {
  if (!p) return '';
  try { return PN.parsePhoneNumberFromString(p)?.formatInternational() || p; } catch { return p; }
}
const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
function preview(m) {
  if (!m) return '';
  if (m.deleted) return t('deleted');
  const tag = (x) => `<span class="tag">${x}</span>`;
  switch (m.type) {
    case 'image': return tag(t('t_photo')) + (m.text ? ', ' + esc(m.text) : '');
    case 'video': return tag(t('t_video')) + (m.text ? ', ' + esc(m.text) : '');
    case 'voice': return tag(t('t_voice')) + ' ' + fmtDur(m.duration);
    case 'round': return tag(t('t_round')) + ' ' + fmtDur(m.duration);
    case 'file': return tag(t('t_file')) + ' ' + esc(m.meta?.name || '');
    case 'call': return tag(m.meta?.video ? t('t_vcall') : t('t_call'));
    default: return esc(m.text);
  }
}
const stripTags = (h) => h.replace(/<[^>]+>/g, '');

/* ---------- mavzu va til ---------- */
const THEMES = ['auto', 'light', 'dark'];
function applyTheme(th) {
  if (th === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = th;
  $('#theme-label').textContent = t('theme_' + th);
  store.set('birga_theme', th);
}
function renderLangSwitch() {
  $('#lang-switch').innerHTML = Object.keys(I18N).map((l) => `<button type="button" data-l="${l}" class="${l === LANG ? 'on' : ''}">${l.toUpperCase()}</button>`).join('');
  $('#lang-label').textContent = LANG_NAMES[LANG];
}
$('#lang-switch').onclick = (e) => { const b = e.target.closest('[data-l]'); if (b) changeLang(b.dataset.l); };
function changeLang(l) {
  setLang(l); renderLangSwitch(); applyTheme(store.get('birga_theme') || 'auto');
  renderCountry(); updateResend();
  if (S.me && S.token) { api('/api/profile/lang', { body: { lang: l } }).catch(() => {}); renderDrawer(); renderChatList(); renderHeader(); if (S.current) renderMessages(); }
}
applyI18n(); renderLangSwitch(); applyTheme(store.get('birga_theme') || 'auto');

/* ======================= TELEFON RAQAM (barcha davlatlar) ======================= */
const TZ_COUNTRY = {
  'Asia/Tashkent': 'UZ', 'Asia/Samarkand': 'UZ', 'Europe/Moscow': 'RU', 'Asia/Almaty': 'KZ', 'Asia/Qyzylorda': 'KZ', 'Asia/Aqtobe': 'KZ', 'Asia/Bishkek': 'KG',
  'Asia/Dushanbe': 'TJ', 'Asia/Ashgabat': 'TM', 'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Europe/Minsk': 'BY', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
  'Europe/Istanbul': 'TR', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Seoul': 'KR', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Kolkata': 'IN', 'Europe/London': 'GB',
  'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Warsaw': 'PL', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Los_Angeles': 'US', 'America/Denver': 'US', 'America/Toronto': 'CA', 'Asia/Kabul': 'AF', 'Asia/Karachi': 'PK', 'Asia/Tehran': 'IR', 'Asia/Jakarta': 'ID',
};
function detectCountry() {
  const saved = store.get('birga_country'); if (saved && PN.getCountries().includes(saved)) return saved;
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]; } catch {}
  for (const l of navigator.languages || []) { const m = String(l).match(/-([A-Z]{2})$/i); if (m && PN.getCountries().includes(m[1].toUpperCase())) return m[1].toUpperCase(); }
  return 'UZ';
}
const flag = (cc) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
function countryName(cc) {
  for (const l of [LANG, 'en']) { try { const n = new Intl.DisplayNames([l], { type: 'region' }).of(cc); if (n && n !== cc) return n; } catch {} }
  return cc;
}
let EXAMPLES = null;
const auth = { country: detectCountry(), phone: null, timer: null, wait: 0 };
function renderCountry() {
  const cc = auth.country;
  $('#country-flag').textContent = flag(cc);
  $('#country-name').textContent = countryName(cc);
  $('#dial').textContent = '+' + PN.getCountryCallingCode(cc);
  let ph = '';
  try { if (EXAMPLES) ph = PN.getExampleNumber(cc, EXAMPLES)?.formatNational() || ''; } catch {}
  $('#phone').placeholder = ph;
}
function setCountry(cc) { auth.country = cc; store.set('birga_country', cc); renderCountry(); $('#phone').value = ''; }
renderCountry();
fetch('/vendor/phone-examples.json').then((r) => r.json()).then((j) => { EXAMPLES = j; renderCountry(); }).catch(() => {});

function formatPhoneInput() {
  const el = $('#phone');
  const raw = el.value;
  $('.phone-field').classList.remove('bad');
  if (raw.trim().startsWith('+')) { // to'liq xalqaro raqam kiritilsa, davlat avtomatik aniqlanadi
    const p = PN.parsePhoneNumberFromString(raw.replace(/[^\d+]/g, ''));
    if (p?.country) { auth.country = p.country; store.set('birga_country', p.country); renderCountry(); el.value = new PN.AsYouType(p.country).input(p.nationalNumber); }
    return;
  }
  const digits = raw.replace(/\D/g, '').slice(0, 17);
  el.value = digits ? new PN.AsYouType(auth.country).input(digits) : '';
}
$('#phone').addEventListener('input', formatPhoneInput);

$('#country-btn').onclick = () => {
  const list = PN.getCountries().map((cc) => ({ cc, name: countryName(cc), code: PN.getCountryCallingCode(cc) })).sort((a, b) => a.name.localeCompare(b.name, LANG));
  modal(`<h3>${t('country')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="search"><svg><use href="#i-search"/></svg><input id="cs-q" placeholder="${esc(t('search_country'))}"></div>
    <ul class="clist" id="cs-list"></ul>`);
  const draw = (q = '') => {
    q = q.trim().toLowerCase().replace(/^\+/, '');
    $('#cs-list').innerHTML = list.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.startsWith(q) || c.cc.toLowerCase() === q)
      .map((c) => `<li data-cc="${c.cc}" class="${c.cc === auth.country ? 'on' : ''}"><span class="flag">${flag(c.cc)}</span><span class="n">${esc(c.name)}</span><span class="c">+${c.code}</span></li>`).join('');
  };
  draw(); $('#cs-q').oninput = (e) => draw(e.target.value);
  if (!isTouch()) $('#cs-q').focus();
  $('#cs-list').onclick = (e) => { const li = e.target.closest('[data-cc]'); if (li) { closeModal(); setCountry(li.dataset.cc); $('#phone').focus(); } };
  $('#cs-list .on')?.scrollIntoView({ block: 'center' });
};

/* ======================= KIRISH ======================= */
function showStep(name) {
  $$('.step').forEach((s) => s.classList.add('hidden'));
  $('#step-' + name).classList.remove('hidden');
  setTimeout(() => { if (!$('#step-' + name).contains(document.activeElement)) ({ phone: $('#phone'), code: $('#code-boxes input'), profile: $('#reg-name') }[name])?.focus(); }, 60);
}
$$('[data-back]').forEach((b) => (b.onclick = () => showStep(b.dataset.back)));

function fullPhone() {
  const national = $('#phone').value.replace(/\D/g, '');
  const p = PN.parsePhoneNumberFromString(national, auth.country);
  return p && p.isValid() ? p.number : null;
}
async function sendCode(isResend) {
  const phone = isResend ? auth.phone : fullPhone();
  if (!phone) { $('.phone-field').classList.add('bad'); toast(t('enter_full_phone')); return; }
  const btn = $('#btn-send-code'); btn.disabled = true;
  try {
    const r = await api('/api/auth/send-code', { body: { phone } });
    auth.phone = r.phone;
    $('#code-phone').textContent = fmtPhone(r.phone);
    $$('#code-boxes input').forEach((i) => (i.value = '')); $('#code-err').textContent = '';
    if (r.devCode) { $('#dev-code').innerHTML = `${esc(t('dev_code'))} <b>${r.devCode}</b>`; $('#dev-code').classList.remove('hidden'); }
    else $('#dev-code').classList.add('hidden');
    showStep('code'); startResendTimer(r.timeout || 60);
    if (isResend) toast(t('code_resent'));
    tryWebOTP();
  } catch (e) {
    if (e.data?.wait) { auth.phone = e.data.phone || phone; $('#code-phone').textContent = fmtPhone(auth.phone); showStep('code'); startResendTimer(e.data.wait); }
    else toast(e.message, 3500);
  } finally { btn.disabled = false; }
}
$('#step-phone').onsubmit = (e) => { e.preventDefault(); sendCode(); };
$('#btn-resend').onclick = () => sendCode(true);
function updateResend() {
  const b = $('#btn-resend');
  if (auth.wait > 0) { b.disabled = true; b.textContent = t('resend_in', { t: fmtDur(auth.wait) }); }
  else { b.disabled = false; b.textContent = t('resend'); }
}
function startResendTimer(sec) {
  clearInterval(auth.timer); auth.wait = sec; updateResend();
  auth.timer = setInterval(() => { auth.wait--; updateResend(); if (auth.wait <= 0) clearInterval(auth.timer); }, 1000);
}

const boxes = $$('#code-boxes input');
function fillCode(v) { v.split('').slice(0, 5).forEach((c, k) => boxes[k] && (boxes[k].value = c)); if (v.length >= 5) verifyCode(v.slice(0, 5)); else boxes[v.length]?.focus(); }
boxes.forEach((inp, i) => {
  inp.addEventListener('input', () => {
    const v = inp.value.replace(/\D/g, '');
    if (v.length > 1) return fillCode(v);
    inp.value = v; if (v && boxes[i + 1]) boxes[i + 1].focus();
    const code = boxes.map((b) => b.value).join('');
    if (code.length === 5) verifyCode(code);
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && boxes[i - 1]) boxes[i - 1].focus(); });
  inp.addEventListener('paste', (e) => { e.preventDefault(); fillCode((e.clipboardData.getData('text') || '').replace(/\D/g, '')); });
});
// Android Chrome: SMS'dan kodni avtomatik o'qish (WebOTP)
let otpAbort;
async function tryWebOTP() {
  if (!('OTPCredential' in window)) return;
  try {
    otpAbort?.abort(); otpAbort = new AbortController(); setTimeout(() => otpAbort.abort(), 180000);
    const o = await navigator.credentials.get({ otp: { transport: ['sms'] }, signal: otpAbort.signal });
    if (o?.code) fillCode(o.code);
  } catch {}
}
let verifying = false;
async function verifyCode(code) {
  if (verifying) return; verifying = true;
  $('#code-err').textContent = '';
  try {
    const r = await api('/api/auth/verify', { body: { phone: auth.phone, code } });
    S.token = r.token; store.set('birga_token', r.token); S.me = r.user;
    clearInterval(auth.timer); otpAbort?.abort();
    if (r.isNew) showStep('profile'); else startApp();
  } catch (e) {
    $('#code-err').textContent = e.message;
    const cb = $('#code-boxes'); cb.classList.remove('shake'); void cb.offsetWidth; cb.classList.add('shake');
    boxes.forEach((b) => (b.value = '')); boxes[0].focus();
  } finally { verifying = false; }
}

let regAvatarFile = null;
$('#reg-avatar').onchange = (e) => {
  regAvatarFile = e.target.files[0];
  if (regAvatarFile) { const p = $('#reg-avatar-preview'); p.style.backgroundImage = `url(${URL.createObjectURL(regAvatarFile)})`; p.innerHTML = ''; }
};
$('#step-profile').onsubmit = async (e) => {
  e.preventDefault(); $('#reg-err').textContent = '';
  try {
    S.me = await api('/api/profile', { body: { name: $('#reg-name').value, username: $('#reg-username').value } });
    if (regAvatarFile) { const fd = new FormData(); fd.append('file', await compressImage(regAvatarFile, 800)); S.me = await api('/api/profile/avatar', { body: fd }); }
    startApp();
  } catch (err) { $('#reg-err').textContent = err.message; }
};

async function logout(silent) {
  if (!silent && !confirm(t('confirm_logout'))) return;
  try { const reg = await navigator.serviceWorker?.getRegistration(); const sub = await reg?.pushManager?.getSubscription(); if (sub) { await api('/api/push/unsubscribe', { body: { endpoint: sub.endpoint } }).catch(() => {}); await sub.unsubscribe(); } } catch {}
  store.del('birga_token'); S.token = null; S.socket?.disconnect(); location.href = '/';
}

/* ======================= ILOVA ======================= */
async function boot() {
  try { S.config = await api('/api/config'); } catch {}
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  if (!S.token) { $('#auth').classList.remove('hidden'); showStep('phone'); return; }
  try {
    S.me = await api('/api/me');
    if (!S.me.name) { $('#auth').classList.remove('hidden'); showStep('profile'); return; }
    if (S.me.lang && S.me.lang !== LANG && !store.get('birga_lang')) changeLang(S.me.lang);
    startApp();
  } catch { $('#auth').classList.remove('hidden'); showStep('phone'); }
}

async function startApp() {
  $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  S.users.set(S.me.id, S.me);
  renderDrawer();
  await loadChats().catch(() => {});
  connectSocket();
  setupPush(false);
  const want = new URLSearchParams(location.search).get('chat');
  if (want && S.chats.has(+want)) openChat(+want);
  if (location.search) history.replaceState(null, '', '/');
}

async function loadChats() {
  const list = await api('/api/chats');
  list.forEach(upsertChat); renderChatList();
}
function upsertChat(c) {
  if (c.peer) { c.peer.self = c.self; S.users.set(c.peer.id, { ...S.users.get(c.peer.id), ...c.peer }); }
  S.chats.set(c.id, c);
}

function connectSocket() {
  const s = io({ auth: { token: S.token }, transports: ['websocket', 'polling'] });
  S.socket = s;
  s.on('connect', () => { $('#conn-bar').classList.add('hidden'); if (S.current) loadMessages(S.current); loadChats().catch(() => {}); });
  s.on('disconnect', () => $('#conn-bar').classList.remove('hidden'));
  s.on('connect_error', (e) => { if (e.message === 'unauthorized') logout(true); $('#conn-bar').classList.remove('hidden'); });

  s.on('message:new', ({ message, chat }) => {
    upsertChat(chat); addMessage(message); renderChatList();
    if (message.sender_id !== S.me.id) {
      S.typing.delete(message.chat_id);
      if (S.current === message.chat_id && !document.hidden) markRead(); else notify(chat, message);
    }
  });
  s.on('message:deleted', ({ id, chatId }) => {
    const m = S.msgs.get(chatId)?.find((x) => x.id === id);
    if (m) { m.deleted = true; m.text = ''; m.file = null; }
    const c = S.chats.get(chatId); if (c?.last?.id === id) c.last.deleted = true;
    if (S.current === chatId) renderMessages(); renderChatList();
  });
  s.on('chat:read', ({ chatId, messageId }) => {
    const c = S.chats.get(chatId); if (!c) return;
    c.peerReadId = Math.max(c.peerReadId || 0, messageId);
    renderChatList(); if (S.current === chatId) $$('.msg.out').forEach(updateTicks);
  });
  s.on('user:update', (u) => {
    S.users.set(u.id, { ...S.users.get(u.id), ...u });
    S.chats.forEach((c) => { if (c.peer?.id === u.id) c.peer = { ...c.peer, ...u, self: c.self }; });
    if (u.id === S.me.id) { S.me = { ...S.me, ...u }; renderDrawer(); }
    renderChatList(); renderHeader();
  });
  s.on('typing', ({ chatId, kind }) => {
    S.typing.set(chatId, { kind, until: Date.now() + 4000 });
    renderChatList(); renderHeader();
    setTimeout(() => { renderChatList(); renderHeader(); }, 4100);
  });
  Call.bind(s);
}

/* ---------- bildirishnomalar ---------- */
let audioCtx;
function ctx() { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
function beep(freqs = [880, 1320], dur = 0.09, vol = 0.07) {
  try {
    const a = ctx(); let tt = a.currentTime;
    freqs.forEach((f) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f;
      g.gain.setValueAtTime(vol, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur); o.connect(g).connect(a.destination); o.start(tt); o.stop(tt + dur); tt += dur; });
  } catch {}
}
function notify(chat, m) {
  beep();
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(chat.peer?.name || 'Birga', { body: stripTags(preview(m)), icon: chat.peer?.avatar || '/icons/icon-192.png', tag: 'chat' + chat.id });
      n.onclick = () => { window.focus(); openChat(chat.id); n.close(); };
    } catch {}
  }
}
function b64ToU8(b) { const p = '='.repeat((4 - (b.length % 4)) % 4); const r = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }
async function setupPush(ask) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !S.config.pushKey) return;
  let perm = Notification.permission;
  if (perm === 'default' && !ask) { if (!store.get('birga_notif_dismiss')) $('#notif-bar').classList.remove('hidden'); return; }
  if (perm === 'default') perm = await Notification.requestPermission();
  $('#notif-bar').classList.add('hidden');
  if (perm !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(S.config.pushKey) });
    await api('/api/push/subscribe', { body: sub.toJSON() });
    if (ask) toast(t('notif_on'));
  } catch (e) { console.warn('push', e); }
}
$('#notif-enable').onclick = () => setupPush(true);
$('#notif-close').onclick = () => { $('#notif-bar').classList.add('hidden'); store.set('birga_notif_dismiss', '1'); };
navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.openChat && S.chats.has(+e.data.openChat)) openChat(+e.data.openChat); });

/* ---------- yon menyu ---------- */
function renderDrawer() {
  $('#drawer-me').innerHTML = `${avatar(S.me)}<b>${esc(S.me.name)}</b><span>${esc(fmtPhone(S.me.phone))}</span>`;
  $('#lang-label').textContent = LANG_NAMES[LANG];
}
$('#btn-menu').onclick = () => $('#drawer').classList.add('open');
$('#drawer').onclick = (e) => { if (e.target.id === 'drawer') $('#drawer').classList.remove('open'); };
$$('.drawer-item').forEach((b) => (b.onclick = () => {
  const a = b.dataset.act;
  if (a === 'theme') { const cur = store.get('birga_theme') || 'auto'; applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % 3]); return; }
  $('#drawer').classList.remove('open');
  if (a === 'logout') logout();
  if (a === 'profile') openProfileModal();
  if (a === 'saved') startChatWith(S.me.id);
  if (a === 'lang') {
    modal(`<h3>${t('language')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="lang-opts">${Object.keys(I18N).map((l) => `<button data-l="${l}" class="${l === LANG ? 'on' : ''}">${LANG_NAMES[l]}<span>${l.toUpperCase()}</span></button>`).join('')}</div>`);
    $('.lang-opts').onclick = (e) => { const x = e.target.closest('[data-l]'); if (x) { changeLang(x.dataset.l); closeModal(); } };
  }
}));

/* ---------- suhbatlar ro'yxati ---------- */
function typingText(chatId) {
  const ty = S.typing.get(chatId);
  if (!ty || ty.until < Date.now()) return null;
  return t({ text: 'typing', voice: 'rec_voice', round: 'rec_round', file: 'sending_file' }[ty.kind] || 'typing');
}
function renderChatList() {
  const q = $('#chat-search').value.trim().toLowerCase();
  const list = [...S.chats.values()]
    .filter((c) => c.last || c.id === S.current)
    .filter((c) => !q || (c.self ? t('saved') : (c.peer?.name || '') + ' ' + (c.peer?.username || '')).toLowerCase().includes(q))
    .sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0));
  $('#list-empty').classList.toggle('hidden', list.length > 0 || !!q);
  $('#chat-list').innerHTML = list.map((c) => {
    const p = S.users.get(c.peer?.id) || c.peer;
    const tt = typingText(c.id);
    const mine = c.last && c.last.sender_id === S.me.id && !c.self;
    const ticks = mine ? icon(c.peerReadId >= c.last.id ? 'check2' : 'check') : '';
    return `<li class="chat-item${c.id === S.current ? ' active' : ''}" data-id="${c.id}">
      ${avatar({ ...p, self: c.self })}
      <div class="ci-body">
        <div class="ci-row"><span class="ci-name">${esc(c.self ? t('saved') : p?.name)}</span><span class="ci-time">${ticks}${fmtListTime(c.last?.created_at)}</span></div>
        <div class="ci-row"><span class="ci-sub">${tt ? `<span class="tag">${tt}</span>` : (mine ? `<span class="tag">${t('you')}:</span> ` : '') + preview(c.last)}</span>
        ${c.unread && c.id !== S.current ? `<span class="badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}</div>
      </div></li>`;
  }).join('');
}
$('#chat-list').onclick = (e) => { const li = e.target.closest('.chat-item'); if (li) openChat(+li.dataset.id); };
$('#chat-search').oninput = renderChatList;

/* ---------- modal ---------- */
function modal(html) { $('#modal-card').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); }
$('#modal').onclick = (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); };

$('#btn-new').onclick = () => {
  modal(`<h3>${t('new_chat')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="search"><svg><use href="#i-search"/></svg><input id="ns-q" placeholder="${esc(t('search_people'))}"></div>
    <div class="sub">${t('results')}</div><div id="ns-res"><div class="result" data-uid="${S.me.id}">${avatar({ self: true }, 'sm')}<div><b>${t('saved')}</b><small>${t('saved_hint')}</small></div></div></div>`);
  const inp = $('#ns-q'); if (!isTouch()) inp.focus();
  let tm;
  inp.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => {
    const q = inp.value.trim(); if (!q) return;
    const res = await api('/api/users/search?q=' + encodeURIComponent(q)).catch(() => []);
    $('#ns-res').innerHTML = res.length ? res.map((u) => `<div class="result" data-uid="${u.id}">${avatar(u, 'sm')}<div><b>${esc(u.name)}</b><small>${u.username ? '@' + esc(u.username) : esc(lastSeen(u))}</small></div></div>`).join('')
      : `<p class="muted" style="text-align:center">${esc(t('not_found_user'))}</p>`;
  }, 300); };
  $('#ns-res').onclick = (e) => { const r = e.target.closest('.result'); if (r) { closeModal(); startChatWith(+r.dataset.uid); } };
};
async function startChatWith(uid) {
  try { const c = await api('/api/chats', { body: { userId: uid } }); upsertChat(c); renderChatList(); openChat(c.id); } catch (e) { toast(e.message); }
}

function openProfileModal(user) {
  const isMe = !user || user.id === S.me.id;
  const u = isMe ? S.me : user;
  if (isMe) {
    modal(`<h3>${t('profile')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
      <div class="profile-top"><label>${avatar(u)}<input type="file" accept="image/*" id="pf-av" hidden></label><small class="muted">${t('change_photo')}</small></div>
      <input class="field" id="pf-name" value="${esc(u.name)}" placeholder="${esc(t('name'))}">
      <div class="field-wrap"><span>@</span><input class="field" id="pf-user" value="${esc(u.username || '')}" placeholder="username" autocapitalize="off"></div>
      <input class="field" id="pf-bio" value="${esc(u.bio || '')}" placeholder="${esc(t('about'))}" maxlength="140">
      <div class="info-row"><small>${t('phone')}</small>${esc(fmtPhone(u.phone))}</div>
      <p class="err" id="pf-err"></p>
      <button class="btn-primary" id="pf-save">${t('save')}</button>`);
    $('#pf-av').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('file', await compressImage(f, 800));
      S.me = await api('/api/profile/avatar', { body: fd }); renderDrawer(); closeModal(); openProfileModal(); };
    $('#pf-save').onclick = async () => {
      try { S.me = await api('/api/profile', { body: { name: $('#pf-name').value, username: $('#pf-user').value, bio: $('#pf-bio').value } }); renderDrawer(); closeModal(); toast(t('saved_ok')); }
      catch (e) { $('#pf-err').textContent = e.message; }
    };
  } else {
    modal(`<h3>${t('info')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
      <div class="profile-top">${avatar(u)}<h3 style="justify-content:center;margin:6px 0 2px">${esc(u.name)}</h3><small class="muted">${esc(lastSeen(u))}</small></div>
      ${u.username ? `<div class="info-row"><small>Username</small>@${esc(u.username)}</div>` : ''}
      ${u.country ? `<div class="info-row"><small>${t('country')}</small>${flag(u.country)} ${esc(countryName(u.country))}</div>` : ''}
      ${u.bio ? `<div class="info-row"><small>${t('bio')}</small>${esc(u.bio)}</div>` : ''}
      <div style="display:flex;gap:10px"><button class="btn-primary" id="pi-call">${t('call')}</button><button class="btn-primary" id="pi-vcall">${t('video')}</button></div>`);
    $('#pi-call').onclick = () => { closeModal(); Call.start(u, false); };
    $('#pi-vcall').onclick = () => { closeModal(); Call.start(u, true); };
  }
}

/* ======================= SUHBAT ======================= */
function currentPeer() { const c = S.chats.get(S.current); return c && (S.users.get(c.peer.id) || c.peer); }

async function openChat(id) {
  const first = S.current !== id;
  S.current = id; S.replyTo = null; $('#reply-bar').classList.add('hidden');
  ['#chat-head', '#messages', '#composer'].forEach((s) => $(s).classList.remove('hidden'));
  $('#chat-empty').classList.add('hidden');
  const c = S.chats.get(id);
  $('#btn-audio-call').classList.toggle('hidden', !!c?.self);
  $('#btn-video-call').classList.toggle('hidden', !!c?.self);
  if (first && matchMedia('(max-width:760px)').matches && !$('#app').classList.contains('show-chat')) history.pushState({ chat: id }, '');
  $('#app').classList.add('show-chat');
  renderHeader(); renderChatList();
  if (first) $('#messages').innerHTML = '';
  await loadMessages(id);
  if (!isTouch()) $('#text').focus();
}
function closeChat() { $('#app').classList.remove('show-chat'); }
$('#btn-back').onclick = () => (history.state?.chat ? history.back() : closeChat());
window.addEventListener('popstate', () => closeChat());

function renderHeader() {
  const c = S.chats.get(S.current); if (!c) return;
  const p = currentPeer();
  const tt = typingText(c.id);
  const st = c.self ? '' : tt || lastSeen(p);
  $('#peer-info').innerHTML = `${avatar({ ...p, self: c.self }, 'sm')}<div style="min-width:0"><b>${esc(c.self ? t('saved') : p.name)}</b><span class="${tt || p.online ? 'on' : ''}">${esc(st)}</span></div>`;
}
$('#peer-info').onclick = () => { const c = S.chats.get(S.current); if (c && !c.self) openProfileModal(currentPeer()); };
$('#btn-audio-call').onclick = () => Call.start(currentPeer(), false);
$('#btn-video-call').onclick = () => Call.start(currentPeer(), true);

async function loadMessages(id) {
  const list = await api(`/api/chats/${id}/messages`).catch(() => null);
  if (!list || S.current !== id) return;
  const pending = (S.msgs.get(id) || []).filter((m) => m.pending);
  S.msgs.set(id, [...list, ...pending]);
  renderMessages(true); markRead();
}

$('#messages').addEventListener('scroll', async (e) => {
  const el = e.target;
  if (el.scrollTop > 80 || S.loadingOld || S.noMore?.[S.current]) return;
  const arr = S.msgs.get(S.current); const first = arr?.find((m) => m.id); if (!first) return;
  S.loadingOld = true;
  const older = await api(`/api/chats/${S.current}/messages?before=${first.id}`).catch(() => []);
  S.loadingOld = false;
  if (!older.length) { (S.noMore ||= {})[S.current] = true; return; }
  const h = el.scrollHeight;
  S.msgs.set(S.current, [...older, ...arr]); renderMessages();
  el.scrollTop = el.scrollHeight - h;
});

function addMessage(m) {
  const arr = S.msgs.get(m.chat_id); if (!arr || arr.some((x) => x.id === m.id)) return;
  arr.push(m);
  if (S.current === m.chat_id) {
    const el = $('#messages');
    renderMessages(el.scrollHeight - el.scrollTop - el.clientHeight < 160 || m.sender_id === S.me.id);
  }
}
function markRead() {
  const arr = S.msgs.get(S.current); const c = S.chats.get(S.current);
  const last = arr?.filter((m) => m.id).at(-1);
  if (!last || !c) return;
  if (c.unread) { c.unread = 0; renderChatList(); }
  S.socket?.emit('chat:read', { chatId: S.current, messageId: last.id });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.current) markRead(); });

function renderMessages(scrollBottom) {
  const el = $('#messages'); const arr = S.msgs.get(S.current) || [];
  const c = S.chats.get(S.current);
  if (roundPlaying && roundPlaying.isConnected) { S.needRender = true; return; } // video xabar tugagach yangilanadi
  S.needRender = false;
  let html = '', prevDay = '', prev = null;
  arr.forEach((m, i) => {
    const day = fmtDay(m.created_at);
    if (day !== prevDay) { html += `<div class="day-sep">${day}</div>`; prevDay = day; prev = null; }
    const next = arr[i + 1];
    const tail = !next || next.sender_id !== m.sender_id || fmtDay(next.created_at) !== day;
    html += msgHTML(m, c, tail, !prev || prev.sender_id !== m.sender_id);
    prev = m;
  });
  el.innerHTML = html;
  if (player) {
    const v = [...el.querySelectorAll('.voice')].find((x) => x.dataset.src === player.src);
    if (v) { player.el = v; v.querySelector('.vplay').innerHTML = icon(player.audio.paused ? 'play' : 'pause'); player.audio.ontimeupdate?.(); }
  }
  if (scrollBottom) el.scrollTop = el.scrollHeight;
}
function ticksFor(m, c) {
  if (m.sender_id !== S.me.id || c?.self) return '';
  if (m.pending) return `<svg style="width:14px;height:14px"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
  return c && c.peerReadId >= m.id ? `<span class="read">${icon('check2')}</span>` : icon('check');
}
function updateTicks(el) {
  const m = S.msgs.get(S.current)?.find((x) => x.id === +el.dataset.id);
  const tk = el.querySelector('.tk'); if (m && tk) tk.innerHTML = ticksFor(m, S.chats.get(S.current));
}
function msgHTML(m, c, tail, gap) {
  const out = m.sender_id === S.me.id;
  const cls = `msg ${out ? 'out' : 'in'}${tail ? ' tail' : ''}${gap ? ' gap' : ''}`;
  const meta = (over) => `<span class="meta${over ? ' over' : ''}">${fmtTime(m.created_at)}<span class="tk">${ticksFor(m, c)}</span></span>`;
  const attrs = `class="${cls}" data-id="${m.id || ''}"`;
  if (m.deleted) return `<div ${attrs}><div class="bubble"><span class="deleted">${t('deleted')}</span>${meta()}</div></div>`;
  let reply = '';
  if (m.reply_to) {
    const r = (S.msgs.get(m.chat_id) || []).find((x) => x.id === m.reply_to);
    if (r) reply = `<div class="reply-q" data-goto="${r.id}"><b>${esc(r.sender_id === S.me.id ? t('you') : S.users.get(r.sender_id)?.name || '')}</b>${stripTags(preview(r)) || '…'}</div>`;
  }
  const prog = m.pending && m.progress != null ? `<div class="upload-ov"${m.type === 'round' ? ' style="border-radius:50%"' : ''}>${m.progress >= 1 ? t('processing') : Math.round(m.progress * 100) + '%'}</div>` : '';
  const src = esc(m.localUrl || mediaSrc(m));
  switch (m.type) {
    case 'image':
      return `<div ${attrs}><div class="bubble media">${reply}<img src="${src}" data-view="image" loading="lazy" alt="">${prog}
        ${m.text ? `<div class="cap txt">${linkify(m.text)}${meta()}</div>` : meta(true)}</div></div>`;
    case 'video':
      return `<div ${attrs}><div class="bubble media">${reply}<video src="${src}#t=0.1" preload="metadata" playsinline muted data-view="video"></video>${prog}
        <span class="meta over" style="left:10px;right:auto">${icon('play')}${m.duration ? fmtDur(m.duration) : t('t_video')}</span>
        ${m.text ? `<div class="cap txt">${linkify(m.text)}${meta()}</div>` : meta(true)}</div></div>`;
    case 'voice': {
      const wf = m.meta?.waveform || Array.from({ length: 40 }, () => 0.3);
      return `<div ${attrs}><div class="bubble">${reply}<div class="voice" data-src="${src}" data-dur="${m.duration || 0}">
        <button class="vplay" aria-label="play">${icon('play')}</button>
        <div class="vbody"><div class="wave">${wf.map((v) => `<i style="height:${Math.max(12, Math.round(v * 100))}%"></i>`).join('')}</div>
        <span class="vdur">${m.pending && m.progress >= 1 ? t('processing') : fmtDur(m.duration)}</span></div></div>${meta()}</div></div>`;
    }
    case 'round':
      return `<div ${attrs}><div class="round-msg" data-dur="${m.duration || 0}">
        <video src="${src}#t=0.1" muted loop playsinline preload="metadata"></video>
        <svg class="rp" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48.5" stroke-dasharray="304.7" stroke-dashoffset="304.7"/></svg>${prog}
        <span class="rmeta">${icon('mic-off')}${fmtDur(m.duration)}</span><span class="rmeta rtime">${fmtTime(m.created_at)}<span class="tk">${ticksFor(m, c)}</span></span></div></div>`;
    case 'file':
      return `<div ${attrs}><div class="bubble">${reply}<a class="filebox" href="${esc(m.file || '#')}" download="${esc(m.meta?.name || 'file')}" target="_blank">
        <div class="fi">${icon('file')}</div><div><b>${esc(m.meta?.name || t('t_file'))}</b><span>${m.pending ? Math.round((m.progress || 0) * 100) + '%' : fmtSize(m.size || 0)}</span></div></a>
        ${m.text ? `<div class="txt">${linkify(m.text)}</div>` : ''}${meta()}</div></div>`;
    case 'call': {
      const st = m.meta?.status; const v = m.meta?.video;
      const label = out ? (v ? t('out_vcall') : t('out_call')) : (v ? t('in_vcall') : t('in_call'));
      const sub = st === 'answered' ? fmtDur(m.duration) : out ? (st === 'rejected' ? t('rejected') : t('no_answer')) : t('missed');
      return `<div ${attrs}><div class="bubble"><div class="callbox"><div class="ci">${icon(v ? 'video' : 'phone')}</div>
        <div><b>${label}</b><span class="${st !== 'answered' && !out ? 'missed' : ''}">${icon('call-in')}${sub}</span></div></div>${meta()}</div></div>`;
    }
    default:
      return `<div ${attrs}><div class="bubble">${reply}<span class="txt">${linkify(m.text)}</span>${meta()}</div></div>`;
  }
}

/* ---------- media ijrosi ---------- */
// AAC/H.264 ni qo'llamaydigan brauzerlar uchun asl (webm) faylga qaytish
const canPlayCache = {};
function mediaSrc(m) {
  if (!m.meta?.alt || !m.mime) return m.file;
  const q = m.mime === 'audio/mp4' ? 'audio/mp4; codecs="mp4a.40.2"' : 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  if (!(q in canPlayCache)) canPlayCache[q] = !!document.createElement(m.mime.startsWith('audio') ? 'audio' : 'video').canPlayType(q);
  return canPlayCache[q] ? m.file : m.meta.alt;
}
let player = null;
function stopPlayer() {
  if (!player) return;
  player.audio.pause();
  if (player.el?.isConnected) { player.el.querySelector('.vplay').innerHTML = icon('play'); player.el.querySelectorAll('.wave i').forEach((i) => i.classList.remove('on')); player.el.querySelector('.vdur').textContent = fmtDur(+player.el.dataset.dur); }
  player = null;
}
let roundPlaying = null;
function stopRound() {
  if (!roundPlaying) return;
  const v = roundPlaying.querySelector('video'); v.muted = true; v.loop = true; delete v.dataset.playing;
  roundPlaying.querySelector('circle').style.strokeDashoffset = 304.7; roundPlaying = null;
  if (S.needRender) renderMessages();
}
$('#messages').addEventListener('click', (e) => {
  const v = e.target.closest('.voice');
  if (v) {
    if (e.target.closest('.wave') && player?.el === v) {
      const r = e.target.closest('.wave').getBoundingClientRect();
      const d = isFinite(player.audio.duration) ? player.audio.duration : +v.dataset.dur;
      player.audio.currentTime = Math.max(0, ((e.clientX - r.left) / r.width) * d); return;
    }
    if (player?.el === v) {
      if (player.audio.paused) { player.audio.play(); v.querySelector('.vplay').innerHTML = icon('pause'); } else { player.audio.pause(); v.querySelector('.vplay').innerHTML = icon('play'); }
      return;
    }
    stopPlayer(); stopRound();
    const a = new Audio(v.dataset.src); player = { audio: a, el: v, src: v.dataset.src };
    v.querySelector('.vplay').innerHTML = icon('pause');
    a.ontimeupdate = () => {
      const el = player?.el; if (!el) return;
      const bs = [...el.querySelectorAll('.wave i')];
      const d = isFinite(a.duration) ? a.duration : +el.dataset.dur || 1;
      const k = Math.floor((a.currentTime / d) * bs.length);
      bs.forEach((b, i) => b.classList.toggle('on', i <= k));
      el.querySelector('.vdur').textContent = fmtDur(a.currentTime);
    };
    a.onended = () => stopPlayer();
    a.play().catch(() => { toast(t('play_fail')); stopPlayer(); });
    return;
  }
  const r = e.target.closest('.round-msg');
  if (r) {
    const vid = r.querySelector('video');
    if (roundPlaying === r) { if (vid.paused) vid.play(); else vid.pause(); return; }
    stopPlayer(); stopRound(); roundPlaying = r;
    vid.dataset.playing = 1; vid.muted = false; vid.loop = false; vid.currentTime = 0; vid.play().catch(() => {});
    const circ = r.querySelector('circle');
    vid.ontimeupdate = () => { const d = isFinite(vid.duration) ? vid.duration : +r.dataset.dur || 1; circ.style.strokeDashoffset = 304.7 * (1 - vid.currentTime / d); };
    vid.onended = () => stopRound();
    return;
  }
  const media = e.target.closest('[data-view]');
  if (media) {
    stopPlayer();
    const src = (media.currentSrc || media.src).split('#')[0];
    $('#viewer-body').innerHTML = media.dataset.view === 'image' ? `<img src="${src}" alt="">` : `<video src="${src}" controls autoplay playsinline></video>`;
    $('#viewer').classList.remove('hidden'); return;
  }
  const g = e.target.closest('[data-goto]');
  if (g) { const tg = $(`.msg[data-id="${g.dataset.goto}"]`); tg?.scrollIntoView({ behavior: 'smooth', block: 'center' }); tg?.animate([{ opacity: 0.4 }, { opacity: 1 }], 900); }
});
$('#viewer').onclick = (e) => { if (e.target.closest('#viewer-close') || e.target.id === 'viewer') { $('#viewer').classList.add('hidden'); $('#viewer-body').innerHTML = ''; } };
const roundObserver = new IntersectionObserver((ents) => ents.forEach((en) => {
  const v = en.target; if (v.dataset.playing) return;
  if (en.isIntersecting) v.play().catch(() => {}); else v.pause();
}), { threshold: 0.6 });
new MutationObserver(() => $$('.round-msg video').forEach((v) => roundObserver.observe(v))).observe($('#messages'), { childList: true });
$('#messages').addEventListener('load', (e) => {
  const el = $('#messages');
  if (e.target.tagName === 'IMG' && el.scrollHeight - el.scrollTop - el.clientHeight < e.target.clientHeight + 200) el.scrollTop = el.scrollHeight;
}, true);

/* ---------- kontekst menyu ---------- */
function openCtx(x, y, m) {
  const out = m.sender_id === S.me.id;
  const el = $('#ctx');
  el.innerHTML = `<button data-a="reply">${icon('reply')}${t('reply')}</button>
    ${m.text ? `<button data-a="copy">${icon('copy')}${t('copy')}</button>` : ''}
    ${m.file ? `<a href="${esc(m.file)}" download style="text-decoration:none;color:inherit"><button>${icon('file')}${t('download')}</button></a>` : ''}
    ${out ? `<button data-a="del" class="danger">${icon('trash')}${t('delete')}</button>` : ''}`;
  el.classList.remove('hidden');
  const r = el.getBoundingClientRect();
  el.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  el.onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a; el.classList.add('hidden');
    if (a === 'reply') setReply(m);
    if (a === 'copy') navigator.clipboard?.writeText(m.text).then(() => toast(t('copied'))).catch(() => {});
    if (a === 'del' && confirm(t('confirm_delete'))) S.socket.emit('message:delete', { id: m.id });
  };
}
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); });
const msgOf = (el) => S.msgs.get(S.current)?.find((m) => m.id === +el.dataset.id);
$('#messages').addEventListener('contextmenu', (e) => {
  const el = e.target.closest('.msg'); const m = el && msgOf(el); if (!m || m.deleted || m.type === 'call') return;
  e.preventDefault(); openCtx(e.clientX, e.clientY, m);
});
// mobil: uzoq bosish = menyu
let lpTimer;
$('#messages').addEventListener('touchstart', (e) => {
  const el = e.target.closest('.msg'); if (!el) return;
  const tch = e.touches[0];
  lpTimer = setTimeout(() => { const m = msgOf(el); if (m && !m.deleted && m.type !== 'call') { navigator.vibrate?.(15); openCtx(tch.clientX, tch.clientY, m); } }, 480);
}, { passive: true });
['touchend', 'touchmove', 'touchcancel'].forEach((ev) => $('#messages').addEventListener(ev, () => clearTimeout(lpTimer), { passive: true }));
$('#messages').addEventListener('dblclick', (e) => { const el = e.target.closest('.msg'); const m = el && msgOf(el); if (m && !m.deleted && m.type !== 'call') setReply(m); });

function setReply(m) {
  S.replyTo = m;
  $('#reply-name').textContent = m.sender_id === S.me.id ? t('you') : S.users.get(m.sender_id)?.name || '';
  $('#reply-text').textContent = stripTags(preview(m));
  $('#reply-bar').classList.remove('hidden'); $('#text').focus();
}
$('#reply-cancel').onclick = () => { S.replyTo = null; $('#reply-bar').classList.add('hidden'); };

/* ======================= XABAR YUBORISH ======================= */
const textEl = $('#text'), actionBtn = $('#btn-action');
let recMode = store.get('birga_recmode') || 'voice';
function updateAction() { actionBtn.dataset.mode = textEl.value.trim() ? 'send' : recMode; }
updateAction();
let lastTyping = 0;
textEl.addEventListener('input', () => {
  textEl.style.height = 'auto'; textEl.style.height = Math.min(textEl.scrollHeight, 160) + 'px';
  updateAction();
  if (Date.now() - lastTyping > 2500 && textEl.value) { lastTyping = Date.now(); S.socket?.emit('typing', { chatId: S.current, kind: 'text' }); }
});
textEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !isTouch()) { e.preventDefault(); sendText(); } });

function emitSend(payload) {
  return new Promise((res, rej) => S.socket.timeout(20000).emit('message:send', payload, (err, r) => (err || r?.error ? rej(err || new Error(r.error)) : res(r.message))));
}
async function sendText() {
  const txt = textEl.value.trim(); if (!txt || !S.current) return;
  textEl.value = ''; textEl.style.height = 'auto'; updateAction();
  const replyTo = S.replyTo?.id; $('#reply-cancel').click();
  const temp = { tempId: 't' + Date.now(), pending: true, chat_id: S.current, sender_id: S.me.id, type: 'text', text: txt, reply_to: replyTo, created_at: Date.now() };
  pushPending(temp);
  try { resolvePending(temp, await emitSend({ chatId: S.current, type: 'text', text: txt, replyTo })); }
  catch { toast(t('not_sent')); dropPending(temp); textEl.value = txt; updateAction(); }
}
function pushPending(m) { const arr = S.msgs.get(m.chat_id) || []; arr.push(m); S.msgs.set(m.chat_id, arr); if (S.current === m.chat_id) renderMessages(true); }
function resolvePending(temp, real) {
  const arr = S.msgs.get(temp.chat_id); if (!arr) return;
  const i = arr.indexOf(temp);
  if (arr.some((x) => x.id === real.id)) { if (i >= 0) arr.splice(i, 1); } else if (i >= 0) arr[i] = real; else arr.push(real);
  if (S.current === temp.chat_id) renderMessages(true);
}
function dropPending(temp) { const arr = S.msgs.get(temp.chat_id); const i = arr?.indexOf(temp); if (i >= 0) arr.splice(i, 1); if (S.current === temp.chat_id) renderMessages(); }

async function sendMedia(blob, type, extra = {}) {
  const chatId = S.current;
  const localUrl = URL.createObjectURL(blob);
  const temp = { tempId: 't' + Date.now() + Math.random(), pending: true, progress: 0, chat_id: chatId, sender_id: S.me.id, type, localUrl,
    text: extra.text || '', duration: extra.duration, meta: extra.meta, size: blob.size, reply_to: extra.replyTo, created_at: Date.now() };
  pushPending(temp);
  S.socket.emit('typing', { chatId, kind: type === 'voice' ? 'voice' : type === 'round' ? 'round' : 'file' });
  try {
    let lastR = 0;
    const up = await uploadFile(blob, (p) => { temp.progress = p; if (Date.now() - lastR > 250 || p >= 1) { lastR = Date.now(); if (S.current === chatId) renderMessages(); } },
      ['voice', 'round', 'video'].includes(type) ? type : '');
    const meta = up.alt ? { ...(extra.meta || {}), alt: up.alt } : extra.meta;
    const m = await emitSend({ chatId, type, file: up.url, mime: up.mime, size: up.size, text: extra.text, duration: up.duration || extra.duration, meta, replyTo: extra.replyTo });
    resolvePending(temp, m);
  } catch (e) { toast(e.message || t('upload_fail')); dropPending(temp); }
}

/* ---------- fayl biriktirish ---------- */
$('#btn-attach').onclick = () => $('#file-input').click();
$('#file-input').onchange = (e) => { const files = [...e.target.files]; e.target.value = ''; if (files.length) attachPreview(files); };
$('#chat').addEventListener('dragover', (e) => e.preventDefault());
$('#chat').addEventListener('drop', (e) => { e.preventDefault(); if (S.current && e.dataTransfer.files.length) attachPreview([...e.dataTransfer.files]); });
textEl.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])]; if (f.length) { e.preventDefault(); attachPreview(f); } });

function videoDuration(file) {
  return new Promise((res) => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => res(v.duration); v.onerror = () => res(0); v.src = URL.createObjectURL(file); });
}
function attachPreview(files) {
  const items = files.map((f) => {
    const u = URL.createObjectURL(f);
    if (f.type.startsWith('image/')) return `<img src="${u}" alt="">`;
    if (f.type.startsWith('video/')) return `<video src="${u}#t=0.1" muted></video>`;
    return `<div>${icon('file')}<br>${esc(f.name)}</div>`;
  }).join('');
  modal(`<h3>${t('send_files', { n: files.length })} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="preview-grid">${items}</div>
    <input class="field" id="att-cap" placeholder="${esc(t('add_caption'))}">
    <button class="btn-primary" id="att-send">${t('send')}</button>`);
  if (!isTouch()) $('#att-cap').focus();
  $('#att-cap').onkeydown = (e) => { if (e.key === 'Enter') $('#att-send').click(); };
  $('#att-send').onclick = async () => {
    const cap = $('#att-cap').value.trim(); closeModal();
    const replyTo = S.replyTo?.id; $('#reply-cancel').click();
    for (const [i, f] of files.entries()) {
      const text = i === files.length - 1 ? cap : '';
      if (f.type.startsWith('image/') && f.type !== 'image/svg+xml') sendMedia(await compressImage(f), 'image', { text, replyTo });
      else if (f.type.startsWith('video/')) sendMedia(f, 'video', { text, duration: await videoDuration(f), replyTo });
      else sendMedia(f, 'file', { text, meta: { name: f.name }, replyTo });
    }
  };
}
async function compressImage(file, max = 2048) {
  if ((file.size < 600 * 1024 && max >= 2048) || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
    return new File([b], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}

/* ---------- ovozli va yumaloq video xabar (haqiqiy yozib olish) ---------- */
function pickMime(kind) {
  const list = kind === 'audio'
    ? ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']
    : ['video/mp4;codecs=avc1,mp4a', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'];
  return list.find((x) => window.MediaRecorder && MediaRecorder.isTypeSupported(x)) || '';
}
const Rec = { active: false };
let pressT = 0, startX = 0, startY = 0, holdTimer = null;

actionBtn.addEventListener('pointerdown', (e) => {
  if (actionBtn.dataset.mode === 'send' || Rec.locked) return;
  e.preventDefault();
  pressT = Date.now(); startX = e.clientX; startY = e.clientY;
  try { actionBtn.setPointerCapture(e.pointerId); } catch {}
  ctx(); // AudioContext'ni foydalanuvchi harakati bilan ochish
  holdTimer = setTimeout(() => startRecording(recMode), 220);
});
actionBtn.addEventListener('pointermove', (e) => {
  if (!Rec.active || Rec.locked) return;
  const dx = e.clientX - startX, dy = e.clientY - startY;
  $('#rec-hint').style.transform = `translateX(${Math.min(0, dx)}px)`;
  if (dx < -110) stopRecording(false); else if (dy < -70) lockRecording();
});
actionBtn.addEventListener('pointerup', () => {
  clearTimeout(holdTimer);
  if (Rec.justLocked) { Rec.justLocked = false; return; } // qulflangandan keyin barmoq qo'yib yuborildi — yozish davom etadi
  if (Rec.locked) return stopRecording(true);
  if (actionBtn.dataset.mode === 'send') return sendText();
  if (Rec.active) return stopRecording(true);
  if (Date.now() - pressT < 220) { // qisqa bosish — rejimni almashtirish
    recMode = recMode === 'voice' ? 'round' : 'voice'; store.set('birga_recmode', recMode); updateAction();
    toast(t(recMode === 'voice' ? 'hold_voice' : 'hold_round'), 1600);
  }
});
actionBtn.addEventListener('pointercancel', () => { clearTimeout(holdTimer); if (Rec.active && !Rec.locked) stopRecording(false); });
actionBtn.addEventListener('contextmenu', (e) => e.preventDefault());
$('#rec-cancel').onclick = () => stopRecording(false);
$('#round-cancel').onclick = () => stopRecording(false);
$('#round-send').onclick = () => stopRecording(true);

// Yumaloq video: kamera tasviri kanvasda 480x480 kvadratga kesiladi (old kamera ko'zgu ko'rinishida),
// shuning uchun yozish davomida kamerani almashtirish ham mumkin.
function makeRoundComposer(camStream, facing) {
  const cv = document.createElement('canvas'); cv.width = 480; cv.height = 480;
  const g = cv.getContext('2d');
  const vid = document.createElement('video'); vid.muted = true; vid.playsInline = true; vid.srcObject = camStream; vid.play().catch(() => {});
  const comp = { canvas: cv, vid, facing, running: true };
  const draw = () => {
    if (!comp.running) return;
    const vw = vid.videoWidth, vh = vid.videoHeight;
    if (vw && vh) {
      const s = Math.min(vw, vh);
      g.save();
      if (comp.facing === 'user') { g.translate(480, 0); g.scale(-1, 1); }
      g.drawImage(vid, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, 480, 480);
      g.restore();
    }
  };
  comp.timer = setInterval(draw, 1000 / 30);
  comp.stream = cv.captureStream(30);
  comp.stop = () => { comp.running = false; clearInterval(comp.timer); comp.stream.getTracks().forEach((x) => x.stop()); };
  return comp;
}
const camConstraints = (facing) => ({ facingMode: facing, width: { ideal: 720 }, height: { ideal: 720 }, frameRate: { ideal: 30 } });

async function startRecording(kind) {
  if (Rec.active || Call.active) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast(t('need_https'), 3500); return; }
  $('#round-actions').classList.add('hidden');
  Object.assign(Rec, { active: true, kind, locked: false, justLocked: false, facing: 'user', chunks: [], levels: [], t0: Date.now(), mr: null, stream: null, comp: null });
  try {
    Rec.stream = await navigator.mediaDevices.getUserMedia(kind === 'voice'
      ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
      : { audio: { echoCancellation: true, noiseSuppression: true }, video: camConstraints('user') });
  } catch { Rec.active = false; toast(t(kind === 'voice' ? 'allow_mic' : 'allow_cam'), 3000); return; }
  if (!Rec.active) { Rec.stream.getTracks().forEach((x) => x.stop()); return; } // tugma qo'yib yuborilgan

  let recStream = Rec.stream;
  if (kind === 'round' && HTMLCanvasElement.prototype.captureStream) {
    Rec.comp = makeRoundComposer(new MediaStream(Rec.stream.getVideoTracks()), 'user');
    recStream = new MediaStream([...Rec.comp.stream.getVideoTracks(), ...Rec.stream.getAudioTracks()]);
    $('#round-preview').srcObject = Rec.comp.stream; $('#round-preview').classList.add('raw');
  } else if (kind === 'round') {
    $('#round-preview').srcObject = Rec.stream; $('#round-preview').classList.remove('raw');
  }
  const mime = pickMime(kind === 'voice' ? 'audio' : 'video');
  try { Rec.mr = new MediaRecorder(recStream, mime ? { mimeType: mime, videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 64_000 } : undefined); }
  catch { Rec.mr = new MediaRecorder(recStream); }
  Rec.mr.ondataavailable = (e) => e.data.size && Rec.chunks.push(e.data);
  Rec.mr.start(250);
  Rec.t0 = Date.now();
  try {
    const a = ctx(); const src = a.createMediaStreamSource(new MediaStream(Rec.stream.getAudioTracks())); const an = a.createAnalyser(); an.fftSize = 512; src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    Rec.levelT = setInterval(() => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += ((v - 128) / 128) ** 2; Rec.levels.push(Math.sqrt(s / buf.length)); }, 60);
  } catch {}
  navigator.vibrate?.(20);
  actionBtn.classList.add('recording');
  $('#composer-row').classList.add('hidden'); $('#rec-row').classList.remove('hidden'); $('#rec-lock').classList.remove('hidden');
  $('#rec-hint').classList.remove('hidden'); $('#rec-cancel').classList.add('hidden'); $('#rec-hint').style.transform = '';
  if (kind === 'round') $('#round-rec').classList.remove('hidden');
  S.socket.emit('typing', { chatId: S.current, kind });
  const MAX = 60;
  Rec.tick = setInterval(() => {
    const s = (Date.now() - Rec.t0) / 1000;
    $('#rec-time').textContent = $('#round-time').textContent = fmtDur(s);
    $('#round-prog').style.strokeDashoffset = 301.6 * (1 - Math.min(1, s / MAX));
    if (Math.floor(s * 5) % 15 === 0) S.socket.emit('typing', { chatId: S.current, kind });
    if (s >= MAX) stopRecording(true);
  }, 200);
}
function lockRecording() {
  Rec.locked = true; Rec.justLocked = true; navigator.vibrate?.(15);
  $('#round-actions').classList.remove('hidden'); actionBtn.classList.remove('recording'); actionBtn.classList.add('locked');
  actionBtn.dataset.mode = 'send'; $('#rec-lock').classList.add('hidden');
  $('#rec-hint').classList.add('hidden'); $('#rec-cancel').classList.remove('hidden');
}
$('#round-flip').onclick = async () => {
  if (!Rec.active || Rec.kind !== 'round') return;
  const facing = Rec.facing === 'user' ? 'environment' : 'user';
  try {
    if (Rec.comp) {
      const old = Rec.comp.vid.srcObject;
      old?.getTracks().forEach((x) => x.stop()); // ba'zi telefonlar ikki kamerani birga ochmaydi
      const ns = await navigator.mediaDevices.getUserMedia({ video: camConstraints(facing) });
      Rec.comp.vid.srcObject = ns; Rec.comp.vid.play().catch(() => {}); Rec.comp.facing = facing;
      Rec.extra = [...(Rec.extra || []), ...ns.getTracks()];
    } else { // eski brauzerlar: faqat ko'rinish
      const ns = await navigator.mediaDevices.getUserMedia({ video: camConstraints(facing) });
      $('#round-preview').srcObject = ns; Rec.extra = [...(Rec.extra || []), ...ns.getTracks()];
    }
    Rec.facing = facing;
  } catch { toast(t('cam_switch_fail')); }
};
function stopRecording(send) {
  if (!Rec.active) return;
  clearInterval(Rec.tick); clearInterval(Rec.levelT); clearTimeout(holdTimer);
  const dur = (Date.now() - Rec.t0) / 1000; const kind = Rec.kind; const replyTo = S.replyTo?.id;
  Rec.active = false; Rec.locked = false;
  actionBtn.classList.remove('recording', 'locked'); updateAction();
  $('#composer-row').classList.remove('hidden'); $('#rec-row').classList.add('hidden'); $('#rec-lock').classList.add('hidden'); $('#round-rec').classList.add('hidden');
  const finish = () => {
    Rec.stream?.getTracks().forEach((x) => x.stop()); Rec.comp?.stop();
    (Rec.extra || []).forEach((x) => x.stop()); Rec.extra = [];
    $('#round-preview').srcObject = null;
    if (!send || dur < 0.8 || !Rec.chunks.length) { if (send && dur < 0.8) toast(t(kind === 'voice' ? 'hold_voice' : 'hold_round'), 1800); return; }
    const type = (Rec.mr.mimeType || (kind === 'voice' ? 'audio/webm' : 'video/webm')).split(';')[0];
    const ext = type.includes('mp4') ? (kind === 'voice' ? 'm4a' : 'mp4') : type.includes('ogg') ? 'ogg' : 'webm';
    const file = new File(Rec.chunks, `${kind}-${Date.now()}.${ext}`, { type });
    if (replyTo) $('#reply-cancel').click();
    sendMedia(file, kind, { duration: dur, replyTo, meta: kind === 'voice' ? { waveform: waveform(Rec.levels, 40) } : undefined });
  };
  if (Rec.mr && Rec.mr.state !== 'inactive') { Rec.mr.onstop = finish; Rec.mr.stop(); } else finish();
}
function waveform(levels, n) {
  if (!levels.length) return Array(n).fill(0.2);
  const out = []; const step = levels.length / n;
  for (let i = 0; i < n; i++) { const sl = levels.slice(Math.floor(i * step), Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1)); out.push(Math.max(...sl, 0)); }
  const mx = Math.max(...out, 0.01);
  return out.map((v) => +Math.min(1, Math.max(0.12, v / mx)).toFixed(2));
}

/* ======================= QO'NG'IROQLAR (WebRTC, xalqaro) ======================= */
const Call = {
  active: false,
  bind(s) {
    this.s = s;
    s.on('call:offer', (p) => this.onOffer(p));
    s.on('call:answer', async (p) => {
      if (p.callId !== this.id || !this.pc) return;
      await this.pc.setRemoteDescription(p.sdp).catch(() => {}); this.flushIce(); this.connected();
    });
    s.on('call:ice', async (p) => {
      if (p.callId !== this.id) return;
      if (this.pc?.remoteDescription) this.pc.addIceCandidate(p.candidate).catch(() => {}); else (this.iceQ ||= []).push(p.candidate);
    });
    s.on('call:renego', (p) => { if (p.callId === this.id) this.onRenego(p.sdp); });
    s.on('call:ringing', (p) => { if (p.callId === this.id && !this.startedAt) $('#call-status').textContent = t('ringing'); });
    s.on('call:status', (p) => { if (p.callId === this.id && !this.startedAt && p.status === 'offline') $('#call-status').textContent = t('reaching'); });
    s.on('call:busy', (p) => { if (p.callId === this.id) { $('#call-status').textContent = t('busy'); this.finish('busy', 1500); } });
    s.on('call:reject', (p) => { if (p.callId === this.id) { $('#call-status').textContent = t('rejected'); this.finish('rejected', 1200); } });
    s.on('call:end', (p) => { if (p.callId === this.id) this.finish(this.startedAt ? 'answered' : 'missed'); });
    s.on('call:handled', (p) => { if (p.callId === this.id && !this.outgoing && !this.startedAt) this.cleanup(); });
    s.on('call:media', (p) => { if (p.callId === this.id) { this.remoteVideo = p.video; this.layout(); } });
  },
  getMedia(video) {
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: video ? { facingMode: this.facing || 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
    });
  },
  async iceServers() {
    try { return (await api('/api/ice')).iceServers; } catch { return [{ urls: 'stun:stun.l.google.com:19302' }]; }
  },
  async createPC() {
    const pc = new RTCPeerConnection({ iceServers: await this.iceServers(), iceCandidatePoolSize: 4 });
    this.pc = pc; this.negReady = false; this.makingOffer = false;
    pc.onicecandidate = (e) => e.candidate && this.s.emit('call:ice', { to: this.peer.id, callId: this.id, candidate: e.candidate });
    pc.ontrack = (e) => {
      const st = e.streams[0] || new MediaStream([e.track]);
      const ra = $('#remote-audio'); if (ra.srcObject !== st) { ra.srcObject = st; ra.play().catch(() => {}); }
      if (e.track.kind === 'video') {
        const rv = $('#remote-video'); rv.muted = true; rv.srcObject = st; rv.play().catch(() => {});
        this.remoteVideo = true; this.layout();
        e.track.onunmute = () => this.layout(); e.track.onmute = () => this.layout();
      }
    };
    // qayta kelishuv (kamerani yoqish, tarmoq o'zgarishi)
    pc.onnegotiationneeded = async () => {
      if (!this.negReady) return;
      try { this.makingOffer = true; await pc.setLocalDescription(); this.s.emit('call:renego', { to: this.peer.id, callId: this.id, sdp: pc.localDescription }); }
      catch (e) { console.warn(e); } finally { this.makingOffer = false; }
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') { clearTimeout(this.failT); this.tickStatus(); }
      if (st === 'disconnected' || st === 'failed') {
        $('#call-status').textContent = t('reconnecting');
        if (st === 'failed' && this.outgoing) pc.restartIce?.();
        clearTimeout(this.failT);
        this.failT = setTimeout(() => { if (pc.connectionState !== 'connected' && this.active) { $('#call-status').textContent = t('conn_lost'); this.end(); } }, 20000);
      }
    };
    this.local.getTracks().forEach((tr) => pc.addTrack(tr, this.local));
    return pc;
  },
  async onRenego(desc) {
    const pc = this.pc; if (!pc) return;
    try {
      if (desc.type === 'offer') {
        const collision = this.makingOffer || pc.signalingState !== 'stable';
        if (collision && this.outgoing) return; // qo'ng'iroq qiluvchi "qat'iy", qabul qiluvchi "muloyim" tomon
        await pc.setRemoteDescription(desc); // kerak bo'lsa avtomatik rollback
        await pc.setLocalDescription();
        this.s.emit('call:renego', { to: this.peer.id, callId: this.id, sdp: pc.localDescription });
      } else await pc.setRemoteDescription(desc);
      this.flushIce();
    } catch (e) { console.warn('renego', e); }
  },
  flushIce() { if (!this.pc?.remoteDescription) return; (this.iceQ || []).forEach((c) => this.pc.addIceCandidate(c).catch(() => {})); this.iceQ = []; },
  show(peer, status) {
    $('#call-avatar').innerHTML = avatar(peer); $('#call-name').textContent = peer.name; $('#call-status').textContent = status;
    $('#call').classList.remove('hidden', 'has-video', 'local-video'); $('#call').classList.add('ringing');
  },
  layout() {
    const rv = $('#remote-video').srcObject?.getVideoTracks?.()[0];
    $('#call').classList.toggle('has-video', !!this.remoteVideo && !!rv && !rv.muted && !!this.startedAt);
    const camOn = !!this.local?.getVideoTracks().some((x) => x.enabled && x.readyState === 'live');
    $('#call').classList.toggle('local-video', camOn);
    if ($('#local-video').srcObject !== this.local) $('#local-video').srcObject = this.local;
    $('#c-flip').classList.toggle('hidden', !camOn);
    $('#c-cam').classList.toggle('off', !camOn);
    $('#c-cam').innerHTML = `${icon(camOn ? 'video' : 'video-off')}<span>${t('camera')}</span>`;
  },
  chatIdFor(peerId) { for (const c of S.chats.values()) if (c.peer?.id === peerId && !c.self) return c.id; return null; },
  async start(peer, video) {
    if (this.active || !peer) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) return toast(t('need_https'), 3500);
    this.reset(); this.active = true; this.outgoing = true; this.peer = peer; this.video = video;
    this.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    this.chatId = this.chatIdFor(peer.id);
    this.show(peer, t('calling')); this.controls(false);
    try { this.local = await this.getMedia(video); }
    catch { toast(t(video ? 'allow_cam' : 'allow_mic'), 3000); this.cleanup(); return; }
    if (!this.active) return this.cleanup();
    this.layout(); this.wake();
    const pc = await this.createPC();
    await pc.setLocalDescription(await pc.createOffer());
    this.s.emit('call:offer', { to: peer.id, callId: this.id, sdp: pc.localDescription, video, chatId: this.chatId });
    this.tone('ringback');
    this.timeout = setTimeout(() => { if (!this.startedAt && this.active) { $('#call-status').textContent = t('no_answer'); this.s.emit('call:end', { to: peer.id, callId: this.id }); this.finish('missed', 1200); } }, 45000);
  },
  onOffer(p) {
    if (this.active) { if (p.callId !== this.id) this.s.emit('call:busy', { to: p.from, callId: p.callId }); return; }
    this.reset(); this.active = true; this.outgoing = false; this.peer = p.fromUser; this.video = p.video; this.id = p.callId; this.offer = p.sdp; this.chatId = p.chatId;
    S.users.set(p.fromUser.id, { ...S.users.get(p.fromUser.id), ...p.fromUser });
    this.show(p.fromUser, t(p.video ? 'incoming_vcall' : 'incoming_call'));
    this.controls(true);
    this.s.emit('call:ringing', { to: p.from, callId: p.callId });
    this.tone('ring'); navigator.vibrate?.([400, 200, 400]);
    this.timeout = setTimeout(() => { if (!this.startedAt && this.active) this.cleanup(); }, 45000);
  },
  async accept() {
    this.tone(null); this.controls(false); $('#call-status').textContent = t('connecting_call');
    try { this.local = await this.getMedia(this.video); }
    catch { try { this.local = await this.getMedia(false); this.video = false; } catch { toast(t('allow_mic'), 3000); return this.reject(); } }
    this.layout(); this.wake();
    const pc = await this.createPC();
    await pc.setRemoteDescription(this.offer); this.flushIce();
    await pc.setLocalDescription(await pc.createAnswer());
    this.s.emit('call:answer', { to: this.peer.id, callId: this.id, sdp: pc.localDescription });
    this.connected();
  },
  reject() { this.s.emit('call:reject', { to: this.peer.id, callId: this.id }); this.finish('rejected'); },
  connected() {
    if (this.startedAt) return;
    clearTimeout(this.timeout); this.tone(null);
    this.startedAt = Date.now(); $('#call').classList.remove('ringing');
    this.layout(); this.tickStatus();
    this.timer = setInterval(() => this.tickStatus(), 1000);
    const ready = () => { if (this.pc?.signalingState === 'stable') this.negReady = true; else setTimeout(ready, 300); };
    setTimeout(ready, 300);
  },
  tickStatus() { const st = this.pc?.connectionState; if (this.startedAt && st !== 'disconnected' && st !== 'failed') $('#call-status').textContent = fmtDur((Date.now() - this.startedAt) / 1000); },
  end() { if (!this.active) return; this.s.emit('call:end', { to: this.peer.id, callId: this.id }); this.finish(this.startedAt ? 'answered' : 'cancelled'); },
  finish(status, delay = 0) {
    if (!this.active) return;
    const dur = this.startedAt ? (Date.now() - this.startedAt) / 1000 : 0;
    if (this.outgoing) this.s.emit('call:log', { chatId: this.chatId, peerId: this.peer.id, video: this.video, duration: dur, status: status === 'answered' ? 'answered' : status });
    this.active = false; this.tone(null); clearTimeout(this.timeout); clearTimeout(this.failT); clearInterval(this.timer);
    $('#call-controls').classList.add('hidden'); $('#call-incoming').classList.add('hidden');
    if (this.startedAt) $('#call-status').textContent = `${t('ended')} · ${fmtDur(dur)}`;
    setTimeout(() => this.cleanup(), delay || 800);
  },
  cleanup() {
    this.active = false; this.tone(null); clearTimeout(this.timeout); clearTimeout(this.failT); clearInterval(this.timer);
    this.local?.getTracks().forEach((x) => x.stop()); try { this.pc?.close(); } catch {}
    this.pc = null; this.local = null;
    $('#call').classList.add('hidden');
    ['#remote-video', '#remote-audio', '#local-video'].forEach((s) => ($(s).srcObject = null));
    this.wakeLock?.release?.().catch(() => {}); this.wakeLock = null;
  },
  reset() { this.startedAt = null; this.remoteVideo = false; this.iceQ = []; this.muted = false; this.facing = 'user'; $('#c-mute').classList.remove('off'); $('#c-mute').innerHTML = `${icon('mic')}<span>${t('mic')}</span>`; },
  controls(incoming) { $('#call-incoming').classList.toggle('hidden', !incoming); $('#call-controls').classList.toggle('hidden', incoming); },
  async wake() { try { this.wakeLock = await navigator.wakeLock?.request('screen'); } catch {} },
  toggleMute() {
    this.muted = !this.muted; this.local?.getAudioTracks().forEach((x) => (x.enabled = !this.muted));
    $('#c-mute').classList.toggle('off', this.muted); $('#c-mute').innerHTML = `${icon(this.muted ? 'mic-off' : 'mic')}<span>${t('mic')}</span>`;
  },
  async toggleCam() {
    if (!this.local || !this.pc) return;
    const tr = this.local.getVideoTracks()[0];
    if (!tr) { // audio qo'ng'iroqni video qo'ng'iroqqa aylantirish (qayta kelishuv orqali)
      try {
        const vs = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facing, width: { ideal: 1280 }, height: { ideal: 720 } } });
        const nt = vs.getVideoTracks()[0];
        this.local.addTrack(nt); this.pc.addTrack(nt, this.local); this.video = true;
      } catch { return toast(t('allow_cam'), 3000); }
    } else tr.enabled = !tr.enabled;
    const on = this.local.getVideoTracks().some((x) => x.enabled);
    this.s.emit('call:media', { to: this.peer.id, callId: this.id, video: on });
    this.layout();
  },
  async flip() {
    const old = this.local?.getVideoTracks()[0]; if (!old) return;
    this.facing = this.facing === 'user' ? 'environment' : 'user';
    try {
      old.stop(); // ba'zi telefonlar ikki kamerani birga ochmaydi
      const ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: this.facing } } }).catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facing } }));
      const nt = ns.getVideoTracks()[0];
      await this.pc.getSenders().find((s) => s.track === old || s.track?.kind === 'video')?.replaceTrack(nt);
      this.local.removeTrack(old); this.local.addTrack(nt);
      $('#local-video').srcObject = null; $('#local-video').srcObject = this.local;
      $('#local-video').classList.toggle('back', this.facing !== 'user');
    } catch { toast(t('cam_switch_fail')); }
  },
  tone(kind) {
    clearInterval(this.toneT); this.toneT = null;
    if (!kind) return;
    const play = () => (kind === 'ring' ? beep([660, 880, 660, 880], 0.18, 0.12) : beep([425], 1.0, 0.05));
    play(); this.toneT = setInterval(play, kind === 'ring' ? 2200 : 3500);
  },
};
$('#c-end').onclick = () => Call.end();
$('#c-accept').onclick = () => Call.accept();
$('#c-reject').onclick = () => Call.reject();
$('#c-mute').onclick = () => Call.toggleMute();
$('#c-cam').onclick = () => Call.toggleCam();
$('#c-flip').onclick = () => Call.flip();
window.addEventListener('pagehide', () => { if (Call.active) Call.end(); });

/* ======================= ILOVANI TELEFONGA O'RNATISH (PWA) ======================= */
let installPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function refreshInstall() { $$('[data-install]').forEach((b) => b.classList.toggle('hidden', isStandalone())); }
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; refreshInstall(); });
window.addEventListener('appinstalled', () => { installPrompt = null; toast(t('installed_ok')); refreshInstall(); });
async function installApp() {
  $('#drawer').classList.remove('open');
  if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; return; }
  const ios = isIOS();
  const steps = t(ios ? 'ios_steps' : 'and_steps');
  const notSafari = ios && /crios|fxios|edgios|opios/i.test(navigator.userAgent);
  modal(`<h3>${t('install_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="install-hero"><img src="/icons/icon-192.png" alt=""><div><b>Birga</b><br><small class="muted">${esc(location.host)}</small></div></div>
    ${notSafari ? `<p class="muted">${t('ios_safari_only')}</p>` : `<ol class="install-steps">${steps.map((x) => `<li><span>${x}</span></li>`).join('')}</ol>`}
    <button class="btn-primary" data-close>${t('got_it')}</button>`);
}
$$('[data-install]').forEach((b) => (b.onclick = installApp));
refreshInstall();

boot();
