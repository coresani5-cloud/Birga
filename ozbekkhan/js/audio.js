// Ovoz: hammasi sintez — dutor/tanbur (Karplus-Strong), doira, nay, g'ijjak, karnay, shamol, qadam.
// Radio: viloyatga qarab o'zgaradigan to'lqinlar. music/playlist.json bo'lsa — o'zingiz qo'shgan qo'shiqlar ham chalinadi.
let ctx = null, master = null, musicBus = null, sfxBus = null, ambBus = null;
const bufCache = new Map();
export const Audio = { on: false, radio: true, station: 0, onTrack: null };

export function initAudio() {
  if (ctx) { ctx.resume?.(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.42; musicBus.connect(comp);
  // xona aks-sadosi (reverb)
  const rev = ctx.createConvolver(), len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.22; musicBus.connect(rev); rev.connect(rg); rg.connect(comp);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(comp);
  ambBus = ctx.createGain(); ambBus.gain.value = 0.25; ambBus.connect(comp);
  Audio.on = true; startWind(); loadPlaylist();
}

function pluck(freq, dur = 1.6, bright = 0.5) {
  const k = Math.round(freq * 4) + ':' + dur + ':' + bright; if (bufCache.has(k)) return bufCache.get(k);
  const sr = ctx.sampleRate, N = Math.round(sr / freq), len = Math.floor(sr * dur), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
  const ring = new Float32Array(N); for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0, prev = 0; const damp = 0.994 + bright * 0.004;
  for (let i = 0; i < len; i++) { const cur = ring[idx]; const nx = (cur + prev) * 0.5 * damp; prev = cur; ring[idx] = nx; d[i] = cur * (i < 30 ? i / 30 : 1); idx = (idx + 1) % N; }
  bufCache.set(k, b); return b;
}
function playBuf(b, t, gain, bus = musicBus, rate = 1, pan = 0) { const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; const g = ctx.createGain(); g.gain.value = gain; const p = ctx.createStereoPanner(); p.pan.value = pan; s.connect(g).connect(p).connect(bus); s.start(t); return s; }
function noiseBuf(dur = 0.3) { const k = 'n' + dur; if (bufCache.has(k)) return bufCache.get(k); const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; bufCache.set(k, b); return b; }
function doira(t, kind, gain = 0.5) { // dum (past) / tak (baland) / shiq (zang)
  if (kind === 'dum') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g).connect(musicBus); o.start(t); o.stop(t + 0.4); }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf(0.3); const f = ctx.createBiquadFilter(); f.type = kind === 'shiq' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'shiq' ? 6000 : kind === 'tak' ? 2200 : 400; f.Q.value = kind === 'shiq' ? 0.5 : 1.2; const g = ctx.createGain(); const dd = kind === 'shiq' ? 0.25 : 0.08; g.gain.setValueAtTime(gain * (kind === 'dum' ? 0.4 : 0.6), t); g.gain.exponentialRampToValueAtTime(0.001, t + dd); s.connect(f).connect(g).connect(musicBus); s.start(t); s.stop(t + dd + 0.02);
}
function nay(t, freq, dur, gain = 0.12) { // nay: sinus + nafas shovqini + vibrato
  const o = ctx.createOscillator(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq; v.frequency.value = 5.2; vg.gain.value = freq * 0.012; v.connect(vg).connect(o.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.08); g.gain.setValueAtTime(gain, t + dur - 0.1); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g).connect(musicBus);
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.3); n.loop = true; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 4; const ng = ctx.createGain(); ng.gain.value = gain * 0.25; n.connect(nf).connect(ng).connect(g);
  o.start(t); v.start(t); n.start(t); o.stop(t + dur); v.stop(t + dur); n.stop(t + dur);
}
function gijjak(t, freq, dur, gain = 0.08) { // kamonli: arra to'lqin, filtr
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = freq; v.frequency.value = 6; vg.gain.value = freq * 0.01; v.connect(vg).connect(o.frequency); f.type = 'lowpass'; f.frequency.value = freq * 4; f.Q.value = 2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.12); g.gain.setValueAtTime(gain, t + dur - 0.12); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(f).connect(g).connect(musicBus); o.start(t); v.start(t); o.stop(t + dur); v.stop(t + dur);
}
export function karnay() { if (!ctx) return; const t = ctx.currentTime; for (const [d, f] of [[0, 233], [0.5, 233], [0.8, 311], [1.6, 349]]) { const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1400; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.18, t + d + 0.08); g.gain.linearRampToValueAtTime(0, t + d + (d > 1 ? 1.3 : 0.45)); o.connect(fl).connect(g).connect(sfxBus); o.start(t + d); o.stop(t + d + 1.5); } for (let i = 0; i < 8; i++) doira(t + i * 0.25, i % 2 ? 'tak' : 'dum', 0.5); }

/* ---- kuylar: maqom pardalari (taxminiy) va ritmlar ---- */
const SC = {
  ushshoq: [0, 2, 3, 5, 7, 8, 10, 12],       // ushshoq — mayin, g'amgin
  segoh: [0, 1, 3, 5, 7, 8, 10, 12],         // segoh
  navo: [0, 2, 3, 5, 7, 9, 10, 12],          // navo
  rost: [0, 2, 4, 5, 7, 9, 10, 12],          // rost — tantanali
  hijoz: [0, 1, 4, 5, 7, 8, 10, 12],         // lazgi uslubidagi o'tkir parda
};
const RHY = { // doira usullari (16 bo'lak)
  lazgi: ['dum', 0, 'tak', 'tak', 0, 'tak', 'dum', 0, 'dum', 0, 'tak', 'tak', 0, 'tak', 'shiq', 'tak'],
  yalla: ['dum', 0, 0, 'tak', 'dum', 0, 'tak', 0, 'dum', 0, 0, 'tak', 'dum', 'tak', 'shiq', 0],
  maqom: ['dum', 0, 0, 0, 'tak', 0, 0, 0, 'dum', 0, 'dum', 0, 'tak', 0, 0, 0],
  vodiy: ['dum', 0, 'tak', 0, 'dum', 'dum', 'tak', 0, 'dum', 0, 'tak', 0, 'dum', 'tak', 'tak', 'shiq'],
  surxon: ['dum', 0, 'tak', 0, 0, 'tak', 'dum', 0, 'tak', 0, 'dum', 0, 'tak', 0, 'shiq', 0],
};
// To'lqinlar — hammasi xalq kuylari uslubida yangi sintez qilingan ohanglar
export const STATIONS = [
  { name: 'Maqom to\'lqini', tracks: [{ n: 'Ushshoq yo\'lida', sc: 'ushshoq', r: 'maqom', bpm: 70, root: 146.8, inst: ['tanbur', 'gijjak'] }, { n: 'Navo sadolari', sc: 'navo', r: 'maqom', bpm: 76, root: 164.8, inst: ['tanbur', 'nay'] }], dj: ['Assalomu alaykum, aziz tinglovchi. Sabr bilan tinglang — maqom shoshilmaydi.', 'Choyxonadan salom: osh damlandi, choy damlandi, faqat siz yo\'qsiz.'] },
  { name: 'Vodiy kuylari', tracks: [{ n: 'Vodiy bahori', sc: 'navo', r: 'vodiy', bpm: 108, root: 196, inst: ['dutor', 'nay'] }, { n: 'Atlas ko\'ylak', sc: 'rost', r: 'vodiy', bpm: 116, root: 174.6, inst: ['dutor', 'gijjak'] }], dj: ['Marg\'ilondan xabar: pilla narxi ko\'tarildi, ipak qurtlari xursand.', 'Yo\'l yangiliklari: Qo\'qon ko\'chasida eshak aravasi tirband qildi, ehtiyot bo\'ling.'] },
  { name: 'Xorazm lazgisi', tracks: [{ n: 'Lazgi', sc: 'hijoz', r: 'lazgi', bpm: 132, root: 220, inst: ['dutor', 'gijjak'] }, { n: 'Xiva oqshomi', sc: 'segoh', r: 'lazgi', bpm: 120, root: 196, inst: ['dutor', 'nay'] }], dj: ['Xivadan to\'y xabari: lazgi boshlanadi — oyog\'ingizni tayyorlang!', 'Ob-havo: Qizilqumda issiq, telpakni yechmang — sovuq qiladi deyishadi.'] },
  { name: 'Surxon ohanglari', tracks: [{ n: 'Boysun yo\'li', sc: 'ushshoq', r: 'surxon', bpm: 96, root: 130.8, inst: ['dombira', 'nay'] }, { n: 'Alpomish yo\'lida', sc: 'navo', r: 'surxon', bpm: 88, root: 123.5, inst: ['dombira'] }], dj: ['Baxshi bobo aytadi: doston uzun, kechalar undan ham uzun.', 'Termizdan: anor pishdi, qo\'shni xola ulashyapti.'] },
  { name: 'Yalla bazmi', tracks: [{ n: 'Yalla-yalla', sc: 'rost', r: 'yalla', bpm: 124, root: 196, inst: ['dutor', 'gijjak', 'nay'] }, { n: 'To\'y kechasi', sc: 'navo', r: 'yalla', bpm: 128, root: 220, inst: ['dutor', 'nay'] }], dj: ['To\'yxonadan jonli efir: karnay-surnay chalinyapti!', 'Eslatma: qo\'shnilarni uyg\'otmang — soat kech bo\'ldi.'] },
];
export const REGION_STATION = { xorazm: 2, buxoro: 0, navoiy: 0, samarqand: 0, qashqadaryo: 3, surxondaryo: 3, jizzax: 4, sirdaryo: 4, toshkent: 4, namangan: 1, fargona: 1, andijon: 1 };

let seqTimer = null, seqT = 0, step = 0, melodyState = 0, curTrack = null, userTracks = [], userEl = null, trackIdx = 0;
function mkMelody(tr) { // ohang: pardada yuqoriga-pastga yuruvchi iboralar
  const sc = SC[tr.sc], ph = []; let deg = 0;
  for (let p = 0; p < 4; p++) { const phrase = []; for (let i = 0; i < 16; i++) { if (i % 4 === 0 || Math.random() < 0.55) { deg += Math.round((Math.random() - 0.45) * 3); deg = Math.max(-2, Math.min(9, deg)); if (i === 15) deg = p % 2 ? 0 : 4; phrase.push(deg); } else phrase.push(null); } ph.push(phrase); }
  return { sc, ph };
}
const degFreq = (root, sc, d) => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return root * Math.pow(2, (sc[i] + o * 12) / 12); };
function schedule() {
  if (!ctx || !Audio.radio || !curTrack) return;
  const tr = curTrack, spb = 60 / tr.bpm / 4; // 16-lik
  while (seqT < ctx.currentTime + 0.3) {
    const s = step % 16, ph = curTrack._m.ph[Math.floor(step / 16) % 4];
    const r = RHY[tr.r][s]; if (r) doira(seqT, r, 0.45);
    const d = ph[s];
    if (d !== null && d !== undefined) {
      const f = degFreq(tr.root, curTrack._m.sc, d);
      if (tr.inst.includes('dutor') || tr.inst.includes('tanbur') || tr.inst.includes('dombira')) { playBuf(pluck(f, 1.4, tr.inst.includes('tanbur') ? 0.8 : 0.5), seqT, 0.35, musicBus, 1, -0.2); playBuf(pluck(f * (tr.inst.includes('dombira') ? 1.5 : 2), 1.0), seqT + 0.012, 0.12, musicBus, 1, 0.2); }
      const melo = tr.inst.includes('nay') ? 'nay' : tr.inst.includes('gijjak') ? 'gijjak' : null;
      if (melo && step % 32 >= 16 && s % 2 === 0) (melo === 'nay' ? nay : gijjak)(seqT, f * 2, spb * 2.1, 0.07);
    }
    if (s % 8 === 0) playBuf(pluck(tr.root / 2, 2.2, 0.3), seqT, 0.18, musicBus, 1, 0); // bas (dutorning past tori)
    seqT += spb; step++;
    if (step >= 16 * 16) { nextTrack(); return; }
  }
}
function nextTrack() {
  const st = STATIONS[Audio.station]; const list = st.tracks.concat(Audio.station === 0 ? userTracks : []);
  trackIdx = (trackIdx + 1) % list.length; playTrack(list[trackIdx]);
}
function playTrack(tr) {
  stopUser(); curTrack = tr; step = 0; seqT = ctx.currentTime + 0.1;
  if (tr.url) { userEl = new window.Audio(tr.url); userEl.volume = 0.7; userEl.onended = nextTrack; userEl.play().catch(() => nextTrack()); curTrack = null; }
  else tr._m = mkMelody(tr);
  Audio.onTrack?.(STATIONS[Audio.station].name, tr.n, STATIONS[Audio.station].dj[Math.floor(Math.random() * STATIONS[Audio.station].dj.length)]);
}
function stopUser() { if (userEl) { userEl.onended = null; userEl.pause(); userEl = null; } }
export function setStation(i) {
  if (!ctx) return; Audio.station = (i + STATIONS.length) % STATIONS.length; trackIdx = -1; Audio.radio = true;
  if (!seqTimer) seqTimer = setInterval(schedule, 80);
  nextTrack();
}
export function radioOff() { Audio.radio = false; curTrack = null; stopUser(); Audio.onTrack?.(null); }
async function loadPlaylist() { try { const r = await fetch('music/playlist.json'); if (!r.ok) return; const j = await r.json(); userTracks = (Array.isArray(j) ? j : []).filter((x) => x && x.file).map((x) => ({ n: String(x.title || x.file), url: 'music/' + String(x.file) })); } catch {} }

/* ---- atrof-muhit va effektlar ---- */
let windSrc = null;
function startWind() { const s = ctx.createBufferSource(); s.buffer = noiseBuf(2); s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = ctx.createGain(); g.gain.value = 0.15; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.08; lg.gain.value = 260; l.connect(lg).connect(f.frequency); s.connect(f).connect(g).connect(ambBus); s.start(); l.start(); windSrc = s; }
export function sfx(kind, vol = 1) {
  if (!ctx) return; const t = ctx.currentTime;
  if (kind === 'step' || kind === 'hoof') { const s = ctx.createBufferSource(); s.buffer = noiseBuf(0.3); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = kind === 'hoof' ? 700 + Math.random() * 200 : 300 + Math.random() * 200; f.Q.value = kind === 'hoof' ? 3 : 1; const g = ctx.createGain(); g.gain.setValueAtTime(0.25 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'hoof' ? 0.09 : 0.07)); s.connect(f).connect(g).connect(sfxBus); s.start(t); s.stop(t + 0.12); }
  else if (kind === 'coin') { for (const [d, f] of [[0, 1320], [0.07, 1760]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.15, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25); o.connect(g).connect(sfxBus); o.start(t + d); o.stop(t + d + 0.3); } }
  else if (kind === 'pick') playBuf(pluck(880, 0.5, 0.9), t, 0.4, sfxBus);
  else if (kind === 'good') { [523, 659, 784].forEach((f, i) => playBuf(pluck(f, 0.8, 0.8), t + i * 0.08, 0.4, sfxBus)); }
  else if (kind === 'bad') { [311, 233].forEach((f, i) => playBuf(pluck(f, 0.8, 0.5), t + i * 0.12, 0.5, sfxBus)); }
  else if (kind === 'whistle') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(2200, t); o.frequency.linearRampToValueAtTime(2600, t + 0.15); o.frequency.linearRampToValueAtTime(2200, t + 0.3); g.gain.setValueAtTime(0.08, t); g.gain.linearRampToValueAtTime(0, t + 0.5); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.55); }
  else if (kind === 'bird') { const o = ctx.createOscillator(), g = ctx.createGain(); const f0 = 2500 + Math.random() * 1500; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.06); o.frequency.exponentialRampToValueAtTime(f0 * 0.9, t + 0.12); g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); o.connect(g).connect(ambBus); o.start(t); o.stop(t + 0.15); }
  else if (kind === 'doira') doira(t, 'dum', 0.6);
  else if (kind === 'tak') doira(t, 'tak', 0.6);
}
export function setAmbience(night) { if (ambBus) ambBus.gain.value = night ? 0.15 : 0.25; }
export function duck(on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.12 : 0.42, ctx.currentTime, 0.3); }
