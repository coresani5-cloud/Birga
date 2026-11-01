// Kotib — bo'sh vaqtlarni hisoblash.
// Kun 5 daqiqalik kataklarga bo'linadi: ish vaqti, tanaffus, yopiq kunlar va mavjud buyurtmalar hisobga olinadi.
const CELL = 5;
const TZ = process.env.TZ_NAME || 'Asia/Tashkent';

const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

const toMin = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const toHM = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
const isTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t || ''));

function weekday(date) { return new Date(date + 'T12:00:00Z').getUTCDay(); }
function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// Biznes joylashgan vaqt mintaqasidagi bugungi sana va hozirgi daqiqa
function now() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
function human(date) {
  const [, m, d] = date.split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}, ${WEEKDAYS[weekday(date)]}`;
}

function dayHours(st, date) {
  if ((st.closedDays || []).includes(date)) return null;
  const h = st.hours?.[weekday(date)];
  if (!h || h.off) return null;
  return h;
}

function active(b) { return b.status !== 'cancelled'; }

// Har bir katak: -1 = yopiq, aks holda shu paytdagi band joylar soni
function cells(st, date, ignoreId) {
  const n = 1440 / CELL;
  const arr = new Array(n).fill(-1);
  const h = dayHours(st, date);
  if (!h) return arr;
  for (let i = Math.floor(toMin(h.open) / CELL); i < Math.ceil(toMin(h.close) / CELL) && i < n; i++) arr[i] = 0;
  for (const br of h.breaks || []) {
    for (let i = Math.floor(toMin(br.from) / CELL); i < Math.ceil(toMin(br.to) / CELL) && i < n; i++) arr[i] = -1;
  }
  const t = now();
  if (date < t.date) arr.fill(-1);
  else if (date === t.date) for (let i = 0; i < Math.ceil(t.min / CELL) && i < n; i++) arr[i] = -1;
  const buf = Number(st.business?.bufferMin) || 0;
  for (const b of st.bookings || []) {
    if (b.date !== date || !active(b) || b.id === ignoreId) continue;
    const s = toMin(b.start), e = toMin(b.end) + buf;
    for (let i = Math.floor(s / CELL); i < Math.ceil(e / CELL) && i < n; i++) if (arr[i] >= 0) arr[i]++;
  }
  return arr;
}

const cap = (st) => Math.max(1, Number(st.business?.capacity) || 1);

// Bo'sh oraliqlar: [[boshlanish, tugash], ...] daqiqalarda
function freeRanges(st, date) {
  const arr = cells(st, date), c = cap(st), out = [];
  let s = -1;
  for (let i = 0; i <= arr.length; i++) {
    const free = i < arr.length && arr[i] >= 0 && arr[i] < c;
    if (free && s < 0) s = i;
    if (!free && s >= 0) { out.push([s * CELL, i * CELL]); s = -1; }
  }
  return out;
}

// Ma'lum davomiylikdagi xizmat boshlanishi mumkin bo'lgan vaqtlar
function freeStarts(st, date, duration) {
  const arr = cells(st, date), c = cap(st);
  const step = Math.max(5, Number(st.business?.slotStep) || 30);
  const need = Math.ceil((Number(duration) || 30) / CELL);
  const out = [];
  for (let m = 0; m + need * CELL <= 1440; m += step) {
    const i0 = m / CELL;
    if (!Number.isInteger(i0)) continue;
    let ok = true;
    for (let i = i0; i < i0 + need; i++) if (!(arr[i] >= 0 && arr[i] < c)) { ok = false; break; }
    if (ok) out.push(toHM(m));
  }
  return out;
}

// Vaqt bo'shligini tekshirish. Xato bo'lsa — sababini qaytaradi.
function check(st, date, start, duration, ignoreId) {
  if (!isDate(date)) return "Sana noto'g'ri";
  if (!isTime(start)) return "Vaqt noto'g'ri";
  const t = now();
  if (date < t.date || (date === t.date && toMin(start) < t.min)) return "Bu vaqt o'tib ketgan";
  if (!dayHours(st, date)) return `${human(date)} — dam olish kuni`;
  const arr = cells(st, date, ignoreId), c = cap(st);
  const s = toMin(start), e = s + (Number(duration) || 30);
  if (e > 1440) return "Vaqt noto'g'ri";
  for (let i = Math.floor(s / CELL); i < Math.ceil(e / CELL); i++) {
    if (arr[i] < 0) return `${start} — ish vaqtidan tashqarida`;
    if (arr[i] >= c) return `${start} band`;
  }
  return null;
}

const fmtRanges = (r) => r.map(([s, e]) => `${toHM(s)}–${toHM(e)}`).join(', ');

module.exports = { TZ, WEEKDAYS, MONTHS, toMin, toHM, isDate, isTime, weekday, addDays, now, human, dayHours, freeRanges, freeStarts, check, fmtRanges };
