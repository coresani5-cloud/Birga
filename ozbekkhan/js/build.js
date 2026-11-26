// Shahar quruvchisi: har viloyat uchun tarixiy shahar — devorlar, mahallalar, bozor, hovuz, choyxona, me'moriy yodgorliklar.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './tex.js';

const T = THREE;
export const CELL = 26, HALF = 104, WALL_IN = 110, WALL_T = 4;
const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();

/* ---------------- to'qnashuv (collider) ---------------- */
export class Colliders {
  constructor() { this.b = []; this.cs = 8; this.g = new Map(); }
  add(x0, z0, x1, z1, top, bot = -5, tag) {
    if (x0 > x1) [x0, x1] = [x1, x0]; if (z0 > z1) [z0, z1] = [z1, z0];
    const b = { x0, z0, x1, z1, top, bot, tag }, i = this.b.push(b) - 1, s = this.cs;
    for (let gx = Math.floor(x0 / s); gx <= Math.floor(x1 / s); gx++) for (let gz = Math.floor(z0 / s); gz <= Math.floor(z1 / s); gz++) { const k = gx * 10007 + gz; let a = this.g.get(k); if (!a) this.g.set(k, (a = [])); a.push(i); }
    return b;
  }
  near(x, z) { const s = this.cs, a = this.g.get(Math.floor(x / s) * 10007 + Math.floor(z / s)); return a || []; }
  ground(x, z, y, r = 0.2) { let g = -1e9; for (const i of this.near(x, z)) { const b = this.b[i]; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.top <= y + 0.6 && b.top > g) g = b.top; } return g; }
  push(p, r, y, h = 1.7) {
    let hit = false;
    for (let pass = 0; pass < 2; pass++) for (const i of this.near(p.x, p.z)) {
      const b = this.b[i]; if (b.top <= y + 0.6 || b.bot >= y + h) continue;
      const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1)); let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue; hit = true;
      if (d2 < 1e-8) { const l = p.x - b.x0, rr = b.x1 - p.x, f = p.z - b.z0, k = b.z1 - p.z, m = Math.min(l, rr, f, k); if (m === l) p.x = b.x0 - r; else if (m === rr) p.x = b.x1 + r; else if (m === f) p.z = b.z0 - r; else p.z = b.z1 + r; continue; }
      const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r;
    }
    return hit;
  }
  // nur — kamera uchun (2.5D)
  blocked(x, y, z) { for (const i of this.near(x, z)) { const b = this.b[i]; if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.top && y > b.bot) return true; } return false; }
}

/* ---------------- geometriya yig'uvchi ---------------- */
function worldUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); } uv[i * 2] = u * s; uv[i * 2 + 1] = v * s; }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
}
export function scaleUV(g, su, sv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv); return g; }
function colorize(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new T.BufferAttribute(a, 3)); }
export function tf(g, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); g.applyMatrix4(_m); return g; }
const WHITE = new T.Color(1, 1, 1);

class Batch {
  constructor(mats) { this.mats = mats; this.parts = {}; }
  add(key, g, o = {}) {
    g = g.index ? g.toNonIndexed() : g;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (o.uv) worldUV(g, o.uv); else if (!g.attributes.uv) worldUV(g, 0.25);
    colorize(g, o.col ? (o.col.isColor ? o.col : new T.Color(o.col)) : WHITE);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    (this.parts[key] ||= []).push(g); return g;
  }
  build(group, shadows) {
    for (const [k, list] of Object.entries(this.parts)) {
      // juda katta bo'laklarni bo'lib birlashtiramiz (frustum culling uchun)
      for (let i = 0; i < list.length; i += 400) {
        const geo = mergeGeometries(list.slice(i, i + 400), false); if (!geo) continue; geo.computeBoundingSphere();
        const m = new T.Mesh(geo, this.mats[k]); m.castShadow = shadows && !/glow|water|lamp/.test(k); m.receiveShadow = shadows; m.matrixAutoUpdate = false; group.add(m);
      }
    }
  }
}

const box = (w, h, d) => new T.BoxGeometry(w, h, d);
function frustum(w, h, d, sh) { const g = box(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * (1 - sh / w * 2)); p.setZ(i, p.getZ(i) * (1 - sh / d * 2)); } g.computeVertexNormals(); return g; }
function archPts(w, h, n = 10) { // uchli arka (peshtoq)
  const pts = [], r = w * 0.62, sh = h - w * 0.62; pts.push([w / 2, 0], [w / 2, sh]);
  for (let i = 1; i <= n; i++) { const a = i / n * Math.acos((r - w / 2) / r); pts.push([w / 2 - r + r * Math.cos(a), sh + r * Math.sin(a)]); }
  const top = pts[pts.length - 1]; pts.push([0, Math.max(top[1], h)]);
  const left = pts.slice(0, -1).reverse().map(([x, y]) => [-x, y]); return pts.concat(left);
}
function jitterIco(r, det, seed, amp) { const g = new T.IcosahedronGeometry(r, det), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453; const k = 1 + (h - Math.floor(h) - 0.5) * amp; p.setXYZ(i, x * k, y * k, z * k); } g.computeVertexNormals(); return g; }
function plateTexture(seed) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = TX.rng(seed + 5); const cols = [['#0c4f8a', '#2fb3c9'], ['#1a6fa8', '#7fd3e0'], ['#0e5c6e', '#3cc6b8']][seed % 3]; g.fillStyle = cols[0]; g.fillRect(0, 0, 128, 128); g.translate(64, 64); for (let k = 0; k < 5; k++) { g.strokeStyle = k % 2 ? cols[1] : '#e9f4f2'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 60 - k * 11, 0, 7); g.stroke(); const n = 6 + k * 2; for (let i = 0; i < n; i++) { g.save(); g.rotate(i * Math.PI * 2 / n + r()); g.fillStyle = k % 2 ? '#e9f4f2' : cols[1]; g.beginPath(); g.ellipse(54 - k * 11, 0, 4, 2.5, 0, 0, 7); g.fill(); g.restore(); } } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }

/* ---------------- relyef ---------------- */
function hash2(x, z) { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf); const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function makeHeight(land) {
  return (x, z) => {
    const d = Math.max(Math.abs(x), Math.abs(z)); const k = Math.min(1, Math.max(0, (d - 150) / 140)); if (k <= 0) return 0;
    const s = k * k * (3 - 2 * k); let h = 0;
    if (land === 'desert') h = (Math.sin(x * 0.045 + Math.sin(z * 0.02) * 2) * 0.5 + 0.5) * 9 + vnoise(x * 0.02, z * 0.02) * 6;
    else if (land === 'mountains' || land === 'hills') h = vnoise(x * 0.012, z * 0.012) * (land === 'hills' ? 26 : 34) + vnoise(x * 0.04, z * 0.04) * 5;
    else if (land === 'valley') h = vnoise(x * 0.015, z * 0.015) * 18;
    else h = vnoise(x * 0.02, z * 0.02) * 4;
    return h * s;
  };
}

/* ---------------- asosiy quruvchi ---------------- */
export function buildRegion(R, opt = {}) {
  const Q = opt.quality ?? 1, rnd = TX.rng([...R.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0), r = rnd, S = R.style;
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const group = new T.Group(); group.name = 'region';
  const C = new Colliders();
  const heightAt = makeHeight(R.land);
  const wallT = TX.wallTex(), brickT = TX.brickTex();
  const P = (n, rep, extra = {}) => { const t = TX.pbr(n); return new T.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, aoMap: t.aoMap, roughnessMap: t.roughnessMap, normalScale: new T.Vector2(1, 1), vertexColors: true, roughness: 1, ...extra }); };
  const mats = {
    wall: P('plaster'), wall2: P('plaster2'),
    brick: P('brick'),
    tile: new T.MeshStandardMaterial({ map: TX.tileTex(S.tile, S.tile2), normalMap: TX.pbr('stone').normalMap, normalScale: new T.Vector2(0.15, 0.15), vertexColors: true, roughness: 0.28, metalness: 0.05 }),
    tile2: new T.MeshStandardMaterial({ map: TX.tileTex(S.tile2, S.tile), normalMap: TX.pbr('stone').normalMap, normalScale: new T.Vector2(0.15, 0.15), vertexColors: true, roughness: 0.28, metalness: 0.05 }),
    dome: new T.MeshStandardMaterial({ map: TX.domeTex(S.tile, S.tile2), vertexColors: true, roughness: 0.22, metalness: 0.1 }),
    band: new T.MeshStandardMaterial({ map: TX.bandTex(), vertexColors: true, roughness: 0.35 }),
    wood: P('wood'), bark: P('bark'),
    door: new T.MeshStandardMaterial({ map: TX.doorTex(), vertexColors: true, roughness: 0.75 }),
    dark: new T.MeshStandardMaterial({ color: '#1c130d', roughness: 1 }),
    plain: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    clay: P('plaster', 1, { color: '#c99a78' }),
    metal: new T.MeshStandardMaterial({ color: '#2a2724', roughness: 0.45, metalness: 0.7, vertexColors: true }),
    gold: new T.MeshStandardMaterial({ color: '#d9a640', roughness: 0.3, metalness: 1 }),
    wheat: new T.MeshStandardMaterial({ map: TX.wheatCard(), alphaTest: 0.35, side: T.DoubleSide, vertexColors: true, roughness: 0.9 }),
    flower: new T.MeshStandardMaterial({ map: TX.flowerCard(), alphaTest: 0.4, side: T.DoubleSide, vertexColors: true, roughness: 0.8 }),
    leaf: new T.MeshStandardMaterial({ map: TX.leafCard(0), alphaTest: 0.45, side: T.DoubleSide, vertexColors: true, roughness: 0.8 }),
    blob: new T.MeshStandardMaterial({ map: TX.leafTex(), vertexColors: true, roughness: 0.85 }),
    stone: P('cobble'), sandstone: P('stone'), earth: P(R.land === 'desert' ? 'sand' : 'ground'),
    lamp: new T.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: 0, roughness: 0.5 }),
    win: new T.MeshStandardMaterial({ color: '#24170e', emissive: '#ff9440', emissiveIntensity: 0, roughness: 0.9 }),
    fire: new T.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.9 }),
    cloth: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide }),
  };
  for (let i = 0; i < 4; i++) mats['awn' + i] = new T.MeshStandardMaterial({ map: TX.awningTex(i), roughness: 0.95, side: T.DoubleSide, vertexColors: true });
  for (let i = 0; i < 3; i++) mats['carpet' + i] = new T.MeshStandardMaterial({ map: i === 0 ? TX.realCarpet() : TX.carpetTex(i), roughness: 0.95, side: T.DoubleSide, vertexColors: true });
  for (let i = 0; i < 3; i++) mats['plate' + i] = new T.MeshStandardMaterial({ map: plateTexture(i), roughness: 0.25, metalness: 0.05, vertexColors: true });
  for (const [i, f] of ['atlas', 'adras', 'atlas'].entries()) mats['fab' + i] = new T.MeshStandardMaterial({ map: TX.fabricTex(f, i), roughness: 0.6, side: T.DoubleSide, vertexColors: true });
  const B = new Batch(mats);
  const wallCol = new T.Color(S.wall).lerp(new T.Color('#ffffff'), 0.55).multiplyScalar(1.05), wallCol2 = new T.Color(S.wall2).lerp(new T.Color('#ffffff'), 0.5);
  const tint = (c, v = 0.08) => { const k = 1 + (r() - 0.5) * v * 2; return c.clone().multiplyScalar(k); };
  const A = { carts: [], tools: [], realTrees: [], props: [], stalls: [], doors: [], ladderRoofs: [], lanterns: [], horses: [], trees: [], benches: [], extras: {} };
  const pois = [], npcs = [], fx = { fires: [], smoke: [], water: [] };
  const poi = (o) => { pois.push(o); return o; };
  const prop = (id, x, y, z, ry = 0, s = 1, o = {}) => A.props.push({ id, x, y, z, ry, s, ...o });
  const pick = (a) => a[Math.floor(r() * a.length)];

  // lokal koordinata (90° burchaklar)
  const L = (cx, cz, rot = 0) => {
    const c = Math.round(Math.cos(rot)), s = Math.round(Math.sin(rot));
    const p = (x, z) => [cx + x * c + z * s, cz - x * s + z * c];
    return {
      p, rot,
      add(key, g, x, y, z, o = {}) { tf(g, 0, 0, 0, o.ry || 0, o.rx || 0, o.rz || 0); const [wx, wz] = p(x, z); tf(g, wx, y, wz, rot); B.add(key, g, o); return g; },
      col(x, z, w, d, top, bot) { const [wx, wz] = p(x, z); const sw = Math.abs(c) ? w : d, sd = Math.abs(c) ? d : w; return C.add(wx - sw / 2, wz - sd / 2, wx + sw / 2, wz + sd / 2, top, bot); },
    };
  };
  const W0 = L(0, 0, 0);

  /* ----- elementlar ----- */
  function lantern(x, y, z, ry) { W0.add('wood', box(0.06, 0.06, 0.5), x, y + 0.25, z, { ry, col: '#555' }); const lx = x + Math.sin(ry) * 0.45, lz = z + Math.cos(ry) * 0.45; const g = W0.add('lamp', new T.SphereGeometry(0.07, 8, 6), lx, y - 0.12, lz); prop('Lantern_01', lx, y - 0.32, lz, ry, 0.9); A.lanterns.push(new T.Vector3(x + Math.sin(ry) * 0.45, y, z + Math.cos(ry) * 0.45)); return g; }
  function pot(x, z, s = 1, y = 0) { if (Q > 0 || true) { prop(pick(['ceramic_vase_01', 'ceramic_vase_03', 'antique_ceramic_vase_01', 'jug_01', 'planter_pot_clay', 'brass_vase_01']), x, y, z, r() * 6.28, s * (0.9 + r() * 0.4)); return; } const pts = [[0, 0], [0.18, 0.02], [0.28, 0.25], [0.24, 0.5], [0.1, 0.62], [0.09, 0.72], [0.13, 0.76]].map(([a, b]) => new T.Vector2(a * s, b * s)); W0.add('clay', new T.LatheGeometry(pts, 10), x, y, z, { col: tint(new T.Color('#c58a5e'), 0.15) }); }
  function ladder(x, z, ry, h) { if (h < 7) { prop('wooden_ladder', x, 0, z, ry, h / 3.0, { rx: -0.18 }); return; } const LL = L(x, z, 0); for (const sx of [-0.28, 0.28]) LL.add('wood', box(0.07, h + 0.8, 0.07), sx * Math.cos(ry), (h + 0.8) / 2, -sx * Math.sin(ry), { ry, rx: 0, col: '#8a6a48' }); for (let y = 0.35; y < h + 0.6; y += 0.4) LL.add('wood', box(0.6, 0.05, 0.05), 0, y, 0, { ry, col: '#8a6a48' }); }
  function carpetOnWall(x, y, z, ry, w = 1.4, h = 2) { W0.add('carpet' + ri(0, 2), new T.PlaneGeometry(w, h), x, y, z, { ry }); }
  function crown(x, y, z, R0, n, col, sq = 1) { // barg kartalari: har bir to'p — 3 ta kesishgan tekislik
    for (let k = 0; k < n; k++) {
      const a = r() * 6.28, d = Math.pow(r(), 0.5) * R0, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = y + (r() - 0.35) * R0 * 0.9 * sq;
      const sz = R0 * (0.75 + r() * 0.5), c = tint(new T.Color(col), 0.16).multiplyScalar(0.85 + (py - y + R0) / (R0 * 4));
      for (let j = 0; j < 3; j++) { const g = new T.PlaneGeometry(sz, sz * sq); W0.add('leaf', g, px, py, pz, { ry: r() * 6.28, rx: (r() - 0.5) * 1.2, rz: (r() - 0.5) * 0.8, col: c }); }
    }
  }
  function tree(x, z, s = 1, kind = 'tut') {
    if (Math.abs(x) < 3.5 && Math.abs(z) > 4) return; // ko'cha o'rtasiga emas
    const y0 = heightAt(x, z);
    if (opt.realTrees) { const id = kind === 'terak' ? null : kind === 'chinor' ? 'jacaranda_tree' : kind === 'anor' ? 'island_tree_01' : (r() < 0.5 ? 'island_tree_01' : 'tree_small_02'); if (id) { const sc = { jacaranda_tree: 0.42, island_tree_01: 1.15, tree_small_02: 1.05 }[id] * s * (0.85 + r() * 0.3); A.realTrees.push({ id, x, y: y0, z, s: sc, ry: r() * 6.28 }); C.add(x - 0.3 * s, z - 0.3 * s, x + 0.3 * s, z + 0.3 * s, y0 + 6, y0 - 1); A.trees.push([x, z, s]); return; } }
    if (kind === 'terak') {
      W0.add('bark', new T.CylinderGeometry(0.1 * s, 0.22 * s, 10 * s, 7), x, y0 + 5 * s, z, { uv: 0, col: '#d8d0c0' });
      for (let i = 0; i < 7; i++) crown(x, y0 + (3.5 + i * 1.1) * s, z, (1.25 - Math.abs(i - 3) * 0.12) * s, 3, '#a9bc70', 1.3);
    } else {
      const th = 2.4 * s; W0.add('bark', new T.CylinderGeometry(0.16 * s, 0.3 * s, th, 8), x, y0 + th / 2, z, { uv: 0, col: '#ffffff' });
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.28 + r(); W0.add('bark', new T.CylinderGeometry(0.05 * s, 0.13 * s, 2.0 * s, 6), x + Math.cos(a) * 0.55 * s, y0 + th + 0.55 * s, z + Math.sin(a) * 0.55 * s, { rz: Math.cos(a) * 0.65, rx: -Math.sin(a) * 0.65, uv: 0, col: '#ffffff' }); }
      const base = kind === 'chinor' ? '#b8cc7c' : kind === 'anor' ? '#9fb466' : '#c2d084';
      crown(x, y0 + th + 1.5 * s, z, 2.3 * s, Q > 0 ? 16 : 8, base);
      if (kind === 'anor') for (let k = 0; k < 10; k++) { const a = r() * 6.28; W0.add('plain', new T.SphereGeometry(0.1, 6, 4), x + Math.cos(a) * 1.6 * s, y0 + th + 0.6 + r() * 1.6, z + Math.sin(a) * 1.6 * s, { col: '#b3262a' }); }
    }
    C.add(x - 0.3 * s, z - 0.3 * s, x + 0.3 * s, z + 0.3 * s, y0 + 6, y0 - 1); A.trees.push([x, z, s]);
  }
  function tapchan(x, z, ry, withTea = true) {
    const LL = L(x, z, 0);
    LL.add('wood', box(2.2, 0.45, 1.8), 0, 0.42, 0, { ry, col: '#7a5534' });
    for (const [a, b] of [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]]) LL.add('wood', box(0.12, 0.4, 0.12), a * Math.cos(ry) + b * Math.sin(ry), 0.2, -a * Math.sin(ry) + b * Math.cos(ry), { col: '#5d3f26' });
    // panjara (suyanchiq)
    for (let i = -5; i <= 5; i++) LL.add('wood', box(0.05, 0.45, 0.05), i * 0.2 * Math.cos(ry) - 0.85 * Math.sin(ry), 0.85, -i * 0.2 * Math.sin(ry) - 0.85 * Math.cos(ry), { col: '#7a5534' });
    LL.add('carpet' + ri(0, 2), new T.PlaneGeometry(2.0, 1.6), 0, 0.66, 0, { rx: -Math.PI / 2, ry, });
    for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.65; LL.add('carpet' + ri(0, 2), tf(new T.SphereGeometry(0.28, 10, 6), 0, 0, 0, 0, 0, 0, 1.2, 0.45, 0.8), a * Math.cos(ry) - 0.6 * Math.sin(ry), 0.78, -a * Math.sin(ry) - 0.6 * Math.cos(ry), { ry }); }
    if (withTea) { prop('tea_set_01', x, 0.67, z, ry + r(), 1.0); prop('carved_wooden_plate', x + 0.5 * Math.cos(ry), 0.67, z - 0.5 * Math.sin(ry), r() * 6, 1.0); }
    C.add(x - 1.1, z - 1.1, x + 1.1, z + 1.1, 0.66, -1); A.benches.push({ x, z, ry });
  }
  function stall(x, z, ry, goods, seed) {
    const LL = L(x, z, 0), c = Math.cos(ry), s = Math.sin(ry), P = (a, b) => [a * c + b * s, -a * s + b * c];
    for (const [a, b] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) { const [px, pz] = P(a, b); LL.add('wood', box(0.1, b > 0 ? 2.5 : 2.9, 0.1), px, (b > 0 ? 2.5 : 2.9) / 2, pz, { col: '#7a5a3c' }); }
    const aw = new T.PlaneGeometry(3, 2.2, 6, 4), ap = aw.attributes.position; for (let i = 0; i < ap.count; i++) ap.setZ(i, -Math.sin((ap.getY(i) / 2.2 + 0.5) * Math.PI) * 0.18); aw.computeVertexNormals();
    LL.add('awn' + (seed % 4), aw, 0, 2.72, 0, { rx: -Math.PI / 2 + 0.18, ry });
    LL.add('wood', box(2.6, 0.08, 1.2), ...P(0, 0.2).flatMap((v, i) => i ? [0.9, v] : [v]), { ry, col: '#8a6542' });
    { const [px, pz] = P(0, 0.2); LL.add('wood', box(2.5, 0.85, 1.1), px, 0.42, pz, { ry, col: '#6e5034' }); }
    const top = 0.95;
    const put = (fn) => { for (let i = 0; i < 6; i++) { const [px, pz] = P(-1 + (i % 3) * 1, -0.1 + Math.floor(i / 3) * 0.55); fn(px, pz, i); } };
    if (goods === 'qovun') put((px, pz, i) => { W0.add('plain', tf(new T.SphereGeometry(0.22, 10, 8), 0, 0, 0, 0, 0, 0, 1.35, 1, 1), x + px, top + 0.2, z + pz, { col: i % 2 ? '#d9c25a' : '#7fa34a' }); W0.add('plain', new T.SphereGeometry(0.17, 8, 6), x + px + 0.25, top + 0.15, z + pz, { col: '#e2c560' }); });
    else if (goods === 'non') put((px, pz) => { for (let k = 0; k < 4; k++) W0.add('plain', new T.CylinderGeometry(0.26, 0.24, 0.06, 14), x + px, top + 0.04 + k * 0.065, z + pz, { col: k === 3 ? '#c98a3e' : '#d39a50' }); W0.add('plain', new T.CylinderGeometry(0.12, 0.12, 0.02, 12), x + px, top + 0.3, z + pz, { col: '#e8c48a' }); });
    else if (goods === 'lagan') { put((px, pz, i) => { W0.add('plate' + (i % 3), new T.CylinderGeometry(0.28, 0.2, 0.05, 20), x + px, top + 0.05, z + pz, {}); }); for (let i = 0; i < 4; i++) { const [px, pz] = P(-1.1 + i * 0.73, 0.85); W0.add('plate' + (i % 3), new T.CylinderGeometry(0.32, 0.32, 0.04, 20), x + px, 1.4, z + pz, { rx: Math.PI / 2 - 0.15, ry: ry + Math.PI }); } }
    else if (goods === 'atlas') { for (let i = 0; i < 4; i++) { const [px, pz] = P(-1.05 + i * 0.7, 0.85); W0.add('fab' + (i % 3), new T.PlaneGeometry(0.62, 2.1), x + px, 1.4, z + pz, { ry }); } put((px, pz, i) => W0.add('fab' + (i % 3), box(0.5, 0.18, 0.4), x + px, top + 0.1, z + pz, { ry })); }
    else if (goods === 'doppi' || goods === 'kiyim' || goods === 'mahsi') put((px, pz, i) => { if (goods === 'mahsi') W0.add('plain', box(0.14, 0.12, 0.34), x + px, top + 0.07, z + pz, { col: i % 2 ? '#2a1d16' : '#6b3f22', ry }); else if (goods === 'doppi') W0.add('plain', new T.CylinderGeometry(0.12, 0.13, 0.12, 4), x + px, top + 0.07, z + pz, { ry: Math.PI / 4, col: ['#141414', '#5a1530', '#163a2a'][i % 3] }); else W0.add('fab' + (i % 3), box(0.55, 0.12, 0.45), x + px, top + 0.06, z + pz, { ry }); });
    else if (goods === 'gilam') { for (let i = 0; i < 3; i++) { const [px, pz] = P(-0.9 + i * 0.9, 0.85); W0.add('carpet' + i, new T.PlaneGeometry(0.85, 2.1), x + px, 1.4, z + pz, { ry }); } put((px, pz, i) => W0.add('carpet' + (i % 3), new T.CylinderGeometry(0.15, 0.15, 0.9, 8), x + px, top + 0.15, z + pz, { rz: Math.PI / 2, ry })); }
    else if (goods === 'ziravor') put((px, pz, i) => { W0.add('wood', new T.CylinderGeometry(0.22, 0.18, 0.12, 10), x + px, top + 0.06, z + pz, { col: '#a07850' }); W0.add('plain', new T.ConeGeometry(0.2, 0.22, 10), x + px, top + 0.22, z + pz, { col: ['#c0392b', '#e1a23a', '#7a4a2a', '#d9c25a', '#5a3a2a', '#9a2a1a'][i] }); });
    else if (goods === 'qurol') { const W = ['antique_estoc', 'wooden_handle_saber', 'machete', 'ornate_medieval_dagger', 'wooden_axe']; put((px, pz, i) => prop(W[i % W.length], x + px, top + 0.03, z + pz, ry + Math.PI / 2, 1, { rx: Math.PI / 2 })); for (let i = 0; i < 3; i++) { const [px, pz] = P(-0.9 + i * 0.9, 0.85); prop('kite_shield', x + px, 1.0, z + pz, ry + Math.PI, 0.9); } }
    else put((px, pz, i) => pot(x + px, z + pz, 0.55, top));
    { const [px, pz] = P(-1.6, -0.6); prop(pick(['wicker_basket_01', 'wicker_basket_02', 'wooden_crate_01', 'wooden_crate_02', 'barrel_03']), x + px, 0, z + pz, r() * 6, 0.9); const [qx, qz] = P(1.6, -0.5); if (r() < 0.6) prop(pick(['wooden_crate_01', 'wooden_crate_02', 'wooden_bucket_01', 'wooden_bucket_02', 'jug_01', 'metal_jug']), x + qx, 0, z + qz, r() * 6, 1); if (goods === 'qovun' || goods === 'ziravor') { const [bx, bz] = P(0.6, -0.25); prop('wicker_basket_02', x + bx, 0.95, z + bz, r() * 6, 0.6); for (let k = 0; k < 4; k++) prop(goods === 'qovun' ? pick(['food_pomegranate_01', 'food_apple_01', 'lemon']) : 'yellow_onion', x + bx + (r() - 0.5) * 0.25, 1.08, z + bz + (r() - 0.5) * 0.25, r() * 6, 1.1); } }
    const [fx_, fz_] = P(0, -0.2); C.add(x + P(0, 0.2)[0] - 1.35, z + P(0, 0.2)[1] - 0.7, x + P(0, 0.2)[0] + 1.35, z + P(0, 0.2)[1] + 0.7, 0.95, -1);
    const [kx, kz] = P(0, 1.35); const butcher = goods === 'kiyim' && r() < 0.5; npcs.push({ x: x + kx, z: z + kz, ry: ry + Math.PI, role: 'sotuvchi', pose: butcher ? 'cut' : 'stand', tool: butcher ? 'pichoq' : null, goods });
    if (butcher) { const [bx, bz] = P(0.6, 0.2); A.tools.push({ kind: 'pichoq', x: x + bx, y: 0.97, z: z + bz, rx: -Math.PI / 2, ry: ry, s: 1 }); }
    const st = { x: x + fx_ - Math.sin(ry) * 0.0, z: z + fz_, goods, ry }; A.stalls.push(st);
    const [ex, ez] = P(0, -1.2);
    return poi({ x: x + ex, y: 0, z: z + ez, r: 1.9, kind: 'stall', goods, stall: st });
  }
  function cart(x, z, ry) {
    const LL = L(x, z, 0), c = Math.cos(ry), s = Math.sin(ry);
    for (const side of [-1, 1]) { const wx = side * 1.0 * c, wz = -side * 1.0 * s; LL.add('wood', new T.TorusGeometry(0.85, 0.07, 6, 18), wx, 0.9, wz, { ry: ry + Math.PI / 2, col: '#6b4a2e' }); for (let k = 0; k < 8; k++) LL.add('wood', box(0.05, 1.6, 0.05), wx, 0.9, wz, { ry, rx: k * Math.PI / 8, col: '#6b4a2e' }); LL.add('wood', new T.CylinderGeometry(0.12, 0.12, 0.3, 10), wx, 0.9, wz, { ry, rz: Math.PI / 2, col: '#5d3f26' }); }
    LL.add('wood', new T.CylinderGeometry(0.05, 0.05, 2.1, 8), 0, 0.9, 0, { ry, rz: Math.PI / 2, col: '#4a321e' });
    LL.add('wood', box(1.9, 0.12, 2.4), 0, 1.25, 0, { ry, col: '#8a6542' }); for (const side of [-1, 1]) LL.add('wood', box(0.08, 0.35, 2.4), side * 0.95 * c, 1.45, -side * 0.95 * s, { ry, col: '#7a5534' });
    for (const side of [-1, 1]) LL.add('wood', box(0.08, 0.08, 2.6), side * 0.55 * c + 2.2 * s, 0.9, -side * 0.55 * s + 2.2 * c, { ry, rx: 0.25, col: '#7a5534' });
    C.add(x - 1.3, z - 1.3, x + 1.3, z + 1.3, 1.3, -1);
  }
  function parkedCart(x, z, ry) { A.carts.push({ x, z, ry }); }
  function haystack(x, z) { W0.add('earth', tf(jitterIco(1.1, 3, x, 0.12), 0, 0, 0, 0, 0, 0, 1.2, 0.75, 1.2), x, 0.5, z, { uv: 1.2, col: '#f2d68a' }); }

  /* ----- uy ----- */
  function house(x0, z0, x1, z1, sides) {
    const w = x1 - x0, d = z1 - z0; if (w < 3 || d < 3) return;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = 3.6 + r() * 2.6 + (R.id === 'xorazm' ? 1 : 0);
    const col = tint(r() < 0.5 ? wallCol : wallCol2, 0.06);
    W0.add(r() < 0.3 ? 'wall2' : 'wall', box(w, h, d), cx, h / 2, cz, { uv: 0.33, col });
    W0.add('wall', box(w + 0.3, 0.3, d + 0.3), cx, h + 0.15, cz, { uv: 0.33, col: col.clone().multiplyScalar(0.9) });
    W0.add('sandstone', box(w + 0.12, 0.55, d + 0.12), cx, 0.27, cz, { uv: 0.4, col: '#e8dcc8' }); // pastki namlik izi
    C.add(x0 - 0.15, z0 - 0.15, x1 + 0.15, z1 + 0.15, h + 0.3);
    const faces = [['s', cx, z1, 0, w], ['n', cx, z0, Math.PI, w], ['e', x1, cz, Math.PI / 2, d], ['w', x0, cz, -Math.PI / 2, d]];
    let doorDone = false, ladderDone = false;
    for (const [k, fx0, fz0, ry, len] of faces) {
      if (!sides[k]) continue; const nx = Math.sin(ry), nz = Math.cos(ry), tx = Math.cos(ry), tz = -Math.sin(ry);
      const at = (u, y, off = 0) => [fx0 + tx * u + nx * off, y, fz0 + tz * u + nz * off];
      if (!doorDone && len > 3.4) {
        const u = (r() - 0.5) * (len - 3); doorDone = true;
        let [px, py, pz] = at(u, 1.45, 0.12); W0.add('wall', box(2.0, 2.9, 0.24), px, py, pz, { ry, uv: 0.22, col: col.clone().multiplyScalar(0.85) });
        [px, py, pz] = at(u, 1.15, 0.25); W0.add('door', new T.PlaneGeometry(1.3, 2.3), px, py, pz, { ry });
        [px, py, pz] = at(u, 2.42, 0.3); W0.add('wood', box(1.7, 0.16, 0.2), px, py, pz, { ry, col: '#6a4a2e' });
        // eshik usti arka panjarasi
        [px, py, pz] = at(u, 2.7, 0.25); W0.add('dark', new T.CircleGeometry(0.62, 12, 0, Math.PI), px, py, pz, { ry });
        const dp = at(u, 0, 1.4); A.doors.push({ x: dp[0], z: dp[2], ry, h });
        if (r() < 0.45) { const lp = at(u + 1.15, 2.3, 0.15); lantern(lp[0], lp[1], lp[2], ry); }
        if (r() < 0.4) { const pp = at(u - 1.4, 0, 0.5); pot(pp[0], pp[2], 0.9); }
        if (r() < 0.08) { const pp = at(u - 2.4, 0, 0.25); A.tools.push({ kind: pick(['ketmon', 'xaskash', 'vila']), x: pp[0], y: 0, z: pp[2], rx: 0.18, ry: ry, s: 1 }); }
        if (r() < 0.12) { const pp = at(u - 1.3, 0, 0.6); prop(pick(['wooden_stool_01', 'WoodenTable_01', 'wooden_bucket_02']), pp[0], 0, pp[2], r() * 6, 1); }
        if (r() < 0.1) { const pp = at(u + 2.2, 0, 0.3); prop('brass_diya_lantern', pp[0], 0, pp[2], ry, 1.2); }
        if (r() < 0.2) { const pp = at(u + 1.0, 0, 0.35); prop('wooden_broom', pp[0], 0, pp[2], ry + 0.2, 1, { rx: 0.2 }); }
        if (r() < 0.3) { const pp = at(u - 2.0, 0, 0.45); prop('potted_plant_02', pp[0], 0, pp[2], r() * 6, 0.8); }
        if (r() < 0.5) { const pp = at(u + 1.5, 0, 0.55); pot(pp[0], pp[2], 1.1); }
      }
      for (let u = -len / 2 + 0.8; u < len / 2 - 0.8; u += 2.2 + r() * 3) if (r() < 0.35) { const pp = at(u, 0, 0.25 + r() * 0.2); prop(r() < 0.55 ? 'grass_medium_01' : pick(['shrub_03', 'shrub_02', 'shrub_04']), pp[0], 0, pp[2], r() * 6, 0.5 + r() * 0.5); }
      if (r() < 0.08 && len > 3) { const u0 = (r() - 0.5) * (len - 3), wv = 2 + r() * 2.5; for (let k = 0; k < 5; k++) { const [px, py, pz] = at(u0 + (r() - 0.5) * wv, h - 0.4 - r() * 1.4, 0.14 + k * 0.03); W0.add('flower', new T.PlaneGeometry(1.4 + r(), 1.2 + r()), px, py, pz, { ry }); } }
      if (r() < 0.22 && len > 3) { const u0 = (r() - 0.5) * (len - 3), wv = 1.5 + r() * 2.5, hv = 1.2 + r() * (h * 0.5); for (let k = 0; k < 4; k++) { const [px, py, pz] = at(u0 + (r() - 0.5) * wv, h - hv / 2 + 0.1, 0.12 + k * 0.03); W0.add('leaf', new T.PlaneGeometry(wv * (0.5 + r() * 0.5), hv * (0.6 + r() * 0.5)), px, py, pz, { ry, col: tint(new T.Color('#a8bd78'), 0.15) }); } }
      const nWin = Math.floor(len / 4.5);
      for (let i = 0; i < nWin; i++) { if (r() < 0.4) continue; const u = -len / 2 + (i + 0.5) * len / nWin; const [px, py, pz] = at(u, h - 1.4, 0.04); W0.add(r() < 0.45 ? 'win' : 'dark', box(0.7, 0.9, 0.1), px, py, pz, { ry }); const [qx, qy, qz] = at(u, h - 1.4, 0.1); for (let j = -1; j <= 1; j++) W0.add('wood', box(0.05, 0.9, 0.05), qx + tx * j * 0.22, qy, qz + tz * j * 0.22, { col: '#5d3f26' }); }
      if (Q > 0) for (let u = -len / 2 + 0.5; u < len / 2 - 0.3; u += 0.9) { const [px, py, pz] = at(u, h - 0.25, 0.18); W0.add('wood', new T.CylinderGeometry(0.08, 0.08, 0.4, 5), px, py, pz, { rx: Math.PI / 2, ry, col: '#6b5038' }); }
      if (r() < 0.12 && len > 4) { const [px, py, pz] = at((r() - 0.5) * (len - 2), h * 0.5, 0.05); carpetOnWall(px, Math.max(1.4, py), pz, ry); }
      // ayvon (Farg'ona vodiysi, Toshkent): ustunli supa
      if (r() < S.balcony * 0.35 && len > 6) {
        const ow = Math.min(len - 1, 7), oh = Math.min(h - 0.3, 3.6); let [px, , pz] = at(0, 0, 1.2);
        W0.add('wood', box(ow, 0.22, 2.6), px, oh, pz, { ry, col: '#6e4e30' });
        for (let u = -ow / 2 + 0.3; u <= ow / 2 - 0.2; u += ow / 3 - 0.2) { const [qx, , qz] = at(u, 0, 2.3); W0.add('wood', new T.CylinderGeometry(0.1, 0.13, oh, 8), qx, oh / 2, qz, { col: '#8a6542' }); W0.add('wood', box(0.35, 0.25, 0.35), qx, oh - 0.12, qz, { col: '#6e4e30' }); C.add(qx - 0.15, qz - 0.15, qx + 0.15, qz + 0.15, oh); }
      }
      if (!ladderDone && r() < 0.16 && len > 3) { ladderDone = true; const u = (r() - 0.5) * (len - 2); const lp = at(u, 0, 0.45); ladder(lp[0], lp[2], ry, h); const roof = { x: cx, y: h + 0.3, z: cz, w, d }; A.ladderRoofs.push(roof); poi({ x: lp[0] + nx * 0.6, y: 0, z: lp[2] + nz * 0.6, r: 1.3, kind: 'ladder', top: { x: lp[0] - nx * 1.0, y: h + 0.3, z: lp[2] - nz * 1.0 }, label: 'Tomga chiqish' }); }
    }
    if (r() < S.domes * 0.45 && Math.min(w, d) > 5) { const rr = Math.min(w, d) * 0.28; W0.add('wall', new T.SphereGeometry(rr, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), cx, h + 0.3, cz, { uv: 0.25, col }); }
    if (r() < 0.25) haystack(cx + (r() - 0.5) * w * 0.5, cz + (r() - 0.5) * d * 0.5 + 0) ; // tomdagi xashak
  }

  /* ----- minora ----- */
  function minaret(x, z, h, rad, o = {}) {
    const mat = o.tile ? 'tile' : 'brick', y0 = o.y0 || 0;
    const shaft = new T.CylinderGeometry(rad * (o.taper ?? 0.62), rad, h, 24, 1); scaleUV(shaft, rad * 6.28 / (o.tile ? 1.2 : 2.2), h / (o.tile ? 1.2 : 2.2)); W0.add(mat, shaft, x, y0 + h / 2, z, { uv: 0, col: o.tile ? '#fff' : '#f0e0c8' });
    const nb = o.bands ?? Math.floor(h / 9);
    for (let i = 1; i <= nb; i++) { const yy = h * i / (nb + 1), rr = rad - (rad - rad * (o.taper ?? 0.62)) * (yy / h) + 0.04; const g = new T.CylinderGeometry(rr, rr, o.tile ? 2.2 : 0.9, 24, 1, true); scaleUV(g, Math.round(rr * 6.28 / 3), 1); W0.add(o.tile && i % 2 ? 'tile2' : 'band', g, x, y0 + yy, z); }
    const rt = rad * (o.taper ?? 0.62);
    if (o.cap !== false) {
      const cor = new T.CylinderGeometry(rt * 1.35, rt, 1.4, 24); scaleUV(cor, 6, 1); W0.add('brick', cor, x, y0 + h + 0.7, z, { col: '#f0e0c8' });
      W0.add('brick', new T.CylinderGeometry(rt * 1.35, rt * 1.35, 0.3, 24), x, y0 + h + 1.5, z, { col: '#e8d5b8' });
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; W0.add('brick', box(0.35, 2.6, 0.35), x + Math.cos(a) * rt * 1.2, y0 + h + 2.95, z + Math.sin(a) * rt * 1.2, { col: '#f0e0c8' }); }
      const tp = new T.CylinderGeometry(rt * 1.45, rt * 1.3, 1.0, 24); scaleUV(tp, 6, 1); W0.add('band', tp, x, y0 + h + 4.7, z);
      W0.add(o.tile ? 'dome' : 'brick', new T.SphereGeometry(rt * 1.2, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), x, y0 + h + 5.2, z, { col: o.tile ? '#fff' : '#e8d5b8' });
      A.minaretTop = A.minaretTop || { x, y: y0 + h + 1.65, z, r: rt * 1.1 };
      C.add(x - rt * 1.2, z - rt * 1.2, x + rt * 1.2, z + rt * 1.2, y0 + h + 1.65, y0 + h - 1);
    }
    C.add(x - rad * 0.85, z - rad * 0.85, x + rad * 0.85, z + rad * 0.85, y0 + h, -5);
    if (o.climb) poi({ x: x + rad + 1.2, y: 0, z, r: 2.2, kind: 'climb', top: { x, y: y0 + h + 1.7, z: z + 0.1 }, label: 'Minoraga chiqish' });
  }
  function dome(x, y, z, rad, o = {}) {
    const dr = new T.CylinderGeometry(rad * 1.02, rad * 1.04, rad * (o.drum ?? 0.55), 32); scaleUV(dr, Math.round(rad * 6.28 / 3), 1); W0.add(o.drumMat || 'band', dr, x, y + rad * (o.drum ?? 0.55) / 2, z);
    const g = new T.SphereGeometry(rad, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
    const ribbed = o.ribbed, el = o.el ?? 1.25;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i); const ph = Math.atan2(pz, px); const k = ribbed ? 1 + 0.045 * Math.abs(Math.cos(ph * 16)) : 1; p.setXYZ(i, px * k, py * el, pz * k); }
    g.computeVertexNormals(); W0.add(o.mat || 'dome', g, x, y + rad * (o.drum ?? 0.55), z, { col: o.col || '#fff' });
    const top = y + rad * (o.drum ?? 0.55) + rad * el; W0.add('gold', new T.CylinderGeometry(0.06, 0.06, 1.6, 6), x, top + 0.6, z); W0.add('gold', new T.SphereGeometry(0.22, 8, 6), x, top + 0.4, z); W0.add('gold', new T.SphereGeometry(0.15, 8, 6), x, top + 0.95, z);
  }
  function portal(LL, x, z, w, h, d, o = {}) {
    const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
    const aw = w * 0.58, ah = h * 0.78, hole = new T.Path(); archPts(aw, ah).forEach(([px, py], i) => (i ? hole.lineTo(px, py) : hole.moveTo(px, py))); hole.closePath(); sh.holes.push(hole);
    const g = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 4 }); scaleUV(g, 0.42, 0.42); tf(g, 0, 0, -d / 2);
    LL.add(o.mat || 'brick', g, x, 0, z, { uv: 0, col: '#ffffff' });
    if (!o.mat) { // koshin ramkalar: tashqi hoshiya, arka atrofi, yuqori burchaklar
      const fw = Math.min(1.1, w * 0.06), zf = z + d / 2 + 0.03;
      LL.add('tile', box(w - 0.2, fw, 0.08), x, h - 1.3 - fw / 2, zf, { uv: 0.9 }); LL.add('tile', box(fw, h - 1.4, 0.08), x - w / 2 + 0.1 + fw / 2, (h - 1.4) / 2, zf, { uv: 0.9 }); LL.add('tile', box(fw, h - 1.4, 0.08), x + w / 2 - 0.1 - fw / 2, (h - 1.4) / 2, zf, { uv: 0.9 });
      const ring = new T.Shape(), rh = new T.Path(), k = 1.12; archPts(aw * k, ah * 1.06).forEach(([px, py], i) => (i ? ring.lineTo(px, py) : ring.moveTo(px, py))); archPts(aw, ah).forEach(([px, py], i) => (i ? rh.lineTo(px, py) : rh.moveTo(px, py))); ring.holes.push(rh);
      const rg = new T.ShapeGeometry(ring); scaleUV(rg, 0.9, 0.9); LL.add('tile2', rg, x, 0, zf + 0.01, { uv: 0 });
      const sp = (w - aw * k) / 2 - fw; if (sp > 0.6) for (const sx of [-1, 1]) LL.add('tile', box(sp * 0.8, ah * 0.32, 0.08), x + sx * (aw * k / 2 + sp / 2), ah * 0.86, zf, { uv: 0.9 });
    }
    const back = new T.Shape(); archPts(aw, ah).forEach(([px, py], i) => (i ? back.lineTo(px, py) : back.moveTo(px, py)));
    const bg = new T.ShapeGeometry(back); scaleUV(bg, 1.0, 1.0); LL.add('tile2', bg, x, 0, z - d / 2 + 0.05, { uv: 0 });
    // muqarnas taqlidi: ichki yarim gumbaz
    const nq = new T.SphereGeometry(aw * 0.5, 16, 8, 0, Math.PI, 0, Math.PI / 2); scaleUV(nq, 8, 5); tf(nq, 0, 0, 0, Math.PI, 0, 0, 1, 1.25, 0.9); LL.add('tile', nq, x, ah - aw * 0.62, z - d / 2 + 0.06, { uv: 0 });
    LL.add('door', new T.PlaneGeometry(Math.min(2.6, aw * 0.5), 3.6), x, 1.8, z - d / 2 + 0.1);
    const bd = box(w + 0.2, 1.3, d + 0.2); scaleUV(bd, Math.max(1, Math.round(w / 6)), 1); LL.add('band', bd, x, h - 0.65, z, { uv: 0 });
    const fr = box(w + 0.1, 0.35, d + 0.1); LL.add('brick', fr, x, h + 0.17, z, { col: '#e8d5b8' });
    if (o.towers) for (const sx of [-1, 1]) { const [tx, tz] = LL.p(x + sx * (w / 2 + 0.2), z + d / 2 - 0.4); const tg = new T.CylinderGeometry(0.55, 0.65, h + 2.5, 12); scaleUV(tg, 3, (h + 2.5) / 1.2); W0.add('tile2', tg, tx, (h + 2.5) / 2, tz); W0.add('dome', new T.SphereGeometry(0.75, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), tx, h + 2.5, tz); }
    // kollayder: ikki ustun + tepa
    LL.col(x - w / 2 + (w - aw) / 4, z, (w - aw) / 2, d, h + 0.35); LL.col(x + w / 2 - (w - aw) / 4, z, (w - aw) / 2, d, h + 0.35);
  }
  function madrasa(cx, cz, rot, Wd, D, o = {}) {
    const LL = L(cx, cz, rot), H = o.H || 9, t = 4.5, mat = o.mat || 'brick', col = o.col || '#efe1cc';
    const wall = (x, z, w, d, h = H) => { LL.add(mat, box(w, h, d), x, h / 2, z, { uv: 0.22, col }); LL.add('band', scaleUV(box(w + 0.05, 0.8, d + 0.05), Math.max(1, Math.round(Math.max(w, d) / 8)), 1), x, h - 0.5, z, { uv: 0 }); LL.col(x, z, w, d, h + 0.2); };
    wall(0, -D / 2 + t / 2, Wd, t); wall(-Wd / 2 + t / 2, 0, t, D - 2 * t); wall(Wd / 2 - t / 2, 0, t, D - 2 * t);
    const pw = Math.min(Wd * 0.42, 22), side = (Wd - pw) / 2;
    wall(-Wd / 2 + side / 2, D / 2 - t / 2, side, t); wall(Wd / 2 - side / 2, D / 2 - t / 2, side, t);
    // old fasad: ikki qavat hujra arkalari
    for (const sx of [-1, 1]) for (let k = 0; k < Math.floor(side / 4.2); k++) for (let lv = 0; lv < 2; lv++) {
      const x = sx * (pw / 2 + 2.2 + k * 4.2), y = 1.6 + lv * 3.6; if (Math.abs(x) > Wd / 2 - 1.8) continue;
      const ar = new T.Shape(); archPts(2.2, 2.8).forEach(([a, b], i) => (i ? ar.lineTo(a, b) : ar.moveTo(a, b))); const ag = new T.ShapeGeometry(ar); LL.add('dark', ag, x, y - 1.3, D / 2 + 0.03);
      LL.add('tile2', box(2.6, 3.2, 0.1), x, y + 0.1, D / 2 + 0.0, { uv: 0.9 });
    }
    portal(LL, 0, D / 2 - 1.2, pw, H * (o.ph || 1.9), 3.4, { towers: o.ptowers });
    if (o.corner !== false) for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const [x, z] = LL.p(sx * Wd / 2, sz * D / 2); minaret(x, z, H + 4.5, 1.6, { cap: false, bands: 1, taper: 0.85 }); W0.add('dome', new T.SphereGeometry(1.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), x, H + 4.5, z); }
    if (o.domes) for (const [sx, sz] of o.domes) { const [x, z] = LL.p(sx * Wd * 0.3, sz * D * 0.3); dome(x, H, z, o.dr || 5, { ribbed: o.ribbed }); }
    const [gx, gz] = LL.p(0, 0); W0.add('stone', new T.PlaneGeometry(Wd - 2 * t, D - 2 * t), gx, 0.03, gz, { rx: -Math.PI / 2, ry: rot, uv: 0.45, col: '#cfc3b0' });
    if (o.trees !== false) { tree(gx - 5, gz, 0.9, 'tut'); tree(gx + 5, gz - 3, 0.8, 'anor'); }
    const [ex, ez] = LL.p(0, D / 2 + 3); return { x: ex, z: ez, cx, cz };
  }
  function hovuz(cx, cz, w, d, o = {}) {
    W0.add('sandstone', box(w + 2.4, 0.45, d + 2.4), cx, 0.22, cz, { uv: 0.5, col: '#ffffff' });
    const wg = new T.PlaneGeometry(w, d); tf(wg, 0, 0, 0, 0, -Math.PI / 2); tf(wg, cx, 0.3, cz);
    const wm = new T.Mesh(wg, opt.waterMat); wm.receiveShadow = true; group.add(wm); fx.water.push(wm);
    // zinapoyalar
    for (let i = 0; i < 3; i++) W0.add('stone', box(w - 2, 0.12, 0.5), cx, 0.45 - i * 0.1, cz - d / 2 - 0.9 + i * 0.4, { uv: 0.4, col: '#cdbd9e' });
    C.add(cx - w / 2 - 1.2, cz - d / 2 - 1.2, cx + w / 2 + 1.2, cz + d / 2 + 1.2, 0.45, -2);
    C.add(cx - w / 2 + 0.2, cz - d / 2 + 0.2, cx + w / 2 - 0.2, cz + d / 2 - 0.2, 1.4, -2);
    A.hovuz = { x: cx, z: cz, w, d };
  }
  function qozon(x, z) { // o'choq + qozon + olov + tutun
    W0.add('clay', new T.CylinderGeometry(1.0, 1.1, 0.9, 16), x, 0.45, z, { col: '#9a8a7a' });
    W0.add('dark', box(0.6, 0.45, 0.2), x, 0.25, z + 1.0, {});
    const q = new T.SphereGeometry(0.95, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); W0.add('metal', q, x, 1.0, z, {});
    W0.add('metal', new T.TorusGeometry(0.97, 0.05, 6, 24), x, 1.0, z, { rx: Math.PI / 2 });
    W0.add('plain', new T.CircleGeometry(0.88, 20), x, 0.92, z, { rx: -Math.PI / 2, col: '#c48a3c' }); // osh
    for (let k = 0; k < 4; k++) W0.add('wood', box(0.1, 0.1, 0.9), x + (k - 1.5) * 0.15, 0.15, z + 1.4, { ry: (k - 1.5) * 0.3, col: '#6b4a2e' });
    const fire = new T.Mesh(new T.ConeGeometry(0.25, 0.6, 8), mats.fire); fire.position.set(x, 0.3, z + 1.05); group.add(fire); fx.fires.push({ m: fire, x, y: 0.6, z: z + 1.05 });
    fx.smoke.push({ x, y: 1.2, z });
    C.add(x - 1.1, z - 1.1, x + 1.1, z + 1.1, 1.0, -1); A.qozon = { x, z }; prop('wooden_bucket_01', x + 1.5, 0, z + 0.4, 0, 1); prop('wooden_bowl_01', x - 1.4, 0.0, z + 0.6, 0, 1.2); prop('brass_pot_01', x - 1.5, 0, z - 0.6, 0, 1.1);
  }
  function tandir(x, z) { const g = tf(new T.SphereGeometry(0.9, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), 0, 0, 0, 0, 0, 0, 1, 1.2, 1); W0.add('clay', g, x, 0.4, z, { col: '#c79a72' }); W0.add('clay', new T.CylinderGeometry(0.95, 1.0, 0.45, 16), x, 0.22, z, { col: '#b48a66' }); W0.add('dark', new T.CircleGeometry(0.32, 12), x, 1.42, z, { rx: -Math.PI / 2 }); C.add(x - 1, z - 1, x + 1, z + 1, 1.45, -1); A.tandir = { x, z }; fx.smoke.push({ x, y: 1.5, z, thin: 1 }); }

  /* ----- shahar devori ----- */
  function cityWalls() {
    const H = R.landmarks.includes('walls_high') ? 10 : 8, mid = WALL_IN + WALL_T / 2, len = (WALL_IN + WALL_T) * 2;
    const seg = (x0, z0, x1, z1) => { const w = Math.abs(x1 - x0) || WALL_T, d = Math.abs(z1 - z0) || WALL_T; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; W0.add('wall', frustum(w, H, d, 0.6), cx, H / 2, cz, { uv: 0.33, col: tint(wallCol, 0.04) }); C.add(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, H + 2); const n = Math.floor(Math.max(w, d) / 2.2); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const mx = x0 + (x1 - x0) * t, mz = z0 + (z1 - z0) * t; const g = R.id === 'xorazm' ? new T.CylinderGeometry(0.6, 0.6, 1.1, 8, 1, false, 0, Math.PI) : box(1.1, 1.1, 0.8); W0.add('wall', g, mx + (w > d ? 0 : 0), H + 0.5, mz, { ry: w > d ? 0 : Math.PI / 2, uv: 0.33, col: tint(wallCol, 0.04) }); } };
    const g = 5; // darvoza yarim kengligi
    seg(-mid, -mid, -g, -mid); seg(g, -mid, mid, -mid); seg(-mid, mid, -g, mid); seg(g, mid, mid, mid); seg(-mid, -mid, -mid, mid); seg(mid, -mid, mid, mid);
    for (let t = -mid; t <= mid + 0.1; t += len / 8) for (const [x, z] of [[t, -mid], [t, mid], [-mid, t], [mid, t]]) { if (Math.abs(x) < 9 && Math.abs(z) > 100) continue; W0.add('wall', new T.CylinderGeometry(3.2, 3.9, H + 1, 14), x, (H + 1) / 2, z, { uv: 0.33, col: tint(wallCol, 0.04) }); C.add(x - 3.4, z - 3.4, x + 3.4, z + 3.4, H + 2); }
    for (const sz of [-1, 1]) { // darvozalar
      const z = sz * mid; for (const sx of [-1, 1]) { W0.add('wall', new T.CylinderGeometry(3.6, 4.4, H + 4, 16), sx * 8, (H + 4) / 2, z, { uv: 0.33, col: tint(wallCol, 0.04) }); C.add(sx * 8 - 4, z - 4, sx * 8 + 4, z + 4, H + 5); W0.add('band', scaleUV(new T.CylinderGeometry(3.7, 3.75, 0.9, 16, 1, true), 4, 1), sx * 8, H + 2.6, z); }
      W0.add('wall', box(9, 3, 5), 0, H + 0.5, z, { uv: 0.33, col: wallCol });
      W0.add('wood', box(4.2, 5.6, 0.3), -2.6, 2.8, z + sz * 2.3, { ry: sz * 0.9, col: '#5a3a20' }); W0.add('wood', box(4.2, 5.6, 0.3), 2.6, 2.8, z + sz * 2.3, { ry: -sz * 0.9, col: '#5a3a20' });
      lantern(-5.4, 4.2, z + sz * 2.6, sz > 0 ? 0 : Math.PI); lantern(5.4, 4.2, z + sz * 2.6, sz > 0 ? 0 : Math.PI);
      poi({ x: 0, y: 0, z: z + sz * 5.5, r: 4.5, kind: 'gate', label: 'Karvon yo\'li — boshqa viloyatga' });
      { const gx = 12, gz = z - sz * 6; W0.add('wood', box(2.4, 0.1, 0.4), gx, 1.6, gz, { col: '#6b4a2e' }); for (const dx of [-1.1, 1.1]) W0.add('wood', box(0.12, 1.8, 0.12), gx + dx, 0.9, gz, { col: '#6b4a2e' }); prop('kite_shield', gx - 0.6, 0.9, gz + 0.1, sz > 0 ? Math.PI : 0, 0.9); prop('antique_estoc', gx + 0.4, 0.05, gz + 0.12, 0, 1, { rx: -0.25 }); prop('wooden_handle_saber', gx + 0.8, 0.05, gz + 0.12, 0, 1, { rx: -0.25 }); prop('barrel_03', gx + 2, 0, gz, 0, 1); npcs.push({ x: gx - 1.8, z: gz - sz * 1.2, ry: sz > 0 ? 0 : Math.PI, role: 'posbon', pose: 'idle', name: 'Darvoza qorovuli' }); }
    }
    A.gateS = { x: 0, z: mid + 6 }; A.gateN = { x: 0, z: -mid - 6 };
  }

  /* ----- me'moriy yodgorliklar ----- */
  const LM = {
    kalon: () => { minaret(-14, -12, 46, 4.6, { climb: true, bands: 6 }); madrasa(14, -6, Math.PI / 2, 30, 34, { domes: [[0, -1]], dr: 6.5 }); madrasa(-14, 16, Math.PI, 26, 22, { H: 8, domes: [[-1, 0], [1, 0]], dr: 4.5, corner: false }); },
    ark: (cx, cz) => { W0.add('wall', frustum(40, 14, 34, 3), cx, 7, cz, { uv: 0.3, col: tint(wallCol2, 0.03) }); C.add(cx - 20, cz - 17, cx + 20, cz + 17, 14); for (const sx of [-1, 1]) { W0.add('wall', new T.CylinderGeometry(3.5, 4.5, 16, 14), cx + sx * 6, 8, cz + 17, { uv: 0.33, col: wallCol2 }); C.add(cx + sx * 6 - 4.5, cz + 13, cx + sx * 6 + 4.5, cz + 21.5, 16); } W0.add('wood', box(8, 3, 2), cx, 13, cz + 17.5, { col: '#6b4a2e' }); W0.add('wall', box(5, 1, 14), cx, 5, cz + 26, { rx: -0.35, uv: 0.33, col: wallCol2 }); for (let i = 0; i < 16; i++) W0.add('wall', box(1.2, 1.2, 0.9), cx - 18 + i * 2.4, 14.6, cz - 14.5, { uv: 0.33, col: wallCol2 }); },
    labihovuz: (cx, cz) => { madrasa(cx, cz - 22, 0, 26, 16, { H: 8, corner: false, trees: false }); },
    toqi: (cx, cz) => { for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { W0.add('brick', box(3.2, 6, 3.2), cx + sx * 7, 3, cz + sz * 7, { uv: 0.25, col: '#efe1cc' }); C.add(cx + sx * 7 - 1.6, cz + sz * 7 - 1.6, cx + sx * 7 + 1.6, cz + sz * 7 + 1.6, 6); dome(cx + sx * 7, 6, cz + sz * 7, 1.8, { mat: 'brick', drum: 0.3, el: 1, drumMat: 'brick', col: '#e8d5b8' }); } W0.add('brick', box(17, 1.2, 17), cx, 6.6, cz, { uv: 0.25, col: '#efe1cc' }); dome(cx, 7.2, cz, 6, { mat: 'brick', drum: 0.6, el: 0.9, drumMat: 'brick', col: '#e8d5b8' }); A.extras.toqi = { x: cx, z: cz }; },
    kaltaminor: () => { minaret(-16, -6, 26, 7.2, { tile: true, cap: false, bands: 4, taper: 0.88 }); W0.add('tile2', new T.CylinderGeometry(6.5, 6.4, 0.6, 24), -16, 26.3, -6); madrasa(10, -8, -Math.PI / 2, 30, 36, { domes: [[0, -1]], dr: 5, ptowers: true }); },
    islomxoja: (cx, cz) => { minaret(cx, cz, 44, 3.4, { climb: true, bands: 9 }); madrasa(cx + 12, cz + 2, -Math.PI / 2, 18, 18, { H: 7, corner: false, domes: [[0, 0]], dr: 3.6 }); },
    walls_high: () => {},
    rabot: () => { // Raboti Malik: qovurg'ali uzun devor
      const W = 56, H = 11; W0.add('brick', box(W, H, 5), 0, H / 2, -16, { uv: 0.45, col: '#ffffff' }); C.add(-W / 2, -18.5, W / 2, -13.5, H);
      for (let x = -W / 2 + 1; x < W / 2; x += 1.6) if (Math.abs(x) > 8) W0.add('brick', new T.CylinderGeometry(0.75, 0.75, H, 8, 1, false, 0, Math.PI), x, H / 2, -13.4, { ry: -Math.PI / 2, col: '#e8d5b8' });
      for (const sx of [-1, 1]) { W0.add('brick', new T.CylinderGeometry(3, 3.6, H + 1, 14), sx * W / 2, (H + 1) / 2, -16, { col: '#e8d5b8' }); C.add(sx * W / 2 - 3.6, -19.6, sx * W / 2 + 3.6, -12.4, H + 1); }
      portal(L(0, -13, 0), 0, 0, 14, 17, 3, { mat: 'brick' }); A.extras.rabot = { x: 0, z: -8 };
      dome(18, 0, 12, 5, { mat: 'brick', drumMat: 'brick', el: 0.9, col: '#e8d5b8' }); C.add(13, 7, 23, 17, 3.5); A.extras.sardoba = { x: 18, z: 18 };
    },
    minor_small: (cx, cz) => minaret(cx, cz, 30, 3, { climb: true }),
    registon: () => {
      madrasa(0, -24, 0, 44, 28, { domes: [[-1, -1], [1, -1]], dr: 5.5, ribbed: true, ph: 2.1, ptowers: true });
      madrasa(-28, 2, Math.PI / 2, 40, 26, { domes: [[0, -1]], dr: 6, ribbed: true, ph: 2 });
      madrasa(28, 2, -Math.PI / 2, 40, 26, { domes: [[0, -1]], dr: 6, ribbed: true, ph: 2 });
    },
    guramir: (cx, cz) => { W0.add('brick', box(14, 9, 14), cx, 4.5, cz, { uv: 0.45, col: '#ffffff' }); W0.add('tile', box(14.1, 2, 14.1), cx, 8, cz, { uv: 0.9 }); C.add(cx - 7, cz - 7, cx + 7, cz + 7, 9); dome(cx, 9, cz, 6.2, { ribbed: true, drum: 1.4, el: 1.35 }); minaret(cx - 8.5, cz + 8.5, 22, 1.7, { cap: false, bands: 3, tile: true }); minaret(cx + 8.5, cz + 8.5, 22, 1.7, { cap: false, bands: 3, tile: true }); A.extras.guramir = { x: cx, z: cz + 10 }; },
    oqsaroy: () => { for (const sx of [-1, 1]) { W0.add('tile', box(11, 34, 12), sx * 11, 17, -16, { uv: 0.8 }); W0.add('brick', box(11.2, 2, 12.2), sx * 11, 34.5, -16, { col: '#e8d5b8' }); C.add(sx * 11 - 5.5, -22, sx * 11 + 5.5, -10, 36); minaret(sx * 17.5, -9, 30, 2.4, { tile: true, cap: false, bands: 4 }); } W0.add('brick', box(11, 3, 12), 0, 1.5, -16, { col: '#c9b190' }); A.extras.oqsaroy = { x: 0, z: -6 }; madrasa(-26, 14, Math.PI / 2, 22, 20, { H: 7, corner: false, domes: [[0, -1]], dr: 4 }); },
    dorut: (cx, cz) => { W0.add('brick', box(12, 10, 12), cx, 5, cz, { uv: 0.45, col: '#ffffff' }); C.add(cx - 6, cz - 6, cx + 6, cz + 6, 10); dome(cx, 10, cz, 5, { ribbed: true }); portal(L(cx, cz + 6.5, 0), 0, 0, 10, 15, 2); },
    sultonsaodat: () => { for (let i = -2; i <= 2; i++) { const x = i * 9; W0.add('brick', box(8, 7, 8), x, 3.5, -18, { uv: 0.22, col: '#e8d2b0' }); C.add(x - 4, -22, x + 4, -14, 7); dome(x, 7, -18, 3.4, { mat: 'brick', drumMat: 'brick', el: 1.05, col: '#e2cba8' }); } portal(L(0, -13.4, 0), 0, 0, 10, 13, 2, { mat: 'brick' }); A.extras.ss = { x: 0, z: -8 }; madrasa(26, 10, -Math.PI / 2, 20, 20, { H: 7, corner: false, mat: 'brick', domes: [[0, 0]], dr: 3.6 }); },
    kirkkiz: (cx, cz) => { W0.add('wall', frustum(24, 9, 24, 1.2), cx, 4.5, cz, { uv: 0.33, col: wallCol2 }); C.add(cx - 12, cz - 12, cx + 12, cz + 12, 9); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { W0.add('wall', new T.CylinderGeometry(2.4, 3, 10, 12), cx + sx * 12, 5, cz + sz * 12, { uv: 0.33, col: wallCol2 }); } },
    temurdarvoza: () => { for (const sx of [-1, 1]) { const g = jitterIco(1, 2, sx * 5, 0.5); tf(g, 0, 0, 0, 0, 0, 0, 22, 34, 30); W0.add('plain', g, sx * 30, 8, -175, { col: '#9a8770' }); C.add(sx * 30 - 20, -205, sx * 30 + 20, -145, 60); } A.extras.darvoza = { x: 0, z: -175 }; madrasa(0, -18, 0, 30, 22, { H: 8, corner: false, domes: [[-1, -1], [1, -1]], dr: 3.6 }); },
    kopkari: () => { const cx = 0, cz = 175; for (let a = 0; a < Math.PI * 2; a += 0.08) { const x = cx + Math.cos(a) * 46, z = cz + Math.sin(a) * 46; if (Math.abs(Math.sin(a) + 1) < 0.05) continue; W0.add('wood', box(0.12, 1.1, 0.12), x, 0.55 + heightAt(x, z), z, { col: '#7a5a3c' }); } W0.add('plain', new T.RingGeometry(3.5, 4, 24), cx + 30, 0.05, cz, { rx: -Math.PI / 2, col: '#f2e3b8' }); A.extras.kopkari = { x: cx, z: cz, goal: { x: cx + 30, z: cz } }; },
    ariq: () => { for (const x of [-52, 52]) { const g = new T.PlaneGeometry(1.4, 200); tf(g, 0, 0, 0, 0, -Math.PI / 2); tf(g, x, 0.08, 0); const m = new T.Mesh(g, opt.waterMat); m.receiveShadow = true; group.add(m); fx.water.push(m); for (let z = -96; z < 100; z += 7) tree(x + (z % 14 ? 2 : -2), z, 0.9, 'terak'); } },
    sardoba: (cx, cz) => { dome(cx, 0, cz, 6, { mat: 'brick', drumMat: 'brick', drum: 0.4, el: 0.85, col: '#e2cba8' }); C.add(cx - 6, cz - 6, cx + 6, cz + 6, 7); A.extras.sardoba = { x: cx, z: cz + 8 }; },
    kokaldosh: () => { madrasa(0, -22, 0, 46, 30, { domes: [[-1, -1], [1, -1]], dr: 5, ph: 2, ptowers: true }); },
    chorsu: (cx, cz) => { LM.toqi(cx, cz); A.extras.chorsu = { x: cx, z: cz }; },
    mullaqirgiz: () => { madrasa(0, -22, 0, 36, 26, { domes: [[-1, -1], [1, -1]], dr: 3.6, ph: 2.2, ptowers: true, mat: 'brick' }); },
    gulbog: () => { const cols = ['#d9263b', '#f2c230', '#e86aa0', '#f5f0e6', '#8a3fd1']; for (let i = 0; i < 6; i++) { const x = -18 + (i % 3) * 18, z = 12 + Math.floor(i / 3) * 10; W0.add('plain', box(6, 0.3, 4), x, 0.15, z, { col: '#6b4f2e' }); for (let k = 0; k < 26; k++) W0.add('plain', new T.SphereGeometry(0.16, 6, 4), x - 2.6 + r() * 5.2, 0.45, z - 1.6 + r() * 3.2, { col: cols[(i + k) % 5] }); } A.extras.gulbog = { x: 0, z: 17 }; },
    xudoyorxon: () => { const W = 70, H = 11; W0.add('brick', box(W, H, 8), 0, H / 2 + 2, -22, { uv: 0.45, col: '#ffffff' }); W0.add('brick', box(W + 4, 2, 12), 0, 1, -22, { col: '#d8c3a0' }); C.add(-W / 2, -26, W / 2, -18, H + 2); W0.add('tile', box(W - 2, 5, 0.1), 0, 7, -17.9, { uv: 0.9 }); W0.add('tile2', box(W - 2, 1.6, 0.12), 0, 11.4, -17.85, { uv: 0.9 }); for (let x = -W / 2 + 4; x < W / 2; x += 8) if (Math.abs(x) > 8) { W0.add('dark', box(2, 3.2, 0.12), x, 4.4, -17.8); minaret(x, -17.6, H + 3, 0.6, { cap: false, bands: 0, taper: 1, tile: true }); } portal(L(0, -16.5, 0), 0, 0, 14, 19, 3, { towers: true }); W0.add('wall', box(10, 0.8, 10), 0, 0.4, -9, { rx: 0, uv: 0.33, col: '#d8c3a0' }); for (let i = 0; i < 4; i++) W0.add('stone', box(14, 0.5, 1.2), 0, 1.75 - i * 0.45, -17 + i * 1.2, { uv: 0.4 }); A.extras.xon = { x: 0, z: -6 }; },
    rishton: (cx, cz) => { // kulolchilik ustaxonasi
      W0.add('wall', box(10, 4, 7), cx, 2, cz - 3, { uv: 0.22, col: wallCol }); C.add(cx - 5, cz - 6.5, cx + 5, cz + 0.5, 4.3);
      W0.add('clay', tf(new T.SphereGeometry(1.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0, 0, 0, 0, 0, 1, 1.4, 1), cx + 7, 0, cz + 2, { col: '#9a6a48' }); C.add(cx + 5.4, cz + 0.4, cx + 8.6, cz + 3.6, 2.3);
      for (let i = 0; i < 8; i++) W0.add('plate' + (i % 3), new T.CylinderGeometry(0.4, 0.3, 0.06, 20), cx - 3 + (i % 4) * 2, 1.0, cz + 2 + Math.floor(i / 4) * 1.2, { rx: 0 });
      W0.add('wood', box(8, 0.9, 3), cx, 0.45, cz + 2.6, { col: '#7a5a3c' }); C.add(cx - 4, cz + 1.1, cx + 4, cz + 4.1, 0.95);
      prop('spinning_wheel_01', cx - 4, 0, cz - 0.8, Math.PI, 1);
      npcs.push({ x: cx - 4, z: cz + 0.4, ry: Math.PI, role: 'kulol', pose: 'work', name: 'Usta kulol' });
      A.extras.rishton = { x: cx, z: cz + 5 };
    },
    bibixonim: (cx, cz) => { // Bibixonim jome masjidi: ulkan peshtoq, gumbazli asosiy zal, burchak minoralari
      const LL = L(cx, cz, 0), Wd = 40, D = 44, H = 12;
      const wall = (x, z, w, d) => { LL.add('brick', box(w, H, d), x, H / 2, z, { uv: 0.45, col: '#ffffff' }); LL.add('band', scaleUV(box(w + 0.05, 1, d + 0.05), Math.max(1, Math.round(Math.max(w, d) / 8)), 1), x, H - 0.6, z, { uv: 0 }); LL.col(x, z, w, d, H + 0.2); };
      wall(-Wd / 2 + 2, 0, 4, D); wall(Wd / 2 - 2, 0, 4, D); wall(-Wd / 2 + 7, D / 2 - 2, 10, 4); wall(Wd / 2 - 7, D / 2 - 2, 10, 4);
      portal(LL, 0, D / 2 - 1.6, 20, 30, 4, { towers: true });
      W0.add('brick', box(24, 18, 16), cx, 9, cz - D / 2 + 8, { uv: 0.45, col: '#ffffff' }); C.add(cx - 12, cz - D / 2, cx + 12, cz - D / 2 + 16, 18);
      portal(L(cx, cz - D / 2 + 16.2, 0), 0, 0, 18, 26, 2.5, {});
      dome(cx, 18, cz - D / 2 + 8, 9, { ribbed: true, drum: 0.9, el: 1.3 });
      for (const sx of [-1, 1]) { W0.add('brick', box(12, 10, 12), cx + sx * 14, 5, cz, { uv: 0.45, col: '#ffffff' }); C.add(cx + sx * 14 - 6, cz - 6, cx + sx * 14 + 6, cz + 6, 10); dome(cx + sx * 14, 10, cz, 4.6, { ribbed: false, drum: 0.5 }); }
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) minaret(cx + sx * Wd / 2, cz + sz * D / 2, 30, 2.6, { bands: 4, tile: sz > 0 });
      W0.add('stone', new T.PlaneGeometry(Wd - 8, D - 18), cx, 0.03, cz + 4, { rx: -Math.PI / 2, uv: 0.45, col: '#cfc3b0' }); W0.add('sandstone', box(4, 1.4, 2.4), cx, 0.7, cz + 4, { uv: 0.5, col: '#ffffff' }); // tosh lavh (Qur'on kursisi)
      tree(cx - 9, cz + 8, 1.1, 'chinor'); tree(cx + 9, cz + 8, 1.1, 'chinor');
      A.extras.bibixonim = { x: cx, z: cz + D / 2 + 4 };
    },
    shohizinda: (cx, cz) => { // Shohizinda: tor ko'cha bo'ylab koshinli maqbaralar ansambli
      const n = 6, step = 7.2, z0 = cz + 18;
      for (let i = 0; i < 5; i++) W0.add('sandstone', box(5.6, 0.25, 1.2), cx, 0.12 + i * 0.25, z0 + 2 - i * 1.2, { uv: 0.5, col: '#ffffff' });
      for (let i = 0; i < n; i++) for (const sx of [-1, 1]) {
        const z = z0 - 6 - i * step, x = cx + sx * 6.2, LL = L(x, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2), h = 8 + (i % 3);
        LL.add('brick', box(6.4, h, 6.4), 0, h / 2, -3.4, { uv: 0.45, col: '#ffffff' }); LL.col(0, -3.4, 6.4, 6.4, h);
        portal(LL, 0, 0, 6.6, h + 2.5, 1.2, {});
        const [dx, dz] = LL.p(0, -3.4); dome(dx, h, dz, 2.6, { ribbed: i % 2 === 0, drum: 0.7, el: 1.2 });
      }
      W0.add('stone', new T.PlaneGeometry(5.6, n * step + 4), cx, 0.025, z0 - n * step / 2 - 4, { rx: -Math.PI / 2, uv: 0.45, col: '#cfc3b0' });
      A.extras.shohizinda = { x: cx, z: z0 + 2 };
    },
    observatoriya: () => { // Ulug'bek rasadxonasi: tepalik, aylana bino qoldig'i, yer ostiga tushuvchi ulkan sekstant
      const cx = 120, cz = -150, y = heightAt(cx, cz);
      W0.add('earth', tf(jitterIco(1, 3, 3, 0.12), 0, 0, 0, 0, 0, 0, 34, 7, 34), cx, y - 1.5, cz, { uv: 0.2, col: '#ffffff' }); C.add(cx - 26, cz - 26, cx + 26, cz + 26, y + 4.5, y - 5);
      const ring = new T.CylinderGeometry(15, 15.5, 4.5, 48, 1, true, 0, Math.PI * 1.6); scaleUV(ring, 20, 2); W0.add('brick', ring, cx, y + 7.6, cz, { uv: 0, col: '#ffffff' });
      W0.add('sandstone', new T.CircleGeometry(15, 48), cx, y + 5.45, cz, { rx: -Math.PI / 2, uv: 0.3, col: '#e8dcc8' });
      const arc = new T.TorusGeometry(11, 0.5, 8, 40, Math.PI * 0.42); W0.add('sandstone', arc, cx, y + 5.6, cz, { ry: Math.PI / 2, rz: -Math.PI * 0.71, col: '#f2ead8' }); W0.add('gold', new T.TorusGeometry(11, 0.12, 6, 40, Math.PI * 0.42), cx + 0.6, y + 5.6, cz, { ry: Math.PI / 2, rz: -Math.PI * 0.71 });
      W0.add('dark', box(2.2, 0.1, 13), cx, y + 5.5, cz + 3, {}); C.add(cx - 15, cz - 15, cx + 15, cz + 15, y + 5.45, y - 5); // yer ostiga tushuvchi xandaq og'zi
      const ml = L(cx + 4, cz + 22, 0); ml.add('brick', box(12, 6, 7), 0, y + 4, 0, { uv: 0.45, col: '#ffffff' }); ml.col(0, 0, 12, 7, y + 6); portal(L(cx + 4, cz + 25.6, 0), 0, 0, 7, 8.5, 1.2, {}); dome(cx + 4, y + 6, cz + 22, 2.6, { drum: 0.5 });
      A.extras.observatoriya = { x: cx + 4, z: cz + 30 };
    },
    ayozqala: () => { // Ayozqal'a: cho'l tepaligidagi qadimiy qal'a xarobalari
      const cx = 150, cz = 140, y = heightAt(cx, cz);
      W0.add('earth', tf(jitterIco(1, 3, 7, 0.15), 0, 0, 0, 0, 0, 0, 30, 9, 26), cx, y - 1.5, cz, { uv: 0.2, col: '#ffffff' }); C.add(cx - 22, cz - 18, cx + 22, cz + 18, y + 6, y - 5);
      const top = y + 7.5, s2 = 13;
      for (const [x0, z0, x1, z1] of [[-s2, -s2, s2, -s2], [s2, -s2, s2, s2], [s2, s2, -s2, s2], [-s2, s2, -s2, -s2]]) { const n = 7; for (let i = 0; i < n; i++) { if (r() < 0.18) continue; const t = (i + 0.5) / n, x = cx + x0 + (x1 - x0) * t, z = cz + z0 + (z1 - z0) * t, hh = 3 + r() * 4.5; W0.add('wall', frustum(Math.abs(x1 - x0) / n + 0.6 || 2.6, hh, Math.abs(z1 - z0) / n + 0.6 || 2.6, 0.4), x, top + hh / 2, z, { uv: 0.3, col: '#e0c79e' }); C.add(x - 1.4, z - 1.4, x + 1.4, z + 1.4, top + hh); } }
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const hh = 6 + r() * 3; W0.add('wall', new T.CylinderGeometry(2, 2.8, hh, 10), cx + sx * s2, top + hh / 2, cz + sz * s2, { uv: 0.3, col: '#d9bf92' }); C.add(cx + sx * s2 - 2.4, cz + sz * s2 - 2.4, cx + sx * s2 + 2.4, cz + sz * s2 + 2.4, top + hh); }
      A.extras.ayozqala = { x: cx, z: cz - 22 };
    },
    hazratimom: (cx, cz) => { // Hazrati Imom: Baroqxon madrasasi, Tillashayx masjidi, maydon
      madrasa(cx, cz - 10, 0, 34, 22, { H: 8, domes: [[-1, -1], [1, -1]], dr: 4, ph: 1.9, ptowers: true, corner: false, trees: false });
      for (const sx of [-1, 1]) minaret(cx + sx * 13, cz + 12, 26, 1.8, { bands: 3 });
      W0.add('stone', new T.PlaneGeometry(30, 14), cx, 0.03, cz + 8, { rx: -Math.PI / 2, uv: 0.45, col: '#d8cfc0' });
      for (let i = 0; i < 4; i++) tree(cx - 12 + i * 8, cz + 14, 0.9, 'chinor');
      A.extras.hazratimom = { x: cx, z: cz + 6 };
    },
    jome: () => { madrasa(0, -24, 0, 44, 30, { domes: [[0, -1]], dr: 5, ph: 1.8, mat: 'brick' }); minaret(26, -10, 32, 2.6, { climb: true }); },
    kurash: (cx, cz) => { W0.add('plain', new T.CylinderGeometry(7, 7, 0.15, 32), cx, 0.07, cz, { col: '#d9c49a' }); for (let a = 0; a < 6.28; a += 0.5) { tapchan(cx + Math.cos(a) * 10.5, cz + Math.sin(a) * 10.5, -a + Math.PI / 2, false); } A.extras.kurash = { x: cx, z: cz }; },
  };

  /* ----- tartib ----- */
  const reserved = new Map(); // "i,j" -> kind
  const key = (i, j) => i + ',' + j;
  for (const [i, j] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) reserved.set(key(i, j), 'plaza');
  reserved.set(key(0, 1), 'choyxona');
  reserved.set(key(-2, 2), 'hashar');
  if (!reserved.has(key(-3, 0))) reserved.set(key(-3, 0), 'bog');
  const BIG = ['ark', 'kirkkiz', 'bibixonim', 'shohizinda', 'hazratimom'];
  const secondary = R.landmarks.slice(1).filter((k) => !['walls_high', 'kopkari', 'temurdarvoza', 'ariq', 'gulbog', 'observatoriya', 'ayozqala', 'toqi', 'chorsu'].includes(k));
  const secCells = [[-3, -3], [1, -3], [1, 1]];
  secondary.forEach((k, n) => { const [i, j] = secCells[n % 3]; reserved.set(key(i, j), 'lm:' + k); if (BIG.includes(k)) { reserved.set(key(i + 1, j), 'skip'); reserved.set(key(i, j + 1), 'skip'); reserved.set(key(i + 1, j + 1), 'skip'); } });

  // yer
  const groundKind = { desert: 'sand', steppe: 'dust', valley: 'dust', hills: 'dust', mountains: 'dust', fields: 'dust', river: 'dust' }[R.land];
  {
    const gt = TX.pbr(groundKind === 'sand' ? 'sand' : 'ground'); const gm = new T.MeshStandardMaterial({ map: gt.map, normalMap: gt.normalMap, aoMap: gt.aoMap, roughnessMap: gt.roughnessMap, roughness: 1, vertexColors: true });
    const SZ = 1400, seg = Q > 0 ? 140 : 70, g = new T.PlaneGeometry(SZ, SZ, seg, seg); tf(g, 0, 0, 0, 0, -Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv, colA = new Float32Array(p.count * 3), base = new T.Color(R.land === 'desert' ? '#fff4e0' : '#f2e6d2'), green = new T.Color('#9aa070');
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z); p.setY(i, h); uv.setXY(i, x / 5, z / 5); const d = Math.max(Math.abs(x), Math.abs(z)); let c = base.clone(); if (d > 120 && R.land !== 'desert') c.lerp(green, Math.min(0.6, (d - 120) / 200) * (0.5 + vnoise(x * 0.03, z * 0.03) * 0.5)); if (R.land === 'mountains' && h > 26) c.lerp(new T.Color('#8a8070'), 0.5); colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(colA, 3)); g.computeVertexNormals();
    const m = new T.Mesh(g, gm); m.receiveShadow = true; group.add(m);
    // maydon toshi va asosiy ko'cha
    W0.add('stone', new T.PlaneGeometry(52 - 7, 52 - 7), 0, 0.02, 0, { rx: -Math.PI / 2, uv: 0.45, col: '#cfc3b0' });
    W0.add('stone', new T.PlaneGeometry(7, 90), 0, 0.015, 68, { rx: -Math.PI / 2, uv: 0.45, col: '#c2b8a8' });
  }
  cityWalls();
  for (let i = -4; i <= 3; i++) for (let j = -4; j <= 3; j++) {
    const k = reserved.get(key(i, j)); const x0 = i * CELL + 3.5, z0 = j * CELL + 3.5, x1 = (i + 1) * CELL - 3.5, z1 = (j + 1) * CELL - 3.5;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (k === 'plaza' || k === 'skip') continue;
    if (k === 'choyxona') {
      // hovuz + choyxona (Labi hovuz uslubi)
      const big = R.landmarks.includes('labihovuz');
      hovuz(cx - 1, cz - 2, big ? 14 : 10, big ? 9 : 7);
      for (const [a, b] of [[-8, -8], [8, -8], [-8, 5], [8, 5]]) tree(cx + a, cz + b, big ? 1.35 : 1.1, 'tut');
      tapchan(cx - 6, cz + 7.5, Math.PI); tapchan(cx + 0.5, cz + 7.5, Math.PI); tapchan(cx + 7.5, cz - 1, -Math.PI / 2);
      qozon(cx - 1, cz + 3.2 + 7); // pastroqda — choyxona oshxonasi
      const ox = cx + 6, oz = cz + 8; W0.add('wall', box(6, 4, 3), ox + 2, 2, oz + 1.5, { uv: 0.22, col: wallCol });
      C.add(ox - 1, oz, ox + 5, oz + 3, 4.2);
      for (const a of [-1, 0, 1]) lantern(cx + a * 6, 3.1, cz - 6.2, Math.PI);
      prop('wooden_table_02', ox + 0.5, 0, oz - 1.2, 0, 1.1); prop('brass_goblets', ox + 0.5, 0.78, oz - 1.2, 0, 1); prop('vintage_oil_lamp', ox + 1.2, 0.78, oz - 1.0, 0, 1); for (let i = 0; i < 3; i++) prop(pick(['wooden_stool_01', 'wooden_stool_02']), ox - 1 + i * 1.1, 0, oz - 2.6, r() * 6, 1);
      prop('barrel_03', ox + 4.5, 0, oz - 0.6, 0, 1); prop('wooden_bowl_02', cx - 2.4, 0, cz + 11, 0, 1.2); prop('wooden_spoon', cx - 2.0, 0.05, cz + 11.2, 1, 1);
      npcs.push({ x: cx - 1, z: cz + 9.2, ry: Math.PI, role: 'oshpaz', pose: 'stir', tool: 'qoshiq', name: 'Usta oshpaz' });
      for (let i = 0; i < 4; i++) A.tools.push({ kind: i % 2 ? 'sanchqi' : 'qoshiq', x: ox + 0.2 + i * 0.18, y: 0.8, z: oz - 1.25, rx: -Math.PI / 2, ry: 0.2, s: i % 2 ? 1.3 : 0.45 });
      npcs.push({ x: cx + 3, z: cz + 9.5, ry: Math.PI, role: 'choyxonachi', pose: 'stand', name: 'Choyxonachi' });
      for (const b of A.benches.slice(-3)) { npcs.push({ x: b.x - 0.4, z: b.z, ry: b.ry, role: 'mehmon', pose: 'sit', y: 0.66 }); if (r() < 0.6) npcs.push({ x: b.x + 0.5, z: b.z, ry: b.ry + Math.PI, role: 'mehmon', pose: 'sit', y: 0.66 }); }
      poi({ x: cx - 1, y: 0, z: cz + 6.6, r: 2.0, kind: 'choyxona', label: 'Choyxona: choy ichish va dam olish (saqlash)' });
      A.choyxona = { x: cx - 1, z: cz + 6.4 };
      continue;
    }
    if (k === 'bog') { // bog'li hovli: favvorali hovuz, sarvlar, gulzorlar, past devor
      for (const [a, b, w, d] of [[0, -9.2, 19, 0.5], [0, 9.2, 19, 0.5], [-9.2, 0, 0.5, 19]]) { W0.add('wall', box(w, 1.2, d), cx + a, 0.6, cz + b, { uv: 0.33, col: wallCol }); C.add(cx + a - w / 2, cz + b - d / 2, cx + a + w / 2, cz + b + d / 2, 1.2); }
      W0.add('sandstone', new T.CylinderGeometry(3.4, 3.5, 0.5, 24), cx, 0.25, cz, { uv: 0.4, col: '#ffffff' }); const wg = new T.CircleGeometry(3.1, 24); tf(wg, 0, 0, 0, 0, -Math.PI / 2); tf(wg, cx, 0.42, cz); const wm = new T.Mesh(wg, opt.waterMat); group.add(wm); fx.water.push(wm);
      W0.add('sandstone', new T.CylinderGeometry(0.25, 0.4, 1.4, 12), cx, 0.9, cz, { uv: 0.5, col: '#ffffff' }); W0.add('sandstone', new T.CylinderGeometry(0.8, 0.5, 0.25, 16), cx, 1.6, cz, { uv: 0.5, col: '#ffffff' }); C.add(cx - 3.5, cz - 3.5, cx + 3.5, cz + 3.5, 0.5, -1); fx.smoke.push({ x: cx, y: 1.8, z: cz, thin: 1, water: 1 });
      for (let i = -3; i <= 3; i += 2) for (const sz of [-1, 1]) tree(cx + i * 2.4, cz + sz * 7.4, 0.7, 'terak');
      for (const [a, b] of [[-6, -3.5], [6, -3.5], [-6, 3.5], [6, 3.5]]) { W0.add('earth', box(3, 0.35, 2.2), cx + a, 0.17, cz + b, { uv: 0.3 }); for (let k = 0; k < 6; k++) W0.add('flower', new T.PlaneGeometry(0.9, 0.7), cx + a + (r() - 0.5) * 2.4, 0.6, cz + b + (r() - 0.5) * 1.6, { ry: r() * 3 }); }
      tapchan(cx + 6.5, cz, -Math.PI / 2); A.extras.bog = { x: cx, z: cz };
      npcs.push({ x: cx + 6.2, z: cz - 0.4, ry: -Math.PI / 2, role: 'kitobxon', pose: 'sit', y: 0.66 });
      npcs.push({ x: cx - 4, z: cz + 5.5, ry: 0.8, role: 'ishchi', pose: 'rake', tool: 'xaskash', name: 'Bog\'bon' }); A.tools.push({ kind: 'xaskash', x: cx - 8.6, y: 0, z: cz - 8.4, rx: 0.2, ry: 0, s: 1 }); A.tools.push({ kind: 'vila', x: cx - 8.2, y: 0, z: cz - 8.4, rx: 0.18, ry: 0.3, s: 1 });
      continue;
    }
    if (k === 'hashar') {
      // hashar: qurilayotgan uy
      for (const [a, b, w, d] of [[0, -6, 14, 0.6], [-7, 0, 0.6, 12], [7, 0, 0.6, 12]]) { const hh = 1.2 + r() * 0.8; W0.add('brick', box(w || 0.6, hh, d || 0.6), cx + a, hh / 2, cz + b, { uv: 0.3, col: '#f0e0c8' }); C.add(cx + a - (w || 0.6) / 2, cz + b - (d || 0.6) / 2, cx + a + (w || 0.6) / 2, cz + b + (d || 0.6) / 2, hh); }
      for (let k2 = 0; k2 < 4; k2++) W0.add('brick', box(1.2, 0.8, 0.8), cx - 4 + k2 * 2.4, 0.4, cz + 4, { uv: 0.3, col: '#f0e0c8' });
      W0.add('clay', new T.CylinderGeometry(0.6, 0.5, 0.5, 12), cx + 3, 0.25, cz + 6, { col: '#8a6a4a' });
      npcs.push({ x: cx - 2, z: cz - 4.8, ry: Math.PI, role: 'usta', pose: 'work', name: 'Usta g\'isht teruvchi' });
      poi({ x: cx, y: 0, z: cz - 4, r: 2.6, kind: 'hashar', label: 'Hasharga qo\'shilish — g\'isht terish' });
      A.hashar = { x: cx, z: cz - 4 };
      tree(cx + 5, cz + 6, 1, 'tut'); continue;
    }
    if (k && k.startsWith('lm:')) { const name = k.slice(3); const big = BIG.includes(name); LM[name]?.(big ? cx + CELL / 2 : cx, big ? cz + CELL / 2 : cz); continue; }
    // mahalla bloki
    const ax = i === -1 ? 4.5 : 0, bx = i === 0 ? 4.5 : 0; // bozor ko'chasi uchun joy
    const bx0 = x0 + (i === -1 ? 0 : 0), bx1 = x1 - ax, bxx0 = x0 + bx;
    const X0 = bxx0, X1 = bx1, Z0 = z0, Z1 = z1;
    const split = r();
    const lots = split < 0.3 ? [[X0, Z0, X1, Z1]] : split < 0.65 ? [[X0, Z0, (X0 + X1) / 2 - 0.6, Z1], [(X0 + X1) / 2 + 0.6, Z0, X1, Z1]] : [[X0, Z0, (X0 + X1) / 2 - 0.6, (Z0 + Z1) / 2 - 0.6], [(X0 + X1) / 2 + 0.6, Z0, X1, (Z0 + Z1) / 2 - 0.6], [X0, (Z0 + Z1) / 2 + 0.6, (X0 + X1) / 2 - 0.6, Z1], [(X0 + X1) / 2 + 0.6, (Z0 + Z1) / 2 + 0.6, X1, Z1]];
    for (const [a0, b0, a1, b1] of lots) {
      const j0 = (r() - 0.5) * 1.6, j1 = (r() - 0.5) * 1.6;
      house(a0 + Math.max(0, j0), b0 + Math.max(0, j1), a1 - Math.max(0, -j0), b1 - Math.max(0, -j1), { n: Math.abs(b0 - Z0) < 0.1, s: Math.abs(b1 - Z1) < 0.1, w: Math.abs(a0 - X0) < 0.1, e: Math.abs(a1 - X1) < 0.1 });
    }
    if (r() < S.trees * 0.8) tree(cx + (r() - 0.5) * 10, z1 + 2.2, 0.9 + r() * 0.4, r() < 0.3 ? 'terak' : r() < 0.5 ? 'anor' : 'tut');
    if (r() < 0.12) parkedCart(x1 + 2.0, cz + (r() - 0.5) * 10, 0);
  }

  // bozor rastasi: janubiy darvozadan maydongacha
  const goodsByRegion = { fargona: ['lagan', 'atlas', 'lagan', 'atlas'], namangan: ['atlas', 'qovun', 'ziravor'], buxoro: ['kiyim', 'non', 'ziravor'], samarqand: ['non', 'qovun', 'ziravor'], xorazm: ['qovun', 'ziravor', 'kiyim'], toshkent: ['ziravor', 'qovun', 'non', 'kiyim'], qashqadaryo: ['gilam', 'ziravor', 'qovun'], surxondaryo: ['qovun', 'ziravor', 'non'], andijon: ['qovun', 'kiyim', 'ziravor'], navoiy: ['ziravor', 'kiyim', 'qovun'], jizzax: ['non', 'kiyim', 'qovun'], sirdaryo: ['qovun', 'non', 'ziravor'] };
  const lg = goodsByRegion[R.id] || ['qovun', 'non', 'ziravor'];
  const order = ['doppi', 'non', lg[0], 'kiyim', lg[1], 'mahsi', 'qurol', lg[2], 'lagan', lg[3] || 'gilam', 'qovun'];
  let si = 0;
  for (let z = 34; z < 100; z += 7.5) for (const side of [-1, 1]) { const g = order[si % order.length]; stall(side * 6.6, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, g, si); si++; }
  if (R.landmarks.includes('toqi') || R.landmarks.includes('chorsu')) LM.toqi(0, 66);
  for (let z = 36; z < 100; z += 15) { lantern(-3.4, 2.6, z, Math.PI / 2); }
  for (let z = 40; z < 100; z += 13) { const g = new T.PlaneGeometry(13, 0.5, 16, 1), pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i); pp.setY(i, pp.getY(i) - (1 - (x / 6.5) ** 2) * 1.1); } g.computeVertexNormals(); W0.add('fab' + ri(0, 2), g, 0, 4.4, z, { col: '#9a9a9a' }); }
  tandir(-9.5, 30); stall(-9.5, 26.5 - 2.6 + 0.4, Math.PI, 'non', 3);
  // asosiy yodgorlik
  LM[R.landmarks[0]]?.();
  for (const k of ['walls_high', 'kopkari', 'temurdarvoza', 'ariq', 'gulbog', 'observatoriya', 'ayozqala']) if (R.landmarks.includes(k) && R.landmarks[0] !== k) LM[k]();
  // maydon chetida daraxtlar va tapchanlar
  for (const [x, z] of [[-22, 22], [22, 22], [-22, -2], [22, -24]]) tree(x, z, 1.3, R.id === 'surxondaryo' ? 'anor' : 'chinor');
  for (const [x, z] of [[-21, 10], [21, 10], [-21, -14], [21, -14], [-8, 23], [8, 23]]) tree(x, z, 0.75, 'terak');
  // ot bog'lash joyi
  for (const [x, z] of [[-18, 26.5], [-15, 26.5]]) A.horses.push({ x, z, ry: 0 });
  W0.add('wood', box(7, 0.1, 0.1), -16.5, 1.1, 25.5, { col: '#6b4a2e' }); for (const x of [-20, -13]) W0.add('wood', box(0.12, 1.2, 0.12), x, 0.6, 25.5, { col: '#6b4a2e' });

  /* ----- shahar tashqarisi ----- */
  const outsideTrees = R.land === 'desert' ? 8 : R.land === 'steppe' ? 18 : 60;
  for (let i = 0; i < outsideTrees; i++) { const a = r() * 6.28, d = 128 + r() * 110, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 10 && z > 100) continue; tree(x, z, 0.9 + r() * 0.6, R.land === 'desert' ? 'anor' : r() < 0.4 ? 'terak' : 'tut'); }
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = 135 + r() * 120, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 10 && z > 100) continue; prop(r() < 0.5 ? 'boulder_01' : 'shrub_01', x, heightAt(x, z) - 0.2, z, r() * 6, 0.6 + r() * 1.4); }
  if (R.land === 'mountains' || R.land === 'hills' || R.id === 'surxondaryo' || R.id === 'jizzax') for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28 + (r() - 0.5) * 0.1, d = 250 + r() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d; prop('namaqualand_cliff_02', x, heightAt(x, z) - 3, z, -a + Math.PI / 2 + (r() - 0.5) * 0.4, 3.5 + r() * 2.5, { col: '#e0b48a' }); }
  // yo'l: janubiy darvozadan
  W0.add('stone', new T.PlaneGeometry(6, 140), 0, 0.03, 186, { rx: -Math.PI / 2, uv: 0.45, col: '#a89a86' });
  if (R.land === 'mountains' || R.land === 'valley' || R.land === 'hills') { // uzoq tog'lar: fotoskan qoya modeli, katta masshtabda
    const big = R.land === 'mountains' ? 1 : R.land === 'valley' ? 0.7 : 0.5;
    for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.92 + i / 15 * Math.PI * 0.84 + (r() - 0.5) * 0.08, d = 700 + r() * 200; const x = Math.cos(a) * d, z = Math.sin(a) * d; prop('namaqualand_cliff_02', x, -8, z, -a - Math.PI / 2 + (r() - 0.5) * 0.6, (9 + r() * 7) * big, { sy: 1.6 + r() * 0.9, col: R.id === 'surxondaryo' || R.id === 'qashqadaryo' || R.id === 'jizzax' ? '#e0b48a' : '#c9b9a6' }); }
  }
  if (R.land === 'fields' || R.id === 'sirdaryo' || R.id === 'surxondaryo') { // paxta dalasi
    const fx0 = -90, fz0 = 135; A.extras.paxta = { x0: fx0, z0: fz0, x1: fx0 + 60, z1: fz0 + 50 };
    for (let x = fx0; x < fx0 + 60; x += 2.2) for (let z = fz0; z < fz0 + 50; z += 1.6) { if (r() < 0.25) continue; W0.add('blob', jitterIco(0.45, 0, x * z, 0.4), x, 0.45, z, { col: '#9fb070' }); if (r() < 0.5) W0.add('plain', new T.SphereGeometry(0.11, 5, 4), x + (r() - 0.5) * 0.4, 0.8, z + (r() - 0.5) * 0.4, { col: '#fbfbf7' }); }
  }
  if (R.land === 'river' || R.id === 'xorazm' || R.id === 'surxondaryo') { const g = new T.PlaneGeometry(60, 900); tf(g, 0, 0, 0, 0, -Math.PI / 2); tf(g, -230, 0.25, 0); const m = new T.Mesh(g, opt.waterMat); group.add(m); fx.water.push(m); for (let i = 0; i < 40; i++) W0.add('blob', tf(new T.ConeGeometry(0.4, 2.2, 5), 0, 0, 0, 0, 0, 0, 1, 1, 1), -198 + r() * 4, heightAt(-198, 0) + 1, -200 + r() * 400, { col: '#8aa05a' }); }
  if (R.id === 'fargona' || R.id === 'namangan' || R.id === 'andijon') { A.extras.tutzor = []; for (let i = 0; i < 10; i++) { const x = 40 + (i % 5) * 9, z = 140 + Math.floor(i / 5) * 12; tree(x, z, 1.1, 'tut'); A.extras.tutzor.push({ x, z }); } }
  if (R.land === 'desert') { for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = 135 + r() * 100, x = Math.cos(a) * d, z = Math.sin(a) * d; W0.add('plain', jitterIco(0.7, 0, i, 0.5), x, heightAt(x, z) + 0.3, z, { col: '#8a8a5a' }); } } // saksovul
  // xirmon: pichan g'aramlari va ayri bilan ishlayotgan dehqonlar
  for (let i = 0; i < 3; i++) { const x = -40 + i * 9, z = 128 + (i % 2) * 6; haystack(x, z); W0.add('earth', tf(jitterIco(1.4, 3, i + 3, 0.12), 0, 0, 0, 0, 0, 0, 1.3, 1.1, 1.3), x, 1.0, z, { uv: 1.2, col: '#f0d488' }); C.add(x - 1.6, z - 1.6, x + 1.6, z + 1.6, 2.2, -1); npcs.push({ x: x + 2, z: z + 0.5, ry: -Math.PI / 2, role: 'ishchi', pose: 'pitch', tool: 'vila', name: 'Dehqon' }); }
  // ekin dalasi: egatlar, ketmon bilan yer chopayotgan va o'roq bilan bug'doy o'rayotgan dehqonlar
  { const fx0 = 30, fz0 = 132; W0.add('earth', new T.PlaneGeometry(15, 12.5), fx0 + 7, 0.02, fz0 + 5.5, { rx: -Math.PI / 2, uv: 0.4, col: '#8a6a4c' }); for (let i = 0; i < 9; i++) { const g = new T.CylinderGeometry(0.4, 0.4, 14, 10, 1, false, 0, Math.PI); g.scale(1, 1, 0.3); W0.add('earth', g, fx0 + 7, 0.0, fz0 + i * 1.3, { rz: Math.PI / 2, rx: -Math.PI / 2, uv: 0.5, col: '#9a7656' }); }
    for (let i = 0; i < 70; i++) { const x = fx0 + 16 + r() * 12, z = fz0 + r() * 11; for (let k = 0; k < 2; k++) W0.add('wheat', new T.PlaneGeometry(1.6, 1.1), x, 0.55, z, { ry: r() * 3.14, col: '#ffffff' }); }
    npcs.push({ x: fx0 + 4, z: fz0 + 3.2, ry: Math.PI / 2, role: 'ishchi', pose: 'hoe', tool: 'ketmon', name: 'Dehqon' }); npcs.push({ x: fx0 + 9, z: fz0 + 7, ry: Math.PI / 2, role: 'ishchi', pose: 'hoe', tool: 'ketmon', name: 'Dehqon' });
    npcs.push({ x: fx0 + 17, z: fz0 + 4, ry: Math.PI / 2, role: 'ishchi', pose: 'reap', tool: 'oroq', name: 'O\'roqchi' }); npcs.push({ x: fx0 + 19, z: fz0 + 8, ry: Math.PI / 2, role: 'ishchi', pose: 'reap', tool: 'oroq', name: 'O\'roqchi' });
    A.tools.push({ kind: 'ketmon', x: fx0 - 1, y: 0, z: fz0 - 1, rx: 0.2, ry: 0.5, s: 1 }); }
  A.tools.push({ kind: 'vila', x: -45, y: 0, z: 127, rx: 0.25, ry: 1, s: 1 }); A.tools.push({ kind: 'xaskash', x: -44.5, y: 0, z: 127.3, rx: 0.22, ry: 1.2, s: 1 });
  // tashqaridagi qishloq hovlilari
  for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = 140 + r() * 60, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 12 && z > 0) continue; if (A.extras.paxta && x > -95 && x < -25 && z > 130 && z < 190) continue; const y = heightAt(x, z); if (y > 3) continue; house(x - 4, z - 4, x + 4, z + 4, { n: true, s: true, e: true, w: true }); }

  B.build(group, opt.shadows);
  return { group, C, A, pois, npcs, fx, heightAt, mats };
}

/* ---------- xarita rasmi (minimap) ---------- */
export function drawMapImage(res, R, size = 512, span = 280) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const k = size / (span * 2), X = (x) => (x + span) * k;
  g.fillStyle = R.land === 'desert' ? '#e2cc9e' : '#cbbd92'; g.fillRect(0, 0, size, size);
  g.fillStyle = '#e6d7b4'; g.fillRect(X(-114), X(-114), 228 * k, 228 * k);
  for (const b of res.C.b) { if (b.top < 1.2) continue; g.fillStyle = b.top > 9 ? '#8c6f52' : '#a8896a'; g.fillRect(X(b.x0), X(b.z0), Math.max(1, (b.x1 - b.x0) * k), Math.max(1, (b.z1 - b.z0) * k)); }
  if (res.A.hovuz) { const h = res.A.hovuz; g.fillStyle = '#3f8f9a'; g.fillRect(X(h.x - h.w / 2), X(h.z - h.d / 2), h.w * k, h.d * k); }
  if (res.A.extras.paxta) { const p = res.A.extras.paxta; g.fillStyle = 'rgba(120,150,80,.6)'; g.fillRect(X(p.x0), X(p.z0), (p.x1 - p.x0) * k, (p.z1 - p.z0) * k); }
  return c;
}
