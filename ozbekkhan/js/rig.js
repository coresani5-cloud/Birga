// AI yaratgan statik odam modeliga (A-poza) avtomatik skelet ulash.
// Natija actors.js dagi animate() bilan ishlaydi: hips, torso, head, armL/R {sh, el}, legL/R {hp, kn, ft}.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_BASE } from './tex.js';
const T = THREE;

const cache = new Map();
export function loadRigSource(name) {
  if (!cache.has(name)) cache.set(name, new GLTFLoader().loadAsync(ASSET_BASE + 'chars/' + name + '.glb').then((g) => prepare(g.scene)).catch(() => null));
  return cache.get(name);
}

// geometriyani tayyorlash: oyoq tagi y=0, bo'yi 1.78 m, markaz x=z=0; og'irliklarni hisoblash
function prepare(scene, height = 1.78) {
  scene.updateMatrixWorld(true);
  let mesh = null; scene.traverse((o) => { if (o.isMesh && (!mesh || o.geometry.attributes.position.count > mesh.geometry.attributes.position.count)) mesh = o; });
  if (!mesh) return null;
  const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox(); const bb = geo.boundingBox, s = height / (bb.max.y - bb.min.y);
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(s, s, s);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const P = geo.attributes.position, n = P.count, H = height;
  // --- tana o'lchamlarini topish ---
  // oyoqlar orasidagi bo'shliq boshlanadigan balandlik (chopon etagi)
  let gapY = 0.3 * H;
  for (let y = 0.6 * H; y > 0.05 * H; y -= 0.01 * H) { let mid = 0; for (let i = 0; i < n; i++) { const py = P.getY(i); if (Math.abs(py - y) < 0.01 * H && Math.abs(P.getX(i)) < 0.025 * H) mid++; } if (mid === 0) { gapY = y; break; } }
  // qo'llar: yelka balandligidan pastda, tanadan tashqarida
  const shY = 0.815 * H, torsoHalf = (() => { let m = 0; for (let i = 0; i < n; i++) { const y = P.getY(i); if (Math.abs(y - 0.72 * H) < 0.02 * H) { const ax = Math.abs(P.getX(i)); if (ax < 0.16 * H) m = Math.max(m, ax); } } return Math.max(0.09 * H, m); })();
  const side = (sx) => { // qo'l uchi (eng pastki nuqtalar)
    const pts = []; for (let i = 0; i < n; i++) { const x = P.getX(i) * sx, y = P.getY(i); if (x > torsoHalf * 1.05 && y < shY && y > 0.35 * H) pts.push([x, y, P.getZ(i)]); }
    pts.sort((a, b) => a[1] - b[1]); const low = pts.slice(0, Math.max(5, pts.length * 0.04 | 0));
    const hx = low.reduce((a, p) => a + p[0], 0) / low.length, hy = low.reduce((a, p) => a + p[1], 0) / low.length, hz = low.reduce((a, p) => a + p[2], 0) / low.length;
    return new T.Vector3(hx * sx, hy, hz);
  };
  const handL = side(1), handR = side(-1);
  const J = {
    hips: new T.Vector3(0, 0.53 * H, 0), neck: new T.Vector3(0, 0.845 * H, 0),
    shL: new T.Vector3(torsoHalf * 0.85, shY, 0), shR: new T.Vector3(-torsoHalf * 0.85, shY, 0),
    hpL: new T.Vector3(0.055 * H, 0.5 * H, 0), hpR: new T.Vector3(-0.055 * H, 0.5 * H, 0),
    knL: new T.Vector3(0.058 * H, 0.28 * H, 0), knR: new T.Vector3(-0.058 * H, 0.28 * H, 0),
    ftL: new T.Vector3(0.06 * H, 0.055 * H, 0), ftR: new T.Vector3(-0.06 * H, 0.055 * H, 0),
  };
  J.elL = J.shL.clone().lerp(handL, 0.5); J.elR = J.shR.clone().lerp(handR, 0.5);
  // --- suyaklar ---
  const B = {}; const mk = (k, parent, pos) => { const b = new T.Bone(); b.name = k; const pp = parent ? J[parent] || (parent === 'root' ? new T.Vector3() : null) : null; b.position.copy(pos).sub(parent && parent !== 'root' ? J[parent] : new T.Vector3()); if (parent && parent !== 'root') B[parent].add(b); B[k] = b; return b; };
  J.torso = J.hips.clone();
  mk('hips', 'root', J.hips); mk('torso', 'hips', J.torso); mk('neck', 'torso', J.neck);
  mk('shL', 'torso', J.shL); mk('elL', 'shL', J.elL); mk('shR', 'torso', J.shR); mk('elR', 'shR', J.elR);
  mk('hpL', 'hips', J.hpL); mk('knL', 'hpL', J.knL); mk('ftL', 'knL', J.ftL); mk('hpR', 'hips', J.hpR); mk('knR', 'hpR', J.knR); mk('ftR', 'knR', J.ftR);
  const order = ['hips', 'torso', 'neck', 'shL', 'elL', 'shR', 'elR', 'hpL', 'knL', 'ftL', 'hpR', 'knR', 'ftR'], idx = Object.fromEntries(order.map((k, i) => [k, i]));
  // --- og'irliklar ---
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const segT = (p, a, b) => { const ab = b.clone().sub(a), t = p.clone().sub(a).dot(ab) / ab.lengthSq(); return Math.min(1, Math.max(0, t)); };
  const segD = (p, a, b) => a.clone().lerp(b, segT(p, a, b)).distanceTo(p);
  const v = new T.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(P.getX(i), P.getY(i), P.getZ(i)); const x = v.x, y = v.y, sx = x >= 0 ? 'L' : 'R';
    const w = {}; const add = (k, a) => { if (a > 0) w[k] = (w[k] || 0) + a; };
    const armSide = x >= 0 ? 1 : -1, hand = armSide > 0 ? handL : handR, sh = J['sh' + sx], el = J['el' + sx];
    const dArm = Math.min(segD(v, sh, el), segD(v, el, hand)), dTorso = Math.abs(x) - torsoHalf;
    const isArm = y < shY + 0.03 * H && y > hand.y - 0.08 * H && Math.abs(x) > torsoHalf * 0.75 && dArm < 0.07 * H && (dTorso > -0.01 * H || y > 0.74 * H);
    if (isArm) {
      const tUp = segT(v, sh, hand); const kEl = sm(0.42, 0.58, tUp); const kSh = sm(-0.02, 0.12, tUp);
      add('torso', 1 - kSh); add('sh' + sx, kSh * (1 - kEl)); add('el' + sx, kSh * kEl);
    } else if (y > J.neck.y - 0.02 * H) { const k = sm(J.neck.y - 0.02 * H, J.neck.y + 0.03 * H, y); add('neck', k); add('torso', 1 - k); }
    else if (y > gapY) { // tana va chopon etagi
      const kWaist = sm(J.hips.y - 0.02 * H, J.hips.y + 0.06 * H, y); // bel ustida — torso
      const legShare = (1 - kWaist) * sm(J.hips.y, gapY, y) * 0.55; // etak pastga qarab oyoqqa ergashadi
      add('torso', kWaist); add('hips', (1 - kWaist) - legShare); add('hp' + sx, legShare * (Math.abs(x) > 0.01 * H ? 1 : 0.5)); if (Math.abs(x) <= 0.01 * H) add('hp' + (sx === 'L' ? 'R' : 'L'), legShare * 0.5);
    } else { // oyoqlar (etakdan pastda)
      const kKn = sm(J.knL.y + 0.04 * H, J.knL.y - 0.04 * H, y), kFt = sm(J.ftL.y + 0.03 * H, J.ftL.y - 0.01 * H, y);
      add('hp' + sx, 1 - kKn); add('kn' + sx, kKn * (1 - kFt)); add('ft' + sx, kKn * kFt);
    }
    const ents = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4); const tot = ents.reduce((a, e) => a + e[1], 0) || 1;
    ents.forEach(([k, a], j) => { si[i * 4 + j] = idx[k]; sw[i * 4 + j] = a / tot; }); if (!ents.length) { si[i * 4] = idx.hips; sw[i * 4] = 1; }
  }
  geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
  const mat = mesh.material.clone(); mat.roughness = 0.85; mat.metalness = 0;
  return { geo, mat, J, order };
}

// Har bir personaj uchun alohida skelet (geometriya umumiy)
export function makeRigged(src) {
  const { geo, mat, J, order } = src; const root = new T.Group(); const B = {};
  const par = { hips: null, torso: 'hips', neck: 'torso', shL: 'torso', elL: 'shL', shR: 'torso', elR: 'shR', hpL: 'hips', knL: 'hpL', ftL: 'knL', hpR: 'hips', knR: 'hpR', ftR: 'knR' };
  for (const k of order) { const b = new T.Bone(); b.name = k; B[k] = b; const p = par[k]; b.position.copy(J[k] || J.hips).sub(p ? J[p] || J.hips : new T.Vector3()); (p ? B[p] : null)?.add(b); }
  const mesh = new T.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  root.add(B.hips); root.add(mesh); root.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton(order.map((k) => B[k])));
  // actors.animate() bilan mos interfeys
  const lim = (s) => ({ sh: B['sh' + s], el: B['el' + s], up: { visible: true }, lo: {}, hand: {} });
  const leg = (s) => ({ hp: B['hp' + s], kn: B['kn' + s], ft: B['ft' + s], th: {}, sn: {} });
  const R = { root, hips: B.hips, torso: B.torso, head: B.neck, armL: lim('L'), armR: lim('R'), legL: leg('L'), legR: leg('R'), t: Math.random() * 10, rigged: true, hipRest: J.hips.y, mesh };
  R.hatSlot = new T.Group(); B.neck.add(R.hatSlot);
  return R;
}
