// Personajlar (odam) va hayvonlar (ot, eshak, tuya) — protsedura modellari va animatsiyasi.
import * as THREE from 'three';
import * as TX from './tex.js';
const T = THREE;

const SKIN = ['#e0b48f', '#cf9f78', '#b98660', '#d8aa82', '#a87652'];
const matCache = new Map();
const mat = (k, f) => { if (!matCache.has(k)) matCache.set(k, f()); return matCache.get(k); };
const std = (color, o = {}) => mat('c' + color + JSON.stringify(o), () => new T.MeshStandardMaterial({ color, roughness: 0.8, ...o }));
const fabMat = (id, v) => mat('f' + id + v, () => new T.MeshStandardMaterial({ map: TX.fabricTex(id, v), roughness: 0.85, side: T.DoubleSide }));
const capsule = (r, l, s = 8) => new T.CapsuleGeometry(r, l, 4, s);

// Kiyimlar katalogi
export const WEAR = {
  hat: TX.HATS,
  coat: {
    beqasam_0: { n: 'Beqasam to\'n — qizil-ko\'k', f: 'beqasam', v: 0, p: 0 },
    beqasam_1: { n: 'Beqasam to\'n — ko\'k-oltin', f: 'beqasam', v: 1, p: 12 },
    beqasam_3: { n: 'Beqasam to\'n — yashil', f: 'beqasam', v: 3, p: 12 },
    adras_0: { n: 'Adras chopon', f: 'adras', v: 0, p: 25 },
    adras_2: { n: 'Adras chopon — moviy', f: 'adras', v: 2, p: 25 },
    atlas_0: { n: 'Atlas to\'n', f: 'atlas', v: 0, p: 60 },
    movut_0: { n: 'Movut chakmon', f: 'movut', v: 0, p: 10 },
    tuya_0: { n: 'Tuya junidan chakmon', f: 'tuya', v: 0, p: 40 },
    zardozi_0: { n: 'Zardo\'zi to\'n', f: 'zardozi', v: 0, p: 160 },
    yaktak: { n: 'Oq yaktak (to\'nsiz)', f: 'oq', v: 0, p: 0, light: true },
  },
  belt: {
    qizil: { n: 'Qizil belbog\'', c: '#a3242a', p: 0 }, oq: { n: 'Oq belbog\'', c: '#ece6d8', p: 0 }, yashil: { n: 'Yashil belbog\'', c: '#2a7a4a', p: 5 },
    kok: { n: 'Ko\'k belbog\'', c: '#1f4f8a', p: 5 }, kamar: { n: 'Kumush kamar', c: '#b8b8c0', p: 40, metal: true }, oltin: { n: 'Zarbof belbog\'', c: '#d9a640', p: 60, metal: true },
  },
  shoes: {
    mahsi: { n: 'Mahsi-kalish', c: '#1d1712', p: 0, d: 'Yumshoq charm mahsi, ustidan kalish — eng ko\'p kiyiladigan poyabzal.' },
    etik: { n: 'Charm etik', c: '#4a2c18', p: 35, boot: true, d: 'Tizzagacha charm etik — chavandozlar uchun.' },
    choriq: { n: 'Choriq', c: '#9a7048', p: 5, d: 'Xom teridan tikilgan oddiy poyabzal — dala ishlari uchun.' },
    kavush: { n: 'Uchli kavush', c: '#2b5a3a', p: 20, d: 'Uchi qayrilgan yashil kavush — bayram kiyimi.' },
  },
  pants: { qora: { n: 'Qora ishton', c: '#1d1d22', p: 0 }, kulrang: { n: 'Kulrang ishton', c: '#5a5a5e', p: 0 }, jigar: { n: 'Jigarrang ishton', c: '#4a3426', p: 5 } },
};
export const DEFAULT_LOOK = { skin: 1, beard: 1, hat: 'chust', coat: 'beqasam_1', belt: 'qizil', shoes: 'mahsi', pants: 'qora' };

/* --------- odam --------- */
export function makeHuman(look = {}, o = {}) {
  look = { ...DEFAULT_LOOK, ...look };
  const root = new T.Group(); root.name = 'human';
  const skinM = std(SKIN[look.skin % SKIN.length]);
  const hair = std(look.hairCol || '#1b1410');
  const sc = o.child ? 0.68 : o.female ? 0.94 : 1;
  const hips = new T.Group(); hips.position.y = 0.95; root.add(hips);
  const torso = new T.Group(); hips.add(torso);
  const R = { root, hips, torso, look, female: !!o.female, child: !!o.child };
  // tana (ko'ylak)
  const shirt = new T.Mesh(capsule(0.19, 0.42), std(o.female ? '#efe6d6' : '#ece6d8')); shirt.position.y = 0.33; shirt.scale.set(1, 1, 0.72); torso.add(shirt);
  const neck = new T.Mesh(new T.CylinderGeometry(0.055, 0.065, 0.12, 8), skinM); neck.position.y = 0.66; torso.add(neck);
  const head = new T.Group(); head.position.y = 0.8; torso.add(head); R.head = head;
  const skull = new T.Mesh(new T.SphereGeometry(0.115, 16, 12), skinM); skull.scale.set(0.92, 1.08, 1.0); head.add(skull);
  const jaw = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), skinM); jaw.position.set(0, -0.06, 0.02); jaw.scale.set(1, 0.9, 1); head.add(jaw);
  const nose = new T.Mesh(new T.ConeGeometry(0.022, 0.06, 6), skinM); nose.rotation.x = Math.PI / 2 + 0.4; nose.position.set(0, -0.005, 0.115); head.add(nose);
  for (const s of [-1, 1]) {
    const eye = new T.Mesh(new T.SphereGeometry(0.016, 8, 6), std('#f4efe8')); eye.position.set(s * 0.04, 0.025, 0.095); head.add(eye);
    const pupil = new T.Mesh(new T.SphereGeometry(0.01, 6, 4), std('#1a120c')); pupil.position.set(s * 0.04, 0.025, 0.11); head.add(pupil);
    const brow = new T.Mesh(new T.BoxGeometry(0.045, 0.01, 0.012), hair); brow.position.set(s * 0.042, 0.055, 0.105); brow.rotation.z = -s * 0.12; head.add(brow);
    const ear = new T.Mesh(new T.SphereGeometry(0.025, 6, 6), skinM); ear.scale.set(0.5, 1, 0.8); ear.position.set(s * 0.108, 0.0, 0); head.add(ear);
  }
  const mouth = new T.Mesh(new T.BoxGeometry(0.04, 0.008, 0.01), std('#7a3e32')); mouth.position.set(0, -0.06, 0.1); head.add(mouth);
  if (!o.female && !o.child) {
    // soqol: 0 yo'q, 1 qisqa qora (navqiron), 2 mo'ylov, 3 oq soqol (keksa)
    const bc = look.beard === 3 ? '#e8e4dc' : look.hairCol || '#1b1410', bm = std(bc, { roughness: 1 });
    if (look.beard === 1 || look.beard === 3) { const b = new T.Mesh(new T.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), bm); b.position.set(0, -0.025, 0.012); b.scale.set(1.02, look.beard === 3 ? 1.7 : 1.05, 1.08); head.add(b); }
    if (look.beard >= 1) { const m = new T.Mesh(new T.BoxGeometry(0.07, 0.016, 0.02), bm); m.position.set(0, -0.042, 0.108); head.add(m); }
  }
  const hairCap = new T.Mesh(new T.SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hair); hairCap.position.y = 0.01; hairCap.scale.set(0.94, 1.05, 1.02); head.add(hairCap);
  if (o.female) { const braid = new T.Mesh(capsule(0.03, 0.5), hair); braid.position.set(0, -0.3, -0.1); head.add(braid); const scarf = new T.Mesh(new T.SphereGeometry(0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), fabMat('atlas', (look.skin + 1) % 5)); scarf.scale.set(0.95, 1.1, 1.05); scarf.position.y = 0.0; head.add(scarf); }
  R.hatSlot = new T.Group(); R.hatSlot.position.y = 0.075; head.add(R.hatSlot);

  // qo'llar
  const limb = (side) => {
    const sh = new T.Group(); sh.position.set(side * 0.23, 0.55, 0); torso.add(sh);
    const up = new T.Mesh(capsule(0.055, 0.22), shirt.material); up.position.y = -0.14; sh.add(up);
    const el = new T.Group(); el.position.y = -0.29; sh.add(el);
    const lo = new T.Mesh(capsule(0.045, 0.2), skinM); lo.position.y = -0.13; el.add(lo);
    const hand = new T.Mesh(new T.SphereGeometry(0.048, 8, 6), skinM); hand.scale.set(0.8, 1.1, 0.6); hand.position.y = -0.27; el.add(hand);
    return { sh, el, up, lo, hand };
  };
  R.armL = limb(1); R.armR = limb(-1);
  const leg = (side) => {
    const hp = new T.Group(); hp.position.set(side * 0.1, 0, 0); hips.add(hp);
    const th = new T.Mesh(capsule(0.075, 0.3), std('#1d1d22')); th.position.y = -0.2; hp.add(th);
    const kn = new T.Group(); kn.position.y = -0.43; hp.add(kn);
    const sn = new T.Mesh(capsule(0.06, 0.3), th.material); sn.position.y = -0.2; kn.add(sn);
    const ft = new T.Group(); ft.position.y = -0.43; kn.add(ft);
    return { hp, kn, ft, th, sn };
  };
  R.legL = leg(1); R.legR = leg(-1);
  R.handR = new T.Group(); R.handR.position.y = -0.27; R.armR.el.add(R.handR);
  R.parts = { shirt };
  if (o.female) { // uzun atlas ko'ylak
    const dress = new T.Mesh(new T.CylinderGeometry(0.2, 0.36, 1.05, 16, 1, true), fabMat('atlas', look.skin % 5)); dress.position.y = 0.05; hips.add(dress); R.dress = dress;
    shirt.material = fabMat('atlas', look.skin % 5);
    R.armL.up.material = R.armR.up.material = shirt.material;
  }
  dress(R, look, o);
  root.scale.setScalar(sc);
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; } });
  R.t = Math.random() * 10; R.pose = 'idle';
  return R;
}
const clear = (g) => { while (g.children.length) g.remove(g.children[0]); };
export function dress(R, look, o = {}) {
  R.look = look = { ...R.look, ...look };
  // eski kiyimlarni olib tashlaymiz
  for (const k of ['coat', 'sleeveL', 'sleeveR', 'belt', 'beltKnot', 'collar']) { R[k]?.parent?.remove(R[k]); R[k] = null; }
  clear(R.hatSlot); for (const lg of [R.legL, R.legR]) clear(lg.ft);
  const pants = WEAR.pants[look.pants] || WEAR.pants.qora; R.legL.th.material = R.legR.th.material = R.legL.sn.material = std(pants.c);
  if (!R.female) {
    const C = WEAR.coat[look.coat] || WEAR.coat.beqasam_0, fm = fabMat(C.f, C.v);
    if (!C.light) {
      const coat = new T.Mesh(new T.CylinderGeometry(0.215, 0.33, R.child ? 0.95 : 1.02, 18, 3, true), fm); coat.position.y = 0.12; coat.scale.z = 0.82; R.torso.add(coat); R.coat = coat;
      const yoke = new T.Mesh(new T.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), fm); yoke.scale.set(1.08, 0.5, 0.78); yoke.position.y = 0.62; coat.add(yoke); yoke.position.y = 0.5;
      // old qismi ochiq — oq ko'ylak ko'rinadi
      const front = new T.Mesh(new T.PlaneGeometry(0.1, 0.5), std('#ece6d8', { side: T.DoubleSide })); front.position.set(0, 0.3, 0.178); R.torso.add(front); R.collar = front;
      R.sleeveL = new T.Mesh(capsule(0.07, 0.46), fm); R.sleeveL.position.y = -0.27; R.armL.sh.add(R.sleeveL);
      R.sleeveR = new T.Mesh(capsule(0.07, 0.46), fm); R.sleeveR.position.y = -0.27; R.armR.sh.add(R.sleeveR);
      R.armL.up.visible = R.armR.up.visible = false; R.sleeveL.rotation.x = 0; R.sleeveR.rotation.x = 0;
      R.parts.shirt.material = std('#ece6d8');
    } else { R.armL.up.visible = R.armR.up.visible = true; R.parts.shirt.material = std('#ece6d8'); R.armL.up.material = R.armR.up.material = R.parts.shirt.material; }
    const Bt = WEAR.belt[look.belt] || WEAR.belt.qizil;
    const belt = new T.Mesh(new T.CylinderGeometry(0.235, 0.235, 0.12, 18, 1, true), std(Bt.c, Bt.metal ? { metalness: 0.8, roughness: 0.3 } : {})); belt.scale.z = 0.84; belt.position.y = 0.06; R.torso.add(belt); R.belt = belt;
    const knot = new T.Mesh(new T.BoxGeometry(0.08, 0.22, 0.03), belt.material); knot.position.set(0.12, -0.06, 0.19); knot.rotation.z = 0.2; R.torso.add(knot); R.beltKnot = knot;
  }
  // bosh kiyim
  const H = TX.HATS[look.hat] || TX.HATS.oddiy;
  if (!R.female && H.type !== 'none') {
    if (H.type === 'doppi') { const g = new T.CylinderGeometry(0.108, 0.122, 0.11, 4, 1, false); const m = new T.Mesh(g, mat('dp' + look.hat, () => new T.MeshStandardMaterial({ map: TX.doppiTex(look.hat), roughness: 0.7, metalness: look.hat === 'zardozi' ? 0.25 : 0 }))); m.rotation.y = Math.PI / 4; m.scale.set(1.25, 1, 1.25); m.position.y = 0.035; R.hatSlot.add(m); const top = new T.Mesh(new T.CylinderGeometry(0.02, 0.108, 0.025, 4), m.material); top.rotation.y = Math.PI / 4; top.scale.set(1.25, 1, 1.25); top.position.y = 0.1; R.hatSlot.add(top); }
    else if (H.type === 'salla') { for (let i = 0; i < 4; i++) { const t = new T.Mesh(new T.TorusGeometry(0.11 - i * 0.012, 0.04, 8, 18), std('#f1ede4', { roughness: 1 })); t.rotation.x = Math.PI / 2 + (i % 2 ? 0.15 : -0.15); t.position.y = 0.02 + i * 0.04; R.hatSlot.add(t); } const c = new T.Mesh(new T.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std('#a3242a')); c.position.y = 0.12; R.hatSlot.add(c); }
    else if (H.type === 'chugirma') { const g = new T.SphereGeometry(0.2, 14, 10); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(p.getX(i) * 60) * Math.cos(p.getZ(i) * 55) * 0.07 + Math.sin(p.getY(i) * 70) * 0.05; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); const m = new T.Mesh(g, std(look.hatCol || '#1a1714', { roughness: 1 })); m.scale.set(1, 0.85, 1); m.position.y = 0.07; R.hatSlot.add(m); }
    else if (H.type === 'telpak') { const m = new T.Mesh(new T.CylinderGeometry(0.15, 0.14, 0.2, 14), std('#20190f', { roughness: 1 })); m.position.y = 0.06; R.hatSlot.add(m); }
    else if (H.type === 'qalpoq') { const m = new T.Mesh(new T.CylinderGeometry(0.06, 0.15, 0.3, 14), std('#efe9dc', { roughness: 1 })); m.position.y = 0.11; R.hatSlot.add(m); const b = new T.Mesh(new T.TorusGeometry(0.15, 0.025, 6, 16), std('#2a2a2a')); b.rotation.x = Math.PI / 2; b.position.y = -0.02; R.hatSlot.add(b); }
  }
  // poyabzal
  const Sh = WEAR.shoes[look.shoes] || WEAR.shoes.mahsi;
  for (const lg of [R.legL, R.legR]) {
    const f = new T.Mesh(new T.CapsuleGeometry(0.055, 0.16, 3, 8), std(Sh.c, { roughness: 0.5 })); f.rotation.x = Math.PI / 2; f.position.set(0, -0.02, 0.06); f.scale.set(1, 1, 0.7); lg.ft.add(f);
    if (look.shoes === 'kavush') { const tip = new T.Mesh(new T.ConeGeometry(0.03, 0.08, 6), f.material); tip.rotation.x = -Math.PI / 2 - 0.6; tip.position.set(0, 0.01, 0.2); lg.ft.add(tip); }
    if (Sh.boot) { const b = new T.Mesh(new T.CylinderGeometry(0.075, 0.068, 0.36, 10), f.material); b.position.y = 0.17; lg.ft.add(b); }
  }
  R.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
}

// animatsiya: holat va tezlikka qarab
export function animate(R, dt, st) {
  R.t += dt * (st.speed > 0.1 ? 1 + st.speed * 0.9 : 1);
  const t = R.t, sp = st.speed || 0, pose = st.pose || 'walk';
  const L = R.legL, Rr = R.legR, aL = R.armL, aR = R.armR;
  let hipY = 0.95, tilt = 0, armSwing = 0, legSwing = 0, knee = 0, bob = 0;
  const reset = () => { for (const a of [aL, aR]) { a.sh.rotation.set(0, 0, 0); a.el.rotation.set(0, 0, 0); } for (const l of [L, Rr]) { l.hp.rotation.set(0, 0, 0); l.kn.rotation.set(0, 0, 0); l.ft.rotation.set(0, 0, 0); } R.torso.rotation.set(0, 0, 0); R.head.rotation.set(0, 0, 0); R.hips.rotation.set(0, 0, 0); };
  reset();
  if (pose === 'ride') {
    hipY = 0.95; for (const [l, s] of [[L, 1], [Rr, -1]]) { l.hp.rotation.x = -1.25; l.hp.rotation.z = s * 0.45; l.kn.rotation.x = 1.5; }
    for (const [a, s] of [[aL, 1], [aR, -1]]) { a.sh.rotation.x = -0.7; a.sh.rotation.z = s * 0.15; a.el.rotation.x = -0.6; }
    R.torso.rotation.x = 0.08 + Math.sin(t * 8) * 0.03 * Math.min(1, sp / 6); bob = Math.abs(Math.sin(t * 8)) * 0.04 * Math.min(1, sp / 6);
  } else if (pose === 'sit') {
    hipY = 0.45; for (const [l, s] of [[L, 1], [Rr, -1]]) { l.hp.rotation.x = -1.45; l.hp.rotation.z = s * 0.5; l.kn.rotation.x = 2.2; l.hp.rotation.y = s * 0.4; }
    for (const [a, s] of [[aL, 1], [aR, -1]]) { a.sh.rotation.x = -0.35; a.sh.rotation.z = s * 0.25; a.el.rotation.x = -0.9; }
    R.torso.rotation.x = 0.06 + Math.sin(t * 0.8) * 0.02; R.head.rotation.y = Math.sin(t * 0.37) * 0.4; bob = Math.sin(t * 1.2) * 0.005;
  } else if (pose === 'work') { // qozon kavlash, g'isht terish, charx
    const w = Math.sin(t * 3.2); R.torso.rotation.x = 0.35 + w * 0.08; aL.sh.rotation.x = -0.9 + w * 0.4; aR.sh.rotation.x = -0.9 - w * 0.4; aL.el.rotation.x = -0.6; aR.el.rotation.x = -0.6; L.kn.rotation.x = 0.15; Rr.kn.rotation.x = 0.15; hipY = 0.92;
  } else if (pose === 'dance') { // lazgi: qo'llar silkinadi, yelka o'ynaydi
    const w = t * 5; R.hips.rotation.y = Math.sin(w * 0.5) * 0.5; aL.sh.rotation.z = 2.3 + Math.sin(w) * 0.4; aR.sh.rotation.z = -2.3 + Math.sin(w + 1) * 0.4; aL.el.rotation.z = Math.sin(w * 2) * 0.8; aR.el.rotation.z = -Math.sin(w * 2) * 0.8; aL.sh.rotation.x = Math.sin(w) * 0.3; aR.sh.rotation.x = -Math.sin(w) * 0.3;
    L.hp.rotation.x = -Math.max(0, Math.sin(w)) * 0.6; L.kn.rotation.x = Math.max(0, Math.sin(w)) * 1.1; Rr.hp.rotation.x = -Math.max(0, -Math.sin(w)) * 0.6; Rr.kn.rotation.x = Math.max(0, -Math.sin(w)) * 1.1; bob = Math.abs(Math.sin(w)) * 0.06; R.head.rotation.z = Math.sin(w * 2) * 0.15;
  } else if (pose === 'rake') { const w = Math.sin(t * 2.2); R.torso.rotation.x = 0.35; aR.sh.rotation.x = -0.9 + w * 0.45; aL.sh.rotation.x = -0.6 + w * 0.45; aL.sh.rotation.z = -0.25; aR.el.rotation.x = -0.4; aL.el.rotation.x = -0.6; L.hp.rotation.x = -0.25; Rr.hp.rotation.x = 0.2; L.kn.rotation.x = 0.3;
  } else if (pose === 'pitch') { const w = (Math.sin(t * 1.6) + 1) / 2; R.torso.rotation.x = 0.55 - w * 0.5; R.torso.rotation.y = -0.3 + w * 0.5; aR.sh.rotation.x = -0.5 - w * 1.4; aL.sh.rotation.x = -0.7 - w * 1.2; aL.sh.rotation.z = -0.3; aR.el.rotation.x = -0.5; aL.el.rotation.x = -0.7; L.kn.rotation.x = 0.4 * (1 - w); Rr.kn.rotation.x = 0.4 * (1 - w); hipY = 0.9 + w * 0.05;
  } else if (pose === 'stir') { const w = t * 2.5; R.torso.rotation.x = 0.3; aR.sh.rotation.x = -1.0 + Math.sin(w) * 0.25; aR.sh.rotation.z = -0.2 + Math.cos(w) * 0.2; aR.el.rotation.x = -0.7; aL.sh.rotation.x = -0.4; aL.el.rotation.x = -1.2;
  } else if (pose === 'cut') { const w = Math.max(0, Math.sin(t * 6)); R.torso.rotation.x = 0.3; aR.sh.rotation.x = -0.8 - w * 0.4; aR.el.rotation.x = -0.9 + w * 0.5; aL.sh.rotation.x = -0.7; aL.el.rotation.x = -1.0; aL.sh.rotation.z = 0.2;
  } else if (pose === 'hoe') { const w = Math.max(0, Math.sin(t * 2.4)); R.torso.rotation.x = 0.45 - w * 0.3; aR.sh.rotation.x = -2.0 * w - 0.3; aL.sh.rotation.x = -1.8 * w - 0.4; aR.el.rotation.x = -0.4; aL.el.rotation.x = -0.5; L.hp.rotation.x = -0.35; Rr.hp.rotation.x = 0.25; L.kn.rotation.x = 0.45; hipY = 0.9;
  } else if (pose === 'reap') { const w = Math.sin(t * 2.8); R.torso.rotation.x = 1.0; R.torso.rotation.y = w * 0.35; aR.sh.rotation.x = -1.2; aR.sh.rotation.z = -0.4 + w * 0.6; aR.el.rotation.x = -0.3; aL.sh.rotation.x = -1.3; aL.el.rotation.x = -0.5; L.kn.rotation.x = 0.7; Rr.kn.rotation.x = 0.7; L.hp.rotation.x = -0.6; Rr.hp.rotation.x = -0.6; hipY = 0.78;
  } else if (pose === 'punch' || pose === 'punch2') { // zarba: tana buriladi, qo'l oldinga otiladi
    const p = st.pt ?? 0.5, f = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65), side = pose === 'punch2' ? -1 : 1, a1 = side > 0 ? aR : aL, a2 = side > 0 ? aL : aR;
    R.torso.rotation.y = -side * (0.15 + f * 0.45); R.torso.rotation.x = 0.12 + f * 0.1; a1.sh.rotation.x = -0.6 - f * 0.95; a1.sh.rotation.z = -side * (0.15 - f * 0.1); a1.el.rotation.x = -1.6 + f * 1.5; a2.sh.rotation.x = -1.0; a2.el.rotation.x = -1.8; a2.sh.rotation.z = side * 0.25; L.hp.rotation.x = -0.35; Rr.hp.rotation.x = 0.3; L.kn.rotation.x = 0.35; Rr.kn.rotation.x = 0.25; hipY = 0.9;
  } else if (pose === 'guard') { R.torso.rotation.x = 0.15; aL.sh.rotation.x = -1.1; aR.sh.rotation.x = -1.1; aL.el.rotation.x = -1.9; aR.el.rotation.x = -1.9; aL.sh.rotation.z = 0.35; aR.sh.rotation.z = -0.35; L.hp.rotation.x = -0.3; Rr.hp.rotation.x = 0.25; L.kn.rotation.x = 0.35; Rr.kn.rotation.x = 0.3; hipY = 0.9 + Math.sin(t * 6) * 0.01; R.head.rotation.x = 0.15;
  } else if (pose === 'hit') { const f = st.pt ?? 0.5; R.torso.rotation.x = -0.4 * (1 - f); R.head.rotation.x = -0.5 * (1 - f); aL.sh.rotation.z = 0.8 * (1 - f); aR.sh.rotation.z = -0.8 * (1 - f); hipY = 0.92;
  } else if (pose === 'dutor') {
    aL.sh.rotation.x = -0.9; aL.sh.rotation.z = 0.7; aL.el.rotation.x = -0.9; aR.sh.rotation.x = -0.6; aR.sh.rotation.z = -0.3; aR.el.rotation.x = -1.2 + Math.sin(t * 14) * 0.15; R.head.rotation.z = Math.sin(t * 3) * 0.08; R.head.rotation.x = 0.1; R.torso.rotation.x = 0.05 + Math.sin(t * 3) * 0.02;
  } else if (pose === 'xdance') {
    const w = t * 2.2; R.hips.rotation.y = Math.sin(w * 0.5) * 1.2; aL.sh.rotation.z = 1.2 + Math.sin(w) * 0.6; aR.sh.rotation.z = -1.2 + Math.sin(w + Math.PI) * 0.6; aL.sh.rotation.x = Math.sin(w * 0.7) * 0.5; aR.sh.rotation.x = -Math.sin(w * 0.7) * 0.5; aL.el.rotation.z = Math.sin(w * 1.3) * 0.7; aR.el.rotation.z = -Math.sin(w * 1.3) * 0.7; L.kn.rotation.x = 0.25 + Math.max(0, Math.sin(w)) * 0.4; Rr.kn.rotation.x = 0.25 + Math.max(0, -Math.sin(w)) * 0.4; bob = Math.abs(Math.sin(w)) * 0.03; hipY = 0.92;
  } else if (pose === 'para') { aL.sh.rotation.z = 2.7; aR.sh.rotation.z = -2.7; aL.el.rotation.z = 0.3; aR.el.rotation.z = -0.3; L.hp.rotation.x = 0.2 + Math.sin(t * 3) * 0.15; Rr.hp.rotation.x = 0.2 - Math.sin(t * 3) * 0.15; L.kn.rotation.x = 0.4; Rr.kn.rotation.x = 0.4; }
  else if (pose === 'fall' || pose === 'jump') { aL.sh.rotation.z = 1.2; aR.sh.rotation.z = -1.2; L.hp.rotation.x = -0.5; L.kn.rotation.x = 0.9; Rr.hp.rotation.x = 0.2; Rr.kn.rotation.x = 0.4; }
  else if (pose === 'climb') { const w = Math.sin(t * 8); aL.sh.rotation.x = -2.6 + w * 0.4; aR.sh.rotation.x = -2.6 - w * 0.4; L.hp.rotation.x = -0.8 - w * 0.4; Rr.hp.rotation.x = -0.8 + w * 0.4; L.kn.rotation.x = 1.2; Rr.kn.rotation.x = 1.2; }
  else if (pose === 'wave') { aR.sh.rotation.z = -2.6; aR.el.rotation.z = Math.sin(t * 10) * 0.5; aL.sh.rotation.x = -0.4; aL.el.rotation.x = -1.4; aL.sh.rotation.z = 0.5; R.torso.rotation.x = 0.25; R.head.rotation.x = 0.2; } // qo'l ko'ksida — salom
  else if (pose === 'kurash') { const w = Math.sin(t * 4); R.torso.rotation.x = 0.55; aL.sh.rotation.x = -1.3 + w * 0.2; aR.sh.rotation.x = -1.3 - w * 0.2; aL.el.rotation.x = -0.9; aR.el.rotation.x = -0.9; L.hp.rotation.x = -0.5; Rr.hp.rotation.x = 0.3; L.kn.rotation.x = 0.8; Rr.kn.rotation.x = 0.5; hipY = 0.82; }
  else if (pose === 'pick') { const w = Math.sin(t * 5); R.torso.rotation.x = 0.9; aL.sh.rotation.x = -1.2 + w * 0.5; aR.sh.rotation.x = -1.0 - w * 0.5; L.kn.rotation.x = 0.4; Rr.kn.rotation.x = 0.4; hipY = 0.85; }
  else if (pose === 'carry') { aL.sh.rotation.x = -1.1; aR.sh.rotation.x = -1.1; aL.el.rotation.x = -0.9; aR.el.rotation.x = -0.9; legSwing = Math.min(1, sp / 4) * 0.5; }
  else if (pose === 'lie') { R.hips.rotation.x = -Math.PI / 2; hipY = 0.2; }
  if (pose === 'walk' || pose === 'carry' || pose === 'idle') {
    // qadam fazasi tezlikka bog'langan: oyoq yerda sirpanmaydi (qadam uzunligi yurishda ~0.75 m, yugurishda ~1.2 m)
    const run = Math.min(1, Math.max(0, (sp - 2.6) / 3.2)), k = Math.min(1, sp / 1.6), stride = (0.75 + run * 0.5) * (R.rigged ? 0.8 : 1);
    R.ph = (R.ph || 0) + dt * (sp / stride) * Math.PI; const ph = R.ph;
    const robe = R.rigged ? 0.62 : 1; legSwing = (0.42 + run * 0.3) * k * robe; armSwing = (0.3 + run * (R.rigged ? 0.25 : 0.45)) * k;
    const s1 = Math.sin(ph), c1 = Math.cos(ph);
    L.hp.rotation.x = s1 * legSwing; Rr.hp.rotation.x = -s1 * legSwing;
    // tizza: oldinga ko'tarilayotgan oyoqda ko'proq bukiladi
    L.kn.rotation.x = (Math.max(0, -c1) * (0.55 + run * 0.7) * robe + 0.05) * k; Rr.kn.rotation.x = (Math.max(0, c1) * (0.55 + run * 0.7) * robe + 0.05) * k;
    L.ft.rotation.x = -Math.max(0, s1) * 0.25 * k; Rr.ft.rotation.x = Math.max(0, s1) * 0.25 * k;
    if (pose !== 'carry') { aL.sh.rotation.x = -s1 * armSwing; aR.sh.rotation.x = s1 * armSwing; const eb = R.rigged ? 0.45 : 1.0; aL.el.rotation.x = -0.15 - run * eb - Math.max(0, s1) * 0.12 * k; aR.el.rotation.x = -0.15 - run * eb - Math.max(0, -s1) * 0.12 * k; }
    aL.sh.rotation.z = 0.1 + run * 0.1; aR.sh.rotation.z = -0.1 - run * 0.1;
    // son va yelka chayqalishi, yon tebranish, bosh barqaror
    R.hips.rotation.y = s1 * 0.12 * k; R.hips.rotation.z = c1 * 0.04 * k; R.hips.position.x = c1 * 0.025 * k;
    R.torso.rotation.y = -s1 * 0.2 * k; tilt = 0.04 * k + run * 0.2; R.torso.rotation.x = tilt;
    R.head.rotation.y = s1 * 0.08 * k; R.head.rotation.x = -tilt * 0.5;
    bob = (Math.abs(Math.cos(ph)) - 0.5) * (0.04 + run * 0.04) * k;
    if (sp < 0.1) { const br = Math.sin(t * 1.4); R.torso.rotation.x = br * 0.012; R.torso.rotation.z = Math.sin(t * 0.37) * 0.01; R.head.rotation.y = Math.sin(t * 0.33) * 0.35; aL.sh.rotation.z = 0.1 + br * 0.01; aR.sh.rotation.z = -0.1 - br * 0.01; aL.el.rotation.x = -0.15; aR.el.rotation.x = -0.15; L.hp.rotation.x = 0.02; Rr.hp.rotation.x = -0.04; Rr.kn.rotation.x = 0.08; R.hips.rotation.z = 0.02; }
  }
  R.hips.position.y = hipY + bob;
  if (R.coat) { R.coat.rotation.x = -tilt * 0.6 - Math.min(0.25, sp * 0.03); }
  if (R.dress) R.dress.rotation.x = -Math.min(0.2, sp * 0.03);
}

/* --------- hayvonlar --------- */
export function makeAnimal(kind = 'ot', o = {}) {
  const P = { qoy: { body: [0.26, 0.48], col: o.col || '#ece6d6', leg: 0.3, neck: 0.22, headL: 0.24, wool: 1 }, echki: { body: [0.22, 0.46], col: o.col || '#5a4a3a', leg: 0.42, neck: 0.3, headL: 0.24, ears: 0 }, it: { body: [0.18, 0.5], col: o.col || '#9a7448', leg: 0.4, neck: 0.25, headL: 0.26 }, mushuk: { body: [0.1, 0.32], col: o.col || '#c9b394', leg: 0.2, neck: 0.12, headL: 0.12, ears: 0 },
    ot: { body: [0.42, 1.25], col: o.col || '#7a4426', leg: 0.85, neck: 0.75, headL: 0.55, sc: 1 }, eshak: { body: [0.3, 0.9], col: o.col || '#8a8278', leg: 0.6, neck: 0.5, headL: 0.45, sc: 1, ears: 1 }, tuya: { body: [0.48, 1.3], col: o.col || '#b08a5a', leg: 1.25, neck: 1.1, headL: 0.5, sc: 1, hump: 1 } }[kind];
  const root = new T.Group(); const m = std(P.col, { roughness: 0.75 }), dk = std(kind === 'ot' ? '#1d120a' : '#5a5048');
  const body = new T.Group(); body.position.y = P.leg + P.body[0]; root.add(body);
  const torso = new T.Mesh(capsule(P.body[0], P.body[1], 12), m); torso.rotation.x = Math.PI / 2; body.add(torso);
  if (P.wool) { for (let k = 0; k < 7; k++) { const w = new T.Mesh(new T.SphereGeometry(P.body[0] * 0.75, 8, 6), m); w.position.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.3) * 0.15, -0.3 + k * 0.1); body.add(w); } }
  if (P.hump) for (const z of [-0.35, 0.35]) { const h = new T.Mesh(new T.SphereGeometry(0.32, 12, 8), m); h.scale.set(1, 1.1, 1.1); h.position.set(0, 0.42, z); body.add(h); }
  const neckG = new T.Group(); neckG.position.set(0, 0.15, P.body[1] / 2 + 0.15); body.add(neckG);
  const neck = new T.Mesh(capsule(P.body[0] * 0.48, P.neck, 8), m); neck.position.set(0, P.neck * 0.45, 0.12); neck.rotation.x = kind === 'tuya' ? 0.3 : 0.55; neckG.add(neck);
  const headG = new T.Group(); headG.position.set(0, P.neck * 0.95, P.neck * 0.35 + (kind === 'tuya' ? 0.2 : 0)); neckG.add(headG);
  const head = new T.Mesh(capsule(P.body[0] * 0.38, P.headL, 8), m); head.rotation.x = Math.PI / 2 + 0.5; head.position.set(0, -0.1, 0.18); headG.add(head);
  for (const s of [-1, 1]) { const ear = new T.Mesh(new T.ConeGeometry(0.045, P.ears ? 0.32 : 0.14, 6), m); ear.position.set(s * 0.08, 0.12, -0.02); ear.rotation.z = -s * 0.25; headG.add(ear); const eye = new T.Mesh(new T.SphereGeometry(0.025, 6, 4), std('#0a0a0a')); eye.position.set(s * 0.12, 0, 0.1); headG.add(eye); }
  if (o.saddle === undefined && (kind === 'qoy' || kind === 'echki' || kind === 'it' || kind === 'mushuk')) o.saddle = false;
  if (kind !== 'tuya' && !P.wool && kind !== 'it' && kind !== 'echki' && kind !== 'mushuk') { const mane = new T.Mesh(new T.BoxGeometry(0.06, P.neck * 1.05, 0.16), dk); mane.position.set(0, P.neck * 0.5, 0.0); mane.rotation.x = 0.55; neckG.add(mane); }
  const tail = new T.Mesh(capsule(0.05, kind === 'ot' ? 0.6 : 0.4, 6), dk); tail.position.set(0, 0.1, -P.body[1] / 2 - 0.35); tail.rotation.x = 0.4; body.add(tail);
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const hp = new T.Group(); hp.position.set(sx * P.body[0] * 0.55, P.leg, sz * (P.body[1] / 2 - 0.05)); root.add(hp);
    const up = new T.Mesh(capsule(0.07 * (kind === 'tuya' ? 1.1 : 1), P.leg * 0.4, 6), m); up.position.y = -P.leg * 0.25; hp.add(up);
    const kn = new T.Group(); kn.position.y = -P.leg * 0.5; hp.add(kn);
    const lo = new T.Mesh(capsule(0.05, P.leg * 0.38, 6), m); lo.position.y = -P.leg * 0.24; kn.add(lo);
    const hoof = new T.Mesh(new T.CylinderGeometry(0.06, 0.075, 0.08, 8), dk); hoof.position.y = -P.leg * 0.48; kn.add(hoof);
    legs.push({ hp, kn, sz });
  }
  // egar
  const saddleY = P.body[0] * 0.95 + (P.hump ? 0.45 : 0);
  if (o.saddle !== false) { const cl = new T.Mesh(new T.BoxGeometry(P.body[0] * 2.3, 0.04, 0.8), mat('sad' + kind, () => new T.MeshStandardMaterial({ map: TX.carpetTex(kind === 'ot' ? 0 : 2), roughness: 0.9, side: T.DoubleSide }))); cl.position.y = saddleY - 0.05; body.add(cl); const sd = new T.Mesh(new T.BoxGeometry(0.42, 0.12, 0.55), std('#4a2a16')); sd.position.y = saddleY + 0.04; body.add(sd); }
  root.traverse((x) => { if (x.isMesh) x.castShadow = true; });
  const A = { root, body, neckG, headG, legs, tail, kind, P, t: 0, seatY: P.leg + P.body[0] + saddleY + 0.07 };
  return A;
}
export function animateAnimal(A, dt, sp) {
  A.t += dt; const g = Math.min(1, sp / (A.kind === 'ot' ? 9 : 5)), ph = A.t * (4 + g * 7);
  A.legs.forEach((l, i) => { const off = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][i]; const s = Math.sin(ph + off); l.hp.rotation.x = s * (0.15 + g * 0.55) * Math.min(1, sp * 2); l.kn.rotation.x = Math.max(0, Math.sin(ph + off + (l.sz > 0 ? -0.8 : 0.8))) * (0.4 + g * 0.6) * Math.min(1, sp * 2) * (l.sz > 0 ? -1 : 1) * -1; });
  A.body.position.y = (A.rigged ? A.restY : A.P.leg + A.P.body[0]) + Math.abs(Math.sin(ph)) * 0.06 * g;
  A.body.rotation.x = Math.sin(ph) * 0.04 * g;
  A.neckG.rotation.x = Math.sin(ph) * 0.08 * g + (sp < 0.1 ? Math.sin(A.t * 0.5) * 0.08 + 0.1 : 0);
  A.tail.rotation.z = Math.sin(A.t * 2) * 0.2;
}

// Arava (eshak aravasi) — mission uchun
export function makeCart() {
  const g = new T.Group(), w = std('#7a5534'), w2 = std('#5d3f26');
  for (const s of [-1, 1]) { const wh = new T.Group(); wh.position.set(s * 0.95, 0.85, 0); g.add(wh); const rim = new T.Mesh(new T.TorusGeometry(0.82, 0.06, 6, 20), w2); rim.rotation.y = Math.PI / 2; wh.add(rim); const hub = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.28, 10), w2); hub.rotation.z = Math.PI / 2; wh.add(hub); for (let k = 0; k < 8; k++) { const sp = new T.Mesh(new T.BoxGeometry(0.04, 1.6, 0.04), w2); sp.rotation.x = k * Math.PI / 8; wh.add(sp); } g.userData['wheel' + s] = wh; }
  const bed = new T.Mesh(new T.BoxGeometry(1.8, 0.1, 2.2), w); bed.position.y = 1.2; g.add(bed);
  for (const s of [-1, 1]) { const sd = new T.Mesh(new T.BoxGeometry(0.06, 0.3, 2.2), w); sd.position.set(s * 0.9, 1.4, 0); g.add(sd); const sh = new T.Mesh(new T.BoxGeometry(0.07, 0.07, 2.4), w2); sh.position.set(s * 0.45, 0.95, 2.0); sh.rotation.x = 0.2; g.add(sh); }
  const cov = new T.Mesh(new T.BoxGeometry(1.6, 0.05, 1.9), mat('cartc', () => new T.MeshStandardMaterial({ map: TX.carpetTex(1), roughness: 0.9 }))); cov.position.y = 1.28; g.add(cov);
  g.traverse((x) => { if (x.isMesh) x.castShadow = true; }); return g;
}
// Kaptar
export function makePigeon() { const g = new T.Group(), m = std('#9aa0ab'), w = std('#e8e8ea'); const b = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), m); b.scale.set(0.8, 0.8, 1.3); b.position.y = 0.15; g.add(b); const h = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), std('#6a7a8a')); h.position.set(0, 0.27, 0.12); g.add(h); const bk = new T.Mesh(new T.ConeGeometry(0.02, 0.06, 5), std('#d9a640')); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.26, 0.2); g.add(bk); for (const s of [-1, 1]) { const wg = new T.Mesh(new T.BoxGeometry(0.22, 0.02, 0.18), w); wg.position.set(s * 0.12, 0.2, -0.02); g.add(wg); g.userData['w' + s] = wg; } return g; }
// Atlas qanot (parashyut)
export function makeParachute() {
  const g = new T.Group(); const c = new T.Mesh(new T.SphereGeometry(3.2, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), new T.MeshStandardMaterial({ map: TX.fabricTex('atlas', 2), side: T.DoubleSide, roughness: 0.7 })); c.scale.set(1.3, 0.8, 0.9); c.position.y = 2.2; g.add(c);
  const lm = new T.LineBasicMaterial({ color: '#ddd' }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(Math.cos(a) * 2.4, 3.6 - 1.6, Math.sin(a) * 1.6)]); g.add(new T.Line(geo, lm)); }
  g.position.y = 1.6; return g;
}

// 3D do'ppi: to'rt qirrali, burchaklari yumaloq, tepasi to'rt qirra bo'ylab cho'qqiga yig'iladi (Chust uslubi)
export function makeDoppi(id) {
  const tex = (id === 'chust' || id === 'iroqi_yashil') ? TX.doppiReal(id) : TX.doppiTex(id);
  const geo = new T.CylinderGeometry(1, 1, 1, 48, 10, true); const p = geo.attributes.position, uv = geo.attributes.uv;
  const R0 = 0.118, wall = 0.085, roof = 0.055;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i) + 0.5; // 0..1
    const th = Math.atan2(z, x) + Math.PI / 4; const sq = 1 / Math.pow(Math.pow(Math.abs(Math.cos(th)), 5) + Math.pow(Math.abs(Math.sin(th)), 5), 1 / 5);
    const rr = R0 * (0.9 + 0.1 * sq) * sq * 0.92;
    let k, yy; if (y < 0.7) { k = 1 - y * 0.06; yy = y / 0.7 * wall; } else { const t = (y - 0.7) / 0.3; k = (1 - 0.042) * (1 - t * 0.97); yy = wall + Math.sin(t * Math.PI / 2) * roof; }
    const a = Math.atan2(z, x); p.setXYZ(i, Math.cos(a) * rr * k, yy, Math.sin(a) * rr * k);
    uv.setY(i, y < 0.7 ? y / 0.7 * 0.62 : 0.62 + (y - 0.7) / 0.3 * 0.38);
  }
  geo.computeVertexNormals();
  const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, roughness: 0.75, side: T.DoubleSide, metalness: id === 'zardozi' ? 0.3 : 0 })); m.castShadow = true;
  const lining = new T.Mesh(new T.CircleGeometry(R0 * 0.9, 24), new T.MeshStandardMaterial({ color: '#1a1a1a' })); lining.rotation.x = Math.PI / 2; m.add(lining);
  return m;
}
export function setRiggedHat(R, id) {
  while (R.hatSlot.children.length) R.hatSlot.remove(R.hatSlot.children[0]);
  if (!id || id === 'asl') return;
  const d = makeDoppi(id); d.position.set(0, 0.155, 0.012); d.rotation.x = -0.08; d.scale.setScalar(1.08); R.hatSlot.add(d);
}

// Asboblar: pichoq, qoshiq (kapgir), sanchqi, ayri (pichan uchun), xaskash. Uzunligi bo'ylab +Y.
export function makeTool(kind) {
  const g = new T.Group(); const metal = std('#b9bec4', { metalness: 0.85, roughness: 0.3 }), dark = std('#1e2226', { metalness: 0.6, roughness: 0.5 }), wood = std('#a8743e', { roughness: 0.7 }), woodD = std('#7a5230', { roughness: 0.8 });
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, rz = 0) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; g.add(o); return o; };
  if (kind === 'pichoq') { add(new T.CylinderGeometry(0.016, 0.018, 0.13, 8), dark, 0, 0.0); for (let i = 0; i < 4; i++) add(new T.TorusGeometry(0.017, 0.003, 4, 10), dark, 0, -0.05 + i * 0.03, 0, Math.PI / 2); add(new T.BoxGeometry(0.07, 0.008, 0.012), metal, 0, 0.07); const b = add(new T.BoxGeometry(0.032, 0.2, 0.004), metal, 0.002, 0.17); b.scale.x = 1; add(new T.ConeGeometry(0.016, 0.05, 4), metal, 0.002, 0.295, 0, 0, 0).scale.set(1, 1, 0.15); }
  else if (kind === 'qoshiq') { add(new T.CylinderGeometry(0.012, 0.016, 0.6, 8), wood, 0, 0.1); const bowl = add(new T.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood, 0, 0.42, 0.02, -Math.PI / 2); bowl.scale.set(1, 1, 0.6); }
  else if (kind === 'sanchqi') { add(new T.BoxGeometry(0.02, 0.13, 0.004), metal, 0, 0); for (let i = 0; i < 4; i++) add(new T.BoxGeometry(0.004, 0.06, 0.003), metal, -0.012 + i * 0.008, 0.1); add(new T.BoxGeometry(0.034, 0.012, 0.004), metal, 0, 0.07); }
  else if (kind === 'vila') { add(new T.CylinderGeometry(0.018, 0.02, 1.35, 7), wood, 0, 0.35); add(new T.CylinderGeometry(0.02, 0.02, 0.18, 7), dark, 0, 1.1); add(new T.BoxGeometry(0.2, 0.025, 0.02), dark, 0, 1.2); for (let i = 0; i < 4; i++) add(new T.ConeGeometry(0.008, 0.32, 5), dark, -0.09 + i * 0.06, 1.37); }
  else if (kind === 'xaskash') { add(new T.CylinderGeometry(0.018, 0.02, 1.5, 8), wood, 0, 0.42); add(new T.BoxGeometry(0.42, 0.03, 0.025), std('#1f5a2e', { metalness: 0.5, roughness: 0.4 }), 0, 1.18); for (let i = 0; i < 11; i++) add(new T.ConeGeometry(0.007, 0.08, 4), std('#1f5a2e', { metalness: 0.5 }), -0.2 + i * 0.04, 1.14, 0.0, Math.PI, 0); }
  else if (kind === 'ketmon') { add(new T.CylinderGeometry(0.02, 0.022, 1.25, 8), wood, 0, 0.3); const blade = add(new T.BoxGeometry(0.2, 0.22, 0.008), metal, 0, 0.98, 0.1, 1.2); add(new T.TorusGeometry(0.03, 0.008, 6, 10, Math.PI), metal, 0, 0.96, 0.02); }
  else if (kind === 'oroq') { add(new T.CylinderGeometry(0.018, 0.022, 0.32, 8), woodD, 0, 0); const arc = add(new T.TorusGeometry(0.17, 0.012, 4, 24, Math.PI * 1.25), std('#7a4a2a', { metalness: 0.6, roughness: 0.6 }), 0.15, 0.17, 0); arc.scale.set(1, 1, 0.35); }
  return g;
}
export function attachTool(R, kind) {
  const t = makeTool(kind); const hand = R.handR || R.armR.el; if (!R.handR) t.position.y = -0.27;
  if (kind === 'vila' || kind === 'xaskash' || kind === 'ketmon') { t.position.y += -0.55; t.rotation.x = 0.15; } else t.rotation.x = -1.2;
  hand.add(t); R.tool = t; return t;
}
