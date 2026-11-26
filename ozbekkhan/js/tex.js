// Protsedura teksturalar: hammasi canvas'da chiziladi — tashqi rasm kerak emas.
import * as THREE from 'three';

export function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const cache = new Map();
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function noise(g, w, h, amt, r, scale = 1) {
  const d = g.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const n = (r() - 0.5) * amt * scale; a[i] += n; a[i + 1] += n; a[i + 2] += n; }
  g.putImageData(d, 0, 0);
}
function blotches(g, w, h, r, n, col, rmin, rmax, alpha) {
  for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rad = rmin + r() * (rmax - rmin); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col.replace('A', alpha)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
}
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// Paxsa/ganch devor: neytral (oq-kulrang), rang vertex rangi bilan beriladi. Ba'zi joylarda pishgan g'isht ko'rinadi.
export const wallTex = () => memo('wall', () => {
  const S = 512, [c, g] = cv(S), [b, bg] = cv(S), r = rng(7);
  g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, S, S); bg.fillStyle = '#888'; bg.fillRect(0, 0, S, S);
  blotches(g, S, S, r, 140, 'rgba(150,120,90,A)', 10, 60, 0.10); blotches(g, S, S, r, 30, 'rgba(120,95,70,A)', 30, 120, 0.08);
  blotches(g, S, S, r, 40, 'rgba(255,250,240,A)', 20, 70, 0.2);
  // g'isht qatorlari — suvoq ko'chgan joylarda
  for (let k = 0; k < 3; k++) {
    const cx = r() * S, cy = r() * S, rw = 26 + r() * 50, rh = 14 + r() * 24;
    g.save(); bg.save(); g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, 7); g.clip(); bg.beginPath(); bg.ellipse(cx, cy, rw, rh, 0, 0, 7); bg.clip();
    for (let y = 0; y < S; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < S; x += 32) {
      const t = 0.75 + r() * 0.25; g.fillStyle = `rgb(${200 * t | 0},${160 * t | 0},${118 * t | 0})`; g.fillRect(x + 1, y + 1, 30, 14); bg.fillStyle = '#a0a0a0'; bg.fillRect(x + 1, y + 1, 30, 14); bg.fillStyle = '#505050'; bg.fillRect(x, y, 32, 1); bg.fillRect(x, y, 1, 16);
    }
    g.restore(); bg.restore();
  }
  // yoriqlar
  g.strokeStyle = 'rgba(90,70,50,.35)'; bg.strokeStyle = '#333'; g.lineWidth = bg.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) { let x = r() * S, y = r() * S; g.beginPath(); bg.beginPath(); g.moveTo(x, y); bg.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 30; y += r() * 18; g.lineTo(x, y); bg.lineTo(x, y); } g.stroke(); bg.stroke(); }
  noise(g, S, S, 22, r); noise(bg, S, S, 40, r);
  return { map: tex(c), bump: tex(b, 1, false) };
});

// Pishgan g'isht (minora, ark) — Buxoro naqshli terish
export const brickTex = () => memo('brick', () => {
  const S = 512, [c, g] = cv(S), [b, bg] = cv(S), r = rng(11);
  g.fillStyle = '#9a7a55'; g.fillRect(0, 0, S, S); bg.fillStyle = '#333'; bg.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 16) {
    const pat = Math.floor(y / 16) % 8 < 2; // naqsh qatorlari
    for (let x = (y / 16) % 2 ? -16 : 0; x < S; x += 32) {
      const t = 0.82 + r() * 0.22; const w = pat && (x / 32) % 2 ? 14 : 29;
      g.fillStyle = `rgb(${212 * t | 0},${172 * t | 0},${122 * t | 0})`; g.fillRect(x + 2, y + 2, w, 12); bg.fillStyle = `rgb(${200 * t | 0},${200 * t | 0},${200 * t | 0})`; bg.fillRect(x + 2, y + 2, w, 12);
    }
  }
  noise(g, S, S, 18, r); return { map: tex(c), bump: tex(b, 1, false) };
});

// Yer: chang, tosh, iz
export const groundTex = (kind = 'dust') => memo('ground' + kind, () => {
  const S = 512, [c, g] = cv(S), r = rng(kind.length * 31);
  const base = { dust: '#c9ad85', sand: '#dcc196', grass: '#8a9a5a', field: '#8c7556', stone: '#b7a68b' }[kind] || '#c9ad85';
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  blotches(g, S, S, r, 90, 'rgba(110,85,55,A)', 10, 70, 0.16);
  blotches(g, S, S, r, 70, 'rgba(255,240,215,A)', 10, 60, 0.15);
  if (kind === 'grass') { for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${60 + r() * 60 | 0},${100 + r() * 70 | 0},${30 + r() * 30 | 0},.5)`; g.fillRect(r() * S, r() * S, 1, 3 + r() * 4); } }
  if (kind === 'stone') { g.fillStyle = '#8f7f68'; g.fillRect(0, 0, S, S); for (let y = 0; y < S; y += 26) for (let x = (y / 26 % 2) * 14; x < S + 30; x += 28) { const v = r() * 34 - 17, w = 22 + r() * 6, h = 20 + r() * 5; g.fillStyle = `rgb(${190 + v | 0},${176 + v | 0},${150 + v | 0})`; g.beginPath(); g.ellipse(x + r() * 3, y + 12 + r() * 3, w / 2, h / 2, r() * 0.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,250,235,.12)'; g.beginPath(); g.ellipse(x - 2, y + 9, w / 3, h / 4, 0, 0, 7); g.fill(); } }
  for (let i = 0; i < 1500; i++) { const v = r() * 80 + 90; g.fillStyle = `rgba(${v},${v * 0.85},${v * 0.65},.6)`; g.beginPath(); g.arc(r() * S, r() * S, r() * 2.2, 0, 7); g.fill(); }
  noise(g, S, S, 26, r); return tex(c, 1);
});

// Koshin (majolika): girih — yulduz naqsh
export const tileTex = (c1 = '#1d6fc0', c2 = '#18b0a8') => memo('tile' + c1 + c2, () => {
  const S = 256, [c, g] = cv(S), r = rng(3);
  g.fillStyle = c1; g.fillRect(0, 0, S, S);
  const star = (x, y, R, n, col) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); };
  for (const [x, y] of [[0, 0], [S, 0], [0, S], [S, S], [S / 2, S / 2]]) { star(x, y, 70, 8, '#f3ecdc'); star(x, y, 52, 8, c2); star(x, y, 22, 8, '#e9c25a'); }
  for (const [x, y] of [[S / 2, 0], [0, S / 2], [S, S / 2], [S / 2, S]]) { star(x, y, 40, 6, '#f3ecdc'); star(x, y, 28, 6, '#0c2d63'); }
  g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 3; for (let i = -S; i < S * 2; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.moveTo(i + S, 0); g.lineTo(i, S); g.globalAlpha = 0.25; g.stroke(); g.globalAlpha = 1; }
  // o'simlik (islimiy) kichik gullar
  for (let i = 0; i < 50; i++) { const x = r() * S, y = r() * S; g.fillStyle = r() > 0.5 ? '#f3ecdc' : c2; g.beginPath(); g.arc(x, y, 2 + r() * 2.5, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(12,30,60,.55)'; g.lineWidth = 6; g.strokeRect(0, 0, S, S); noise(g, S, S, 10, r); return tex(c);
});
// Gumbaz koshini: ko'k, yuqoriga qarab oq yozuv belbog'i
export const domeTex = (c1, c2) => memo('dome' + c1 + c2, () => {
  const W = 512, H = 256, [c, g] = cv(W, H), r = rng(5);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c2); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 12) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(x + (y / 12 % 2) * 8, y, 15, 11); }
  // pastki yozuv belbog'i
  g.fillStyle = '#0c2d63'; g.fillRect(0, H - 46, W, 40); g.strokeStyle = '#f3ecdc'; g.lineWidth = 3;
  for (let x = 6; x < W; x += 22) { g.beginPath(); g.moveTo(x, H - 14); g.lineTo(x, H - 38); g.quadraticCurveTo(x + 8, H - 44, x + 14, H - 30); g.stroke(); }
  // qovurg'alar
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; for (let x = 0; x < W; x += W / 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H - 46); g.stroke(); }
  noise(g, W, H, 8, r); const t = tex(c); t.repeat.set(1, 1); return t;
});
// Yozuv (kufiy) belbog'i — peshtoq va minora uchun
export const bandTex = (c1 = '#0c2d63') => memo('band' + c1, () => {
  const W = 512, H = 64, [c, g] = cv(W, H), r = rng(9);
  g.fillStyle = c1; g.fillRect(0, 0, W, H); g.fillStyle = '#e9c25a'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  g.strokeStyle = '#f3ecdc'; g.lineWidth = 5; g.lineCap = 'square';
  for (let x = 8; x < W; x += 28) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 14); g.lineTo(x + 12, 14); if (r() > 0.4) { g.moveTo(x + 6, 50); g.lineTo(x + 6, 26); g.lineTo(x + 18, 26); } g.stroke(); }
  g.strokeStyle = 'rgba(25,179,173,.9)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < W; x += 4) g.lineTo(x, 32 + Math.sin(x / 9) * 8); g.stroke();
  return tex(c);
});
export const woodTex = () => memo('wood', () => {
  const S = 256, [c, g] = cv(S), r = rng(13);
  g.fillStyle = '#6b4627'; g.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 32) { g.fillStyle = `rgb(${95 + r() * 30 | 0},${62 + r() * 20 | 0},${34 + r() * 14 | 0})`; g.fillRect(x + 1, 0, 30, S); g.strokeStyle = 'rgba(40,22,10,.35)'; for (let k = 0; k < 6; k++) { g.beginPath(); const ox = x + 4 + r() * 24; g.moveTo(ox, 0); for (let y = 0; y < S; y += 16) g.lineTo(ox + Math.sin(y / 20 + k) * 2, y); g.stroke(); } }
  noise(g, S, S, 16, r); return tex(c);
});
// O'ymakor eshik: geometrik panellar
export const doorTex = () => memo('door', () => {
  const W = 128, H = 256, [c, g] = cv(W, H), r = rng(17);
  g.fillStyle = '#5a361b'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2; i++) { const x0 = 6 + i * 60; for (let j = 0; j < 4; j++) { const y0 = 8 + j * 60; g.fillStyle = '#6e4423'; g.fillRect(x0, y0, 56, 54); g.strokeStyle = '#3a210f'; g.lineWidth = 2; g.strokeRect(x0 + 6, y0 + 6, 44, 42); g.beginPath(); g.moveTo(x0 + 28, y0 + 8); g.lineTo(x0 + 48, y0 + 27); g.lineTo(x0 + 28, y0 + 46); g.lineTo(x0 + 8, y0 + 27); g.closePath(); g.stroke(); g.beginPath(); g.arc(x0 + 28, y0 + 27, 6, 0, 7); g.stroke(); } }
  g.fillStyle = '#c9a050'; g.beginPath(); g.arc(58, 130, 4, 0, 7); g.arc(70, 130, 4, 0, 7); g.fill();
  noise(g, W, H, 18, r); const t = tex(c); return t;
});
// Gilam: qizil, gul (medalyon)
export const carpetTex = (seed = 1) => memo('carpet' + seed, () => {
  const W = 256, H = 384, [c, g] = cv(W, H), r = rng(seed * 7 + 1);
  const pal = [['#8e1c1c', '#1b2a4a', '#e8d3a2', '#d27a2c'], ['#5a1f3d', '#0f4c5c', '#efe0bd', '#c9562c'], ['#7a2318', '#2e4a2a', '#eed9a8', '#b8862a']][seed % 3];
  g.fillStyle = pal[0]; g.fillRect(0, 0, W, H); g.strokeStyle = pal[1]; g.lineWidth = 14; g.strokeRect(10, 10, W - 20, H - 20); g.strokeStyle = pal[2]; g.lineWidth = 3; g.strokeRect(22, 22, W - 44, H - 44);
  for (let k = 0; k < 3; k++) { const cy = 80 + k * 112; g.save(); g.translate(W / 2, cy); for (let s = 0; s < 3; s++) { g.fillStyle = [pal[1], pal[3], pal[2]][s]; const R = 46 - s * 14; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineTo(Math.cos(a) * R * 1.3, Math.sin(a) * R); g.lineTo(Math.cos(a + 0.39) * R * 0.75, Math.sin(a + 0.39) * R * 0.6); } g.closePath(); g.fill(); } g.restore(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = pal[2 + (i % 2)]; g.fillRect(30 + r() * (W - 60), 30 + r() * (H - 60), 4, 4); }
  noise(g, W, H, 16, r); return tex(c);
});
// Mato naqshlari: chopon / ko'ylak
export const FABRICS = {
  beqasam: { n: 'Beqasam (yo\'l-yo\'l)', p: 0, cols: ['#4e1822', '#1c2f52', '#8f6e34', '#23402f', '#3a2a40'] },
  adras: { n: 'Adras (abr naqsh)', p: 25, cols: ['#7a1f3a', '#d9a82a', '#236f92', '#2e2358'] },
  atlas: { n: 'Marg\'ilon atlasi', p: 60, cols: ['#c42f5c', '#e9c235', '#1d93c2', '#6a2a95', '#18905e'] },
  movut: { n: 'Movut (bir rang)', p: 10, cols: ['#2a3550'] },
  zardozi: { n: 'Zardo\'zi to\'n', p: 160, cols: ['#2a1640', '#e6b84c'] },
  tuya: { n: 'Tuya junidan chakmon', p: 40, cols: ['#a07a52', '#7a5a3a'] },
  oq: { n: 'Oq yaktak', p: 5, cols: ['#ece6d8'] },
  mirshab: { n: 'Mirshab to\'ni', p: 0, cols: ['#3b2a60', '#a3242a'] },
};
export const fabricTex = (id, variant = 0) => memo('fab' + id + variant, () => {
  const S = 256, [c, g] = cv(S), r = rng(id.length * 13 + variant * 101 + 7), F = FABRICS[id] || FABRICS.beqasam, cols = F.cols;
  const sh = (i) => cols[(i + variant) % cols.length];
  if (id === 'beqasam' || id === 'mirshab') { let x = 0, i = 0; while (x < S) { const w = 3 + r() * 9 | 0; g.fillStyle = sh(i % 3 === 2 ? i + 1 : i % 2); i++; g.fillRect(x, 0, w, S); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 1, S); if (r() < 0.3) { g.fillStyle = 'rgba(230,200,140,.35)'; g.fillRect(x + w - 1, 0, 1, S); } x += w; } for (let y = 0; y < S; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; g.fillRect(0, y, S, 1); } }
  else if (id === 'adras' || id === 'atlas') {
    // abr: vertikal "olov" shakllar, chetlari xira
    g.fillStyle = sh(0); g.fillRect(0, 0, S, S);
    const cols2 = id === 'atlas' ? 4 : 3;
    for (let k = 0; k < cols2 * 2; k++) {
      const x0 = (k / (cols2 * 2)) * S, col = sh(1 + (k % (cols.length - 1)));
      g.fillStyle = col; g.filter = 'blur(2px)'; g.beginPath(); g.moveTo(x0, 0);
      for (let y = 0; y <= S; y += 8) g.lineTo(x0 + 10 + Math.abs(Math.sin(y / 32 + k)) * 18 + r() * 3, y);
      for (let y = S; y >= 0; y -= 8) g.lineTo(x0 + 2 + Math.abs(Math.sin(y / 32 + k + 1.5)) * 8 + r() * 3, y);
      g.closePath(); g.fill(); g.filter = 'none';
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 16; y < S; y += 64) { g.beginPath(); g.ellipse(x0 + 16, y + (k % 2) * 32, 5, 12, 0, 0, 7); g.fill(); }
    }
  } else if (id === 'zardozi') {
    g.fillStyle = cols[0]; g.fillRect(0, 0, S, S); g.strokeStyle = cols[1]; g.lineWidth = 2.5;
    for (let y = 32; y < S; y += 64) for (let x = 32; x < S; x += 64) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * 18, y + Math.sin(a + 0.4) * 18, x + Math.cos(a) * 26, y + Math.sin(a) * 26); } g.stroke(); g.fillStyle = cols[1]; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  } else { g.fillStyle = cols[variant % cols.length]; g.fillRect(0, 0, S, S); if (id === 'tuya') blotches(g, S, S, r, 50, 'rgba(60,40,20,A)', 6, 20, 0.2); }
  noise(g, S, S, 12, r); return tex(c);
});
// Do'ppi naqshlari (4 tomonga takrorlanadi)
export const HATS = {
  iroqi_yashil: { n: 'Yashil iroqi do\'ppi', p: 35, type: 'doppi', d: 'Kulrang fonda yashil xochsimon chok, barg naqshi.' },
  chust: { n: 'Chust do\'ppi', p: 15, type: 'doppi', d: 'Qora fonda oq "qalampir" (bodom) naqsh — eng mashhur do\'ppi. Namangan, Chust.' },
  iroqi: { n: 'Iroqi do\'ppi', p: 30, type: 'doppi', d: 'Iroqi chok — mayda xochsimon tikuv, rang-barang. Shahrisabz, Buxoro.' },
  zardozi: { n: 'Zardo\'zi do\'ppi', p: 80, type: 'doppi', d: 'Baxmal ustiga oltin ip bilan kashta — Buxoro ustalari ishi.' },
  margilon: { n: 'Marg\'ilon do\'ppi', p: 20, type: 'doppi', d: 'Farg\'ona vodiysi do\'ppisi, gulli naqsh.' },
  samarqand: { n: 'Samarqand do\'ppi', p: 18, type: 'doppi', d: 'Doira tepalik, ko\'k-oq naqsh.' },
  shahrisabz: { n: 'Shahrisabz do\'ppi', p: 25, type: 'doppi', d: 'Rangli ipak bilan "iroqi" chok — Kesh hunarmandlari.' },
  andijon: { n: 'Andijon do\'ppi', p: 15, type: 'doppi', d: 'Qora-oq, chust uslubiga yaqin, chetida jiyak.' },
  toshkent: { n: 'Toshkent do\'ppi', p: 15, type: 'doppi', d: 'To\'q yashil baxmal, oq naqsh.' },
  surxon: { n: 'Surxon do\'ppi', p: 15, type: 'doppi', d: 'Qizil-to\'q, yorqin ipak naqsh.' },
  oddiy: { n: 'Oddiy do\'ppi', p: 0, type: 'doppi', d: 'Har kunlik kiyim.' },
  salla: { n: 'Oq salla', p: 20, type: 'salla', d: 'Uzun oq mato boshga o\'raladi — mo\'ysafid va ulamolar kiyimi.' },
  chugirma: { n: 'Chugirma telpak', p: 45, type: 'chugirma', d: 'Xorazmning katta jingalak qo\'y terisi telpagi.' },
  telpak: { n: 'Qora telpak', p: 30, type: 'telpak', d: 'Qo\'zi terisidan, dashtning sovuq shamollaridan asraydi.' },
  qalpoq: { n: 'Oq qalpoq', p: 25, type: 'qalpoq', d: 'Kigizdan tikilgan baland oq qalpoq.' },
  yalang: { n: 'Boshyalang', p: 0, type: 'none', d: 'Bosh kiyimsiz.' },
};
export const doppiTex = (id) => memo('doppi' + id, () => {
  const W = 512, H = 128, [c, g] = cv(W, H), r = rng(id.length * 17);
  const P = { chust: ['#141414', '#f3efe6'], iroqi: ['#8a1d2c', '#f2c230', '#1e6e8e', '#2a8a4a'], zardozi: ['#2a1640', '#e6b84c'], margilon: ['#1a3a2a', '#e8d9b8', '#c0392b'], samarqand: ['#1d3e78', '#f0ead8'], shahrisabz: ['#5a1530', '#f2c230', '#2bb0a8'], andijon: ['#101010', '#f3efe6', '#a33'], toshkent: ['#163a2a', '#f3efe6'], surxon: ['#7a1414', '#f6d23c', '#e8e8e8'], oddiy: ['#1d2a44', '#d8d0bc'] }[id] || ['#222', '#eee'];
  g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
  const Q = W / 4;
  for (let s = 0; s < 4; s++) {
    const x = s * Q + Q / 2;
    if (id === 'chust' || id === 'andijon' || id === 'toshkent' || id === 'oddiy') {
      // qalampir (bodom) shakli
      g.fillStyle = P[1]; g.save(); g.translate(x, 64); g.rotate(-0.5); g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(28, -30, 26, 26, 0, 38); g.bezierCurveTo(-8, 20, -18, -16, 0, -40); g.fill();
      g.fillStyle = P[0]; g.beginPath(); g.moveTo(2, -26); g.bezierCurveTo(16, -18, 14, 18, 2, 26); g.bezierCurveTo(-2, 10, -6, -12, 2, -26); g.fill(); g.restore();
      if (P[2]) { g.fillStyle = P[2]; g.fillRect(s * Q, H - 10, Q, 10); }
    } else if (id === 'iroqi' || id === 'shahrisabz' || id === 'surxon') {
      for (let y = 4; y < H; y += 8) for (let xx = s * Q + 4; xx < (s + 1) * Q; xx += 8) { const d = Math.abs(xx - x) + Math.abs(y - 64); if (d < 56 && (d / 8 | 0) % 2 === 0) { g.fillStyle = P[1 + ((d / 16) | 0) % (P.length - 1)]; g.fillRect(xx - 3, y - 3, 6, 6); } }
    } else if (id === 'zardozi') {
      g.strokeStyle = P[1]; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x + Math.cos(a + 0.5) * 30, 64 + Math.sin(a + 0.5) * 30, x + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.stroke(); } g.fillStyle = P[1]; g.fillRect(s * Q, 0, Q, 6); g.fillRect(s * Q, H - 8, Q, 8);
    } else {
      g.strokeStyle = P[1]; g.lineWidth = 4; g.beginPath(); g.arc(x, 64, 34, 0, 7); g.stroke(); g.fillStyle = P[2] || P[1]; g.beginPath(); g.arc(x, 64, 12, 0, 7); g.fill();
    }
  }
  noise(g, W, H, 10, r); const t = tex(c); t.wrapT = THREE.ClampToEdgeWrapping; return t;
});
// Suv normal xaritasi
export const waterNormal = () => memo('waterN', () => {
  const S = 256, [c, g] = cv(S), d = g.createImageData(S, S), a = d.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; const u = x / S * Math.PI * 2, v = y / S * Math.PI * 2; const nx = Math.sin(u * 3 + Math.cos(v * 2) * 1.5) * 0.5 + Math.sin(u * 7 + v * 5) * 0.25; const ny = Math.cos(v * 4 + Math.sin(u * 3)) * 0.5 + Math.cos(v * 9 - u * 4) * 0.2; a[i] = 128 + nx * 60; a[i + 1] = 128 + ny * 60; a[i + 2] = 255; a[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = tex(c, 1, false); return t;
});
export const leafTex = () => memo('leaf', () => {
  const S = 256, [c, g] = cv(S), r = rng(21); g.fillStyle = '#4d6a2c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = `rgba(${50 + v * 90 | 0},${85 + v * 95 | 0},${25 + v * 40 | 0},.85)`; g.save(); g.translate(r() * S, r() * S); g.rotate(r() * 6.3); g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, 7); g.fill(); g.restore(); }
  return tex(c);
});
// Bayroqcha / soyabon matosi (bozor)
export const awningTex = (seed) => memo('awn' + seed, () => {
  const S = 128, [c, g] = cv(S), cols = [['#b8322a', '#efe2c2'], ['#1f6f8b', '#efe2c2'], ['#d6922b', '#7a2a1a'], ['#2f7a4a', '#efe2c2']][seed % 4];
  for (let x = 0; x < S; x += 16) { g.fillStyle = cols[(x / 16) % 2]; g.fillRect(x, 0, 16, S); } noise(g, S, S, 14, rng(seed + 3)); return tex(c);
});
// Chopon to'ri / parashyut (atlas qanot)
export const glowTex = () => memo('glow', () => { const S = 64, [c, g] = cv(S); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,220,150,.6)'); gr.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });

// ---- Fotoskan PBR teksturalar (Poly Haven, CC0) — assets/tex/<nom>_{diff,nor,arm}.jpg ----
const TL = new THREE.TextureLoader(); const PENDING = [];
export const texReady = () => Promise.all(PENDING);
export const ASSET_BASE = (typeof window !== 'undefined' && window.OZ_ASSETS) || 'assets/';
export function pbr(name, o = {}) {
  return memo('pbr' + name, () => {
    const ld = (suf, srgb) => { let ok; PENDING.push(new Promise((r) => (ok = r))); const t = TL.load(ASSET_BASE + 'tex/' + name + '_' + suf + '.jpg', ok, undefined, ok); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
    const arm = ld('arm', false);
    return { map: ld('diff', true), normalMap: ld('nor', false), aoMap: arm, roughnessMap: arm, ...o };
  });
}
// Barg kartasi (alfa): bir to'p yaproq — daraxt tojlari uchun
export const leafCard = (hue = 0) => memo('leafcard' + hue, () => {
  const S = 512, [c, g] = cv(S), r = rng(77 + hue);
  g.clearRect(0, 0, S, S);
  const base = [[78, 112, 44], [92, 120, 50], [70, 100, 40]][hue % 3];
  for (let i = 0; i < 520; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * S * 0.44, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d * 0.9;
    const sh = 0.55 + r() * 0.6 - d / S * 0.3; g.fillStyle = `rgb(${base[0] * sh | 0},${base[1] * sh | 0},${base[2] * sh | 0})`;
    g.save(); g.translate(x, y); g.rotate(r() * 6.3); const L = 14 + r() * 12; g.beginPath(); g.moveTo(0, -L); g.quadraticCurveTo(L * 0.55, 0, 0, L); g.quadraticCurveTo(-L * 0.55, 0, 0, -L); g.fill();
    g.strokeStyle = 'rgba(30,40,15,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L); g.lineTo(0, L); g.stroke(); g.restore();
  }
  g.strokeStyle = 'rgba(70,55,35,.9)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + (r() - 0.5) * S * 0.7, S / 2 + (r() - 0.5) * S * 0.7); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
});

export const flowerCard = () => memo('flowercard', () => {
  const S = 256, [c, g] = cv(S), r = rng(91);
  for (let i = 0; i < 260; i++) { const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * S * 0.45, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d * 0.9; const green = r() < 0.35; g.fillStyle = green ? `rgb(${60 + r() * 40 | 0},${100 + r() * 40 | 0},${40 + r() * 20 | 0})` : ['#c23b8a', '#d65aa8', '#a83aa0', '#e07ab8', '#8e3fb0'][r() * 5 | 0]; g.beginPath(); g.ellipse(x, y, green ? 7 : 5, green ? 3.5 : 5, r() * 6, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});

// Haqiqiy namunalar asosida: Chust do'ppi (qora fonda oq bodom + pastki geometrik hoshiya) va yashil iroqi do'ppi (xochsimon chok)
export const doppiReal = (id) => memo('doppiR' + id, () => {
  const W = 1024, H = 256, [c, g] = cv(W, H), r = rng(id.length * 7 + 3), Q = W / 4;
  if (id === 'chust') {
    g.fillStyle = '#0d0d0f'; g.fillRect(0, 0, W, H);
    // pastki hoshiya: oq to'rtburchak meandr
    g.strokeStyle = '#f2f0ea'; g.lineWidth = 3; g.strokeRect(-2, H - 62, W + 4, 46); g.strokeRect(-2, H - 56, W + 4, 34);
    for (let x = 6; x < W; x += 52) { g.strokeRect(x, H - 50, 38, 22); g.strokeRect(x + 8, H - 44, 22, 10); g.fillStyle = '#f2f0ea'; g.beginPath(); g.arc(x + 46, H - 39, 2.5, 0, 7); g.fill(); }
    for (let k = 0; k < 4; k++) { const cx = k * Q + Q / 2, cy = 92;
      g.save(); g.translate(cx, cy); g.rotate(-0.45);
      for (let ring = 0; ring < 4; ring++) { const s2 = 1 - ring * 0.2; g.strokeStyle = '#f2f0ea'; g.lineWidth = ring ? 3 : 5; g.beginPath(); g.moveTo(0, -78 * s2); g.bezierCurveTo(60 * s2, -64 * s2, 56 * s2, 52 * s2, 0, 74 * s2); g.bezierCurveTo(-34 * s2, 56 * s2, -44 * s2, 6 * s2, -14 * s2, -24 * s2); g.bezierCurveTo(-4 * s2, -40 * s2, -2 * s2, -60 * s2, 0, -78 * s2); g.stroke(); }
      g.fillStyle = '#f2f0ea'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(4, 14 + i * 10, 5, 3, 0.3, 0, 7); g.fill(); }
      g.restore();
      // kichik gulcha va nuqtalar
      g.fillStyle = '#f2f0ea'; const fx = cx + Q * 0.38, fy = 40; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.beginPath(); g.arc(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 2.6, 0, 7); g.fill(); } g.beginPath(); g.arc(fx, fy, 2, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(cx - Q * 0.35 + r() * 20, 130 + r() * 40, 2.2, 0, 7); g.fill(); }
    }
  } else if (id === 'iroqi_yashil') {
    g.fillStyle = '#b9bbb4'; g.fillRect(0, 0, W, H); const cs = 8;
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * cs, y * cs, cs - 1, cs - 1); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x * cs, y * cs, cs - 1, 2); };
    for (let y = 0; y < H / cs; y++) for (let x = 0; x < W / cs; x++) { const u = x % 32, v = y; let col = r() < 0.5 ? '#c4c6bf' : '#b2b4ad';
      if (v >= 27) col = (x + v) % 3 === 0 ? '#1d8a3a' : '#c4c6bf';
      else if (v === 25 || v === 26) col = '#141414';
      else { const lx = Math.abs(u - 16), ly = v - 14; if (lx * 0.9 + Math.abs(ly) * 0.55 < 9 && ly > -10) col = '#1f9a42'; if (lx < 1 && ly > -9) col = '#0f5a25'; if ((lx + Math.abs(ly - 2)) % 7 === 0 && lx < 10 && ly < 10 && ly > -8) col = '#141414'; if (v < 4 && (u + v) % 5 < 2) col = '#1f9a42'; }
      px(x, y, col); }
  }
  const t = tex(c); t.wrapT = THREE.ClampToEdgeWrapping; return t;
});
// Bug'doy poyalari (alfa): tilla rang, boshoqli
export const wheatCard = () => memo('wheat', () => {
  const W = 256, H = 256, [c, g] = cv(W, H), r = rng(55); g.clearRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const x = 8 + r() * (W - 16), lean = (r() - 0.5) * 30, top = 20 + r() * 50, col = `rgb(${200 + r() * 40 | 0},${160 + r() * 40 | 0},${70 + r() * 30 | 0})`;
    g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * 0.3, H * 0.5, x + lean, top + 28); g.stroke();
    g.fillStyle = col; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(x + lean + (k % 2 ? 2.5 : -2.5), top + k * 4.5, 2.6, 4, k % 2 ? 0.4 : -0.4, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(230,200,120,.7)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x + lean, top); g.lineTo(x + lean + (r() - 0.5) * 6, top - 14); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});

// Haqiqiy gilam rasmi (foydalanuvchi namunasi)
export const realCarpet = () => memo('gilamR', () => { const t = new THREE.TextureLoader().load(ASSET_BASE + 'tex/gilam.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; });
