/* Uzbegim — mijoz, oshxona va kuryer sahifalari uchun umumiy yordamchilar */
(function () {
  const U = (window.UZB = window.UZB || {});

  // Holatlar: mijozga ko'rinadigan nomlar
  U.STATUS = {
    new:       { e: '🕓', uz: 'Oshxona tasdiqlashini kutmoqda', ru: 'Ждёт подтверждения кухни', s: { uz: 'Yangi', ru: 'Новый' } },
    accepted:  { e: '✅', uz: 'Qabul qilindi', ru: 'Принят', s: { uz: 'Qabul qilindi', ru: 'Принят' } },
    cooking:   { e: '👨‍🍳', uz: 'Oshpaz tayyorlamoqda', ru: 'Повар готовит', s: { uz: 'Tayyorlanmoqda', ru: 'Готовится' } },
    ready:     { e: '📦', uz: 'Tayyor! Kuryer olib ketmoqda', ru: 'Готов! Курьер забирает', s: { uz: 'Tayyor', ru: 'Готов' } },
    readyP:    { e: '🛍️', uz: 'Tayyor! Olib ketishingiz mumkin', ru: 'Готов! Можно забирать', s: { uz: 'Tayyor', ru: 'Готов' } },
    onway:     { e: '🛵', uz: 'Kuryer yo\'lda', ru: 'Курьер в пути', s: { uz: 'Yo\'lda', ru: 'В пути' } },
    delivered: { e: '🎉', uz: 'Yetkazildi — osh bo\'lsin!', ru: 'Доставлен — приятного аппетита!', s: { uz: 'Yetkazildi', ru: 'Доставлен' } },
    deliveredP:{ e: '🎉', uz: 'Berildi — osh bo\'lsin!', ru: 'Выдан — приятного аппетита!', s: { uz: 'Berildi', ru: 'Выдан' } },
    cancelled: { e: '✖️', uz: 'Bekor qilindi', ru: 'Отменён', s: { uz: 'Bekor', ru: 'Отменён' } },
  };
  U.FLOW = { d: ['new', 'accepted', 'cooking', 'ready', 'onway', 'delivered'], p: ['new', 'accepted', 'cooking', 'ready', 'delivered'] };
  U.statusKey = (st, mode) => (mode === 'p' && (st === 'ready' || st === 'delivered') ? st + 'P' : st);

  U.BRANCHES = [
    { uz: 'Amir Temur', ru: 'Амир Темур', lat: 41.3111, lng: 69.2797 },
    { uz: 'Chilonzor', ru: 'Чиланзар', lat: 41.2756, lng: 69.2034 },
    { uz: 'Yunusobod', ru: 'Юнусабад', lat: 41.3640, lng: 69.2870 },
    { uz: 'Samarqand Darvoza', ru: 'Самарканд Дарвоза', lat: 41.3165, lng: 69.2290 },
    { uz: 'Sergeli', ru: 'Сергели', lat: 41.2290, lng: 69.2200 },
    { uz: 'Samarqand', ru: 'Самарканд', lat: 39.6547, lng: 66.9758 },
  ];
  U.CENTER = { lat: 41.2995, lng: 69.2401 }; // Toshkent

  // API: sahifa qaysi papkada bo'lsa ham ishlaydi
  U.api = async function (path, opt = {}) {
    const h = { 'Content-Type': 'application/json', ...(opt.headers || {}) };
    const tok = U.token();
    if (tok && !h.Authorization) h.Authorization = 'Bearer ' + tok;
    if (opt.pin) h['X-Pin'] = opt.pin;
    const r = await fetch('api/' + path, { method: opt.method || (opt.body ? 'POST' : 'GET'), headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) { const err = new Error((data && data.error) || 'http ' + r.status); err.status = r.status; throw err; }
    return data;
  };
  U.token = () => { try { return localStorage.getItem('uzb_token') || ''; } catch (e) { return ''; } };
  U.setToken = t => { try { t ? localStorage.setItem('uzb_token', t) : localStorage.removeItem('uzb_token'); } catch (e) {} };
  U.isLive = (async () => {
    if (!location.protocol.startsWith('http')) return false;
    try { await U.api('ping'); return true; } catch (e) { return false; }
  })();

  // Masofa (metr) va formatlash
  U.dist = (a, b) => {
    const R = 6371e3, r = x => (x * Math.PI) / 180;
    const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  U.fmtDist = (m, L) => (m < 1000 ? Math.round(m / 10) * 10 + (L === 'ru' ? ' м' : ' m') : (m / 1000).toFixed(1) + (L === 'ru' ? ' км' : ' km'));
  // Shahar ichida o'rtacha 22 km/soat; kuryer tezligi ma'lum bo'lsa o'shani olamiz
  U.etaMin = (m, speed) => Math.max(1, Math.round(m / ((speed && speed > 2 ? speed : 6.1) * 60)));
  U.ago = (ts, L) => {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return L === 'ru' ? s + ' сек назад' : s + ' soniya oldin';
    return L === 'ru' ? Math.round(s / 60) + ' мин назад' : Math.round(s / 60) + ' daqiqa oldin';
  };
  U.time = ts => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  U.money = n => (n || 0).toLocaleString('ru-RU').replace(/[ ,]/g, ' ');
  U.navLink = p => `https://yandex.uz/maps/?rtext=~${p.lat},${p.lng}&rtt=auto`;

  // Leaflet xaritasini kerak bo'lganda yuklash
  let leafletP;
  U.leaflet = function () {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (leafletP) return leafletP;
    leafletP = new Promise((ok, bad) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      js.onload = () => ok(window.L);
      js.onerror = () => { leafletP = null; bad(new Error('map')); };
      document.head.appendChild(js);
    });
    return leafletP;
  };
  U.makeMap = async function (el, center, zoom = 13) {
    const L = await U.leaflet();
    const m = L.map(el, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    setTimeout(() => m.invalidateSize(), 250);
    return m;
  };

  // Xarita belgilari uchun stil (barcha sahifalar)
  const st = document.createElement('style');
  st.textContent = `.uzb-pin{background:none;border:0}.uzb-pin span{display:grid;place-items:center;width:44px;height:44px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:linear-gradient(135deg,#ffb547,#ff6a00);box-shadow:0 6px 16px rgba(0,0,0,.45);border:3px solid #fff}
  .uzb-pin.home span{background:linear-gradient(135deg,#1fb6c1,#127a83)}
  .uzb-pin.shop span{background:#1d140d}
  .uzb-pin i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:22px;transform:none}
  .leaflet-container{background:#1b1510;font-family:inherit;border-radius:20px}
  .uzb-pulse{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px;border-radius:50%;background:rgba(255,122,0,.25);animation:uzbp 1.6s infinite}
  @keyframes uzbp{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}`;
  document.head.appendChild(st);
  // Xarita belgisi: tomchi shakli, ichida emoji
  U.pin = (L, emoji, cls = '') => L.divIcon({ className: 'uzb-pin ' + cls, html: `<div style="position:relative;width:44px;height:44px">${cls.includes('pulse') ? '<b class="uzb-pulse"></b>' : ''}<span></span><i>${emoji}</i></div>`, iconSize: [44, 44], iconAnchor: [22, 44] });
})();
