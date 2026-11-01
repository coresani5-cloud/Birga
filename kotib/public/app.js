// Kotib — biznes egasi paneli
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, st = '') => `<svg class="i"${st ? ` style="${st}"` : ''}><use href="#i-${n}"/></svg>`;
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const B_STATUS = { confirmed: ['Tasdiqlangan', ''], done: ['Bajarildi', 'ok'], noshow: ['Kelmadi', 'warn'], cancelled: ['Bekor', 'bad'] };
const O_STATUS = { new: ['Yangi', 'warn'], confirmed: ['Tasdiqlangan', ''], delivered: ['Yetkazildi', 'ok'], cancelled: ['Bekor', 'bad'] };
const SRC = { call: "📞 Qo'ng'iroq", sms: '✉️ SMS', whatsapp: '🟢 WhatsApp', web: '🌐 Sayt', test: '🤖 Sinov', manual: '✍️ Qo‘lda' };
const T_TYPE = { missed: ['Javobsiz qo‘ng‘iroq', 'bad'], handoff: ['Inson bilan gaplashmoqchi', 'warn'], callback: ['Qayta bog‘lanish', ''] };

let token = localStorage.getItem('kotib_token') || '';
let settings = null, month = null, today = '', selDay = '', view = 'home';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove('show'), 2800);
}
async function api(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) }, body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.startsWith('/api/auth')) { logout(); throw new Error(j.error || 'Kirish kerak'); }
  if (!r.ok) throw new Error(j.error || 'Xato: ' + r.status);
  return j;
}
const humanDate = (d) => { const [y, m, dd] = d.split('-').map(Number); return `${dd}-${MONTHS[m - 1].toLowerCase()}, ${WD[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()].toLowerCase()}`; };
const shortDate = (d) => { const [, m, dd] = d.split('-').map(Number); return `${dd} ${MONTHS[m - 1].slice(0, 3).toLowerCase()}`; };
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ');
const timeAgo = (t) => { const s = (Date.now() - t) / 1000; if (s < 60) return 'hozir'; if (s < 3600) return Math.floor(s / 60) + ' daq. oldin'; if (s < 86400) return Math.floor(s / 3600) + ' soat oldin'; if (s < 172800) return 'kecha'; return new Date(t).toLocaleDateString('ru-RU'); };
const clock = (t) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const avatarCls = (s) => 'c' + ([...String(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 5);
const avatar = (name, seed, sm) => `<div class="avatar ${avatarCls(seed || name)}${sm ? ' sm' : ''}">${esc(initials(name))}</div>`;
const tag = ([t, c]) => `<span class="tag ${c}">${t}</span>`;
const callBtn = (p) => p ? `<a class="call-btn" href="tel:${esc(p)}" onclick="event.stopPropagation()">${icon('phone')}</a>` : '';
$$('dialog [data-close]').forEach((b) => b.onclick = () => b.closest('dialog').close());

// ---------- Kirish ----------
async function boot() {
  if (token) { try { await start(); return; } catch { /* token eskirgan */ } }
  const { setup } = await fetch('/api/auth/status').then((r) => r.json());
  $('#login').classList.remove('hidden');
  if (setup) {
    $('#login-hint').innerHTML = "Xush kelibsiz! Biznes nomini kiriting<br>va panel uchun parol o'ylab toping.";
    $('#login-name').classList.remove('hidden');
    $('#login-pass').autocomplete = 'new-password';
    $('#login-btn').textContent = 'Boshlash';
  }
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    $('#login-err').textContent = '';
    try {
      const j = await api(setup ? '/api/auth/setup' : '/api/auth/login', { method: 'POST', body: { password: $('#login-pass').value, name: $('#login-name').value } });
      token = j.token; localStorage.setItem('kotib_token', token);
      $('#login').classList.add('hidden');
      await start();
    } catch (err) { $('#login-err').textContent = err.message; }
  };
}
function logout() { token = ''; localStorage.removeItem('kotib_token'); location.reload(); }

async function start() {
  settings = await api('/api/settings');
  $('#app').classList.remove('hidden');
  $('#biz-name').textContent = settings.business.name;
  $('#top-sub').textContent = settings.ai ? 'AI kotib 24/7 faol' : 'Kotib faol (oddiy rejim)';
  const m = await api('/api/month'); today = m.today; selDay = today;
  loadHome(); loadTaskBadge(); live();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ---------- Jonli yangilanish ----------
let es = null;
function live() {
  if (es) es.close();
  es = new EventSource('/api/events?token=' + encodeURIComponent(token));
  es.onopen = () => $('#live').classList.add('on');
  es.onerror = () => $('#live').classList.remove('on');
  const fresh = (x) => x && !x.deleted && x.source && x.source !== 'manual' && Date.now() - x.createdAt < 10000;
  es.addEventListener('booking', (e) => { const b = JSON.parse(e.data); if (fresh(b)) notify('Yangi uchrashuv', `${b.customer.name} — ${humanDate(b.date)}, ${b.start}`); refresh(); });
  es.addEventListener('order', (e) => { const o = JSON.parse(e.data); if (fresh(o)) notify('Yangi zakaz', `${o.customer.name} — ${money(o.total)} so‘m`); refresh(); });
  es.addEventListener('task', (e) => { const t = JSON.parse(e.data); if (!t.done && Date.now() - t.createdAt < 10000) notify(T_TYPE[t.type]?.[0] || 'Vazifa', `${t.name || t.phone || ''} ${t.reason}`); loadTaskBadge(); refresh(); });
  es.addEventListener('conversation', () => { if (view === 'customers') loadCustomers(); });
}
function notify(title, body) {
  toast(`${title}: ${body}`);
  if (window.Notification?.permission === 'granted' && document.hidden) new Notification(title, { body, icon: '/icon-192.png' });
}
let refreshTm;
function refresh() {
  clearTimeout(refreshTm);
  refreshTm = setTimeout(() => {
    if (view === 'home') loadHome();
    if (view === 'calendar') { loadMonth(); selectDay(selDay); }
    if (view === 'orders') loadOrders();
    if (view === 'tasks') loadTasks();
  }, 250);
}

// ---------- Bo'limlar ----------
function go(v) {
  view = v;
  $$('.tabs button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  $$('.view').forEach((el) => el.classList.toggle('hidden', el.id !== 'v-' + v));
  ({ home: loadHome, calendar: () => { loadMonth(); selectDay(selDay); }, orders: () => { renderOrderSeg(); loadOrders(); }, customers: loadCustomers, tasks: loadTasks, settings: fillSettings, test: () => { if (!$('#t-chat').children.length) testHello(); } })[v]?.();
  if (window.Notification?.permission === 'default') Notification.requestPermission().catch(() => {});
  window.scrollTo(0, 0);
}
$$('.tabs button').forEach((b) => b.onclick = () => go(b.dataset.v));
$$('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
$('#go-test').onclick = () => go('test');
$('#go-tasks').onclick = () => go('tasks');
$('#h-test').onclick = () => go('test');
$('#h-new').onclick = () => openBooking(null, today);

// ---------- Bosh sahifa ----------
let period = 'day', metric = 'calls', seriesCache = null;
$$('#h-period button').forEach((b) => b.onclick = () => { period = b.dataset.p; $$('#h-period button').forEach((x) => x.classList.toggle('on', x === b)); loadHome(); });
$$('#h-metric button').forEach((b) => b.onclick = () => { metric = b.dataset.m; $$('#h-metric button').forEach((x) => x.classList.toggle('on', x === b)); drawChart(); });

function ring(el, frac, color, ico) {
  const r = 21, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac || 0));
  el.innerHTML = `<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="3.5"/><circle cx="25" cy="25" r="${r}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${c * f} ${c}" style="filter:drop-shadow(0 0 4px ${color})"/></svg><div class="ico" style="color:${color}">${ico}</div>`;
}
async function loadHome() {
  const from = period === 'day' ? today : addDays(today, period === 'week' ? -6 : -29);
  const [r, ser, bk, tasks] = await Promise.all([api(`/api/report?from=${from}&to=${today}`), api('/api/series?days=30'), api(`/api/bookings?from=${today}&to=${today}`), api('/api/tasks')]);
  seriesCache = ser;
  $('#h-label').textContent = { day: 'Bugungi savdo', week: 'Haftalik savdo', month: 'Oylik savdo' }[period];
  $('#h-sales').innerHTML = `${money(r.sales)} <small>so‘m</small>`;
  const contacts = r.calls + r.chats, deals = r.orders + r.bookings;
  $('#h-calls').textContent = contacts;
  $('#h-orders').textContent = deals;
  ring($('#r-calls'), contacts ? r.calls / contacts : 0, '#34e0a1', icon('phone', 'width:16px;height:16px'));
  ring($('#r-orders'), contacts ? deals / contacts : deals ? 1 : 0, '#ff4d8d', icon('up', 'width:16px;height:16px'));
  $('#h-cust').textContent = r.customers; $('#h-new-c').textContent = r.newCustomers; $('#h-missed').textContent = r.missed;
  drawChart();
  const list = bk.filter((b) => b.status !== 'cancelled');
  $('#h-today').innerHTML = list.length ? list.slice(0, 6).map((b) => bookingRow(b)).join('') : '<div class="empty">Bugun uchrashuv yo‘q</div>';
  bindBookingRows($('#h-today'), list);
  const open = tasks.filter((t) => !t.done);
  $('#h-tasks').innerHTML = open.length ? open.slice(0, 4).map(taskRow).join('') : '<div class="empty">Hammasi joyida — qayta bog‘lanish kerak bo‘lgan mijoz yo‘q ✨</div>';
  bindTaskRows($('#h-tasks'), open);
}
function drawChart() {
  const ser = seriesCache; if (!ser) return;
  const days = period === 'month' ? 30 : period === 'week' ? 7 : 14;
  const data = ser.slice(-days), vals = data.map((d) => d[metric] || 0);
  const W = 320, H = 150, P = 10, max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [P + (i * (W - 2 * P)) / Math.max(1, vals.length - 1), H - P - (v / max) * (H - 2 * P - 14)]);
  // Silliq egri chiziq
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  const grid = [0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="rgba(255,255,255,.05)"/>`).join('');
  const last = pts[pts.length - 1];
  $('#h-chart').innerHTML = `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563ff" stop-opacity=".45"/><stop offset="1" stop-color="#2563ff" stop-opacity="0"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${grid}<path d="${d} L${last[0]},${H} L${pts[0][0]},${H} Z" fill="url(#cg)"/>
    <path d="${d}" fill="none" stroke="#3b82ff" stroke-width="2.2" filter="url(#glow)" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="#fff" stroke="#3b82ff" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  const total = vals.reduce((a, b) => a + b, 0);
  const lbl = { calls: "qo'ng'iroq", orders: 'zakaz', bookings: 'uchrashuv', sales: 'so‘m' }[metric];
  $('#h-tip').innerHTML = `Oxirgi ${days} kun: <b>${metric === 'sales' ? money(total) : total}</b> ${lbl}`;
  const ticks = [0, Math.floor(data.length / 2), data.length - 1];
  $('#h-axis').innerHTML = ticks.map((i) => `<span>${shortDate(data[i].date)}</span>`).join('');
}
$('#h-send').onclick = async () => { try { await api('/api/report/send', { method: 'POST' }); toast('Hisobot Telegramga yuborildi ✅'); } catch (e) { toast(e.message); } };

// ---------- Kalendar ----------
async function loadMonth() {
  const j = await api('/api/month' + (month ? '?ym=' + month : ''));
  month = j.ym; today = j.today;
  const [y, m] = month.split('-').map(Number);
  $('#m-title').textContent = `${MONTHS[m - 1]} ${y}`;
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  $('#m-grid').innerHTML = '<span></span>'.repeat(first) + Object.entries(j.days).map(([d, v]) => {
    const cls = [!v.open ? 'off' : v.free > 0 ? 'free' : 'full', d === today && 'today', d === selDay && 'sel', d < today && 'past'].filter(Boolean).join(' ');
    return `<button class="cell ${cls}" data-d="${d}"><b>${Number(d.slice(8))}</b>${v.count ? `<em>${v.count}</em>` : ''}</button>`;
  }).join('');
  $$('#m-grid .cell').forEach((c) => c.onclick = () => selectDay(c.dataset.d));
}
const shiftMonth = (n) => { const [y, m] = month.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); month = d.toISOString().slice(0, 7); loadMonth(); };
$('#m-prev').onclick = () => shiftMonth(-1);
$('#m-next').onclick = () => shiftMonth(1);

async function selectDay(d) {
  selDay = d;
  $$('.cell').forEach((c) => c.classList.toggle('sel', c.dataset.d === d));
  const [free, list] = await Promise.all([api('/api/free?date=' + d), api(`/api/bookings?from=${d}&to=${d}`)]);
  $('#d-title').textContent = humanDate(d) + (d === today ? ' · bugun' : '');
  $('#d-free').textContent = !free.open ? 'Dam olish kuni' : free.ranges.length ? "Bo'sh: " + free.ranges.map((r) => r.join('–')).join(', ') : "Bo'sh vaqt yo'q";
  const closed = settings.closedDays.includes(d);
  $('#d-toggle').textContent = closed ? 'Kunni ochish' : 'Kunni yopish';
  $('#d-toggle').classList.toggle('hidden', d < today || (!free.open && !closed));
  $('#d-list').innerHTML = list.length ? list.map((b) => bookingRow(b)).join('') : '<div class="empty">Bu kunga uchrashuv yo‘q</div>';
  bindBookingRows($('#d-list'), list);
}
$('#d-toggle').onclick = async () => {
  const set = new Set(settings.closedDays);
  set.has(selDay) ? set.delete(selDay) : set.add(selDay);
  await api('/api/settings', { method: 'PUT', body: { closedDays: [...set] } });
  settings.closedDays = [...set];
  toast(set.has(selDay) ? 'Kun yopildi — kotib bu kunga yozmaydi' : 'Kun ochildi');
  loadMonth(); selectDay(selDay);
};
$('#d-add').onclick = () => openBooking(null, selDay);
$('#d-add-top').onclick = () => openBooking(null, selDay);

function bookingRow(b, withDate) {
  return `<div class="row st-${b.status}" data-id="${b.id}">
    <div class="time">${b.start}<small>${b.end}</small></div>
    <div class="info">
      <b>${esc(b.customer.name)}</b> <span class="muted small">· ${esc(b.serviceName)}</span>
      <div class="muted small">${withDate ? esc(humanDate(b.date)) + ' · ' : ''}${esc(b.customer.phone || '')} ${SRC[b.source] ? '· ' + SRC[b.source] : ''} ${b.status !== 'confirmed' ? tag(B_STATUS[b.status]) : ''}</div>
      ${b.notes ? `<div class="small note">${esc(b.notes)}</div>` : ''}
    </div>
    ${callBtn(b.customer.phone)}
  </div>`;
}
const bindBookingRows = (el, list) => $$('.row', el).forEach((r) => r.onclick = () => openBooking(list.find((b) => b.id === r.dataset.id)));

// ---------- Uchrashuv oynasi ----------
let editing = null;
function openBooking(b, date) {
  editing = b;
  $('#bk-title').textContent = b ? 'Uchrashuv' : 'Yangi uchrashuv';
  $('#bk-svc').innerHTML = settings.services.map((s) => `<option value="${s.id}">${esc(s.name)} · ${s.duration} daq.</option>`).join('');
  $('#bk-svc').value = b?.serviceId || settings.services[0]?.id || '';
  $('#bk-date').value = b?.date || date || today;
  $('#bk-time').value = b?.start || '';
  $('#bk-name').value = b?.customer.name || '';
  $('#bk-phone').value = b?.customer.phone || '';
  $('#bk-notes').value = b?.notes || '';
  $('#bk-force').checked = false;
  $('#bk-err').textContent = '';
  $('#bk-del').classList.toggle('hidden', !b);
  $('#bk-status').classList.toggle('hidden', !b);
  $$('#bk-status button').forEach((x) => x.classList.toggle('on', !!b && x.dataset.s === b.status));
  loadStarts();
  $('#bk').showModal();
}
async function loadStarts() {
  const d = $('#bk-date').value; if (!d) return;
  try {
    const j = await api(`/api/free?date=${d}&service=${$('#bk-svc').value}`);
    $('#bk-starts').innerHTML = !j.open ? '<span class="muted small">Dam olish kuni</span>' : j.starts.length ? j.starts.map((t) => `<button type="button" class="chip${t === $('#bk-time').value ? ' on' : ''}">${t}</button>`).join('') : '<span class="muted small">Bo\'sh vaqt yo\'q</span>';
    $$('#bk-starts .chip').forEach((c) => c.onclick = () => { $('#bk-time').value = c.textContent; $$('#bk-starts .chip').forEach((x) => x.classList.toggle('on', x === c)); });
  } catch { /* */ }
}
$('#bk-date').onchange = loadStarts;
$('#bk-svc').onchange = loadStarts;
$$('#bk-status button').forEach((x) => x.onclick = async () => {
  try { await api('/api/bookings/' + editing.id, { method: 'PATCH', body: { status: x.dataset.s } }); $('#bk').close(); toast('Holat o‘zgardi'); refresh(); } catch (e) { $('#bk-err').textContent = e.message; }
});
$('#bk-del').onclick = async () => {
  if (!confirm("Uchrashuvni butunlay o'chirasizmi?")) return;
  await api('/api/bookings/' + editing.id, { method: 'DELETE' }); $('#bk').close(); toast("O'chirildi"); refresh();
};
$('#bk-form').onsubmit = async (e) => {
  e.preventDefault();
  const body = { serviceId: $('#bk-svc').value, date: $('#bk-date').value, start: $('#bk-time').value, name: $('#bk-name').value, phone: $('#bk-phone').value, notes: $('#bk-notes').value, force: $('#bk-force').checked };
  try {
    if (editing) {
      const ch = { name: body.name, phone: body.phone, notes: body.notes, force: body.force };
      if (body.date !== editing.date || body.start !== editing.start || body.serviceId !== editing.serviceId) Object.assign(ch, { date: body.date, start: body.start, serviceId: body.serviceId });
      await api('/api/bookings/' + editing.id, { method: 'PATCH', body: ch });
    } else await api('/api/bookings', { method: 'POST', body });
    $('#bk').close(); toast('Saqlandi'); refresh();
  } catch (err) { $('#bk-err').textContent = err.message + (/band|tashqarida|dam olish/.test(err.message) ? ' — majburan yozish uchun belgini qo‘ying' : ''); }
};

// ---------- Buyurtmalar (uchrashuvlar va zakazlar) ----------
let oKind = 'bookings', oFilter = 'upcoming';
const O_FILTERS = { bookings: [['upcoming', 'Kelgusi'], ['today', 'Bugun'], ['past', "O'tgan"], ['cancelled', 'Bekor']], orders: [['active', 'Faol'], ['delivered', 'Yetkazilgan'], ['cancelled', 'Bekor'], ['all', 'Hammasi']] };
function renderOrderSeg() {
  $('#o-seg').innerHTML = O_FILTERS[oKind].map(([k, t]) => `<button data-f="${k}" class="${k === oFilter ? 'on' : ''}">${t}</button>`).join('');
  $$('#o-seg button').forEach((b) => b.onclick = () => { oFilter = b.dataset.f; renderOrderSeg(); loadOrders(); });
}
$$('#o-kind button').forEach((b) => b.onclick = () => { oKind = b.dataset.k; oFilter = O_FILTERS[oKind][0][0]; $$('#o-kind button').forEach((x) => x.classList.toggle('on', x === b)); renderOrderSeg(); loadOrders(); });
let qTm; $('#o-q').oninput = () => { clearTimeout(qTm); qTm = setTimeout(loadOrders, 250); };
async function loadOrders() {
  const q = encodeURIComponent($('#o-q').value.trim());
  if (oKind === 'orders') {
    const st = { active: 'new,confirmed', delivered: 'delivered', cancelled: 'cancelled', all: '' }[oFilter];
    const list = await api(`/api/orders?q=${q}${st ? '&status=' + st : ''}`);
    $('#o-list').innerHTML = list.length ? list.map(orderRow).join('') : '<div class="empty">Zakazlar yo‘q</div>';
    $$('#o-list .row').forEach((r) => r.onclick = () => openOrder(list.find((o) => o.id === r.dataset.id)));
    return;
  }
  const range = { upcoming: [today, '9999'], today: [today, today], past: [addDays(today, -365), addDays(today, -1)], cancelled: ['0000', '9999'] }[oFilter];
  let list = await api(`/api/bookings?from=${range[0]}&to=${range[1]}&q=${q}`);
  list = oFilter === 'cancelled' ? list.filter((b) => b.status === 'cancelled') : list.filter((b) => b.status !== 'cancelled');
  if (oFilter === 'past') list.reverse();
  let last = '';
  $('#o-list').innerHTML = list.length ? list.map((b) => { const h = b.date !== last ? `<div class="group">${humanDate(b.date)}</div>` : ''; last = b.date; return h + bookingRow(b); }).join('') : '<div class="empty">Uchrashuvlar yo‘q</div>';
  bindBookingRows($('#o-list'), list);
}
function orderRow(o) {
  return `<div class="row st-${o.status}" data-id="${o.id}">
    ${avatar(o.customer.name, o.customer.phone)}
    <div class="info"><b>${esc(o.customer.name)}</b> ${tag(O_STATUS[o.status])}
      <div class="muted small ellipsis">${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(', ')}</div>
      <div class="muted small">${timeAgo(o.createdAt)} · ${SRC[o.source] || ''}</div></div>
    <div class="right">${money(o.total)}<small>so‘m</small></div>
  </div>`;
}
let curOrder = null;
function openOrder(o) {
  curOrder = o;
  $('#od-title').textContent = 'Zakaz · ' + new Date(o.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  $('#od-body').innerHTML = `<div class="cu-head">${avatar(o.customer.name, o.customer.phone)}<div class="grow"><b>${esc(o.customer.name)}</b><div class="muted small">${esc(o.customer.phone)} · ${SRC[o.source] || ''}</div></div>${callBtn(o.customer.phone)}</div>
    <div class="list">${o.items.map((i) => `<div class="row" style="cursor:default"><div class="info">${esc(i.name)}<div class="muted small">${money(i.price)} × ${i.qty} ${esc(i.unit)}</div></div><div class="right">${money(i.price * i.qty)}</div></div>`).join('')}
    <div class="row" style="cursor:default"><div class="info"><b>Jami</b></div><div class="right" style="font-size:18px">${money(o.total)} so‘m</div></div></div>
    ${o.address ? `<p class="small">📍 ${esc(o.address)}</p>` : ''}${o.notes ? `<p class="small">📝 ${esc(o.notes)}</p>` : ''}`;
  $$('#od-status button').forEach((x) => x.classList.toggle('on', x.dataset.s === o.status));
  $('#od').showModal();
}
$$('#od-status button').forEach((x) => x.onclick = async () => {
  try { await api('/api/orders/' + curOrder.id, { method: 'PATCH', body: { status: x.dataset.s } }); $('#od').close(); toast('Holat o‘zgardi'); loadOrders(); } catch (e) { toast(e.message); }
});

// ---------- Mijozlar va qo'ng'iroqlar tarixi ----------
let cKind = 'customers';
$$('#c-kind button').forEach((b) => b.onclick = () => { cKind = b.dataset.k; $$('#c-kind button').forEach((x) => x.classList.toggle('on', x === b)); loadCustomers(); });
let cTm; $('#c-q').oninput = () => { clearTimeout(cTm); cTm = setTimeout(loadCustomers, 250); };
async function loadCustomers() {
  const q = $('#c-q').value.trim().toLowerCase();
  if (cKind === 'calls') {
    let list = await api('/api/conversations');
    if (q) list = list.filter((c) => ((c.customer?.name || '') + ' ' + c.from + ' ' + c.last).toLowerCase().includes(q));
    $('#c-list').innerHTML = list.length ? list.map(convRow).join('') : '<div class="empty">Hali murojaatlar yo‘q</div>';
    $$('#c-list .row').forEach((r) => r.onclick = () => openConv(r.dataset.id));
    return;
  }
  const list = await api('/api/customers?q=' + encodeURIComponent(q));
  $('#c-list').innerHTML = list.length ? list.map((c) => `<div class="row" data-k="${c.key}">
    ${avatar(c.name || c.phone, c.key)}
    <div class="info"><b>${esc(c.name || 'Ismi noma’lum')}</b>${c.lang === 'ru' ? ' <span class="tag">RU</span>' : ''}
      <div class="muted small">${esc(c.phone)} · ${timeAgo(c.lastSeen)}</div></div>
    <div class="right" style="font-weight:400"><small>📞 ${c.calls} · 🗓 ${c.bookings} · 🛒 ${c.orders}</small></div>
  </div>`).join('') : '<div class="empty">Mijozlar hali yo‘q. Kotib birinchi qo‘ng‘iroqdan boshlab ularni eslab qoladi.</div>';
  $$('#c-list .row').forEach((r) => r.onclick = () => openCustomer(r.dataset.k));
}
function convRow(c) {
  const dur = c.call?.duration ? ` · ${Math.floor(c.call.duration / 60)}:${String(c.call.duration % 60).padStart(2, '0')}` : '';
  const flag = c.call && c.call.status !== 'completed' ? tag(['Javobsiz', 'bad']) : c.handoff ? tag(['Operator', 'warn']) : '';
  return `<div class="row" data-id="${esc(c.id)}">
    ${avatar(c.customer?.name || c.from || '?', c.from)}
    <div class="info"><b>${esc(c.customer?.name || c.from || 'Mijoz')}</b> ${flag}
      <div class="muted small ellipsis">${esc(c.last)}</div>
      <div class="muted small">${SRC[c.channel] || c.channel}${dur} · ${c.count} xabar</div></div>
    <div class="right" style="font-weight:400"><small>${timeAgo(c.updatedAt)}</small></div>
  </div>`;
}
async function openConv(id) {
  const c = await api('/api/conversations/' + encodeURIComponent(id));
  $('#cv-title').textContent = `${c.customer?.name || c.from || 'Mijoz'}`;
  $('#cv-meta').textContent = `${SRC[c.channel] || ''} · ${new Date(c.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}${c.call ? ` · ${c.call.duration} s` : ''}${c.lang ? ' · ' + c.lang.toUpperCase() : ''}`;
  $('#cv-chat').innerHTML = c.messages.map((m) => bubble(m.role === 'user' ? 'me' : 'bot', m.content, m.at)).join('') || '<div class="empty">Suhbat bo‘sh</div>';
  $('#cv').showModal();
  $('#cv-chat').scrollTop = 1e9;
}
const bubble = (who, text, at) => `<div class="msg ${who}">${esc(text).replace(/\n/g, '<br>')}${at ? `<small>${clock(at)}</small>` : ''}</div>`;

async function openCustomer(key) {
  const c = await api('/api/customers/' + key);
  const total = c.orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  $('#cu-body').innerHTML = `<div class="cu-head">${avatar(c.name || c.phone, c.key)}<div class="grow"><input id="cu-name" value="${esc(c.name)}" placeholder="Ismi" style="font-weight:600;font-size:17px;padding:6px 10px"><div class="muted small" style="margin:4px 0 0 4px">${esc(c.phone)} · birinchi murojaat ${new Date(c.firstSeen).toLocaleDateString('ru-RU')}</div></div>${callBtn(c.phone)}</div>
    <div class="cu-stats"><div class="mini"><div class="v">${c.calls}</div><div class="k">Qo‘ng‘iroq</div></div><div class="mini"><div class="v">${c.bookings.length}</div><div class="k">Uchrashuv</div></div><div class="mini"><div class="v">${c.orders.length}</div><div class="k">Zakaz</div></div><div class="mini"><div class="v" style="font-size:14px">${money(total)}</div><div class="k">so‘m</div></div></div>
    <label>Izoh (kotib ham buni ko‘radi)<textarea id="cu-notes" rows="2" placeholder="Masalan: doimiy mijoz, 10% chegirma">${esc(c.notes)}</textarea></label>
    <button class="btn small" id="cu-save">Saqlash</button>
    ${c.bookings.length ? `<div class="group">Uchrashuvlar</div><div class="list">${c.bookings.slice(0, 10).map((b) => bookingRow(b, true)).join('')}</div>` : ''}
    ${c.orders.length ? `<div class="group">Zakazlar</div><div class="list" id="cu-orders">${c.orders.slice(0, 10).map(orderRow).join('')}</div>` : ''}
    ${c.conversations.length ? `<div class="group">Murojaatlar</div><div class="list" id="cu-convs">${c.conversations.slice(0, 15).map(convRow).join('')}</div>` : ''}`;
  $('#cu-save').onclick = async () => { await api('/api/customers/' + key, { method: 'PATCH', body: { name: $('#cu-name').value, notes: $('#cu-notes').value } }); toast('Saqlandi'); loadCustomers(); };
  $$('#cu-convs .row').forEach((r) => r.onclick = () => openConv(r.dataset.id));
  $$('#cu-orders .row').forEach((r) => r.onclick = () => openOrder(c.orders.find((o) => o.id === r.dataset.id)));
  $$('#cu-body .row.st-confirmed, #cu-body .row.st-done, #cu-body .row.st-noshow, #cu-body .row.st-cancelled').forEach((r) => { const b = c.bookings.find((x) => x.id === r.dataset.id); if (b) r.onclick = () => { $('#cu').close(); openBooking(b); }; });
  $('#cu').showModal();
}

// ---------- Vazifalar ----------
let tFilter = 'open';
$$('#t-seg button').forEach((b) => b.onclick = () => { tFilter = b.dataset.f; $$('#t-seg button').forEach((x) => x.classList.toggle('on', x === b)); loadTasks(); });
function taskRow(t) {
  return `<div class="row" data-id="${t.id}">
    <button class="check-btn${t.done ? ' on' : ''}" data-check title="Bajarildi">${icon('check', 'width:16px;height:16px')}</button>
    <div class="info"><b>${esc(t.name || t.phone || 'Noma’lum mijoz')}</b> ${tag(T_TYPE[t.type] || ['Vazifa', ''])}
      <div class="muted small">${esc(t.reason)}</div>
      <div class="muted small">${esc(t.phone)} · ${timeAgo(t.createdAt)}</div></div>
    ${callBtn(t.phone)}
  </div>`;
}
function bindTaskRows(el, list) {
  $$('.row', el).forEach((r) => {
    const t = list.find((x) => x.id === r.dataset.id);
    $('[data-check]', r).onclick = async (e) => { e.stopPropagation(); await api('/api/tasks/' + t.id, { method: 'PATCH', body: { done: !t.done } }); toast(t.done ? 'Qayta ochildi' : 'Bajarildi ✅'); loadTaskBadge(); refresh(); };
    r.onclick = () => t.conversationId && openConv(t.conversationId).catch(() => {});
  });
}
async function loadTasks() {
  const list = (await api('/api/tasks')).filter((t) => (tFilter === 'open' ? !t.done : t.done));
  $('#t-list').innerHTML = list.length ? list.map(taskRow).join('') : `<div class="empty">${tFilter === 'open' ? 'Ochiq vazifalar yo‘q ✨' : 'Bajarilgan vazifalar yo‘q'}</div>`;
  bindTaskRows($('#t-list'), list);
}
async function loadTaskBadge() {
  const n = (await api('/api/tasks')).filter((t) => !t.done).length;
  $('#task-badge').textContent = n; $('#task-badge').classList.toggle('hidden', !n);
}

// ---------- Sinov chati ----------
let testSid = localStorage.getItem('kotib_test') || newSid();
function newSid() { const s = Math.random().toString(36).slice(2, 12); localStorage.setItem('kotib_test', s); return s; }
async function testHello() { const p = await fetch('/api/public').then((r) => r.json()); $('#t-chat').innerHTML = bubble('bot', p.greeting); }
$('#t-form').onsubmit = async (e) => {
  e.preventDefault();
  const text = $('#t-input').value.trim(); if (!text) return;
  $('#t-input').value = '';
  const chat = $('#t-chat');
  chat.insertAdjacentHTML('beforeend', bubble('me', text) + '<div class="msg bot typing">•••</div>');
  chat.scrollTop = 1e9;
  try {
    const j = await api('/api/chat', { method: 'POST', body: { session: testSid, text, test: true } });
    chat.querySelector('.typing').outerHTML = bubble('bot', j.reply)
      + (j.booking ? `<div class="sys">✅ Kalendarga yozildi: ${humanDate(j.booking.date)}, ${j.booking.start}</div>` : '')
      + (j.order ? `<div class="sys">🛒 Zakaz qabul qilindi: ${money(j.order.total)} so‘m</div>` : '')
      + (j.handoff ? '<div class="sys warn">🙋 Insonga topshirildi — vazifa yaratildi</div>' : '');
  } catch (err) { chat.querySelector('.typing').outerHTML = `<div class="sys err">${esc(err.message)}</div>`; }
  chat.scrollTop = 1e9;
};
$('#t-reset').onclick = () => { testSid = newSid(); testHello(); };

// ---------- Sozlamalar ----------
function fillSettings() {
  const b = settings.business;
  $('#p-name').textContent = b.name; $('#p-sub').textContent = [b.phone, b.address].filter(Boolean).join(' · ') || 'Biznes ma’lumotlarini to‘ldiring';
  $('#s-name').value = b.name; $('#s-about').value = b.about; $('#s-address').value = b.address; $('#s-phone').value = b.phone;
  $('#s-greeting').value = b.greeting; $('#s-extra').value = b.extra || '';
  $('#s-step').value = b.slotStep; $('#s-cap').value = b.capacity; $('#s-buf').value = b.bufferMin;
  const langs = String(b.langs || 'uz,ru').split(',');
  $('#s-lang-uz').checked = langs.includes('uz'); $('#s-lang-ru').checked = langs.includes('ru');
  $('#s-operator').value = b.operatorPhone || ''; $('#s-remind').value = b.reminders || ''; $('#s-report').value = b.reportTime || '';
  $('#s-tg').value = b.tgChatId || ''; $('#s-tg-box').classList.toggle('hidden', settings.tgEnvChat);
  $('#s-hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = settings.hours[d] || { open: '09:00', close: '18:00', off: true, breaks: [] };
    const br = h.breaks?.[0];
    return `<div class="hours" data-d="${d}">
      <label class="check day-name"><span class="switch"><input type="checkbox" class="h-on" ${h.off ? '' : 'checked'}><span></span></span>${WD[d]}</label>
      <div class="h-times ${h.off ? 'dim' : ''}">
        <input type="time" class="h-open" value="${h.open}">–<input type="time" class="h-close" value="${h.close}">
        <span class="small">tanaffus</span>
        <input type="time" class="h-bf" value="${br?.from || ''}">–<input type="time" class="h-bt" value="${br?.to || ''}">
      </div></div>`;
  }).join('');
  $$('.h-on').forEach((c) => c.onchange = () => c.closest('.hours').querySelector('.h-times').classList.toggle('dim', !c.checked));
  renderServices(); renderProducts(); renderFaq(); renderStatus();
}
function renderServices() {
  $('#s-services').innerHTML = settings.services.map((s, i) => `<div class="svc" data-i="${i}">
    <input class="sv-name" placeholder="Xizmat nomi" value="${esc(s.name)}">
    <div class="row3"><label>Davomiyligi (daq.)<input class="sv-dur" type="number" min="5" step="5" value="${s.duration}"></label>
    <label>Narxi<input class="sv-price" value="${esc(s.price)}" placeholder="100 000 so‘m"></label>
    <button type="button" class="btn small danger sv-del">${icon('x', 'width:14px;height:14px')}</button></div>
    <input class="sv-desc" placeholder="Qisqa izoh (ixtiyoriy)" value="${esc(s.desc)}"></div>`).join('');
  $$('.sv-del').forEach((b) => b.onclick = () => { collect(); settings.services.splice(Number(b.closest('.svc').dataset.i), 1); renderServices(); });
}
function renderProducts() {
  $('#s-products').innerHTML = (settings.products || []).map((p, i) => `<div class="svc" data-i="${i}">
    <input class="pr-name" placeholder="Mahsulot nomi" value="${esc(p.name)}">
    <div class="row4"><label>Narxi (so‘m)<input class="pr-price" type="number" min="0" value="${p.price ?? ''}"></label>
    <label>Qoldiq<input class="pr-stock" type="number" min="0" value="${p.stock ?? ''}" placeholder="∞"></label>
    <label>Birlik<input class="pr-unit" value="${esc(p.unit || 'dona')}"></label>
    <button type="button" class="btn small danger pr-del">${icon('x', 'width:14px;height:14px')}</button></div>
    <input class="pr-desc" placeholder="Qisqa izoh (ixtiyoriy)" value="${esc(p.desc || '')}"></div>`).join('');
  $$('.pr-del').forEach((b) => b.onclick = () => { collect(); settings.products.splice(Number(b.closest('.svc').dataset.i), 1); renderProducts(); });
}
function renderFaq() {
  $('#s-faq').innerHTML = settings.faq.map((f, i) => `<div class="svc" data-i="${i}">
    <input class="fq-q" placeholder="Savol" value="${esc(f.q)}">
    <textarea class="fq-a" rows="2" placeholder="Javob">${esc(f.a)}</textarea>
    <button type="button" class="btn small danger fq-del" style="justify-self:start">O'chirish</button></div>`).join('');
  $$('.fq-del').forEach((b) => b.onclick = () => { collect(); settings.faq.splice(Number(b.closest('.svc').dataset.i), 1); renderFaq(); });
}
function renderStatus() {
  const base = settings.publicUrl || location.origin;
  $('#u-voice').textContent = base + '/twilio/voice';
  $('#u-status').textContent = base + '/twilio/status';
  $('#u-sms').textContent = base + '/twilio/sms';
  $('#u-chat').textContent = base + '/chat';
  const it = (ok, t, hint) => `<div>${ok ? '✅' : '⚠️'} ${t}${!ok && hint ? `<div class="muted small">${hint}</div>` : ''}</div>`;
  $('#s-status').innerHTML = [
    it(settings.ai, "Sun'iy intellekt (tabiiy suhbat)", "Kalit yo'q — kotib oddiy qoidalar bilan ishlayapti. Bepul GEMINI_API_KEY qo'shing (aistudio.google.com)."),
    it(settings.twilio, 'Telefon (Twilio)', "TWILIO_AUTH_TOKEN qo'shilmagan."),
    it(settings.sms, 'SMS eslatmalar', 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN va TWILIO_FROM kerak.'),
    it(settings.operator, 'Operatorga yo‘naltirish', 'Yuqorida "Operator raqami"ni kiriting — aks holda kotib vazifa yaratadi.'),
    it(settings.telegram, 'Telegram', settings.tgToken ? 'Chat ID kiriting.' : "Serverga TG_BOT_TOKEN qo'shing."),
    it(settings.publicUrl, 'Ochiq manzil (PUBLIC_URL)', 'Twilio imzosini tekshirish uchun kerak.'),
    it(settings.db === 'postgres', 'Doimiy baza', "Ma'lumotlar faylda. Bepul serverlarda o'chib ketmasligi uchun DATABASE_URL (PostgreSQL) qo'shing."),
  ].join('');
  $('#s-pass-box').classList.toggle('hidden', settings.adminEnv);
}
function collect() {
  settings.services = $$('#s-services .svc').map((el, i) => ({ id: settings.services[i]?.id, name: $('.sv-name', el).value, duration: Number($('.sv-dur', el).value), price: $('.sv-price', el).value, desc: $('.sv-desc', el).value }));
  settings.products = $$('#s-products .svc').map((el, i) => ({ id: settings.products[i]?.id, name: $('.pr-name', el).value, price: $('.pr-price', el).value, stock: $('.pr-stock', el).value, unit: $('.pr-unit', el).value, desc: $('.pr-desc', el).value }));
  settings.faq = $$('#s-faq .svc').map((el, i) => ({ id: settings.faq[i]?.id, q: $('.fq-q', el).value, a: $('.fq-a', el).value }));
}
$('#s-add-svc').onclick = () => { collect(); settings.services.push({ name: '', duration: 30, price: '', desc: '' }); renderServices(); $$('.sv-name').pop().focus(); };
$('#s-add-prod').onclick = () => { collect(); settings.products.push({ name: '', price: '', stock: '', unit: 'dona', desc: '' }); renderProducts(); $$('.pr-name').pop().focus(); };
$('#s-add-faq').onclick = () => { collect(); settings.faq.push({ q: '', a: '' }); renderFaq(); $$('.fq-q').pop().focus(); };
async function saveSettings(silent) {
  collect();
  const hours = {};
  $$('.hours').forEach((el) => {
    const bf = $('.h-bf', el).value, bt = $('.h-bt', el).value;
    hours[el.dataset.d] = { open: $('.h-open', el).value, close: $('.h-close', el).value, off: !$('.h-on', el).checked, breaks: bf && bt ? [{ from: bf, to: bt }] : [] };
  });
  const langs = [$('#s-lang-uz').checked && 'uz', $('#s-lang-ru').checked && 'ru'].filter(Boolean);
  const business = {
    name: $('#s-name').value, about: $('#s-about').value, address: $('#s-address').value, phone: $('#s-phone').value, greeting: $('#s-greeting').value, extra: $('#s-extra').value,
    slotStep: $('#s-step').value, capacity: $('#s-cap').value, bufferMin: $('#s-buf').value,
    langs: (langs.length ? langs : ['uz']).join(','), operatorPhone: $('#s-operator').value, reminders: $('#s-remind').value, reportTime: $('#s-report').value, tgChatId: $('#s-tg').value,
  };
  await api('/api/settings', { method: 'PUT', body: { business, hours, services: settings.services, products: settings.products, faq: settings.faq } });
  settings = await api('/api/settings');
  $('#biz-name').textContent = settings.business.name;
  fillSettings();
  if (!silent) toast('Saqlandi ✅');
}
$('#s-save').onclick = () => saveSettings().catch((e) => toast(e.message));
$('#s-tg-test').onclick = async () => { try { await saveSettings(true); await api('/api/telegram/test', { method: 'POST' }); toast('Telegramga sinov xabari yuborildi ✅'); } catch (e) { toast(e.message); } };
$('#s-tg-report').onclick = async () => { try { await saveSettings(true); await api('/api/report/send', { method: 'POST' }); toast('Hisobot yuborildi ✅'); } catch (e) { toast(e.message); } };
$('#s-pass-btn').onclick = async () => {
  try { const j = await api('/api/auth/password', { method: 'POST', body: { password: $('#s-pass').value } }); token = j.token; localStorage.setItem('kotib_token', token); $('#s-pass').value = ''; live(); toast('Parol almashtirildi'); } catch (e) { toast(e.message); }
};
$('#logout').onclick = logout;
$$('.copy').forEach((c) => c.onclick = () => { navigator.clipboard?.writeText(c.textContent); toast('Nusxa olindi'); });

boot();
