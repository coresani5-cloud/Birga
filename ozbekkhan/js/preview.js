// Grafika sinovi: ?r=buxoro&h=17.5&w=clear&p=x,y,z&cam=x,y,z,tx,ty,tz
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { regionById } from './regions.js';
import { buildRegion } from './build.js';
import { makeHuman, animate, makeAnimal, animateAnimal, setRiggedHat } from './actors.js';
import { placeProps } from './props.js';
import { createLighting, makeGradePass } from './lighting.js';
import * as TX from './tex.js';
import { loadRigSource, makeRigged } from './rig.js';

const q = new URLSearchParams(location.search);
const R = regionById(q.get('r') || 'buxoro'), H = +(q.get('h') || 17.3);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true });
renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#c9d3dc', 120, 1100);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 3000);
const waterMat = new THREE.MeshStandardMaterial({ color: '#3c7f86', roughness: 0.06, metalness: 0.3, normalMap: TX.waterNormal(), normalScale: new THREE.Vector2(0.35, 0.35) }); waterMat.normalMap.repeat.set(3, 3);
const res = buildRegion(R, { quality: 2, shadows: true, waterMat }); scene.add(res.group);
await placeProps(res.group, res.A.props);
const LG = createLighting(renderer, scene, { quality: 2 }); LG.mats = res.mats; LG.setLanterns(res.A.lanterns); LG.setWeather(q.get('w') || 'clear');
const people = [], rr = TX.rng(5);
const hats = ['chust', 'iroqi', 'zardozi', 'salla', 'oddiy', 'samarqand', 'toshkent'], coats = ['beqasam_0', 'beqasam_1', 'beqasam_3', 'adras_0', 'movut_0', 'adras_2'];
const osrc = await loadRigSource('oqsoqol');
for (const n of res.npcs) { const old = rr() < 0.4; const h = osrc && (n.pose === 'sit' || n.role === 'oshpaz' || rr() < 0.5) ? makeRigged(osrc) : makeHuman({ skin: (rr() * 5) | 0, beard: old ? 3 : (rr() * 3) | 0, hat: old ? 'salla' : hats[(rr() * hats.length) | 0], coat: coats[(rr() * coats.length) | 0], belt: ['qizil', 'oq', 'yashil'][(rr() * 3) | 0] }); h.root.position.set(n.x, n.y || 0, n.z); h.root.rotation.y = n.ry; scene.add(h.root); people.push([h, n.pose === 'sit' ? 'sit' : n.pose === 'work' ? 'work' : 'idle', 0]); }
for (let i = 0; i < 14; i++) { const fem = rr() < 0.3; const h = makeHuman({ skin: (rr() * 5) | 0, beard: (rr() * 4) | 0, hat: hats[(rr() * hats.length) | 0], coat: coats[(rr() * coats.length) | 0] }, { female: fem }); h.root.position.set((rr() - 0.5) * 5, 0, 30 + rr() * 70); h.root.rotation.y = rr() < 0.5 ? 0 : Math.PI; scene.add(h.root); people.push([h, 'walk', 1.3]); }
const rsrc = await loadRigSource('hero'); const hero = rsrc ? makeRigged(rsrc) : makeHuman({ skin: 1, beard: 1, hat: 'chust', coat: 'beqasam_1', belt: 'qizil', shoes: 'mahsi' });
const hp = (q.get('p') || '0,0,62').split(',').map(Number); hero.root.position.set(hp[0], 0, hp[2]); hero.root.rotation.y = +(q.get('ry') ?? Math.PI); scene.add(hero.root); if (q.get('hat') && hero.rigged) setRiggedHat(hero, q.get('hat'));
people.push([hero, q.get('pose') || 'walk', +(q.get('sp') || 1.6)]);
if (osrc) for (let i = 0; i < 4; i++) { const h = makeRigged(osrc); h.root.position.set(hp[0] + (rr() - 0.5) * 8, 0, hp[2] - 4 - rr() * 14); h.root.rotation.y = rr() * 6; scene.add(h.root); people.push([h, 'walk', 1.0]); }
const horse = makeAnimal('ot'); horse.root.position.set(-16.5, 0, 27.5); scene.add(horse.root);
for (let i = 0; i < 60; i++) for (const [h, pose, sp] of people) animate(h, 0.016, { pose, speed: sp }); animateAnimal(horse, 0.5, 0);
const c = (q.get('cam') || `${hp[0] + 1.2},2.6,${hp[2] + 4.6},${hp[0]},1.5,${hp[2] - 6}`).split(',').map(Number);
camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]);
await LG.update(H, new THREE.Vector3(c[0], 0, c[2] - 20), 0.5);
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.5, 0.85)); composer.addPass(new OutputPass()); const gp = makeGradePass(); gp.uniforms.res.value.set(innerWidth, innerHeight); composer.addPass(gp);
await TX.texReady();
composer.render(); requestAnimationFrame(() => { composer.render(); window.__ready = true; });
