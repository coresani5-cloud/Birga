const { chromium } = require('playwright'); const fs = require('fs');
const OUT = process.argv[2];
const LOOKS = [
  { top: '#27304a', top2: '#1b2235', pants: '#27304a', pants2: '#1b2235', vest: '#1d1f24', hc: '#202227', gl: '#1a1f2b' },
  { top: '#4b5320', top2: '#2f3a1e', pants: '#4b5320', pants2: '#2f3a1e', vest: '#2f3b1a', hc: '#3f4a2a', gl: '#2a2a20' },
  { top: '#a08a62', top2: '#7a6544', pants: '#a08a62', pants2: '#7a6544', vest: '#6b5532', hc: '#8f7a55', gl: '#5a4a33' },
  { top: '#5b6270', top2: '#3a3f48', pants: '#5b6270', pants2: '#3a3f48', vest: '#1e2228', hc: '#2a2e33', gl: '#16181c' },
];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 600, height: 600 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const src = fs.readFileSync(require('path').join(__dirname, '../../games.js'), 'utf8').replace("  // 12) Birga Strike", "  window.__ops = { opsAssets, glbSoldier };\n  // 12) Birga Strike");
  await p.route('**/games.js*', r => r.fulfill({ body: src, contentType: 'text/javascript' }));
  await p.goto('http://127.0.0.1:3100/'); await p.waitForTimeout(1000);
  await p.evaluate(() => new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/games.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  const urls = await p.evaluate(async (LOOKS) => {
    const lib = await window.__ops.opsAssets(), T = lib.T, W = 256, H = 384;
    const rd = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); rd.setSize(W, H); rd.outputEncoding = T.sRGBEncoding; rd.toneMapping = T.ACESFilmicToneMapping; rd.setClearColor(0, 0); rd.toneMappingExposure = 0.85;
    const out = [];
    for (let i = 0; i < 4; i++) {
      const sc = new T.Scene(), pm = new T.PMREMGenerator(rd); sc.environment = pm.fromEquirectangular(lib.sky).texture;
      sc.add(new T.HemisphereLight(0xfff1d6, 0x404650, 0.45)); const k = new T.DirectionalLight(0xfff0dd, 1.5); k.position.set(1.5, 2.5, 2); sc.add(k); const rim = new T.DirectionalLight(0x9fc4ff, 1.4); rim.position.set(-2, 1.5, -2); sc.add(rim);
      const S = window.__ops.glbSoldier(lib, LOOKS[i], lib.FACE[i], 1.0), gm = lib.mkGun(0.55); S.gun.add(gm); S.g.rotation.y = Math.PI; sc.add(S.g);
      for (let f = 0; f < 15; f++) S.tick({ x: 0, y: 0, dead: false, fire: false, mv: 0 }, 1 / 30);
      const cam = new T.PerspectiveCamera(24, W / H, 0.05, 20); cam.position.set(0, 0.9, 1.3); cam.lookAt(0, 0.8, 0);
      rd.clear(); rd.render(sc, cam); out.push(rd.domElement.toDataURL('image/png'));
    }
    return out;
  }, LOOKS);
  fs.mkdirSync(OUT, { recursive: true }); urls.forEach((u, i) => fs.writeFileSync(`${OUT}/p${i + 1}.png`, Buffer.from(u.split(',')[1], 'base64')));
  console.log(errs.join('\n')); await b.close();
})();
