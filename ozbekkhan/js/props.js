// Realistik buyumlar (Poly Haven, CC0): GLTF modellar, har bir tur uchun InstancedMesh.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_BASE } from './tex.js';

const loader = new GLTFLoader();
const cache = new Map();
function loadModel(id) {
  if (!cache.has(id)) cache.set(id, loader.loadAsync(ASSET_BASE + 'models/' + id + '/' + id + '.gltf').then((g) => {
    const parts = []; g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => { if (o.isMesh) { const m = o.material; if (m.map) m.map.anisotropy = 4; parts.push({ geo: o.geometry, mat: m, local: o.matrixWorld.clone() }); } });
    const box = new THREE.Box3().setFromObject(g.scene); return { parts, box };
  }).catch(() => null));
  return cache.get(id);
}
// list: [{ id, x, y, z, ry, s }]
export async function placeProps(group, list, { shadows = true } = {}) {
  const by = new Map(); for (const p of list) { if (!by.has(p.id)) by.set(p.id, []); by.get(p.id).push(p); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
  await Promise.all([...by.entries()].map(async ([id, ps]) => {
    const mdl = await loadModel(id); if (!mdl) return;
    for (const part of mdl.parts) {
      const im = new THREE.InstancedMesh(part.geo, part.mat, ps.length);
      ps.forEach((p, i) => { E.set(p.rx || 0, p.ry || 0, 0); Q.setFromEuler(E); const s = p.s || 1; M.compose(V.set(p.x, p.y || 0, p.z), Q, S.set(s, s * (p.sy || 1), s)); M.multiply(part.local); im.setMatrixAt(i, M); if (p.col) im.setColorAt(i, new THREE.Color(p.col)); });
      im.instanceMatrix.needsUpdate = true; im.castShadow = shadows && id !== 'grass_medium_01'; im.receiveShadow = shadows; im.computeBoundingSphere(); group.add(im);
    }
  }));
}

// Haqiqiy daraxtlar (Poly Haven modellaridan 4 tomondan suratga olingan billboard): assets/trees/<id>.png + .json
const TL = new THREE.TextureLoader();
const treeCache = new Map();
async function treeAsset(id) {
  if (!treeCache.has(id)) treeCache.set(id, (async () => {
    const meta = await fetch(ASSET_BASE + 'trees/' + id + '.json').then((r) => r.json());
    const tex = await TL.loadAsync(ASSET_BASE + 'trees/' + id + '.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 });
    // 4 ta kesishgan tekislik, har biriga atlasning o'z ko'rinishi; normal yuqoriga og'dirilgan (yumshoq yoritish)
    const parts = []; const w = meta.w, h = meta.w;
    for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 4); g.rotateY(-i / 4 * Math.PI * 2 + (i % 2 ? 0 : 0)); g.translate(0, meta.cy - meta.base, 0); const n = g.attributes.normal; for (let k = 0; k < n.count; k++) { n.setY(k, 0.6); } g.normalizeNormals?.(); parts.push(g); }
    const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
    return { geo: mergeGeometries(parts), mat, meta };
  })().catch(() => null));
  return treeCache.get(id);
}
// list: [{ id, x, y, z, s }] -> InstancedMesh har tur uchun; true qaytaradi agar haqiqiy daraxtlar yuklangan bo'lsa
export async function placeTrees(group, list, { shadows = true } = {}) {
  const by = new Map(); for (const t of list) { if (!by.has(t.id)) by.set(t.id, []); by.get(t.id).push(t); }
  const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), V = new THREE.Vector3(), Sv = new THREE.Vector3(); let ok = false;
  for (const [id, ts] of by) { const a = await treeAsset(id); if (!a) continue; ok = true;
    const im = new THREE.InstancedMesh(a.geo, a.mat, ts.length);
    ts.forEach((t, i) => { Qn.setFromAxisAngle(V.set(0, 1, 0), t.ry || 0); const s = t.s || 1; M.compose(new THREE.Vector3(t.x, t.y || 0, t.z), Qn, Sv.set(s, s, s)); im.setMatrixAt(i, M); });
    im.castShadow = shadows; im.receiveShadow = false; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); group.add(im); }
  return ok;
}
