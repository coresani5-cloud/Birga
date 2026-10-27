// meshopt -> oddiy GLB, kerakli animatsiyalarni qisqa nom bilan qoldiradi
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, prune, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [src, dst, map, drop] = process.argv.slice(2);
const doc = await io.read(src); const root = doc.getRoot();
for (const e of root.listExtensionsUsed()) if (/meshopt|quantization/.test(e.extensionName)) e.dispose();
if (map) {
  const M = JSON.parse(map); // {"idle":"CharacterArmature|Idle", ...}
  const want = new Map(Object.entries(M).map(([k, v]) => [v, k]));
  for (const a of root.listAnimations()) { if (want.has(a.getName())) a.setName(want.get(a.getName())); else a.dispose(); }
}
if (drop) { const D = new Set(drop.split(',')); for (const n of root.listNodes()) if (D.has(n.getName())) { n.getMesh()?.dispose(); n.dispose(); } }
await doc.transform(dequantize(), dedup(), prune());
await io.write(dst, doc);
