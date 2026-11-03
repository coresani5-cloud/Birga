/* Uzbegim — mijoz: ro'yxatdan o'tish, manzil, buyurtma va jonli kuzatuv.
   Server ishlayotgan bo'lsa (node server.js) hammasi haqiqiy: holatni oshxona/kuryer belgilaydi,
   kuryer GPS'i xaritada ko'rinadi. Fayl to'g'ridan-to'g'ri ochilsa — "Demo" rejim. */
const UZ = window.UZB;
let LIVE = false, ME = null, ES = null, TRK = null;

Object.assign(T.uz, {
  login: 'Kirish', register: "Ro'yxatdan o'tish", password: 'Parol (kamida 6 belgi)', haveAcc: 'Akkauntingiz bormi?', noAcc: "Akkauntingiz yo'qmi?",
  authH: 'Xush kelibsiz!', authP: "Buyurtma berish uchun akkauntga kiring yoki ro'yxatdan o'ting.",
  eExists: "Bu raqam allaqachon ro'yxatdan o'tgan. Kirish bo'limiga o'ting.", eLogin: "Telefon yoki parol noto'g'ri", ePhone: "Telefon raqamni +998 XX XXX XX XX ko'rinishida kiriting", ePw: "Parol kamida 6 belgidan iborat bo'lsin", eName: 'Ismingizni kiriting', eNet: "Server bilan aloqa yo'q. Internetni tekshiring.",
  welcomeU: 'Xush kelibsiz', profile: 'Profil', myOrders: 'Mening buyurtmalarim', noOrders: "Hali buyurtma yo'q", logout: 'Chiqish', track: 'Kuzatish', myAddr: 'Manzillarim', noAddr: "Saqlangan manzil yo'q. Buyurtma berishda saqlab qo'yishingiz mumkin.",
  addrPh: "Ko'cha, uy, xonadon, mo'ljal", pickMap: '📍 Xaritada belgilash', myLoc: '🎯 Joylashuvimni aniqlash', mapDone: '✓ Xaritada belgilandi', saveAddr: 'Manzilni saqlab qo\'yish', addrLabel: 'Nomi (Uy, Ish...)', pickBranch: 'Filialni tanlang', mapHint: "Xaritani suring — pin manzilingiz ustida tursin",
  locDenied: "Joylashuvni aniqlab bo'lmadi. Xaritada qo'lda belgilang.", needAddr: 'Manzilni kiriting', orderFor: 'Buyurtmachi',
  waiting: 'Oshxona buyurtmangizni ko\'rib chiqmoqda...', courierCard: 'Kuryeringiz', dist: 'Masofa', left: 'Qoldi', upd: 'Yangilandi', near: '🔔 Kuryer yetib kelay dedi! Eshikka chiqing.', mins: 'daq', demo: 'Demo rejim: holatlar avtomatik o\'zgaradi. Haqiqiy rejim uchun serverni ishga tushiring.',
  myOrder: 'Buyurtmam', cancelled: 'Buyurtma bekor qilindi. Savollar bo\'lsa qo\'ng\'iroq qiling: +998 71 200-00-00', items: 'Tarkib', gpsWait: 'Kuryer GPS signali kutilmoqda...', toYou: 'sizgacha',
});
Object.assign(T.ru, {
  login: 'Войти', register: 'Регистрация', password: 'Пароль (минимум 6 символов)', haveAcc: 'Уже есть аккаунт?', noAcc: 'Нет аккаунта?',
  authH: 'Добро пожаловать!', authP: 'Чтобы сделать заказ, войдите или зарегистрируйтесь.',
  eExists: 'Этот номер уже зарегистрирован. Перейдите ко входу.', eLogin: 'Неверный телефон или пароль', ePhone: 'Введите номер в формате +998 XX XXX XX XX', ePw: 'Пароль должен быть не короче 6 символов', eName: 'Введите имя', eNet: 'Нет связи с сервером. Проверьте интернет.',
  welcomeU: 'Добро пожаловать', profile: 'Профиль', myOrders: 'Мои заказы', noOrders: 'Заказов пока нет', logout: 'Выйти', track: 'Отследить', myAddr: 'Мои адреса', noAddr: 'Сохранённых адресов нет. Можно сохранить при заказе.',
  addrPh: 'Улица, дом, квартира, ориентир', pickMap: '📍 Отметить на карте', myLoc: '🎯 Определить местоположение', mapDone: '✓ Отмечено на карте', saveAddr: 'Сохранить адрес', addrLabel: 'Название (Дом, Работа...)', pickBranch: 'Выберите филиал', mapHint: 'Двигайте карту — пин должен стоять на вашем адресе',
  locDenied: 'Не удалось определить местоположение. Отметьте на карте вручную.', needAddr: 'Укажите адрес', orderFor: 'Заказчик',
  waiting: 'Кухня рассматривает ваш заказ...', courierCard: 'Ваш курьер', dist: 'Расстояние', left: 'Осталось', upd: 'Обновлено', near: '🔔 Курьер почти у вас! Выходите к двери.', mins: 'мин', demo: 'Демо-режим: статусы меняются автоматически. Для реальной работы запустите сервер.',
  myOrder: 'Мой заказ', cancelled: 'Заказ отменён. Вопросы: +998 71 200-00-00', items: 'Состав', gpsWait: 'Ждём GPS-сигнал курьера...', toYou: 'до вас',
});

/* ---------- Stil ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:16px;background:var(--glass);border:1px solid var(--ln);margin-top:16px}
.auth-tabs button{height:42px;border-radius:12px;font-weight:800}
.auth-tabs button.on{background:var(--grad);color:#120d09}
.err{color:#ff6b5e;font-size:13px;font-weight:700;min-height:18px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chipb{padding:9px 14px;border-radius:999px;border:1px solid var(--ln);background:var(--glass);font-weight:700;font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chipb.on{border-color:var(--or);color:var(--or2);background:rgba(255,122,0,.12)}
.pick{position:relative;height:260px;border-radius:20px;overflow:hidden;border:1px solid var(--ln)}
.pick .cpin{position:absolute;left:50%;top:50%;z-index:500;transform:translate(-50%,-100%);font-size:40px;pointer-events:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))}
.row2{display:flex;gap:8px;flex-wrap:wrap}
.row2 .btn{flex:1;height:44px;font-size:13px;padding:0 14px}
.ok{color:#34d399;font-weight:800;font-size:13px}
.me-card{display:flex;gap:14px;align-items:center;padding:16px;border-radius:20px;background:var(--glass);border:1px solid var(--ln)}
.me-av{width:54px;height:54px;border-radius:50%;background:var(--grad);display:grid;place-items:center;font-family:Unbounded;font-weight:900;font-size:22px;color:#120d09;flex:none}
.olist{display:grid;gap:10px}
.oi{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:var(--glass);border:1px solid var(--ln)}
.oi .m{flex:1;min-width:0}.oi .m b{display:block}.oi .m span{font-size:12px;color:var(--mut)}
.stc{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:var(--glass2);border:1px solid var(--ln);white-space:nowrap}
.stc.onway,.stc.ready{background:rgba(255,122,0,.15);color:var(--or2);border-color:rgba(255,122,0,.4)}
.stc.delivered{background:rgba(52,211,153,.12);color:#34d399;border-color:rgba(52,211,153,.35)}
.stc.cancelled{background:rgba(255,80,60,.12);color:#ff6b5e}
.trk-h{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-right:44px}
.trk-big{display:flex;gap:14px;align-items:center;margin:16px 0;padding:16px;border-radius:20px;background:linear-gradient(135deg,rgba(255,166,43,.16),rgba(255,106,0,.08));border:1px solid rgba(255,122,0,.3)}
.trk-big .e{font-size:40px}.trk-big b{display:block;font-size:17px}.trk-big span{color:var(--mut);font-size:13px}
.trk-map{height:300px;border-radius:20px;overflow:hidden;border:1px solid var(--ln);background:var(--glass)}
.trk-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.trk-stats div{padding:10px 12px;border-radius:16px;background:var(--glass);border:1px solid var(--ln)}
.trk-stats span{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.trk-stats b{font-family:Unbounded;font-size:16px;color:var(--or2)}
.near{margin-top:12px;padding:14px;border-radius:16px;background:var(--grad);color:#120d09;font-weight:800;text-align:center;animation:nearp 1.2s infinite}
@keyframes nearp{50%{transform:scale(1.02)}}
.ts small{display:block;color:var(--mut);font-weight:600;font-size:12px}
.ts.on b{color:var(--ink)}
.demo-note{margin-top:12px;font-size:12px;color:var(--mut);padding:10px 12px;border-radius:12px;border:1px dashed var(--ln)}
.otype.alt{background:var(--glass2);color:var(--ink);border:1px solid rgba(255,122,0,.5);box-shadow:none;animation:nearp 2s infinite}
</style>`);

/* ---------- Akkaunt ---------- */
const demoUsers = () => store.get('demo_users', {});
async function loadMe() {
  if (LIVE) {
    if (!UZ.token()) ME = null;
    else try { ME = await UZ.api('me'); } catch (e) { if (e.status === 401) UZ.setToken(''); ME = null; }
  } else ME = store.get('demo_me', null);
  updateUserUi();
}
function updateUserUi() {
  const b = document.getElementById('userBtn');
  if (b) b.classList.toggle('on', !!ME);
  const tp = document.getElementById('tProfile');
  if (tp) tp.querySelector('span').textContent = ME ? ME.name.split(' ')[0] : t('login');
}
async function saveMe(patch) {
  Object.assign(ME, patch);
  if (LIVE) { try { ME = await UZ.api('me', { method: 'PUT', body: patch }); } catch (e) {} }
  else { store.set('demo_me', ME); const u = demoUsers(); if (u[ME.phone]) { u[ME.phone].addresses = ME.addresses; store.set('demo_users', u); } }
}
const phoneDigits = v => v.replace(/\D/g, '');

function openAuth(after, tab = 'reg') {
  const draw = () => {
    openModal(`<div class="mbody" style="padding-top:30px">
      <div style="display:flex;gap:12px;align-items:center">${document.querySelector('.emb').outerHTML.replace('class="emb"', 'class="emb" style="width:56px;height:56px"').replace(/id="eg2?"/, 'id="eg9"').replace(/url\(#eg2?\)/, 'url(#eg9)')}<div><h3>${t('authH')}</h3><p style="color:var(--mut);font-size:14px">${t('authP')}</p></div></div>
      <div class="auth-tabs"><button class="${tab === 'reg' ? 'on' : ''}" data-at="reg">${t('register')}</button><button class="${tab === 'in' ? 'on' : ''}" data-at="in">${t('login')}</button></div>
      <form class="form" id="authF" novalidate>
        ${tab === 'reg' ? `<input id="aName" placeholder="${t('name')}" autocomplete="name">` : ''}
        <input id="aPhone" type="tel" value="+998 " autocomplete="tel">
        <input id="aPw" type="password" placeholder="${t('password')}" autocomplete="${tab === 'reg' ? 'new-password' : 'current-password'}">
        <div class="err" id="aErr"></div>
        <button class="btn wide" type="submit">${tab === 'reg' ? t('register') : t('login')} →</button>
      </form></div>`);
    document.querySelectorAll('[data-at]').forEach(b => (b.onclick = () => { tab = b.dataset.at; draw(); }));
    const ph = document.getElementById('aPhone');
    ph.oninput = () => { let d = phoneDigits(ph.value); if (!d.startsWith('998')) d = '998' + d.replace(/^9?9?8?/, ''); d = d.slice(0, 12); ph.value = '+' + d.slice(0, 3) + ' ' + d.slice(3, 5) + (d.length > 5 ? ' ' + d.slice(5, 8) : '') + (d.length > 8 ? ' ' + d.slice(8, 10) : '') + (d.length > 10 ? ' ' + d.slice(10, 12) : ''); };
    document.getElementById('authF').onsubmit = async e => {
      e.preventDefault();
      const err = document.getElementById('aErr');
      const name = tab === 'reg' ? document.getElementById('aName').value.trim() : '';
      const phone = phoneDigits(ph.value), pw = document.getElementById('aPw').value;
      if (tab === 'reg' && !name) return (err.textContent = t('eName'));
      if (phone.length !== 12) return (err.textContent = t('ePhone'));
      if (pw.length < 6) return (err.textContent = t('ePw'));
      err.textContent = '';
      try {
        if (LIVE) {
          const r = await UZ.api(tab === 'reg' ? 'auth/register' : 'auth/login', { body: { name, phone, password: pw } });
          UZ.setToken(r.token); ME = r.user;
        } else {
          const u = demoUsers(), key = '+' + phone;
          if (tab === 'reg') { if (u[key]) return (err.textContent = t('eExists')); u[key] = { name, phone: key, pw, addresses: [] }; store.set('demo_users', u); }
          else if (!u[key] || u[key].pw !== pw) return (err.textContent = t('eLogin'));
          ME = { name: u[key].name, phone: key, addresses: u[key].addresses || [] }; store.set('demo_me', ME);
        }
        updateUserUi(); closeAll(); toast(`👋 ${t('welcomeU')}, ${ME.name}!`);
        if (after) setTimeout(after, 250);
      } catch (x) {
        err.textContent = x.message === 'exists' ? t('eExists') : x.message === 'login' ? t('eLogin') : x.message === 'phone' ? t('ePhone') : x.message === 'password' ? t('ePw') : t('eNet');
      }
    };
  };
  draw();
}

async function myOrders() {
  if (LIVE) { try { return await UZ.api('me/orders'); } catch (e) { return []; } }
  return store.get('demo_orders', []).filter(o => o.phone === ME.phone);
}
async function openProfile() {
  if (!ME) return openAuth(openProfile, 'in');
  openModal(`<div class="mbody" style="padding-top:30px"><h3>${t('profile')}</h3>
    <div class="me-card" style="margin-top:14px"><div class="me-av">${ME.name[0].toUpperCase()}</div><div style="min-width:0"><b style="font-size:17px">${esc(ME.name)}</b><div style="color:var(--mut)">${esc(ME.phone)}</div></div></div>
    <div class="lbl" style="margin-top:18px">${t('myAddr')}</div>
    <div class="olist" id="pAddr" style="margin-top:8px"></div>
    <div class="lbl" style="margin-top:18px">${t('myOrders')}</div>
    <div class="olist" id="pOrders" style="margin-top:8px"><div class="hint">...</div></div>
    <button class="btn ghost wide" id="pOut" style="margin-top:18px">${t('logout')}</button></div>`);
  const drawAddr = () => {
    document.getElementById('pAddr').innerHTML = (ME.addresses || []).length
      ? ME.addresses.map((a, i) => `<div class="oi"><span style="font-size:22px">📍</span><div class="m"><b>${esc(a.label || t('addr'))}</b><span>${esc(a.addr)}</span></div><button class="x" data-deladdr="${i}" aria-label="delete">✕</button></div>`).join('')
      : `<div class="hint">${t('noAddr')}</div>`;
    document.querySelectorAll('[data-deladdr]').forEach(b => (b.onclick = async () => { ME.addresses.splice(+b.dataset.deladdr, 1); await saveMe({ addresses: ME.addresses }); drawAddr(); }));
  };
  drawAddr();
  document.getElementById('pOut').onclick = async () => {
    if (LIVE) { try { await UZ.api('auth/logout', { body: {} }); } catch (e) {} UZ.setToken(''); } else store.set('demo_me', null);
    ME = null; updateUserUi(); closeAll();
  };
  const list = await myOrders();
  const el = document.getElementById('pOrders');
  if (!el) return;
  el.innerHTML = list.length ? list.map(o => {
    const k = UZ.statusKey(o.status, o.mode);
    return `<div class="oi"><span style="font-size:24px">${UZ.STATUS[k].e}</span><div class="m"><b>#${o.no} • ${UZ.money(o.total)} ${t('sum')}</b><span>${new Date(o.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div><span class="stc ${o.status}">${UZ.STATUS[k].s[L]}</span><button class="btn" style="height:38px;padding:0 14px;font-size:13px" data-trk="${o.id}" data-tok="${o.token || ''}">${t('track')}</button></div>`;
  }).join('') : `<div class="hint">${t('noOrders')}</div>`;
  el.querySelectorAll('[data-trk]').forEach(b => (b.onclick = () => openTrack({ id: b.dataset.trk, token: b.dataset.tok })));
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Buyurtma berish ---------- */
function openCheckout() {
  if (!ME) { $('#drawer').classList.remove('on'); return openAuth(openCheckout); }
  const s = totals();
  const sel = { addr: '', lat: null, lng: null, branch: 0, label: '' };
  const saved = ME.addresses || [];
  if (saved[0]) Object.assign(sel, saved[0]);
  let pickMap = null;
  $('#drawer').classList.remove('on');
  const draw = () => {
    openModal(`<div class="mbody" style="padding-top:30px"><h3>${t('ordH')}</h3><div class="form">
      <div class="seg"><button type="button" class="${mode === 'd' ? 'on' : ''}" data-cm="d">${t('oDel')}</button><button type="button" class="${mode === 'p' ? 'on' : ''}" data-cm="p">${t('oPick')}</button></div>
      <div class="me-card" style="padding:12px"><div class="me-av" style="width:40px;height:40px;font-size:16px">${esc(ME.name[0].toUpperCase())}</div><div><span class="hint">${t('orderFor')}</span><b style="display:block">${esc(ME.name)} • ${esc(ME.phone)}</b></div></div>
      ${mode === 'd' ? `
        ${saved.length ? `<div class="chips">${saved.map((a, i) => `<button type="button" class="chipb ${sel.addr === a.addr ? 'on' : ''}" data-sa="${i}">📍 ${esc(a.label || a.addr)}</button>`).join('')}</div>` : ''}
        <textarea id="fAddr" placeholder="${t('addrPh')}" style="height:70px">${esc(sel.addr)}</textarea>
        <div class="row2"><button type="button" class="btn ghost" id="fLoc">${t('myLoc')}</button><button type="button" class="btn ghost" id="fMapB">${t('pickMap')}</button></div>
        <div id="fMapW" hidden><div class="pick"><div id="fMap" style="height:100%"></div><span class="cpin">📍</span></div><div class="hint" style="margin-top:6px">${t('mapHint')}</div></div>
        <div id="fMapOk" class="ok" ${sel.lat == null ? 'hidden' : ''}>${t('mapDone')}</div>
        <label style="display:flex;gap:10px;align-items:center;font-weight:700;font-size:14px"><input type="checkbox" id="fSave" ${saved.some(a => a.addr === sel.addr) ? '' : 'checked'} style="width:20px;height:20px;accent-color:#ff7a00"> ${t('saveAddr')}</label>
      ` : `<select id="fBranch">${UZ.BRANCHES.map((b, i) => `<option value="${i}" ${sel.branch === i ? 'selected' : ''}>${b[L]}</option>`).join('')}</select>`}
      <textarea id="fNote" placeholder="${t('note')}"></textarea>
      <div class="hint">💳 ${t('pay')}</div>
      <div class="line tot"><span>${t('total')}</span><span>${fmt(totals().tot)}</span></div>
      <div class="err" id="fErr"></div>
      <button type="button" class="btn wide" id="fGo">${t('confirm')} ✓</button></div></div>`);
    document.querySelectorAll('[data-cm]').forEach(b => (b.onclick = () => { setMode(b.dataset.cm); draw(); }));
    document.querySelectorAll('[data-sa]').forEach(b => (b.onclick = () => { Object.assign(sel, saved[+b.dataset.sa]); draw(); }));
    const addrEl = document.getElementById('fAddr');
    if (addrEl) addrEl.oninput = () => (sel.addr = addrEl.value);
    const showOk = () => { const o = document.getElementById('fMapOk'); if (o) o.hidden = sel.lat == null; };
    const openPick = async c => {
      document.getElementById('fMapW').hidden = false;
      try {
        if (!pickMap || !document.getElementById('fMap').children.length) {
          pickMap = await UZ.makeMap(document.getElementById('fMap'), c || (sel.lat != null ? sel : UZ.CENTER), 16);
          pickMap.on('moveend', () => { const p = pickMap.getCenter(); sel.lat = +p.lat.toFixed(6); sel.lng = +p.lng.toFixed(6); showOk(); });
        } else if (c) pickMap.setView([c.lat, c.lng], 17);
        const p = pickMap.getCenter(); sel.lat = +p.lat.toFixed(6); sel.lng = +p.lng.toFixed(6); showOk();
      } catch (e) { toast(t('eNet')); }
    };
    const mb = document.getElementById('fMapB');
    if (mb) mb.onclick = () => { pickMap = null; openPick(); };
    const lb = document.getElementById('fLoc');
    if (lb) lb.onclick = () => {
      if (!navigator.geolocation) return toast(t('locDenied'));
      lb.textContent = '...';
      navigator.geolocation.getCurrentPosition(p => { lb.textContent = t('myLoc'); pickMap = null; openPick({ lat: p.coords.latitude, lng: p.coords.longitude }); },
        () => { lb.textContent = t('myLoc'); toast(t('locDenied')); pickMap = null; openPick(); }, { enableHighAccuracy: true, timeout: 10000 });
    };
    document.getElementById('fGo').onclick = submit;
  };
  const submit = async () => {
    const err = document.getElementById('fErr');
    const note = document.getElementById('fNote').value.trim();
    if (mode === 'd') { sel.addr = document.getElementById('fAddr').value.trim(); if (!sel.addr) return (err.textContent = t('needAddr')); }
    else sel.branch = +document.getElementById('fBranch').value;
    const tt = totals();
    const items = Object.entries(cart).map(([k, q]) => { const r = PK(k); return { id: k, n: vName(r.p, r.vi), q, price: r.v.p }; });
    const body = { mode, addr: mode === 'd' ? sel.addr : UZ.BRANCHES[sel.branch][L], lat: mode === 'd' ? sel.lat : null, lng: mode === 'd' ? sel.lng : null, branch: sel.branch, note, items, total: tt.tot, promo };
    if (mode === 'd' && document.getElementById('fSave')?.checked && !(ME.addresses || []).some(a => a.addr === sel.addr)) {
      await saveMe({ addresses: [{ label: sel.label || (L === 'ru' ? 'Адрес' : 'Manzil') + ' ' + ((ME.addresses || []).length + 1), addr: sel.addr, lat: sel.lat, lng: sel.lng }, ...(ME.addresses || [])] });
    }
    const btn = document.getElementById('fGo'); btn.disabled = true; btn.textContent = '...';
    let ref;
    try {
      if (LIVE) ref = await UZ.api('orders', { body });
      else ref = demoCreate(body);
    } catch (e) {
      btn.disabled = false; btn.textContent = t('confirm') + ' ✓';
      if (e.status === 401) { ME = null; UZ.setToken(''); return openAuth(openCheckout, 'in'); }
      return (err.textContent = t('eNet'));
    }
    cart = {}; promo = null; save(); renderMenu(); renderCart();
    store.set('active', { id: ref.id, token: ref.token });
    updateActive();
    confetti(70);
    openTrack(ref);
  };
  draw();
}

/* ---------- Jonli kuzatuv ---------- */
function stopTrack() { if (ES) { ES.close(); ES = null; } if (TRK && TRK.timer) clearInterval(TRK.timer); TRK = null; }
const _closeAll = closeAll;
closeAll = function () { stopTrack(); _closeAll(); }; // eslint-disable-line no-global-assign

async function openTrack(ref) {
  stopTrack();
  openModal(`<div class="mbody trk" style="padding-top:26px">
    <div class="trk-h"><div><span class="hint">${t('ordNo')}</span><h3 id="tNo">#…</h3></div><span class="stc" id="tChip"></span></div>
    <div class="trk-big"><span class="e" id="tE">🕓</span><div><b id="tTitle">${t('waiting')}</b><span id="tSub"></span></div></div>
    <div id="tCancel" class="err" hidden>${t('cancelled')}</div>
    <div id="tMapW" hidden><div class="trk-map" id="tMap"></div>
      <div class="trk-stats"><div><span>${t('dist')}</span><b id="tDist">—</b></div><div><span>${t('left')}</span><b id="tEta">—</b></div><div><span>${t('upd')}</span><b id="tUpd" style="font-size:12px;font-family:Manrope">—</b></div></div>
      <div id="tNear" class="near" hidden>${t('near')}</div></div>
    <div class="track" id="tSteps"></div>
    <div id="tCourier"></div>
    <details style="margin-top:10px"><summary class="lbl" style="cursor:pointer">${t('items')}</summary><div id="tItems" style="margin-top:8px"></div></details>
    ${LIVE ? '' : `<div class="demo-note">🧪 ${t('demo')}</div>`}
    <button class="btn wide" data-close style="margin-top:14px">${t('close')}</button></div>`);
  TRK = { ref, map: null, mk: {}, line: null, last: null, nearShown: false };
  const me = TRK;
  if (LIVE) {
    ES = new EventSource(`api/orders/${ref.id}/stream?t=${encodeURIComponent(ref.token || '')}`);
    ES.onmessage = e => { if (TRK === me) renderTrack(JSON.parse(e.data)); };
    ES.onerror = () => { if (TRK === me) document.getElementById('tUpd') && (document.getElementById('tUpd').textContent = '…'); };
  } else {
    const o = demoGet(ref.id);
    if (!o) return;
    renderTrack(demoTick(o));
    me.timer = setInterval(() => { if (TRK === me) renderTrack(demoTick(demoGet(ref.id))); }, 1000);
  }
  me.ago = setInterval(() => { if (TRK !== me) return clearInterval(me.ago); const u = document.getElementById('tUpd'); if (u && me.last?.loc) u.textContent = UZ.ago(me.last.loc.at, L); }, 1000);
}

async function renderTrack(o) {
  const me = TRK;
  if (!me || !document.getElementById('tNo')) return;
  const prev = me.last; me.last = o;
  const flow = UZ.FLOW[o.mode], idx = flow.indexOf(o.status);
  const k = UZ.statusKey(o.status, o.mode), S = UZ.STATUS[k];
  document.getElementById('tNo').textContent = '#' + o.no;
  const chip = document.getElementById('tChip'); chip.className = 'stc ' + o.status; chip.textContent = S.s[L];
  document.getElementById('tE').textContent = S.e;
  document.getElementById('tTitle').textContent = o.status === 'new' ? t('waiting') : S[L];
  document.getElementById('tSub').textContent = o.status === 'onway' && o.courier ? `${o.courier.name}` : o.mode === 'p' ? UZ.BRANCHES[o.branch || 0][L] : '';
  document.getElementById('tCancel').hidden = o.status !== 'cancelled';
  // Bosqichlar: faqat oshxona/kuryer belgilaganlari yonadi
  document.getElementById('tSteps').innerHTML = flow.map((st, i) => {
    const kk = UZ.statusKey(st, o.mode), on = o.status !== 'cancelled' && i <= idx;
    const tm = o.history && o.history[st] ? UZ.time(o.history[st]) : '';
    return `${i ? '<div class="bar"></div>' : ''}<div class="ts ${on ? 'on' : ''} ${i === idx && st !== 'delivered' ? 'cur' : ''}"><span class="d">${UZ.STATUS[kk].e}</span><div><b>${UZ.STATUS[kk].s[L]}</b>${tm ? `<small>${tm}</small>` : ''}</div></div>`;
  }).join('');
  document.getElementById('tItems').innerHTML = (o.items || []).map(i => `<div class="line"><span>${esc(i.n)} × ${i.q}</span><span>${UZ.money(i.price * i.q)}</span></div>`).join('') + `<div class="line tot"><span>${t('total')}</span><span>${fmt(o.total)}</span></div>`;
  document.getElementById('tCourier').innerHTML = o.courier && (o.status === 'onway' || o.status === 'delivered')
    ? `<div class="me-card" style="margin-top:12px"><div class="me-av">🛵</div><div><span class="hint">${t('courierCard')}</span><b style="display:block">${esc(o.courier.name)}</b>${o.courier.phone ? `<span style="user-select:all;color:var(--or2);font-weight:800">${esc(o.courier.phone)}</span>` : ''}</div></div>` : '';
  if (o.status === 'delivered' && prev && prev.status !== 'delivered') { confetti(90); toast(S[L]); }
  if (prev && prev.status !== o.status && o.status !== 'new') { try { navigator.vibrate && navigator.vibrate(120); } catch (e) {} }
  updateActive(o);

  // Xarita: yetkazib berishda, kuryer yo'lga chiqqanda
  const showMap = o.mode === 'd' && (o.status === 'onway' || (o.status === 'delivered' && o.loc));
  document.getElementById('tMapW').hidden = !showMap;
  if (!showMap) return;
  const dest = o.dest, loc = o.loc, shop = UZ.BRANCHES[o.branch || 0];
  // Masofa va vaqt: xarita yuklanmasa ham ko'rinadi
  if (loc && dest) {
    const m = UZ.dist(loc, dest);
    document.getElementById('tDist').textContent = UZ.fmtDist(m, L);
    document.getElementById('tEta').textContent = o.status === 'delivered' ? '0' : '~' + UZ.etaMin(m, loc.speed) + ' ' + t('mins');
    document.getElementById('tSub').textContent = `${o.courier ? o.courier.name + ' • ' : ''}${UZ.fmtDist(m, L)} ${t('toYou')}`;
    const near = o.status === 'onway' && m < 350;
    document.getElementById('tNear').hidden = !near;
    if (near && !me.nearShown) { me.nearShown = true; toast(t('near')); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
  }
  if (loc) document.getElementById('tUpd').textContent = UZ.ago(loc.at, L);
  else document.getElementById('tUpd').textContent = t('gpsWait');
  try {
    const Lf = await UZ.leaflet();
    if (TRK !== me) return;
    if (!me.map) {
      me.map = await UZ.makeMap(document.getElementById('tMap'), loc || dest || shop, 14);
      me.mk.shop = Lf.marker([shop.lat, shop.lng], { icon: UZ.pin(Lf, '🏪', 'shop') }).addTo(me.map);
      if (dest) me.mk.home = Lf.marker([dest.lat, dest.lng], { icon: UZ.pin(Lf, '🏠', 'home') }).addTo(me.map);
    }
    if (loc) {
      if (!me.mk.c) me.mk.c = Lf.marker([loc.lat, loc.lng], { icon: UZ.pin(Lf, '🛵', 'pulse'), zIndexOffset: 1000 }).addTo(me.map);
      else me.mk.c.setLatLng([loc.lat, loc.lng]);
      if (dest) {
        if (!me.line) me.line = Lf.polyline([[loc.lat, loc.lng], [dest.lat, dest.lng]], { color: '#ffa62b', weight: 4, dashArray: '8 10', opacity: .9 }).addTo(me.map);
        else me.line.setLatLngs([[loc.lat, loc.lng], [dest.lat, dest.lng]]);
        if (!me.fitted) { me.map.fitBounds(Lf.latLngBounds([[loc.lat, loc.lng], [dest.lat, dest.lng]]).pad(0.35)); me.fitted = true; }
        else if (!me.map.getBounds().pad(-0.1).contains([loc.lat, loc.lng])) me.map.panTo([loc.lat, loc.lng]);
      } else me.map.panTo([loc.lat, loc.lng]);
    }
  } catch (e) { if (!me.map) document.getElementById('tMap').innerHTML = `<div class="hint" style="padding:20px">${t('eNet')}</div>`; }
}

/* Faol buyurtma tugmasi (sarlavhada) */
function updateActive(o) {
  const b = document.getElementById('activeBtn');
  if (!b) return;
  const a = store.get('active', null);
  if (o && a && o.id === a.id && (o.status === 'delivered' || o.status === 'cancelled')) { store.set('active', null); b.hidden = true; return; }
  b.hidden = !a;
  if (a) b.textContent = `${o && o.id === a.id ? UZ.STATUS[UZ.statusKey(o.status, o.mode)].e : '📦'} ${t('myOrder')}${o && o.id === a.id ? ' #' + o.no : ''}`;
}

/* ---------- Demo rejim (server yo'q bo'lsa) ---------- */
function demoCreate(b) {
  const list = store.get('demo_orders', []);
  const dest = b.lat != null ? { lat: b.lat, lng: b.lng } : { lat: UZ.CENTER.lat + 0.012, lng: UZ.CENTER.lng + 0.018 };
  const o = { id: 'd' + Date.now().toString(36), token: '', no: 1000 + list.length + 1, mode: b.mode, status: 'new', history: { new: Date.now() }, items: b.items, total: b.total, branch: b.branch, dest: b.mode === 'd' ? dest : null, courier: null, loc: null, createdAt: Date.now(), phone: ME.phone };
  list.unshift(o); store.set('demo_orders', list.slice(0, 20));
  return o;
}
const demoGet = id => store.get('demo_orders', []).find(o => o.id === id);
function demoTick(o) {
  // Oshxona va kuryer harakatini taqlid qiladi
  const s = (Date.now() - o.createdAt) / 1000;
  const plan = o.mode === 'd' ? [['accepted', 4], ['cooking', 8], ['ready', 14], ['onway', 18], ['delivered', 58]] : [['accepted', 4], ['cooking', 8], ['ready', 16], ['delivered', 30]];
  for (const [st, at] of plan) if (s >= at && !o.history[st]) { o.history[st] = o.createdAt + at * 1000; o.status = st; }
  if (o.mode === 'd' && o.history.onway) {
    o.courier = { name: 'Sardor', phone: '+998 90 123 45 67' };
    const shop = UZ.BRANCHES[o.branch || 0], d = o.dest;
    const k = Math.min(1, (s - 18) / 40);
    const ease = k < 1 ? k : 1;
    const wob = Math.sin(ease * Math.PI) * 0.004;
    o.loc = { lat: shop.lat + (d.lat - shop.lat) * ease + wob, lng: shop.lng + (d.lng - shop.lng) * ease - wob, at: Date.now(), speed: 7 };
  }
  const list = store.get('demo_orders', []).map(x => (x.id === o.id ? o : x));
  store.set('demo_orders', list);
  return o;
}

/* ---------- Ishga tushirish ---------- */
(async () => {
  LIVE = await UZ.isLive;
  await loadMe();
  const a = store.get('active', null);
  if (a) {
    updateActive();
    if (LIVE) { try { const o = await UZ.api(`orders/${a.id}?t=${encodeURIComponent(a.token || '')}`); updateActive(o); } catch (e) { store.set('active', null); updateActive(); } }
  }
  document.getElementById('userBtn').onclick = openProfile;
  document.getElementById('tProfile').onclick = openProfile;
  document.getElementById('activeBtn').onclick = () => { const x = store.get('active', null); if (x) openTrack(x); };
  const _renderAll = renderAll;
  renderAll = function () { _renderAll(); updateUserUi(); updateActive(TRK && TRK.last); }; // eslint-disable-line no-global-assign
})();
document.head.insertAdjacentHTML('beforeend','<style>.lbl{font-weight:800;font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em}@media (max-width:640px){#activeBtn{display:inline-flex;height:38px;padding:0 12px;font-size:12px}#activeBtn[hidden]{display:none}}</style>');
