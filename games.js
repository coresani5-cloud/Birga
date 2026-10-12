/* Birga — O'yinlar (10 ta kichik o'yin). app.js dagi umumiy yordamchilardan foydalanadi: $, t, esc, icon, api, modal, toast. */
'use strict';
(function () {
  const L = () => (typeof LANG !== 'undefined' && ['uz', 'ru', 'en'].includes(LANG) ? LANG : 'uz');
  const T = {
    uz: { score: 'Ochko', best: 'Rekord', again: 'Qayta o‘ynash', top: 'Reyting', share: 'Chatga ulashish', over: 'O‘yin tugadi', newrec: 'Yangi rekord!', rank: 'Birga’da {n}-o‘rin',
      tap_start: 'Boshlash uchun bosing', lives: 'Jon', level: 'Daraja', you: 'Siz', bot: 'Bot', win: 'Yutdingiz!', lose: 'Yutqazdingiz', draw: 'Durang', flag: 'Bayroq', open: 'Ochish',
      top_title: 'Eng yaxshi o‘yinchilar', empty_top: 'Hali hech kim o‘ynamagan — birinchi bo‘ling!', share_text: '🎮 Birga’dagi “{g}” o‘yinida {s} ochko to‘pladim! Sen ham urinib ko‘r 😉', moves: 'Yurish', time: 'Vaqt',
      hint_snake: 'Barmoq bilan suring', hint_penalty: 'Darvozaning burchagiga bosing', hint_aim: 'Nishonlarga tez bosing', hint_2048: 'Suring — bir xil sonlar qo‘shiladi', hint_flappy: 'Uchish uchun bosing',
      hint_blocks: 'Suring ←→, bosish — burish, pastga — tushirish', hint_memory: 'Juftlarini toping', hint_xo: 'Botni yengib ko‘ring', hint_breakout: 'Taxtani barmoq bilan suring', hint_mines: 'Minalarni chetlab o‘ting' },
    ru: { score: 'Очки', best: 'Рекорд', again: 'Играть снова', top: 'Рейтинг', share: 'Поделиться в чат', over: 'Игра окончена', newrec: 'Новый рекорд!', rank: '{n}-е место в Birga',
      tap_start: 'Нажмите, чтобы начать', lives: 'Жизни', level: 'Уровень', you: 'Вы', bot: 'Бот', win: 'Победа!', lose: 'Поражение', draw: 'Ничья', flag: 'Флаг', open: 'Открыть',
      top_title: 'Лучшие игроки', empty_top: 'Пока никто не играл — будьте первым!', share_text: '🎮 Набрал(а) {s} очков в игре «{g}» в Birga! Попробуй и ты 😉', moves: 'Ходы', time: 'Время',
      hint_snake: 'Свайпайте пальцем', hint_penalty: 'Нажмите в угол ворот', hint_aim: 'Быстро нажимайте на мишени', hint_2048: 'Свайп — одинаковые числа складываются', hint_flappy: 'Нажимайте, чтобы лететь',
      hint_blocks: 'Свайп ←→, нажатие — поворот, вниз — сброс', hint_memory: 'Найдите пары', hint_xo: 'Попробуйте обыграть бота', hint_breakout: 'Двигайте платформу пальцем', hint_mines: 'Обойдите мины' },
    en: { score: 'Score', best: 'Best', again: 'Play again', top: 'Leaderboard', share: 'Share to chat', over: 'Game over', newrec: 'New record!', rank: '#{n} on Birga',
      tap_start: 'Tap to start', lives: 'Lives', level: 'Level', you: 'You', bot: 'Bot', win: 'You win!', lose: 'You lose', draw: 'Draw', flag: 'Flag', open: 'Open',
      top_title: 'Top players', empty_top: 'Nobody has played yet — be the first!', share_text: '🎮 I scored {s} in “{g}” on Birga! Can you beat it? 😉', moves: 'Moves', time: 'Time',
      hint_snake: 'Swipe to turn', hint_penalty: 'Tap a corner of the goal', hint_aim: 'Tap the targets fast', hint_2048: 'Swipe — equal numbers merge', hint_flappy: 'Tap to fly',
      hint_blocks: 'Swipe ←→, tap to rotate, down to drop', hint_memory: 'Find the pairs', hint_xo: 'Try to beat the bot', hint_breakout: 'Drag the paddle', hint_mines: 'Avoid the mines' },
  };
  const tg = (k) => (T[L()] || T.uz)[k] || T.uz[k];
  const GAMES = [
    { id: 'snake', e: '🐍', c: ['#22C55E', '#0EA5E9'], n: { uz: 'Ilon', ru: 'Змейка', en: 'Snake' } },
    { id: 'penalty', e: '⚽', c: ['#16A34A', '#065F46'], n: { uz: 'Penalti', ru: 'Пенальти', en: 'Penalty' } },
    { id: 'aim', e: '🎯', c: ['#F97316', '#DC2626'], n: { uz: 'Snayper', ru: 'Снайпер', en: 'Sniper' } },
    { id: '2048', e: '🔢', c: ['#F59E0B', '#EA580C'], n: { uz: '2048', ru: '2048', en: '2048' } },
    { id: 'flappy', e: '🐤', c: ['#38BDF8', '#2563EB'], n: { uz: 'Qushcha', ru: 'Птичка', en: 'Birdie' } },
    { id: 'blocks', e: '🧱', c: ['#8B5CF6', '#4F46E5'], n: { uz: 'Bloklar', ru: 'Блоки', en: 'Blocks' } },
    { id: 'memory', e: '🃏', c: ['#EC4899', '#8B5CF6'], n: { uz: 'Xotira', ru: 'Память', en: 'Memory' } },
    { id: 'xo', e: '❌', c: ['#0EA5E9', '#6366F1'], n: { uz: 'X-O', ru: 'Крестики-нолики', en: 'Tic-Tac-Toe' } },
    { id: 'breakout', e: '🏓', c: ['#14B8A6', '#0F766E'], n: { uz: 'G‘isht sindirish', ru: 'Арканоид', en: 'Breakout' } },
    { id: 'mines', e: '💣', c: ['#64748B', '#1E293B'], n: { uz: 'Mina qidiruv', ru: 'Сапёр', en: 'Minesweeper' } },
  ];
  const gname = (g) => g.n[L()] || g.n.uz;

  /* ---------- umumiy yordamchilar ---------- */
  let actx = null;
  function snd(f = 600, d = 0.06, v = 0.05, type = 'sine') {
    if (store.get('birga_game_sound') === '0') return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch {}
  }
  function canvasIn(stage, ratio) {
    const c = document.createElement('canvas'); c.className = 'gm-cv'; stage.appendChild(c);
    const g = c.getContext('2d');
    const fit = () => {
      const r = stage.getBoundingClientRect(); let w = r.width - 16, h = r.height - 16;
      if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
      w = Math.max(200, Math.floor(w)); h = Math.max(200, Math.floor(h));
      const d = Math.min(3, devicePixelRatio || 1);
      c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * d); c.height = Math.round(h * d);
      g.setTransform(d, 0, 0, d, 0, 0); c.W = w; c.H = h;
    };
    fit(); return { c, g, fit };
  }
  function pos(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function swipe(el, onDir, onTap) {
    let s = null;
    el.addEventListener('pointerdown', (e) => { s = [e.clientX, e.clientY, Date.now()]; });
    el.addEventListener('pointerup', (e) => {
      if (!s) return; const dx = e.clientX - s[0], dy = e.clientY - s[1]; const m = Math.max(Math.abs(dx), Math.abs(dy)); s = null;
      if (m < 22) { onTap?.(e); return; }
      onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'), e);
    });
  }
  const KEYS = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
  function loop(fn) { let id, last = performance.now(), run = true; const f = (tt) => { if (!run) return; const dt = Math.min(0.05, (tt - last) / 1000); last = tt; fn(dt); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { run = false; cancelAnimationFrame(id); }; }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (n) => Math.floor(Math.random() * n);
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(g, s, x, y, size, color = '#fff', align = 'center', weight = 800) { g.font = `${weight} ${size}px system-ui, -apple-system, Segoe UI, sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }

  /* ---------- O'YINLAR ---------- */
  const IMPL = {};

  // 1) Ilon
  IMPL.snake = (stage, ui) => {
    const COLS = 16, ROWS = 22; const { c, g, fit } = canvasIn(stage, COLS / ROWS);
    let snake, dir, nd, food, acc, speed, score, alive, started;
    const reset = () => { snake = [[8, 12], [8, 13], [8, 14]]; dir = [0, -1]; nd = dir; food = place(); acc = 0; speed = 7; score = 0; alive = true; started = false; ui.score(0); };
    const place = () => { let p; do p = [ri(COLS), ri(ROWS)]; while (snake?.some((s) => s[0] === p[0] && s[1] === p[1])); return p; };
    const turn = (d) => { started = true; const m = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] }[d]; if (m && (m[0] !== -dir[0] || m[1] !== -dir[1])) nd = m; };
    swipe(c, turn, () => { started = true; });
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); turn(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const cs = c.W / COLS;
      if (alive && started) {
        acc += dt * speed;
        while (acc >= 1) {
          acc -= 1; dir = nd; const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
          if (h[0] < 0 || h[1] < 0 || h[0] >= COLS || h[1] >= ROWS || snake.some((s) => s[0] === h[0] && s[1] === h[1])) { alive = false; snd(160, 0.3, 0.08, 'sawtooth'); ui.over(score); break; }
          snake.unshift(h);
          if (h[0] === food[0] && h[1] === food[1]) { score++; ui.score(score); speed = Math.min(16, 7 + score * 0.25); food = place(); snd(880); } else snake.pop();
        }
      }
      g.fillStyle = '#0B1220'; g.fillRect(0, 0, c.W, c.H);
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2) { g.fillStyle = '#0F1A2E'; g.fillRect(x * cs, y * cs, cs, cs); }
      g.font = `${cs * 0.9}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🍎', food[0] * cs + cs / 2, food[1] * cs + cs / 2 + 1);
      snake.forEach((s, i) => { g.fillStyle = i ? `hsl(${140 - i * 2},70%,${50 - Math.min(20, i)}%)` : '#4ADE80'; rr(g, s[0] * cs + 1, s[1] * cs + 1, cs - 2, cs - 2, cs * 0.3); g.fill(); });
      const h = snake[0]; g.fillStyle = '#0B1220'; g.beginPath(); g.arc(h[0] * cs + cs * (0.5 + dir[0] * 0.2 - dir[1] * 0.18), h[1] * cs + cs * (0.5 + dir[1] * 0.2 - dir[0] * 0.18), cs * 0.09, 0, 7); g.arc(h[0] * cs + cs * (0.5 + dir[0] * 0.2 + dir[1] * 0.18), h[1] * cs + cs * (0.5 + dir[1] * 0.2 + dir[0] * 0.18), cs * 0.09, 0, 7); g.fill();
      if (!started && alive) text(g, tg('hint_snake'), c.W / 2, c.H * 0.35, 18);
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 2) Penalti (futbol)
  IMPL.penalty = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.7);
    let score, lives, keeper, kv, ball, shot, msg, msgT;
    const reset = () => { score = 0; lives = 3; keeper = 0.5; kv = 0.35; ball = null; shot = null; msg = ''; msgT = 0; ui.score(0); ui.info(`❤️ ${lives}`); };
    reset();
    c.addEventListener('pointerdown', (e) => {
      if (shot || lives <= 0) return; const [x, y] = pos(c, e); const W = c.W, H = c.H;
      const gx = W * 0.12, gw = W * 0.76, gy = H * 0.12, gh = H * 0.24;
      const tx = Math.max(gx - 30, Math.min(gx + gw + 30, x)), ty = Math.max(gy - 20, Math.min(gy + gh + 10, y));
      shot = { sx: W / 2, sy: H * 0.82, tx, ty, t: 0, dive: Math.random() < 0.55 + Math.min(0.3, score * 0.02) ? (tx - gx) / gw : Math.random() };
      snd(300, 0.08, 0.08, 'triangle');
    });
    const stop = loop((dt) => {
      const W = c.W, H = c.H; const gx = W * 0.12, gw = W * 0.76, gy = H * 0.12, gh = H * 0.24;
      const kw = gw * (0.24 + Math.min(0.08, score * 0.006));
      if (!shot) { keeper += kv * dt * (1 + score * 0.06); if (keeper > 0.88 || keeper < 0.12) kv = -kv; keeper = Math.max(0.12, Math.min(0.88, keeper)); }
      else {
        shot.t += dt * 1.9;
        keeper += (Math.max(0.12, Math.min(0.88, shot.dive)) - keeper) * Math.min(1, dt * (3.2 + score * 0.15));
        if (shot.t >= 1 && !shot.done) {
          shot.done = true; const kx = gx + keeper * gw;
          const inGoal = shot.tx > gx + 4 && shot.tx < gx + gw - 4 && shot.ty > gy + 4 && shot.ty < gy + gh;
          const saved = inGoal && Math.abs(shot.tx - kx) < kw / 2 + 10 && shot.ty > gy + gh * 0.05;
          if (inGoal && !saved) { score++; ui.score(score); msg = 'GOOOL! ⚽'; snd(1046, 0.25, 0.08); }
          else { lives--; ui.info(`❤️ ${Math.max(0, lives)}`); msg = saved ? '🧤 !!!' : '❌'; snd(180, 0.25, 0.08, 'sawtooth'); }
          msgT = 1.1;
          setTimeout(() => { shot = null; if (lives <= 0) ui.over(score); }, 900);
        }
      }
      // maydon
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#15803D'); gr.addColorStop(1, '#166534'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'; g.fillRect(0, (H / 8) * i, W, H / 8); }
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.strokeRect(W * 0.04, gy + gh, W * 0.92, H * 0.3); g.beginPath(); g.arc(W / 2, H * 0.82, 4, 0, 7); g.fillStyle = '#fff'; g.fill();
      // darvoza
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(gx, gy, gw, gh);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(gx + (gw / 12) * i, gy); g.lineTo(gx + (gw / 12) * i, gy + gh); g.stroke(); } for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(gx, gy + (gh / 5) * i); g.lineTo(gx + gw, gy + (gh / 5) * i); g.stroke(); }
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(gx, gy + gh); g.lineTo(gx, gy); g.lineTo(gx + gw, gy); g.lineTo(gx + gw, gy + gh); g.stroke();
      // darvozabon
      const kx = gx + keeper * gw; g.fillStyle = '#F59E0B'; rr(g, kx - kw / 2, gy + gh * 0.35, kw, gh * 0.5, 10); g.fill();
      g.fillStyle = '#FCD34D'; g.beginPath(); g.arc(kx, gy + gh * 0.25, gh * 0.14, 0, 7); g.fill();
      text(g, '🧤', kx - kw / 2, gy + gh * 0.4, gh * 0.22); text(g, '🧤', kx + kw / 2, gy + gh * 0.4, gh * 0.22);
      // to'p
      let bx = W / 2, by = H * 0.82, bs = W * 0.09;
      if (shot) { const k = Math.min(1, shot.t); bx = shot.sx + (shot.tx - shot.sx) * k; by = shot.sy + (shot.ty - shot.sy) * k - Math.sin(k * Math.PI) * 30; bs = W * (0.09 - 0.04 * k); }
      g.font = `${bs}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚽', bx, by);
      if (!shot && score === 0 && lives === 3) text(g, tg('hint_penalty'), W / 2, H * 0.6, 17);
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H * 0.52, 40); }
    });
    return { stop, restart: reset, resize: fit };
  };

  // 3) Snayper (nishonga otish, CS uslubida)
  IMPL.aim = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, null);
    let targets, score, lives, spawnT, combo, shots, hx, hy, flash;
    const reset = () => { targets = []; score = 0; lives = 3; spawnT = 0.5; combo = 0; shots = []; flash = 0; ui.score(0); ui.info(`❤️ 3`); };
    reset();
    c.addEventListener('pointermove', (e) => { [hx, hy] = pos(c, e); });
    c.addEventListener('pointerdown', (e) => {
      if (lives <= 0) return; const [x, y] = pos(c, e); hx = x; hy = y; shots.push({ x, y, t: 0.25 }); snd(220, 0.07, 0.06, 'square');
      let hit = -1; for (let i = targets.length - 1; i >= 0; i--) { const tt = targets[i]; if (Math.hypot(x - tt.x, y - tt.y) < tt.r * tt.s) { hit = i; break; } }
      if (hit >= 0) { const tt = targets[hit]; const head = Math.hypot(x - tt.x, y - tt.y) < tt.r * tt.s * 0.35; combo++; const pts = (head ? 3 : 1) * (1 + Math.floor(combo / 5)); score += pts; ui.score(score); targets.splice(hit, 1); snd(head ? 1300 : 900, 0.08, 0.07); tt.pop = head ? 'HEADSHOT +' + pts : '+' + pts; pops.push({ ...tt, t: 0.7 }); }
      else { combo = 0; }
    });
    const pops = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (lives > 0) {
        spawnT -= dt; const rate = Math.max(0.35, 1.1 - score * 0.012);
        if (spawnT <= 0) { spawnT = rate; const r = Math.max(22, 38 - score * 0.15); targets.push({ x: rnd(r + 10, W - r - 10), y: rnd(r + 60, H - r - 20), r, s: 0, life: Math.max(1.1, 2.4 - score * 0.02), age: 0, kind: Math.random() < 0.15 ? 'hostage' : 'enemy' }); }
        for (let i = targets.length - 1; i >= 0; i--) { const tt = targets[i]; tt.age += dt; tt.s = Math.min(1, tt.age * 6) * (tt.age > tt.life - 0.25 ? Math.max(0, (tt.life - tt.age) / 0.25) : 1); if (tt.age >= tt.life) { targets.splice(i, 1); if (tt.kind === 'enemy') { lives--; combo = 0; flash = 0.25; ui.info(`❤️ ${Math.max(0, lives)}`); snd(140, 0.2, 0.08, 'sawtooth'); if (lives <= 0) ui.over(score); } } }
      }
      // fon — ombor devori
      g.fillStyle = '#2B2118'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 34) for (let x = (y / 34) % 2 ? -30 : 0; x < W; x += 60) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 1, y + 1, 58, 32); g.fillStyle = 'rgba(255,200,120,.05)'; g.fillRect(x + 2, y + 2, 56, 3); }
      for (const tt of targets) {
        const r = tt.r * tt.s; if (r <= 0) continue;
        g.save(); g.translate(tt.x, tt.y);
        if (tt.kind === 'hostage') { g.fillStyle = '#E5E7EB'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); text(g, '🙋', 0, 2, r * 1.2); }
        else { [1, 0.72, 0.44, 0.18].forEach((k, i) => { g.fillStyle = i % 2 ? '#fff' : '#DC2626'; g.beginPath(); g.arc(0, 0, r * k, 0, 7); g.fill(); }); }
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - tt.age / tt.life)); g.stroke();
        g.restore();
      }
      for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t -= dt; if (p.t <= 0) { pops.splice(i, 1); continue; } g.globalAlpha = Math.min(1, p.t * 2); text(g, p.pop, p.x, p.y - (0.7 - p.t) * 50, 18, '#FDE047'); g.globalAlpha = 1; }
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t -= dt; if (s.t <= 0) { shots.splice(i, 1); continue; } g.fillStyle = `rgba(20,20,20,${s.t * 3})`; g.beginPath(); g.arc(s.x, s.y, 4, 0, 7); g.fill(); }
      if (hx != null) { g.strokeStyle = '#4ADE80'; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, 14, 0, 7); g.moveTo(hx - 22, hy); g.lineTo(hx - 7, hy); g.moveTo(hx + 7, hy); g.lineTo(hx + 22, hy); g.moveTo(hx, hy - 22); g.lineTo(hx, hy - 7); g.moveTo(hx, hy + 7); g.lineTo(hx, hy + 22); g.stroke(); }
      if (combo >= 5) text(g, `🔥 x${1 + Math.floor(combo / 5)}`, W - 50, 30, 20, '#FDE047');
      if (flash > 0) { flash -= dt; g.fillStyle = `rgba(220,38,38,${flash})`; g.fillRect(0, 0, W, H); }
      if (score === 0 && lives === 3 && !targets.length) text(g, tg('hint_aim'), W / 2, H / 2, 18);
    });
    return { stop, restart: reset, resize: fit };
  };

  // 4) 2048
  IMPL['2048'] = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 1);
    let b, score, anim, dead;
    const COL = { 2: '#EEE4DA', 4: '#EDE0C8', 8: '#F2B179', 16: '#F59563', 32: '#F67C5F', 64: '#F65E3B', 128: '#EDCF72', 256: '#EDCC61', 512: '#EDC850', 1024: '#EDC53F', 2048: '#EDC22E' };
    const add = () => { const e = []; b.forEach((r, y) => r.forEach((v, x) => !v && e.push([x, y]))); if (!e.length) return; const [x, y] = e[ri(e.length)]; b[y][x] = Math.random() < 0.9 ? 2 : 4; anim[y][x] = 0; };
    const reset = () => { b = Array.from({ length: 4 }, () => [0, 0, 0, 0]); anim = Array.from({ length: 4 }, () => [1, 1, 1, 1]); score = 0; dead = false; add(); add(); ui.score(0); };
    const canMove = () => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (!b[y][x]) return true; if (x < 3 && b[y][x] === b[y][x + 1]) return true; if (y < 3 && b[y][x] === b[y + 1][x]) return true; } return false; };
    const move = (d) => {
      if (dead) return; let moved = false;
      const get = (i, j) => (d === 'L' ? [i, j] : d === 'R' ? [i, 3 - j] : d === 'U' ? [j, i] : [3 - j, i]);
      for (let i = 0; i < 4; i++) {
        const line = []; for (let j = 0; j < 4; j++) { const [y, x] = get(i, j); if (b[y][x]) line.push(b[y][x]); }
        const out = []; for (let k = 0; k < line.length; k++) { if (line[k] === line[k + 1]) { out.push(line[k] * 2); score += line[k] * 2; k++; } else out.push(line[k]); }
        for (let j = 0; j < 4; j++) { const [y, x] = get(i, j); const v = out[j] || 0; if (b[y][x] !== v) { moved = true; if (v > b[y][x] && b[y][x]) anim[y][x] = 0.6; } b[y][x] = v; }
      }
      if (moved) { add(); ui.score(score); snd(500, 0.04, 0.04); if (!canMove()) { dead = true; setTimeout(() => ui.over(score), 400); } }
    };
    swipe(c, move); const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); move(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, p = W * 0.03, cs = (W - p * 5) / 4;
      g.fillStyle = '#BBADA0'; rr(g, 0, 0, W, W, 14); g.fill();
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const v = b[y][x]; anim[y][x] = Math.min(1, anim[y][x] + dt * 6); const k = v ? 0.6 + 0.4 * anim[y][x] : 1;
        const X = p + x * (cs + p), Y = p + y * (cs + p);
        g.fillStyle = v ? COL[v] || '#3C3A32' : '#CDC1B4'; rr(g, X + (cs * (1 - k)) / 2, Y + (cs * (1 - k)) / 2, cs * k, cs * k, 8); g.fill();
        if (v) text(g, String(v), X + cs / 2, Y + cs / 2 + 1, cs * (v < 100 ? 0.45 : v < 1000 ? 0.36 : 0.28) * k, v <= 4 ? '#776E65' : '#fff');
      }
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 5) Qushcha (Flappy)
  IMPL.flappy = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.62);
    let y, vy, pipes, score, alive, started, tPipe, ground;
    const reset = () => { y = 0.45; vy = 0; pipes = []; score = 0; alive = true; started = false; tPipe = 0; ground = 0; ui.score(0); };
    const flap = () => { if (!alive) return; started = true; vy = -0.62; snd(700, 0.05, 0.04); };
    c.addEventListener('pointerdown', flap); const kd = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, gap = 0.27 - Math.min(0.06, score * 0.002), sp = 0.3 + Math.min(0.15, score * 0.004);
      if (alive && started) {
        vy += 1.65 * dt; y += vy * dt; tPipe -= dt; ground = (ground + sp * dt) % 0.1;
        if (tPipe <= 0) { tPipe = 1.45; pipes.push({ x: 1.1, gy: rnd(0.22, 0.68), s: false }); }
        for (const p of pipes) { p.x -= sp * dt; if (!p.s && p.x < 0.2) { p.s = true; score++; ui.score(score); snd(990, 0.06, 0.05); } }
        pipes = pipes.filter((p) => p.x > -0.3);
        const bx = 0.25, br = 0.035 * (H / W) * 0.62;
        const hit = y > 0.9 - br || y < 0 || pipes.some((p) => Math.abs(p.x - bx) < 0.1 && (y - br < p.gy - gap / 2 || y + br > p.gy + gap / 2));
        if (hit) { alive = false; snd(150, 0.3, 0.08, 'sawtooth'); setTimeout(() => ui.over(score), 500); }
      }
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7DD3FC'); sky.addColorStop(1, '#BAE6FD'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.8)'; [[0.2, 0.15], [0.7, 0.25], [0.45, 0.08]].forEach(([cx, cy]) => { g.beginPath(); g.arc(cx * W, cy * H, 22, 0, 7); g.arc(cx * W + 22, cy * H + 5, 18, 0, 7); g.arc(cx * W - 20, cy * H + 6, 15, 0, 7); g.fill(); });
      for (const p of pipes) { const x = (p.x - 0.08) * W, w = 0.16 * W; g.fillStyle = '#22C55E'; g.fillRect(x, 0, w, (p.gy - gap / 2) * H); g.fillRect(x, (p.gy + gap / 2) * H, w, H); g.fillStyle = '#15803D'; g.fillRect(x - 4, (p.gy - gap / 2) * H - 18, w + 8, 18); g.fillRect(x - 4, (p.gy + gap / 2) * H, w + 8, 18); }
      g.fillStyle = '#D97706'; g.fillRect(0, 0.9 * H, W, H * 0.1); g.fillStyle = '#84CC16'; g.fillRect(0, 0.9 * H, W, 10);
      g.save(); g.translate(0.25 * W, y * H); g.rotate(Math.max(-0.5, Math.min(1.2, vy * 1.4))); g.font = `${W * 0.11}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.scale(-1, 1); g.fillText('🐤', 0, 0); g.restore();
      if (!started) text(g, tg('hint_flappy'), W / 2, H * 0.62, 18, '#0C4A6E');
      text(g, String(score), W / 2, H * 0.12, 44, '#fff');
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 6) Bloklar (Tetris)
  IMPL.blocks = (stage, ui) => {
    const COLS = 10, ROWS = 20; const { c, g, fit } = canvasIn(stage, (COLS + 4.5) / ROWS);
    const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
    const CL = ['#22D3EE', '#FACC15', '#A855F7', '#3B82F6', '#F97316', '#EF4444', '#22C55E'];
    let grid, cur, next, acc, score, lines, dead;
    const newP = () => { const i = ri(7); return { m: SH[i].map((r) => r.slice()), c: i, x: 3, y: 0 }; };
    const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < COLS && y + j < ROWS && (y + j < 0 || !grid[y + j][x + i]))));
    const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const reset = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1).map(() => null)); cur = newP(); next = newP(); acc = 0; score = 0; lines = 0; dead = false; ui.score(0); ui.info(`${tg('level')} 1`); };
    const lock = () => {
      cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) grid[cur.y + j][cur.x + i] = cur.c; }));
      let n = 0; for (let y = ROWS - 1; y >= 0; y--) if (grid[y].every((v) => v !== null)) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); n++; y++; }
      if (n) { lines += n; score += [0, 100, 300, 500, 800][n] * (1 + Math.floor(lines / 10)); ui.score(score); ui.info(`${tg('level')} ${1 + Math.floor(lines / 10)}`); snd(880, 0.12, 0.06); } else snd(260, 0.04, 0.04);
      cur = next; next = newP(); if (!fits(cur.m, cur.x, cur.y)) { dead = true; snd(150, 0.4, 0.08, 'sawtooth'); ui.over(score); }
    };
    const act = (d) => {
      if (dead) return;
      if (d === 'L' && fits(cur.m, cur.x - 1, cur.y)) cur.x--;
      if (d === 'R' && fits(cur.m, cur.x + 1, cur.y)) cur.x++;
      if (d === 'U' || d === 'rot') { const m = rot(cur.m); for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; break; } }
      if (d === 'D') { while (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 2; } ui.score(score); lock(); }
    };
    // barmoq bilan: chapga/o'ngga sudrash har 1 katakda siljitadi
    let drag = null;
    c.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, moved: false, t: Date.now() }; });
    c.addEventListener('pointermove', (e) => { if (!drag) return; const cs = c.W / (COLS + 4.5); while (e.clientX - drag.x > cs) { act('R'); drag.x += cs; drag.moved = true; } while (drag.x - e.clientX > cs) { act('L'); drag.x -= cs; drag.moved = true; } });
    c.addEventListener('pointerup', (e) => { if (!drag) return; const dy = e.clientY - drag.y; if (dy > 60 && Date.now() - drag.t < 400) act('D'); else if (!drag.moved && Math.abs(dy) < 15) act('rot'); drag = null; });
    const kd = (e) => { if (KEYS[e.key] || e.key === ' ') { e.preventDefault(); act(e.key === ' ' ? 'D' : KEYS[e.key] === 'D' ? 'down1' : KEYS[e.key]); if (KEYS[e.key] === 'D' && fits(cur.m, cur.x, cur.y + 1)) cur.y++; } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      if (!dead) { acc += dt * (1.6 + Math.floor(lines / 10) * 0.7); while (acc >= 1) { acc -= 1; if (fits(cur.m, cur.x, cur.y + 1)) cur.y++; else { lock(); break; } } }
      const cs = c.W / (COLS + 4.5), W = cs * COLS;
      g.fillStyle = '#0F172A'; g.fillRect(0, 0, c.W, c.H); g.fillStyle = '#111C33'; g.fillRect(0, 0, W, cs * ROWS);
      const cell = (x, y, ci, a = 1) => { g.globalAlpha = a; g.fillStyle = CL[ci]; rr(g, x * cs + 1, y * cs + 1, cs - 2, cs - 2, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x * cs + 3, y * cs + 3, cs - 6, 3); g.globalAlpha = 1; };
      grid.forEach((r, y) => r.forEach((v, x) => v !== null && cell(x, y, v)));
      if (!dead) { let gy = cur.y; while (fits(cur.m, cur.x, gy + 1)) gy++; cur.m.forEach((r, j) => r.forEach((v, i) => { if (v) { cell(cur.x + i, gy + j, cur.c, 0.2); cell(cur.x + i, cur.y + j, cur.c); } })); }
      text(g, 'NEXT', W + cs * 2.25, cs * 1.2, cs * 0.6, '#94A3B8');
      next.m.forEach((r, j) => r.forEach((v, i) => { if (v) { g.fillStyle = CL[next.c]; rr(g, W + cs * 0.6 + i * cs * 0.8, cs * 2 + j * cs * 0.8, cs * 0.75, cs * 0.75, 3); g.fill(); } }));
      text(g, String(lines), W + cs * 2.25, cs * 6, cs * 0.9, '#E2E8F0'); text(g, 'LINES', W + cs * 2.25, cs * 6.9, cs * 0.45, '#94A3B8');
      if (score === 0 && !dead && lines === 0 && cur.y < 3) text(g, tg('hint_blocks'), W / 2, cs * ROWS * 0.45, Math.min(15, cs * 0.6), '#CBD5E1', 'center', 600);
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 7) Xotira (juftlarni topish)
  IMPL.memory = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.8);
    const EM = ['🍎', '🚗', '⚽', '🐱', '🌙', '🎸', '🍕', '🚀', '🌵', '🎁', '🐳', '⭐'];
    let cards, open, moves, t0, done, lockT, level, total;
    const deal = () => { const n = level === 1 ? 6 : 8; const pick = EM.slice().sort(() => Math.random() - 0.5).slice(0, n); cards = [...pick, ...pick].sort(() => Math.random() - 0.5).map((e) => ({ e, up: false, ok: false, f: 0 })); open = []; t0 = performance.now(); done = false; lockT = 0; };
    const reset = () => { level = 1; total = 0; moves = 0; deal(); ui.score(0); ui.info(`${tg('level')} 1`); };
    const dims = () => (cards.length === 12 ? [3, 4] : [4, 4]);
    c.addEventListener('pointerdown', (e) => {
      if (done || lockT > 0) return; const [x, y] = pos(c, e); const [C, R] = dims(); const cw = c.W / C, ch = c.H / R; const i = Math.floor(y / ch) * C + Math.floor(x / cw);
      const k = cards[i]; if (!k || k.up || k.ok) return; k.up = true; open.push(k); snd(600, 0.04, 0.04);
      if (open.length === 2) {
        moves++;
        if (open[0].e === open[1].e) { open.forEach((q) => (q.ok = true)); open = []; snd(990, 0.1, 0.05); total += 50; ui.score(total);
          if (cards.every((q) => q.ok)) { const secs = (performance.now() - t0) / 1000; total += Math.max(20, Math.round(400 - secs * 6 - moves * 4)) * level; ui.score(total); done = true;
            if (level < 4) setTimeout(() => { level++; moves = 0; ui.info(`${tg('level')} ${level}`); deal(); }, 900); else setTimeout(() => ui.over(total), 700); } }
        else lockT = 0.75;
      }
    });
    reset();
    const stop = loop((dt) => {
      if (lockT > 0) { lockT -= dt; if (lockT <= 0) { open.forEach((q) => (q.up = false)); open = []; } }
      g.fillStyle = '#1E1B4B'; g.fillRect(0, 0, c.W, c.H);
      const [C, R] = dims(); const cw = c.W / C, ch = c.H / R;
      cards.forEach((k, i) => {
        k.f += ((k.up || k.ok ? 1 : 0) - k.f) * Math.min(1, dt * 12);
        const x = (i % C) * cw, y = Math.floor(i / C) * ch, s = Math.abs(Math.cos(k.f * Math.PI)); const face = k.f > 0.5;
        g.save(); g.translate(x + cw / 2, y + ch / 2); g.scale(Math.max(0.02, s), 1);
        g.fillStyle = face ? (k.ok ? '#BBF7D0' : '#fff') : '#7C3AED'; rr(g, -cw / 2 + 5, -ch / 2 + 5, cw - 10, ch - 10, 12); g.fill();
        if (face) text(g, k.e, 0, 2, Math.min(cw, ch) * 0.48); else text(g, '?', 0, 2, Math.min(cw, ch) * 0.35, 'rgba(255,255,255,.6)');
        g.restore();
      });
    });
    return { stop, restart: reset, resize: fit };
  };

  // 8) X-O (bot bilan)
  IMPL.xo = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 1);
    let b, turn, streak, msg, msgT, busy;
    const LN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const win = (bb) => { for (const l of LN) if (bb[l[0]] && bb[l[0]] === bb[l[1]] && bb[l[1]] === bb[l[2]]) return { w: bb[l[0]], l }; return bb.every(Boolean) ? { w: 'D' } : null; };
    const mm = (bb, p) => { const r = win(bb); if (r) return r.w === 'O' ? 10 : r.w === 'X' ? -10 : 0; let best = p === 'O' ? -99 : 99; for (let i = 0; i < 9; i++) if (!bb[i]) { bb[i] = p; const v = mm(bb, p === 'O' ? 'X' : 'O'); bb[i] = null; best = p === 'O' ? Math.max(best, v) : Math.min(best, v); } return best; };
    const botMove = () => {
      const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const smart = Math.random() < Math.min(0.95, 0.6 + streak * 0.08); let pick = free[ri(free.length)];
      if (smart) { let best = -99; for (const i of free) { b[i] = 'O'; const v = mm(b, 'X'); b[i] = null; if (v > best) { best = v; pick = i; } } }
      b[pick] = 'O'; snd(420, 0.05, 0.04);
    };
    const round = () => { b = Array(9).fill(null); turn = 'X'; busy = false; };
    const reset = () => { streak = 0; msg = ''; msgT = 0; round(); ui.score(0); ui.info(`${tg('you')} ❌ · ${tg('bot')} ⭕`); };
    const end = (r) => {
      busy = true; msgT = 1.3;
      if (r.w === 'X') { streak++; ui.score(streak); msg = tg('win'); snd(1046, 0.2, 0.06); setTimeout(round, 1300); }
      else if (r.w === 'D') { msg = tg('draw'); setTimeout(round, 1300); }
      else { msg = tg('lose'); snd(160, 0.3, 0.07, 'sawtooth'); setTimeout(() => ui.over(streak), 1300); }
    };
    c.addEventListener('pointerdown', (e) => {
      if (busy || turn !== 'X') return; const [x, y] = pos(c, e); const i = Math.floor(y / (c.H / 3)) * 3 + Math.floor(x / (c.W / 3));
      if (b[i]) return; b[i] = 'X'; snd(700, 0.05, 0.04); let r = win(b); if (r) return end(r);
      turn = 'O'; busy = true; setTimeout(() => { botMove(); turn = 'X'; busy = false; r = win(b); if (r) end(r); }, 380);
    });
    reset();
    const stop = loop((dt) => {
      const W = c.W, s = W / 3; g.fillStyle = '#0F172A'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#334155'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(s * i, 14); g.lineTo(s * i, W - 14); g.moveTo(14, s * i); g.lineTo(W - 14, s * i); g.stroke(); }
      b.forEach((v, i) => { const x = (i % 3) * s + s / 2, y = Math.floor(i / 3) * s + s / 2, r = s * 0.28;
        if (v === 'X') { g.strokeStyle = '#38BDF8'; g.lineWidth = 10; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); }
        if (v === 'O') { g.strokeStyle = '#F472B6'; g.lineWidth = 10; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); } });
      const r = win(b); if (r?.l) { const a = r.l[0], z = r.l[2]; g.strokeStyle = '#FDE047'; g.lineWidth = 8; g.beginPath(); g.moveTo((a % 3) * s + s / 2, Math.floor(a / 3) * s + s / 2); g.lineTo((z % 3) * s + s / 2, Math.floor(z / 3) * s + s / 2); g.stroke(); }
      if (msgT > 0) { msgT -= dt; g.fillStyle = 'rgba(15,23,42,.6)'; g.fillRect(0, W / 2 - 34, W, 68); text(g, msg, W / 2, W / 2, 34); }
    });
    return { stop, restart: reset, resize: fit };
  };

  // 9) G'isht sindirish (Breakout)
  IMPL.breakout = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.66);
    let px, ball, bricks, score, lives, level, stuck;
    const build = () => { bricks = []; const rows = Math.min(8, 4 + level); for (let r = 0; r < rows; r++) for (let i = 0; i < 8; i++) bricks.push({ x: i / 8, y: 0.1 + r * 0.045, hp: r < level - 1 ? 2 : 1, hue: (r * 40 + level * 30) % 360 }); };
    const serve = () => { stuck = true; ball = { x: px, y: 0.86, vx: 0, vy: 0 }; };
    const reset = () => { px = 0.5; score = 0; lives = 3; level = 1; build(); serve(); ui.score(0); ui.info(`❤️ 3`); };
    const launch = () => { if (!stuck) return; stuck = false; const sp = 0.62 + level * 0.06; ball.vx = rnd(-0.5, 0.5) * sp; ball.vy = -sp; };
    c.addEventListener('pointermove', (e) => { const [x] = pos(c, e); px = Math.max(0.1, Math.min(0.9, x / c.W)); });
    c.addEventListener('pointerdown', (e) => { const [x] = pos(c, e); px = Math.max(0.1, Math.min(0.9, x / c.W)); launch(); });
    const kd = (e) => { if (e.key === 'ArrowLeft') px = Math.max(0.1, px - 0.06); if (e.key === 'ArrowRight') px = Math.min(0.9, px + 0.06); if (e.key === ' ') launch(); }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, ar = W / H, pw = 0.2, R = 0.016;
      if (stuck) { ball.x = px; ball.y = 0.9 - 0.035; }
      else if (lives > 0) {
        for (let k = 0; k < 2; k++) {
          ball.x += (ball.vx * dt) / 2; ball.y += ((ball.vy * dt) / 2) * ar;
          if (ball.x < R || ball.x > 1 - R) { ball.vx = -ball.vx; ball.x = Math.max(R, Math.min(1 - R, ball.x)); snd(500, 0.02, 0.03); }
          if (ball.y < 0.04) { ball.vy = Math.abs(ball.vy); snd(500, 0.02, 0.03); }
          if (ball.vy > 0 && ball.y > 0.9 - 0.02 && ball.y < 0.93 && Math.abs(ball.x - px) < pw / 2 + R) { const off = (ball.x - px) / (pw / 2); const sp = Math.hypot(ball.vx, ball.vy); ball.vx = off * sp * 0.8; ball.vy = -Math.sqrt(Math.max(0.05, sp * sp - ball.vx * ball.vx)); snd(380, 0.03, 0.04); }
          for (const br of bricks) { if (br.hp <= 0) continue; if (ball.x > br.x && ball.x < br.x + 1 / 8 && ball.y > br.y && ball.y < br.y + 0.04) { br.hp--; ball.vy = -ball.vy; if (br.hp <= 0) { score += 10 * level; ui.score(score); snd(900, 0.04, 0.05); } break; } }
          if (ball.y > 1) { lives--; ui.info(`❤️ ${Math.max(0, lives)}`); snd(150, 0.3, 0.07, 'sawtooth'); if (lives <= 0) { ui.over(score); return; } serve(); break; }
        }
        if (bricks.every((b2) => b2.hp <= 0)) { level++; score += 100; ui.score(score); build(); serve(); snd(1200, 0.25, 0.06); }
      }
      g.fillStyle = '#042F2E'; g.fillRect(0, 0, W, H);
      for (const br of bricks) if (br.hp > 0) { g.fillStyle = `hsl(${br.hue},75%,${br.hp > 1 ? 40 : 58}%)`; rr(g, br.x * W + 2, br.y * H + 2, W / 8 - 4, 0.04 * H - 4, 5); g.fill(); }
      g.fillStyle = '#F8FAFC'; rr(g, (px - pw / 2) * W, 0.9 * H, pw * W, 0.022 * H, 8); g.fill();
      g.fillStyle = '#FDE047'; g.beginPath(); g.arc(ball.x * W, ball.y * H, R * W, 0, 7); g.fill();
      if (stuck && score === 0 && lives === 3) text(g, tg('hint_breakout'), W / 2, H * 0.6, 16, '#CCFBF1');
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 10) Mina qidiruv
  IMPL.mines = (stage, ui) => {
    const N = 9, M = 10; const { c, g, fit } = canvasIn(stage, 1);
    let cells, first, dead, won, t0, flagMode, opened;
    const nb = (i) => { const x = i % N, y = Math.floor(i / N), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < N && Y < N) r.push(Y * N + X); } return r; };
    const reset = () => { cells = Array.from({ length: N * N }, () => ({ m: false, o: false, f: false, n: 0 })); first = true; dead = false; won = false; t0 = 0; flagMode = false; opened = 0; ui.score(0); ui.info(`💣 ${M}`); ui.extra(`<button class="gm-mode">⛏️ ${tg('open')}</button>`, () => { flagMode = !flagMode; return flagMode ? `🚩 ${tg('flag')}` : `⛏️ ${tg('open')}`; }); };
    const plant = (safe) => { const ban = new Set([safe, ...nb(safe)]); let k = 0; while (k < M) { const i = ri(N * N); if (!cells[i].m && !ban.has(i)) { cells[i].m = true; k++; } } cells.forEach((q, i) => (q.n = nb(i).filter((j) => cells[j].m).length)); t0 = performance.now(); };
    const reveal = (i) => { const q = cells[i]; if (q.o || q.f) return; q.o = true; opened++; if (!q.n && !q.m) nb(i).forEach(reveal); };
    const tap = (i, flag) => {
      if (dead || won) return; const q = cells[i];
      if (flag) { if (!q.o) { q.f = !q.f; snd(500, 0.03, 0.03); ui.info(`💣 ${M - cells.filter((x) => x.f).length}`); } return; }
      if (q.f) return; if (first) { first = false; plant(i); }
      if (q.m) { q.o = true; dead = true; cells.forEach((x) => x.m && (x.o = true)); snd(120, 0.5, 0.09, 'sawtooth'); setTimeout(() => ui.over(0), 900); return; }
      reveal(i); snd(650, 0.03, 0.03);
      if (opened === N * N - M) { won = true; const secs = (performance.now() - t0) / 1000; const sc = Math.max(10, Math.round(1000 - secs * 5)); ui.score(sc); snd(1200, 0.3, 0.06); setTimeout(() => ui.over(sc), 900); }
    };
    let lp = null, lpFired = false;
    c.addEventListener('pointerdown', (e) => { const [x, y] = pos(c, e); const i = Math.floor(y / (c.H / N)) * N + Math.floor(x / (c.W / N)); lpFired = false; lp = setTimeout(() => { lpFired = true; navigator.vibrate?.(20); tap(i, true); }, 380); c._i = i; });
    c.addEventListener('pointerup', () => { clearTimeout(lp); if (!lpFired && c._i != null) tap(c._i, flagMode); c._i = null; });
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    reset();
    const COLN = ['', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#B45309', '#0891B2', '#111827', '#6B7280'];
    const stop = loop(() => {
      const s = c.W / N; g.fillStyle = '#94A3B8'; g.fillRect(0, 0, c.W, c.W);
      cells.forEach((q, i) => { const x = (i % N) * s, y = Math.floor(i / N) * s;
        g.fillStyle = q.o ? (q.m ? '#FCA5A5' : '#F1F5F9') : (i + Math.floor(i / N)) % 2 ? '#4ADE80' : '#22C55E'; g.fillRect(x + 1, y + 1, s - 2, s - 2);
        if (q.o && q.m) text(g, '💣', x + s / 2, y + s / 2 + 1, s * 0.6); else if (q.o && q.n) text(g, String(q.n), x + s / 2, y + s / 2 + 1, s * 0.55, COLN[q.n]); else if (!q.o && q.f) text(g, '🚩', x + s / 2, y + s / 2 + 1, s * 0.55); });
      if (!dead && !won && t0) { const secs = Math.floor((performance.now() - t0) / 1000); ui.score(Math.max(10, 1000 - secs * 5)); }
    });
    return { stop, restart: reset, resize: fit };
  };

  /* ---------- O'yin oynasi ---------- */
  const Page = { cur: null, inst: null, best: {}, score: 0 };
  function ensurePage() {
    if ($('#gm-page')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="gm-page hidden" id="gm-page">
      <div class="gm-head"><button class="icon-btn light" id="gm-back">${icon('back')}</button><div class="gm-title" id="gm-title"></div>
        <div class="gm-stats"><span id="gm-info"></span><span class="gm-sc"><small>${tg('score')}</small><b id="gm-score">0</b></span><span class="gm-sc"><small>🏆</small><b id="gm-best">0</b></span></div></div>
      <div class="gm-extra" id="gm-extra"></div>
      <div class="gm-stage" id="gm-stage"></div>
      <div class="gm-over hidden" id="gm-over"></div></div>`);
    $('#gm-back').onclick = () => closeGame();
    addEventListener('resize', () => Page.inst?.resize?.());
    document.addEventListener('visibilitychange', () => { if (document.hidden && Page.inst && !$('#gm-page').classList.contains('hidden')) closeGame(); });
    if (typeof trackEl === 'function') trackEl($('#gm-page'), 'game', () => closeGame());
  }
  function startGame(id) {
    ensurePage();
    const meta = GAMES.find((x) => x.id === id); if (!meta) return;
    Page.cur = meta; Page.score = 0;
    $('#gm-title').textContent = `${meta.e} ${gname(meta)}`;
    $('#gm-best').textContent = Page.best[id] || 0; $('#gm-score').textContent = 0; $('#gm-info').textContent = ''; $('#gm-extra').innerHTML = '';
    $('#gm-page').style.setProperty('--g1', meta.c[0]); $('#gm-page').style.setProperty('--g2', meta.c[1]);
    $('#gm-page').classList.remove('hidden'); $('#gm-over').classList.add('hidden');
    run();
  }
  function run() {
    Page.inst?.stop?.(); const st = $('#gm-stage'); st.innerHTML = '';
    $('#gm-extra').innerHTML = '';
    const ui = {
      score: (n) => { Page.score = n; $('#gm-score').textContent = n; },
      info: (s) => { $('#gm-info').textContent = s; },
      extra: (html, onClick) => { $('#gm-extra').innerHTML = html; const b = $('#gm-extra button'); if (b) b.onclick = () => { b.textContent = onClick(); }; },
      over: (n) => gameOver(n),
    };
    requestAnimationFrame(() => { Page.inst = IMPL[Page.cur.id](st, ui); });
  }
  function closeGame() { Page.inst?.stop?.(); Page.inst = null; $('#gm-page')?.classList.add('hidden'); renderLobby(); }
  async function gameOver(score) {
    const id = Page.cur.id; const prev = Page.best[id] || 0;
    const ov = $('#gm-over');
    ov.innerHTML = `<div class="gm-card"><h3>${tg('over')}</h3><div class="gm-big">${score}</div><p class="gm-rec" id="gm-rec">${score > prev ? '🎉 ' + tg('newrec') : `🏆 ${tg('best')}: ${prev}`}</p><p class="gm-rank" id="gm-rank"></p>
      <button class="btn-primary" id="gm-again">${tg('again')}</button>
      <div class="gm-row"><button id="gm-top">🏆 ${tg('top')}</button><button id="gm-share">${icon('send')} ${tg('share')}</button></div></div>`;
    ov.classList.remove('hidden');
    $('#gm-again').onclick = () => { ov.classList.add('hidden'); run(); };
    $('#gm-top').onclick = () => showTop(id);
    $('#gm-share').onclick = () => shareScore(Page.cur, score);
    if (score > prev) { Page.best[id] = score; $('#gm-best').textContent = score; }
    try {
      const r = await api('/api/games/score', { body: { game: id, score } });
      Page.best[id] = r.best; $('#gm-best').textContent = r.best;
      const rk = $('#gm-rank'); if (rk) rk.textContent = tg('rank').replace('{n}', r.rank);
    } catch {}
  }
  async function showTop(id) {
    const meta = GAMES.find((x) => x.id === id);
    modal(`<h3>${meta.e} ${tg('top_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="gm-top" id="gm-toplist"><p class="empty-note">…</p></div>`);
    try {
      const r = await api('/api/games/top?game=' + id);
      const medal = ['🥇', '🥈', '🥉'];
      $('#gm-toplist').innerHTML = r.top.length ? r.top.map((x, i) => `<div class="gm-tr${x.user.id === S.me.id ? ' me' : ''}"><span class="gm-pos">${medal[i] || i + 1}</span>${avatar({ ...x.user, online: false }, 'sm')}<b>${esc(S.users.get(x.user.id)?.name || x.user.name || '')}</b><span class="gm-pts">${x.best}</span></div>`).join('')
        + (r.me && r.me.rank > 20 ? `<div class="gm-tr me"><span class="gm-pos">${r.me.rank}</span>${avatar({ ...S.me, online: false }, 'sm')}<b>${esc(S.me.name)}</b><span class="gm-pts">${r.me.best}</span></div>` : '')
        : `<p class="empty-note">${esc(tg('empty_top'))}</p>`;
    } catch { $('#gm-toplist').innerHTML = `<p class="empty-note">${esc(t('net_err'))}</p>`; }
  }
  function shareScore(meta, score) {
    const txt = tg('share_text').replace('{g}', gname(meta)).replace('{s}', score);
    const list = [...S.chats.values()].filter((c) => !(c.type === 'channel' && !['owner', 'admin'].includes(c.role)) && (c.last || c.self)).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)).slice(0, 60);
    modal(`<h3>${tg('share')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="chat-pick">${list.map((c) => `<button data-cid="${c.id}">${chatAvatar(c, 'sm')}<b>${esc(chatTitle(c))}</b></button>`).join('')}</div>`);
    $('#modal-card .chat-pick').onclick = async (e) => { const b = e.target.closest('[data-cid]'); if (!b) return; closeModal(); try { await emitSend({ chatId: +b.dataset.cid, type: 'text', text: txt }); toast('✓'); } catch (er) { toast(er.message); } };
  }

  /* ---------- O'yinlar bo'limi (lobbi) ---------- */
  async function renderLobby() {
    const el = $('#games-grid'); if (!el) return;
    el.innerHTML = GAMES.map((m) => `<button class="gm-tile" data-g="${m.id}" style="--g1:${m.c[0]};--g2:${m.c[1]}"><span class="gm-e">${m.e}</span><b>${esc(gname(m))}</b><small>🏆 ${Page.best[m.id] || 0}</small></button>`).join('');
    el.onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) startGame(b.dataset.g); };
    try { const mine = await api('/api/games/mine'); Object.assign(Page.best, mine); el.querySelectorAll('[data-g]').forEach((b) => (b.querySelector('small').textContent = '🏆 ' + (Page.best[b.dataset.g] || 0))); } catch {}
  }

  window.BirgaGames = { list: GAMES, start: startGame, renderLobby, tg };
})();
