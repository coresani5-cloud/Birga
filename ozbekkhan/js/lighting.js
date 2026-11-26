// Yorug'lik, osmon, kun-tun va ob-havo.
// Kun: fotografik HDRI osmon (Poly Haven). Shom/tong: quyosh botishi HDRI. Tun: oy nuri, gradient osmon, yulduzlar, fonus chiroqlari.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ASSET_BASE } from './tex.js';
const T = THREE;

function nightSky() {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H / 2); gr.addColorStop(0, '#050a1c'); gr.addColorStop(0.55, '#0d1838'); gr.addColorStop(0.85, '#2a2550'); gr.addColorStop(0.97, '#5a3a4a'); gr.addColorStop(1, '#7a4a3a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H / 2); g.fillStyle = '#1a140f'; g.fillRect(0, H / 2, W, H / 2);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1400; i++) { const y = Math.pow(r(), 1.6) * H * 0.45, a = 0.3 + r() * 0.7; g.fillStyle = `rgba(255,255,255,${a * (1 - y / (H * 0.5))})`; g.fillRect(r() * W, y, r() < 0.06 ? 2 : 1, r() < 0.06 ? 2 : 1); }
  // Somon yo'li
  g.globalAlpha = 0.08; for (let i = 0; i < 300; i++) { const x = W * 0.2 + i * 2, y = 40 + Math.sin(i / 40) * 30; g.fillStyle = '#c8d0ff'; g.beginPath(); g.arc(x, y + (r() - 0.5) * 40, 6 + r() * 10, 0, 7); g.fill(); } g.globalAlpha = 1;
  // oy
  const mx = W * 0.62, my = H * 0.16, mg = g.createRadialGradient(mx, my, 0, mx, my, 60); mg.addColorStop(0, 'rgba(255,250,230,1)'); mg.addColorStop(0.12, 'rgba(255,248,225,1)'); mg.addColorStop(0.2, 'rgba(200,210,255,.25)'); mg.addColorStop(1, 'rgba(120,140,220,0)'); g.fillStyle = mg; g.beginPath(); g.arc(mx, my, 60, 0, 7); g.fill();
  const t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace; return t;
}

export const WEATHER = { clear: { n: 'Ochiq havo' }, haze: { n: 'Issiq tuman' }, dust: { n: 'Chang bo\'roni' }, rain: { n: 'Yomg\'ir' }, cloudy: { n: 'Bulutli' } };
export function regionWeather(id, r = Math.random) {
  const w = { xorazm: ['clear', 'clear', 'dust', 'haze'], navoiy: ['clear', 'dust', 'dust', 'haze'], buxoro: ['clear', 'haze', 'clear', 'dust'], jizzax: ['clear', 'cloudy', 'dust'], sirdaryo: ['clear', 'haze', 'cloudy'], surxondaryo: ['haze', 'clear', 'haze'], fargona: ['clear', 'rain', 'cloudy', 'clear'], namangan: ['clear', 'rain', 'clear'], andijon: ['clear', 'rain', 'cloudy'], toshkent: ['clear', 'cloudy', 'rain'], samarqand: ['clear', 'cloudy', 'clear'], qashqadaryo: ['clear', 'haze', 'cloudy'] }[id] || ['clear'];
  return w[Math.floor(r() * w.length)];
}

export function createLighting(renderer, scene, { quality = 1 } = {}) {
  const pm = new T.PMREMGenerator(renderer);
  const sun = new T.DirectionalLight('#fff4e0', 3.5); sun.castShadow = quality > 0;
  const ss = quality > 1 ? 4096 : 2048; sun.shadow.mapSize.set(ss, ss); Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 500 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  const hemi = new T.HemisphereLight('#b9d3ee', '#8a6a4a', 0.15);
  scene.add(sun, sun.target, hemi);
  const lampLights = []; const NL = quality > 1 ? 14 : quality > 0 ? 8 : 3;
  for (let i = 0; i < NL; i++) { const l = new T.PointLight('#ffad5a', 0, 16, 1.6); l.castShadow = false; scene.add(l); lampLights.push(l); }
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,180,1)'); gr.addColorStop(0.25, 'rgba(255,180,90,.55)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const glowMat = new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 });
  let glows = [];
  const envs = {}; const load = (n) => envs[n] || (envs[n] = new RGBELoader().loadAsync(ASSET_BASE + 'hdri/' + n + '.hdr').then((t) => { t.mapping = T.EquirectangularReflectionMapping; return { bg: t, env: pm.fromEquirectangular(t).texture }; }).catch(() => null));
  const night = nightSky(); const nightEnv = pm.fromEquirectangular(night).texture;
  let cur = null;
  // ob-havo zarrachalari
  const N = quality > 0 ? 6000 : 2000, pg = new T.BufferGeometry(), pp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pp[i * 3] = (Math.random() - 0.5) * 80; pp[i * 3 + 1] = Math.random() * 40; pp[i * 3 + 2] = (Math.random() - 0.5) * 80; } pg.setAttribute('position', new T.BufferAttribute(pp, 3));
  const pmat = new T.PointsMaterial({ color: '#cfd8e6', size: 0.08, transparent: true, opacity: 0.6, depthWrite: false }); const parts = new T.Points(pg, pmat); parts.frustumCulled = false; parts.visible = false; scene.add(parts);
  // qushlar (to'da bo'lib aylanadi) va havodagi oltin chang
  const birds = new T.Group(); const bm = new T.MeshBasicMaterial({ color: '#2a2622', side: T.DoubleSide }); const bg = new T.BufferGeometry().setFromPoints([new T.Vector3(-0.35, 0.08, 0), new T.Vector3(0, 0, 0.12), new T.Vector3(0.35, 0.08, 0), new T.Vector3(0, 0, -0.1)]); bg.setIndex([0, 1, 3, 2, 3, 1]); bg.computeVertexNormals();
  for (let i = 0; i < 14; i++) { const b = new T.Mesh(bg, bm); b.userData = { r: 25 + Math.random() * 25, a: Math.random() * 6.28, h: 30 + Math.random() * 18, sp: 0.15 + Math.random() * 0.1, f: Math.random() * 6 }; birds.add(b); } scene.add(birds);
  const DN = quality > 0 ? 500 : 150, dg = new T.BufferGeometry(), dp = new Float32Array(DN * 3); for (let i = 0; i < DN; i++) { dp[i * 3] = (Math.random() - 0.5) * 30; dp[i * 3 + 1] = Math.random() * 8; dp[i * 3 + 2] = (Math.random() - 0.5) * 30; } dg.setAttribute('position', new T.BufferAttribute(dp, 3));
  const dmat = new T.PointsMaterial({ color: '#ffd9a0', size: 0.045, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }); const dust = new T.Points(dg, dmat); dust.frustumCulled = false; scene.add(dust);
  const L = {
    sun, hemi, weather: 'clear', setLanterns(list) { L.lanterns = list; glows.forEach((g) => g.parent?.remove(g)); glows = list.map((p) => { const s = new T.Sprite(glowMat); s.position.copy(p); s.scale.setScalar(1.6); scene.add(s); return s; }); },
    lanterns: [], mats: null, setWeather(w) { L.weather = w; },
    async update(h, focus, dt = 0) {
      const el = Math.sin((h - 6) / 12 * Math.PI) * 62, az = 100 + (h - 6) / 12 * 160;
      const dir = new T.Vector3().setFromSphericalCoords(1, T.MathUtils.degToRad(90 - Math.max(el, 8)), T.MathUtils.degToRad(az));
      const isNight = el < -4, twi = el < 14 && !isNight;
      const want = isNight ? 'night' : twi ? 'sunset' : 'day';
      if (cur !== want) { cur = want; if (want === 'night') { scene.background = night; scene.environment = nightEnv; } else { const e = await load(want); if (e && cur === want) { scene.background = e.bg; scene.environment = e.env; } } }
      const rot = new T.Euler(0, T.MathUtils.degToRad(-az + 90), 0); scene.backgroundRotation = rot; scene.environmentRotation = rot;
      const W = L.weather, overcast = W === 'cloudy' || W === 'rain' ? 1 : W === 'dust' ? 0.7 : 0;
      if (isNight) { // oy nuri
        const md = new T.Vector3().setFromSphericalCoords(1, T.MathUtils.degToRad(50), T.MathUtils.degToRad(az + 160));
        sun.position.copy(md).multiplyScalar(200).add(focus); sun.color.set('#9db4ee'); sun.intensity = 0.9 * (1 - overcast * 0.6);
        hemi.color.set('#4a5f9a'); hemi.groundColor.set('#3a2a1e'); hemi.intensity = 0.55; scene.environmentIntensity = 0.55; scene.backgroundIntensity = 1; renderer.toneMappingExposure = 1.15;
        scene.fog.color.set('#141a30'); scene.fog.near = 30; scene.fog.far = 420;
      } else {
        sun.position.copy(dir).multiplyScalar(200).add(focus);
        const warm = Math.max(0, 1 - el / 40); sun.color.set('#ffeccc').lerp(new T.Color('#ff9440'), warm * 0.85);
        sun.intensity = (twi ? 3.4 : 4.4) * (1 - overcast * 0.7);
        hemi.color.set(twi ? '#d9a888' : '#b9d3ee'); hemi.groundColor.set('#8a6a4a'); hemi.intensity = 0.15 + overcast * 0.5;
        scene.environmentIntensity = 0.55 + overcast * 0.2; scene.backgroundIntensity = (twi ? 0.85 : 0.75) * (1 - overcast * 0.35); renderer.toneMappingExposure = twi ? 0.85 : 0.75;
        const fc = W === 'dust' ? '#c9a77a' : W === 'haze' ? '#e2d3bd' : twi ? '#c99a78' : overcast ? '#a9b2bc' : '#aebccb';
        scene.fog.color.set(fc); scene.fog.near = W === 'dust' ? 8 : W === 'haze' ? 40 : W === 'rain' ? 25 : 120; scene.fog.far = W === 'dust' ? 160 : W === 'haze' ? 900 : W === 'rain' ? 380 : 2600;
      }
      sun.target.position.copy(focus);
      birds.visible = !isNight && W !== 'rain'; const tt = performance.now() / 1000; birds.position.set(focus.x, 0, focus.z); for (const b of birds.children) { const u = b.userData; const a = u.a + tt * u.sp; b.position.set(Math.cos(a) * u.r, u.h + Math.sin(tt * 0.7 + u.f) * 2, Math.sin(a) * u.r); b.rotation.y = -a; b.scale.y = 1 + Math.sin(tt * 9 + u.f) * 0.8; }
      dust.visible = !isNight && W !== 'rain'; dust.position.set(focus.x, 0, focus.z); dmat.opacity = twi ? 0.75 : 0.35; { const dpa = dg.attributes.position; for (let i = 0; i < DN; i++) { let y = dpa.getY(i) + dt * 0.15; if (y > 8) y = 0; dpa.setY(i, y); dpa.setX(i, dpa.getX(i) + Math.sin(tt + i) * dt * 0.08); } dpa.needsUpdate = true; }
      // fonuslar: tunda va shomda yonadi
      const lampK = isNight ? 1 : el < 6 ? 0.6 : 0;
      if (L.mats) L.mats.lamp.emissiveIntensity = lampK * 4;
      glowMat.opacity = lampK * 0.9;
      const near = (L.lanterns || []).map((p) => [p, p.distanceToSquared(focus)]).sort((a, b) => a[1] - b[1]);
      lampLights.forEach((l, i) => { const n = near[i]; if (n && lampK > 0) { l.position.copy(n[0]); l.position.y -= 0.15; l.intensity = lampK * (9 + Math.sin(performance.now() / 90 + i) * 0.6); } else l.intensity = 0; });
      // zarrachalar
      parts.visible = W === 'rain' || W === 'dust';
      if (parts.visible) {
        const p = pg.attributes.position; pmat.color.set(W === 'rain' ? '#b8c4d4' : '#b89a70'); pmat.size = W === 'rain' ? 0.06 : 0.12; pmat.opacity = W === 'rain' ? 0.55 : 0.45;
        for (let i = 0; i < N; i++) { let y = p.getY(i) - dt * (W === 'rain' ? 18 : 0.6), x = p.getX(i) + dt * (W === 'dust' ? 9 : 1.5); if (y < 0) y += 40; if (x > 40) x -= 80; p.setXY(i, x, y); }
        p.needsUpdate = true; parts.position.set(focus.x, 0, focus.z);
      }
      return { isNight, el };
    },
  };
  return L;
}

// Rang korreksiyasi (kino uslubi): to'yinganlik, kontrast, iliq ohang, keskinlik, vinyetka.
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export function makeGradePass(o = {}) {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, sat: { value: o.sat ?? 1.28 }, con: { value: o.con ?? 1.12 }, warm: { value: o.warm ?? 0.05 }, vig: { value: o.vig ?? 0.32 }, sharp: { value: o.sharp ?? 0.35 }, res: { value: new THREE.Vector2(1280, 720) }, lift: { value: o.lift ?? 0.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, con, warm, vig, sharp, lift; uniform vec2 res; varying vec2 vUv;
      void main(){
        vec2 px = 1.0 / res; vec3 c = texture2D(tDiffuse, vUv).rgb;
        vec3 bl = (texture2D(tDiffuse, vUv + vec2(px.x,0.)).rgb + texture2D(tDiffuse, vUv - vec2(px.x,0.)).rgb + texture2D(tDiffuse, vUv + vec2(0.,px.y)).rgb + texture2D(tDiffuse, vUv - vec2(0.,px.y)).rgb) * 0.25;
        c += (c - bl) * sharp;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, sat);
        c = (c - 0.5) * con + 0.5 + lift;
        c *= vec3(1.0 + warm, 1.0 + warm * 0.35, 1.0 - warm * 0.6);
        float d = distance(vUv, vec2(0.5)); c *= 1.0 - vig * smoothstep(0.35, 0.85, d);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  });
}
