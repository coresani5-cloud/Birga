/* Qaydla — ovozli yon daftarcha (uz/ru) */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- Settings ---------------- */
const DEF = { name: '', lang: 'uz', maxMin: 10, goal: 300, stamp: true, punct: true, audio: false, apos: true, theme: 'dark', lockAfter: 0 };
let S = { ...DEF };
try { S = { ...DEF, ...JSON.parse(localStorage.getItem('qaydla.settings') || '{}') }; } catch {}
const saveS = () => { try { localStorage.setItem('qaydla.settings', JSON.stringify(S)); } catch {} };

/* ---------------- Storage (IndexedDB) ---------------- */
let db;
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('qaydla', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('notes', { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('notes', mode); const st = t.objectStore('notes');
  const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
});
let NOTES = [];
const loadAll = async () => { NOTES = await tx('readonly', s => s.getAll()); };
const put = n => tx('readwrite', s => s.put(n));
const del = id => tx('readwrite', s => s.delete(id));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------------- Date helpers ---------------- */
const MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
const MON_S = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
const DAYS = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const DAYS_S = ['Ya','Du','Se','Ch','Pa','Ju','Sh'];
const p2 = n => String(n).padStart(2, '0');
const hm = d => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
const dayKey = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const fullDate = d => `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
const stampFull = d => `${fullDate(d)}, ${DAYS[d.getDay()].toLowerCase()} · ${hm(d)}`;
const shortDate = d => {
  const now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return `Bugun, ${hm(d)}`;
  if (dayKey(d) === dayKey(y)) return `Kecha, ${hm(d)}`;
  return `${d.getDate()} ${MON_S[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : ''}, ${hm(d)}`;
};
const words = t => (t.trim().match(/[\p{L}\p{N}ʻʼ'’-]+/gu) || []).length;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- Text processing ---------------- */
const CMDS = [
  // order matters: longer phrases first
  [/(^|\s)(yangi xatboshi|yangi abzas|новый абзац)(?=\s|$)/giu, '\n\n'],
  [/(^|\s)(yangi qator|новая строка|с новой строки)(?=\s|$)/giu, '\n'],
  [/(^|\s)(so['ʻ’`]?roq belgisi|вопросительный знак)(?=\s|$)/giu, '?'],
  [/(^|\s)(undov belgisi|восклицательный знак)(?=\s|$)/giu, '!'],
  [/(^|\s)(ikki nuqta|двоеточие)(?=\s|$)/giu, ':'],
  [/(^|\s)(nuqtali vergul|точка с запятой)(?=\s|$)/giu, ';'],
  [/(^|\s)(nuqta|точка)(?=\s|$)/giu, '.'],
  [/(^|\s)(vergul|запятая)(?=\s|$)/giu, ','],
  [/(^|\s)(tire|тире)(?=\s|$)/giu, ' —'],
  [/(^|\s)(qavs och|открыть скобку)(?=\s|$)/giu, ' ('],
  [/(^|\s)(qavs yop|закрыть скобку)(?=\s|$)/giu, ')'],
];
function applyCommands(t) {
  for (const [re, rep] of CMDS) t = t.replace(re, (m, sp) => (rep.startsWith(' ') || rep.startsWith('\n') ? '' : '') + rep);
  return t;
}
function normUz(t) {
  if (!S.apos) return t.replace(/([oOgG])[ʻ‘’`´]/g, "$1'");
  // o' g' → oʻ gʻ ; tutuq belgisi → ʼ
  t = t.replace(/([oOgG])['‘’`´ʼ]/g, '$1ʻ');
  t = t.replace(/(\p{L})['’`´](\p{L})/gu, '$1ʼ$2');
  return t;
}
function tidy(t) {
  return t
    .replace(/[ \t]+([.,!?;:)])/g, '$1')
    .replace(/\( +/g, '(')
    .replace(/([.,!?;:])(?=[\p{L}\p{N}])/gu, '$1 ')
    .replace(/ *\n */g, '\n')
    .replace(/[ \t]{2,}/g, ' ');
}
const capFirst = s => s.replace(/^(\s*)(\p{Ll})/u, (m, a, b) => a + b.toLocaleUpperCase());
/** Turn a final recognition chunk into clean text, given what precedes it. */
function processChunk(raw, before, lang) {
  let t = raw.trim();
  if (!t) return '';
  t = applyCommands(t);
  if (lang === 'uz') t = normUz(t);
  t = tidy(t).trim();
  if (S.punct) {
    const prev = before.replace(/\s+$/, '');
    const startSentence = !prev || /[.!?…:\n]$/.test(prev) || /\n$/.test(before);
    if (startSentence) t = capFirst(t);
    t = t.replace(/([.!?]\s+|\n)(\p{Ll})/gu, (m, a, b) => a + b.toLocaleUpperCase());
    if (!/[.!?…:;,\n—(]$/.test(t)) t += '.';
  }
  return t;
}
function joinText(before, chunk) {
  if (!chunk) return before;
  if (!before) return chunk.replace(/^\s+/, '');
  if (/^[.,!?;:)]/.test(chunk)) return before.replace(/[.]$/, '') + chunk;
  if (/^\n/.test(chunk) || /\n$/.test(before)) return before + chunk;
  return before + ' ' + chunk;
}

/* ---------------- Speech engine ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const isAndroid = /Android/i.test(navigator.userAgent);
const Rec = {
  on: false, rec: null, lang: S.lang, started: 0, timer: null, target: null,
  stream: null, mr: null, chunks: [], analyser: null, actx: null, raf: 0,
  lastFinal: '',
  running: false, endedAt: 0, pending: '', wake: null, endWaiters: [], warned: false,
  maxSec() { return Math.max(1, +S.maxMin || 10) * 60; },
  async start(target) {
    if (!SR) { toast('Bu brauzer ovozni tanimaydi. Chrome yoki Edge’da oching.'); return; }
    if (this.on) return;
    this.target = target; this.on = true; this.started = Date.now(); this.lastFinal = ''; this.pending = ''; this.warned = false;
    target.onStart?.();
    this.makeRec();                     // darhol tinglay boshlaymiz
    this.tick(); this.timer = setInterval(() => this.tick(), 500);
    setUiRec(true);
    this.keepAwake();
    if (S.audio) this.startAudio();
  },
  /* Ekran o'chib qolmasin — aks holda telefon yozishni to'xtatadi */
  async keepAwake() {
    try { if ('wakeLock' in navigator && !this.wake) { this.wake = await navigator.wakeLock.request('screen'); this.wake.addEventListener?.('release', () => { this.wake = null; }); } } catch {}
  },
  releaseAwake() { try { this.wake?.release(); } catch {} this.wake = null; },
  /* Tugallanmagan (interim) so'zlarni yo'qotmaslik uchun matnga o'tkazamiz */
  flushPending() {
    const t = this.pending.trim(); this.pending = '';
    if (t && this.target) { this.lastFinal = t; this.target.onFinal(t, this.lang); }
    this.target?.onInterim('');
  },
  makeRec() {
    const r = new SR();
    r.lang = this.lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    r.interimResults = true; r.maxAlternatives = 1;
    r.continuous = !isAndroid; // Android'da continuous rejimi so'zlarni takrorlaydi — tez qayta ishga tushiramiz
    r.onstart = () => { this.running = true; };
    r.onresult = e => {
      if (this.rec !== r) return;
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i], txt = res[0].transcript;
        if (res.isFinal) {
          let t = txt.trim();
          if (isAndroid && this.lastFinal) {
            if (t === this.lastFinal) continue;                              // takror
            if (t.startsWith(this.lastFinal + ' ')) t = t.slice(this.lastFinal.length).trim(); // jamlangan natija
          }
          if (!t) continue;
          this.lastFinal = txt.trim();
          this.target.onFinal(t, this.lang);
        } else interim += txt;
      }
      this.pending = interim;
      this.target.onInterim(interim);
    };
    r.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('Mikrofonga ruxsat bering (brauzer sozlamalarida).'); this.stop(); }
      else if (e.error === 'language-not-supported') { toast('Bu brauzer tanlangan tilni qo‘llamaydi. Chrome’ni yangilang.'); this.stop(); }
      else if (e.error === 'audio-capture' && this.stream) { toast('Mikrofon band — ovoz saqlash o‘chirildi.'); this.stopAudio(); }
      else if (e.error === 'network') toast('Internet uzildi — qayta ulanmoqda…');
      // 'no-speech', 'aborted' — jimlik; onend da darhol davom ettiramiz
    };
    r.onend = () => {
      if (this.rec !== r) return;
      this.running = false; this.endedAt = Date.now();
      this.flushPending();
      if (this.on) {
        try { r.start(); }                                   // eng tez qayta ishga tushirish
        catch { this.rec = null; setTimeout(() => this.on && !this.rec && this.makeRec(), 150); }
      } else { this.endWaiters.splice(0).forEach(f => f()); }
    };
    this.rec = r;
    try { r.start(); } catch (err) { console.warn(err); }
  },
  async stop(reason) {
    if (!this.on) return;
    this.on = false; clearInterval(this.timer);
    const r = this.rec;
    if (r) {
      // oxirgi so'zlar yetib kelishini kutamiz (ko'pi bilan 1.5 s)
      await new Promise(res => { this.endWaiters.push(res); try { r.stop(); } catch { res(); } setTimeout(res, 1500); });
    }
    this.endWaiters = [];
    if (this.rec === r) this.flushPending();
    this.rec = null; this.running = false;
    this.releaseAwake();
    const blob = await this.stopAudio();
    this.target.onInterim('');
    await this.target.onStop?.(blob, Math.round((Date.now() - this.started) / 1000));
    setUiRec(false);
    if (reason) toast(reason);
  },
  setLang(l) {
    this.lang = l; S.lang = l; saveS(); renderLang();
    if (this.on && this.rec) { const r = this.rec; this.flushPending(); this.rec = null; try { r.abort(); } catch {} this.makeRec(); }
  },
  tick() {
    const el = Math.floor((Date.now() - this.started) / 1000), max = this.maxSec();
    const f = n => `${p2(Math.floor(n / 60))}:${p2(n % 60)}`;
    if (!this.on) { setTimeText('00:00', 0); return; }
    setTimeText(f(el), el / max, f(max));
    // nazoratchi: tanish xizmati o'z-o'zidan to'xtab qolgan bo'lsa — qayta ishga tushiramiz
    if (!this.running && this.endedAt && Date.now() - this.endedAt > 1200) { this.endedAt = 0; const r = this.rec; this.rec = null; try { r?.abort(); } catch {} this.makeRec(); }
    if (!this.warned && max - el <= 30 && max > 60) { this.warned = true; toast('Yozish tugashiga 30 soniya qoldi'); }
    if (el >= max) this.stop(`${Math.round(max / 60)} daqiqalik yozuv saqlandi ✓`);
  },
  async startAudio() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
      this.mr = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
      this.chunks = []; this.mr.ondataavailable = e => e.data.size && this.chunks.push(e.data); this.mr.start(1000);
      this.actx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.actx.createAnalyser(); this.analyser.fftSize = 256;
      this.actx.createMediaStreamSource(this.stream).connect(this.analyser);
    } catch (e) { console.warn(e); this.stream = null; }
  },
  stopAudio() {
    return new Promise(res => {
      const done = () => {
        const blob = this.chunks.length ? new Blob(this.chunks, { type: this.mr?.mimeType || 'audio/webm' }) : null;
        this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.mr = null; this.chunks = [];
        try { this.actx?.close(); } catch {} this.actx = null; this.analyser = null;
        res(blob);
      };
      if (this.mr && this.mr.state !== 'inactive') { this.mr.onstop = done; this.mr.stop(); } else done();
    });
  },
};

/* ---------------- Targets: home quick note & editor ---------------- */
let homeNote = null;
const homeTarget = {
  text: '', interim: '',
  onStart() { this.text = ''; this.interim = ''; homeNote = null; renderLive(); },
  async onFinal(raw, lang) {
    const now = new Date();
    if (!homeNote) homeNote = newNote(lang);
    let before = homeNote.text;
    let pre = '';
    if (S.stamp && !this.text) pre = (before ? '\n' : '') + `[${hm(now)}] `;
    const chunk = processChunk(raw, this.text ? before : '', lang);
    if (!chunk) return;
    homeNote.text = pre ? before + pre + chunk : joinText(before, chunk);
    this.text = joinText(this.text, chunk);
    logSeg(homeNote, chunk, lang);
    await saveNote(homeNote);
    renderLive(); renderHome();
  },
  onInterim(t) { this.interim = t; renderLive(); },
  async onStop(blob, dur) {
    if (homeNote && blob) { addAudio(homeNote, blob, dur); await saveNote(homeNote); }
    if (homeNote) toast('Qayd saqlandi ✓');
    else toast('Hech narsa eshitilmadi');
    renderHome();
  },
};

let cur = null; // note open in editor
const edTarget = {
  first: true,
  onStart() { this.first = true; },
  async onFinal(raw, lang) {
    const body = $('#edBody');
    let before = body.value;
    let pre = '';
    if (S.stamp && this.first) pre = (before.trim() ? (before.endsWith('\n') ? '' : '\n') : '') + `[${hm(new Date())}] `;
    const chunk = processChunk(raw, pre ? '' : before, lang);
    if (!chunk) return;
    body.value = pre ? before + pre + chunk : joinText(before, chunk);
    this.first = false;
    body.scrollTop = body.scrollHeight;
    cur.text = body.value; logSeg(cur, chunk, lang);
    await saveNote(cur); renderEditorMeta();
  },
  onInterim(t) { $('#edInterim').textContent = t; },
  async onStop(blob, dur) {
    if (cur && blob) { addAudio(cur, blob, dur); await saveNote(cur); renderAudios(); }
  },
};

/* ---------------- Notes model ---------------- */
function newNote(lang) {
  const now = Date.now();
  return { id: uid(), title: '', text: '', createdAt: now, updatedAt: now, lang: lang || S.lang, pinned: false, segs: [], audios: [] };
}
function logSeg(n, chunk, lang) {
  n.segs = n.segs || []; n.segs.push({ at: Date.now(), w: words(chunk), lang });
  const c = { uz: 0, ru: 0 }; n.segs.forEach(s => c[s.lang] = (c[s.lang] || 0) + s.w);
  n.lang = c.uz && c.ru ? (c.uz >= c.ru ? 'uz' : 'ru') : (c.ru ? 'ru' : 'uz');
  n.mixed = !!(c.uz && c.ru);
}
function addAudio(n, blob, dur) { n.audios = n.audios || []; n.audios.push({ id: uid(), blob, at: Date.now(), dur }); }
async function saveNote(n) {
  n.updatedAt = Date.now();
  await put(n);
  const i = NOTES.findIndex(x => x.id === n.id);
  if (i < 0) NOTES.push(n); else NOTES[i] = n;
}
const titleOf = n => n.title?.trim() || (n.text.replace(/^\[\d\d:\d\d\]\s*/, '').trim().split(/\n/)[0].slice(0, 60)) || 'Boʻsh qayd';
const sorted = () => [...NOTES].sort((a, b) => b.createdAt - a.createdAt);

/* ---------------- UI: generic ---------------- */
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
let page = 'home';
function go(p, push = true) {
  if (Rec.on && p !== page) Rec.stop();
  page = p;
  $$('.page').forEach(x => x.classList.toggle('active', x.id === 'page-' + p));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.go === p || (p === 'editor' && b.dataset.go === 'notes')));
  if (p === 'home') renderHome();
  if (p === 'notes') renderNotes();
  if (p === 'stats') renderStats();
  if (p === 'calendar') renderCal();
  if (p === 'settings') renderSettings();
  if (push) history.pushState({ p, id: cur?.id }, '', '#' + p);
  window.scrollTo({ top: 0 });
}
window.addEventListener('popstate', e => {
  const p = e.state?.p || 'home';
  if (p === 'editor' && e.state?.id) { const n = NOTES.find(x => x.id === e.state.id); if (n) return openNote(n, false); }
  go(p === 'editor' ? 'notes' : p, false);
});

function setUiRec(on) {
  $('.rec-card').classList.toggle('on', on && Rec.target === homeTarget);
  $('#homeMicLbl').textContent = on && Rec.target === homeTarget ? 'To‘xtatish' : 'Yozish';
  $('#recState').textContent = on && Rec.target === homeTarget ? 'Tinglamoqda…' : 'Tayyor';
  $('#edMic').classList.toggle('on', on && Rec.target === edTarget);
  $('#edState').textContent = on && Rec.target === edTarget ? 'Tinglamoqda…' : 'Tayyor';
  const ls = $('#liveStatus'); ls.textContent = on ? 'Yozilmoqda' : 'Kutmoqda'; ls.classList.toggle('rec', on);
  if (!on) setTimeText('00:00');
}
function setTimeText(t, frac = 0, max = '') {
  $('#recTime').textContent = t; $('#edTime').textContent = t;
  const lim = max ? `/ ${max}` : `${Math.max(1, +S.maxMin || 10)} daq gacha`;
  $('#recLimit').textContent = lim; $('#edLimit').textContent = lim;
  const C = 2 * Math.PI * 68, ring = $('#recRing');
  ring.style.strokeDasharray = C; ring.style.strokeDashoffset = Rec.on ? C * (1 - Math.min(1, Math.max(.01, frac))) : C * .28;
}
function renderLang() {
  const l = Rec.lang;
  $$('#langChip,#edLang').forEach(c => { c.textContent = l.toUpperCase(); c.classList.toggle('ru', l === 'ru'); });
  $('#liveLang').textContent = l === 'ru' ? 'Русский' : 'O‘zbekcha';
  $$('.sc[data-act="uz"],.sc[data-act="ru"]').forEach(b => b.classList.toggle('cur', b.dataset.act === l));
}
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  $('#themeLabel').textContent = S.theme === 'dark' ? 'Yorug‘' : 'Qorong‘i';
  $('meta[name="theme-color"]').content = S.theme === 'dark' ? '#070b18' : '#eef2fb';
}

/* ---------------- Home ---------------- */
function renderClock() {
  const d = new Date(), h = d.getHours();
  $('#clock').textContent = hm(d);
  $('#greet').textContent = (h >= 5 && h < 11 ? 'Xayrli tong' : h < 17 && h >= 11 ? 'Xayrli kun' : h >= 17 && h < 22 ? 'Xayrli kech' : 'Xayrli tun') + ',';
  $('#dateBig').textContent = fullDate(d);
  $('#weekday').textContent = DAYS[d.getDay()];
}
function wordsByDay(n) {
  const map = {};
  NOTES.forEach(x => (x.segs || []).forEach(s => { const k = dayKey(new Date(s.at)); map[k] = (map[k] || 0) + s.w; }));
  // qo'lda yozilgan qaydlar (segs bo'lmasa)
  NOTES.forEach(x => { if (!(x.segs || []).length && x.text) { const k = dayKey(new Date(x.createdAt)); map[k] = (map[k] || 0) + words(x.text); } });
  const out = []; const d = new Date();
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push({ d: x, v: map[dayKey(x)] || 0 }); }
  return out;
}
function wavePath(vals, w, h, pad = 6) {
  const max = Math.max(1, ...vals), step = w / (vals.length - 1);
  const pts = vals.map((v, i) => [i * step, h - pad - (v / max) * (h - pad * 2)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return { d, pts };
}
function renderHome() {
  renderClock();
  const name = S.name.trim() || 'Qaydla';
  $('#heroName').textContent = name; $('#sideName').textContent = name; $('#avatar').textContent = name[0].toUpperCase();
  const today = dayKey(new Date());
  const tNotes = NOTES.filter(n => dayKey(new Date(n.createdAt)) === today).length;
  const tot = NOTES.reduce((a, n) => a + words(n.text), 0);
  $('#todayNotes').textContent = tNotes;
  $('#dateFoot').textContent = `Jami: ${NOTES.length} qayd · ${tot} so‘z`;

  const week = wordsByDay(7);
  const tw = week[6].v, pct = Math.min(100, Math.round(tw / S.goal * 100));
  $('#goalPct').textContent = pct; $('#todayWords').textContent = tw; $('#goalNum').textContent = S.goal;
  $('#goalMsg').textContent = pct >= 100 ? 'Maqsadga yetdingiz! 🎉' : pct >= 60 ? 'Zo‘r natija!' : pct > 0 ? 'Yaxshi boshlanish!' : 'Boshlaymizmi?';
  const C = 2 * Math.PI * 46; const ring = $('#goalRing');
  ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C * (1 - Math.max(pct, 2) / 100);

  // hero wave (14 kun)
  const two = wordsByDay(14).map(x => x.v), deco = [3, 5, 4, 7, 6, 9, 7, 11, 9, 13, 10, 9, 12, 8];
  const mx = Math.max(1, ...two); const vals = two.filter(v => v).length >= 4 ? two : deco.map((v, i) => v / 13 * mx * .6 + two[i] * .4);
  const { d, pts } = wavePath(vals, 300, 70);
  $('#heroLine').setAttribute('d', d); $('#heroFill').setAttribute('d', d + ' L300,70 L0,70 Z');
  $('#heroDots').innerHTML = pts.filter((_, i) => i % 2 === 1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#a9c1ff"/>`).join('');

  // recent
  const rec = sorted().slice(0, 4);
  $('#recentList').innerHTML = rec.length ? rec.map(n => {
    const done = dayKey(new Date(n.createdAt)) !== today;
    return `<li data-id="${n.id}"><span class="chk ${done ? 'done' : ''}"></span><span class="t">${esc(titleOf(n))}</span><span class="s ${n.lang}">${shortDate(new Date(n.createdAt)).replace(/^Bugun, /, '')}</span><button class="copy-mini" data-copy="${n.id}" title="Nusxalash" aria-label="Nusxalash">${COPY_ICO}</button></li>`;
  }).join('') : '<li class="empty">Hali qayd yo‘q. Mikrofonni bosing!</li>';

  // bars
  const max = Math.max(1, ...week.map(x => x.v));
  const best = week.reduce((a, b, i) => b.v > week[a].v ? i : a, 6);
  $('#weekBars').innerHTML = week.map((x, i) => `<div class="bar ${i === 6 ? 'today' : ''}"><div class="track"><div class="fill" style="height:${Math.max(3, x.v / max * 100)}%"></div>${i === best && x.v ? `<span class="tip">${x.v} so‘z</span>` : ''}</div><span class="lbl">${DAYS_S[x.d.getDay()]}</span></div>`).join('');

  // pinned (or latest)
  let pin = sorted().filter(n => n.pinned).slice(0, 3);
  if (!pin.length) pin = sorted().slice(0, 3);
  $('#pinnedList').innerHTML = pin.length ? pin.map(n => { const d = new Date(n.createdAt);
    return `<li data-id="${n.id}"><div class="ev-date"><b>${d.getDate()}</b><span>${MON_S[d.getMonth()]}</span></div><div class="ev-body"><div class="t">${esc(titleOf(n))}</div><div class="s">${hm(d)} · ${words(n.text)} so‘z</div></div><button class="copy-mini" data-copy="${n.id}" title="Nusxalash" aria-label="Nusxalash">${COPY_ICO}</button></li>`; }).join('')
    : '<li class="empty">Qaydni ⭐ mixlasangiz shu yerda turadi.</li>';
  renderSys();
}
async function renderSys() {
  let used = 0, quota = 0;
  try { const e = await navigator.storage?.estimate?.(); used = e?.usage || 0; quota = e?.quota || 0; } catch {}
  const sp = quota ? Math.max(1, Math.round(used / quota * 100)) : 0;
  $('#barStore').style.width = sp + '%'; $('#valStore').textContent = used ? (used / 1048576).toFixed(1) + 'MB' : '—';
  let mic = SR ? 100 : 0;
  try { const p = await navigator.permissions?.query({ name: 'microphone' }); if (p?.state === 'denied') mic = 10; else if (p?.state === 'prompt') mic = 60; } catch {}
  $('#barMic').style.width = mic + '%'; $('#valMic').textContent = !SR ? 'Yo‘q' : mic === 10 ? 'Taqiq' : mic === 60 ? 'So‘raydi' : 'Tayyor';
  const net = navigator.onLine ? 100 : 0;
  $('#barNet').style.width = net + '%'; $('#valNet').textContent = navigator.onLine ? 'Bor' : 'Yo‘q';
  const score = Math.round(((SR ? 1 : 0) * 50 + (navigator.onLine ? 1 : 0) * 30 + (mic > 10 ? 20 : 0)));
  $('#sysPct').textContent = score + '%'; $('#sysLbl').textContent = score >= 90 ? 'A’lo' : score >= 50 ? 'Qisman' : 'Cheklangan';
  const C = 2 * Math.PI * 44; const r = $('#sysRing'); r.style.strokeDasharray = C; r.style.strokeDashoffset = C * (1 - score / 100);
}
function renderLive() {
  const el = $('#liveText'); const t = homeTarget;
  if (!t.text && !t.interim) {
    el.innerHTML = Rec.on && Rec.target === homeTarget ? '<span class="placeholder">Gapiring, tinglayapman…</span>'
      : '<span class="placeholder">Mikrofonni bosing va gapiring. Aytganlaringiz shu yerda paydo bo‘ladi va avtomatik qayd sifatida saqlanadi.</span>';
    return;
  }
  el.innerHTML = esc(t.text) + (t.interim ? ` <span class="int">${esc(t.interim)}</span>` : '');
  el.scrollTop = el.scrollHeight;
}

/* animated wave (live audio level when available) */
let phase = 0;
function animWave() {
  phase += Rec.on ? 0.12 : 0.03;
  let amp = Rec.on ? 12 : 6;
  if (Rec.analyser) { const a = new Uint8Array(Rec.analyser.frequencyBinCount); Rec.analyser.getByteFrequencyData(a); amp = 4 + a.reduce((x, y) => x + y, 0) / a.length / 3; }
  const mk = (ph, k) => { let d = ''; for (let x = 0; x <= 300; x += 6) { const env = Math.sin(Math.PI * x / 300); const y = 30 + Math.sin(x / 26 + ph) * amp * k * env + Math.sin(x / 11 - ph * 1.6) * amp * .25 * env; d += (x ? ' L' : 'M') + x + ',' + y.toFixed(1); } return d; };
  if (page === 'home') { $('#moodWave').setAttribute('d', mk(phase, 1)); $('#moodWave2').setAttribute('d', mk(phase + 1.4, .6)); }
  requestAnimationFrame(animWave);
}

/* ---------------- Notes list ---------------- */
let filter = 'all';
function highlight(text, q) {
  if (!q) return esc(text);
  const i = text.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()); if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}
function noteCard(n, q = '') {
  const d = new Date(n.createdAt);
  let body = n.text;
  if (q) { const i = body.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()); if (i > 60) body = '…' + body.slice(i - 40); }
  return `<article class="card note" data-id="${n.id}">
    <div class="note-top"><span class="note-date">${stampShort(d)}</span>${n.pinned ? '<span class="pin-mark">★</span>' : ''}</div>
    <div class="note-title">${highlight(titleOf(n), q)}</div>
    <div class="note-body">${highlight(body.slice(0, 400), q) || '<i>Boʻsh</i>'}</div>
    <div class="note-foot"><span class="tag ${n.lang}">${n.mixed ? 'UZ+RU' : n.lang.toUpperCase()}</span><span>${words(n.text)} so‘z</span>${n.audios?.length ? `<span>🎙 ${n.audios.length}</span>` : ''}<button class="copy-btn" data-copy="${n.id}" title="Matnni nusxalash" aria-label="Matnni nusxalash">${COPY_ICO}<span>Nusxa</span></button></div>
  </article>`;
}
const COPY_ICO = '<svg viewBox="0 0 24 24" class="stroke"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';
async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch {}
  }
  toast(ok ? 'Matn nusxalandi ✓' : 'Nusxa olib boʻlmadi');
  if (ok && btn) { btn.classList.add('done'); setTimeout(() => btn.classList.remove('done'), 1400); }
}
const noteText = n => (n.title?.trim() ? n.title.trim() + '\n' : '') + n.text;
const stampShort = d => `${d.getDate()} ${MON_S[d.getMonth()]} ${d.getFullYear()} · ${hm(d)}`;
function renderNotes() {
  const q = $('#searchInput').value.trim();
  const today = dayKey(new Date());
  let list = sorted().sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));
  if (filter === 'today') list = list.filter(n => dayKey(new Date(n.createdAt)) === today);
  if (filter === 'pinned') list = list.filter(n => n.pinned);
  if (filter === 'uz' || filter === 'ru') list = list.filter(n => n.lang === filter || n.mixed);
  if (q) { const ql = q.toLocaleLowerCase(); list = list.filter(n => (n.title + ' ' + n.text).toLocaleLowerCase().includes(ql)); }
  $('#notesGrid').innerHTML = list.length ? list.map(n => noteCard(n, q)).join('') : `<div class="empty">${q ? 'Hech narsa topilmadi.' : 'Qaydlar yoʻq. “+ Yangi qayd” ni bosing.'}</div>`;
}

/* ---------------- Editor ---------------- */
function openNote(n, push = true) {
  cur = n;
  $('#edTitle').value = n.title || ''; $('#edBody').value = n.text || ''; $('#edInterim').textContent = '';
  renderEditorMeta(); renderAudios();
  go('editor', push);
}
function renderEditorMeta() {
  if (!cur) return;
  $('#edDate').textContent = stampFull(new Date(cur.createdAt));
  $('#edUpdated').textContent = `Tahrir: ${shortDate(new Date(cur.updatedAt))} · ${words(cur.text)} so‘z`;
  $('#edPin').classList.toggle('on', !!cur.pinned);
}
const urls = [];
function renderAudios() {
  urls.splice(0).forEach(u => URL.revokeObjectURL(u));
  const a = cur?.audios || [];
  $('#edAudios').innerHTML = a.map((x, i) => { const u = URL.createObjectURL(x.blob); urls.push(u);
    return `<div class="audio-row"><span>🎙 ${hm(new Date(x.at))}</span><audio controls preload="none" src="${u}"></audio><button class="icon-btn danger" data-del-audio="${i}" aria-label="Ovozni o'chirish">×</button></div>`; }).join('');
}
let saveT;
function edChanged() {
  if (!cur) return;
  cur.title = $('#edTitle').value; cur.text = $('#edBody').value;
  clearTimeout(saveT); saveT = setTimeout(async () => { await saveNote(cur); renderEditorMeta(); }, 400);
}
async function closeEditor() {
  if (Rec.on) await Rec.stop();
  if (cur) { clearTimeout(saveT); cur.title = $('#edTitle').value; cur.text = $('#edBody').value;
    if (!cur.text.trim() && !cur.title.trim() && !cur.audios?.length) { await del(cur.id); NOTES = NOTES.filter(x => x.id !== cur.id); }
    else await saveNote(cur); }
  cur = null;
}

/* ---------------- Stats ---------------- */
function renderStats() {
  $('#stTotal').textContent = NOTES.length;
  $('#stWords').textContent = NOTES.reduce((a, n) => a + words(n.text), 0);
  $('#stLangs').textContent = `${NOTES.filter(n => n.lang === 'uz').length} / ${NOTES.filter(n => n.lang === 'ru').length}`;
  $('#stAudio').textContent = NOTES.reduce((a, n) => a + (n.audios?.length || 0), 0);
  const m = wordsByDay(30), max = Math.max(1, ...m.map(x => x.v));
  $('#monthBars').innerHTML = m.map((x, i) => `<div class="bar ${i === 29 ? 'today' : ''}" title="${x.d.getDate()} ${MON_S[x.d.getMonth()]}: ${x.v} so‘z"><div class="track"><div class="fill" style="height:${Math.max(3, x.v / max * 100)}%"></div></div><span class="lbl">${i % 5 === 4 || i === 29 ? x.d.getDate() : ''}</span></div>`).join('');
}

/* ---------------- Calendar ---------------- */
let calM = new Date(); calM.setDate(1); let calSel = dayKey(new Date());
function renderCal() {
  const y = calM.getFullYear(), m = calM.getMonth();
  $('#calTitle').textContent = `${MONTHS[m][0].toUpperCase() + MONTHS[m].slice(1)} ${y}`;
  const byDay = {}; NOTES.forEach(n => { const k = dayKey(new Date(n.createdAt)); byDay[k] = (byDay[k] || 0) + 1; });
  const first = new Date(y, m, 1), off = (first.getDay() + 6) % 7, start = new Date(y, m, 1 - off);
  const today = dayKey(new Date()); let h = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = dayKey(d), c = byDay[k] || 0;
    h += `<button class="cal-day ${d.getMonth() !== m ? 'other' : ''} ${k === today ? 'today' : ''} ${k === calSel ? 'sel' : ''}" data-day="${k}">${d.getDate()}<span class="dots">${'<i></i>'.repeat(Math.min(c, 3))}</span></button>`;
  }
  $('#calGrid').innerHTML = h;
  const [yy, mm, dd] = calSel.split('-').map(Number); const sd = new Date(yy, mm - 1, dd);
  const list = sorted().filter(n => dayKey(new Date(n.createdAt)) === calSel);
  $('#calDayTitle').textContent = `${fullDate(sd)} — ${list.length} ta qayd`;
  $('#calNotes').innerHTML = list.map(n => noteCard(n)).join('') || '<div class="empty">Bu kunda qayd yoʻq.</div>';
}

/* ---------------- Settings ---------------- */
function renderSettings() {
  const has = Lock.has();
  $('#pinStatus').textContent = has ? 'oʻrnatilgan ✓' : 'oʻrnatilmagan';
  $('#pinSet').textContent = has ? 'Kodni oʻzgartirish' : 'Kod oʻrnatish';
  $('#pinOff').hidden = !has;
  $('#setLockAfter').value = String(S.lockAfter);
  $('#setMax').value = String(S.maxMin);
  $('#setName').value = S.name; $('#setLang').value = Rec.lang; $('#setGoal').value = S.goal;
  $('#setStamp').checked = S.stamp; $('#setPunct').checked = S.punct; $('#setAudio').checked = S.audio; $('#setApos').checked = S.apos;
}
function download(name, data, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportTxt() {
  if (!NOTES.length) return toast('Eksport uchun qayd yoʻq');
  const t = sorted().map(n => `=== ${stampFull(new Date(n.createdAt))} ===\n${n.title ? n.title + '\n' : ''}${n.text}\n`).join('\n');
  download(`qaydla-${dayKey(new Date())}.txt`, t, 'text/plain;charset=utf-8');
}
function exportJson() {
  const data = NOTES.map(({ audios, ...n }) => ({ ...n, audios: (audios || []).length }));
  download(`qaydla-zaxira-${dayKey(new Date())}.json`, JSON.stringify({ app: 'qaydla', v: 1, notes: data }, null, 1), 'application/json');
}
async function importJson(file) {
  try {
    const j = JSON.parse(await file.text()); const arr = Array.isArray(j) ? j : j.notes; let k = 0;
    for (const n of arr || []) { if (!n.id || typeof n.text !== 'string') continue; n.audios = []; await put(n); k++; }
    await loadAll(); toast(`${k} ta qayd tiklandi`); renderHome();
  } catch { toast('Fayl notoʻgʻri'); }
}

/* ---------------- Events ---------------- */
function bind() {
  document.addEventListener('click', async e => {
    const g = e.target.closest('[data-go]'); if (g) { if (page === 'editor') await closeEditor(); go(g.dataset.go); return; }
    const cp = e.target.closest('[data-copy]'); if (cp) { e.stopPropagation(); const n = NOTES.find(x => x.id === cp.dataset.copy); if (n) copyText(noteText(n), cp); return; }
    const lc = e.target.closest('#liveCopy'); if (lc) { const t = homeNote ? homeNote.text : homeTarget.text; if (t.trim()) copyText(t, lc); else toast('Hali matn yoʻq'); return; }
    const card = e.target.closest('[data-id]'); if (card) { const n = NOTES.find(x => x.id === card.dataset.id); if (n) { if (Rec.on) await Rec.stop(); openNote(n); } return; }
    const day = e.target.closest('[data-day]'); if (day) { calSel = day.dataset.day; const [y, m] = calSel.split('-').map(Number); calM = new Date(y, m - 1, 1); renderCal(); return; }
    const da = e.target.closest('[data-del-audio]'); if (da && cur) { cur.audios.splice(+da.dataset.delAudio, 1); await saveNote(cur); renderAudios(); return; }
    const sc = e.target.closest('.sc'); if (sc) {
      const a = sc.dataset.act;
      if (a === 'uz' || a === 'ru') { Rec.setLang(a); toast(a === 'uz' ? 'Til: Oʻzbekcha' : 'Язык: Русский'); }
      if (a === 'new') newAndOpen();
      if (a === 'search') { go('notes'); setTimeout(() => $('#searchInput').focus(), 50); }
      if (a === 'calendar') go('calendar');
      if (a === 'export') exportTxt();
    }
  });
  $('#homeMic').onclick = () => Rec.on ? Rec.stop() : Rec.start(homeTarget);
  $('.rec-ring-wrap').onclick = () => Rec.on ? Rec.stop() : Rec.start(homeTarget);
  $('#langChip').onclick = $('#edLang').onclick = () => Rec.setLang(Rec.lang === 'uz' ? 'ru' : 'uz');
  $('#edMic').onclick = () => Rec.on ? Rec.stop() : Rec.start(edTarget);
  $('#newNoteBtn').onclick = $('#notesNew').onclick = newAndOpen;
  $('#themeBtn').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; saveS(); applyTheme(); };
  $('#searchInput').oninput = renderNotes;
  $$('.chip[data-filter]').forEach(c => c.onclick = () => { filter = c.dataset.filter; $$('.chip[data-filter]').forEach(x => x.classList.toggle('active', x === c)); renderNotes(); });
  $('#edTitle').oninput = $('#edBody').oninput = edChanged;
  $('#edBack').onclick = async () => { await closeEditor(); go('notes'); };
  $('#edPin').onclick = async () => { cur.pinned = !cur.pinned; await saveNote(cur); renderEditorMeta(); toast(cur.pinned ? 'Mixlandi ★' : 'Mixdan olindi'); };
  $('#edStamp').onclick = () => { const b = $('#edBody'); const s = `[${stampFull(new Date())}] `; const p = b.selectionStart ?? b.value.length;
    const pre = b.value.slice(0, p); const add = (pre && !pre.endsWith('\n') ? '\n' : '') + s; b.value = pre + add + b.value.slice(p); b.focus(); b.selectionStart = b.selectionEnd = p + add.length; edChanged(); };
  $('#edCopy').onclick = () => copyText(($('#edTitle').value ? $('#edTitle').value + '\n' : '') + $('#edBody').value);
  $('#edCopyBottom').onclick = e => copyText(($('#edTitle').value ? $('#edTitle').value + '\n' : '') + $('#edBody').value, e.currentTarget);
  $('#edShare').onclick = async () => { const text = $('#edBody').value; if (navigator.share) { try { await navigator.share({ title: titleOf(cur), text }); } catch {} } else { await navigator.clipboard?.writeText(text); toast('Matn nusxalandi'); } };
  $('#edDelete').onclick = async () => { if (!confirm('Bu qaydni oʻchirasizmi?')) return; if (Rec.on) await Rec.stop(); await del(cur.id); NOTES = NOTES.filter(x => x.id !== cur.id); cur = null; toast('Oʻchirildi'); go('notes'); };
  $('#calPrev').onclick = () => { calM.setMonth(calM.getMonth() - 1); renderCal(); };
  $('#calNext').onclick = () => { calM.setMonth(calM.getMonth() + 1); renderCal(); };
  $('#setName').oninput = e => { S.name = e.target.value; saveS(); renderHome(); };
  $('#setLang').onchange = e => Rec.setLang(e.target.value);
  $('#setMax').onchange = e => { S.maxMin = +e.target.value || 10; saveS(); setTimeText('00:00'); };
  $('#setGoal').onchange = e => { S.goal = Math.max(50, +e.target.value || 300); saveS(); };
  ['Stamp', 'Punct', 'Audio', 'Apos'].forEach(k => $('#set' + k).onchange = e => { S[k.toLowerCase()] = e.target.checked; saveS(); });
  $('#expTxt').onclick = exportTxt; $('#expJson').onclick = exportJson;
  $('#impJson').onchange = e => e.target.files[0] && importJson(e.target.files[0]);
  $('#wipe').onclick = async () => { if (!confirm('Barcha qaydlar butunlay oʻchiriladi. Davom etasizmi?')) return; for (const n of NOTES) await del(n.id); NOTES = []; toast('Hammasi oʻchirildi'); renderHome(); };
  window.addEventListener('online', renderSys); window.addEventListener('offline', renderSys);
  document.addEventListener('visibilitychange', () => { if (document.hidden && Rec.on) Rec.stop('Ilovadan chiqildi — yozuv saqlandi'); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') { e.preventDefault(); const t = page === 'editor' ? edTarget : homeTarget; Rec.on ? Rec.stop() : Rec.start(t); } });
}
async function newAndOpen() { if (Rec.on) await Rec.stop(); const n = newNote(Rec.lang); await saveNote(n); openNote(n); setTimeout(() => $('#edBody').focus(), 60); }

/* ---------------- PIN lock ---------------- */
const PIN_KEY = 'qaydla.pin', FAIL_KEY = 'qaydla.pinFails';
let dbReady;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  drop(k) { try { localStorage.removeItem(k); } catch {} },
};
const Lock = {
  mode: 'unlock', buf: '', first: '', onDone: null, hiddenAt: 0, timer: 0,
  has() { return !!store.get(PIN_KEY); },
  async hash(pin, salt) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
  },
  async check(pin) { try { const r = JSON.parse(store.get(PIN_KEY)); return (await this.hash(pin, r.salt)) === r.hash; } catch { return false; } },
  async save(pin) {
    const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    store.set(PIN_KEY, JSON.stringify({ salt, hash: await this.hash(pin, salt) }));
  },
  fails() { try { return JSON.parse(store.get(FAIL_KEY) || '{"n":0,"until":0}'); } catch { return { n: 0, until: 0 }; } },
  setFails(f) { store.set(FAIL_KEY, JSON.stringify(f)); },
  isOpen() { return !$('#lock').hidden; },
  open(mode, onDone) {
    if (Rec.on) Rec.stop();
    this.mode = mode; this.buf = ''; this.first = ''; this.onDone = onDone || null;
    $('#lock').hidden = false;
    if (mode === 'unlock') document.documentElement.classList.add('locked');
    $('#kpCancel').classList.toggle('hide', mode === 'unlock');
    $('#lockForgot').hidden = !(mode === 'unlock' || mode === 'verify');
    this.text(); this.dots(); this.cooldown();
  },
  close() {
    $('#lock').hidden = true; document.documentElement.classList.remove('locked');
    clearInterval(this.timer);
  },
  text(err) {
    const T = { unlock: 'Kodni kiriting', verify: 'Joriy kodni kiriting', new: 'Yangi kod oʻylab toping', confirm: 'Kodni qayta kiriting' };
    const D = { unlock: 'Qaydla himoyalangan', verify: 'Davom etish uchun', new: '4 ta raqam', confirm: 'Tasdiqlash uchun' };
    $('#lockTitle').textContent = T[this.mode];
    const sub = $('#lockSub'); sub.textContent = err || D[this.mode]; sub.classList.toggle('err', !!err);
  },
  dots() { $$('#pinDots i').forEach((d, i) => d.classList.toggle('on', i < this.buf.length)); },
  shake(msg) {
    const d = $('#pinDots'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
    navigator.vibrate?.(120); this.buf = ''; this.dots(); this.text(msg);
  },
  cooldown() {
    clearInterval(this.timer);
    const kp = $('#keypad');
    const tick = () => {
      const left = Math.ceil((this.fails().until - Date.now()) / 1000);
      if (left > 0 && (this.mode === 'unlock' || this.mode === 'verify')) { kp.setAttribute('aria-disabled', 'true'); this.text(`Juda koʻp urinish. ${left} soniya kuting`); return true; }
      if (kp.getAttribute('aria-disabled') === 'true') { kp.removeAttribute('aria-disabled'); this.text(); }
      clearInterval(this.timer); return false;
    };
    if (tick()) this.timer = setInterval(tick, 500);
  },
  async key(k) {
    if ($('#keypad').getAttribute('aria-disabled') === 'true') return;
    if (k === 'cancel') { if (this.mode !== 'unlock') this.close(); return; }
    if (k === 'del') { this.buf = this.buf.slice(0, -1); this.dots(); return; }
    if (!/^\d$/.test(k) || this.buf.length >= 4) return;
    this.buf += k; this.dots();
    if (this.buf.length < 4) return;
    const pin = this.buf;
    await new Promise(r => setTimeout(r, 120));
    if (this.mode === 'unlock' || this.mode === 'verify') {
      if (await this.check(pin)) {
        this.setFails({ n: 0, until: 0 });
        const done = this.onDone; this.close(); done?.();
      } else {
        const f = this.fails(); f.n++;
        if (f.n >= 5) f.until = Date.now() + 30000 * Math.min(f.n - 4, 10);
        this.setFails(f); this.shake('Kod notoʻgʻri'); this.cooldown();
      }
    } else if (this.mode === 'new') {
      this.first = pin; this.mode = 'confirm'; this.buf = ''; this.dots(); this.text();
    } else if (this.mode === 'confirm') {
      if (pin !== this.first) { this.mode = 'new'; this.first = ''; this.shake('Kodlar mos kelmadi, qaytadan'); return; }
      await this.save(pin); this.setFails({ n: 0, until: 0 }); this.close();
      toast('Kirish kodi oʻrnatildi 🔒'); renderSettings();
    }
  },
  async forgot() {
    if (!confirm('Kodni tiklashning yagona yoʻli — ilovadagi BARCHA qaydlarni oʻchirish. Davom etasizmi?')) return;
    if (!confirm('Haqiqatan ham hammasi oʻchirilsinmi? Bu qaytarilmaydi.')) return;
    try { await dbReady; for (const n of NOTES) await del(n.id); NOTES = []; } catch {}
    store.drop(PIN_KEY); store.drop(FAIL_KEY);
    this.close(); toast('Kod va qaydlar oʻchirildi'); go('home');
  },
};
function bindLock() {
  $('#keypad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) Lock.key(b.dataset.k || b.textContent.trim()); });
  $('#lockForgot').onclick = () => Lock.forgot();
  document.addEventListener('keydown', e => {
    if (!Lock.isOpen()) return;
    if (/^\d$/.test(e.key)) Lock.key(e.key);
    else if (e.key === 'Backspace') Lock.key('del');
    else if (e.key === 'Escape') Lock.key('cancel');
    e.stopPropagation();
  }, true);
  $('#pinSet').onclick = () => Lock.has() ? Lock.open('verify', () => Lock.open('new')) : Lock.open('new');
  $('#pinOff').onclick = () => Lock.open('verify', () => { store.drop(PIN_KEY); toast('Kirish kodi olib tashlandi'); renderSettings(); });
  $('#lockNow').onclick = () => Lock.has() ? Lock.open('unlock') : toast('Avval kirish kodini oʻrnating');
  $('#setLockAfter').onchange = e => { S.lockAfter = +e.target.value; saveS(); };
  document.addEventListener('visibilitychange', () => {
    if (!Lock.has() || S.lockAfter < 0) return;
    if (document.hidden) { Lock.hiddenAt = Date.now(); if (S.lockAfter === 0 && !Lock.isOpen()) Lock.open('unlock'); }
    else if (!Lock.isOpen() && Lock.hiddenAt && Date.now() - Lock.hiddenAt >= S.lockAfter * 1000) Lock.open('unlock');
  });
}

/* ---------------- Install (Android + iPhone) ---------------- */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Qaydla ekranga oʻrnatildi ✓'); renderInstall(); });
function renderInstall() {
  const inst = isStandalone();
  let dismissed = false; try { dismissed = localStorage.getItem('qaydla.installHide') === '1'; } catch {}
  $('#installBar').hidden = inst || dismissed;
  $('#installSet').hidden = inst;
}
async function doInstall() {
  if (installEvt) {
    installEvt.prompt();
    try { const r = await installEvt.userChoice; if (r.outcome === 'accepted') installEvt = null; } catch {}
    renderInstall(); return;
  }
  const sheet = $('#iosSheet');
  if (isIOS) {
    const safari = !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(navigator.userAgent);
    const ipad = /iPad/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && !/iPhone/.test(navigator.userAgent);
    $('#iosTitle').textContent = ipad ? 'iPad ekraniga oʻrnatish' : 'iPhone ekraniga oʻrnatish';
    $('#iosStep1').innerHTML = (ipad ? 'Yuqoridagi' : safari ? 'Pastdagi' : 'Manzil satridagi') + ' <b>Ulashish</b> ' + $('.ios-ico').outerHTML + ' tugmasini bosing';
    $('#iosNote').innerHTML = safari ? 'Oʻrnatilgach, Qaydla ekranda alohida ilova boʻlib ochiladi.' : 'Agar bu tugma boʻlmasa, havolani <b>Safari</b>’da oching va qaytadan urinib koʻring.';
    $('#iosArrow').hidden = !(safari && !ipad);
  } else {
    $('#iosTitle').textContent = 'Ekranga oʻrnatish';
    $('#iosSteps').innerHTML = '<li><span class="n">1</span><span>Brauzer menyusini <b>⋮</b> oching</span></li><li><span class="n">2</span><span><b>“Ilovani oʻrnatish”</b> yoki <b>“Bosh ekranga qoʻshish”</b> ni tanlang</span></li>';
    $('#iosNote').textContent = 'Chrome, Edge yoki Samsung Internet’da ishlaydi.';
    $('#iosArrow').hidden = true;
  }
  sheet.hidden = false;
}
function bindInstall() {
  document.addEventListener('click', e => { if (e.target.closest('[data-install]')) doInstall(); });
  $('#installClose').onclick = () => { try { localStorage.setItem('qaydla.installHide', '1'); } catch {} renderInstall(); };
  $('#iosClose').onclick = () => { $('#iosSheet').hidden = true; };
  $('#iosSheet').addEventListener('click', e => { if (e.target.id === 'iosSheet') $('#iosSheet').hidden = true; });
  if (isIOS) document.documentElement.classList.add('ios');
  if (isStandalone()) document.documentElement.classList.add('standalone');
  renderInstall();
}

/* ---------------- Boot ---------------- */
(async function boot() {
  applyTheme(); renderLang(); bind(); bindLock(); bindInstall();
  if (Lock.has()) Lock.open('unlock'); else document.documentElement.classList.remove('locked');
  try { dbReady = openDB(); db = await dbReady; await loadAll(); } catch (e) { toast('Xotira ochilmadi: ' + e.message); }
  history.replaceState({ p: 'home' }, '', location.pathname + location.search);
  renderHome(); animWave();
  setInterval(renderClock, 15000);
  if (!SR) setTimeout(() => toast('Ovozli yozish uchun Chrome, Edge yoki Samsung Internet’dan foydalaning.'), 800);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
