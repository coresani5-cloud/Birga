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
const Rec = { active: false }; // ovoz/video yozish holati
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
  try { r = await fetch(path, { method: opts.method || (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin' }); }
  catch { throw new Error(t('net_err')); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && S.token && !opts.noLogout) { toast(t('session_end')); logout(true); throw new Error(t('session_end')); }
  if (!r.ok) { const e = new Error(j.error || t('err')); e.data = j; e.status = r.status; throw e; }
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
const GRADS = [['#00A8D6', '#1F6BFF'], ['#1F6BFF', '#8A2BE2'], ['#8A2BE2', '#C04BD8'], ['#F59E0B', '#EF6B4A'], ['#22C3D6', '#3B82F6'], ['#10B981', '#27B8A0'], ['#EC6B9A', '#7D58C6']];
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
const fmtSize = (b) => (!b ? '0 KB' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
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
    case 'sticker': return (m.meta?.e || '') + ' ' + tag(t('t_sticker'));
    case 'gif': return tag('GIF');
    case 'service': return `<i>${esc(serviceText(m))}</i>`;
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
}
$('#lang-switch').onclick = (e) => { const b = e.target.closest('[data-l]'); if (b) changeLang(b.dataset.l); };
function changeLang(l) {
  setLang(l); renderLangSwitch(); applyTheme(store.get('birga_theme') || 'auto');
  updateResend();
  if (S.me && S.token) { api('/api/profile/lang', { body: { lang: l } }).catch(() => {}); renderSettings(); renderChatList(); renderHeader(); Stories.render(); if (S.current) renderMessages(); if (TAB === 'profile') setTab('profile'); }
}
applyI18n(); renderLangSwitch(); applyTheme(store.get('birga_theme') || 'auto');

/* ======================= YORDAMCHI: davlat ======================= */
const flag = (cc) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
function countryName(cc) {
  for (const l of [LANG, 'en']) { try { const n = new Intl.DisplayNames([l], { type: 'region' }).of(cc); if (n && n !== cc) return n; } catch {} }
  return cc;
}
const auth = { email: store.get('birga_email') || '', timer: null, wait: 0 };

/* ======================= KIRISH: EMAIL + KOD ======================= */
function showStep(name) {
  $$('.step').forEach((s) => s.classList.add('hidden'));
  $('#step-' + name).classList.remove('hidden');
  setTimeout(() => { if (!$('#step-' + name).contains(document.activeElement) && !isTouch()) ({ email: $('#email'), code: $('#code-boxes input'), profile: $('#reg-name') }[name])?.focus(); }, 60);
}
$$('[data-back]').forEach((b) => (b.onclick = () => showStep(b.dataset.back)));
$('#email').value = auth.email;
const EMAIL_OK = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
// tez-tez uchraydigan xatolarni tuzatish: gmail.co, gmial.com ...
function fixEmail(e) {
  e = e.trim().toLowerCase().replace(/\s+/g, '');
  return e.replace(/@(gmial|gmal|gmaill|gnail|gamil)\.(com|co)$/, '@gmail.com').replace(/@gmail\.(co|cm|con|om)$/, '@gmail.com').replace(/@(mail|yandex|inbox|bk|list)\.(r|ry|ruu)$/, '@$1.ru');
}
$('#email').addEventListener('input', () => $('.email-field').classList.remove('bad'));
async function sendCode(isResend) {
  const email = isResend ? auth.email : fixEmail($('#email').value);
  if (!EMAIL_OK.test(email)) { $('.email-field').classList.add('bad'); toast(t('enter_email')); return; }
  $('#email').value = email;
  const btn = $('#btn-send-code'); btn.disabled = true; btn.classList.add('loading');
  try {
    const r = await api('/api/auth/email/send', { body: { email } });
    auth.email = r.email; store.set('birga_email', r.email);
    $('#code-target').textContent = r.email;
    boxes.forEach((i) => (i.value = '')); $('#code-err').textContent = '';
    if (r.devCode) { $('#dev-code').innerHTML = `${esc(t('dev_code_email'))} <b>${r.devCode}</b>`; $('#dev-code').classList.remove('hidden'); }
    else $('#dev-code').classList.add('hidden');
    $('#mail-open').classList.toggle('hidden', !!r.devCode || !mailLink(r.email));
    showStep('code'); startResendTimer(r.timeout || 60);
    if (isResend) toast(t('code_resent'));
  } catch (e) {
    if (e.data?.wait) { auth.email = e.data.email || email; $('#code-target').textContent = auth.email; showStep('code'); startResendTimer(e.data.wait); }
    else toast(e.message, 3500);
  } finally { btn.disabled = false; btn.classList.remove('loading'); }
}
// pochta ilovasini ochish havolasi
function mailLink(e) {
  const d = (e.split('@')[1] || '').toLowerCase();
  return { 'gmail.com': 'https://mail.google.com/mail/u/0/#search/Birga', 'googlemail.com': 'https://mail.google.com/', 'mail.ru': 'https://e.mail.ru/inbox/', 'bk.ru': 'https://e.mail.ru/inbox/', 'list.ru': 'https://e.mail.ru/inbox/', 'inbox.ru': 'https://e.mail.ru/inbox/',
    'yandex.ru': 'https://mail.yandex.ru/', 'ya.ru': 'https://mail.yandex.ru/', 'yandex.com': 'https://mail.yandex.com/', 'outlook.com': 'https://outlook.live.com/mail/', 'hotmail.com': 'https://outlook.live.com/mail/', 'live.com': 'https://outlook.live.com/mail/',
    'icloud.com': 'https://www.icloud.com/mail/', 'yahoo.com': 'https://mail.yahoo.com/' }[d];
}
$('#mail-open').onclick = () => { const u = mailLink(auth.email); if (u) window.open(u, '_blank', 'noopener'); };
$('#step-email').onsubmit = (e) => { e.preventDefault(); sendCode(); };
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
// Pochtadan nusxalangan kodni avtomatik qo'yish (sahifaga qaytganda)
document.addEventListener('visibilitychange', async () => {
  if (document.hidden || $('#step-code').classList.contains('hidden') || boxes.some((b) => b.value)) return;
  try { const txt = await navigator.clipboard.readText(); const m = (txt || '').match(/\b\d{5}\b/); if (m) fillCode(m[0]); } catch {}
});
let verifying = false;
async function verifyCode(code) {
  if (verifying) return; verifying = true;
  $('#code-err').textContent = '';
  try {
    const r = await api('/api/auth/email/verify', { body: { email: auth.email, code } });
    S.token = r.token; store.set('birga_token', r.token); S.me = r.user;
    clearInterval(auth.timer);
    navigator.storage?.persist?.().catch(() => {});
    if (r.isNew || !r.user.name) showStep('profile'); else startApp();
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
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  store.del('birga_token'); S.token = null; S.socket?.disconnect(); location.href = '/';
}

/* ======================= ILOVA ======================= */
async function boot() {
  try { S.config = await api('/api/config'); } catch {}
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  const jq = new URLSearchParams(location.search).get('join'); if (jq) store.set('birga_join', jq); // ro'yxatdan keyin qo'shiladi
  // Sessiya: localStorage'dagi token yoki (u o'chib ketgan bo'lsa) serverdagi doimiy cookie
  for (let i = 0; ; i++) {
    try {
      const me = await api('/api/me', { noLogout: true });
      if (me.token) { S.token = me.token; store.set('birga_token', me.token); }
      S.me = me; break;
    } catch (e) {
      if (e.status === 401) { S.token = null; store.del('birga_token'); $('#auth').classList.remove('hidden'); $('#boot').classList.add('hidden'); showStep('email'); return; }
      // tarmoq yoki server uyg'onmoqda — profil saqlanadi, qayta urinamiz
      $('#boot').classList.remove('hidden'); $('#boot-msg').textContent = t(i > 2 ? 'boot_slow' : 'connecting');
      await new Promise((r) => setTimeout(r, Math.min(8000, 1500 * (i + 1))));
    }
  }
  $('#boot').classList.add('hidden');
  navigator.storage?.persist?.().catch(() => {});
  if (!S.me.name) { $('#auth').classList.remove('hidden'); showStep('profile'); return; }
  if (S.me.lang && S.me.lang !== LANG && !store.get('birga_lang')) changeLang(S.me.lang);
  startApp();
}

async function startApp() {
  await Media.init();
  $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  S.users.set(S.me.id, S.me);
  renderNavMe(); setTab('chats');
  await loadChats().catch(() => {});
  Stories.load();
  connectSocket();
  Media.syncPending();
  setupPush(false);
  const qs = new URLSearchParams(location.search);
  const want = qs.get('chat');
  if (want && S.chats.has(+want)) openChat(+want);
  const join = qs.get('join') || store.get('birga_join');
  if (join) { store.del('birga_join'); joinPreview(join); }
  if (location.search) history.replaceState(null, '', '/');
  // eski (raqam bilan kirgan) profillar: emailni bog'lash taklifi — keyin shu email bilan kiradi
  if (!S.me.email && !sessionStorage.getItem('birga_ask_email')) { try { sessionStorage.setItem('birga_ask_email', '1'); } catch {} setTimeout(() => bindEmailModal(true), 1200); }
}

async function loadChats() {
  const list = await api('/api/chats');
  list.forEach(upsertChat); renderChatList();
}
function upsertChat(c) {
  if (c.peer) { c.peer.self = c.self; S.users.set(c.peer.id, { ...S.users.get(c.peer.id), ...c.peer }); }
  S.chats.set(c.id, c);
}

function loadScript(src) { return new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); }); }
async function connectSocket() {
  // sahifa server uxlab yotganda ochilgan bo'lsa socket.io skripti yuklanmagan bo'ladi — qayta yuklaymiz
  for (let i = 0; typeof io === 'undefined'; i++) { try { await loadScript('/socket.io/socket.io.js?r=' + i); } catch { await new Promise((r) => setTimeout(r, 3000)); } }
  const s = io({ auth: { token: S.token }, transports: ['websocket', 'polling'] });
  S.socket = s;
  s.on('connect', () => { $('#conn-bar').classList.add('hidden'); if (S.current) loadMessages(S.current); loadChats().catch(() => {}); });
  s.on('disconnect', () => $('#conn-bar').classList.remove('hidden'));
  s.on('connect_error', (e) => { if (e.message === 'unauthorized') logout(true); $('#conn-bar').classList.remove('hidden'); });

  s.on('message:new', ({ message, chat }) => {
    Media.track([message]);
    upsertChat(chat); addMessage(message); renderChatList();
    if (message.sender_id !== S.me.id) {
      S.typing.delete(message.chat_id);
      if (!S.users.has(message.sender_id)) ensureUser(message.sender_id);
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
    if (u.id === S.me.id) { S.me = { ...S.me, ...u }; renderNavMe(); }
    renderChatList(); renderHeader();
  });
  s.on('story:new', () => Stories.load());
  s.on('story:view', ({ storyId }) => {
    const mine = Stories.groups.find((g) => g.user.id === S.me.id);
    const st = mine?.stories.find((x) => x.id === storyId); if (st) st.views = (st.views || 0) + 1;
    if (!$('#story-viewer').classList.contains('hidden') && Stories.list?.[Stories.gi]?.stories[Stories.si]?.id === storyId) {
      const b = $('#sv-foot [data-sv="viewers"]'); if (b) b.innerHTML = `${icon('eye')}${t('views_n', { n: st?.views || 0 })}`;
    }
  });
  s.on('message:edited', ({ message }) => {
    const arr = S.msgs.get(message.chat_id); const i = arr?.findIndex((x) => x.id === message.id);
    if (i >= 0) arr[i] = message;
    const c = S.chats.get(message.chat_id); if (c?.last?.id === message.id) c.last = message;
    if (S.current === message.chat_id) renderMessages(); renderChatList();
  });
  s.on('chat:update', (c) => { upsertChat({ ...S.chats.get(c.id), ...c }); renderChatList(); if (S.current === c.id) renderHeader(); });
  s.on('chat:removed', ({ chatId }) => { S.chats.delete(chatId); S.msgs.delete(chatId); if (S.current === chatId) { S.current = null; closeChat(); ['#chat-head', '#messages', '#composer', '#channel-bar'].forEach((x) => $(x).classList.add('hidden')); $('#chat-empty').classList.remove('hidden'); } renderChatList(); });
  s.on('typing', ({ chatId, kind, userId }) => {
    S.typing.set(chatId, { kind, userId, until: Date.now() + 4000 });
    renderChatList(); renderHeader();
    setTimeout(() => { renderChatList(); renderHeader(); }, 4100);
  });
  Call.bind(s);
}

/* ---------- bildirishnomalar ---------- */
// Brauzer ovozni faqat foydalanuvchi bir marta bosgandan keyin ruxsat beradi — qo'ng'iroq ohangi eshitilishi uchun
document.addEventListener('pointerdown', function unlockAudio() { try { ctx(); } catch {} document.removeEventListener('pointerdown', unlockAudio); }, { once: true });
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
  if (chat.muted) return;
  beep();
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(chatTitle(chat), { body: (chat.type === 'group' ? (S.users.get(m.sender_id)?.name || '') + ': ' : '') + stripTags(preview(m)), icon: chatAv(chat) || '/icons/icon-192.png', tag: 'chat' + chat.id });
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

/* ======================= PASTKI MENYU (TABLAR) ======================= */
let TAB = 'chats';
function setTab(name) {
  TAB = name;
  $$('#bottom-nav [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  ['chats', 'contacts', 'settings', 'profile'].forEach((n) => $('#pane-' + n).classList.toggle('hidden', n !== name));
  if (name === 'contacts') loadContacts();
  if (name === 'settings') renderSettings();
  if (name === 'profile') renderProfile($('#my-profile'), S.me, { self: true });
}
$('#bottom-nav').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); };
function renderNavMe() { $('#nav-me').innerHTML = avatar({ ...S.me, online: false }); }

/* ---------- Sozlamalar ---------- */
function notifState() { return 'Notification' in window && Notification.permission === 'granted' ? t('state_on') : t('state_off'); }
function renderSettings() {
  $('#set-me').innerHTML = `${avatar({ ...S.me, online: false })}<div><b>${esc(S.me.name)}</b><small>${esc(S.me.email || fmtPhone(S.me.phone))}${S.me.username ? ' · @' + esc(S.me.username) : ''}</small></div>`;
  $('#set-lang').textContent = LANG_NAMES[LANG];
  $('#set-notif').textContent = notifState();
  $('#set-email').textContent = S.me.email || t('email_not_set');
  Media.usage().then((u) => { const el = $('#set-storage'); if (el) el.textContent = fmtSize(u.size || 0) + (Media.dir ? ' · ' + (Media.dirOk ? '📁 ' + Media.dir.name : t('folder_paused')) : ''); });
  applyTheme(store.get('birga_theme') || 'auto');
}
$('#set-me').onclick = () => setTab('profile');
$$('[data-set]').forEach((b) => (b.onclick = async () => {
  const a = b.dataset.set;
  if (a === 'theme') { const cur = store.get('birga_theme') || 'auto'; applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % 3]); }
  if (a === 'logout') logout();
  if (a === 'email') bindEmailModal();
  if (a === 'storage') storageModal();
  if (a === 'saved') { setTab('chats'); startChatWith(S.me.id); }
  if (a === 'invite') invite();
  if (a === 'notif') { await setupPush(true); renderSettings(); }
  if (a === 'lang') {
    modal(`<h3>${t('language')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="lang-opts">${Object.keys(I18N).map((l) => `<button data-l="${l}" class="${l === LANG ? 'on' : ''}">${LANG_NAMES[l]}<span>${l.toUpperCase()}</span></button>`).join('')}</div>`);
    $('.lang-opts').onclick = (e) => { const x = e.target.closest('[data-l]'); if (x) { changeLang(x.dataset.l); closeModal(); } };
  }
}));
async function invite() {
  const url = location.origin;
  const text = t('invite_text') + url;
  try { if (navigator.share) { await navigator.share({ title: 'Birga', text, url }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(text); toast(t('link_copied')); } catch { toast(url, 5000); }
}
$('#btn-invite').onclick = invite;

/* ---------- Kontaktlar ---------- */
function personHTML(u) {
  const st = u.online ? `<small class="on">${t('online')}</small>` : `<small>${u.username ? '@' + esc(u.username) : esc(lastSeen(u))}</small>`;
  return `<div class="person" data-uid="${u.id}">${avatar(u)}<div style="min-width:0"><b>${esc(u.name)}</b>${st}</div></div>`;
}
async function loadContacts() {
  const list = await api('/api/contacts').catch(() => []);
  list.forEach((u) => S.users.set(u.id, { ...S.users.get(u.id), ...u }));
  list.sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name));
  $('#contact-list').innerHTML = list.length ? `<div class="sub">${t('tab_contacts')} · ${list.length}</div>` + list.map(personHTML).join('') : `<p class="empty-note">${esc(t('no_contacts'))}</p>`;
}
const searchUsers = (q) => api('/api/users/search?q=' + encodeURIComponent(q)).catch(() => []);
let csT;
$('#contact-search').oninput = (e) => {
  clearTimeout(csT);
  const q = e.target.value.trim();
  if (!q) { $('#contact-results').innerHTML = ''; return; }
  csT = setTimeout(async () => {
    const res = await searchUsers(q);
    $('#contact-results').innerHTML = `<div class="sub">${t('global_search')}</div>` + (res.length ? res.map(personHTML).join('') : `<p class="empty-note">${esc(t('no_results'))}</p>`);
  }, 300);
};
$('#pane-contacts').addEventListener('click', (e) => { const p = e.target.closest('.person'); if (p) openProfile(+p.dataset.uid); });

/* ---------- Suhbatlar ro'yxati ---------- */
let FILTER = 'all';
$('#filters').onclick = (e) => { const c = e.target.closest('[data-f]'); if (!c) return; FILTER = c.dataset.f; $$('#filters .chip').forEach((x) => x.classList.toggle('on', x === c)); renderChatList(); };
function typingText(chatId) {
  const ty = S.typing.get(chatId);
  if (!ty || ty.until < Date.now()) return null;
  const txt = t({ text: 'typing', voice: 'rec_voice', round: 'rec_round', file: 'sending_file' }[ty.kind] || 'typing');
  const c = S.chats.get(chatId);
  return c && c.type === 'group' && ty.userId ? `${(S.users.get(ty.userId)?.name || '').split(' ')[0]} ${txt}` : txt;
}
function renderChatList() {
  const q = $('#chat-search').value.trim().toLowerCase().replace(/^@/, '');
  const all = [...S.chats.values()].filter((c) => c.last || c.id === S.current);
  const unreadChats = all.filter((c) => c.unread && c.id !== S.current);
  const totalUnread = all.filter((c) => !c.muted).reduce((n, c) => n + (c.id !== S.current ? c.unread || 0 : 0), 0);
  $('#unread-count').textContent = unreadChats.length || '';
  $('#nav-badge').textContent = totalUnread > 99 ? '99+' : totalUnread;
  $('#nav-badge').classList.toggle('hidden', !totalUnread);
  const list = all
    .filter((c) => FILTER !== 'unread' || (c.unread && c.id !== S.current))
    .filter((c) => !q || (chatTitle(c) + ' ' + (c.peer?.username || c.username || '')).toLowerCase().includes(q))
    .sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0));
  $('#list-empty').classList.toggle('hidden', list.length > 0 || !!q || FILTER !== 'all');
  $('#chat-list').innerHTML = list.map((c) => {
    const tt = typingText(c.id);
    const mine = c.last && c.last.sender_id === S.me.id && !c.self && c.last.type !== 'service' && c.type !== 'channel';
    const ticks = mine ? icon(c.peerReadId >= c.last.id ? 'check2' : 'check') : '';
    const who = c.type === 'group' && c.last && !mine && c.last.type !== 'service' ? `<span class="tag">${esc((c.last.sender_name || S.users.get(c.last.sender_id)?.name || '').split(' ')[0])}:</span> ` : '';
    return `<li class="chat-item${c.id === S.current ? ' active' : ''}" data-id="${c.id}">
      ${chatAvatar(c)}
      <div class="ci-body">
        <div class="ci-row"><span class="ci-name">${c.type !== 'private' ? icon(c.type === 'channel' ? 'megaphone' : 'group', 'type-ic') : ''}${esc(chatTitle(c))}${c.muted ? icon('bell-off', 'mute-ic') : ''}</span><span class="ci-time">${ticks}${fmtListTime(c.last?.created_at)}</span></div>
        <div class="ci-row"><span class="ci-sub">${tt ? `<span class="tag">${tt}</span>` : (mine ? `<span class="tag">${t('you')}:</span> ` : who) + preview(c.last)}</span>
        ${c.unread && c.id !== S.current ? `<span class="badge${c.muted ? ' muted' : ''}">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}</div>
      </div></li>`;
  }).join('');
}
$('#chat-list').onclick = (e) => { const li = e.target.closest('.chat-item'); if (li) openChat(+li.dataset.id); };
$('#chat-list').addEventListener('contextmenu', (e) => {
  const li = e.target.closest('.chat-item'); if (!li) return; e.preventDefault();
  chatMenu(+li.dataset.id, e.clientX, e.clientY);
});
function chatMenu(chatId, x, y) {
  const c = S.chats.get(chatId); if (!c) return;
  const el = $('#ctx');
  el.innerHTML = `${c.self ? '' : `<button data-a="profile">${icon(c.type === 'private' ? 'user' : 'group')}${t(c.type === 'private' ? 'view_profile' : 'info')}</button>`}
    <button data-a="mute">${icon(c.muted ? 'bell' : 'bell-off')}${t(c.muted ? 'unmute' : 'mute')}</button>`;
  el.classList.remove('hidden');
  const r = { width: el.offsetWidth, height: el.offsetHeight }; // animatsiya (scale) o'lchamni buzmasligi uchun
  el.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  el.onclick = (ev) => {
    const a = ev.target.closest('[data-a]')?.dataset.a; el.classList.add('hidden');
    if (a === 'profile') { if (c.type === 'private') openProfile(c.peer.id); else openGroupInfo(chatId); }
    if (a === 'mute') setMuted(chatId, !c.muted);
  };
}
// mobil: chatni uzoq bosish = menyu
let clT;
$('#chat-list').addEventListener('touchstart', (e) => {
  const li = e.target.closest('.chat-item'); if (!li) return;
  const tc = e.touches[0];
  clT = setTimeout(() => { navigator.vibrate?.(15); chatMenu(+li.dataset.id, tc.clientX, tc.clientY); li.dataset.lp = 1; }, 520);
}, { passive: true });
['touchend', 'touchmove', 'touchcancel'].forEach((ev) => $('#chat-list').addEventListener(ev, () => clearTimeout(clT), { passive: true }));
$('#chat-list').addEventListener('click', (e) => { const li = e.target.closest('.chat-item'); if (li?.dataset.lp) { delete li.dataset.lp; e.stopImmediatePropagation(); } }, true);

async function setMuted(chatId, muted) {
  await api(`/api/chats/${chatId}/mute`, { body: { muted } }).catch(() => {});
  const c = S.chats.get(chatId); if (c) c.muted = muted;
  toast(t(muted ? 'muted_ok' : 'unmuted_ok')); renderChatList();
  if (PP.user && PP.chatId === chatId) renderProfile(PP.el, PP.user, PP.opts);
  if (GI.chatId === chatId && !$('#profile-page').classList.contains('hidden')) openGroupInfo(chatId, true);
}

// Qidiruv: o'z chatlaringiz + global qidiruv (username, ism, raqam)
let gsT;
$('#chat-search').oninput = () => {
  renderChatList();
  clearTimeout(gsT);
  const q = $('#chat-search').value.trim();
  if (!q) { $('#global-box').classList.add('hidden'); return; }
  gsT = setTimeout(async () => {
    const [res, chats] = await Promise.all([searchUsers(q).then((r) => r.filter((u) => u.id !== S.me.id)), api('/api/chats/search?q=' + encodeURIComponent(q)).catch(() => [])]);
    res.forEach((u) => S.users.set(u.id, { ...S.users.get(u.id), ...u }));
    const chatHTML = chats.map((c) => `<div class="person" data-join="${esc(c.username)}">${chatAvatar(c)}<div style="min-width:0"><b>${icon(c.type === 'channel' ? 'megaphone' : 'group', 'type-ic')}${esc(c.title)}</b><small>@${esc(c.username)} · ${t('n_members', { n: c.members })}</small></div></div>`).join('');
    $('#global-results').innerHTML = res.length || chats.length ? chatHTML + res.map(personHTML).join('') : `<p class="empty-note">${esc(t('no_results'))}</p>`;
    $('#global-box').classList.remove('hidden');
  }, 300);
};
$('#global-results').onclick = (e) => { const j = e.target.closest('[data-join]'); if (j) { joinPreview(j.dataset.join); return; } const p = e.target.closest('.person'); if (p) { $('#chat-search').value = ''; $('#global-box').classList.add('hidden'); startChatWith(+p.dataset.uid); } };

/* ---------- modal ---------- */
function modal(html) { $('#modal-card').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); }
$('#modal').onclick = (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); };

function newChatModal() {
  modal(`<h3>${t('new_chat')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="search"><svg><use href="#i-search"/></svg><input id="ns-q" placeholder="${esc(t('search_users'))}" autocapitalize="off"></div>
    <div class="sub">${t('results')}</div><div id="ns-res"><div class="result" data-uid="${S.me.id}">${avatar({ self: true }, 'sm')}<div><b>${t('saved')}</b><small>${t('saved_hint')}</small></div></div></div>`);
  const inp = $('#ns-q'); if (!isTouch()) inp.focus();
  let tm;
  inp.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => {
    const q = inp.value.trim(); if (!q) return;
    const res = await searchUsers(q);
    $('#ns-res').innerHTML = res.length ? res.map((u) => `<div class="result" data-uid="${u.id}">${avatar(u, 'sm')}<div><b>${esc(u.name)}</b><small>${u.username ? '@' + esc(u.username) : esc(lastSeen(u))}</small></div></div>`).join('')
      : `<p class="muted" style="text-align:center">${esc(t('not_found_user'))}</p>`;
  }, 300); };
  $('#ns-res').onclick = (e) => { const r = e.target.closest('.result'); if (r) { closeModal(); startChatWith(+r.dataset.uid); } };
}
$('#btn-new').onclick = () => createMenu();
$('#btn-new-top').onclick = () => createMenu();
async function startChatWith(uid) {
  try { const c = await api('/api/chats', { body: { userId: uid } }); upsertChat(c); setTab('chats'); renderChatList(); closeProfilePage(); openChat(c.id); return c; }
  catch (e) { toast(e.message); }
}

/* ======================= PROFIL SAHIFASI ======================= */
const PP = { user: null, chatId: null, el: null, opts: null, tab: 'posts' };
async function openProfile(uid) {
  const u = S.users.get(uid) || { id: uid };
  $('#profile-page').classList.remove('hidden');
  pushOverlay('profile');
  await renderProfile($('#profile-inner'), u, { self: uid === S.me.id });
}
function closeProfilePage() { if (!$('#profile-page').classList.contains('hidden')) { $('#profile-page').classList.add('hidden'); popOverlay('profile'); } PP.user = null; }
$('#profile-page').onclick = (e) => { if (e.target.id === 'profile-page') closeProfilePage(); };

async function renderProfile(el, user, opts = {}) {
  const self = !!opts.self;
  PP.el = el; PP.opts = opts;
  let u = self ? S.me : user;
  if (!self) { try { u = await api('/api/users/' + user.id); S.users.set(u.id, { ...S.users.get(u.id), ...u }); } catch {} }
  PP.user = u; PP.chatId = self ? null : u.chatId || Call.chatIdFor(u.id); GI.chatId = null;
  const chat = PP.chatId && S.chats.get(PP.chatId);
  const g = GRADS[(u.id || 0) % GRADS.length];
  const ini = (u.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const cover = u.avatar ? `style="background-image:url('${esc(u.avatar)}')"` : `style="background:linear-gradient(135deg,${g[0]},${g[1]})"`;
  const status = self ? t('online_now') : lastSeen(u);
  const actions = self
    ? `<button data-pa="edit">${icon('pen')}${t('edit_profile')}</button><button data-pa="story">${icon('plus')}${t('add_story')}</button><button data-pa="saved">${icon('bookmark')}${t('saved')}</button><button data-pa="photo">${icon('camera')}${t('photo_short')}</button>`
    : `<button data-pa="msg">${icon('chats')}${t('message')}</button><button data-pa="mute">${icon(chat?.muted ? 'bell-off' : 'bell')}${t(chat?.muted ? 'unmute' : 'mute')}</button><button data-pa="call">${icon('phone')}${t('call')}</button><button data-pa="video">${icon('video')}${t('video')}</button>`;
  const rows = [];
  if (self) { if (u.email) rows.push(`<div class="info-row"><small>Email</small>${esc(u.email)}</div>`); if (u.phone) rows.push(`<div class="info-row"><small>${t('phone')}</small>${esc(fmtPhone(u.phone))}</div>`); }
  if (u.username) rows.push(`<div class="info-row"><small>Username</small>@${esc(u.username)}</div>`);
  if (u.bio) rows.push(`<div class="info-row"><small>${t('bio')}</small>${esc(u.bio)}</div>`);
  if (u.country) rows.push(`<div class="info-row"><small>${t('country')}</small>${flag(u.country)} ${esc(countryName(u.country))}</div>`);
  const tabs = self ? ['posts'] : ['posts', 'media', 'voice', 'files', 'links'];
  if (!tabs.includes(PP.tab)) PP.tab = 'posts';
  el.innerHTML = `<div class="pp-cover" ${cover}>
      ${u.avatar ? '' : `<div class="ini">${esc(ini)}</div>`}
      <div class="pp-top">${self ? '<span></span>' : `<button class="icon-btn" data-pa="back">${icon('back')}</button>`}<input type="file" accept="image/*" id="pp-photo" hidden></div>
      <h1 class="pp-name">${esc(u.name || '')}</h1>
      <p class="pp-status${!self && u.online ? ' on' : ''}">${esc(status)}</p>
      <div class="pp-actions">${actions}</div>
    </div>
    <div class="pp-edit hidden" id="pp-edit"></div>
    <div class="pp-card">${rows.join('')}</div>
    <div class="pp-tabs">${tabs.map((k) => `<button data-pt="${k}" class="${k === PP.tab ? 'on' : ''}">${t('tab_' + k)}</button>`).join('')}</div>
    <div id="pp-content"></div>`;
  el.querySelector('.pp-top [data-pa]')?.addEventListener('click', closeProfilePage);
  el.querySelector('.pp-actions').onclick = (e) => { const a = e.target.closest('[data-pa]')?.dataset.pa; if (a) profileAction(a, u); };
  el.querySelector('.pp-tabs').onclick = (e) => { const b = e.target.closest('[data-pt]'); if (!b) return; PP.tab = b.dataset.pt; el.querySelectorAll('.pp-tabs button').forEach((x) => x.classList.toggle('on', x === b)); loadProfileTab(u); };
  el.querySelector('#pp-photo').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', await compressImage(f, 1000));
    try { S.me = await api('/api/profile/avatar', { body: fd }); renderNavMe(); renderProfile(el, S.me, opts); } catch (er) { toast(er.message); }
  };
  loadProfileTab(u);
}
function profileAction(a, u) {
  if (a === 'msg') startChatWith(u.id);
  if (a === 'call') Call.start(u, false);
  if (a === 'video') Call.start(u, true);
  if (a === 'mute') { if (PP.chatId) setMuted(PP.chatId, !S.chats.get(PP.chatId)?.muted); else startChatWith(u.id); }
  if (a === 'story') pickStory();
  if (a === 'saved') startChatWith(S.me.id);
  if (a === 'photo') PP.el.querySelector('#pp-photo').click();
  if (a === 'edit') {
    const box = PP.el.querySelector('#pp-edit');
    box.classList.toggle('hidden');
    box.innerHTML = `<input class="field" id="pf-name" value="${esc(u.name)}" placeholder="${esc(t('name'))}">
      <div class="field-wrap"><span>@</span><input class="field" id="pf-user" value="${esc(u.username || '')}" placeholder="username" autocapitalize="off"></div>
      <input class="field" id="pf-bio" value="${esc(u.bio || '')}" placeholder="${esc(t('about'))}" maxlength="140">
      <p class="err" id="pf-err"></p><button class="btn-primary" id="pf-save">${t('save')}</button>`;
    box.querySelector('#pf-save').onclick = async () => {
      try { S.me = await api('/api/profile', { body: { name: box.querySelector('#pf-name').value, username: box.querySelector('#pf-user').value, bio: box.querySelector('#pf-bio').value } });
        toast(t('saved_ok')); renderNavMe(); renderProfile(PP.el, S.me, PP.opts); }
      catch (e) { box.querySelector('#pf-err').textContent = e.message; }
    };
  }
}
const ago = (ts) => { const m = Math.floor((Date.now() - ts) / 60000); return m < 1 ? t('just_now') : m < 60 ? t('min_ago', { n: m }) : m < 1440 ? t('hours_ago', { n: Math.floor(m / 60) }) : fmtDay(ts); };
async function loadProfileTab(u) {
  const box = PP.el.querySelector('#pp-content'); if (!box) return;
  const empty = `<p class="empty-note">${t('empty_tab')}</p>`;
  const tab = PP.tab;
  if (tab === 'posts') {
    const posts = await api(`/api/users/${u.id}/posts`).catch(() => []);
    if (PP.tab !== tab) return;
    PP.posts = posts;
    const addTile = u.id === S.me.id ? `<div class="cell add-tile" data-addpost="1">${icon('plus')}<b>${t('add_story')}</b></div>` : '';
    box.innerHTML = posts.length || addTile ? `<div class="pp-grid">${addTile}${posts.map((p, i) => `<div class="cell" data-post="${i}">${p.mime.startsWith('video') ? `<video src="${esc(p.file)}#t=0.1" muted playsinline preload="metadata"></video><span>${icon('play')}${fmtDur(p.duration)}</span>` : `<img src="${esc(p.file)}" loading="lazy" alt="">`}</div>`).join('')}</div>` : empty;
    box.onclick = (e) => { if (e.target.closest('[data-addpost]')) return pickStory(); const c = e.target.closest('[data-post]'); if (c) Stories.open([{ user: u, stories: PP.posts }], 0, +c.dataset.post, { posts: true }); };
    return;
  }
  if (!PP.chatId) { box.innerHTML = empty; return; }
  const items = await api(`/api/chats/${PP.chatId}/shared?kind=${tab}`).catch(() => []);
  if (PP.tab !== tab) return;
  if (!items.length) { box.innerHTML = empty; return; }
  if (tab === 'media') {
    box.innerHTML = `<div class="pp-grid sq">${items.map((m) => `<div class="cell${m.type === 'round' ? ' round' : ''}" data-src="${esc(mediaSrc(m))}" data-kind="${m.type === 'image' ? 'image' : 'video'}">${m.type === 'image' ? `<img src="${esc(m.file)}" loading="lazy" alt="">` : `<video src="${esc(mediaSrc(m))}#t=0.1" muted playsinline preload="metadata"></video><span>${icon(m.type === 'round' ? 'round' : 'play')}${fmtDur(m.duration)}</span>`}</div>`).join('')}</div>`;
    box.onclick = (e) => { const c = e.target.closest('[data-src]'); if (!c) return; $('#viewer-body').innerHTML = c.dataset.kind === 'image' ? `<img src="${c.dataset.src}" alt="">` : `<video src="${c.dataset.src}" controls autoplay playsinline></video>`; $('#viewer').classList.remove('hidden'); };
  } else if (tab === 'voice') {
    box.innerHTML = `<div class="pp-list">${items.map((m) => `<div class="item" data-audio="${esc(mediaSrc(m))}"><button class="vplay">${icon('play')}</button><div><b>${esc(m.sender_id === S.me.id ? t('you') : u.name)}</b><small>${fmtDur(m.duration)} · ${fmtDay(m.created_at)} ${fmtTime(m.created_at)}</small></div></div>`).join('')}</div>`;
    let cur = null;
    box.onclick = (e) => {
      const it = e.target.closest('[data-audio]'); if (!it) return;
      if (cur?.it === it) { if (cur.a.paused) { cur.a.play(); it.querySelector('.vplay').innerHTML = icon('pause'); } else { cur.a.pause(); it.querySelector('.vplay').innerHTML = icon('play'); } return; }
      if (cur) { cur.a.pause(); cur.it.querySelector('.vplay').innerHTML = icon('play'); }
      const a = new Audio(it.dataset.audio); cur = { a, it }; a.play().catch(() => toast(t('play_fail'))); it.querySelector('.vplay').innerHTML = icon('pause');
      a.onended = () => { it.querySelector('.vplay').innerHTML = icon('play'); cur = null; };
    };
  } else if (tab === 'files') {
    box.innerHTML = `<div class="pp-list">${items.map((m) => `<a class="item" href="${esc(m.file)}" target="_blank" download="${esc(m.meta?.name || 'file')}"><span class="fi">${icon('file')}</span><div><b>${esc(m.meta?.name || t('t_file'))}</b><small>${fmtSize(m.size || 0)} · ${fmtDay(m.created_at)}</small></div></a>`).join('')}</div>`;
  } else if (tab === 'links') {
    const links = [];
    items.forEach((m) => (m.text.match(/https?:\/\/[^\s<]+/g) || []).forEach((l) => links.push({ l, m })));
    box.innerHTML = `<div class="pp-list">${links.map(({ l, m }) => `<a class="item" href="${esc(l)}" target="_blank" rel="noopener"><span class="fi">${icon('link')}</span><div><b>${esc(l.replace(/^https?:\/\//, ''))}</b><small>${fmtDay(m.created_at)}</small></div></a>`).join('')}</div>`;
  }
}

/* ---------- orqaga tugmasi (Android) bilan oynalarni yopish ---------- */
const overlays = [];
function pushOverlay(name) { overlays.push(name); history.pushState({ ov: name }, ''); }
function popOverlay(name) { const i = overlays.lastIndexOf(name); if (i >= 0) { overlays.splice(i, 1); if (history.state?.ov === name) history.back(); } }
window.addEventListener('popstate', () => {
  const top = overlays.pop();
  if (top === 'profile') { $('#profile-page').classList.add('hidden'); PP.user = null; return; }
  if (top === 'story') { Stories.close(true); return; }
  closeChat();
});

/* ======================= HIKOYALAR ======================= */
const Stories = {
  groups: [],
  async load() {
    this.groups = await api('/api/stories').catch(() => []);
    this.render();
  },
  render() {
    const mine = this.groups.find((g) => g.user.id === S.me.id);
    const others = this.groups.filter((g) => g.user.id !== S.me.id);
    const me = `<button class="st" data-me="1"><span class="ring${mine ? (mine.stories.length ? ' new' : '') : ''}">${avatar({ ...S.me, online: false })}<span class="plus" data-add="1">${icon('plus')}</span></span><span class="nm">${t('my_story')}</span></button>`;
    $('#stories').innerHTML = me + others.map((g) => `<button class="st" data-uid="${g.user.id}"><span class="ring${g.allSeen ? '' : ' new'}">${avatar({ ...g.user, online: false })}</span><span class="nm">${esc((g.user.name || '').split(' ')[0])}</span></button>`).join('');
  },
  open(groups, gi = 0, si = null, opts = {}) {
    this.list = groups; this.gi = gi; this.opts = opts;
    const g = groups[gi];
    this.si = si ?? Math.max(0, g.stories.findIndex((s) => !s.seen));
    if (this.si < 0 || this.si >= g.stories.length) this.si = 0;
    $('#story-viewer').classList.remove('hidden');
    pushOverlay('story');
    this.show();
  },
  show() {
    clearTimeout(this.timer); cancelAnimationFrame(this.raf);
    const g = this.list[this.gi], s = g.stories[this.si];
    const own = g.user.id === S.me.id;
    $('#sv-bars').innerHTML = g.stories.map((_, i) => `<i><b style="width:${i < this.si ? 100 : 0}%"></b></i>`).join('');
    $('#sv-user').innerHTML = `${avatar({ ...g.user, online: false })}<div><b>${esc(own ? t('my_story') : g.user.name)}</b><small>${ago(s.created_at)}</small></div>`;
    $('#sv-caption').textContent = s.caption || '';
    const isVid = s.mime.startsWith('video');
    $('#sv-media').innerHTML = isVid ? `<video src="${esc(s.file)}" playsinline autoplay></video>` : `<img src="${esc(s.file)}" alt="">`;
    $('#sv-foot').innerHTML = own
      ? (this.opts.posts ? `<span class="grow"></span>` : `<button class="sv-btn" data-sv="viewers">${icon('eye')}${t('views_n', { n: s.views || 0 })}</button><span class="grow"></span>`) + `<button class="sv-btn" data-sv="delete">${icon('trash')}${t('delete_story')}</button>`
      : `<input id="sv-reply" placeholder="${esc(t('reply_story'))}"><button class="send-btn" data-sv="reply" data-mode="send">${icon('send', 'ic-send')}</button>`;
    if (!own && !s.seen && !this.opts.posts) { s.seen = true; api(`/api/stories/${s.id}/view`, { method: 'POST' }).catch(() => {}); }
    this.paused = false; this.elapsed = 0;
    const bar = $('#sv-bars').children[this.si]?.firstChild;
    const run = (dur) => {
      let last = performance.now();
      const step = (now) => {
        if (!this.paused) this.elapsed += now - last;
        last = now;
        if (bar) bar.style.width = Math.min(100, (this.elapsed / dur) * 100) + '%';
        if (this.elapsed >= dur) return this.next();
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    };
    if (isVid) {
      const v = $('#sv-media video');
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
      v.onloadedmetadata = () => run(Math.min(60, isFinite(v.duration) ? v.duration : s.duration || 15) * 1000);
      v.onerror = () => run(5000);
    } else run(5000);
  },
  pause(p) { this.paused = p; const v = $('#sv-media video'); if (v) p ? v.pause() : v.play().catch(() => {}); },
  next() { const g = this.list[this.gi]; if (this.si < g.stories.length - 1) { this.si++; this.show(); } else if (this.gi < this.list.length - 1) { this.gi++; this.si = Math.max(0, this.list[this.gi].stories.findIndex((s) => !s.seen)); this.show(); } else this.close(); },
  prev() { if (this.si > 0) { this.si--; this.show(); } else if (this.gi > 0) { this.gi--; this.si = 0; this.show(); } else { this.elapsed = 0; this.show(); } },
  close(fromPop) {
    clearTimeout(this.timer); cancelAnimationFrame(this.raf);
    $('#sv-media').innerHTML = ''; $('#story-viewer').classList.add('hidden');
    if (!fromPop) popOverlay('story');
    this.render();
  },
};
$('#stories').onclick = (e) => {
  const st = e.target.closest('.st'); if (!st) return;
  if (st.dataset.me) {
    const mine = Stories.groups.find((g) => g.user.id === S.me.id);
    if (e.target.closest('[data-add]') || !mine) return pickStory();
    return Stories.open([mine], 0, 0);
  }
  const others = Stories.groups.filter((g) => g.user.id !== S.me.id);
  Stories.open(others, others.findIndex((g) => g.user.id === +st.dataset.uid));
};
// bosish: chap — oldingi, o'ng — keyingi; bosib turish — pauza
(() => {
  const stage = $('#sv-stage'); let downT = 0, lp = false, pt;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#sv-foot, #sv-close')) return;
    downT = Date.now(); lp = false; pt = setTimeout(() => { lp = true; Stories.pause(true); }, 220);
  });
  stage.addEventListener('pointerup', (e) => {
    if (e.target.closest('#sv-foot, #sv-close')) return;
    clearTimeout(pt);
    if (lp) { Stories.pause(false); return; }
    const r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) Stories.prev(); else Stories.next();
  });
  $('#sv-close').onclick = () => Stories.close();
  $('#sv-foot').addEventListener('focusin', () => Stories.pause(true));
  $('#sv-foot').addEventListener('focusout', () => Stories.pause(false));
  $('#sv-foot').onclick = async (e) => {
    const a = e.target.closest('[data-sv]')?.dataset.sv; if (!a) return;
    const g = Stories.list[Stories.gi], s = g.stories[Stories.si];
    if (a === 'reply') {
      const txt = $('#sv-reply').value.trim(); if (!txt) return;
      $('#sv-reply').value = '';
      const c = await api('/api/chats', { body: { userId: g.user.id } }).catch(() => null);
      if (c) { upsertChat(c); if (!S.msgs.has(c.id)) S.msgs.set(c.id, []); await emitSend({ chatId: c.id, type: 'text', text: t('story_reply_prefix') + txt }).catch(() => {}); toast(t('sent_ok')); }
      Stories.pause(false);
    }
    if (a === 'viewers') {
      Stories.pause(true);
      const list = await api(`/api/stories/${s.id}/viewers`).catch(() => []);
      modal(`<h3>${t('viewers')} <button class="icon-btn" data-close>${icon('close')}</button></h3>${list.length ? list.map((u) => `<div class="person">${avatar(u)}<div><b>${esc(u.name)}</b><small>${ago(u.viewed_at)}</small></div></div>`).join('') : `<p class="empty-note">${t('no_viewers')}</p>`}`);
    }
    if (a === 'delete' && confirm(t('confirm_delete_story'))) {
      await api(`/api/stories/${s.id}`, { method: 'DELETE' }).catch(() => {});
      toast(t('story_deleted'));
      g.stories.splice(Stories.si, 1);
      if (PP.posts) PP.posts = PP.posts.filter((p) => p.id !== s.id);
      Stories.close(); Stories.load(); if (PP.user) loadProfileTab(PP.user);
    }
  };
})();
// Yangi hikoya: rasm yoki video tanlash → izoh → joylash
function pickStory() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,video/*';
  inp.onchange = () => { const f = inp.files[0]; if (f) storyComposer(f); };
  inp.click();
}
async function storyComposer(file) {
  const max = S.config.maxUploadMb || 50;
  if (file.size > max * 1048576) return toast(t('too_big', { n: max }), 3500);
  const isVid = file.type.startsWith('video');
  const url = URL.createObjectURL(file);
  modal(`<h3>${t('add_story')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    ${isVid ? `<video class="story-prev" src="${url}" controls playsinline></video>` : `<img class="story-prev" src="${url}" alt="">`}
    <input class="field" id="sc-cap" placeholder="${esc(t('story_caption'))}" maxlength="300">
    <label class="check"><input type="checkbox" id="sc-pin" checked> ${t('keep_profile')}</label>
    <div class="progress hidden" id="sc-prog"><b></b></div>
    <button class="btn-primary" id="sc-go">${t('publish')}</button>`);
  $('#sc-go').onclick = async () => {
    const btn = $('#sc-go'); btn.disabled = true; btn.textContent = t('uploading');
    $('#sc-prog').classList.remove('hidden');
    try {
      const f = isVid ? file : await compressImage(file, 1600);
      const dur = isVid ? await videoDuration(file) : null;
      const up = await uploadFile(f, (p) => ($('#sc-prog b').style.width = Math.round(p * 100) + '%'), isVid ? 'video' : '');
      await api('/api/stories', { body: { file: up.url, mime: up.mime || f.type, caption: $('#sc-cap').value, duration: up.duration || dur, pinned: $('#sc-pin').checked } });
      closeModal(); toast(t('story_posted')); Stories.load();
      if (PP.user?.id === S.me.id) loadProfileTab(S.me);
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = t('publish'); }
  };
}

/* ======================= SUHBAT ======================= */
function currentPeer() { const c = S.chats.get(S.current); return c && c.peer && (S.users.get(c.peer.id) || c.peer); }

async function openChat(id) {
  const first = S.current !== id;
  S.current = id; S.replyTo = null; S.editing = null; $('#reply-bar').classList.add('hidden');
  ['#chat-head', '#messages', '#composer'].forEach((s) => $(s).classList.remove('hidden'));
  $('#chat-empty').classList.add('hidden');
  const c = S.chats.get(id);
  const callable = c?.type === 'private' && !c.self;
  $('#btn-audio-call').classList.toggle('hidden', !callable);
  $('#btn-video-call').classList.toggle('hidden', !callable);
  const readOnly = c?.type === 'channel' && !['owner', 'admin'].includes(c.role);
  $('#composer').classList.toggle('hidden', readOnly); $('#channel-bar').classList.toggle('hidden', !readOnly);
  if (readOnly) renderChannelBar(c);
  closePanel();
  if (c && c.type === 'group') api(`/api/chats/${id}/info`).then((info) => { info.memberList.forEach((u) => S.users.set(u.id, { ...S.users.get(u.id), ...u })); if (S.current === id) renderMessages(); }).catch(() => {});
  if (first && matchMedia('(max-width:760px)').matches && !$('#app').classList.contains('show-chat')) history.pushState({ chat: id }, '');
  $('#app').classList.add('show-chat');
  renderHeader(); renderChatList();
  if (first) $('#messages').innerHTML = '';
  await loadMessages(id);
  if (!isTouch()) $('#text').focus();
}
function closeChat() { $('#app').classList.remove('show-chat'); }
$('#btn-back').onclick = () => (history.state?.chat ? history.back() : closeChat());

function renderHeader() {
  const c = S.chats.get(S.current); if (!c) return;
  if (c.type !== 'private') {
    const tt = typingText(c.id);
    const sub = tt || t(c.type === 'channel' ? 'n_subscribers' : 'n_members', { n: c.members || 0 });
    $('#peer-info').innerHTML = `${chatAvatar(c, 'sm')}<div style="min-width:0"><b>${esc(c.title)}</b><span class="${tt ? 'on' : ''}">${esc(sub)}</span></div>`;
    return;
  }
  const p = currentPeer();
  const tt = typingText(c.id);
  const st = c.self ? '' : tt || lastSeen(p);
  $('#peer-info').innerHTML = `${avatar({ ...p, self: c.self }, 'sm')}<div style="min-width:0"><b>${esc(c.self ? t('saved') : p.name)}</b><span class="${tt || p.online ? 'on' : ''}">${esc(st)}</span></div>`;
}
$('#peer-info').onclick = () => { const c = S.chats.get(S.current); if (!c || c.self) return; if (c.type === 'private') openProfile(c.peer.id); else openGroupInfo(c.id); };
$('#btn-audio-call').onclick = () => Call.start(currentPeer(), false);
$('#btn-video-call').onclick = () => Call.start(currentPeer(), true);

async function loadMessages(id) {
  const list = await api(`/api/chats/${id}/messages`).catch(() => null);
  if (!list || S.current !== id) return;
  const pending = (S.msgs.get(id) || []).filter((m) => m.pending);
  S.msgs.set(id, [...list, ...pending]);
  renderMessages(true); markRead(); Media.track(list);
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
  if (m.type === 'service') return `<div class="svc" data-id="${m.id}">${esc(serviceText(m))}</div>`;
  const inner = msgInner(m, c, tail, gap);
  const grp = c?.type === 'group' && m.sender_id !== S.me.id;
  if (!grp) return inner;
  const u = S.users.get(m.sender_id) || { id: m.sender_id, name: '?' };
  return `<div class="grp-row${gap ? ' gap' : ''}"><div class="grp-av" data-uid="${u.id}">${tail ? avatar({ ...u, online: false }, 'xs') : ''}</div>${inner}</div>`;
}
const NAME_COLORS = ['#E5484D', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];
function msgInner(m, c, tail, gap) {
  const out = m.sender_id === S.me.id;
  const cls = `msg ${out ? 'out' : 'in'}${tail ? ' tail' : ''}${gap ? ' gap' : ''}`;
  const meta = (over) => `<span class="meta${over ? ' over' : ''}">${m.edited ? `<span class="ed">${t('edited')}</span>` : ''}${fmtTime(m.created_at)}<span class="tk">${ticksFor(m, c)}</span></span>`;
  const attrs = `class="${cls}" data-id="${m.id || ''}"`;
  if (m.deleted) return `<div ${attrs}><div class="bubble"><span class="deleted">${t('deleted')}</span>${meta()}</div></div>`;
  let reply = '';
  // guruhda yuboruvchi ismi va uzatilgan xabar belgisi
  if (c?.type === 'group' && !out && gap) { const nm = S.users.get(m.sender_id)?.name || ''; reply += `<div class="sender" style="color:${NAME_COLORS[m.sender_id % NAME_COLORS.length]}">${esc(nm)}</div>`; }
  if (m.meta?.fwd) reply += `<div class="fwd">${icon('forward')}${t('forwarded_from')} <b>${esc(m.meta.fwd.name || '')}</b></div>`;
  if (m.reply_to) {
    const r = (S.msgs.get(m.chat_id) || []).find((x) => x.id === m.reply_to);
    if (r) reply += `<div class="reply-q" data-goto="${r.id}">${replyThumb(r)}<div><b>${esc(r.sender_id === S.me.id ? t('you') : S.users.get(r.sender_id)?.name || '')}</b><span>${stripTags(preview(r)) || '…'}</span></div></div>`;
  }
  const prog = m.pending && m.progress != null ? `<div class="upload-ov"${m.type === 'round' ? ' style="border-radius:50%"' : ''}>${m.progress >= 1 ? t('processing') : Math.round(m.progress * 100) + '%'}</div>` : '';
  const src = esc(m.localUrl || mediaSrc(m));
  if (m.gone && !m.localUrl && !Media.has(m)) return `<div ${attrs}><div class="bubble">${reply}<div class="gone-box">${icon(m.type === 'voice' ? 'mic' : m.type === 'file' ? 'file' : 'image')}<span>${esc(t('media_gone'))}</span></div>${meta()}</div></div>`;
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
      return `<div ${attrs}>${reply ? `<div class="bubble mini">${reply}</div>` : ''}<div class="round-msg" data-dur="${m.duration || 0}">
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
    case 'sticker': {
      const cp = m.meta?.cp || emojiCp(m.meta?.e || '');
      return `<div ${attrs}><div class="sticker-wrap">${reply ? `<div class="bubble mini">${reply}</div>` : ''}${stickerImg(m.meta?.e, cp, 'sticker')}<span class="meta stk">${fmtTime(m.created_at)}<span class="tk">${ticksFor(m, c)}</span></span></div></div>`;
    }
    case 'gif':
      return `<div ${attrs}><div class="bubble media">${reply}<video class="gif" src="${esc(m.meta?.gif || '')}" autoplay loop muted playsinline></video>${meta(true)}</div></div>`;
    default: {
      const big = isEmojiOnly(m.text);
      if (big && !reply) return `<div ${attrs}><div class="big-emoji n${big}">${esc(m.text)}<span class="meta stk">${fmtTime(m.created_at)}<span class="tk">${ticksFor(m, c)}</span></span></div></div>`;
      return `<div ${attrs}><div class="bubble">${reply}<span class="txt">${linkify(m.text)}</span>${meta()}</div></div>`;
    }
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
  const ga = e.target.closest('.grp-av[data-uid]'); if (ga && ga.innerHTML) { openProfile(+ga.dataset.uid); return; }
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
    ${out && m.type === 'text' ? `<button data-a="edit">${icon('pen')}${t('edit')}</button>` : ''}
    <button data-a="fwd">${icon('forward')}${t('forward')}</button>
    ${m.file && (!m.gone || Media.has(m)) ? `<button data-a="save">${icon('download')}${t('save_device')}</button>` : ''}
    ${out || ['owner', 'admin'].includes(S.chats.get(m.chat_id)?.role) ? `<button data-a="del" class="danger">${icon('trash')}${t('delete')}</button>` : ''}`;
  el.classList.remove('hidden');
  const r = { width: el.offsetWidth, height: el.offsetHeight }; // animatsiya (scale) o'lchamni buzmasligi uchun
  el.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  el.onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a; el.classList.add('hidden');
    if (a === 'reply') setReply(m);
    if (a === 'edit') setEdit(m);
    if (a === 'fwd') forwardModal([m.id]);
    if (a === 'save') Media.saveAs(m);
    if (a === 'copy') navigator.clipboard?.writeText(m.text).then(() => toast(t('copied'))).catch(() => {});
    if (a === 'del' && confirm(t('confirm_delete'))) S.socket.emit('message:delete', { id: m.id });
  };
}
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); });
const msgOf = (el) => S.msgs.get(S.current)?.find((m) => m.id === +el.dataset.id);
$('#messages').addEventListener('contextmenu', (e) => {
  const el = e.target.closest('.msg'); const m = el && msgOf(el); if (!m || m.deleted || m.type === 'call' || m.type === 'service') return;
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

function setEdit(m) {
  S.replyTo = null; S.editing = m;
  $('#reply-icon').innerHTML = '<use href="#i-pen"/>';
  $('#reply-name').textContent = t('editing');
  $('#reply-text').textContent = m.text;
  $('#reply-bar').classList.remove('hidden');
  textEl.value = m.text; textEl.dispatchEvent(new Event('input')); textEl.focus();
}
function setReply(m) {
  S.editing = null; $('#reply-icon').innerHTML = '<use href="#i-reply"/>';
  S.replyTo = m;
  $('#reply-name').textContent = m.sender_id === S.me.id ? t('you') : S.users.get(m.sender_id)?.name || '';
  $('#reply-text').innerHTML = replyThumb(m) + esc(stripTags(preview(m)));
  $('#reply-bar').classList.remove('hidden'); if (!isTouch()) $('#text').focus();
  navigator.vibrate?.(10);
}
$('#reply-cancel').onclick = () => { if (S.editing) { textEl.value = ''; textEl.dispatchEvent(new Event('input')); } S.replyTo = null; S.editing = null; $('#reply-icon').innerHTML = '<use href="#i-reply"/>'; $('#reply-bar').classList.add('hidden'); };

/* ======================= XABAR YUBORISH ======================= */
const textEl = $('#text'), actionBtn = $('#btn-action');
function updateAction() { const has = !!textEl.value.trim(); actionBtn.dataset.mode = has ? 'send' : 'voice'; $('#btn-round').classList.toggle('hidden', has || !!Rec?.active); }
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
  if (S.editing) { // xabarni tahrirlash
    const m = S.editing; S.socket.emit('message:edit', { id: m.id, text: txt });
    textEl.value = ''; textEl.style.height = 'auto'; S.editing = null; $('#reply-cancel').click(); updateAction(); return;
  }
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
    Media.putLocal(blob, up.url, up.alt, type); // yuborganning o'zida ham qurilmada saqlanadi
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
let pressT = 0, startX = 0, startY = 0, holdTimer = null;
// Ikki tugma: 🎤 ovozli xabar va ⏺ video xabar.
// Bir marta bosish — yozish boshlanadi (qo'l bo'sh), yana bosish — yuboriladi.
// Bosib turish — yozadi, qo'yib yuborilsa yuboriladi; chapga surish — bekor, yuqoriga — qulflash.
function bindRec(btn, kind) {
  btn.addEventListener('pointerdown', (e) => {
    if ((btn === actionBtn && actionBtn.dataset.mode === 'send') || Rec.locked) return;
    e.preventDefault();
    pressT = Date.now(); startX = e.clientX; startY = e.clientY;
    try { btn.setPointerCapture(e.pointerId); } catch {}
    ctx(); // AudioContext'ni foydalanuvchi harakati bilan ochish
    holdTimer = setTimeout(() => startRecording(kind, { hold: true }), 260);
  });
  btn.addEventListener('pointermove', (e) => {
    if (!Rec.active || !Rec.hold || Rec.locked) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    $('#rec-hint').style.transform = `translateX(${Math.min(0, dx)}px)`;
    if (dx < -110) stopRecording(false); else if (dy < -70) lockRecording();
  });
  btn.addEventListener('pointerup', () => {
    clearTimeout(holdTimer);
    if (Rec.justLocked) { Rec.justLocked = false; return; } // qulflangandan keyin barmoq qo'yildi — yozish davom etadi
    if (Rec.locked) { if (btn === actionBtn) stopRecording(true); return; }
    if (btn === actionBtn && actionBtn.dataset.mode === 'send') return sendText();
    if (Rec.active && Rec.hold) return stopRecording(true);
    if (!Rec.active && Date.now() - pressT < 260) startRecording(kind, { tap: true });
  });
  btn.addEventListener('pointercancel', () => { clearTimeout(holdTimer); if (Rec.active && Rec.hold && !Rec.locked) stopRecording(false); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}
bindRec(actionBtn, 'voice');
bindRec($('#btn-round'), 'round');
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

async function startRecording(kind, opts = {}) {
  if (Rec.active || Call.active) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast(t('need_https'), 3500); return; }
  $('#round-actions').classList.add('hidden');
  Object.assign(Rec, { active: true, kind, hold: !!opts.hold, locked: false, justLocked: false, facing: 'user', chunks: [], levels: [], t0: Date.now(), mr: null, stream: null, comp: null });
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
  $('#btn-round').classList.add('hidden');
  if (opts.tap) { lockRecording(); Rec.justLocked = false; } // bir marta bosilgan — qo'l bo'sh rejim
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
    this.hasRelay = false;
    pc.onicecandidate = (e) => { if (!e.candidate) return; if (/ typ relay /.test(e.candidate.candidate)) this.hasRelay = true; this.s.emit('call:ice', { to: this.peer.id, callId: this.id, candidate: e.candidate }); };
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
        if (st === 'failed') pc.restartIce?.(); // ikkala tomon ham qayta ulanishga urinadi
        clearTimeout(this.failT);
        this.failT = setTimeout(() => { if (pc.connectionState !== 'connected' && this.active) { $('#call-status').textContent = t('conn_lost'); toast(t(this.hasRelay ? 'conn_lost' : 'call_need_turn'), 5000); this.end(); } }, 20000);
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
  chatIdFor(peerId) { for (const c of S.chats.values()) if (c.type !== 'group' && c.type !== 'channel' && c.peer?.id === peerId && !c.self) return c.id; return null; },
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
    if (!$('#story-viewer').classList.contains('hidden')) Stories.close(); // hikoya ochiq bo'lsa qo'ng'iroq ustida qolmasin
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

/* ======================= v4: GURUHLAR, KANALLAR, STIKERLAR, UZATISH ======================= */
function chatTitle(c) { if (!c) return ''; if (c.type && c.type !== 'private') return c.title || ''; return c.self ? t('saved') : (S.users.get(c.peer?.id)?.name || c.peer?.name || ''); }
function chatAv(c) { return c?.type && c.type !== 'private' ? c.avatar : S.users.get(c?.peer?.id)?.avatar || c?.peer?.avatar; }
function chatAvatar(c, cls = '') {
  if (!c) return avatar(null, cls);
  if (!c.type || c.type === 'private') { const p = S.users.get(c.peer?.id) || c.peer; return avatar({ ...p, self: c.self }, cls); }
  if (c.avatar) return `<div class="av ${cls}" style="background-image:url('${esc(c.avatar)}')"></div>`;
  const g = GRADS[(c.id || 0) % GRADS.length];
  const ini = (c.title || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="av ${cls}" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${esc(ini)}</div>`;
}
function serviceText(m) {
  const who = m.sender_id === S.me.id ? t('you') : (S.users.get(m.sender_id)?.name || '');
  const names = (m.meta?.names || []).filter(Boolean).join(', ');
  switch (m.meta?.action) {
    case 'created': return t(m.meta.type === 'channel' ? 'svc_channel_created' : 'svc_group_created', { who });
    case 'added': return t('svc_added', { who, names });
    case 'removed': return t('svc_removed', { who, names });
    case 'joined': return t('svc_joined', { names });
    case 'left': return t('svc_left', { names });
    default: return m.text || '';
  }
}
const pendingUsers = new Set();
async function ensureUser(id) {
  if (!id || S.users.has(id) || pendingUsers.has(id)) return;
  pendingUsers.add(id);
  try { const u = await api('/api/users/' + id); S.users.set(u.id, { ...S.users.get(u.id), ...u }); if (S.current) renderMessages(); renderChatList(); } catch {}
  pendingUsers.delete(id);
}
function replyThumb(r) {
  if (!r) return '';
  const src = esc(r.localUrl || r.file || '');
  if (r.type === 'image') return `<img class="rq-th" src="${src}" alt="">`;
  if (r.type === 'video' || r.type === 'round') return `<video class="rq-th${r.type === 'round' ? ' round' : ''}" src="${esc(r.localUrl || mediaSrc(r))}#t=0.1" muted playsinline preload="metadata"></video>`;
  if (r.type === 'sticker') return `<span class="rq-th emo">${esc(r.meta?.e || '')}</span>`;
  return '';
}
const emojiCp = (e) => [...String(e)].map((ch) => ch.codePointAt(0).toString(16)).filter((x) => x !== 'fe0f').join('-');
// Stiker: Google Noto animatsion emoji (CC BY 4.0), yuklanmasa — serverdagi Noto rasm
function stickerImg(e, cp, cls = '') {
  cp = cp || emojiCp(e || '');
  return `<img class="${cls}" src="https://fonts.gstatic.com/s/e/notoemoji/latest/${cp.replace(/-/g, '_')}/512.webp" alt="${esc(e || '')}" loading="lazy" onerror="this.onerror=null;this.src='/stickers/${cp}.svg';this.classList.add('still')">`;
}
function isEmojiOnly(text) {
  const s = String(text || '').trim();
  if (!s || s.length > 24) return 0;
  const m = s.match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu);
  if (!m || m.length > 3 || m.join('') !== s.replace(/\s/g, '')) return 0;
  return m.length;
}

/* ---------- Yaratish menyusi ---------- */
function createMenu() {
  modal(`<h3>${t('create')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="group menu-list">
      <button class="row-btn" data-cm="chat"><span class="ri c2">${icon('pen')}</span><span>${t('new_chat')}<small>${t('new_chat_hint')}</small></span></button>
      <button class="row-btn" data-cm="group"><span class="ri c5">${icon('group')}</span><span>${t('new_group')}<small>${t('new_group_hint')}</small></span></button>
      <button class="row-btn" data-cm="channel"><span class="ri c6">${icon('megaphone')}</span><span>${t('new_channel')}<small>${t('new_channel_hint')}</small></span></button>
    </div>`);
  $('.menu-list').onclick = (e) => { const b = e.target.closest('[data-cm]'); if (!b) return; const k = b.dataset.cm; if (k === 'chat') newChatModal(); else createGroupModal(k); };
}
async function createGroupModal(type) {
  const isCh = type === 'channel';
  const people = await api('/api/contacts').catch(() => []);
  const sel = new Set();
  modal(`<h3>${t(isCh ? 'new_channel' : 'new_group')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <input class="field" id="cg-title" maxlength="80" placeholder="${esc(t(isCh ? 'channel_name' : 'group_name'))}">
    ${isCh ? `<input class="field" id="cg-about" maxlength="255" placeholder="${esc(t('description'))}">
      <div class="field-wrap"><span>@</span><input class="field" id="cg-user" maxlength="32" autocapitalize="off" placeholder="${esc(t('public_link_opt'))}"></div>` : ''}
    <div class="sub">${t(isCh ? 'invite_subscribers' : 'add_members')}</div>
    <div class="search"><svg><use href="#i-search"/></svg><input id="cg-q" placeholder="${esc(t('search_users'))}" autocapitalize="off"></div>
    <div id="cg-list" class="pick-list"></div>
    <p class="err" id="cg-err"></p>
    <button class="btn-primary" id="cg-go">${t('create')}</button>`);
  const draw = (list) => {
    $('#cg-list').innerHTML = list.length ? list.map((u) => `<label class="person pick"><input type="checkbox" value="${u.id}" ${sel.has(u.id) ? 'checked' : ''}>${avatar(u, 'sm')}<div><b>${esc(u.contactName || u.name)}</b><small>${u.username ? '@' + esc(u.username) : esc(lastSeen(u))}</small></div></label>`).join('')
      : `<p class="empty-note">${esc(t('no_contacts'))}</p>`;
  };
  draw(people);
  $('#cg-list').onchange = (e) => { const v = +e.target.value; if (e.target.checked) sel.add(v); else sel.delete(v); };
  let tm;
  $('#cg-q').oninput = (e) => { clearTimeout(tm); const q = e.target.value.trim(); tm = setTimeout(async () => { draw(q ? await searchUsers(q) : people); }, 300); };
  $('#cg-go').onclick = async () => {
    try {
      const c = await api('/api/groups', { body: { type, title: $('#cg-title').value, about: $('#cg-about')?.value, username: $('#cg-user')?.value, members: [...sel] } });
      upsertChat(c); closeModal(); setTab('chats'); renderChatList(); openChat(c.id);
      if (isCh) setTimeout(() => shareInvite(c), 600);
    } catch (e) { $('#cg-err').textContent = e.message; }
  };
}
const inviteUrl = (c) => `${location.origin}/?join=${encodeURIComponent(c.username || c.invite)}`;
async function shareInvite(c) {
  const url = inviteUrl(c);
  modal(`<h3>${t('invite_link')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <p class="muted">${esc(t('invite_link_hint'))}</p><div class="link-box" id="il">${esc(url)}</div>
    <div style="display:flex;gap:10px"><button class="btn-primary" id="il-copy">${t('copy')}</button>${navigator.share ? `<button class="btn-primary" id="il-share">${t('share')}</button>` : ''}</div>`);
  $('#il-copy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast(t('link_copied')); } catch { getSelection().selectAllChildren($('#il')); } };
  $('#il-share')?.addEventListener('click', () => navigator.share({ title: c.title, text: c.title, url }).catch(() => {}));
}
async function joinPreview(code) {
  try {
    const c = await api('/api/join/' + encodeURIComponent(code));
    if (c.joined) { await loadChats(); return openChat(c.id); }
    modal(`<div class="join-card">${chatAvatar(c, 'xl')}<h3>${esc(c.title)}</h3><small class="muted">${t(c.type === 'channel' ? 'n_subscribers' : 'n_members', { n: c.members })}</small>
      ${c.about ? `<p>${esc(c.about)}</p>` : ''}<button class="btn-primary" id="jp-go">${t(c.type === 'channel' ? 'subscribe' : 'join_group')}</button></div>`);
    $('#jp-go').onclick = async () => { const s = await api('/api/join/' + encodeURIComponent(code), { body: {} }); upsertChat(s); closeModal(); setTab('chats'); renderChatList(); openChat(s.id); };
  } catch { toast(t('link_invalid')); }
}
function renderChannelBar(c) {
  $('#channel-bar').innerHTML = `<button class="link-btn" id="cb-mute">${icon(c.muted ? 'bell' : 'bell-off')} ${t(c.muted ? 'unmute' : 'mute')}</button>`;
  $('#cb-mute').onclick = () => setMuted(c.id, !c.muted).then(() => renderChannelBar(S.chats.get(c.id)));
}

/* ---------- Guruh / kanal ma'lumotlari ---------- */
const GI = { chatId: null, tab: 'members' };
async function openGroupInfo(chatId, refresh) {
  let info;
  try { info = await api(`/api/chats/${chatId}/info`); } catch (e) { return toast(e.message); }
  info.memberList.forEach((u) => S.users.set(u.id, { ...S.users.get(u.id), ...u }));
  GI.chatId = chatId; PP.user = null;
  const c = { ...S.chats.get(chatId), ...info };
  const admin = ['owner', 'admin'].includes(info.role), owner = info.role === 'owner';
  if (!refresh) { $('#profile-page').classList.remove('hidden'); pushOverlay('profile'); }
  const el = $('#profile-inner');
  const g = GRADS[(c.id || 0) % GRADS.length];
  const cover = c.avatar ? `style="background-image:url('${esc(c.avatar)}')"` : `style="background:linear-gradient(135deg,${g[0]},${g[1]})"`;
  const ini = (c.title || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const tabs = [...(info.memberList.length ? ['members'] : []), 'media', 'voice', 'files', 'links'];
  if (!tabs.includes(GI.tab)) GI.tab = tabs[0];
  el.innerHTML = `<div class="pp-cover" ${cover}>${c.avatar ? '' : `<div class="ini">${esc(ini)}</div>`}
      <div class="pp-top"><button class="icon-btn" data-ga="back">${icon('back')}</button><input type="file" accept="image/*" id="gi-photo" hidden></div>
      <h1 class="pp-name">${icon(c.type === 'channel' ? 'megaphone' : 'group', 'type-ic big')}${esc(c.title)}</h1>
      <p class="pp-status">${t(c.type === 'channel' ? 'n_subscribers' : 'n_members', { n: c.members })}</p>
      <div class="pp-actions">
        <button data-ga="msg">${icon('chats')}${t('message')}</button>
        <button data-ga="mute">${icon(S.chats.get(chatId)?.muted ? 'bell-off' : 'bell')}${t(S.chats.get(chatId)?.muted ? 'unmute' : 'mute')}</button>
        ${admin || c.type === 'group' ? `<button data-ga="add">${icon('plus')}${t('add')}</button>` : ''}
        ${admin ? `<button data-ga="link">${icon('link')}${t('link')}</button>` : `<button data-ga="leave">${icon('logout')}${t('leave')}</button>`}
      </div></div>
    <div class="pp-edit hidden" id="gi-edit"></div>
    <div class="pp-card">
      ${c.about ? `<div class="info-row"><small>${t('description')}</small>${linkify(c.about)}</div>` : ''}
      ${c.username ? `<div class="info-row"><small>${t('link')}</small>${esc(location.host)}/?join=${esc(c.username)}</div>` : ''}
      ${admin ? `<button class="row-btn" data-ga="edit">${icon('pen')}${t('edit')}</button><button class="row-btn" data-ga="photo">${icon('camera')}${t('photo_short')}</button>` : ''}
      ${admin ? `<button class="row-btn" data-ga="leave">${icon('logout')}${t('leave')}</button>` : ''}
      ${owner ? `<button class="row-btn danger" data-ga="delete">${icon('trash')}${t(c.type === 'channel' ? 'delete_channel' : 'delete_group')}</button>` : ''}
    </div>
    <div class="pp-tabs">${tabs.map((k) => `<button data-gt="${k}" class="${k === GI.tab ? 'on' : ''}">${t('tab_' + k)}</button>`).join('')}</div>
    <div id="pp-content"></div>`;
  PP.el = el; PP.chatId = chatId;
  el.onclick = async (e) => {
    const tb = e.target.closest('[data-gt]');
    if (tb) { GI.tab = tb.dataset.gt; el.querySelectorAll('[data-gt]').forEach((x) => x.classList.toggle('on', x === tb)); return loadGroupTab(info); }
    const mem = e.target.closest('[data-member]');
    if (mem) return memberMenu(info, +mem.dataset.member, e);
    const a = e.target.closest('[data-ga]')?.dataset.ga; if (!a) return;
    if (a === 'back') closeProfilePage();
    if (a === 'msg') { closeProfilePage(); openChat(chatId); }
    if (a === 'mute') setMuted(chatId, !S.chats.get(chatId)?.muted);
    if (a === 'link') shareInvite({ ...c, invite: info.invite });
    if (a === 'photo') el.querySelector('#gi-photo').click();
    if (a === 'add') addMembersModal(chatId);
    if (a === 'leave' && confirm(t('confirm_leave'))) { await api(`/api/chats/${chatId}/leave`, { body: {} }); S.chats.delete(chatId); closeProfilePage(); if (S.current === chatId) { S.current = null; closeChat(); } renderChatList(); }
    if (a === 'delete' && confirm(t('confirm_delete_group'))) { await api(`/api/chats/${chatId}/delete`, { body: {} }); closeProfilePage(); }
    if (a === 'edit') {
      const box = el.querySelector('#gi-edit'); box.classList.toggle('hidden');
      box.innerHTML = `<input class="field" id="ge-title" value="${esc(c.title)}"><input class="field" id="ge-about" value="${esc(c.about || '')}" placeholder="${esc(t('description'))}">
        <div class="field-wrap"><span>@</span><input class="field" id="ge-user" value="${esc(c.username || '')}" placeholder="${esc(t('public_link_opt'))}" autocapitalize="off"></div>
        <p class="err" id="ge-err"></p><button class="btn-primary" id="ge-save">${t('save')}</button>`;
      box.querySelector('#ge-save').onclick = async () => {
        try { const s = await api(`/api/chats/${chatId}/edit`, { body: { title: $('#ge-title').value, about: $('#ge-about').value, username: $('#ge-user').value } }); upsertChat(s); toast(t('saved_ok')); openGroupInfo(chatId, true); renderChatList(); renderHeader(); }
        catch (er) { $('#ge-err').textContent = er.message; }
      };
    }
  };
  el.querySelector('#gi-photo').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', await compressImage(f, 1000));
    try { const s = await api(`/api/chats/${chatId}/avatar`, { body: fd }); upsertChat(s); openGroupInfo(chatId, true); renderChatList(); } catch (er) { toast(er.message); }
  };
  loadGroupTab(info);
}
function loadGroupTab(info) {
  const box = PP.el.querySelector('#pp-content');
  if (GI.tab !== 'members') { PP.tab = GI.tab; return loadProfileTab({ id: 0 }); }
  box.onclick = null;
  box.innerHTML = info.memberList.map((u) => `<div class="person" data-member="${u.id}">${avatar(u)}<div style="min-width:0;flex:1"><b>${esc(u.id === S.me.id ? t('you') : u.name)}</b><small class="${u.online ? 'on' : ''}">${esc(u.online ? t('online') : lastSeen(u))}</small></div>${u.role !== 'member' ? `<span class="role">${t('role_' + u.role)}</span>` : ''}</div>`).join('');
}
function memberMenu(info, uid, e) {
  if (uid === S.me.id) return;
  const target = info.memberList.find((u) => u.id === uid);
  const myRole = info.role;
  const el = $('#ctx');
  const canRemove = ['owner', 'admin'].includes(myRole) && target.role !== 'owner' && !(target.role === 'admin' && myRole !== 'owner');
  el.innerHTML = `<button data-a="profile">${icon('user')}${t('view_profile')}</button><button data-a="msg">${icon('chats')}${t('message')}</button>
    ${myRole === 'owner' ? `<button data-a="admin">${icon('gear')}${t(target.role === 'admin' ? 'remove_admin' : 'make_admin')}</button>` : ''}
    ${canRemove ? `<button data-a="remove" class="danger">${icon('trash')}${t('remove_member')}</button>` : ''}`;
  el.classList.remove('hidden');
  const r = { width: el.offsetWidth, height: el.offsetHeight }; // animatsiya (scale) o'lchamni buzmasligi uchun
  el.style.left = Math.max(8, Math.min(e.clientX, innerWidth - r.width - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(e.clientY, innerHeight - r.height - 8)) + 'px';
  el.onclick = async (ev) => {
    const a = ev.target.closest('[data-a]')?.dataset.a; el.classList.add('hidden');
    if (a === 'profile') openProfile(uid);
    if (a === 'msg') startChatWith(uid);
    if (a === 'admin') { await api(`/api/chats/${GI.chatId}/role`, { body: { userId: uid, admin: target.role !== 'admin' } }).catch((er) => toast(er.message)); openGroupInfo(GI.chatId, true); }
    if (a === 'remove' && confirm(t('confirm_remove'))) { await api(`/api/chats/${GI.chatId}/remove`, { body: { userId: uid } }).catch((er) => toast(er.message)); openGroupInfo(GI.chatId, true); }
  };
}
async function addMembersModal(chatId) {
  const people = await api('/api/contacts').catch(() => []);
  const sel = new Set();
  modal(`<h3>${t('add_members')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="search"><svg><use href="#i-search"/></svg><input id="am-q" placeholder="${esc(t('search_users'))}" autocapitalize="off"></div>
    <div id="am-list" class="pick-list"></div><button class="btn-primary" id="am-go">${t('add')}</button>`);
  const draw = (list) => { $('#am-list').innerHTML = list.map((u) => `<label class="person pick"><input type="checkbox" value="${u.id}" ${sel.has(u.id) ? 'checked' : ''}>${avatar(u, 'sm')}<div><b>${esc(u.contactName || u.name)}</b><small>${u.username ? '@' + esc(u.username) : ''}</small></div></label>`).join('') || `<p class="empty-note">${esc(t('no_contacts'))}</p>`; };
  draw(people);
  $('#am-list').onchange = (e) => { const v = +e.target.value; if (e.target.checked) sel.add(v); else sel.delete(v); };
  let tm; $('#am-q').oninput = (e) => { clearTimeout(tm); const q = e.target.value.trim(); tm = setTimeout(async () => draw(q ? await searchUsers(q) : people), 300); };
  $('#am-go').onclick = async () => { await api(`/api/chats/${chatId}/members`, { body: { userIds: [...sel] } }).catch((er) => toast(er.message)); closeModal(); openGroupInfo(chatId, true); };
}

/* ---------- Xabarni uzatish ---------- */
function forwardModal(ids) {
  const sel = new Set();
  const chats = [...S.chats.values()].filter((c) => c.type !== 'channel' || ['owner', 'admin'].includes(c.role)).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0));
  modal(`<h3>${t('forward_to')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="search"><svg><use href="#i-search"/></svg><input id="fw-q" placeholder="${esc(t('search'))}"></div>
    <div id="fw-list" class="pick-list"></div><button class="btn-primary" id="fw-go" disabled>${t('send')}</button>`);
  const draw = (q = '') => {
    q = q.toLowerCase();
    $('#fw-list').innerHTML = chats.filter((c) => !q || chatTitle(c).toLowerCase().includes(q)).map((c) => `<label class="person pick"><input type="checkbox" value="${c.id}" ${sel.has(c.id) ? 'checked' : ''}>${chatAvatar(c, 'sm')}<div><b>${esc(chatTitle(c))}</b></div></label>`).join('');
  };
  draw();
  $('#fw-q').oninput = (e) => draw(e.target.value);
  $('#fw-list').onchange = (e) => { const v = +e.target.value; if (e.target.checked) sel.add(v); else sel.delete(v); $('#fw-go').disabled = !sel.size; };
  $('#fw-go').onclick = () => {
    S.socket.timeout(15000).emit('message:forward', { ids, to: [...sel] }, (err, r) => { if (err || r?.error) return toast(t('not_sent')); toast(t('forwarded_ok')); });
    closeModal();
    if (sel.size === 1) { const id = [...sel][0]; if (id !== S.current) openChat(id); }
  };
}

/* ---------- Surib javob berish (mobil) ---------- */
(() => {
  let sx = 0, sy = 0, el = null, dx = 0;
  const box = $('#messages');
  box.addEventListener('touchstart', (e) => { el = e.target.closest('.msg'); if (!el) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; }, { passive: true });
  box.addEventListener('touchmove', (e) => {
    if (!el) return;
    const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
    if (Math.abs(y) > 30 && Math.abs(y) > Math.abs(x)) { el.style.transform = ''; el = null; return; }
    dx = Math.max(-80, Math.min(0, x));
    if (dx < -8) el.style.transform = `translateX(${dx}px)`;
  }, { passive: true });
  box.addEventListener('touchend', () => {
    if (!el) return;
    const m = msgOf(el); el.style.transition = 'transform .15s'; el.style.transform = '';
    const target = el; setTimeout(() => (target.style.transition = ''), 160);
    if (dx < -55 && m && !m.deleted && m.type !== 'call' && m.type !== 'service') setReply(m);
    el = null;
  }, { passive: true });
})();

/* ---------- Emoji / Stiker / GIF paneli ---------- */
const STICKERS = {
  laugh: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 😋 😛 😜 🤪 😝 🤑 🤗 🤭 😎 🤓 🥳 🤠 🤡 🥸',
  love: '🥰 😍 🤩 😘 😗 😚 ☺️ ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💕 💞 💓 💗 💖 💘 💝 💋 🌹 💐 😻 💑',
  sad: '🥲 🥺 😢 😭 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 😿 💔 😥 😓 😪',
  angry: '😤 😠 😡 🤬 👿 😈 💢 😾 🙄 😒 😑 😐 😶 😬',
  shock: '😮 😯 😲 😳 😱 😨 😰 🤯 😵 😵‍💫 🫨 🙀 🤐 🫢 🫣',
  think: '🤔 🧐 🤨 🫡 🤫 😏 😌 😴 🥱 🤤 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴',
  hands: '👋 👍 👎 👏 🙌 🙏 🤝 💪 👌 🤌 ✌️ 🤞 🤟 🤘 🤙 👊 ✊ 🫶 🫰 👀',
  party: '🎉 🎊 🎁 🎂 🥂 🍾 🎈 ✨ 🔥 💯 ⭐ 🌟 💫 ⚡ 💥 🏆 🥇 🎶 ☕ 🍕 🚀 🌈 ☀️ 🌙 💤 👻 💀 🤖 👽 💩 🐱 🐶 🦄',
};
const EMO_GROUPS = ['smileys_emotion', 'people_body', 'animals_nature', 'food_drink', 'travel_places', 'activities', 'objects', 'symbols', 'flags'];
const EMO_ICON = { recent: '🕘', smileys_emotion: '😀', people_body: '👋', animals_nature: '🐻', food_drink: '🍔', travel_places: '✈️', activities: '⚽', objects: '💡', symbols: '❤️', flags: '🏳️' };
let EMOJI = null;
const P = { open: false, tab: 'emoji' };
function recentEmoji() { try { return JSON.parse(store.get('birga_recent_emoji') || '[]'); } catch { return []; } }
function pushRecent(e) { const r = recentEmoji().filter((x) => x !== e); r.unshift(e); store.set('birga_recent_emoji', JSON.stringify(r.slice(0, 32))); }
async function openPanel(tab) {
  P.open = true; P.tab = tab || P.tab;
  $('#emoji-panel').classList.remove('hidden'); $('#btn-emoji').classList.add('on');
  $('#ep-tabs').innerHTML = ['emoji', 'stickers', ...(S.config.gifs ? ['gif'] : [])].map((k) => `<button data-ep="${k}" class="${k === P.tab ? 'on' : ''}">${t('ep_' + k)}</button>`).join('');
  if (P.tab === 'emoji') {
    if (!EMOJI) EMOJI = await fetch('/vendor/emoji.json').then((r) => r.json()).catch(() => []);
    const rec = recentEmoji();
    $('#ep-cats').innerHTML = (rec.length ? ['recent'] : []).concat(EMO_GROUPS).map((g) => `<button data-cat="${g}">${EMO_ICON[g]}</button>`).join('');
    $('#ep-cats').classList.remove('hidden'); $('#ep-search').classList.remove('hidden');
    $('#ep-search').placeholder = t('search');
    drawEmoji('');
  } else if (P.tab === 'stickers') {
    $('#ep-cats').classList.add('hidden'); $('#ep-search').classList.add('hidden');
    $('#ep-body').innerHTML = Object.entries(STICKERS).map(([k, list]) => `<div class="ep-sec">${t('st_' + k)}</div><div class="st-grid">${list.split(' ').map((e) => `<button data-st="${e}">${stickerImg(e, null, 'st-img')}</button>`).join('')}</div>`).join('');
  } else {
    $('#ep-cats').classList.add('hidden'); $('#ep-search').classList.remove('hidden'); $('#ep-search').placeholder = t('gif_search');
    drawGifs('');
  }
}
function closePanel() { P.open = false; $('#emoji-panel')?.classList.add('hidden'); $('#btn-emoji')?.classList.remove('on'); }
function drawEmoji(q) {
  q = q.trim().toLowerCase();
  const rec = recentEmoji();
  let html = '';
  if (q) {
    const found = []; (EMOJI || []).forEach((g) => g.e.forEach(([e, n]) => { if (n.includes(q)) found.push(e); }));
    html = `<div class="emo-grid">${found.slice(0, 300).map((e) => `<button data-emo="${e}">${e}</button>`).join('')}</div>`;
  } else {
    if (rec.length) html += `<div class="ep-sec" id="cat-recent">${t('ep_recent')}</div><div class="emo-grid">${rec.map((e) => `<button data-emo="${e}">${e}</button>`).join('')}</div>`;
    (EMOJI || []).forEach((g) => { html += `<div class="ep-sec" id="cat-${g.g}">${t('emo_' + g.g)}</div><div class="emo-grid">${g.e.map(([e]) => `<button data-emo="${e}">${e}</button>`).join('')}</div>`; });
  }
  $('#ep-body').innerHTML = html;
}
let gifT;
async function drawGifs(q) {
  clearTimeout(gifT);
  gifT = setTimeout(async () => {
    const list = await api('/api/gifs?q=' + encodeURIComponent(q)).catch(() => []);
    $('#ep-body').innerHTML = `<div class="gif-grid">${list.map((g) => `<button data-gif="${esc(g.mp4)}" data-w="${g.w || ''}" data-h="${g.h || ''}"><img src="${esc(g.preview)}" loading="lazy" alt=""></button>`).join('')}</div><p class="tiny muted" style="text-align:center">Powered by Tenor</p>`;
  }, 300);
}
function sendSticker(e) {
  if (!S.current) return;
  const replyTo = S.replyTo?.id; if (replyTo) $('#reply-cancel').click();
  const temp = { tempId: 't' + Date.now(), pending: true, chat_id: S.current, sender_id: S.me.id, type: 'sticker', meta: { e, cp: emojiCp(e) }, reply_to: replyTo, created_at: Date.now() };
  pushPending(temp);
  emitSend({ chatId: S.current, type: 'sticker', meta: { e, cp: emojiCp(e) }, replyTo }).then((m) => resolvePending(temp, m)).catch(() => { toast(t('not_sent')); dropPending(temp); });
}
function sendGif(url, w, h) {
  if (!S.current) return;
  const replyTo = S.replyTo?.id; if (replyTo) $('#reply-cancel').click();
  emitSend({ chatId: S.current, type: 'gif', meta: { gif: url, w, h }, replyTo }).then((m) => addMessage(m)).catch(() => toast(t('not_sent')));
  closePanel();
}
$('#btn-emoji').onclick = () => (P.open ? closePanel() : openPanel());
$('#ep-tabs').onclick = (e) => { const b = e.target.closest('[data-ep]'); if (b) openPanel(b.dataset.ep); };
$('#ep-cats').onclick = (e) => { const b = e.target.closest('[data-cat]'); if (b) $('#cat-' + b.dataset.cat)?.scrollIntoView({ block: 'start' }); };
$('#ep-search').oninput = (e) => (P.tab === 'gif' ? drawGifs(e.target.value) : drawEmoji(e.target.value));
$('#ep-body').onclick = (e) => {
  const em = e.target.closest('[data-emo]');
  if (em) {
    const v = em.dataset.emo; pushRecent(v);
    const st = textEl.selectionStart ?? textEl.value.length, en = textEl.selectionEnd ?? st;
    textEl.value = textEl.value.slice(0, st) + v + textEl.value.slice(en);
    textEl.dispatchEvent(new Event('input'));
    if (!isTouch()) { textEl.focus(); textEl.selectionStart = textEl.selectionEnd = st + v.length; }
    return;
  }
  const s = e.target.closest('[data-st]'); if (s) { sendSticker(s.dataset.st); closePanel(); return; }
  const g = e.target.closest('[data-gif]'); if (g) sendGif(g.dataset.gif, +g.dataset.w, +g.dataset.h);
};
textEl.addEventListener('focus', () => { if (isTouch()) closePanel(); });

/* ---------- Telefon kontaktlaridan Birga'dagilarni topish ---------- */
const canPickContacts = 'contacts' in navigator && 'ContactsManager' in window;
$('#btn-sync').classList.toggle('hidden', !canPickContacts);
$('#btn-sync').onclick = async () => {
  try {
    const list = await navigator.contacts.select(['name', 'tel'], { multiple: true });
    if (!list.length) return;
    const r = await api('/api/contacts/match', { body: { contacts: list.map((c) => ({ name: (c.name || [])[0] || '', tel: c.tel || [] })) } });
    toast(t('contacts_found', { n: r.found.length, m: r.checked }), 4000);
    loadContacts();
  } catch (e) { if (e.name !== 'AbortError' && e.name !== 'InvalidStateError') toast(e.message || t('err')); }
};

/* ---------- Profilga email bog'lash ---------- */
function bindEmailModal(prompted) {
  let email = '';
  modal(`<h3>${t('email_bind_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <p class="muted">${esc(t(prompted ? 'email_bind_why' : 'email_bind_hint'))}</p>
    <div id="eb-1"><input class="field" id="eb-mail" type="email" inputmode="email" autocapitalize="off" placeholder="you@gmail.com" value="${esc(S.me.email || '')}">
      <p class="err" id="eb-err"></p><button class="btn-primary" id="eb-send">${t('get_code')}</button></div>
    <div id="eb-2" class="hidden"><input class="field" id="eb-code" inputmode="numeric" maxlength="5" placeholder="12345" autocomplete="one-time-code">
      <div id="eb-dev" class="dev-code hidden"></div><p class="err" id="eb-err2"></p><button class="btn-primary" id="eb-ok">${t('confirm')}</button></div>`);
  $('#eb-send').onclick = async () => {
    email = fixEmail($('#eb-mail').value); $('#eb-err').textContent = '';
    if (!EMAIL_OK.test(email)) { $('#eb-err').textContent = t('enter_email'); return; }
    try {
      const r = await api('/api/me/email/send', { body: { email } });
      $('#eb-1').classList.add('hidden'); $('#eb-2').classList.remove('hidden'); $('#eb-code').focus();
      if (r.devCode) { $('#eb-dev').innerHTML = `${esc(t('dev_code_email'))} <b>${r.devCode}</b>`; $('#eb-dev').classList.remove('hidden'); }
    } catch (e) { $('#eb-err').textContent = e.message; }
  };
  $('#eb-ok').onclick = async () => {
    try { S.me = { ...S.me, ...(await api('/api/me/email/verify', { body: { email, code: $('#eb-code').value.trim() } })) }; store.set('birga_email', email); closeModal(); toast(t('saved_ok')); if (TAB === 'settings') renderSettings(); }
    catch (e) { $('#eb-err2').textContent = e.message; }
  };
}

/* ---------- Ovoz yozishda jonli to'lqin ---------- */
setInterval(() => {
  if (!Rec.active || Rec.kind !== 'voice') return;
  const lv = Rec.levels.slice(-28); const box = $('#rec-wave'); if (!box) return;
  const mx = Math.max(0.02, ...lv);
  box.innerHTML = lv.map((v) => `<i style="height:${Math.max(10, Math.min(100, (v / mx) * 100))}%"></i>`).join('');
}, 120);



/* ======================= MEDIA QURILMADA SAQLANADI ======================= */
// Har bir rasm, video, ovozli xabar va fayl qurilmaga (ilova xotirasiga) yuklab olinadi va o'sha yerdan ochiladi.
// Hamma qabul qiluvchi yuklab olgach server faylni o'chiradi — server to'lmaydi, trafik kamayadi.
// Kompyuterda (Chrome/Edge) xohlasa tanlangan papkaga avtomatik ham yoziladi: Birga/Rasmlar, Videolar, ...
const MEDIA_CACHE = 'birga-media';
const MEDIA_TYPES = ['image', 'video', 'voice', 'round', 'file'];
const FOLDERS = { image: 'Rasmlar', video: 'Videolar', voice: 'Ovozli xabarlar', round: 'Video xabarlar', file: 'Fayllar' };
const Media = {
  keys: new Set(), queue: [], busy: 0, acks: new Set(), ackT: null, dir: null, dirOk: false, ready: null,
  abs: (u) => (u ? new URL(u, location.href).href : ''),
  has(m) { return [m.file, m.meta?.alt].some((u) => u && this.keys.has(this.abs(u))); },
  auto() { return store.get('birga_autodl') !== '0'; },
  init() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      if (!('caches' in window)) return;
      try { const c = await caches.open(MEDIA_CACHE); (await c.keys()).forEach((r) => this.keys.add(r.url)); } catch {}
      this.dir = await idb('get', 'dir').catch(() => null);
      if (this.dir) this.dirOk = (await this.dir.queryPermission?.({ mode: 'readwrite' }).catch(() => 'denied')) === 'granted';
    })();
    return this.ready;
  },
  async put(url, blob) {
    try { const c = await caches.open(MEDIA_CACHE); await c.put(this.abs(url), new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Content-Length': String(blob.size) } })); this.keys.add(this.abs(url)); return true; }
    catch { return false; }
  },
  async get(m) {
    if (!('caches' in window)) return null;
    const c = await caches.open(MEDIA_CACHE);
    for (const u of [m.file, m.meta?.alt]) { if (!u) continue; const r = await c.match(this.abs(u)); if (r) return r.blob(); }
    return null;
  },
  putLocal(blob, url, alt, type) {
    if (!url) return;
    this.put(url, blob); if (alt) this.put(alt, blob);
    this.exportFile({ type, file: url, created_at: Date.now(), id: 'my' + Date.now(), meta: {} }, blob);
  },
  track(list) {
    for (const m of list || []) {
      if (!m?.id || !m.file || m.deleted || !MEDIA_TYPES.includes(m.type) || m.sender_id === S.me?.id) continue;
      if (this.has(m)) { this.ack(m.id); continue; }
      if (m.gone || !this.auto() || this.queue.some((x) => x.id === m.id)) continue;
      this.queue.push(m);
    }
    this.pump();
  },
  async pump() {
    while (this.busy < 2 && this.queue.length) {
      const m = this.queue.shift(); this.busy++;
      this.fetchOne(m).finally(() => { this.busy--; this.pump(); });
    }
  },
  async fetchOne(m) {
    const url = mediaSrc(m);
    try {
      const r = await fetch(this.abs(url), { mode: 'cors', credentials: 'omit' });
      if (!r.ok) return;
      const blob = await r.blob();
      if (await this.put(url, blob)) { this.ack(m.id); this.exportFile(m, blob); }
    } catch {}
  },
  ack(id) {
    this.acks.add(id); clearTimeout(this.ackT);
    this.ackT = setTimeout(() => { const ids = [...this.acks]; this.acks.clear(); if (ids.length) api('/api/media/ack', { body: { ids } }).catch(() => ids.forEach((i) => this.acks.add(i))); }, 1500);
  },
  async syncPending() { try { this.track(await api('/api/media/pending')); } catch {} },
  // ---- papkaga saqlash (kompyuterda Chrome/Edge) ----
  canFolder: () => 'showDirectoryPicker' in window && !isTouch(),
  async pickFolder() {
    try {
      const root = await window.showDirectoryPicker({ id: 'birga', mode: 'readwrite', startIn: 'documents' });
      this.dir = await root.getDirectoryHandle('Birga', { create: true });
      for (const f of Object.values(FOLDERS)) await this.dir.getDirectoryHandle(f, { create: true });
      await idb('set', 'dir', this.dir); this.dirOk = true;
      toast(t('folder_ready'), 3500);
      const c = await caches.open(MEDIA_CACHE); let n = 0; // mavjud fayllarni ham yozib chiqamiz
      for (const list of S.msgs.values()) for (const m of list) { if (!m.file || !MEDIA_TYPES.includes(m.type)) continue; const b = await this.get(m); if (b) { await this.exportFile(m, b); n++; } }
      if (n) toast(t('folder_copied', { n }));
    } catch (e) { if (e.name !== 'AbortError') toast(e.message); }
    renderSettings();
  },
  async resumeFolder() { if (!this.dir) return; this.dirOk = (await this.dir.requestPermission({ mode: 'readwrite' }).catch(() => 'denied')) === 'granted'; renderSettings(); },
  async exportFile(m, blob) {
    if (!this.dir || !this.dirOk) return;
    try {
      const sub = await this.dir.getDirectoryHandle(FOLDERS[m.type] || 'Fayllar', { create: true });
      const ext = (m.meta?.name || '').match(/\.[\w]{1,6}$/)?.[0] || '.' + ((blob.type.split('/')[1] || 'bin').split(';')[0].replace('mpeg', 'mp3').replace('quicktime', 'mov'));
      const d = new Date(m.created_at || Date.now()), pad = (x) => String(x).padStart(2, '0');
      const name = (m.type === 'file' && m.meta?.name ? m.meta.name.replace(/[\\/:*?"<>|]/g, '_') : `Birga_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}_${m.id}${ext}`);
      const fh = await sub.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(blob); await w.close();
    } catch (e) { if (e.name === 'NotAllowedError') this.dirOk = false; }
  },
  async saveAs(m) {
    const blob = (await this.get(m)) || (m.gone ? null : await fetch(this.abs(mediaSrc(m))).then((r) => (r.ok ? r.blob() : null)).catch(() => null));
    if (!blob) return toast(t('media_gone'));
    const name = m.meta?.name || `Birga_${m.id}.${(blob.type.split('/')[1] || 'bin').split(';')[0]}`;
    const file = new File([blob], name, { type: blob.type });
    // telefonda: "Ulashish" oynasi orqali galereyaga / Fayllarga saqlash
    if (isTouch() && navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  async usage() {
    let size = 0, n = 0;
    try { const c = await caches.open(MEDIA_CACHE); for (const r of await c.keys()) { const res = await c.match(r); size += Number(res.headers.get('Content-Length')) || 0; n++; } } catch {}
    return { size, n };
  },
  async clear() { await caches.delete(MEDIA_CACHE).catch(() => {}); this.keys.clear(); if (S.current) renderMessages(); },
};
// Service worker boshqarmagan holatda ham: server o'chirgan fayl qurilmadan ochiladi
document.addEventListener('error', async (e) => {
  const el = e.target; if (!['IMG', 'VIDEO', 'AUDIO'].includes(el?.tagName) || !el.src || el.src.startsWith('blob:') || el.dataset.fb) return;
  el.dataset.fb = '1';
  try { const r = await (await caches.open(MEDIA_CACHE)).match(el.src.split('#')[0].split('?')[0]); if (r) el.src = URL.createObjectURL(await r.blob()); } catch {}
}, true);
// IndexedDB (papka ruxsatini saqlash uchun)
function idb(op, key, val) {
  return new Promise((res, rej) => {
    const o = indexedDB.open('birga', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('kv');
    o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('kv', op === 'get' ? 'readonly' : 'readwrite'); const st = tx.objectStore('kv'); const r = op === 'get' ? st.get(key) : op === 'del' ? st.delete(key) : st.put(val, key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); };
  });
}
// Sozlamalar: "Xotira va media"
async function storageModal() {
  const u = await Media.usage();
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  modal(`<h3>${t('storage_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3>
    <div class="stor-big"><b>${fmtSize(u.size || 0)}</b><small>${t('storage_files', { n: u.n })}${est?.quota ? ' · ' + t('storage_free', { s: fmtSize(Math.max(0, est.quota - est.usage)) }) : ''}</small></div>
    <p class="muted small">${esc(t('storage_explain'))}</p>
    <label class="toggle-row"><span>${t('auto_download')}<small>${t('auto_download_hint')}</small></span><input type="checkbox" id="st-auto" ${Media.auto() ? 'checked' : ''}></label>
    ${Media.canFolder() ? `<div class="sub">${t('folder_title')}</div><p class="muted small">${esc(t('folder_hint'))}</p>
      ${Media.dir ? `<div class="folder-row">${icon('file')}<b>${esc(Media.dir.name)}</b><span class="${Media.dirOk ? 'on' : ''}">${t(Media.dirOk ? 'state_on' : 'folder_paused')}</span></div>` : ''}
      <button class="btn-ghost" id="st-folder">${t(Media.dir ? (Media.dirOk ? 'folder_change' : 'folder_resume') : 'folder_pick')}</button>`
      : `<p class="muted small">${esc(t('phone_save_hint'))}</p>`}
    ${persisted ? '' : `<p class="tiny muted">${esc(t('storage_not_persist'))}</p>`}
    <button class="row-btn danger" id="st-clear" style="margin-top:12px">${icon('trash')}${t('storage_clear')}</button>`);
  $('#st-auto').onchange = (e) => { store.set('birga_autodl', e.target.checked ? '1' : '0'); if (e.target.checked) Media.syncPending(); };
  $('#st-folder')?.addEventListener('click', () => { closeModal(); (Media.dir && !Media.dirOk) ? Media.resumeFolder() : Media.pickFolder(); });
  $('#st-clear').onclick = async () => { if (!confirm(t('storage_clear_confirm'))) return; await Media.clear(); closeModal(); toast(t('done')); };
}

boot();
