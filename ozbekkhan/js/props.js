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
