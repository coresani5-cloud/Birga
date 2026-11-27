// BEK — asosiy o'yin dvigateli.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { REGIONS, regionById, UZ_OUTLINE, RIVERS } from './regions.js';
import { buildRegion, drawMapImage, CELL } from './build.js';
import { makeHuman, animate, makeAnimal, animateAnimal, makeCart, makePigeon, makeParachute, WEAR, setRiggedHat, makeTool, attachTool } from './actors.js';
import { placeProps, placeTrees } from './props.js';
import { createLighting, regionWeather, WEATHER, makeGradePass } from './lighting.js';
import { loadRigSource, makeRigged, loadAnimalSource, makeRiggedAnimal } from './rig.js';
import * as TX from './tex.js';
import { MISSIONS, SIDE } from './missions.js';
import * as AU from './audio.js';
import { GOODS, priceAt, localGoods, capacity, invCount, CRAFT } from './econ.js';

const T = THREE, V3 = T.Vector3;
const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer:coarse)').matches;
if (isTouch) document.body.classList.add('is-touch');
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

/* ================= sozlamalar va saqlash ================= */
let Q = +(store.get('oz_q') ?? (isTouch ? 0 : 1)); const QN = ['Past', 'O\'rta', 'Yuqori'];
const SAVE = 'bek_v1';
const OUTFITS = { hero: 'Ko\'k-oltin chopon (asosiy)' };
const defSave = () => ({ region: 'buxoro', money: 40, obro: 0, outfit: 'hero', done: {}, unlock: {}, time: 9.5, hp: 100, inv: {}, day: 0 });
let S = (() => { try { const j = JSON.parse(store.get(SAVE)); if (j?.region) return { ...defSave(), ...j }; } catch {} return null; })();
const save = () => store.set(SAVE, JSON.stringify(S));

/* ================= renderer ================= */
const canvas = $('gl');
const renderer = new T.WebGLRenderer({ canvas, antialias: Q > 0, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, [0.8, 1.25, 2][Q])); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = Q > 0; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.toneMapping = T.ACESFilmicToneMapping;
const scene = new T.Scene(); scene.fog = new T.Fog('#c9d3dc', 120, 2600);
const camera = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 4000);
const LG = createLighting(renderer, scene, { quality: Q });
let composer = null;
const grade = makeGradePass({ sharp: Q > 0 ? 0.35 : 0 }); grade.uniforms.res.value.set(innerWidth, innerHeight);
composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); if (Q > 1) composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.3, 0.5, 0.85)); composer.addPass(new OutputPass()); composer.addPass(grade);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); grade.uniforms.res.value.set(innerWidth, innerHeight); });
const waterMat = new T.MeshStandardMaterial({ color: '#3c7f86', roughness: 0.06, metalness: 0.3, normalMap: TX.waterNormal(), normalScale: new T.Vector2(0.35, 0.35) }); waterMat.normalMap.repeat.set(3, 3);

/* ================= AI personaj modellari ================= */
const RIG = {}; // rol -> manba
let TREES_OK = false; fetch('assets/trees/tree_small_02.json').then((r) => (TREES_OK = r.ok)).catch(() => {});
const RIG_NAMES = ['hero_v2', 'hero', 'hero_beqasam_yashil', 'hero_adras', 'hero_zardozi', 'oqsoqol', 'ayol', 'ayol2', 'savdogar', 'ishchi', 'posbon', 'sarboz', 'navkar', 'chavandoz', 'qishki', 'darvesh', 'ayol3', 'ayol4', 'ayol5', 'ayol6', 'ayol7', 'olim', 'munajjim', 'kotib', 'savdogar2', 'chopon', 'boyoqchi', 'arab', 'yigit_beqasam', 'qiz_atlas', 'bola', 'bola_oq', 'bola_kok', 'bola_beqasam', 'bola_dutor', 'xitoy_qiz', 'xitoy_bola'];
const ANI = {}; const ANI_NAMES = { qoy2: 0.8, tovuq: 0.45, ot: 1.65, ot_yuk: 1.7, tuya: 2.15, tuya_yuk: 2.3, tuya_gilam: 2.2, eshak: 1.25, eshak_yuk: 1.35, echki: 0.8, qoy: 0.85 };
async function loadRigs() { await Promise.all(RIG_NAMES.map(async (n) => { const s = await loadRigSource(n); if (s) RIG[n] = s; }).concat(Object.entries(ANI_NAMES).map(async ([n, h]) => { const s = await loadAnimalSource(n, h); if (s) ANI[n] = s; }))); }
const USED = {}; const ADULT = () => Object.keys(RIG).filter((k) => !k.startsWith('ayol') && k !== 'qiz_atlas' && !k.startsWith('bola') && !k.startsWith('xitoy') && !k.startsWith('hero'));
const leastUsed = (list) => list.filter((k) => RIG[k]).sort((a, b) => (USED[a] || 0) - (USED[b] || 0) || rnd() - 0.5)[0];
const pickRole = (r) => { const alt = { posbon: ['sarboz', 'navkar', 'posbon'], ayol: ['ayol', 'ayol2', 'ayol3', 'ayol4', 'ayol5', 'ayol6', 'ayol7', 'qiz_atlas'], ishchi: ['ishchi', 'kotib', 'chavandoz', 'savdogar2', 'qishki', 'boyoqchi', 'yigit_beqasam'], oqsoqol: ['oqsoqol', 'olim', 'darvesh', 'munajjim'], savdogar: ['savdogar', 'savdogar2', 'arab'], olim: ['olim', 'munajjim', 'kotib'], bola: ['bola', 'bola_oq', 'bola_kok', 'bola_beqasam'] }[r]; if (!alt) return r; return leastUsed(alt) || r; };
function makePerson(role, look = {}, o = {}) {
  const key = role === 'hero' ? (S?.outfit && S.outfit !== 'hero' ? S.outfit : RIG.hero_v2 ? 'hero_v2' : 'hero') : pickRole(role);
  const fb = !RIG[key] && role !== 'hero' && role !== 'bola' && role !== 'ayol' ? leastUsed(ADULT()) : null;
  const usedKey = RIG[key] ? key : fb; if (usedKey && role !== 'hero') USED[usedKey] = (USED[usedKey] || 0) + 1;
  let src = RIG[key] || (fb ? RIG[fb] : null) || (role === 'ayol' ? RIG[leastUsed(['ayol', 'ayol2', 'ayol3', 'ayol4', 'ayol5', 'ayol6', 'ayol7', 'qiz_atlas'])] : null);
  // sodda (procedural) odamlar ishlatilmaydi: mos model bo'lmasa — mavjud realistik modellardan eng kam ishlatilgani
  if (!src && role !== 'hero') { const any = Object.keys(RIG).filter((k) => !k.startsWith('hero')); const k = leastUsed(any); if (k) { USED[k] = (USED[k] || 0) + 1; src = RIG[k]; } }
  if (src && role !== 'hero') { const R = makeRigged(src); const m = R.mesh; m.material = src.mat.clone(); const h = rnd(); m.material.color.setRGB(0.82 + h * 0.18, 0.82 + ((h * 7) % 1) * 0.18, 0.82 + ((h * 13) % 1) * 0.18); if (/^(bola|xitoy)/.test(role)) R.root.scale.setScalar(0.7); else R.root.scale.setScalar(0.95 + rnd() * 0.1); return R; }
  if (src) { const R = makeRigged(src); if (/^(bola|xitoy)/.test(role) || /^(bola|xitoy)/.test(key)) R.root.scale.setScalar(0.7); return R; }
  return makeHuman(look, { ...o, child: o.child || /^(bola|xitoy)/.test(role), female: o.female || role === 'xitoy_qiz' });
}
const roleOf = (n) => ({ kitobxon: 'olim', sotuvchi: 'savdogar', oshpaz: 'oqsoqol', choyxonachi: 'savdogar', mehmon: rnd() < 0.5 ? 'oqsoqol' : 'savdogar', usta: 'ishchi', kulol: 'oqsoqol' }[n] || 'ishchi');

/* ================= holat ================= */
let RES = null, R = null, C = null, A = null, heightAt = () => 0, mapImg = null;
const P = { pos: new V3(0, 0, 100), vy: 0, yaw: Math.PI, speed: 0, mode: 'foot', mount: null, hp: 100, st: 100, onGround: true, fallFrom: 0, punchT: 0, hitCd: 0, carry: null, carryObj: null, para: null, pose: null, poseT: 0 };
let hero = null, camYaw = Math.PI, camPitch = 0.25, camDist = 4.6;
let shake = 0, foeT = 0, foe = null;
function showFoeHp(n) { foe = n; foeT = 3; }
let critters = [], npcs = [], mounts = [], guards = [], givers = [], fxSmoke = [], props = [], markers = [];
let heat = 0, heatCool = 0, playing = false, paused = false, underground = false;
const inp = { f: 0, s: 0, run: false, jump: false, use: false, steal: false, mount: false, punch: false, wave: false };

/* ================= hudud yuklash ================= */
async function loadRegion(id, from = 'gate') {
  fade(true); await wait(350);
  if (RES) { scene.remove(RES.group); RES.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  for (const n of npcs) scene.remove(n.R.root); for (const m of mounts) scene.remove(m.root); for (const g of guards) scene.remove(g.R.root); for (const g of givers) scene.remove(g.mark);
  npcs = []; mounts = []; guards = []; givers = []; heat = 0; endMission(null, true); for (const k in USED) delete USED[k]; for (const c of critters) scene.remove(c.root); critters = [];
  R = regionById(id); S.region = id;
  RES = buildRegion(R, { quality: Q, shadows: Q > 0, waterMat, realTrees: TREES_OK }); scene.add(RES.group);
  C = RES.C; A = RES.A; heightAt = RES.heightAt; mapImg = drawMapImage(RES, R);
  for (const t of A.tools) { const m = makeTool(t.kind); m.position.set(t.x, t.y, t.z); m.rotation.set(t.rx || 0, t.ry || 0, 0, 'YXZ'); m.scale.setScalar(t.s || 1); RES.group.add(m); }
  await placeProps(RES.group, A.props, { shadows: Q > 0 }); await placeTrees(RES.group, A.realTrees, { shadows: Q > 0 });
  LG.mats = RES.mats; LG.setLanterns(A.lanterns); LG.setWeather(regionWeather(id));
  spawnWorld();
  P.pos.set(0, 0, 100); P.yaw = Math.PI; camYaw = Math.PI; P.vy = 0; if (P.mount) dismount(true);
  if (from === 'save' && S.pos) { P.pos.set(S.pos[0], S.pos[1], S.pos[2]); }
  await TX.texReady(); fade(false);
  banner(R.name, `${R.city} · ${R.era}${LG.weather !== 'clear' ? ' · ' + WEATHER[LG.weather].n : ''}`);
  if (AU.Audio.radio && AU.Audio.on) AU.setStation(AU.REGION_STATION[id] ?? 0);
  save();
}

/* ================= NPC: o'z ishi bilan band odamlar ================= */
const NODES = []; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) NODES.push([i * CELL, j * CELL]);
const nodeAt = (x, z) => NODES.reduce((b, n) => (Math.hypot(n[0] - x, n[1] - z) < Math.hypot(b[0] - x, b[1] - z) ? n : b));
function npcLook(role) { const old = role === 'oqsoqol'; const hats = ['chust', 'iroqi', 'oddiy', R.hat, 'samarqand']; return { skin: rnd() * 5 | 0, beard: old ? 3 : rnd() * 3 | 0, hat: old ? 'salla' : hats[rnd() * hats.length | 0], coat: ['beqasam_0', 'beqasam_1', 'beqasam_3', 'adras_0', 'movut_0'][rnd() * 5 | 0], belt: ['qizil', 'oq', 'yashil'][rnd() * 3 | 0] }; }
function addNpc(o) {
  const Rr = makePerson(o.role, npcLook(o.role), { female: o.role === 'ayol', child: o.role === 'bola' });
  Rr.root.position.set(o.x, o.y || 0, o.z); Rr.root.rotation.y = o.ry || 0; scene.add(Rr.root); if (o.tool) attachTool(Rr, o.tool);
  const n = { R: Rr, pos: Rr.root.position, yaw: o.ry || 0, ...o, hp: o.role === 'posbon' ? 6 : 4, maxHp: o.role === 'posbon' ? 6 : 4, state: o.walk ? 'walk' : 'idle', t: rnd() * 5, target: null, prev: null, lane: (rnd() - 0.5) * 3, speed: o.role === 'bola' ? 2.4 : 1.1 + rnd() * 0.5, angry: 0, talkT: 0, greeted: false };
  npcs.push(n); return n;
}
function spawnWorld() {
  for (const n of RES.npcs) addNpc({ ...n, role: n.name === 'Dehqon' || n.name === 'Bog\'bon' ? 'ishchi' : roleOf(n.role), job: n.role, pose: n.pose, name: n.name });
  const night = S.time > 21 || S.time < 5.5, NP = Q > 0 ? (night ? 10 : 26) : 12;
  for (let i = 0; i < NP; i++) { const nd = NODES[rnd() * NODES.length | 0]; const role = ['ishchi', 'savdogar', 'oqsoqol', 'ayol', 'ayol', 'bola', 'ishchi'][rnd() * 7 | 0]; const n = addNpc({ x: nd[0] + (rnd() - 0.5) * 3, z: nd[1] + (rnd() - 0.5) * 3, role, walk: true, pose: 'walk' }); n.target = nd; if (role === 'bola' && rnd() < 0.5) n.play = true; }
  // ulovlar: bog'langan otlar, ko'chada yurgan chavandozlar va aravalar
  for (const h of A.horses) addMount('ot', h.x, h.z, h.ry, { tied: true });
  const nr = Q > 0 ? 4 : 2; for (let i = 0; i < nr; i++) { const nd = NODES[rnd() * NODES.length | 0]; const kind = ['ot', 'eshak', 'arava', R.land === 'desert' ? 'tuya' : 'eshak'][i % 4]; const m = addMount(kind, nd[0], nd[1], 0, { rider: true }); m.target = nd; }
  if (R.id === 'navoiy' || R.id === 'xorazm') for (let i = 0; i < 3; i++) addMount('tuya', 18 + i * 3, 130, rnd() * 6, { tied: true });
  // karvonchilar: yuk hayvonini yetaklab yuruvchi odamlar (o'z ishi bilan band)
  const nc = Q > 0 ? 3 : 1; for (let i = 0; i < nc; i++) { const nd = NODES[rnd() * NODES.length | 0]; const n = addNpc({ x: nd[0], z: nd[1], role: 'ishchi', walk: true, pose: 'walk' }); n.speed = 1.0; const kind = R.land === 'desert' || R.id === 'navoiy' ? (i % 2 ? 'tuya' : 'eshak') : ['eshak', 'ot', 'eshak'][i % 3]; const m = addMount(kind, nd[0], nd[1] - 2.5, 0, { pack: true, led: n }); m.tied = true; n.leads = m; }
  { const nd = NODES[rnd() * NODES.length | 0]; const m = addMount('ot', nd[0], nd[1], 0, { rider: true, riderRole: 'posbon' }); m.target = nd; } // otliq qo'riqchi
  const herd = (x, z, n, kind = 'qoy') => { const sh = addNpc({ x, z, role: 'chopon', walk: true, pose: 'walk' }); sh.speed = 0.7; for (let i = 0; i < n; i++) addCritter(kind === 'mix' ? (rnd() < 0.7 ? (ANI.qoy2 && rnd() < 0.4 ? 'qoy2' : 'qoy') : 'echki') : kind, x + (rnd() - 0.5) * 6, z + (rnd() - 0.5) * 6, sh); };
  herd(25, 135, Q > 0 ? 12 : 6, 'mix'); if (rnd() < 0.6) { const nd = NODES[rnd() * NODES.length | 0]; herd(nd[0], nd[1], Q > 0 ? 6 : 3); }
  for (let i = 0; i < (Q > 0 ? 8 : 3); i++) { const d = A.doors[rnd() * A.doors.length | 0]; const k = ['echki', 'it', 'mushuk', 'mushuk', 'it'][i % 5]; addCritter(k, d.x, d.z, null); }
  if (ANI.tovuq) for (let i = 0; i < (Q > 0 ? 10 : 4); i++) { const d = A.doors[rnd() * A.doors.length | 0]; addCritter('tovuq', d.x + (rnd() - 0.5) * 2, d.z + (rnd() - 0.5) * 2, null); }
  // bolalar: guruh bo'lib quvlashmachoq o'ynashadi
  for (let gI = 0; gI < (Q > 0 ? 3 : 1); gI++) { const nd = gI === 0 ? [-12, 8] : NODES[rnd() * NODES.length | 0]; const gc = { x: nd[0], z: nd[1] }; for (let i = 0; i < 3 + (rnd() * 2 | 0); i++) { const n = addNpc({ x: gc.x + (rnd() - 0.5) * 4, z: gc.z + (rnd() - 0.5) * 4, role: 'bola', pose: 'walk' }); n.kid = gc; n.speed = 3.2; } }
  { const p = freeSpot(14, 14); const n = addNpc({ x: p.x, z: p.z, ry: -2.4, role: 'bola_dutor', pose: 'dutor', name: 'Dutorchi bola' }); n.musician = true; const dt2 = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(0.11, 12, 8), new T.MeshStandardMaterial({ color: '#b07a3a', roughness: 0.6 })); body.scale.set(1, 1.35, 0.55); dt2.add(body); const neck = new T.Mesh(new T.BoxGeometry(0.03, 0.62, 0.02), new T.MeshStandardMaterial({ color: '#6b4220' })); neck.position.y = 0.42; dt2.add(neck); dt2.position.set(0.05, 1.0, 0.2); dt2.rotation.z = 0.9; n.R.root.add(dt2); }
  { const p = freeSpot(5.5, 40); for (const [i, role] of [[0, 'xitoy_qiz'], [1, 'xitoy_bola']]) { const n = addNpc({ x: p.x + i * 1.4, z: p.z, ry: Math.PI / 2 * (i ? -1 : 1), role, pose: 'xdance', name: i ? 'Xitoylik bola' : 'Xitoylik qiz' }); n.kidName = true; } }
  // sarboz patrullari (juft bo'lib yuradi)
  { const nd = NODES[rnd() * NODES.length | 0]; const a = addNpc({ x: nd[0], z: nd[1], role: 'posbon', walk: true, pose: 'walk' }); const b = addNpc({ x: nd[0] + 1.2, z: nd[1], role: 'posbon', walk: true, pose: 'walk' }); a.speed = b.speed = 1.2; b.follow = a; }
  // hammollar (yuk ko'targan) va supuruvchilar
  for (let i = 0; i < (Q > 0 ? 3 : 1); i++) { const nd = NODES[rnd() * NODES.length | 0]; const n = addNpc({ x: nd[0], z: nd[1], role: 'ishchi', walk: true, pose: 'carry' }); n.carryPose = true; n.speed = 0.9; const sack = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshStandardMaterial({ color: '#c9a873', roughness: 0.9 })); sack.scale.set(1.2, 0.8, 0.9); sack.position.set(0, 1.75, -0.05); n.R.root.add(sack); }
  for (const d of A.doors.slice(0, Q > 0 ? 4 : 2)) addNpc({ x: d.x, z: d.z, ry: d.ry, role: 'ishchi', pose: 'work', job: 'supuruvchi' });
  // topshiriq beruvchilar
  const list = (R.mission ? [R.mission] : []).concat(SIDE);
  spawnTrader(); spawnCarts();
  for (const id of list) { const M = MISSIONS[id]; if (!M) continue; let g; try { g = M.giver.at(A); } catch { g = null; } if (!g) continue; const p = freeSpot(g.x, g.z); const n = addNpc({ x: p.x, z: p.z, ry: rnd() * 6, role: id === 'mehmon' ? 'ayol' : id === 'kurash' || id === 'kopkari' ? 'posbon' : 'oqsoqol', pose: 'idle', name: M.giver.name, mission: id });
    const mk = new T.Mesh(new T.OctahedronGeometry(0.22), new T.MeshBasicMaterial({ color: M.job ? '#5ad16a' : M.side ? '#19b3ad' : '#e6b84c' })); mk.position.set(p.x, 2.35, p.z); scene.add(mk); givers.push({ id, n, mark: mk }); n.giver = true; }
}
function addCritter(kind, x, z, leader) { const A2 = ANI[kind] ? makeRiggedAnimal(ANI[kind], kind) : makeAnimal(kind); A2.root.position.set(x, 0, z); scene.add(A2.root); const c = { A: A2, root: A2.root, pos: A2.root.position, yaw: rnd() * 6.28, leader, kind, t: rnd() * 5, tx: x, tz: z }; critters.push(c); return c; }
function updateCritters(dt) {
  for (const c of critters) {
    const d2 = c.pos.distanceToSquared(P.pos); c.root.visible = d2 < 90 * 90; if (d2 > 70 * 70) continue;
    c.t -= dt; let sp = 0;
    if (c.leader) { const L = c.leader; const d = Math.hypot(L.pos.x - c.pos.x, L.pos.z - c.pos.z); if (d > 6 || c.t <= 0) { c.tx = L.pos.x - Math.sin(L.yaw) * 3 + (rnd() - 0.5) * 6; c.tz = L.pos.z - Math.cos(L.yaw) * 3 + (rnd() - 0.5) * 6; c.t = 2 + rnd() * 3; } }
    else if (c.t <= 0) { c.tx = c.pos.x + (rnd() - 0.5) * 10; c.tz = c.pos.z + (rnd() - 0.5) * 10; c.t = 3 + rnd() * 5; }
    if (d2 < 5 && c.kind !== 'it') { c.tx = c.pos.x + (c.pos.x - P.pos.x) * 3; c.tz = c.pos.z + (c.pos.z - P.pos.z) * 3; }
    const dd = Math.hypot(c.tx - c.pos.x, c.tz - c.pos.z); if (dd > 0.6) { sp = c.kind === 'it' ? 2.2 : dd > 4 ? 1.6 : 0.7; stepToward(c, c.tx, c.tz, sp, dt, 0.3); }
    c.root.rotation.y = c.yaw; animateAnimal(c.A, dt, sp); if (sp === 0) c.A.neckG.rotation.x = 0.6 + Math.sin(c.t * 2) * 0.1;
  }
}
let freeCarts = [];
function spawnCarts() { for (const c of freeCarts) scene.remove(c.obj); freeCarts = []; for (const c of A.carts) { const obj = makeCart(); obj.position.set(c.x, 0, c.z); obj.rotation.y = c.ry; scene.add(obj); C.add(c.x - 1.1, c.z - 1.1, c.x + 1.1, c.z + 1.1, 1.4, -1); freeCarts.push({ obj, x: c.x, z: c.z, col: C.b[C.b.length - 1] }); } }
function hitchCart(fc) { const m = P.mount; scene.remove(fc.obj); fc.col.top = -999; freeCarts = freeCarts.filter((x) => x !== fc); const cart = makeCart(); cart.position.z = -2.2 - (m.kind === 'ot' ? 0.3 : 0); m.root.add(cart); m.cart = cart; m.hitched = true; hero.root.position.set(0, 1.05, -2.0 - (m.kind === 'ot' ? 0.3 : 0)); toast('Arava ulandi! Endi ko\'proq yuk sig\'adi.'); AU.sfx('good'); }
function unhitchCart() { const m = P.mount; if (!m?.hitched) return; m.root.remove(m.cart); const back = -2.4; const x = m.pos.x + Math.sin(m.yaw) * back, z = m.pos.z + Math.cos(m.yaw) * back; const obj = makeCart(); obj.position.set(x, 0, z); obj.rotation.y = m.yaw; scene.add(obj); freeCarts.push({ obj, x, z, col: C.add(x - 1.1, z - 1.1, x + 1.1, z + 1.1, 1.4, -1) }); m.cart = null; m.hitched = false; hero.root.position.set(0, m.A.seatY - (m.A.rigged ? 0.55 : 0.95), 0); toast('Arava ajratildi'); }
function spawnTrader() { const p = freeSpot(-3.2, 103); const n = addNpc({ x: p.x, z: p.z, ry: Math.PI, role: 'savdogar', pose: 'idle', name: 'Ipak yo\'li savdogari' }); n.trader = true; const mk = new T.Mesh(new T.OctahedronGeometry(0.22), new T.MeshBasicMaterial({ color: '#ffffff' })); mk.position.set(p.x, 2.35, p.z); scene.add(mk); givers.push({ id: null, n, mark: mk }); }
function freeSpot(x, z) { for (let r = 0; r < 12; r += 1) for (let a = 0; a < 6.28; a += 0.8) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (C.ground(px, pz, 0.2, 0.4) < 0.7) { let ok = true; for (const i of C.near(px, pz)) { const b = C.b[i]; if (px > b.x0 - 0.4 && px < b.x1 + 0.4 && pz > b.z0 - 0.4 && pz < b.z1 + 0.4 && b.top > 0.7) ok = false; } if (ok) return { x: px, z: pz }; } } return { x, z }; }
function addMount(kind, x, z, ry, o = {}) {
  const aKey = o.pack ? { ot: 'ot_yuk', tuya: 'tuya_yuk', eshak: 'eshak_yuk' }[kind] : { ot: 'ot', tuya: ANI.tuya_gilam && rnd() < 0.5 ? 'tuya_gilam' : 'tuya', eshak: ANI.eshak ? 'eshak' : 'eshak_yuk', arava: 'eshak_yuk' }[kind];
  const an = ANI[aKey] ? makeRiggedAnimal(ANI[aKey], kind) : makeAnimal(kind === 'arava' ? 'eshak' : kind); const root = new T.Group(); root.add(an.root);
  let cart = null; if (kind === 'arava') { cart = makeCart(); cart.position.z = -2.2; root.add(cart); }
  root.position.set(x, 0, z); root.rotation.y = ry; scene.add(root);
  const m = { kind, A: an, root, cart, pos: root.position, yaw: ry, speed: 0, ...o, riderR: null, owned: false };
  if (o.rider) { m.riderR = makePerson(o.riderRole || (rnd() < 0.5 ? 'savdogar' : 'ishchi'), npcLook('ishchi')); m.riderR.root.position.set(0, kind === 'arava' ? 1.05 : an.seatY - (an.rigged ? 0.55 : 0.95), kind === 'arava' ? -2.0 : 0); root.add(m.riderR.root); }
  mounts.push(m); return m;
}
function stepToward(o, tx, tz, sp, dt, r = 0.35) {
  const dx = tx - o.pos.x, dz = tz - o.pos.z, d = Math.hypot(dx, dz); if (d < 0.05) return 0;
  const ty = Math.atan2(dx, dz); o.yaw += angDiff(o.yaw, ty) * Math.min(1, dt * 6);
  const m = Math.min(d, sp * dt); o.pos.x += Math.sin(o.yaw) * m; o.pos.z += Math.cos(o.yaw) * m; C.push(o.pos, r, 0); return d;
}
function updateNpcs(dt) {
  const pp = P.pos;
  for (const n of npcs) {
    const d2 = n.pos.distanceToSquared(pp); const vis = d2 < 120 * 120; n.R.root.visible = vis;
    n.t += dt; let sp = 0, pose = n.pose || 'idle';
    if (n.state === 'down') { n.downT -= dt; pose = 'lie'; if (n.downT <= 0) { n.state = n.angry ? 'fight' : 'flee'; n.R.root.rotation.x = 0; } }
    else if (n.state === 'fight') { // qarshi mushtlashadi: yaqinlashadi, aylanib yuradi, zarba beradi
      const d = Math.sqrt(d2); const chaseR = n.owner ? 60 : 22; if (d > chaseR || P.hp <= 0) { n.state = 'walk'; n.angry = 0; } else if (d > 1.3) { const sp2 = P.mode === 'ride' ? 6.5 : 5.2; stepToward(n, pp.x, pp.z, sp2, dt); sp = sp2; pose = 'walk'; } else { n.yaw += angDiff(n.yaw, Math.atan2(pp.x - n.pos.x, pp.z - n.pos.z)) * dt * 8; n.atkT = (n.atkT || 0.6) - dt; n.pt = (n.pt || 0) + dt * 2.6; if (n.atkT > 0.35) { pose = 'guard'; const sx = Math.cos(n.yaw), sz = -Math.sin(n.yaw); n.pos.x += sx * Math.sin(n.t) * dt * 0.8; n.pos.z += sz * Math.sin(n.t) * dt * 0.8; } else { pose = 'punch'; if (n.atkT <= 0) { n.atkT = 0.8 + rnd() * 0.6; n.pt = 0; if (P.mode === 'ride' && n.owner) { dismount(true); toast('Egasi sizni ulovdan tortib tushirdi!'); } else if (P.block) { AU.sfx('tak'); toast('To\'sib qoldingiz'); } else { hurt(n.role === 'posbon' ? 12 : 8, 'Musht yedingiz!'); shake = 0.25; } } } }
    } else if (n.state === 'flee') { const ax = n.pos.x - pp.x, az = n.pos.z - pp.z, l = Math.hypot(ax, az) || 1; stepToward(n, n.pos.x + ax / l * 5, n.pos.z + az / l * 5, 4.5, dt); sp = 4.5; pose = 'walk'; n.fleeT = (n.fleeT || 6) - dt; if (n.fleeT <= 0) { n.state = n.walk ? 'walk' : 'idle'; n.fleeT = 0; } }
    else if (n.kid) { // o'yin: guruh markazi atrofida yugurish, ba'zan sakrash
      n.kt = (n.kt || 0) - dt; if (!n.kp || n.kt <= 0 || Math.hypot(n.kp[0] - n.pos.x, n.kp[1] - n.pos.z) < 0.6) { n.kp = [n.kid.x + (rnd() - 0.5) * 9, n.kid.z + (rnd() - 0.5) * 9]; n.kt = 1 + rnd() * 2.5; n.rest = rnd() < 0.25 ? 1.2 : 0; }
      if (n.rest > 0) { n.rest -= dt; pose = rnd() < 0.01 ? 'jump' : 'idle'; } else { sp = n.speed; stepToward(n, n.kp[0], n.kp[1], sp, dt, 0.25); pose = 'walk'; }
    }
    else if (n.walk) {
      if (!n.target || Math.hypot(n.target[0] + n.lane - n.pos.x, n.target[1] + n.lane - n.pos.z) < 1) { const cur = nodeAt(n.pos.x, n.pos.z); const nb = NODES.filter((q) => Math.abs(q[0] - cur[0]) + Math.abs(q[1] - cur[1]) === CELL && (!n.prev || q[0] !== n.prev[0] || q[1] !== n.prev[1])); n.prev = cur; n.target = nb[rnd() * nb.length | 0] || cur; if (rnd() < 0.15) { n.state = 'idle'; n.idleT = 2 + rnd() * 4; } }
      if (n.state === 'idle') { n.idleT -= dt; if (n.idleT <= 0) n.state = 'walk'; }
      else if (n.follow) { const f = n.follow; const d = Math.hypot(f.pos.x - n.pos.x, f.pos.z - n.pos.z); sp = d > 1.6 ? f.speed * 1.1 : 0; if (sp) stepToward(n, f.pos.x - Math.cos(f.yaw) * 1.2, f.pos.z + Math.sin(f.yaw) * 1.2, sp, dt); pose = 'walk'; }
      else { sp = n.play ? 2.6 : n.speed; stepToward(n, n.target[0] + n.lane, n.target[1] + n.lane, sp, dt); pose = n.carryPose ? 'carry' : 'walk'; }
      // o'yinchiga yo'l berish
      if (d2 < 1.2) { const ax = n.pos.x - pp.x, az = n.pos.z - pp.z, l = Math.hypot(ax, az) || 1; n.pos.x += ax / l * dt * 2; n.pos.z += az / l * dt * 2; }
    } else { // joyida ish: sotuvchi qo'l harakati, oshpaz kavlaydi, mehmon o'tiradi
      if (d2 < 36 && !n.giver && pose !== 'sit' && pose !== 'work') n.yaw += angDiff(n.yaw, Math.atan2(pp.x - n.pos.x, pp.z - n.pos.z)) * dt * 2;
      if (n.waveT > 0) { n.waveT -= dt; pose = 'wave'; }
    }
    if (n.kb) { n.pos.x += n.kb.x * dt; n.pos.z += n.kb.z * dt; n.kb.x *= 0.85; n.kb.z *= 0.85; C.push(n.pos, 0.35, 0); if (Math.abs(n.kb.x) + Math.abs(n.kb.z) < 0.05) n.kb = null; }
    if (n.hitT > 0) { n.hitT -= dt; pose = 'hit'; }
    if (vis && d2 < 70 * 70) { n.R.root.rotation.y = n.yaw; n.pos.y = n.y || Math.max(0, C.ground(n.pos.x, n.pos.z, 0.5)) ; animate(n.R, dt, { pose, speed: sp, pt: pose === 'hit' ? 1 - n.hitT / 0.35 : Math.min(1, n.pt || 0) }); }
  }
  for (const n of npcs) if (n.musician) { const d = n.pos.distanceTo(P.pos); n.noteT = (n.noteT || 0) - dt; if (n.noteT <= 0 && d < 22) { n.noteT = 0.24; AU.streetDutor(Math.max(0, 1 - d / 22)); } }
  for (const g of givers) { if (!g.id) { g.mark.rotation.y += dt * 2; continue; } g.mark.position.set(g.n.pos.x, 2.35 + Math.sin(performance.now() / 300) * 0.1, g.n.pos.z); g.mark.rotation.y += dt * 2; g.mark.visible = !M_ || M_.id !== g.id; }
  // ulovlar
  for (const m of mounts) {
    if (m === P.mount) continue;
    let sp = 0;
    if (m.led && m.led.state !== 'down') { const L = m.led; const d = Math.hypot(L.pos.x - m.pos.x, L.pos.z - m.pos.z); if (d > 2.4) { stepToward(m, L.pos.x, L.pos.z, L.speed * 1.15, dt, 0.8); sp = L.speed * 1.15; } }
    else if (m.riderR && m.target && !m.tied) { const d = stepToward(m, m.target[0] + 1.6, m.target[1] + 1.6, m.kind === 'ot' ? 3.2 : 1.8, dt, 0.9); sp = m.kind === 'ot' ? 3.2 : 1.8; if (d < 1.5) { const cur = nodeAt(m.pos.x, m.pos.z); const nb = NODES.filter((q) => Math.abs(q[0] - cur[0]) + Math.abs(q[1] - cur[1]) === CELL && (!m.prev || q[0] !== m.prev[0] || q[1] !== m.prev[1])); m.prev = cur; m.target = nb[rnd() * nb.length | 0] || cur; } }
    m.root.rotation.y = m.yaw; if (m.pos.distanceToSquared(P.pos) < 80 * 80) { animateAnimal(m.A, dt, sp); if (m.riderR) animate(m.riderR, dt, { pose: m.kind === 'arava' ? 'sit' : 'ride', speed: sp }); if (m.cart) spinWheels(m, sp, dt); }
  }
}
const spinWheels = (m, sp, dt) => { for (const s of [-1, 1]) { const w = m.cart.userData['wheel' + s]; if (w) w.rotation.x += sp * dt / 0.85; } };

/* ================= o'yinchi ================= */
function hurt(n, msg) { if (P.hitCd > 0 || P.hp <= 0) return; P.hp -= n; P.hitCd = 0.4; flash(); if (msg) toast(msg); if (P.hp <= 0) knockedOut(); }
async function knockedOut() {
  P.hp = 0; fade(true); await wait(700); const fine = Math.ceil(S.money * 0.15); S.money -= fine; S.obro = Math.max(0, S.obro - 5);
  P.hp = 70; heat = 0; clearGuards(); for (const n of npcs) if (n.state === 'fight') { n.state = 'walk'; n.angry = 0; }
  const c = A.choyxona; P.pos.set(c.x, 0, c.z + 2); if (P.mount) dismount(true); fade(false);
  await say('Choyxonachi', `Hushingizga keldingizmi, bolam? Sizni choyxonaga olib kelishdi. Tabib ${fine} tanga oldi. Endi ehtiyot bo'ling — mahalla hammasini ko'rib turadi.`, ['Rahmat']);
}
function punch() {
  if (P.mode !== 'foot' || P.punchT > 0.15) return; P.combo = P.punchT > 0 ? (P.combo || 0) + 1 : 0; P.punchT = 0.42; P.punchSide = P.combo % 2 ? -1 : 1; AU.sfx('tak');
  { const tgt = [...npcs].filter((n) => n.state !== 'down' && n.pos.distanceTo(P.pos) < 2.6).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos))[0]; if (tgt) P.yaw = Math.atan2(tgt.pos.x - P.pos.x, tgt.pos.z - P.pos.z); }
  const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
  for (const list of [npcs, guards.map((g) => g.n)]) for (const n of list) {
    if (!n || n.state === 'down') continue; const dx = n.pos.x - P.pos.x, dz = n.pos.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d < 1.4 && (dx * fx + dz * fz) / (d || 1) > 0.4) {
      const dmg = P.combo >= 2 ? 2 : 1; n.hp -= dmg; n.kb = { x: fx * (dmg > 1 ? 3.5 : 1.8), z: fz * (dmg > 1 ? 3.5 : 1.8) }; n.hitT = 0.35; shake = 0.18 * dmg; AU.sfx('step', 2.5); AU.sfx('tak'); showFoeHp(n);
      if (n.hp <= 0) { n.state = 'down'; n.downT = 5; n.hp = n.maxHp || 4; n.angry = rnd() < 0.35 && n.role !== 'bola' && n.role !== 'ayol'; toast(n.role === 'oqsoqol' ? 'Kattalarga qo\'l ko\'tarish — uyat!' : 'Yiqitdingiz!'); }
      else if (n.role === 'ishchi' || n.role === 'posbon' || (n.role === 'savdogar' && rnd() < 0.4)) { n.state = 'fight'; n.angry = 1; } else { n.state = 'flee'; n.fleeT = 6; }
      addHeat(n.role === 'oqsoqol' ? 1.2 : 0.6, true); S.obro = Math.max(0, S.obro - (n.role === 'oqsoqol' ? 3 : 1));
      break;
    }
  }
}
function updatePlayer(dt) {
  P.hitCd -= dt; P.punchT -= dt;
  const lockInput = paused || dlgOpen || qteOn || P.pose;
  const ix = lockInput ? 0 : inp.s, iz = lockInput ? 0 : inp.f, mag = Math.min(1, Math.hypot(ix, iz));
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
  let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix; const ml = Math.hypot(mx, mz); if (ml > 0) { mx /= ml; mz /= ml; }
  if (P.mode === 'ride') return updateRide(dt, mx, mz, mag);
  if (P.mode === 'para') return updatePara(dt, ix, iz);
  if (P.mode === 'carpet') return updateCarpet(dt);
  const running = inp.run && P.st > 2 && mag > 0.3 && !P.carry;
  const target = mag * (running ? 7.5 : P.carry === 'lagan' ? 2.0 : P.carry ? 3.0 : 4.2);
  P.speed = lerp(P.speed, target, Math.min(1, dt * 8));
  if (running) P.st = Math.max(0, P.st - dt * 9); else P.st = Math.min(100, P.st + dt * 14);
  if (mag > 0.05) P.yaw += angDiff(P.yaw, Math.atan2(mx, mz)) * Math.min(1, dt * 10);
  const sp = P.speed; P.pos.x += Math.sin(P.yaw) * sp * dt * (mag > 0.05 ? 1 : 0); P.pos.z += Math.cos(P.yaw) * sp * dt * (mag > 0.05 ? 1 : 0);
  if (mag <= 0.05) P.speed *= 0.8;
  C.push(P.pos, 0.32, P.pos.y);
  for (const n of npcs) { if (n.state === 'down' || n.y) continue; const dx = P.pos.x - n.pos.x, dz = P.pos.z - n.pos.z, d = Math.hypot(dx, dz); if (d < 0.62 && d > 1e-4) { const k = (0.62 - d) / d; P.pos.x += dx * k * 0.6; P.pos.z += dz * k * 0.6; n.pos.x -= dx * k * 0.4; n.pos.z -= dz * k * 0.4; } }
  for (const m of mounts) { if (m === P.mount) continue; const dx = P.pos.x - m.pos.x, dz = P.pos.z - m.pos.z, d = Math.hypot(dx, dz), R0 = m.cart ? 1.4 : 0.9; if (d < R0 && d > 1e-4) { P.pos.x = m.pos.x + dx / d * R0; P.pos.z = m.pos.z + dz / d * R0; } }
  // yer va tortishish
  const g0 = C.ground(P.pos.x, P.pos.z, P.pos.y, 0.15), tr = heightAt(P.pos.x, P.pos.z), ground = underground ? g0 : Math.max(g0, tr);
  if (inp.jump && P.onGround && !P.carry) { P.vy = 4.6; P.onGround = false; P.fallFrom = P.pos.y; }
  inp.jump = false;
  P.vy -= 14 * dt; P.pos.y += P.vy * dt;
  if (P.pos.y <= ground) { if (!P.onGround) { const fall = P.fallFrom - ground; if (fall > 5) hurt((fall - 5) * 9, 'Qattiq yiqildingiz!'); } P.pos.y = ground; P.vy = 0; P.onGround = true; P.fallFrom = ground; }
  else { if (P.onGround && P.pos.y - ground > 0.6) { P.onGround = false; P.fallFrom = P.pos.y; } else if (P.onGround) P.pos.y = ground; }
  if (!P.onGround && P.vy < -4 && S.unlock.qanot && inp.para) openPara();
  inp.para = false;
  const lim = 255; P.pos.x = clamp(P.pos.x, -lim, lim); P.pos.z = clamp(P.pos.z, -lim, lim);
  // qadam tovushi
  P.stepT = (P.stepT || 0) - dt * sp; if (P.onGround && sp > 0.5 && P.stepT <= 0) { AU.sfx('step', 0.5 + sp * 0.1); P.stepT = 0.8; }
  P.block = (keys.has('KeyV') || inp.block) && P.mode === 'foot';
  let pose = P.pose || (P.punchT > 0 ? (P.punchSide < 0 ? 'punch2' : 'punch') : P.block ? 'guard' : !P.onGround ? 'jump' : P.carry ? 'carry' : 'walk');
  hero.root.position.copy(P.pos); hero.root.rotation.y = P.yaw;
  animate(hero, dt, { pose, speed: P.onGround && !P.punchT ? sp : 0, pt: 1 - Math.max(0, P.punchT) / 0.42 });
}
function updateRide(dt, mx, mz, mag) {
  const m = P.mount, max = { ot: inp.run ? 12 : 7, eshak: 4.5, tuya: inp.run ? 7.5 : 4.5, arava: inp.run ? 6.5 : 4 }[m.kind];
  m.speed = lerp(m.speed, mag * max, Math.min(1, dt * 3));
  if (mag > 0.05) m.yaw += angDiff(m.yaw, Math.atan2(mx, mz)) * Math.min(1, dt * (m.kind === 'arava' ? 1.6 : 3));
  m.pos.x += Math.sin(m.yaw) * m.speed * dt; m.pos.z += Math.cos(m.yaw) * m.speed * dt;
  if (C.push(m.pos, m.kind === 'arava' ? 1.2 : 0.8, 0)) m.speed *= 0.85;
  // odamlarni urib yuborish
  if (m.speed > 4) for (const n of npcs) if (n.state !== 'down' && n.pos.distanceToSquared(m.pos) < 1.6) { n.state = 'down'; n.downT = 4; n.angry = rnd() < 0.3; addHeat(0.8, true); toast('Ehtiyot bo\'ling!'); }
  m.pos.y = underground ? 0 : heightAt(m.pos.x, m.pos.z);
  m.root.position.copy(m.pos); m.root.rotation.y = m.yaw;
  animateAnimal(m.A, dt, m.speed); if (m.cart) spinWheels(m, m.speed, dt);
  P.pos.copy(m.pos); P.yaw = m.yaw;
  m.hoofT = (m.hoofT || 0) - dt * m.speed; if (m.hoofT <= 0 && m.speed > 0.5) { AU.sfx('hoof'); m.hoofT = 1.1; }
  animate(hero, dt, { pose: m.kind === 'arava' ? 'sit' : 'ride', speed: m.speed });
}
function mountUp(m, how = 'own') {
  if (m.riderR) { // chavandozni tushirish (o'g'irlash)
    const rr = m.riderR; m.root.remove(rr.root); const n = addNpc({ x: m.pos.x + 1.4, z: m.pos.z, role: 'ishchi', walk: true }); scene.remove(n.R.root); n.R = rr; n.pos = rr.root.position; scene.add(rr.root); rr.root.position.set(m.pos.x + 1.4, 0, m.pos.z); n.state = 'down'; n.downT = 1.8; n.angry = 1; n.owner = true; toast('Egasi: "Ulovimni qaytar!"');
    m.riderR = null; addHeat(1.6, true); toast(m.kind === 'arava' ? 'Aravani tortib oldingiz!' : 'Ulovni tortib oldingiz!');
  } else if (how === 'steal') { addHeat(1.4, true); toast('Ot o\'g\'irlandi!'); const p = freeSpot(m.pos.x + 3, m.pos.z + 2); const o = addNpc({ x: p.x, z: p.z, role: 'chavandoz', walk: true }); o.state = 'fight'; o.angry = 1; o.owner = true; }
  if (m.led) { const L = m.led; L.state = 'fight'; L.angry = 1; L.leads = null; m.led = null; addHeat(1.2, true); toast('Karvonchi: "Hoy, yukimni qayoqqa?!"'); }
  m.tied = false; m.owned = true; P.mount = m; P.mode = 'ride';
  hero.root.position.set(0, m.kind === 'arava' ? 1.05 : m.A.seatY - (m.A.rigged ? 0.55 : 0.95), m.kind === 'arava' ? -2.0 : 0); hero.root.rotation.set(0, 0, 0); m.root.add(hero.root);
}
function dismount(silent) {
  const m = P.mount; if (!m) return; m.root.remove(hero.root); scene.add(hero.root); P.mode = 'foot'; P.mount = null; m.speed = 0;
  P.pos.set(m.pos.x + Math.cos(m.yaw) * 1.4, m.pos.y, m.pos.z - Math.sin(m.yaw) * 1.4); C.push(P.pos, 0.4, 0);
  if (m.mission && !silent) {}
}
let carpet = null;
function toggleCarpet() {
  if (!S.unlock.gilam) return toast('Uchar gilam yo\'q — bozordagi gilamfurushdan so\'rang');
  if (P.mode === 'carpet') { hero.root.remove(carpet); P.mode = 'foot'; P.onGround = false; P.fallFrom = P.pos.y; return; }
  if (P.mode !== 'foot') return;
  if (!carpet) { carpet = new T.Group(); const c = new T.Mesh(new T.PlaneGeometry(1.5, 2.3, 8, 8), new T.MeshStandardMaterial({ map: TX.realCarpet(), side: T.DoubleSide, roughness: 0.9 })); c.rotation.x = -Math.PI / 2; c.rotation.z = Math.PI / 2; carpet.add(c); for (const sz of [-1, 1]) for (let i = 0; i < 12; i++) { const f = new T.Mesh(new T.BoxGeometry(0.03, 0.01, 0.14), new T.MeshStandardMaterial({ color: '#e8d3a2' })); f.position.set(-0.7 + i * 0.127, 0, sz * 1.21); carpet.add(f); } carpet.userData.cloth = c; }
  carpet.position.set(0, 0.25, 0); hero.root.add(carpet); P.mode = 'carpet'; P.vy = 0; P.pos.y += 0.6; toast('Gilam ko\'tarildi!');
}
function updateCarpet(dt) {
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -Math.cos(camYaw), rz = Math.sin(camYaw); let mx = fx * inp.f + rx * inp.s, mz = fz * inp.f + rz * inp.s; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const max = inp.run ? 22 : 12; P.speed = lerp(P.speed, Math.min(1, ml) * max, dt * 2);
  if (ml > 0.05) P.yaw += angDiff(P.yaw, Math.atan2(mx, mz)) * Math.min(1, dt * 3);
  P.pos.x += Math.sin(P.yaw) * P.speed * dt; P.pos.z += Math.cos(P.yaw) * P.speed * dt;
  const up = (keys.has('Space') || inp.up ? 1 : 0) - (keys.has('KeyX') || inp.down ? 1 : 0); P.vy = lerp(P.vy, up * 6, dt * 3); P.pos.y += P.vy * dt;
  const g = Math.max(C.ground(P.pos.x, P.pos.z, P.pos.y + 50, 0.6), heightAt(P.pos.x, P.pos.z)); if (P.pos.y < g + 0.6) P.pos.y = g + 0.6; P.pos.y = Math.min(P.pos.y, 120);
  C.push(P.pos, 0.8, P.pos.y); P.pos.x = clamp(P.pos.x, -300, 300); P.pos.z = clamp(P.pos.z, -300, 300);
  const t = performance.now() / 1000, cl = carpet.userData.cloth.geometry.attributes.position; for (let i = 0; i < cl.count; i++) cl.setZ(i, Math.sin(cl.getY(i) * 3 + t * 6) * 0.04 * (0.3 + P.speed / max)); cl.needsUpdate = true;
  carpet.rotation.z = -angDiff(P.yaw, Math.atan2(mx || Math.sin(P.yaw), mz || Math.cos(P.yaw))) * 0.4; carpet.rotation.x = -P.vy * 0.03;
  hero.root.position.copy(P.pos); hero.root.position.y += Math.sin(t * 2) * 0.08; hero.root.rotation.y = P.yaw; animate(hero, dt, { pose: 'sit', speed: 0 });
}
function openPara() { P.mode = 'para'; P.para = makeParachute(); hero.root.add(P.para); toast('Atlas qanot ochildi!'); }
function updatePara(dt, ix, iz) {
  P.yaw -= ix * dt * 1.4; const fwd = 6 + iz * 2.5; P.pos.x += Math.sin(P.yaw) * fwd * dt; P.pos.z += Math.cos(P.yaw) * fwd * dt; P.vy = lerp(P.vy, -2.4, dt * 3); P.pos.y += P.vy * dt;
  const g = Math.max(C.ground(P.pos.x, P.pos.z, P.pos.y, 0.2), heightAt(P.pos.x, P.pos.z)); C.push(P.pos, 0.3, P.pos.y);
  if (P.pos.y <= g) { P.pos.y = g; P.mode = 'foot'; hero.root.remove(P.para); P.para = null; P.onGround = true; P.fallFrom = g; P.landed = true; }
  hero.root.position.copy(P.pos); hero.root.rotation.y = P.yaw; animate(hero, dt, { pose: 'para', speed: 0 });
}

/* ================= mahalla e'tibori (qidiruv) ================= */
const HEAT_TXT = ['', 'Qo\'shni xola derazadan qarab qoldi', 'Oqsoqol xabar topdi', 'Posbonlar safarbar etildi'];
function addHeat(v, witnessed) { const seen = witnessed && npcs.some((n) => n.state !== 'down' && n.pos.distanceToSquared(P.pos) < 18 * 18); heat = Math.min(3.2, heat + (seen ? v : v * 0.4)); heatCool = 0; }
function clearGuards() { for (const g of guards) { scene.remove(g.n.R.root); npcs = npcs.filter((n) => n !== g.n); if (g.horse) { scene.remove(g.horse.root); mounts = mounts.filter((x) => x !== g.horse); } } guards = []; }
function updateHeat(dt) {
  const lvl = Math.floor(heat);
  const want = lvl >= 3 ? 5 : lvl >= 2 ? 3 : heat >= 0.9 ? 1 : 0;
  while (guards.length < want) { const a = rnd() * 6.28, x = P.pos.x + Math.cos(a) * 24, z = P.pos.z + Math.sin(a) * 24; const p = freeSpot(x, z); const n = addNpc({ x: p.x, z: p.z, role: 'posbon', pose: 'walk', name: 'Mirshab' }); n.state = 'chase'; const g = { n }; if (lvl >= 3 && guards.length % 2 === 0) { const m = addMount('ot', p.x, p.z, 0, { rider: true, riderRole: 'posbon' }); g.horse = m; scene.remove(n.R.root); } guards.push(g); AU.sfx('whistle'); toast(guards.length === 1 ? 'Mirshab hushtak chaldi!' : 'Mirshablar quvmoqda!'); }
  let seen = false;
  for (const g of guards) { const n = g.n; if (g.horse) { const m = g.horse; const d = m.pos.distanceTo(P.pos); if (d < 40) seen = true; if (d > 2) { stepToward(m, P.pos.x, P.pos.z, P.mode === 'ride' ? 13 : 9, dt, 0.9); m.root.rotation.y = m.yaw; animateAnimal(m.A, dt, 9); if (m.riderR) animate(m.riderR, dt, { pose: 'ride', speed: 9 }); } else if (P.mode === 'ride') { dismount(true); toast('Mirshab sizni otdan tushirdi!'); } else { caught(); return; } n.pos.copy(m.pos); continue; }
    if (n.state === 'down') continue; const d = n.pos.distanceTo(P.pos); if (d < 35) seen = true; n.state = 'chase'; if (d > 1.0) { const sp = P.mode === 'ride' ? 6.8 : lvl >= 3 ? 6.0 : 5.4; stepToward(n, P.pos.x, P.pos.z, sp, dt); animate(n.R, dt, { pose: 'walk', speed: sp }); n.R.root.rotation.y = n.yaw; } else if (P.mode === 'foot') { caught(); return; } else if (rnd() < dt * 0.8) { dismount(true); toast('Mirshab sizni ulovdan tortib tushirdi!'); } }
  if (heat > 0) { heatCool += dt; const rate = (S.obro >= 50 ? 1 / 7 : 1 / 12) * (seen ? 0.15 : 1); if (heatCool > 3) heat = Math.max(0, heat - dt * rate); if (heat < 1.5 && guards.length) clearGuards(); }
  const el = $('hud-stars'); const l2 = Math.ceil(heat - 0.05);
  el.innerHTML = l2 > 0 ? [1, 2, 3].map((i) => `<span class="${i <= l2 ? 'on' : ''}">!</span>`).join('') + `<em>${HEAT_TXT[Math.min(3, l2)]}</em>` : '';
}
async function caught() { const fine = Math.ceil(S.money * 0.2); S.money -= fine; S.obro = Math.max(0, S.obro - 5); heat = 0; clearGuards(); fade(true); await wait(600); const c = A.choyxona; P.pos.set(c.x, 0, c.z + 2); if (P.mount) dismount(true); fade(false); await say('Mahalla oqsoqoli', `Posbonlar sizni ushlab keldi. Jarima — ${fine} tanga. Yoshsiz, hali hammasi oldinda. Lekin mahallaning obro'sini o'ylang, bolam.`, ['Uzr, oqsoqol']); }

/* ================= o'zaro ta'sir ================= */
let curAct = null;
function findAction() {
  if (P.mode === 'ride') { const m = P.mount; if ((m.kind === 'ot' || m.kind === 'eshak') && !m.cart) { const fc = freeCarts.find((c) => Math.hypot(c.x - m.pos.x, c.z - m.pos.z) < 4); if (fc) return { label: 'Aravani ulash · F — tushish', key: 'E', run: () => hitchCart(fc) }; } if (m.hitched) return { label: 'Aravani ajratish · F — tushish', key: 'E', run: () => unhitchCart() }; return { label: 'Ulovdan tushish', key: 'F', run: () => dismount() }; }
  if (P.mode !== 'foot') return null;
  let best = null, bd = 1e9; const consider = (d, a) => { if (d < bd) { bd = d; best = a; } };
  for (const g of givers) { const d = g.n.pos.distanceTo(P.pos); if (d < 2.4 && !M_) consider(d - 1, g.id ? { label: `${g.n.name}: ${MISSIONS[g.id].title}`, key: 'E', run: () => offerMission(g.id, g.n) } : { label: 'Savdo qilish (Ipak yo\'li)', key: 'E', run: () => tradeUI() }); }
  for (const m of mounts) { if (m === P.mount) continue; const d = m.pos.distanceTo(P.pos); if (d < 2.6) { if (m.riderR) consider(d, { label: m.kind === 'arava' ? 'Aravani tortib olish' : 'Chavandozni tushirib, ulovni olish', key: 'F', run: () => mountUp(m) }); else if (m.owned) consider(d, { label: 'Minish', key: 'F', run: () => mountUp(m) }); else consider(d, { label: `Ijaraga olish (5 tanga) · G — o'g'irlash`, key: 'E', run: () => { if (S.money < 5) return toast('Tanga yetmaydi'); S.money -= 5; AU.sfx('coin'); mountUp(m); }, steal: () => mountUp(m, 'steal') }); } }
  for (const p of RES.pois) { const d = Math.hypot(p.x - P.pos.x, p.z - P.pos.z); if (d < p.r && Math.abs((p.y || 0) - P.pos.y) < 2.5) consider(d + 0.5, poiAction(p)); if (p.top && Math.hypot(p.top.x - P.pos.x, p.top.z - P.pos.z) < 1.6 && Math.abs(p.top.y - P.pos.y) < 0.8) consider(0.2, { label: 'Pastga tushish', key: 'E', run: () => climb({ x: p.x, y: 0, z: p.z }) }); }
  for (const n of npcs) { if (n.giver || n.state === 'down') continue; const d = n.pos.distanceTo(P.pos); if (d < 1.8) consider(d + 0.3, { label: 'Gaplashish · Q — salom berish', key: 'E', run: () => talk(n), wave: () => greet(n) }); }
  return best;
}
function poiAction(p) {
  if (p.kind === 'stall') { const g = p.goods; const food = { non: ['Issiq non', 2, 25], qovun: ['Qovun', 3, 35], ziravor: ['Mayiz va yong\'oq', 2, 15] }[g];
    if (food) return { label: `${food[0]} olish (${food[1]} tanga) · G — o'g'irlash`, key: 'E', run: () => { if (S.money < food[1]) return toast('Tanga yetmaydi'); S.money -= food[1]; P.hp = Math.min(100, P.hp + food[2]); AU.sfx('coin'); toast(`${food[0]} — mazali! +${food[2]} sog'liq`); }, steal: () => { P.hp = Math.min(100, P.hp + food[2]); addHeat(1.3, true); toast('Sotuvchi: "Ushlang! O\'g\'ri!"'); const s = npcs.find((n) => n.job === 'sotuvchi' && n.pos.distanceTo(P.pos) < 4); if (s) { s.state = 'fight'; s.angry = 1; } } };
    const names = { doppi: 'Do\'ppi rastasi', kiyim: 'Kiyim-kechak', mahsi: 'Poyabzal', lagan: 'Rishton laganlari', atlas: 'Atlas va adras', gilam: 'Gilamlar' };
    return { label: `${names[g] || 'Rasta'} — ko'rish`, key: 'E', run: () => shopTalk(g) }; }
  if (p.kind === 'ladder') return { label: 'Tomga chiqish', key: 'E', run: () => climb(p.top) };
  if (p.kind === 'climb') return { label: 'Minoraga chiqish', key: 'E', run: () => climb(p.top) };
  if (p.kind === 'gate') return { label: 'Karvon yo\'li — xarita', key: 'E', run: () => openMap(true) };
  if (p.kind === 'choyxona') return { label: 'Choyxona: choy ichish (1 tanga) — saqlash', key: 'E', run: () => choyxona() };
  if (p.kind === 'hashar') return { label: 'Hasharga qo\'shilish — g\'isht terish', key: 'E', run: () => hashar() };
  return { label: p.label || '', key: 'E', run: () => {} };
}
async function climb(top) { fade(true); await wait(400); P.pos.set(top.x, top.y, top.z); P.vy = 0; P.onGround = true; P.fallFrom = top.y; fade(false); }
async function talk(n) { const lines = R.greet.concat(R.customs.map((c) => 'Bilasizmi? ' + c)); n.yaw = Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z); await say(n.name || ({ oqsoqol: 'Mo\'ysafid', savdogar: 'Savdogar', ayol: 'Opa', ishchi: 'Yigit', bola: 'Bola', posbon: 'Posbon' }[n.role] || 'O\'tkinchi'), lines[rnd() * lines.length | 0], ['Rahmat']); }
function greet(n) { n.waveT = 1.6; n.yaw = Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z); P.pose = 'wave'; P.poseT = 1.2; if (!n.greeted) { n.greeted = true; S.obro += 1; toast('Vaalaykum assalom! (+1 obro\')'); } else toast('Vaalaykum assalom!'); }
const OUTFIT_LIST = [['hero', 'Ko\'k-oltin chopon', 0], ['hero_beqasam_yashil', 'Yashil beqasam to\'n', 40], ['hero_adras', 'Adras chopon', 55], ['hero_zardozi', 'Zardo\'zi baxmal to\'n', 180]];
const HAT_LIST = [['asl', 'Asl do\'ppi', 0], ['chust', 'Chust do\'ppi', 15], ['iroqi_yashil', 'Yashil iroqi do\'ppi', 35], ['zardozi', 'Zardo\'zi do\'ppi', 80], ['samarqand', 'Samarqand do\'ppi', 18], ['shahrisabz', 'Shahrisabz do\'ppi', 25]];
function rebuildHero() { const pos = hero.root.position.clone(), par = hero.root.parent; par?.remove(hero.root); hero = makePerson('hero'); if (hero.rigged) setRiggedHat(hero, S.hat); hero.root.position.copy(pos); (par || scene).add(hero.root); }
function openWardrobe(shop) {
  S.owned = S.owned || { hero: 1, asl: 1 }; paused = true; document.exitPointerLock?.(); $('wardrobe').hidden = false; let tab = 'ton';
  const prevCam = [camYaw, camPitch, camDist]; camYaw = P.yaw + Math.PI; camPitch = 0.05; camDist = 2.6;
  const draw = () => {
    $('wd-title').textContent = shop ? 'Kiyim do\'koni' : 'Kiyimlar'; $('wd-money').textContent = S.money;
    $('wd-tabs').innerHTML = [['ton', 'To\'n'], ['doppi', 'Do\'ppi']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('');
    const list = tab === 'ton' ? OUTFIT_LIST.filter(([k]) => RIG[k]) : HAT_LIST; const cur = tab === 'ton' ? (S.outfit || 'hero') : (S.hat || 'asl');
    $('wd-list').innerHTML = list.map(([k, n, p]) => `<button class="wd-item ${k === cur ? 'on' : ''} ${!S.owned[k] && !shop ? 'locked' : ''}" data-k="${k}"><div class="nm">${esc(n)}</div><div class="pr">${S.owned[k] ? (k === cur ? 'Kiyilgan' : 'Sizniki') : p + ' tanga'}</div></button>`).join('') + (tab === 'ton' && list.length < OUTFIT_LIST.length ? '<div class="wd-desc">Yangi to\'nlar (yashil beqasam, adras, zardo\'zi) AI bilan tayyorlanmoqda — tayyor bo\'lgach shu yerda paydo bo\'ladi.</div>' : '');
    $('wd-desc').textContent = shop ? 'Bosing — kiyib ko\'ring va sotib oling.' : 'Faqat sotib olingan kiyimlar. Ko\'proq — bozordagi kiyim va do\'ppi rastalarida.';
    $('wd-tabs').querySelectorAll('button').forEach((b) => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('wd-list').querySelectorAll('.wd-item').forEach((b) => b.onclick = () => { const k = b.dataset.k, it = list.find((x) => x[0] === k); if (!S.owned[k]) { if (!shop) return toast('Bozorda sotib oling'); if (S.money < it[2]) return toast('Tanga yetmaydi'); S.money -= it[2]; S.owned[k] = 1; AU.sfx('coin'); } if (tab === 'ton') { S.outfit = k; rebuildHero(); } else { S.hat = k; if (hero.rigged) setRiggedHat(hero, k); } save(); draw(); });
  };
  $('wd-done').onclick = () => { $('wardrobe').hidden = true; paused = false; [camYaw, camPitch, camDist] = prevCam; save(); };
  $('wd-rot').onclick = () => { P.yaw += Math.PI / 2; hero.root.rotation.y = P.yaw; };
  draw();
}
async function shopTalk(g) { if (g === 'doppi' || g === 'kiyim' || g === 'atlas') return openWardrobe(true); if (g === 'gilam' && !S.unlock.gilam) { const c = await say('Gilamfurush', 'Bu oddiy gilam emas, bolam... Bobomdan qolgan uchar gilam! Afsonalarda aytilgan. 150 tanga — sizga arzon beraman.', ['Sotib olaman (150)', 'Yo\'q, rahmat']); if (c === 0) { if (S.money < 150) return toast('Tanga yetmaydi'); S.money -= 150; S.unlock.gilam = true; AU.sfx('good'); save(); await say('Gilamfurush', 'C tugmasi (telefonda "Gilam") — gilamga o\'tirish. Probel — yuqoriga, X — pastga. Ehtiyot bo\'ling, minoralarga urilmang!', ['Rahmat']); } return; } const t = { doppi: 'Do\'ppilarimiz — Chust, Iroqi, Zardo\'zi! Hammasi qo\'l mehnati.', kiyim: 'Beqasam, adras, movut — to\'nlarning eng zo\'ri shu yerda.', mahsi: 'Mahsi-kalish, charm etik — oyog\'ingiz rohat qiladi.', lagan: 'Rishton laganlari — ishqor rangi yuz yilga ham o\'chmaydi!', atlas: 'Marg\'ilon atlasi — abr naqshi qo\'lda bog\'langan.', gilam: 'Qashqadaryo gilami — qizning sepi, uyning ko\'rki.' }[g] || 'Xush kelibsiz!'; await say('Sotuvchi', t + '\n\n(Kiyim do\'koni keyingi yangilanishda: har xil to\'n va do\'ppili realistik qahramon modellari tayyorlanmoqda.)', ['Rahmat']); }
async function choyxona() { if (S.money < 1) return toast('Choyga ham tanga kerak!'); S.money -= 1; P.hp = 100; P.st = 100; save(); AU.sfx('coin'); const c = await say('Choyxonachi', `Marhamat, ko'k choy! ${R.customs[rnd() * R.customs.length | 0]}.\n\nO'yin saqlandi.`, ['Rahmat', 'Kechgacha dam olish', 'Tonggacha dam olish']); if (c === 1) S.time = 19; if (c === 2) S.time = 6.5; }
async function hashar() { const s = await qte('meter', { rounds: 5, title: 'G\'ishtni to\'g\'ri qo\'ying — oltin zonada bosing', zone: 0.24 }); const k = Math.round(s * 5); S.money += k * 3; S.obro += k; AU.sfx('good'); toast(`Hashar: ${k}/5 g'isht · +${k * 3} tanga, +${k} obro'`); }

/* ================= Ipak yo'li savdosi ================= */
function tradeUI() {
  dlgOpen = true; document.exitPointerLock?.(); S.inv = S.inv || {};
  const draw = () => {
    const cap = capacity(P.mount), used = invCount(S.inv), loc = localGoods(R.id);
    const keys = [...new Set(loc.concat(Object.keys(S.inv).filter((k) => S.inv[k] > 0)).concat(Object.keys(GOODS).slice(0, 0)))];
    const other = Object.keys(GOODS).filter((k) => !keys.includes(k));
    $('dlg-who').textContent = `Ipak yo'li savdogari · ${R.city}`;
    $('dlg-text').innerHTML = `<div style="margin-bottom:8px">Pulingiz: <b>${S.money}</b> tanga · Yuk: <b>${used}/${cap}</b>${P.mount ? '' : ' (ulov bilan ko\'proq sig\'adi)'}</div>` +
      `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:6px 10px;align-items:center;font-size:14px">` +
      keys.map((k) => { const p = priceAt(k, R.id, S.day); const sell = Math.max(1, Math.round(p * 0.85)); const own = S.inv[k] || 0; const local = loc.includes(k); return `<div>${esc(GOODS[k].n)}${local ? ' <span style="color:#7fe0d8">(mahalliy)</span>' : ''} · sizda ${own}</div><div>${local ? p + ' t' : ''}</div><button data-b="${k}" ${!local ? 'hidden' : ''}>Olish</button><button data-s="${k}" ${own ? '' : 'disabled'}>Sotish ${sell} t</button>`; }).join('') + `</div>` +
      `<div style="margin-top:10px;font-size:13px;color:#b9c3d6">Boshqa viloyatlarda qimmat: ${other.slice(0, 6).map((k) => esc(GOODS[k].n) + ' — ' + priceAt(k, R.id, S.day) + ' t').join(', ')}</div>`;
    $('dlg-btns').innerHTML = '<button id="tr-close">Yopish</button>';
    $('tr-close').onclick = () => { $('dialog').hidden = true; dlgOpen = false; save(); };
    $('dlg-text').querySelectorAll('button[data-b]').forEach((b) => b.onclick = () => { const k = b.dataset.b, p = priceAt(k, R.id, S.day); if (S.money < p) return toast('Tanga yetmaydi'); if (invCount(S.inv) >= capacity(P.mount)) return toast('Yuk joyi to\'ldi — ulov oling!'); S.money -= p; S.inv[k] = (S.inv[k] || 0) + 1; AU.sfx('coin'); draw(); });
    $('dlg-text').querySelectorAll('button[data-s]').forEach((b) => b.onclick = () => { const k = b.dataset.s; if (!S.inv[k]) return; S.inv[k]--; S.money += Math.max(1, Math.round(priceAt(k, R.id, S.day) * 0.85)); AU.sfx('coin'); draw(); });
  };
  draw(); $('dialog').hidden = false;
}

/* ================= topshiriqlar dvigateli ================= */
let M_ = null; class Fail extends Error {}
async function offerMission(id, n) {
  const M = MISSIONS[id]; const done = S.done[id + '@' + R.id];
  const c = await say(M.giver.name, M.intro + (done && !M.job ? '\n\n(Siz buni bajargansiz — mukofot kamroq bo\'ladi.)' : ''), [M.job ? 'Ishga kirishaman' : 'Qabul qilaman', 'Keyinroq']);
  if (c !== 0) return; runMission(id);
}
async function runMission(id) {
  const M = MISSIONS[id]; M_ = { id, waits: [], props: [], mounts: [], timer: 0, dead: false, giverPos: givers.find((g) => g.id === id)?.n.pos.clone() };
  const tok = M_;
  try { await M.run(G); if (tok.dead) return; endMission(true); } catch (e) { if (tok.dead && !(e instanceof Fail)) return; endMission(false, false, e instanceof Fail ? e.message : 'Xato: ' + e.message); }
}
function endMission(ok, silent, msg) {
  const m = M_; if (!m) return; m.dead = true; m.waits.forEach((w) => w.rej(new Fail('to\'xtatildi'))); M_ = null;
  m.props.forEach((p) => scene.remove(p)); clearMarkers(); if (P.mount?.mission) { const mm = P.mount; dismount(true); scene.remove(mm.root); mounts = mounts.filter((x) => x !== mm); } m.mounts.forEach((mm) => { scene.remove(mm.root); mounts = mounts.filter((x) => x !== mm); });
  setCarry(null); objHide(); $('hud-timer').hidden = true; qteClose();
  if (silent || ok === null) return;
  const M = MISSIONS[m.id], key = m.id + '@' + R.id;
  if (ok && M.job) { S.money += M.reward.tanga; S.obro += M.reward.obro; AU.sfx('coin'); banner('Ish tugadi', `${M.title} · +${M.reward.tanga} tanga · +${M.reward.obro} obro'`); save(); return; }
  if (ok) { const first = !S.done[key]; const k = first ? 1 : 0.3; S.money += Math.round(M.reward.tanga * k); S.obro += Math.round(M.reward.obro * k); S.done[key] = true; if (M.reward.unlock) S.unlock[M.reward.unlock] = true; AU.karnay(); banner('Topshiriq bajarildi', `${M.title} · +${Math.round(M.reward.tanga * k)} tanga · +${Math.round(M.reward.obro * k)} obro'`); save(); }
  else { AU.sfx('bad'); banner('Topshiriq bajarilmadi', msg || ''); }
}
function clearMarkers() { markers.forEach((m) => scene.remove(m)); markers = []; }
const beamMat = new T.MeshBasicMaterial({ color: '#e6b84c', transparent: true, opacity: 0.35, depthWrite: false });
function marker(x, y, z) { const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 30, 12, 1, true), beamMat); b.position.y = 15; g.add(b); const d = new T.Mesh(new T.OctahedronGeometry(0.3), new T.MeshBasicMaterial({ color: '#e6b84c' })); d.position.y = 2.2; g.add(d); g.position.set(x, y, z); scene.add(g); markers.push(g); return g; }
function until(fn) { return new Promise((res, rej) => { const tok = M_; if (!tok) return rej(new Fail('')); tok.waits.push({ fn, res, rej }); }); }
function updateMission(dt) {
  if (!M_) return; const m = M_;
  if (m.timer > 0) { m.timer -= dt; const t = Math.max(0, m.timer); $('hud-timer').hidden = false; $('hud-timer').textContent = `⏱ ${String(t / 60 | 0).padStart(2, '0')}:${String(t % 60 | 0).padStart(2, '0')}`; if (m.timer <= 0) { const w = m.waits.slice(); m.waits = []; w.forEach((x) => x.rej(new Fail('Vaqt tugadi!'))); } }
  for (const w of m.waits.slice()) { let ok = false; try { ok = w.fn(); } catch (e) { m.waits.splice(m.waits.indexOf(w), 1); w.rej(e); continue; } if (ok) { m.waits.splice(m.waits.indexOf(w), 1); w.res(true); } }
  markers.forEach((g) => { g.children[1].rotation.y += dt * 2; g.children[1].position.y = 2.2 + Math.sin(performance.now() / 300) * 0.15; });
}
let eDown = false; const consumeE = () => { const v = eDown; eDown = false; return v; };
function propModel(kind) {
  if (kind === 'pigeon') return makePigeon();
  const g = new T.Group(); const m = (geo, c) => { const x = new T.Mesh(geo, new T.MeshStandardMaterial({ color: c, roughness: 0.8 })); x.castShadow = true; g.add(x); return x; };
  if (kind === 'cotton') { m(new T.IcosahedronGeometry(0.28, 1), '#5f7a3a').position.y = 0.2; for (let i = 0; i < 4; i++) m(new T.SphereGeometry(0.09, 8, 6), '#ffffff').position.set((rnd() - 0.5) * 0.3, 0.42, (rnd() - 0.5) * 0.3); }
  else if (kind === 'flower') { m(new T.CylinderGeometry(0.02, 0.02, 0.4), '#3a6a2a').position.y = 0.2; m(new T.SphereGeometry(0.1, 8, 6), ['#d9263b', '#f2c230', '#e86aa0'][rnd() * 3 | 0]).position.y = 0.42; }
  else if (kind === 'pilla') { const x = m(new T.SphereGeometry(0.08, 10, 8), '#f4efe0'); x.scale.y = 1.5; }
  else if (kind === 'leaves') { for (let i = 0; i < 6; i++) m(new T.SphereGeometry(0.18, 6, 4), '#9a7a3a').position.set((rnd() - 0.5) * 0.8, 0.05, (rnd() - 0.5) * 0.8); }
  else if (kind === 'sack') { m(new T.SphereGeometry(0.3, 10, 8), '#c9a873').scale.set(1, 1.2, 1); g.children[0].position.y = 0.35; }
  else if (kind === 'cart') return makeCart();
  else if (kind === 'dasturxon') { const c = new T.Mesh(new T.PlaneGeometry(2.4, 1.6), new T.MeshStandardMaterial({ map: TX.carpetTex(2) })); c.rotation.x = -Math.PI / 2; c.position.y = 0.03; g.add(c); for (let i = 0; i < 5; i++) m(new T.CylinderGeometry(0.15, 0.1, 0.06, 12), '#e8e4dc').position.set(-0.8 + i * 0.4, 0.06, 0); }
  return g;
}
const G = {
  get A() { return A; }, get R() { return R; }, get P() { return P; }, rnd, get craft() { return CRAFT[R.id]; },
  addGood(g, n) { S.inv = S.inv || {}; const room = capacity(P.mount) - invCount(S.inv); const k = Math.max(0, Math.min(n, room)); S.inv[g] = (S.inv[g] || 0) + k; if (k < n) toast('Yuk joyi to\'ldi!'); },
  fail(msg) { throw new Fail(msg); },
  obj(title, text, o = {}) { objShow(title, text); if (o.timer) M_.timer = o.timer; },
  setTime(h) { S.time = h; }, radioTo(i) { if (AU.Audio.on) AU.setStation(i); },
  toast, give(t, o) { S.money += t; S.obro += o; },
  giverPos() { return M_.giverPos || P.pos.clone(); },
  unlock(k) { S.unlock[k] = true; },
  until,
  async reach(x, z, r, o = {}) { const mk = marker(x, heightAt(x, z), z); await until(() => { const ok = Math.hypot(P.pos.x - x, P.pos.z - z) < r && (!o.landed || (P.mode === 'foot' && P.onGround)); if (ok && o.needE) { showPrompt('E', 'Bajarish'); return consumeE(); } return ok; }); scene.remove(mk); markers = markers.filter((q) => q !== mk); },
  async collect(pts, o) {
    const items = pts.map((p) => { const md = o.model && o.model !== 'door' ? propModel(o.model) : null; if (md) { md.position.set(p.x, p.y ?? 0, p.z); scene.add(md); M_.props.push(md); } return { ...p, md, done: false, mk: null }; });
    if (o.timer) M_.timer = o.timer; let got = 0; const tot = items.length;
    const refresh = () => { objShow(o.title, o.text, `${got} / ${tot}`); clearMarkers(); for (const it of items) if (!it.done && (!o.ordered || it === items.find((q) => !q.done))) it.mk = marker(it.x, it.y ?? 0, it.z); };
    refresh();
    await until(() => {
      for (const it of items) { if (it.done || (o.ordered && it !== items.find((q) => !q.done))) continue; const d = Math.hypot(P.pos.x - it.x, P.pos.z - it.z); if (d < o.radius && Math.abs(P.pos.y - (it.y ?? 0)) < 2.2) { if (o.needE) { showPrompt('E', o.cost ? `Olish (${o.cost} tanga)` : 'Olish'); if (!consumeE()) continue; } if (o.cost) { if (S.money < o.cost) { toast('Tanga yetmaydi'); continue; } S.money -= o.cost; AU.sfx('coin'); } it.done = true; got++; AU.sfx('pick'); if (it.md) scene.remove(it.md); if (o.pose) { P.pose = o.pose; P.poseT = 0.8; } toast(`${got} / ${tot}`); refresh(); } }
      return got >= tot;
    });
    M_.timer = 0; $('hud-timer').hidden = true; clearMarkers();
  },
  async route(pts, o) { let i = 0; const tot = pts.length; for (const [x, z] of pts) { i++; objShow(o.title, 'Belgiga yeting', `${i} / ${tot}`); await G.reach(x, z, o.r); AU.sfx('pick'); } M_.timer = 0; $('hud-timer').hidden = true; },
  mount(kind, pos) { const p = pos || { x: P.pos.x + 2, z: P.pos.z }; const m = addMount(kind === 'ot' || kind === 'tuya' || kind === 'arava' || kind === 'eshak' ? kind : 'ot', p.x, p.z, P.yaw); m.mission = true; mountUp(m); },
  carry(k) { setCarry(k); }, prop(kind, x, y, z) { const md = propModel(kind); md.position.set(x, y, z); scene.add(md); M_.props.push(md); return md; }, removeProp(md) { scene.remove(md); },
  say, qte, wait,
  party(x, z) { const ds = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const n = addNpc({ x: x + Math.cos(a) * 3.5, z: z + Math.sin(a) * 3.5, ry: -a - Math.PI / 2, role: i % 2 ? 'ayol' : 'ishchi', pose: 'dance' }); ds.push(n); } return { stop() { ds.forEach((n) => { scene.remove(n.R.root); npcs = npcs.filter((q) => q !== n); }); } }; },
  async balance(x, z, r, failMsg = 'Osh to\'kildi!') { let spill = 0; const mk = marker(x, 0, z); let lastYaw = P.yaw; await until(() => { spill += (P.speed > 2.0 ? (P.speed - 2) * 0.25 : 0) * 0.016 + Math.abs(angDiff(lastYaw, P.yaw)) * 0.12 + (!P.onGround ? 0.05 : 0); lastYaw = P.yaw; spill = Math.max(0, spill - 0.0015); objShow('Lagan', 'To\'kmasdan yetkazing!', `To'kilish: ${Math.min(100, spill * 100 | 0)}%`); if (spill >= 1) throw new Fail(failMsg); return Math.hypot(P.pos.x - x, P.pos.z - z) < r; }); scene.remove(mk); },
  async kurash(k, i) { const opp = addNpc({ x: k.x, z: k.z - 1.2, ry: 0, role: 'ishchi', pose: 'kurash' }); P.pos.set(k.x, 0, k.z + 1.2); P.yaw = Math.PI; P.pose = 'kurash'; P.poseT = 999; M_.props.push(opp.R.root);
    try { const grip = await qte('mash', { title: `${i + 1}-bellashuv: ushlang! (tez-tez bosing)`, rate: 0.28 + i * 0.08 }); if (!grip) return false; const st = ['oldinga engashdi', 'orqaga tisarildi', 'yon tomonga og\'di'][rnd() * 3 | 0]; const c = await qte('choice', { title: `Raqib ${st}. Usul tanlang:`, opts: ['Chalish', 'Ko\'tarib tashlash', 'Yonbosh'] }); const best = { 'oldinga engashdi': 0, 'orqaga tisarildi': 1, 'yon tomonga og\'di': 2 }[st]; const s = await qte('meter', { rounds: 1, title: 'Hozir!', zone: c === best ? 0.34 : 0.12 }); const win = s > 0; if (win) { opp.state = 'down'; opp.downT = 3; toast(c === best ? 'HALOL!' : 'Yonbosh!'); } await wait(900); return win; }
    finally { P.pose = null; scene.remove(opp.R.root); npcs = npcs.filter((n) => n !== opp); } },
  async kopkari(K) { const goat = propModel('sack'); goat.scale.set(1.4, 0.8, 2); scene.add(goat); M_.props.push(goat); let holder = null, me = 0, them = 0; const riders = []; for (let i = 0; i < 3; i++) { const m = addMount('ot', K.x + 15 + i * 4, K.z + 10, 0, { rider: true }); m.ai = true; M_.mounts.push(m); riders.push(m); } let gx = K.x, gz = K.z; const goal = K.goal; const mk = marker(goal.x, 0, goal.z); M_.timer = 180;
    return until(() => { const dt = 0.016; objShow('Ko\'pkari', holder === 'me' ? 'Oq doiraga olib boring!' : 'Uloqni iling (E)!', `Siz ${me} : ${them} Raqiblar`);
      for (const m of riders) { const tgt = holder === m ? goal : holder === 'me' ? P.pos : { x: gx, z: gz }; stepToward(m, tgt.x, tgt.z, holder === m ? 8 : 9, dt, 0.8); m.root.rotation.y = m.yaw; animateAnimal(m.A, dt, 9); if (!holder && Math.hypot(m.pos.x - gx, m.pos.z - gz) < 2) holder = m; if (holder === 'me' && m.pos.distanceTo(P.pos) < 2 && rnd() < 0.02) { holder = m; toast('Uloqni tortib olishdi!'); } if (holder === m && Math.hypot(m.pos.x - goal.x, m.pos.z - goal.z) < 4) { them++; holder = null; gx = K.x; gz = K.z; toast('Raqib hisob ochdi'); } }
      if (!holder && Math.hypot(P.pos.x - gx, P.pos.z - gz) < 2.6) { showPrompt('E', 'Uloqni ilish'); if (consumeE()) { holder = 'me'; AU.sfx('pick'); } }
      if (holder === 'me' && Math.hypot(P.pos.x - goal.x, P.pos.z - goal.z) < 4) { me++; holder = null; gx = K.x; gz = K.z; AU.sfx('good'); toast('Uloq doirada! Barakalla!'); }
      const hp = holder === 'me' ? P.pos : holder ? holder.pos : null; if (hp) { gx = hp.x; gz = hp.z; } goat.position.set(gx, holder ? 1.6 : 0.3, gz);
      if (them >= 3) throw new Fail('Raqiblar uch marta tashlashdi.'); return me >= 3; }).then(() => { scene.remove(mk); return true; }); },
  async race(pts) { const rivals = []; for (let i = 0; i < 2; i++) { const m = addMount('arava', 8 + i * 4, 132, 0, { rider: true }); m.ai = true; m.prog = 0; m.sp = 4.6 + rnd() * 0.8; M_.mounts.push(m); rivals.push(m); } let done = false, rivalWin = false; const loop = setInterval(() => { for (const m of rivals) { const t = pts[Math.min(pts.length - 1, m.prog)]; if (stepToward(m, t[0], t[1], m.sp, 0.05, 1.2) < 4) { m.prog++; if (m.prog >= pts.length && !done) rivalWin = true; } m.root.rotation.y = m.yaw; animateAnimal(m.A, 0.05, m.sp); spinWheels(m, m.sp, 0.05); } }, 50); try { await G.route(pts, { title: 'Arava poygasi', r: 7 }); done = true; return !rivalWin; } finally { clearInterval(loop); } },
  async koriz() { toast('Koriz kirish joyi belgilandi'); await G.reach(-96, -96, 3, { needE: true }); fade(true); await wait(400); const maze = buildKoriz(); underground = true; P.pos.set(maze.start.x, -60, maze.start.z); fade(false); M_.timer = 160; objShow('Qadimiy koriz siri', 'Yashirin yo\'ldan o\'tib, hujjatni toping.'); const doc = propModel('pilla'); doc.scale.setScalar(2.5); doc.position.set(maze.end.x, -59.4, maze.end.z); scene.add(doc); M_.props.push(doc, maze.group);
    try { await G.reach(maze.end.x, maze.end.z, 1.6); AU.sfx('good'); toast('Vaqf hujjati topildi!'); objShow('Qadimiy koriz siri', 'Chiqish joyiga qayting.'); await G.reach(maze.start.x, maze.start.z, 1.6); } finally { underground = false; scene.remove(maze.group); for (const b of maze.cols) b.top = -999; P.pos.set(-96, 0, -94); } },
};
function buildKoriz() {
  const g = new T.Group(), N = 7, cs = 4, y0 = -60, cols = []; const vis = Array.from({ length: N }, () => Array(N).fill(false)); const walls = new Set();
  for (let i = 0; i <= N; i++) for (let j = 0; j < N; j++) { walls.add(`v${i},${j}`); walls.add(`h${j},${i}`); }
  const st = [[0, 0]]; vis[0][0] = true; while (st.length) { const [x, z] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [x + a, z + b, a, b]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !vis[a][b]); if (!nb.length) { st.pop(); continue; } const [nx, nz, a, b] = nb[rnd() * nb.length | 0]; if (a) walls.delete(`v${Math.max(x, nx)},${z}`); else walls.delete(`h${x},${Math.max(z, nz)}`); vis[nx][nz] = true; st.push([nx, nz]); }
  const ox = -96 - N * cs / 2, oz = -96 - N * cs / 2, mat = RES.mats.sandstone, wm = new T.MeshStandardMaterial({ color: '#5a6a6e', roughness: 0.1, metalness: 0.3 });
  const floor = new T.Mesh(new T.PlaneGeometry(N * cs, N * cs), RES.mats.stone); floor.rotation.x = -Math.PI / 2; floor.position.set(ox + N * cs / 2, y0, oz + N * cs / 2); g.add(floor); cols.push(C.add(ox, oz, ox + N * cs, oz + N * cs, y0, y0 - 2));
  const ceil = floor.clone(); ceil.rotation.x = Math.PI / 2; ceil.position.y = y0 + 3; g.add(ceil);
  for (const w of walls) { const v = w[0] === 'v', [a, b] = w.slice(1).split(',').map(Number); const x = v ? ox + a * cs : ox + a * cs + cs / 2, z = v ? oz + b * cs + cs / 2 : oz + b * cs; const m = new T.Mesh(new T.BoxGeometry(v ? 0.5 : cs + 0.5, 3, v ? cs + 0.5 : 0.5), mat); m.position.set(x, y0 + 1.5, z); g.add(m); cols.push(C.add(x - (v ? 0.25 : cs / 2 + 0.25), z - (v ? cs / 2 + 0.25 : 0.25), x + (v ? 0.25 : cs / 2 + 0.25), z + (v ? 0.25 : cs / 2 + 0.25), y0 + 3, y0 - 1)); }
  const ch = new T.Mesh(new T.PlaneGeometry(0.6, N * cs), wm); ch.rotation.x = -Math.PI / 2; ch.position.set(ox + cs / 2, y0 + 0.02, oz + N * cs / 2); g.add(ch);
  const lamp = new T.PointLight('#ffb060', 6, 14, 1.5); g.add(lamp); g.userData.lamp = lamp;
  scene.add(g); return { group: g, cols, start: { x: ox + cs / 2, z: oz + cs / 2 }, end: { x: ox + (N - 0.5) * cs, z: oz + (N - 0.5) * cs } };
}
function setCarry(k) {
  if (P.carryObj) { P.carryObj.parent?.remove(P.carryObj); P.carryObj = null; } P.carry = k; if (!k) return;
  const g = new T.Group(); const m = (geo, c) => { const x = new T.Mesh(geo, new T.MeshStandardMaterial({ color: c, roughness: 0.7 })); g.add(x); return x; };
  if (k === 'lagan') { m(new T.CylinderGeometry(0.32, 0.22, 0.06, 20), '#1f6fa8'); m(new T.SphereGeometry(0.24, 14, 8, 0, 6.3, 0, 1.4), '#c9903c').position.y = 0.03; }
  else if (k === 'non') for (let i = 0; i < 4; i++) m(new T.CylinderGeometry(0.2, 0.19, 0.05, 14), '#c98a3e').position.y = i * 0.055;
  else if (k === 'gul') for (let i = 0; i < 7; i++) m(new T.SphereGeometry(0.06, 6, 4), ['#d9263b', '#f2c230', '#e86aa0'][i % 3]).position.set((rnd() - 0.5) * 0.2, 0.1 + rnd() * 0.1, (rnd() - 0.5) * 0.2);
  else if (k === 'qop') { const x = m(new T.SphereGeometry(0.32, 10, 8), '#c9a873'); x.scale.set(1.3, 0.8, 0.9); g.position.set(0, 1.72, -0.1); }
  else if (k === 'choy') { m(new T.SphereGeometry(0.12, 12, 8), '#f1f4f6').position.y = 0.05; m(new T.CylinderGeometry(0.2, 0.18, 0.03, 16), '#d0a24a'); }
  else if (k === 'mesh') { const x = m(new T.SphereGeometry(0.28, 10, 8), '#6b4a2e'); x.scale.set(0.8, 1.1, 0.7); }
  else m(new T.SphereGeometry(0.2, 10, 8), '#e8dcc0');
  if (k !== 'qop') g.position.set(0, 1.12, 0.38); hero.root.add(g); P.carryObj = g;
}

/* ================= UI ================= */
let dlgOpen = false, qteOn = false;
function fade(on) { $('fade').classList.toggle('on', on); }
let toastT = 0; function toast(s) { const t = $('hud-toast'); t.textContent = s; t.hidden = false; toastT = 2.4; }
function banner(a, b) { const el = $('hud-banner'); $('banner-1').textContent = a; $('banner-2').textContent = b || ''; el.hidden = true; void el.offsetWidth; el.hidden = false; clearTimeout(banner.t); banner.t = setTimeout(() => (el.hidden = true), 4000); }
function flash() { document.body.animate([{ boxShadow: 'inset 0 0 120px rgba(200,30,20,.6)' }, { boxShadow: 'inset 0 0 0 rgba(0,0,0,0)' }], 400); }
function objShow(title, text, extra) { const el = $('hud-obj'); el.hidden = false; el.innerHTML = `<div class="ot">◆ ${esc(title)}</div><div class="od">${esc(text || '')}</div>${extra ? `<div class="oc">${esc(extra)}</div>` : ''}`; }
function objHide() { $('hud-obj').hidden = true; }
function showPrompt(k, s) { const el = $('hud-prompt'); el.innerHTML = `<kbd>${k}</kbd>${esc(s)}`; el.hidden = false; promptHold = 0.15; }
let promptHold = 0;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function say(who, text, btns = ['Davom']) {
  return new Promise((res, rej) => { dlgOpen = true; document.exitPointerLock?.(); $('dlg-who').textContent = who; $('dlg-text').textContent = text; const b = $('dlg-btns'); b.innerHTML = ''; btns.forEach((t, i) => { const x = document.createElement('button'); x.textContent = t; x.onclick = () => { $('dialog').hidden = true; dlgOpen = false; res(i); }; b.appendChild(x); }); $('dialog').hidden = false; });
}
let qteState = null;
function qteClose() { if (qteState) { qteState.rej?.(new Fail('to\'xtatildi')); qteState = null; } $('qte').hidden = true; qteOn = false; }
function qte(kind, o) {
  return new Promise((res, rej) => {
    qteOn = true; const el = $('qte'); el.hidden = false; const st = { kind, o, res, rej, t: 0, score: 0, round: 0 }; qteState = st;
    if (kind === 'meter') { st.pos = 0; st.dir = 1; st.z0 = 0.2 + rnd() * (0.6 - o.zone); el.innerHTML = `<div>${esc(o.title)}</div><div class="meter"><i style="left:${st.z0 * 100}%;width:${o.zone * 100}%"></i><b></b></div><div class="qbtns"><button data-q="hit">E</button></div><div class="qs"></div>`; }
    else if (kind === 'mash') { st.me = 0; st.opp = 0; el.innerHTML = `<div>${esc(o.title)}</div><div class="meter"><i style="left:0;width:0%"></i></div><div class="meter opp"><i style="left:0;width:0%;background:#d2463a"></i></div><div class="qbtns"><button data-q="hit">E</button></div>`; }
    else if (kind === 'choice') { el.innerHTML = `<div>${esc(o.title)}</div><div class="qbtns">${o.opts.map((t, i) => `<button data-q="c${i}" style="width:auto;padding:0 12px">${esc(t)}</button>`).join('')}</div>`; }
    else if (kind === 'rhythm') { const keys = ['←', '↑', '→', '↓']; st.notes = Array.from({ length: o.notes }, (_, i) => ({ t: 1.5 + i * 60 / o.bpm * 2, k: rnd() * 4 | 0, hit: false, miss: false })); st.hits = 0; el.innerHTML = `<div>${esc(o.title)} — mos tugmani bosing</div><div class="lane"><div class="hit"></div></div><div class="qbtns">${keys.map((k, i) => `<button data-q="k${i}">${k}</button>`).join('')}</div>`; st.lane = el.querySelector('.lane'); st.els = st.notes.map((n) => { const d = document.createElement('div'); d.className = 'note'; d.textContent = keys[n.k]; st.lane.appendChild(d); return d; }); P.pose = 'dance'; P.poseT = 999; }
    el.querySelectorAll('button').forEach((b) => b.onpointerdown = (e) => { e.preventDefault(); qteInput(b.dataset.q); });
  });
}
function qteInput(q) {
  const st = qteState; if (!st) return; const o = st.o, el = $('qte');
  if (st.kind === 'meter' && q === 'hit') { const ok = st.pos >= st.z0 && st.pos <= st.z0 + o.zone; if (ok) { st.score++; AU.sfx('tak'); } else AU.sfx('bad'); st.round++; el.querySelector('.qs').textContent = `${st.score} / ${st.round}`; if (st.round >= o.rounds) return qteDone(st.score / o.rounds); st.z0 = 0.1 + rnd() * (0.8 - o.zone); el.querySelector('.meter i').style.left = st.z0 * 100 + '%'; }
  else if (st.kind === 'mash' && q === 'hit') { st.me += 0.07; AU.sfx('tak'); }
  else if (st.kind === 'choice' && q[0] === 'c') qteDone(+q.slice(1));
  else if (st.kind === 'rhythm' && q[0] === 'k') { const k = +q.slice(1); const n = st.notes.find((n) => !n.hit && !n.miss && Math.abs(n.t - st.t) < 0.2); if (n && n.k === k) { n.hit = true; st.hits++; AU.sfx('doira'); st.els[st.notes.indexOf(n)].style.background = '#e6b84c'; } else AU.sfx('bad'); }
}
function qteDone(v) { const st = qteState; qteState = null; $('qte').hidden = true; qteOn = false; if (st.kind === 'rhythm') { P.pose = null; } st.res(v); }
function updateQte(dt) {
  const st = qteState; if (!st) return; st.t += dt; const el = $('qte');
  if (st.kind === 'meter') { st.pos += st.dir * dt * (st.o.speed || 0.9); if (st.pos > 1) { st.pos = 1; st.dir = -1; } if (st.pos < 0) { st.pos = 0; st.dir = 1; } el.querySelector('.meter b').style.left = `calc(${st.pos * 100}% - 3px)`; }
  else if (st.kind === 'mash') { st.opp += dt * st.o.rate; st.me = Math.max(0, st.me - dt * 0.05); const [a, b] = el.querySelectorAll('.meter i'); a.style.width = Math.min(100, st.me * 100) + '%'; b.style.width = Math.min(100, st.opp * 100) + '%'; if (st.me >= 1) qteDone(true); else if (st.opp >= 1) qteDone(false); }
  else if (st.kind === 'rhythm') { const W = st.lane.clientWidth; st.notes.forEach((n, i) => { const x = W / 2 + (n.t - st.t) * 160 - 20; st.els[i].style.left = x + 'px'; st.els[i].style.display = x < -40 || x > W ? 'none' : 'grid'; if (!n.hit && !n.miss && st.t - n.t > 0.25) { n.miss = true; st.els[i].style.background = '#d2463a'; } }); if (st.t > st.notes[st.notes.length - 1].t + 1) qteDone(st.hits / st.notes.length); }
}

/* ================= kirish (klaviatura, sichqoncha, sensor) ================= */
const keys = new Set();
addEventListener('keydown', (e) => {
  if (!playing) return; const k = e.code;
  if (qteState) { const m = { ArrowLeft: 'k0', KeyA: 'k0', ArrowUp: 'k1', KeyW: 'k1', ArrowRight: 'k2', KeyD: 'k2', ArrowDown: 'k3', KeyS: 'k3', KeyE: 'hit', Space: 'hit' }[k]; if (m && !e.repeat) { qteInput(qteState.kind === 'rhythm' ? m : m === 'hit' || qteState.kind !== 'rhythm' ? (m.startsWith('k') ? 'hit' : m) : m); e.preventDefault(); } return; }
  if (dlgOpen) { if (k === 'Enter' || k === 'KeyE' || k === 'Space') $('dlg-btns button')?.click(); return; }
  keys.add(k); if (e.repeat) return;
  if (k === 'Space') { if (!P.onGround && P.mode === 'foot') inp.para = true; else inp.jump = true; }
  if (k === 'KeyE') { eDown = true; curAct?.run?.(); }
  if (k === 'KeyF') { if (P.mode === 'ride') dismount(); else if (curAct?.key === 'F') curAct.run(); else { const m = mounts.find((m) => m.owned && m !== P.mount && m.pos.distanceTo(P.pos) < 3); if (m) mountUp(m); } }
  if (k === 'KeyG') curAct?.steal?.();
  if (k === 'KeyQ') curAct?.wave ? curAct.wave() : (P.pose = 'wave', P.poseT = 1.2);
  if (k === 'KeyC') toggleCarpet();
  if (k === 'KeyM') openMap(false); if (k === 'KeyR') toggleRadio(); if (k === 'Escape') setPause(true);
});
addEventListener('keyup', (e) => keys.delete(e.code));
canvas.addEventListener('mousedown', (e) => { if (!playing || isTouch) return; if (document.pointerLockElement !== canvas) { canvas.requestPointerLock?.(); return; } if (e.button === 0) punch(); });
addEventListener('mousemove', (e) => { if (document.pointerLockElement === canvas) { camYaw -= e.movementX * 0.0025; camPitch = clamp(camPitch + e.movementY * 0.0022, -0.5, 1.2); } });
document.addEventListener('pointerlockchange', () => { if (playing && !document.pointerLockElement && !dlgOpen && !$('map').hidden === false && !isTouch) {} });
addEventListener('wheel', (e) => { camDist = clamp(camDist + e.deltaY * 0.004, 2.2, 9); });
function readKeys() { if (isTouch) return; inp.f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0); inp.s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0); inp.run = keys.has('ShiftLeft') || keys.has('ShiftRight'); }
// sensor
if (isTouch) {
  const stick = $('stick'), knob = $('knob'); let sid = null, c0 = null;
  stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; const r = stick.getBoundingClientRect(); c0 = [r.left + r.width / 2, r.top + r.height / 2]; stick.setPointerCapture(sid); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId !== sid) return; let dx = e.clientX - c0[0], dy = e.clientY - c0[1]; const l = Math.hypot(dx, dy), m = 50; if (l > m) { dx *= m / l; dy *= m / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; inp.s = dx / m; inp.f = -dy / m; inp.run = l > m * 0.95; });
  const end = () => { sid = null; knob.style.transform = ''; inp.s = inp.f = 0; inp.run = false; }; stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  let lid = null, lp = null; canvas.addEventListener('pointerdown', (e) => { if (lid === null) { lid = e.pointerId; lp = [e.clientX, e.clientY]; } });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerId !== lid) return; camYaw -= (e.clientX - lp[0]) * 0.006; camPitch = clamp(camPitch + (e.clientY - lp[1]) * 0.004, -0.5, 1.2); lp = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => { if (e.pointerId === lid) lid = null; });
  document.querySelectorAll('#touch button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); const k = b.dataset.k; if (qteState) { qteInput('hit'); return; }
    if (k === 'jump') { if (P.mode === 'carpet') { inp.up = true; setTimeout(() => (inp.up = false), 600); } else if (!P.onGround) inp.para = true; else inp.jump = true; } else if (k === 'use') { eDown = true; curAct?.run?.(); } else if (k === 'mount') { if (P.mode === 'ride') dismount(); else if (curAct?.key === 'F') curAct.run(); else { const m = mounts.find((m) => m.owned && m.pos.distanceTo(P.pos) < 3); if (m) mountUp(m); } } else if (k === 'steal') curAct?.steal?.(); else if (k === 'punch') punch(); else if (k === 'block') { inp.block = !inp.block; b.classList.toggle('act', inp.block); } else if (k === 'map') openMap(false); else if (k === 'wear') curAct?.wave ? curAct.wave() : null; else if (k === 'radio') toggleRadio(); else if (k === 'gilam') toggleCarpet(); else if (k === 'run') { inp.run = !inp.run; b.classList.toggle('act', inp.run); } }));
}

/* ================= radio ================= */
AU.Audio.onTrack = (st, tr, dj) => { const el = $('hud-radio'); if (!st) { el.hidden = true; return; } el.hidden = false; el.textContent = `📻 ${st} — ${tr}`; if (dj) toast('Radio: ' + dj); };
function toggleRadio() { AU.initAudio(); if (AU.Audio.radio && AU.Audio.station !== undefined && !$('hud-radio').hidden) { const next = AU.Audio.station + 1; if (next >= AU.STATIONS.length) AU.radioOff(); else AU.setStation(next); } else AU.setStation(AU.REGION_STATION[R.id] ?? 0); }

/* ================= xarita ================= */
let mapSel = null, atGate = false;
function openMap(gate) { atGate = gate; document.exitPointerLock?.(); $('map').hidden = false; paused = true; mapSel = mapSel || R.id; drawMap(); }
$('map-close').onclick = () => { $('map').hidden = true; paused = false; };
function drawMap() {
  const cv = $('map-cv'), r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio); cv.width = r.width * d; cv.height = r.height * d; const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
  const W = r.width, H = r.height, lo0 = 55.5, lo1 = 73.5, la0 = 36.8, la1 = 45.9, k = Math.min(W / (lo1 - lo0), H / (la1 - la0) * 1.25) * 0.95; const ox = (W - (lo1 - lo0) * k) / 2, oy = (H - (la1 - la0) * k / 1.25) / 2;
  const X = (lo) => ox + (lo - lo0) * k, Y = (la) => oy + (la1 - la) * k / 1.25;
  g.fillStyle = '#d9c49a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ecdcb6'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); UZ_OUTLINE.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = '#4f8fa8'; g.lineWidth = 2.5; for (const rv of RIVERS) { g.beginPath(); rv.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke(); }
  g.font = '600 13px Rubik, sans-serif'; g.textAlign = 'center';
  for (const rg of REGIONS) { const x = X(rg.lon), y = Y(rg.lat); const cur = rg.id === R.id, sel = rg.id === mapSel, done = S.done[rg.mission + '@' + rg.id]; g.fillStyle = cur ? '#d2463a' : done ? '#2a8a4a' : '#0f2a57'; g.beginPath(); g.arc(x, y, sel ? 9 : 6, 0, 7); g.fill(); if (sel) { g.strokeStyle = '#e6b84c'; g.lineWidth = 3; g.stroke(); } g.fillStyle = '#10151f'; g.fillText(rg.city, x, y - 12); }
  cv.onclick = (e) => { const bx = e.offsetX, by = e.offsetY; let best = null, bd = 30; for (const rg of REGIONS) { const dd = Math.hypot(X(rg.lon) - bx, Y(rg.lat) - by); if (dd < bd) { bd = dd; best = rg; } } if (best) { mapSel = best.id; drawMap(); } };
  const s = regionById(mapSel), M = MISSIONS[s.mission]; const done = S.done[s.mission + '@' + s.id];
  $('map-info').innerHTML = `<h3>${esc(s.name)}</h3><div class="era">${esc(s.city)} · ${esc(s.era)}</div><b>Hunari:</b> ${esc(s.craft)}<ul>${s.customs.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><b>Topshiriq:</b> <span class="${done ? 'done' : ''}">${esc(M?.title || '')}${done ? ' ✓' : ''}</span><div style="margin-top:14px">${s.id === R.id ? '<i>Siz shu yerdasiz</i>' : atGate ? `<button class="primary" id="map-go">Karvon bilan yo'lga chiqish</button>` : '<i>Yo\'lga chiqish uchun shahar darvozasiga boring</i>'}</div>`;
  const go = $('map-go'); if (go) go.onclick = async () => { $('map').hidden = true; paused = false; S.time = (S.time + 5) % 24; await loadRegion(s.id); };
}

/* ================= HUD va minixarita ================= */
const mm = $('minimap').getContext('2d');
function updateHud(dt) {
  $('hp-bar').style.width = clamp(P.hp, 0, 100) + '%'; $('st-bar').style.width = P.st + '%'; $('hud-money').textContent = S.money; $('hud-obro').textContent = `${S.obro} · Yuk: ${invCount(S.inv)}/${capacity(P.mount)}`;
  const h = S.time | 0, mi = (S.time % 1) * 60 | 0; $('hud-clock').textContent = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`; $('hud-region').textContent = `${R.name} · ${R.city}`;
  toastT -= dt; if (toastT <= 0) $('hud-toast').hidden = true;
  foeT -= dt; { const el = $('foe-hp'); if (foe && foeT > 0 && foe.state !== 'down') { el.hidden = false; el.querySelector('i').style.width = Math.max(0, foe.hp / (foe.maxHp || 4)) * 100 + '%'; el.querySelector('span').textContent = foe.name || ({ posbon: 'Mirshab', ishchi: 'Yigit', savdogar: 'Savdogar' }[foe.role] || 'Raqib'); } else el.hidden = true; }
  promptHold -= dt; if (curAct && !dlgOpen && !qteOn) showPrompt(curAct.key, curAct.label); else if (promptHold <= 0) $('hud-prompt').hidden = true;
  // minixarita (yo'nalish bo'yicha aylanadi)
  const Wm = 200, span = 280, k = 512 / (span * 2), zoom = 1.6, cx = Wm / 2; mm.save(); mm.clearRect(0, 0, Wm, Wm); mm.fillStyle = '#cbbd92'; mm.fillRect(0, 0, Wm, Wm); mm.translate(cx, cx);
  const th = -Math.PI / 2 - Math.atan2(Math.cos(camYaw), Math.sin(camYaw)); mm.rotate(th);
  const px = (P.pos.x + span) * k, pz = (P.pos.z + span) * k; mm.drawImage(mapImg, -px * zoom, -pz * zoom, 512 * zoom, 512 * zoom);
  const dot = (x, z, c, r = 4) => { mm.fillStyle = c; mm.beginPath(); mm.arc((x - P.pos.x) * k * zoom, (z - P.pos.z) * k * zoom, r, 0, 7); mm.fill(); };
  for (const g of givers) if (!M_) dot(g.n.pos.x, g.n.pos.z, !g.id ? '#ffffff' : MISSIONS[g.id].job ? '#5ad16a' : MISSIONS[g.id].side ? '#19b3ad' : '#e6b84c', 5);
  for (const g of guards) dot(g.n.pos.x, g.n.pos.z, '#d2463a', 4);
  for (const m of markers) { const dx = (m.position.x - P.pos.x) * k * zoom, dz = (m.position.z - P.pos.z) * k * zoom, l = Math.hypot(dx, dz); const s = l > 90 ? 90 / l : 1; mm.fillStyle = '#e6b84c'; mm.beginPath(); mm.arc(dx * s, dz * s, 6, 0, 7); mm.fill(); mm.strokeStyle = '#0f2a57'; mm.lineWidth = 2; mm.stroke(); }
  mm.restore(); mm.save(); mm.translate(cx, cx); mm.rotate(th + Math.atan2(Math.cos(P.yaw), Math.sin(P.yaw)) + Math.PI / 2); mm.fillStyle = '#d2463a'; mm.beginPath(); mm.moveTo(0, -9); mm.lineTo(6, 7); mm.lineTo(0, 3); mm.lineTo(-6, 7); mm.fill(); mm.restore();
  const n = $('mm-n'); const na = th - Math.PI / 2; n.style.left = 50 + Math.cos(na) * 40 + '%'; n.style.top = 50 + Math.sin(na) * 40 + '%'; n.style.transform = 'translate(-50%,-50%)';
}

/* ================= kamera ================= */
const camT = new V3();
function updateCamera(dt) {
  const tgt = new V3(P.pos.x, P.pos.y + (P.mode === 'ride' ? 2.4 : 1.6), P.pos.z);
  const dist = P.mode === 'ride' ? camDist + 2.2 : P.mode === 'para' ? camDist + 3 : camDist;
  if (!isTouch && document.pointerLockElement !== canvas && (P.speed > 0.5 || P.mount?.speed > 0.5)) camYaw += angDiff(camYaw, P.yaw) * dt * 1.2; // avtomatik orqadan kuzatish
  if (isTouch && (P.speed > 0.5 || P.mount?.speed > 1)) camYaw += angDiff(camYaw, P.yaw) * dt * 0.9;
  let d = dist; const dir = new V3(-Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), -Math.cos(camYaw) * Math.cos(camPitch));
  for (let s = 0.4; s <= dist; s += 0.25) { const p = tgt.clone().addScaledVector(dir, s); if (C.blocked(p.x, p.y, p.z)) { d = Math.max(0.6, s - 0.4); break; } }
  camT.lerp(tgt, Math.min(1, dt * 12)); camera.position.copy(camT).addScaledVector(dir, d); if (shake > 0) { shake -= dt; camera.position.x += (rnd() - 0.5) * shake * 0.6; camera.position.y += (rnd() - 0.5) * shake * 0.6; } camera.lookAt(camT);
}

/* ================= tutun va effektlar ================= */
const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(230,230,230,.5)'); gr.addColorStop(1, 'rgba(230,230,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
const smokePool = []; function updateFx(dt) {
  if (!RES) return;
  for (const s of RES.fx.smoke) { if (P.pos.distanceToSquared(new V3(s.x, 0, s.z)) > 60 * 60) continue; s.t = (s.t || 0) - dt; if (s.t <= 0) { s.t = s.thin ? 0.6 : 0.25; let sp = smokePool.find((q) => !q.visible); if (!sp && smokePool.length < 60) { sp = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); scene.add(sp); smokePool.push(sp); } if (sp) { sp.visible = true; sp.position.set(s.x + (rnd() - 0.5) * 0.4, s.y, s.z + (rnd() - 0.5) * 0.4); sp.userData.life = 0; sp.scale.setScalar(0.5); } } }
  for (const sp of smokePool) if (sp.visible) { sp.userData.life += dt; sp.position.y += dt * 0.9; sp.position.x += dt * 0.3; sp.scale.setScalar(0.5 + sp.userData.life * 0.9); sp.material.opacity = Math.max(0, 0.6 - sp.userData.life * 0.2); if (sp.userData.life > 3) sp.visible = false; }
  for (const f of RES.fx.fires) { f.m.scale.set(1, 0.8 + Math.sin(performance.now() / 70) * 0.25, 1); }
  for (const w of RES.fx.water) if (w.material.normalMap) { w.material.normalMap.offset.x += dt * 0.01; w.material.normalMap.offset.y += dt * 0.006; }
}

/* ================= asosiy sikl ================= */
let last = performance.now(), envT = 0, saveT = 0, birdT = 0;
async function frame() {
  requestAnimationFrame(frame);
  const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!RES || !hero) return;
  if (playing && !paused) {
    readKeys(); { const nt = S.time + dt / 30; if (nt >= 24) S.day = (S.day || 0) + 1; S.time = nt % 24; }
    if (P.pose && (P.poseT -= dt) <= 0 && !qteOn) P.pose = null;
    updatePlayer(dt); updateNpcs(dt); updateCritters(dt); updateHeat(dt); updateMission(dt); updateQte(dt);
    curAct = dlgOpen || qteOn ? null : findAction();
    updateHud(dt); updateCamera(dt); updateFx(dt);
    saveT += dt; if (saveT > 30) { saveT = 0; S.pos = [P.pos.x, P.pos.y, P.pos.z]; S.hp = P.hp; save(); }
    birdT -= dt; if (birdT <= 0 && S.time > 6 && S.time < 19) { AU.sfx('bird'); birdT = 2 + rnd() * 6; }
  } else if (playing && !$('wardrobe').hidden) { updateCamera(dt); animate(hero, dt, { pose: 'idle', speed: 0 });
  } else if (!playing) { // bosh ekran: shahar ustida sekin aylanuvchi kamera
    const t = now / 1000 * 0.035; const kx = A?.minaretTop?.x ?? 0, kz = A?.minaretTop?.z ?? 0; camera.position.set(kx + Math.sin(t) * 46, 14 + Math.sin(t * 0.7) * 3, kz + Math.cos(t) * 46); camera.lookAt(kx, 22, kz); updateNpcs(dt); updateFx(dt);
  }
  envT -= dt; if (envT <= 0) { envT = 0.25; const r = await LG.update(playing ? S.time : 17.6, playing ? P.pos : new V3(0, 0, 0), 0.25); if (underground) { scene.fog.color.set('#0a0806'); scene.fog.near = 1; scene.fog.far = 18; } }
  if (underground && M_) { const kz = M_.props.find((p) => p.userData?.lamp); if (kz) kz.userData.lamp.position.set(P.pos.x, P.pos.y + 2, P.pos.z); }
  composer ? composer.render() : renderer.render(scene, camera);
}

/* ================= menyular ================= */
function setPause(on) { if (!playing) return; paused = on; $('pause').hidden = !on; if (on) document.exitPointerLock?.(); }
$('pause-btn').onclick = () => setPause(true);
$('p-resume').onclick = () => setPause(false);
$('p-map').onclick = () => { $('pause').hidden = true; openMap(false); };
$('p-wardrobe').onclick = () => { $('pause').hidden = true; paused = false; openWardrobe(false); };
$('p-help').onclick = () => { $('help').hidden = false; };
$('help-close').onclick = () => { $('help').hidden = true; };
$('btn-help').onclick = () => { $('help').hidden = false; };
const qBtn = () => { Q = (Q + 1) % 3; store.set('oz_q', Q); location.reload(); };
$('btn-settings').onclick = qBtn; $('p-quality').onclick = qBtn; $('q-label').textContent = QN[Q]; $('q-label2').textContent = QN[Q];
$('p-title').onclick = () => { save(); location.reload(); };
async function startGame(fresh) {
  AU.initAudio(); if (fresh) S = defSave(); save();
  $('title').hidden = true; $('hud').hidden = false; if (isTouch) $('touch').hidden = false;
  if (S.region !== R.id || fresh) await loadRegion(S.region, fresh ? 'gate' : 'save'); else if (S.pos) P.pos.set(...S.pos);
  P.hp = S.hp || 100; scene.add(hero.root); playing = true; AU.setStation(AU.REGION_STATION[R.id] ?? 0);
  if (fresh) { await say('Ovozsiz ichki ovoz', 'Meni Bek deyishadi. Yoshman, yo\'lim uzoq: o\'n ikki viloyatni kezib, har birining hunarini, odatini o\'rganmoqchiman.\n\nTilla rang ◆ — viloyat topshirig\'i, feruza ◆ — mahalla ishlari. Xohlasangiz — shunchaki yuring, bozorni aylaning, choyxonada dam oling.', ['Yo\'lga!']); }
  if (!isTouch) canvas.requestPointerLock?.();
}
$('btn-new').onclick = () => startGame(true);
const titleMusic = () => { if (playing) return; AU.initAudio(); AU.playTitle(); const h = $('tap-music'); if (h) h.hidden = true; removeEventListener('pointerdown', titleMusic); removeEventListener('keydown', titleMusic); };
addEventListener('pointerdown', titleMusic); addEventListener('keydown', titleMusic);
$('btn-continue').onclick = () => startGame(false);

/* ================= ishga tushirish ================= */
(async () => {
  $('loading').textContent = 'Dunyo yaratilmoqda…';
  await loadRigs();
  hero = makePerson('hero', {}, {}); if (hero.rigged && S?.hat) setRiggedHat(hero, S.hat);
  if (!S) S = defSave(); else $('btn-continue').hidden = false;
  await loadRegion($('btn-continue').hidden ? 'buxoro' : S.region, 'save');
  $('loading').textContent = Object.keys(RIG).length ? '' : 'Eslatma: realistik personaj modellari topilmadi — sodda modellar ishlatilmoqda.';
  last = performance.now(); frame();
  window.__bek = { P, S, get npcs() { return npcs; }, get critters() { return critters; }, cam(y, p, d) { camYaw = y; camPitch = p; if (d) camDist = d; }, start: startGame, load: loadRegion };
})();
