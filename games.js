/* Birga — O'yinlar (10 ta kichik o'yin). app.js dagi umumiy yordamchilardan foydalanadi: $, t, esc, icon, api, modal, toast. */
'use strict';
(function () {
  const L = () => (typeof LANG !== 'undefined' && ['uz', 'ru', 'en'].includes(LANG) ? LANG : 'uz');
  const T = {
    uz: { score: 'Ochko', best: 'Rekord', again: 'Qayta o‘ynash', top: 'Reyting', share: 'Chatga ulashish', over: 'O‘yin tugadi', newrec: 'Yangi rekord!', rank: 'Birga’da {n}-o‘rin',
      tap_start: 'Boshlash uchun bosing', lives: 'Jon', level: 'Daraja', you: 'Siz', bot: 'Bot', win: 'Yutdingiz!', lose: 'Yutqazdingiz', draw: 'Durang', flag: 'Bayroq', open: 'Ochish',
      top_title: 'Eng yaxshi o‘yinchilar', empty_top: 'Hali hech kim o‘ynamagan — birinchi bo‘ling!', share_text: '🎮 Birga’dagi “{g}” o‘yinida {s} ochko to‘pladim! Sen ham urinib ko‘r 😉', moves: 'Yurish', time: 'Vaqt',
      hint_snake: 'Barmoq bilan suring', hint_penalty: 'Darvozaning burchagiga bosing', hint_aim: 'Nishonlarga tez bosing', hint_2048: 'Suring — bir xil sonlar qo‘shiladi', hint_flappy: 'Uchish uchun bosing',
      hint_blocks: 'Suring ←→, bosish — burish, pastga — tushirish', hint_memory: 'Juftlarini toping', hint_xo: 'Botni yengib ko‘ring', hint_breakout: 'Taxtani barmoq bilan suring', hint_mines: 'Minalarni chetlab o‘ting', hint_run: 'Suring: chap/o‘ng, tepaga — sakrash, pastga — engashish', wave: 'To‘lqin', reload: 'O‘q joylanmoqda', hint_strike: 'Chapda — yurish, ekranni suring — burilish, 🔫 — otish', hint_football: 'Joystik — yugurish, ⚽ — zarba, ↗️ — pas' },
    ru: { score: 'Очки', best: 'Рекорд', again: 'Играть снова', top: 'Рейтинг', share: 'Поделиться в чат', over: 'Игра окончена', newrec: 'Новый рекорд!', rank: '{n}-е место в Birga',
      tap_start: 'Нажмите, чтобы начать', lives: 'Жизни', level: 'Уровень', you: 'Вы', bot: 'Бот', win: 'Победа!', lose: 'Поражение', draw: 'Ничья', flag: 'Флаг', open: 'Открыть',
      top_title: 'Лучшие игроки', empty_top: 'Пока никто не играл — будьте первым!', share_text: '🎮 Набрал(а) {s} очков в игре «{g}» в Birga! Попробуй и ты 😉', moves: 'Ходы', time: 'Время',
      hint_snake: 'Свайпайте пальцем', hint_penalty: 'Нажмите в угол ворот', hint_aim: 'Быстро нажимайте на мишени', hint_2048: 'Свайп — одинаковые числа складываются', hint_flappy: 'Нажимайте, чтобы лететь',
      hint_blocks: 'Свайп ←→, нажатие — поворот, вниз — сброс', hint_memory: 'Найдите пары', hint_xo: 'Попробуйте обыграть бота', hint_breakout: 'Двигайте платформу пальцем', hint_mines: 'Обойдите мины', hint_run: 'Свайп: влево/вправо, вверх — прыжок, вниз — подкат', wave: 'Волна', reload: 'Перезарядка', hint_strike: 'Слева — ходьба, свайп по экрану — поворот, 🔫 — огонь', hint_football: 'Джойстик — бег, ⚽ — удар, ↗️ — пас' },
    en: { score: 'Score', best: 'Best', again: 'Play again', top: 'Leaderboard', share: 'Share to chat', over: 'Game over', newrec: 'New record!', rank: '#{n} on Birga',
      tap_start: 'Tap to start', lives: 'Lives', level: 'Level', you: 'You', bot: 'Bot', win: 'You win!', lose: 'You lose', draw: 'Draw', flag: 'Flag', open: 'Open',
      top_title: 'Top players', empty_top: 'Nobody has played yet — be the first!', share_text: '🎮 I scored {s} in “{g}” on Birga! Can you beat it? 😉', moves: 'Moves', time: 'Time',
      hint_snake: 'Swipe to turn', hint_penalty: 'Tap a corner of the goal', hint_aim: 'Tap the targets fast', hint_2048: 'Swipe — equal numbers merge', hint_flappy: 'Tap to fly',
      hint_blocks: 'Swipe ←→, tap to rotate, down to drop', hint_memory: 'Find the pairs', hint_xo: 'Try to beat the bot', hint_breakout: 'Drag the paddle', hint_mines: 'Avoid the mines', hint_run: 'Swipe left/right, up to jump, down to slide', wave: 'Wave', reload: 'Reloading', hint_strike: 'Left stick to move, swipe screen to turn, 🔫 to fire', hint_football: 'Stick to run, ⚽ to shoot, ↗️ to pass' },
  };
  const tg = (k) => (T[L()] || T.uz)[k] || T.uz[k];
  const GAMES = [
    { id: 'run', e: '🏃', c: ['#F97316', '#DB2777'], n: { uz: 'Birga Run', ru: 'Birga Run', en: 'Birga Run' }, big: 1 },
    { id: 'strike', e: '🔫', c: ['#475569', '#B45309'], n: { uz: 'Birga Strike', ru: 'Birga Strike', en: 'Birga Strike' } },
    { id: 'football', e: '⚽', c: ['#16A34A', '#1D4ED8'], n: { uz: 'Futbol 4×4', ru: 'Футбол 4×4', en: 'Football 4v4' } },
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

  // 11) Birga Run — 3 yo'lakli yuguruvchi (Subway uslubida, psevdo-3D)
  IMPL.run = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.58);
    const LW = 0.72, ZP = 3, FAR = 70, CAMH = 2.25, PH = 1.3;
    const TRAIN_C = [['#DC2626', '#991B1B'], ['#2563EB', '#1E3A8A'], ['#F59E0B', '#B45309'], ['#10B981', '#065F46'], ['#8B5CF6', '#5B21B6']];
    const BLD_C = ['#F472B6', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA', '#FB7185', '#38BDF8'];
    let P, objs, side, speed, dist, coins, spawnZ, sideZ, started, dead, deadT, magnet, shield, mult, tie, hint, shake, sparks;
    const reset = () => {
      P = { lane: 0, x: 0, y: 0, vy: 0, slide: 0, run: 0, stumble: 0 };
      objs = []; side = []; speed = 11; dist = 0; coins = 0; spawnZ = 26; sideZ = 0; started = false; dead = false; deadT = 0; magnet = 0; shield = 0; mult = 1; tie = 0; hint = 1; shake = 0; sparks = [];
      for (let z = 4; z < FAR; z += 3.2) addSide(z);
      ui.score(0); ui.info('🪙 0');
    };
    function addSide(z) {
      for (const s of [-1, 1]) {
        const h = rnd(1.6, 5.5), w = rnd(1.2, 2.2);
        side.push({ x0: s < 0 ? -LW * 1.5 - 0.5 - w : LW * 1.5 + 0.5, w, h, z, d: rnd(2.2, 3), col: BLD_C[ri(BLD_C.length)], win: Math.random() < 0.7 });
      }
    }
    // qator yaratish: kamida bitta yo'lak doim o'tish mumkin
    function spawnRow(z) {
      const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
      const r = Math.random(), lvl = Math.min(1, dist / 1500);
      let blocked = [];
      if (r < 0.34) { blocked = [lanes[0]]; objs.push(train(lanes[0], z)); }
      else if (r < 0.34 + 0.18 * (0.5 + lvl)) { blocked = [lanes[0], lanes[1]]; objs.push(train(lanes[0], z), train(lanes[1], z + rnd(0, 4))); }
      else if (r < 0.75) { const n = 1 + ri(3); for (let i = 0; i < n; i++) objs.push({ t: 'low', lane: lanes[i], z, len: 0.35 }); blocked = lanes.slice(0, n); if (n === 3) blocked = []; }
      else { const n = 1 + ri(2); for (let i = 0; i < n; i++) objs.push({ t: 'high', lane: lanes[i], z, len: 0.3 }); if (Math.random() < 0.5) objs.push({ t: 'low', lane: lanes[n], z: z + 0.1, len: 0.35 }); blocked = []; }
      // tangalar
      const free = [-1, 0, 1].filter((l) => !blocked.includes(l) || !objs.some((o) => o.t === 'train' && o.lane === l && Math.abs(o.z - z) < 12));
      const cl = free[ri(free.length)];
      if (cl !== undefined && Math.random() < 0.8) {
        const lowHere = objs.find((o) => o.t === 'low' && o.lane === cl && Math.abs(o.z - z) < 1);
        for (let i = 0; i < 6; i++) { const zz = z - 4 + i * 1.4; const arc = lowHere ? Math.max(0, 1.1 - Math.abs(zz - z) * 0.25) : 0; objs.push({ t: 'coin', lane: cl, z: zz, y: 0.55 + arc }); }
      }
      if (Math.random() < 0.06) objs.push({ t: Math.random() < 0.5 ? 'magnet' : 'shield', lane: free[ri(free.length)] ?? 0, z: z + 6, y: 0.7 });
      else if (Math.random() < 0.03) objs.push({ t: 'x2', lane: free[ri(free.length)] ?? 0, z: z + 6, y: 0.7 });
    }
    const train = (lane, z) => { const col = TRAIN_C[ri(TRAIN_C.length)]; return { t: 'train', lane, z, len: rnd(7, 12), col, moving: Math.random() < Math.min(0.35, dist / 4000) ? rnd(3, 6) : 0 }; };
    const act = (d) => {
      if (dead) return; if (!started) { started = true; hint = 0; }
      if (d === 'L' && P.lane > -1) { P.lane--; snd(520, 0.05, 0.04); }
      else if (d === 'R' && P.lane < 1) { P.lane++; snd(520, 0.05, 0.04); }
      else if (d === 'U' && P.y <= 0.01) { P.vy = 8.2; P.slide = 0; snd(700, 0.08, 0.05, 'triangle'); }
      else if (d === 'D') { if (P.y > 0.05) P.vy = -14; P.slide = 0.62; snd(300, 0.08, 0.04); }
    };
    swipe(c, act, () => { if (!started) { started = true; hint = 0; } });
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); act(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    // proyeksiya
    let W, H, F, HZ;
    const sx = (x, z) => W / 2 + (x * F) / z;
    const sy = (y, z) => HZ + ((CAMH - y) * F) / z;
    function quad(pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
    function box(x0, x1, y0, y1, z0, z1, front, top, sideC) {
      z0 = Math.max(0.6, z0); if (z1 <= z0) return null;
      if (x1 < 0) quad([[sx(x1, z0), sy(y0, z0)], [sx(x1, z0), sy(y1, z0)], [sx(x1, z1), sy(y1, z1)], [sx(x1, z1), sy(y0, z1)]], sideC);
      if (x0 > 0) quad([[sx(x0, z0), sy(y0, z0)], [sx(x0, z0), sy(y1, z0)], [sx(x0, z1), sy(y1, z1)], [sx(x0, z1), sy(y0, z1)]], sideC);
      if (y1 < CAMH) quad([[sx(x0, z0), sy(y1, z0)], [sx(x1, z0), sy(y1, z0)], [sx(x1, z1), sy(y1, z1)], [sx(x0, z1), sy(y1, z1)]], top);
      const r = [sx(x0, z0), sy(y1, z0), sx(x1, z0) - sx(x0, z0), sy(y0, z0) - sy(y1, z0)];
      g.fillStyle = front; g.fillRect(r[0], r[1], r[2], r[3]); return r;
    }
    function drawObj(o) {
      const x = o.lane * LW;
      if (o.t === 'train') {
        const r = box(x - LW * 0.44, x + LW * 0.44, 0.05, 1.95, o.z, o.z + o.len, o.col[0], o.col[1], o.col[1]);
        if (r && o.z > 0.6) {
          const [rx, ry, rw, rh] = r; g.fillStyle = '#BAE6FD'; rr(g, rx + rw * 0.12, ry + rh * 0.12, rw * 0.76, rh * 0.3, rw * 0.06); g.fill();
          g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(rx + rw * 0.1, ry + rh * 0.55, rw * 0.8, rh * 0.06);
          g.fillStyle = '#FEF08A'; g.beginPath(); g.arc(rx + rw * 0.2, ry + rh * 0.78, rw * 0.07, 0, 7); g.arc(rx + rw * 0.8, ry + rh * 0.78, rw * 0.07, 0, 7); g.fill();
        }
      } else if (o.t === 'low') {
        const r = box(x - LW * 0.45, x + LW * 0.45, 0.22, 0.62, o.z, o.z + o.len, '#F8FAFC', '#E2E8F0', '#CBD5E1');
        if (r) { const [rx, ry, rw, rh] = r; g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip(); g.fillStyle = '#EF4444'; for (let i = -1; i < 6; i++) { g.beginPath(); g.moveTo(rx + (rw / 5) * i, ry + rh); g.lineTo(rx + (rw / 5) * (i + 0.5), ry + rh); g.lineTo(rx + (rw / 5) * (i + 1), ry); g.lineTo(rx + (rw / 5) * (i + 0.5), ry); g.fill(); } g.restore();
          box(x - LW * 0.42, x - LW * 0.36, 0, 0.22, o.z, o.z + 0.1, '#475569', '#334155', '#334155'); box(x + LW * 0.36, x + LW * 0.42, 0, 0.22, o.z, o.z + 0.1, '#475569', '#334155', '#334155'); }
      } else if (o.t === 'high') {
        box(x - LW * 0.46, x - LW * 0.38, 0, 1.55, o.z, o.z + 0.12, '#334155', '#1E293B', '#1E293B'); box(x + LW * 0.38, x + LW * 0.46, 0, 1.55, o.z, o.z + 0.12, '#334155', '#1E293B', '#1E293B');
        const r = box(x - LW * 0.46, x + LW * 0.46, 1.05, 1.5, o.z, o.z + o.len, '#FACC15', '#EAB308', '#CA8A04');
        if (r) { const [rx, ry, rw, rh] = r; g.fillStyle = '#111827'; for (let i = 0; i < 5; i += 2) g.fillRect(rx + (rw / 5) * i, ry, rw / 5, rh); }
      } else if (o.z > 0.6) {
        const px = sx(x, o.z), py = sy(o.y, o.z), s = F / o.z;
        if (o.t === 'coin') { const k = Math.abs(Math.cos(tie * 3 + o.z)); g.fillStyle = '#F59E0B'; g.beginPath(); g.ellipse(px, py, Math.max(1, s * 0.17 * k), s * 0.17, 0, 0, 7); g.fill(); g.fillStyle = '#FDE047'; g.beginPath(); g.ellipse(px, py, Math.max(0.5, s * 0.11 * k), s * 0.11, 0, 0, 7); g.fill(); }
        else { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(px, py, s * 0.24, 0, 7); g.fill(); text(g, o.t === 'magnet' ? '🧲' : o.t === 'shield' ? '🛡️' : '✖️2', px, py + 1, s * (o.t === 'x2' ? 0.18 : 0.3)); }
      }
    }
    function drawPlayer() {
      const z = ZP, x = P.x * LW, gy = sy(0, z), s = F / z;
      const px = sx(x, z), py = sy(P.y, z);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(sx(x, z), gy, s * 0.26 * (1 - Math.min(0.5, P.y * 0.3)), s * 0.07, 0, 0, 7); g.fill();
      const sl = P.slide > 0, h = sl ? 0.62 : PH, k = P.run;
      g.save(); g.translate(px, py);
      if (dead) g.rotate(Math.min(1.3, deadT * 4));
      const u = s; // 1 birlik
      if (shield > 0) { g.strokeStyle = `rgba(56,189,248,${0.5 + 0.3 * Math.sin(tie * 10)})`; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -h * u * 0.5, u * 0.42, h * u * 0.62, 0, 0, 7); g.stroke(); }
      if (sl) {
        g.fillStyle = '#1D4ED8'; rr(g, -u * 0.26, -u * 0.36, u * 0.52, u * 0.3, u * 0.12); g.fill();
        g.fillStyle = '#FBBF24'; g.beginPath(); g.arc(u * 0.2, -u * 0.42, u * 0.13, 0, 7); g.fill();
        g.fillStyle = '#EF4444'; g.beginPath(); g.arc(u * 0.2, -u * 0.46, u * 0.13, Math.PI, 0); g.fill();
      } else {
        const sw = P.y > 0.05 ? 0.6 : Math.sin(k * 14);
        g.strokeStyle = '#1E3A8A'; g.lineCap = 'round'; g.lineWidth = u * 0.11;
        g.beginPath(); g.moveTo(-u * 0.07, -u * 0.5); g.lineTo(-u * 0.07 - sw * u * 0.1, -u * 0.06); g.moveTo(u * 0.07, -u * 0.5); g.lineTo(u * 0.07 + sw * u * 0.1, -u * 0.06); g.stroke();
        g.fillStyle = '#111827'; g.beginPath(); g.ellipse(-u * 0.07 - sw * u * 0.1, -u * 0.04, u * 0.08, u * 0.05, 0, 0, 7); g.ellipse(u * 0.07 + sw * u * 0.1, -u * 0.04, u * 0.08, u * 0.05, 0, 0, 7); g.fill();
        g.fillStyle = '#F97316'; rr(g, -u * 0.18, -u * 1.0, u * 0.36, u * 0.52, u * 0.1); g.fill();
        g.fillStyle = '#8B5CF6'; rr(g, -u * 0.15, -u * 0.95, u * 0.3, u * 0.32, u * 0.08); g.fill(); // ryukzak
        g.strokeStyle = '#FDBA74'; g.lineWidth = u * 0.08; g.beginPath(); g.moveTo(-u * 0.18, -u * 0.9); g.lineTo(-u * 0.27 + sw * u * 0.08, -u * 0.62); g.moveTo(u * 0.18, -u * 0.9); g.lineTo(u * 0.27 - sw * u * 0.08, -u * 0.62); g.stroke();
        g.fillStyle = '#FBBF24'; g.beginPath(); g.arc(0, -u * 1.13, u * 0.15, 0, 7); g.fill();
        g.fillStyle = '#EF4444'; g.beginPath(); g.arc(0, -u * 1.17, u * 0.155, Math.PI, 0); g.fill(); g.fillRect(-u * 0.02, -u * 1.2, u * 0.2, u * 0.05);
      }
      g.restore();
    }
    function hit(o) {
      if (shield > 0) { shield = 0; o.dead = true; shake = 0.3; snd(400, 0.2, 0.08, 'square'); return; }
      dead = true; deadT = 0; shake = 0.5; snd(110, 0.5, 0.1, 'sawtooth'); navigator.vibrate?.(120);
      const sc = Math.floor(dist) + coins * 10; ui.score(sc); setTimeout(() => ui.over(sc), 900);
    }
    const stop = loop((dt) => {
      W = c.W; H = c.H; F = H * 0.78; HZ = H * 0.27;
      tie += dt;
      if (started && !dead) {
        speed = Math.min(30, 11 + dist / 120); const dz = speed * dt; dist += dz * mult * 0.5;
        P.run += dt * (speed / 14);
        P.x += (P.lane - P.x) * Math.min(1, dt * 16);
        P.vy -= 24 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0) P.vy = 0;
        if (P.slide > 0) P.slide -= dt;
        magnet = Math.max(0, magnet - dt); if (mult > 1) { P.x2T -= dt; if (P.x2T <= 0) mult = 1; }
        for (const o of objs) o.z -= dz + (o.moving || 0) * dt;
        for (const b of side) b.z -= dz;
        spawnZ -= dz; if (spawnZ <= FAR - 20) { spawnRow(FAR); spawnZ = FAR + rnd(9, 14) - Math.min(4, dist / 600); }
        sideZ -= dz; if (sideZ <= 0) { addSide(FAR + 2); sideZ = 3.2; }
        // to'qnashuv
        const pl = Math.round(P.x), ph = P.slide > 0 ? 0.62 : PH;
        for (const o of objs) {
          if (o.dead) continue;
          if (o.t === 'coin' || o.t === 'magnet' || o.t === 'shield' || o.t === 'x2') {
            if (magnet > 0 && o.t === 'coin' && o.z < ZP + 9 && o.z > ZP - 1) { o.lane += (P.x - o.lane) * Math.min(1, dt * 10); o.y += (P.y + 0.6 - o.y) * Math.min(1, dt * 10); o.z -= (o.z - ZP) * Math.min(1, dt * 8); }
            if (Math.abs(o.z - ZP) < 0.6 && Math.abs(o.lane - P.x) < 0.5 && Math.abs(o.y - (P.y + 0.6)) < 0.9) {
              o.dead = true;
              if (o.t === 'coin') { coins++; ui.info('🪙 ' + coins); snd(1200 + (coins % 5) * 80, 0.05, 0.035); }
              else { if (o.t === 'magnet') magnet = 10; else if (o.t === 'shield') shield = 1; else { mult = 2; P.x2T = 12; } snd(880, 0.25, 0.06, 'triangle'); }
            }
            continue;
          }
          const z0 = o.z, z1 = o.z + (o.len || 0.3);
          if (Math.abs(o.lane - P.x) > 0.55) continue;
          if (ZP + 0.25 < z0 || ZP - 0.25 > z1) continue;
          if (o.t === 'low' && P.y > 0.55) continue;
          if (o.t === 'high' && ph < 1.0) continue;
          if (o.t === 'train' && Math.abs(o.lane - pl) > 0.5 && Math.abs(o.lane - P.x) > 0.35) continue;
          hit(o); break;
        }
        objs = objs.filter((o) => !o.dead && o.z + (o.len || 0) > 0.3);
        side = side.filter((b) => b.z + b.d > 0.6);
        ui.score(Math.floor(dist) + coins * 10);
      } else if (dead) deadT += dt;
      // ---- chizish ----
      g.save();
      if (shake > 0) { shake -= dt; g.translate(rnd(-6, 6) * shake * 2, rnd(-6, 6) * shake * 2); }
      const sky = g.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#38BDF8'); sky.addColorStop(1, '#BAE6FD'); g.fillStyle = sky; g.fillRect(-10, -10, W + 20, HZ + 12);
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const cx = ((i * 137 + tie * 6) % (W + 120)) - 60, cy = HZ * (0.25 + (i % 2) * 0.25); g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.arc(cx + 18, cy - 6, 20, 0, 7); g.arc(cx + 38, cy, 15, 0, 7); g.fill(); }
      g.fillStyle = '#93C5FD'; for (let i = 0; i < 14; i++) { const bw = W / 10, bh = HZ * (0.25 + ((i * 53) % 7) / 14); g.fillRect(i * bw * 0.8 - 10, HZ - bh, bw * 0.7, bh); }
      g.fillStyle = '#A3A3A3'; g.fillRect(-10, HZ, W + 20, H - HZ + 10);
      // yo'l (shag'al) va relslar
      const zn = 0.9, zf = FAR;
      quad([[sx(-LW * 1.5 - 0.2, zn), sy(0, zn)], [sx(LW * 1.5 + 0.2, zn), sy(0, zn)], [sx(LW * 1.5 + 0.2, zf), sy(0, zf)], [sx(-LW * 1.5 - 0.2, zf), sy(0, zf)]], '#78716C');
      quad([[sx(-40, zn), sy(0, zn)], [sx(-LW * 1.5 - 0.2, zn), sy(0, zn)], [sx(-LW * 1.5 - 0.2, zf), sy(0, zf)], [sx(-40, zf), sy(0, zf)]], '#65A30D');
      quad([[sx(LW * 1.5 + 0.2, zn), sy(0, zn)], [sx(40, zn), sy(0, zn)], [sx(40, zf), sy(0, zf)], [sx(LW * 1.5 + 0.2, zf), sy(0, zf)]], '#65A30D');
      const off = (dist * 2) % 1.6;
      g.fillStyle = '#57534E';
      for (let z = 1.6 - off + 0.9; z < 50; z += 1.6) for (const l of [-1, 0, 1]) quad([[sx(l * LW - LW * 0.4, z), sy(0, z)], [sx(l * LW + LW * 0.4, z), sy(0, z)], [sx(l * LW + LW * 0.4, z + 0.35), sy(0, z + 0.35)], [sx(l * LW - LW * 0.4, z + 0.35), sy(0, z + 0.35)]], '#57534E');
      g.strokeStyle = '#E7E5E4'; g.lineWidth = 2;
      for (const l of [-1, 0, 1]) for (const d of [-0.26, 0.26]) { g.beginPath(); g.moveTo(sx(l * LW + d * LW, zn), sy(0, zn)); g.lineTo(sx(l * LW + d * LW, zf), sy(0, zf)); g.stroke(); }
      // binolar (orqadan oldinga)
      const all = side.map((b) => ({ k: 'b', z: b.z, b })).concat(objs.map((o) => ({ k: 'o', z: o.z, o })));
      all.push({ k: 'p', z: ZP + 0.01 });
      all.sort((a, b) => b.z - a.z);
      for (const it of all) {
        if (it.k === 'p') { drawPlayer(); continue; }
        if (it.k === 'o') { drawObj(it.o); continue; }
        const b = it.b; const r = box(b.x0, b.x0 + b.w, 0, b.h, b.z, b.z + b.d, b.col, shade(b.col, -18), shade(b.col, -32));
        if (r && b.win && r[2] > 8) { g.fillStyle = 'rgba(255,255,255,.55)'; const cols = 2, rows = Math.max(1, Math.floor(b.h / 0.9)); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) g.fillRect(r[0] + r[2] * (0.15 + i * 0.45), r[1] + r[3] * (0.1 + j * (0.85 / rows)), r[2] * 0.25, r[3] * (0.45 / rows)); }
      }
      g.restore();
      // HUD
      let hy = 18; const badge = (s, tm) => { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 10, hy - 12, 84, 24, 12); g.fill(); text(g, s + ' ' + Math.ceil(tm), 52, hy + 1, 13); hy += 30; };
      if (magnet > 0) badge('🧲', magnet); if (mult > 1) badge('✖️2', P.x2T); if (shield > 0) { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 10, hy - 12, 40, 24, 12); g.fill(); text(g, '🛡️', 30, hy + 1, 14); }
      if (!started) {
        g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, W * 0.1, H * 0.36, W * 0.8, 96, 18); g.fill();
        text(g, tg('hint_run'), W / 2, H * 0.36 + 30, 16); text(g, '⬅️ ➡️ ⬆️ ⬇️', W / 2, H * 0.36 + 66, 22);
      }
    });
    function shade(hex, p) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, v + p)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // virtual joystik + tugmalar (sensorli ekran uchun)
  function padUI(stage, btns) {
    const el = document.createElement('div'); el.className = 'gm-pad';
    el.innerHTML = `<div class="gm-joy"><i></i></div><div class="gm-btns">${btns.map((b) => `<button data-b="${b.id}" class="${b.cls || ''}">${b.t}</button>`).join('')}</div>`;
    stage.appendChild(el);
    const st = { x: 0, y: 0, on: false, b: {}, tap: {} };
    const joy = el.querySelector('.gm-joy'), knob = joy.querySelector('i');
    let jid = null, c0 = null;
    joy.addEventListener('pointerdown', (e) => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); const r = joy.getBoundingClientRect(); c0 = [r.left + r.width / 2, r.top + r.height / 2]; mv(e); });
    const mv = (e) => { if (e.pointerId !== jid) return; let dx = e.clientX - c0[0], dy = e.clientY - c0[1]; const R = joy.offsetWidth * 0.38, m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; } st.x = dx / R; st.y = dy / R; st.on = true; knob.style.transform = `translate(${dx}px,${dy}px)`; };
    joy.addEventListener('pointermove', mv);
    const up = (e) => { if (e.pointerId !== jid) return; jid = null; st.x = st.y = 0; st.on = false; knob.style.transform = ''; };
    joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
    el.querySelectorAll('[data-b]').forEach((b) => {
      const id = b.dataset.b;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); st.b[id] = true; st.tap[id] = true; b.classList.add('on'); });
      const off = () => { st.b[id] = false; b.classList.remove('on'); };
      b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
    st.take = (id) => { const v = st.tap[id]; st.tap[id] = false; return v; };
    return st;
  }
  const keysDown = new Set();
  addEventListener('keydown', (e) => keysDown.add(e.key.toLowerCase()));
  addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keysDown.clear());

  // 12) Birga Strike — oddiy 3D otishma (CS uslubida, raycasting)
  IMPL.strike = (stage, ui) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const MAP = ['################', '#......#.......#', '#.##...#..###..#', '#.#.......#....#', '#.#..##...#.##.#', '#....#.........#', '###..#..####...#', '#.......#......#', '#..##...#..##..#', '#..#.......#...#', '#..#..###..#..##', '#......#.......#', '#.###..#..###..#', '#..............#', '#..##......##..#', '################'];
    const N = 16, wall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || MAP[y | 0][x | 0] === '#';
    const pad = padUI(stage, [{ id: 'fire', t: '🔫', cls: 'big' }, { id: 'reload', t: '🔄' }]);
    let P, en, wave, kills, ammo, reloadT, fireT, flash, hurt, dead, items, msg, msgT, look = null, lookX = 0;
    c.addEventListener('pointerdown', (e) => { look = e.pointerId; lookX = e.clientX; });
    c.addEventListener('pointermove', (e) => { if (look === e.pointerId) { P.a += (e.clientX - lookX) * 0.0065; lookX = e.clientX; } });
    const lu = (e) => { if (look === e.pointerId) look = null; }; c.addEventListener('pointerup', lu); c.addEventListener('pointercancel', lu);
    const freeCell = (far) => { for (let i = 0; i < 200; i++) { const x = 1 + ri(N - 2) + 0.5, y = 1 + ri(N - 2) + 0.5; if (!wall(x, y) && (!far || Math.hypot(x - P.x, y - P.y) > 6)) return [x, y]; } return [1.5, 1.5]; };
    const spawnWave = () => { wave++; const n = 2 + wave * 2; for (let i = 0; i < n; i++) { const [x, y] = freeCell(true); en.push({ x, y, hp: wave > 3 ? 3 : 2, cd: rnd(1, 2.5), hit: 0, st: 0, dead: 0, col: ['#B91C1C', '#1D4ED8', '#047857', '#7C2D12'][ri(4)] }); } msg = tg('wave') + ' ' + wave; msgT = 1.6; };
    const reset = () => { P = { x: 1.5, y: 13.5, a: 0, hp: 100 }; en = []; wave = 0; kills = 0; ammo = 30; reloadT = 0; fireT = 0; flash = 0; hurt = 0; dead = false; items = []; spawnWave(); ui.score(0); hud(); };
    const hud = () => ui.info(`❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo}`);
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 6); for (let i = 1; i < n; i++) if (wall(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false; return true; };
    function shoot() {
      if (reloadT > 0 || fireT > 0 || dead) return;
      if (ammo <= 0) { reloadT = 1.4; snd(300, 0.1, 0.04); return; }
      ammo--; fireT = 0.13; flash = 0.06; snd(140, 0.09, 0.09, 'square'); snd(90, 0.12, 0.06, 'sawtooth');
      let best = null, bd = 1e9;
      for (const e of en) {
        if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - P.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < Math.max(0.05, 0.32 / d) && d < bd && los(P.x, P.y, e.x, e.y)) { bd = d; best = e; }
      }
      if (best) { best.hp--; best.hit = 0.15; if (best.hp <= 0) { best.dead = 1; kills++; ui.score(kills * 100 + (wave - 1) * 250); snd(600, 0.15, 0.06); if (Math.random() < 0.35) items.push({ x: best.x, y: best.y, t: Math.random() < 0.5 ? 'med' : 'ammo' }); } }
      if (ammo === 0) reloadT = 1.4;
      hud();
    }
    reset();
    const ZB = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (!dead) {
        let mx = pad.x, my = pad.y;
        if (keysDown.has('w')) my = -1; if (keysDown.has('s')) my = 1; if (keysDown.has('a')) mx = -1; if (keysDown.has('d')) mx = 1;
        if (keysDown.has('arrowleft')) P.a -= dt * 2.4; if (keysDown.has('arrowright')) P.a += dt * 2.4;
        if (keysDown.has('arrowup')) my = -1; if (keysDown.has('arrowdown')) my = 1;
        const sp = 3 * dt, ca = Math.cos(P.a), sa = Math.sin(P.a);
        const vx = (-my * ca - mx * sa) * sp, vy = (-my * sa + mx * ca) * sp;
        if (!wall(P.x + vx + Math.sign(vx) * 0.2, P.y)) P.x += vx; if (!wall(P.x, P.y + vy + Math.sign(vy) * 0.2)) P.y += vy;
        if (pad.b.fire || keysDown.has(' ')) shoot();
        if (pad.take('reload') && ammo < 30 && reloadT <= 0) { reloadT = 1.4; hud(); }
        if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) { ammo = 30; hud(); } }
        fireT -= dt;
        for (const e of en) {
          if (e.dead) { e.dead += dt; continue; }
          e.hit = Math.max(0, e.hit - dt); e.st += dt;
          const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), see = d < 11 && los(e.x, e.y, P.x, P.y);
          if (see && d > 1.6) { const s = (1.1 + wave * 0.08) * dt; const nx = e.x + (dx / d) * s, ny = e.y + (dy / d) * s; if (!wall(nx, e.y)) e.x = nx; if (!wall(e.x, ny)) e.y = ny; }
          e.cd -= dt;
          if (see && e.cd <= 0) { e.cd = rnd(1.1, 2.2) / (1 + wave * 0.1); e.fl = 0.08; snd(200, 0.06, 0.03, 'square'); if (Math.random() < Math.max(0.25, 0.75 - d * 0.06)) { P.hp -= 6 + wave; hurt = 0.3; hud(); if (P.hp <= 0) { dead = true; snd(120, 0.6, 0.1, 'sawtooth'); setTimeout(() => ui.over(kills * 100 + (wave - 1) * 250), 900); } } }
          if (e.fl) e.fl = Math.max(0, e.fl - dt);
        }
        for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (Math.hypot(it.x - P.x, it.y - P.y) < 0.6) { if (it.t === 'med') P.hp = Math.min(100, P.hp + 35); else ammo = 30; items.splice(i, 1); snd(900, 0.12, 0.05); hud(); } }
        if (en.every((e) => e.dead)) { en = []; spawnWave(); }
      }
      // ---- render ----
      const hz = H / 2;
      let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#7DD3FC'); gr.addColorStop(1, '#E0F2FE'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
      gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#A8A29E'); gr.addColorStop(1, '#57534E'); g.fillStyle = gr; g.fillRect(0, hz, W, hz);
      const FOV = 1.05, cols = Math.ceil(W / 2), dirx = Math.cos(P.a), diry = Math.sin(P.a), plx = -diry * Math.tan(FOV / 2), ply = dirx * Math.tan(FOV / 2);
      for (let i = 0; i < cols; i++) {
        const cam = (2 * i) / cols - 1, rx = dirx + plx * cam, ry = diry + ply * cam;
        let mx = P.x | 0, my = P.y | 0; const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry);
        let sxs, sys, sdx, sdy, side = 0;
        if (rx < 0) { sxs = -1; sdx = (P.x - mx) * ddx; } else { sxs = 1; sdx = (mx + 1 - P.x) * ddx; }
        if (ry < 0) { sys = -1; sdy = (P.y - my) * ddy; } else { sys = 1; sdy = (my + 1 - P.y) * ddy; }
        for (let k = 0; k < 64; k++) { if (sdx < sdy) { sdx += ddx; mx += sxs; side = 0; } else { sdy += ddy; my += sys; side = 1; } if (wall(mx, my)) break; }
        const pd = side ? sdy - ddy : sdx - ddx; ZB[i] = pd;
        const lh = H / Math.max(0.05, pd), y0 = hz - lh / 2;
        let wx = side ? P.x + pd * rx : P.y + pd * ry; wx -= Math.floor(wx);
        const br = Math.max(0.25, 1 - pd / 14) * (side ? 0.78 : 1);
        const brick = ((wx * 4) | 0) % 2 === 0;
        g.fillStyle = `rgb(${(brick ? 196 : 184) * br | 0},${(brick ? 110 : 98) * br | 0},${(brick ? 76 : 66) * br | 0})`; g.fillRect(i * 2, y0, 2.2, lh);
        g.fillStyle = `rgba(0,0,0,${0.18 * br})`; for (let r = 1; r < 4; r++) g.fillRect(i * 2, y0 + (lh / 4) * r, 2.2, Math.max(1, lh / 80));
      }
      // spraytlar
      const spr = en.filter((e) => !e.dead || e.dead < 1.2).map((e) => ({ e, d: Math.hypot(e.x - P.x, e.y - P.y) })).concat(items.map((it) => ({ it, d: Math.hypot(it.x - P.x, it.y - P.y) })));
      spr.sort((a, b) => b.d - a.d);
      for (const s of spr) {
        const o = s.e || s.it, dx = o.x - P.x, dy = o.y - P.y;
        const inv = 1 / (plx * diry - dirx * ply), tx = inv * (diry * dx - dirx * dy), ty = inv * (-ply * dx + plx * dy);
        if (ty <= 0.2) continue;
        const scx = (W / 2) * (1 + tx / ty), sh = H / ty, col = Math.floor(scx / 2);
        if (col < 0 || col >= cols || ZB[col] < ty) continue;
        if (s.it) { text(g, s.it.t === 'med' ? '🩹' : '📦', scx, hz + sh * 0.35, sh * 0.25); continue; }
        const e = s.e, w = sh * 0.42, top = hz - sh * 0.38, fall = e.dead ? Math.min(1, e.dead * 2) : 0;
        g.save(); g.translate(scx, hz + sh * 0.5); g.rotate(fall * 1.4); g.translate(-scx, -(hz + sh * 0.5));
        g.globalAlpha = e.dead ? Math.max(0, 1 - e.dead) : 1;
        const bob = Math.sin(e.st * 8) * sh * 0.01;
        g.fillStyle = e.hit ? '#fff' : e.col; rr(g, scx - w / 2, top + sh * 0.22 + bob, w, sh * 0.42, w * 0.18); g.fill();
        g.fillStyle = '#1F2937'; g.fillRect(scx - w * 0.35, top + sh * 0.62 + bob, w * 0.28, sh * 0.25); g.fillRect(scx + w * 0.07, top + sh * 0.62 + bob, w * 0.28, sh * 0.25);
        g.fillStyle = e.hit ? '#fff' : '#FCD34D'; g.beginPath(); g.arc(scx, top + sh * 0.13 + bob, w * 0.26, 0, 7); g.fill();
        g.fillStyle = '#111827'; g.fillRect(scx - w * 0.28, top + sh * 0.06 + bob, w * 0.56, w * 0.12);
        g.fillStyle = '#374151'; g.fillRect(scx - w * 0.05, top + sh * 0.35 + bob, w * 0.62, w * 0.12);
        if (e.fl) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(scx + w * 0.6, top + sh * 0.36 + bob, w * 0.15, 0, 7); g.fill(); }
        g.restore(); g.globalAlpha = 1;
      }
      // qurol
      const bob = Math.sin(performance.now() / 120) * (Math.abs(pad.x) + Math.abs(pad.y) > 0.1 ? 4 : 0.8), kick = fireT > 0 ? 8 : 0;
      const gx = W * 0.62, gy = H - 10 + bob + kick;
      g.fillStyle = '#1F2937'; g.beginPath(); g.moveTo(gx - 30, gy); g.lineTo(gx - 8, gy - 120); g.lineTo(gx + 14, gy - 120); g.lineTo(gx + 40, gy); g.fill();
      g.fillStyle = '#4B5563'; g.fillRect(gx - 4, gy - 150, 14, 40); g.fillStyle = '#92400E'; g.beginPath(); g.moveTo(gx + 10, gy); g.lineTo(gx + 26, gy - 60); g.lineTo(gx + 50, gy - 50); g.lineTo(gx + 46, gy); g.fill();
      if (flash > 0) { flash -= dt; g.fillStyle = '#FDE047'; g.beginPath(); g.arc(gx + 3, gy - 158, 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(gx + 3, gy - 158, 8, 0, 7); g.fill(); }
      g.strokeStyle = '#22C55E'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 12, hz); g.lineTo(W / 2 - 4, hz); g.moveTo(W / 2 + 4, hz); g.lineTo(W / 2 + 12, hz); g.moveTo(W / 2, hz - 12); g.lineTo(W / 2, hz - 4); g.moveTo(W / 2, hz + 4); g.lineTo(W / 2, hz + 12); g.stroke();
      // mini xarita
      const ms = 5; g.globalAlpha = 0.75; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = MAP[y][x] === '#' ? '#1F2937' : '#E5E7EB'; g.fillRect(8 + x * ms, 8 + y * ms, ms, ms); }
      g.fillStyle = '#16A34A'; g.fillRect(8 + P.x * ms - 2, 8 + P.y * ms - 2, 4, 4); g.fillStyle = '#DC2626'; en.forEach((e) => !e.dead && g.fillRect(8 + e.x * ms - 1.5, 8 + e.y * ms - 1.5, 3, 3)); g.globalAlpha = 1;
      if (reloadT > 0) text(g, tg('reload') + '…', W / 2, hz + 40, 16, '#FDE047');
      if (hurt > 0) { hurt -= dt; g.fillStyle = `rgba(220,38,38,${hurt})`; g.fillRect(0, 0, W, H); }
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, hz - 60, 30, '#fff'); }
      if (kills === 0 && wave === 1 && !pad.on && msgT <= 0) text(g, tg('hint_strike'), W / 2, hz + 70, 14);
    });
    return { stop, restart: reset, resize: fit };
  };

  // 13) Birga Futbol — 4x4 futbol (PES uslubida, yuqoridan ko'rinish)
  IMPL.football = (stage, ui) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.62);
    const pad = padUI(stage, [{ id: 'shoot', t: '⚽', cls: 'big' }, { id: 'pass', t: '↗️' }]);
    const FW = 68, FH = 105, GW = 18, MATCH = 120;
    let pl, ball, sc, time, owner, ctrl, kick, msg, msgT, over, last = [0, -1];
    const form = [[0, 0.95], [-0.5, 0.75], [0.5, 0.75], [0, 0.6]];
    const mk = (team, i) => { const [fx, fy] = form[i]; const y = team ? 1 - fy : fy; return { team, i, gk: i === 0, hx: FW / 2 + fx * FW * 0.5, hy: y * FH, x: 0, y: 0, vx: 0, vy: 0, cd: 0, dir: team ? 1 : -1 }; };
    const kickoff = (to) => {
      pl.forEach((p) => { p.x = p.hx; p.y = p.hy + (p.team ? -6 : 6) * (p.i === 3 ? 1 : 0); p.vx = p.vy = 0; p.cd = 0; });
      ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0, z: 0, vz: 0 }; owner = null; kick = 0.8;
      const s = pl.find((p) => p.team === to && p.i === 3); s.x = FW / 2; s.y = FH / 2 + (to ? -1.5 : 1.5);
    };
    const reset = () => { pl = [0, 1, 2, 3].map((i) => mk(0, i)).concat([0, 1, 2, 3].map((i) => mk(1, i))); sc = [0, 0]; time = 0; over = false; msg = ''; msgT = 0; kickoff(0); ctrl = pl[3]; ui.score(0); info(); };
    const info = () => ui.info(`${tg('you')} ${sc[0]} : ${sc[1]} ${tg('bot')} · ${Math.min(90, Math.floor((time / MATCH) * 90))}'`);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const goalY = (team) => (team ? FH + 1 : -1); // 0-jamoa (siz) yuqoridagi darvozaga hujum qiladi
    function strike(p, tx, ty, power, lob) {
      const dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy) || 1;
      ball.vx = (dx / d) * power; ball.vy = (dy / d) * power; ball.vz = lob ? 9 : 2.5; owner = null; p.cd = 0.35; last = [p.team, pl.indexOf(p)];
      snd(240, 0.06, 0.07, 'triangle');
    }
    function shootAt(p, aimX) { const gy = goalY(p.team); const tx = FW / 2 + (aimX ?? rnd(-GW * 0.4, GW * 0.4)); strike(p, tx, gy, 46, false); }
    function passTo(p, mate) { strike(p, mate.x + mate.vx * 0.25, mate.y + mate.vy * 0.25, Math.min(40, 18 + dist(p, mate) * 0.9), dist(p, mate) > 30); }
    const bestMate = (p) => { let b = null, bs = -1e9; for (const m of pl) { if (m === p || m.team !== p.team || m.gk) continue; const fwd = (p.team ? m.y - p.y : p.y - m.y); const press = Math.min(...pl.filter((o) => o.team !== p.team).map((o) => dist(o, m))); const s = fwd * 0.6 + press * 1.2 - dist(p, m) * 0.2; if (s > bs) { bs = s; b = m; } } return b; };
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, k = W / (FW + 8), ox = 4 * k, oy = (H - FH * k) / 2;
      const X = (x) => ox + x * k, Y = (y) => oy + y * k;
      if (!over) {
        time += dt; if (time >= MATCH) { over = true; const win = sc[0] > sc[1]; msg = sc[0] === sc[1] ? tg('draw') : win ? tg('win') : tg('lose'); msgT = 9; const s = sc[0] * 100 + (win ? 300 : sc[0] === sc[1] ? 100 : 0); ui.score(s); setTimeout(() => ui.over(s), 1500); }
        if (Math.floor(time * 2) !== Math.floor((time - dt) * 2)) info();
        kick = Math.max(0, kick - dt);
        // boshqariladigan o'yinchi — to'pga eng yaqin (darvozabondan tashqari)
        if (!owner || owner.team !== 0) { const cand = pl.filter((p) => p.team === 0 && !p.gk).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; if (cand !== ctrl && dist(cand, ball) + 2 < dist(ctrl, ball)) ctrl = cand; }
        else if (owner.team === 0) ctrl = owner;
        let jx = pad.x, jy = pad.y; if (keysDown.has('arrowleft') || keysDown.has('a')) jx = -1; if (keysDown.has('arrowright') || keysDown.has('d')) jx = 1; if (keysDown.has('arrowup') || keysDown.has('w')) jy = -1; if (keysDown.has('arrowdown') || keysDown.has('s')) jy = 1;
        const shootB = pad.take('shoot') || keysDown.has(' '), passB = pad.take('pass') || keysDown.has('x');
        for (const p of pl) {
          p.cd = Math.max(0, p.cd - dt);
          let tx = p.hx, ty = p.hy, spd = 15;
          const ballSide = ball.y / FH;
          if (p === ctrl) { p.vx += (jx * 20 - p.vx) * Math.min(1, dt * 10); p.vy += (jy * 20 - p.vy) * Math.min(1, dt * 10); }
          else {
            if (p.gk) { tx = FW / 2 + Math.max(-GW / 2, Math.min(GW / 2, (ball.x - FW / 2) * 0.6)); ty = p.team ? 3 : FH - 3; spd = 13; if (dist(p, ball) < 14 && (p.team ? ball.y < 16 : ball.y > FH - 16)) { tx = ball.x; ty = ball.y; } }
            else {
              const att = owner ? owner.team === p.team : false;
              tx = p.hx + (ball.x - FW / 2) * 0.35; ty = p.hy + (ballSide - 0.5) * FH * 0.55 + (att ? (p.team ? 10 : -10) : 0);
              const chaser = pl.filter((q) => q.team === p.team && !q.gk && q !== (p.team === 0 ? ctrl : null)).sort((a, b) => dist(a, ball) - dist(b, ball))[0];
              if (p.team === 1 && chaser === p && owner !== p) { tx = ball.x; ty = ball.y; spd = 15.5 + Math.min(3, sc[0]); }
              if (p.team === 0 && chaser === p && owner && owner.team === 1 && dist(p, ball) < 18) { tx = ball.x; ty = ball.y; }
              if (owner === p && p.team === 1) { tx = FW / 2 + (p.x - FW / 2) * 0.6; ty = FH - 4; spd = 13; }
            }
            const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
            const vx = d > 0.6 ? (dx / d) * Math.min(spd, d * 4) : 0, vy = d > 0.6 ? (dy / d) * Math.min(spd, d * 4) : 0;
            p.vx += (vx - p.vx) * Math.min(1, dt * 6); p.vy += (vy - p.vy) * Math.min(1, dt * 6);
          }
          p.x = Math.max(1, Math.min(FW - 1, p.x + p.vx * dt)); p.y = Math.max(-1, Math.min(FH + 1, p.y + p.vy * dt));
          if (Math.hypot(p.vx, p.vy) > 2) p.dir = Math.atan2(p.vy, p.vx);
        }
        // to'qnashuv — o'yinchilar bir-biridan itariladi
        for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { const a = pl[i], b = pl[j], d = dist(a, b); if (d < 2.4 && d > 0) { const f = (2.4 - d) / 2; a.x -= ((b.x - a.x) / d) * f; a.y -= ((b.y - a.y) / d) * f; b.x += ((b.x - a.x) / d) * f; b.y += ((b.y - a.y) / d) * f; } }
        // to'p
        if (owner) {
          const a = typeof owner.dir === 'number' ? owner.dir : 0; ball.x = owner.x + Math.cos(a) * 1.6; ball.y = owner.y + Math.sin(a) * 1.6; ball.vx = owner.vx; ball.vy = owner.vy; ball.z = 0;
          if (owner.team === 0) {
            if (shootB) { const aim = jx * GW * 0.45; shootAt(owner, aim); }
            else if (passB) { const m = bestMate(owner); if (m) passTo(owner, m); }
          } else if (owner.team === 1 && owner.cd <= 0) {
            const dg = Math.hypot(owner.x - FW / 2, owner.y - FH);
            const press = Math.min(...pl.filter((o) => o.team === 0).map((o) => dist(o, owner)));
            if (dg < 30 && Math.random() < dt * 2.5) shootAt(owner);
            else if (press < 4 && Math.random() < dt * 3) { const m = bestMate(owner); if (m) passTo(owner, m); }
          }
          // to'p olib qo'yish
          for (const p of pl) if (p.team !== owner?.team && p.cd <= 0 && dist(p, ball) < 1.9 && Math.random() < dt * (p.team === 0 ? 6 : 3.2)) { owner.cd = 0.6; owner = p; p.cd = 0.3; snd(500, 0.04, 0.04); break; }
        } else {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vz -= 30 * dt; ball.z = Math.max(0, ball.z + ball.vz * dt); if (ball.z === 0) { ball.vz = Math.abs(ball.vz) > 4 ? -ball.vz * 0.4 : 0; }
          const fr = ball.z > 0 ? 0.995 : Math.pow(0.35, dt); ball.vx *= fr; ball.vy *= fr;
          if (ball.x < 0.5 || ball.x > FW - 0.5) { ball.vx = -ball.vx * 0.7; ball.x = Math.max(0.5, Math.min(FW - 0.5, ball.x)); }
          const inGoalX = Math.abs(ball.x - FW / 2) < GW / 2;
          if (ball.y < 0 || ball.y > FH) {
            if (inGoalX && ball.z < 3) { const t = ball.y < 0 ? 0 : 1; sc[t]++; msg = '⚽ GOOOL!'; msgT = 1.6; snd(1046, 0.4, 0.09); info(); ui.score(sc[0] * 100); kickoff(1 - t); }
            else { ball.vy = -ball.vy * 0.6; ball.y = Math.max(0.5, Math.min(FH - 0.5, ball.y)); }
          }
          if (kick <= 0 && ball.z < 1.6) for (const p of pl) {
            if (p.cd > 0) continue; const d = dist(p, ball), sp = Math.hypot(ball.vx, ball.vy);
            if (d < (p.gk ? 2.8 : 1.8) && (sp < 34 || p.gk && Math.random() < 0.65 || Math.random() < 0.3)) { owner = p; if (p.gk) { ball.vx = ball.vy = 0; p.cd = 0.5; } break; }
          }
        }
        if (owner?.gk && owner.cd <= 0.05) { const m = bestMate(owner); if (m) passTo(owner, m); }
      }
      // ---- chizish ----
      g.fillStyle = '#14532D'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#16A34A' : '#15803D'; g.fillRect(X(0), Y((FH / 10) * i), FW * k, (FH / 10) * k + 1); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2;
      g.strokeRect(X(0), Y(0), FW * k, FH * k); g.beginPath(); g.moveTo(X(0), Y(FH / 2)); g.lineTo(X(FW), Y(FH / 2)); g.stroke();
      g.beginPath(); g.arc(X(FW / 2), Y(FH / 2), 9 * k, 0, 7); g.stroke();
      for (const t of [0, 1]) { const y0 = t ? FH - 16 : 0; g.strokeRect(X(FW / 2 - 20), Y(y0), 40 * k, 16 * k); g.strokeRect(X(FW / 2 - 9), Y(t ? FH - 6 : 0), 18 * k, 6 * k); }
      for (const t of [0, 1]) { g.fillStyle = 'rgba(255,255,255,.9)'; const y = t ? Y(FH) : Y(0) - 3 * k; g.fillRect(X(FW / 2 - GW / 2), y, GW * k, 3 * k); g.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 9; i++) g.fillRect(X(FW / 2 - GW / 2 + i * 2), y, 1, 3 * k); }
      for (const p of pl) {
        const x = X(p.x), y = Y(p.y), r = 1.5 * k;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 2, y + 3, r, r * 0.6, 0, 0, 7); g.fill();
        if (p === ctrl) { g.strokeStyle = '#FDE047'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); g.fillStyle = '#FDE047'; g.beginPath(); g.moveTo(x, y - r - 12); g.lineTo(x - 5, y - r - 19); g.lineTo(x + 5, y - r - 19); g.fill(); }
        g.fillStyle = p.gk ? (p.team ? '#F59E0B' : '#22D3EE') : p.team ? '#DC2626' : '#2563EB'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x + Math.cos(p.dir) * r * 0.25, y + Math.sin(p.dir) * r * 0.25, r * 0.5, 0, 7); g.fill();
        g.fillStyle = '#fff'; text(g, String(p.gk ? 1 : p.i + 6 + (p.team ? 0 : 3)), x, y + r + 8, 9, '#fff');
      }
      const bx = X(ball.x), by = Y(ball.y) - ball.z * k * 0.6, br = 0.9 * k * (1 + ball.z * 0.05);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X(ball.x) + 1, Y(ball.y) + 2, br, br * 0.6, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(bx, by, br * 0.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, W / 2 - 70, 6, 140, 28, 14); g.fill();
      text(g, `🔵 ${sc[0]} : ${sc[1]} 🔴`, W / 2 - 20, 20, 15); text(g, `${Math.min(90, Math.floor((time / MATCH) * 90))}'`, W / 2 + 48, 20, 13, '#FDE047');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H / 2, 34, '#fff'); }
      if (time < 4 && !over) text(g, tg('hint_football'), W / 2, H * 0.62, 14);
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
    closeRoom(true); Page.cur = meta; Page.score = 0;
    $('#gm-title').textContent = `${meta.e} ${gname(meta)}`;
    $('#gm-best').textContent = Page.best[id] || 0; $('#gm-score').textContent = 0; $('#gm-info').textContent = ''; $('#gm-extra').innerHTML = '';
    $('#gm-page').style.setProperty('--g1', meta.c[0]); $('#gm-page').style.setProperty('--g2', meta.c[1]);
    $('#gm-page').classList.remove('hidden'); $('#gm-over').classList.add('hidden');
    run();
  }
  function run() {
    Page.inst?.stop?.(); const st = $('#gm-stage'); st.innerHTML = ''; st.className = 'gm-stage';
    $('#gm-extra').innerHTML = '';
    const ui = {
      score: (n) => { Page.score = n; $('#gm-score').textContent = n; },
      info: (s) => { $('#gm-info').textContent = s; },
      extra: (html, onClick) => { $('#gm-extra').innerHTML = html; const b = $('#gm-extra button'); if (b) b.onclick = () => { b.textContent = onClick(); }; },
      over: (n) => gameOver(n),
    };
    requestAnimationFrame(() => { Page.inst = IMPL[Page.cur.id](st, ui); });
  }
  function closeGame() { if (Room.cur || Room.inst) { closeRoom(true); } Page.inst?.stop?.(); Page.inst = null; $('#gm-page')?.classList.add('hidden'); renderLobby(); }
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

  /* ================= 2 KISHILIK O'YINLAR (do'stni taklif qilib) ================= */
  const MPL = [
    { id: 'chess', e: '♟️', c: ['#78350F', '#1C1917'], n: { uz: 'Shaxmat', ru: 'Шахматы', en: 'Chess' } },
    { id: 'checkers', e: '⚪', c: ['#B91C1C', '#7F1D1D'], n: { uz: 'Shashka', ru: 'Шашки', en: 'Checkers' } },
    { id: 'battleship', e: '🚢', c: ['#0369A1', '#1E3A8A'], n: { uz: 'Dengiz jangi', ru: 'Морской бой', en: 'Battleship' } },
    { id: 'connect4', e: '🔴', c: ['#2563EB', '#7C3AED'], n: { uz: '4 qator', ru: '4 в ряд', en: 'Connect Four' } },
    { id: 'gomoku', e: '⚫', c: ['#A16207', '#713F12'], n: { uz: '5 qator', ru: 'Гомоку', en: 'Gomoku' } },
  ];
  const MT = {
    uz: { mp: 'Do‘st bilan o‘ynash', mp_sub: 'Do‘stingizni taklif qiling — navbatma-navbat jonli o‘ynaysiz', solo: 'Yakka o‘yinlar', invite: 'Kimni taklif qilasiz?', active: 'Davom etayotgan o‘yinlar',
      wait: 'Raqib kutilmoqda…', wait_sub: 'Taklif chatga yuborildi. Do‘stingiz “O‘ynash” ni bossa — o‘yin boshlanadi.', your: 'Sizning navbatingiz', their: 'Raqib o‘ylamoqda…', resign: 'Taslim bo‘lish', resign_q: 'Taslim bo‘lasizmi?',
      you_won: 'Siz yutdingiz! 🎉', you_lost: 'Siz yutqazdingiz', draw: 'Durang', won_by: '{n} yutdi', play: 'O‘ynash', watch: 'Ko‘rish', open: 'Ochish', invited: 'O‘yinga taklif', status_wait: 'Raqib kutilmoqda', status_play: 'O‘yin davom etmoqda', status_over: 'O‘yin tugadi',
      shuffle: 'Aralashtirish', ready: 'Tayyorman', wait_ready: 'Raqib kemalarini joylamoqda…', place: 'Kemalaringizni joylang', enemy: 'Raqib dengizi', mine: 'Sizning flotingiz', check: 'Shoh!', wins: 'g‘alaba', confirm: 'Tasdiqlash uchun yana bosing', sent: 'Taklif yuborildi', not_avail: 'O‘yin topilmadi', spectate: 'Siz tomoshabinsiz', rematch: 'Qayta o‘ynash' },
    ru: { mp: 'Играть с другом', mp_sub: 'Пригласите друга — играйте по очереди в реальном времени', solo: 'Одиночные игры', invite: 'Кого пригласить?', active: 'Текущие партии',
      wait: 'Ожидание соперника…', wait_sub: 'Приглашение отправлено в чат. Когда друг нажмёт «Играть» — игра начнётся.', your: 'Ваш ход', their: 'Соперник думает…', resign: 'Сдаться', resign_q: 'Сдаться?',
      you_won: 'Вы победили! 🎉', you_lost: 'Вы проиграли', draw: 'Ничья', won_by: 'Победил(а) {n}', play: 'Играть', watch: 'Смотреть', open: 'Открыть', invited: 'Приглашение в игру', status_wait: 'Ожидание соперника', status_play: 'Идёт игра', status_over: 'Игра окончена',
      shuffle: 'Перемешать', ready: 'Готов', wait_ready: 'Соперник расставляет корабли…', place: 'Расставьте корабли', enemy: 'Поле соперника', mine: 'Ваш флот', check: 'Шах!', wins: 'побед', confirm: 'Нажмите ещё раз для подтверждения', sent: 'Приглашение отправлено', not_avail: 'Игра не найдена', spectate: 'Вы зритель', rematch: 'Реванш' },
    en: { mp: 'Play with a friend', mp_sub: 'Invite a friend — take turns live', solo: 'Solo games', invite: 'Who do you invite?', active: 'Ongoing games',
      wait: 'Waiting for opponent…', wait_sub: 'Invite sent to the chat. The game starts when your friend taps “Play”.', your: 'Your turn', their: 'Opponent is thinking…', resign: 'Resign', resign_q: 'Resign this game?',
      you_won: 'You won! 🎉', you_lost: 'You lost', draw: 'Draw', won_by: '{n} won', play: 'Play', watch: 'Watch', open: 'Open', invited: 'Game invite', status_wait: 'Waiting for opponent', status_play: 'Game in progress', status_over: 'Game over',
      shuffle: 'Shuffle', ready: 'Ready', wait_ready: 'Opponent is placing ships…', place: 'Place your ships', enemy: 'Enemy waters', mine: 'Your fleet', check: 'Check!', wins: 'wins', confirm: 'Tap again to confirm', sent: 'Invite sent', not_avail: 'Game not found', spectate: 'You are watching', rematch: 'Rematch' },
  };
  const mt = (k) => (MT[L()] || MT.uz)[k] || MT.uz[k];
  const MPI = {};
  const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

  // umumiy taxta chizish yordamchisi: kvadrat maydon + bosish → katak
  function boardCanvas(stage, n, ratio = 1) {
    const cv = canvasIn(stage, ratio);
    cv.cell = (e) => { const [x, y] = pos(cv.c, e); const s = Math.min(cv.c.W, cv.c.H) / n; const ox = (cv.c.W - s * n) / 2, oy = (cv.c.H - s * n) / 2; const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s); return cx < 0 || cy < 0 || cx >= n || cy >= n ? null : [cx, cy]; };
    return cv;
  }

  // ---- 4 qator (Connect Four) ----
  MPI.connect4 = (stage, ctx) => {
    const C = 7, R = 6; const cv = canvasIn(stage, C / (R + 1)); const { c, g } = cv;
    const b = Array(C * R).fill(-1); let turn = 0, done = false, lastI = -1, drop = null, winLine = null, hover = -1;
    const at = (x, y) => (x < 0 || y < 0 || x >= C || y >= R ? -2 : b[y * C + x]);
    function line(x, y) { const v = at(x, y); for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const L = [[x, y]]; for (const s of [1, -1]) { let k = 1; while (at(x + dx * k * s, y + dy * k * s) === v) { L.push([x + dx * k * s, y + dy * k * s]); k++; } } if (L.length >= 4) return L; } return null; }
    const geom = () => { const s = Math.min(c.W / C, c.H / (R + 1)); return { s, ox: (c.W - s * C) / 2, oy: (c.H - s * (R + 1)) / 2 + s }; };
    c.addEventListener('pointermove', (e) => { const { s, ox } = geom(); hover = Math.floor((pos(c, e)[0] - ox) / s); });
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const { s, ox } = geom(); const col = Math.floor((pos(c, e)[0] - ox) / s);
      if (col < 0 || col >= C || b[col] !== -1) return; ctx.send(col);
    });
    const api = {
      apply(sd, col, replay) {
        if (done || sd !== turn || b[col] !== -1) return false;
        let y = R - 1; while (b[y * C + col] !== -1) y--; b[y * C + col] = sd; lastI = y * C + col; if (!replay) { drop = { col, y, t: 0 }; snd(sd === ctx.me ? 520 : 420, 0.08, 0.05); }
        const w = line(col, y); turn = 1 - turn;
        if (w) { done = true; winLine = w; ctx.over(sd); } else if (b.every((v) => v !== -1)) { done = true; ctx.over(2); }
        ctx.turn(done ? -1 : turn); return true;
      },
    };
    const COL = ['#EF4444', '#FACC15'];
    const stop = loop((dt) => {
      const { s, ox, oy } = geom();
      g.clearRect(0, 0, c.W, c.H);
      if (!done && turn === ctx.me && hover >= 0 && hover < C) { g.globalAlpha = 0.6; g.fillStyle = COL[ctx.me]; g.beginPath(); g.arc(ox + hover * s + s / 2, oy - s / 2, s * 0.38, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = '#1D4ED8'; rr(g, ox - 6, oy - 6, s * C + 12, s * R + 12, 18); g.fill();
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const v = b[y * C + x]; let cy = oy + y * s + s / 2;
        if (drop && drop.col === x && drop.y === y) { drop.t = Math.min(1, drop.t + dt * 3); cy = oy - s / 2 + (cy - oy + s / 2) * drop.t * drop.t; if (drop.t >= 1) drop = null; }
        g.fillStyle = '#0B1220'; g.beginPath(); g.arc(ox + x * s + s / 2, oy + y * s + s / 2, s * 0.38, 0, 7); g.fill();
        if (v >= 0) { const gr = g.createRadialGradient(ox + x * s + s * 0.4, cy - s * 0.1, 2, ox + x * s + s / 2, cy, s * 0.4); gr.addColorStop(0, '#fff8'); gr.addColorStop(0.25, COL[v]); gr.addColorStop(1, v ? '#CA8A04' : '#B91C1C'); g.fillStyle = gr; g.beginPath(); g.arc(ox + x * s + s / 2, cy, s * 0.38, 0, 7); g.fill(); }
        if (y * C + x === lastI && !drop) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(ox + x * s + s / 2, cy, s * 0.16, 0, 7); g.stroke(); }
      }
      if (winLine) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; const a = winLine.reduce((m, p) => (p[0] + p[1] * 10 < m[0] + m[1] * 10 ? p : m)), z = winLine.reduce((m, p) => (p[0] + p[1] * 10 > m[0] + m[1] * 10 ? p : m)); g.beginPath(); g.moveTo(ox + a[0] * s + s / 2, oy + a[1] * s + s / 2); g.lineTo(ox + z[0] * s + s / 2, oy + z[1] * s + s / 2); g.stroke(); }
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit, mark: (sd) => COL[sd] };
  };

  // ---- 5 qator (Gomoku 15×15) ----
  MPI.gomoku = (stage, ctx) => {
    const N = 15; const cv = boardCanvas(stage, N); const { c, g } = cv;
    const b = Array(N * N).fill(-1); let turn = 0, done = false, lastI = -1, ghost = -1, winLine = null;
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -2 : b[y * N + x]);
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const p = cv.cell(e); if (!p) return; const i = p[1] * N + p[0]; if (b[i] !== -1) return;
      if (ghost === i) { ghost = -1; ctx.send(i); } else { ghost = i; ctx.hint(mt('confirm')); snd(700, 0.03, 0.03); }
    });
    const api = {
      apply(sd, i, replay) {
        if (done || sd !== turn || b[i] !== -1 || !(i >= 0 && i < N * N)) return false;
        b[i] = sd; lastI = i; ghost = -1; turn = 1 - turn; if (!replay) snd(sd ? 380 : 480, 0.06, 0.06, 'triangle');
        const x = i % N, y = (i / N) | 0;
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const L = [[x, y]]; for (const s of [1, -1]) { let k = 1; while (at(x + dx * k * s, y + dy * k * s) === sd) { L.push([x + dx * k * s, y + dy * k * s]); k++; } } if (L.length >= 5) { winLine = L; done = true; break; } }
        if (done) ctx.over(sd); else if (b.every((v) => v !== -1)) { done = true; ctx.over(2); }
        ctx.turn(done ? -1 : turn); return true;
      },
    };
    const stop = loop(() => {
      const s = Math.min(c.W, c.H) / N, ox = (c.W - s * N) / 2, oy = (c.H - s * N) / 2;
      g.clearRect(0, 0, c.W, c.H); g.fillStyle = '#E4B66B'; rr(g, ox - 4, oy - 4, s * N + 8, s * N + 8, 10); g.fill();
      g.strokeStyle = '#7C4A12'; g.lineWidth = 1;
      for (let i = 0; i < N; i++) { g.beginPath(); g.moveTo(ox + s / 2, oy + i * s + s / 2); g.lineTo(ox + s * N - s / 2, oy + i * s + s / 2); g.moveTo(ox + i * s + s / 2, oy + s / 2); g.lineTo(ox + i * s + s / 2, oy + s * N - s / 2); g.stroke(); }
      for (const [x, y] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) { g.fillStyle = '#7C4A12'; g.beginPath(); g.arc(ox + x * s + s / 2, oy + y * s + s / 2, 2.5, 0, 7); g.fill(); }
      const stone = (i, v, a = 1) => { const x = ox + (i % N) * s + s / 2, y = oy + ((i / N) | 0) * s + s / 2; g.globalAlpha = a; const gr = g.createRadialGradient(x - s * 0.12, y - s * 0.12, 1, x, y, s * 0.45); gr.addColorStop(0, v ? '#fff' : '#666'); gr.addColorStop(1, v ? '#D4D4D4' : '#0A0A0A'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 0.44, 0, 7); g.fill(); g.globalAlpha = 1; };
      b.forEach((v, i) => v >= 0 && stone(i, v));
      if (ghost >= 0) stone(ghost, ctx.me, 0.5);
      if (lastI >= 0) { g.fillStyle = '#EF4444'; g.beginPath(); g.arc(ox + (lastI % N) * s + s / 2, oy + ((lastI / N) | 0) * s + s / 2, s * 0.12, 0, 7); g.fill(); }
      if (winLine) winLine.forEach(([x, y]) => { g.strokeStyle = '#22C55E'; g.lineWidth = 3; g.beginPath(); g.arc(ox + x * s + s / 2, oy + y * s + s / 2, s * 0.46, 0, 7); g.stroke(); });
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit };
  };

  // ---- Shaxmat (to'liq qoidalar: rokirovka, en passant, o'zgarish, mat/pat) ----
  MPI.chess = (stage, ctx) => {
    const cv = boardCanvas(stage, 8); const { c, g } = cv;
    const flip = ctx.me === 1;
    let B = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
    B = B.split('');
    const S = { turn: 'w', cr: { K: 1, Q: 1, k: 1, q: 1 }, ep: -1, half: 0 };
    let sel = -1, targets = [], last = null, done = false, anim = null, hist = {};
    const col = (p) => (p === '.' ? null : p === p.toUpperCase() ? 'w' : 'b');
    const on = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
    function attacked(b, sq, by) { // sq katakni 'by' rangi uradimi
      const r = sq >> 3, f = sq & 7;
      const P = by === 'w' ? 'P' : 'p', N = by === 'w' ? 'N' : 'n', Bp = by === 'w' ? 'B' : 'b', R = by === 'w' ? 'R' : 'r', Q = by === 'w' ? 'Q' : 'q', K = by === 'w' ? 'K' : 'k';
      const pr = by === 'w' ? r + 1 : r - 1; for (const df of [-1, 1]) if (on(pr, f + df) && b[pr * 8 + f + df] === P) return true;
      for (const [dr, df] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === N) return true;
      for (const [dr, df] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === K) return true;
        let rr2 = r + dr, ff = f + df; const diag = dr && df;
        while (on(rr2, ff)) { const q = b[rr2 * 8 + ff]; if (q !== '.') { if (q === Q || q === (diag ? Bp : R)) return true; break; } rr2 += dr; ff += df; }
      }
      return false;
    }
    function pseudo(b, s, side) {
      const out = [];
      for (let i = 0; i < 64; i++) {
        const p = b[i]; if (col(p) !== side) continue; const r = i >> 3, f = i & 7, t = p.toLowerCase();
        const add = (j) => { const q = b[j]; if (col(q) !== side) out.push([i, j]); };
        if (t === 'p') {
          const d = side === 'w' ? -1 : 1, start = side === 'w' ? 6 : 1;
          if (on(r + d, f) && b[(r + d) * 8 + f] === '.') { out.push([i, (r + d) * 8 + f]); if (r === start && b[(r + 2 * d) * 8 + f] === '.') out.push([i, (r + 2 * d) * 8 + f]); }
          for (const df of [-1, 1]) if (on(r + d, f + df)) { const j = (r + d) * 8 + f + df; if ((b[j] !== '.' && col(b[j]) !== side) || j === s.ep) out.push([i, j]); }
        } else if (t === 'n') { for (const [dr, df] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (on(r + dr, f + df)) add((r + dr) * 8 + f + df); }
        else if (t === 'k') {
          for (const [dr, df] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (on(r + dr, f + df)) add((r + dr) * 8 + f + df);
          const opp = side === 'w' ? 'b' : 'w', home = side === 'w' ? 60 : 4, kk = side === 'w' ? 'K' : 'k', qq = side === 'w' ? 'Q' : 'q';
          if (i === home && !attacked(b, home, opp)) {
            if (s.cr[kk] && b[home + 1] === '.' && b[home + 2] === '.' && b[home + 3] === (side === 'w' ? 'R' : 'r') && !attacked(b, home + 1, opp) && !attacked(b, home + 2, opp)) out.push([i, home + 2]);
            if (s.cr[qq] && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && b[home - 4] === (side === 'w' ? 'R' : 'r') && !attacked(b, home - 1, opp) && !attacked(b, home - 2, opp)) out.push([i, home - 2]);
          }
        } else {
          const dirs = t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dr, df] of dirs) { let rr2 = r + dr, ff = f + df; while (on(rr2, ff)) { const j = rr2 * 8 + ff; if (b[j] === '.') out.push([i, j]); else { if (col(b[j]) !== side) out.push([i, j]); break; } rr2 += dr; ff += df; } }
        }
      }
      return out;
    }
    function make(b, s, [a, z, pr]) {
      const nb = b.slice(), ns = { turn: s.turn === 'w' ? 'b' : 'w', cr: { ...s.cr }, ep: -1, half: s.half + 1 };
      const p = nb[a], t = p.toLowerCase(); let cap = nb[z] !== '.';
      if (t === 'p' && z === s.ep) { nb[z + (col(p) === 'w' ? 8 : -8)] = '.'; cap = true; }
      nb[z] = p; nb[a] = '.';
      if (t === 'p') { ns.half = 0; if (Math.abs(z - a) === 16) ns.ep = (a + z) / 2; if (z < 8 || z >= 56) nb[z] = col(p) === 'w' ? (pr || 'Q').toUpperCase() : (pr || 'q').toLowerCase(); }
      if (cap) ns.half = 0;
      if (t === 'k') { if (z - a === 2) { nb[a + 1] = nb[a + 3]; nb[a + 3] = '.'; } if (a - z === 2) { nb[a - 1] = nb[a - 4]; nb[a - 4] = '.'; } if (col(p) === 'w') ns.cr.K = ns.cr.Q = 0; else ns.cr.k = ns.cr.q = 0; }
      for (const [sq, k] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']]) if (a === sq || z === sq) ns.cr[k] = 0;
      return [nb, ns, cap];
    }
    const kingSq = (b, side) => b.indexOf(side === 'w' ? 'K' : 'k');
    const legal = (b, s) => pseudo(b, s, s.turn).filter((m) => { const [nb] = make(b, s, m); return !attacked(nb, kingSq(nb, s.turn), s.turn === 'w' ? 'b' : 'w'); });
    let moves = legal(B, S);
    const inCheck = () => attacked(B, kingSq(B, S.turn), S.turn === 'w' ? 'b' : 'w');
    const mySide = ctx.me === 0 ? 'w' : 'b';
    const toSq = ([x, y]) => (flip ? (7 - y) * 8 + (7 - x) : y * 8 + x);
    c.addEventListener('pointerdown', (e) => {
      if (done || S.turn !== mySide || ctx.me < 0) return; const p = cv.cell(e); if (!p) return; const sq = toSq(p);
      if (sel >= 0 && targets.includes(sq)) { const m = [sel, sq]; const pc = B[sel].toLowerCase(); if (pc === 'p' && (sq < 8 || sq >= 56)) m.push('q'); sel = -1; targets = []; ctx.send(m); return; }
      if (col(B[sq]) === mySide) { sel = sq; targets = moves.filter((m) => m[0] === sq).map((m) => m[1]); snd(660, 0.03, 0.03); } else { sel = -1; targets = []; }
    });
    const api = {
      apply(sd, m, replay) {
        if (done || !Array.isArray(m) || (sd === 0 ? 'w' : 'b') !== S.turn) return false;
        const ok = moves.find((x) => x[0] === m[0] && x[1] === m[1]); if (!ok) return false;
        const pr = typeof m[2] === 'string' && 'qrbn'.includes(m[2]) ? m[2] : undefined;
        const [nb, ns, cap] = make(B, S, [m[0], m[1], pr]);
        if (!replay) { anim = { a: m[0], z: m[1], p: B[m[0]], t: 0 }; snd(cap ? 300 : 520, 0.07, 0.07, 'triangle'); }
        B = nb; Object.assign(S, ns); last = [m[0], m[1]]; sel = -1; targets = []; moves = legal(B, S);
        const key = B.join('') + S.turn; hist[key] = (hist[key] || 0) + 1;
        const ck = inCheck();
        if (!moves.length) { done = true; ctx.over(ck ? sd : 2); }
        else if (S.half >= 100 || hist[key] >= 3 || B.filter((x) => x !== '.').every((x) => 'Kk'.includes(x)) || (B.filter((x) => x !== '.').length === 3 && B.some((x) => 'NnBb'.includes(x)))) { done = true; ctx.over(2); }
        else if (ck && !replay) { ctx.hint(mt('check')); snd(880, 0.15, 0.06); }
        ctx.turn(done ? -1 : S.turn === 'w' ? 0 : 1); return true;
      },
    };
    const GL = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    const stop = loop((dt) => {
      const s = Math.min(c.W, c.H) / 8, ox = (c.W - s * 8) / 2, oy = (c.H - s * 8) / 2;
      const xy = (sq) => { let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } return [ox + x * s, oy + y * s]; };
      g.clearRect(0, 0, c.W, c.H);
      for (let sq = 0; sq < 64; sq++) { const [x, y] = xy(sq); g.fillStyle = ((sq >> 3) + (sq & 7)) % 2 ? '#B58863' : '#F0D9B5'; g.fillRect(x, y, s + 0.5, s + 0.5); }
      if (last) last.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(250,204,21,.45)'; g.fillRect(x, y, s, s); });
      if (sel >= 0) { const [x, y] = xy(sel); g.fillStyle = 'rgba(34,197,94,.5)'; g.fillRect(x, y, s, s); }
      if (inCheck() || done) { const k = kingSq(B, S.turn); if (inCheck()) { const [x, y] = xy(k); const gr = g.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.7); gr.addColorStop(0, 'rgba(239,68,68,.95)'); gr.addColorStop(1, 'rgba(239,68,68,0)'); g.fillStyle = gr; g.fillRect(x, y, s, s); } }
      g.font = `600 ${Math.max(9, s * 0.2)}px ${FONT}`; g.textBaseline = 'alphabetic';
      for (let i = 0; i < 8; i++) { const [x, y] = xy(flip ? 7 - i + 56 : 56 + i); g.fillStyle = i % 2 === (flip ? 1 : 0) ? '#B58863' : '#F0D9B5'; g.textAlign = 'right'; g.fillText('abcdefgh'[flip ? 7 - i : i], x + s - 3, y + s - 3); }
      const piece = (p, x, y) => { const w = col(p) === 'w'; g.font = `${s * 0.82}px "Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; const gl = GL[p.toLowerCase()] + '︎'; g.lineWidth = Math.max(1.5, s * 0.05); g.strokeStyle = w ? '#1F2937' : '#F8FAFC'; g.strokeText(gl, x + s / 2, y + s * 0.54); g.fillStyle = w ? '#FFFFFF' : '#111827'; g.fillText(gl, x + s / 2, y + s * 0.54); };
      for (let sq = 0; sq < 64; sq++) { if (B[sq] === '.' || (anim && sq === anim.z)) continue; const [x, y] = xy(sq); piece(B[sq], x, y); }
      if (anim) { anim.t = Math.min(1, anim.t + dt * 5); const [x0, y0] = xy(anim.a), [x1, y1] = xy(anim.z); const k = 1 - Math.pow(1 - anim.t, 3); piece(B[anim.z], x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); if (anim.t >= 1) anim = null; }
      for (const t2 of targets) { const [x, y] = xy(t2); g.fillStyle = 'rgba(21,128,61,.55)'; g.beginPath(); if (B[t2] !== '.') { g.lineWidth = s * 0.08; g.strokeStyle = 'rgba(21,128,61,.7)'; g.arc(x + s / 2, y + s / 2, s * 0.44, 0, 7); g.stroke(); } else { g.arc(x + s / 2, y + s / 2, s * 0.15, 0, 7); g.fill(); } }
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit };
  };

  // ---- Shashka (rus qoidalari: majburiy urish, ketma-ket urish, uchar damka) ----
  MPI.checkers = (stage, ctx) => {
    const cv = boardCanvas(stage, 8); const { c, g } = cv; const flip = ctx.me === 1;
    // 0-o'yinchi (oq) pastda: 5-7 qatorlar; 1-o'yinchi (qora) tepada: 0-2 qatorlar
    const b = Array(64).fill(null);
    for (let i = 0; i < 64; i++) { const r = i >> 3, f = i & 7; if ((r + f) % 2 === 1) { if (r < 3) b[i] = { s: 1, k: 0 }; else if (r > 4) b[i] = { s: 0, k: 0 }; } }
    let turn = 0, done = false, sel = -1, path = [], last = null, quiet = 0;
    const on = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
    const DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    function caps(from, sd, king) {
      const res = []; const orig = b[from]; b[from] = null;
      const dfs = (sq, k, taken, pth) => {
        const r = sq >> 3, f = sq & 7; let found = false;
        for (const [dr, df] of DIRS) {
          if (k) {
            let rr2 = r + dr, ff = f + df; while (on(rr2, ff) && !b[rr2 * 8 + ff]) { rr2 += dr; ff += df; }
            if (!on(rr2, ff)) continue; const mid = rr2 * 8 + ff; const q = b[mid];
            if (!q || q.s === sd || taken.includes(mid)) continue;
            let lr = rr2 + dr, lf = ff + df; const lands = [];
            while (on(lr, lf) && !b[lr * 8 + lf]) { lands.push(lr * 8 + lf); lr += dr; lf += df; }
            for (const L of lands) { found = true; dfs(L, true, taken.concat(mid), pth.concat(L)); }
          } else {
            const mr = r + dr, mf = f + df, lr = r + 2 * dr, lf = f + 2 * df; if (!on(lr, lf)) continue;
            const mid = mr * 8 + mf, L = lr * 8 + lf, q = b[mid];
            if (!q || q.s === sd || taken.includes(mid) || b[L]) continue;
            found = true; const promo = (sd === 0 && lr === 0) || (sd === 1 && lr === 7); dfs(L, promo, taken.concat(mid), pth.concat(L));
          }
        }
        if (!found && pth.length > 1) res.push({ p: pth, t: taken });
      };
      dfs(from, king, [], [from]); b[from] = orig; return res;
    }
    function allMoves(sd) {
      let cp = [], st = [];
      for (let i = 0; i < 64; i++) { const q = b[i]; if (!q || q.s !== sd) continue; cp = cp.concat(caps(i, sd, q.k)); }
      if (cp.length) return cp;
      for (let i = 0; i < 64; i++) {
        const q = b[i]; if (!q || q.s !== sd) continue; const r = i >> 3, f = i & 7;
        for (const [dr, df] of DIRS) {
          if (!q.k && dr !== (sd === 0 ? -1 : 1)) continue;
          let rr2 = r + dr, ff = f + df;
          while (on(rr2, ff) && !b[rr2 * 8 + ff]) { st.push({ p: [i, rr2 * 8 + ff], t: [] }); if (!q.k) break; rr2 += dr; ff += df; }
        }
      }
      return st;
    }
    let moves = allMoves(0);
    const toSq = ([x, y]) => (flip ? (7 - y) * 8 + (7 - x) : y * 8 + x);
    const same = (a, z) => a.length === z.length && a.every((v, i) => v === z[i]);
    const prefix = (pth) => moves.filter((m) => pth.every((v, i) => m.p[i] === v));
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const p = cv.cell(e); if (!p) return; const sq = toSq(p);
      if (path.length) {
        const cand = prefix(path.concat(sq));
        if (cand.length) { path.push(sq); const full = cand.find((m) => same(m.p, path)); if (full) { const pth = path; path = []; sel = -1; ctx.send(pth); } else snd(660, 0.03, 0.03); return; }
      }
      if (b[sq]?.s === ctx.me && moves.some((m) => m.p[0] === sq)) { sel = sq; path = [sq]; snd(600, 0.03, 0.03); } else { sel = -1; path = []; }
    });
    const api = {
      apply(sd, pth, replay) {
        if (done || sd !== turn || !Array.isArray(pth)) return false;
        const m = moves.find((x) => same(x.p, pth)); if (!m) return false;
        const pc = b[m.p[0]]; b[m.p[0]] = null; m.t.forEach((i) => (b[i] = null));
        const z = m.p[m.p.length - 1]; b[z] = pc;
        if (!pc.k) { for (const sq of m.p) { const r = sq >> 3; if ((sd === 0 && r === 0) || (sd === 1 && r === 7)) pc.k = 1; } }
        last = m.p; if (!replay) snd(m.t.length ? 320 : 520, 0.07, 0.06, 'triangle');
        quiet = m.t.length || !pc.k ? 0 : quiet + 1;
        turn = 1 - turn; moves = allMoves(turn); path = []; sel = -1;
        if (!moves.length) { done = true; ctx.over(sd); } else if (quiet >= 30) { done = true; ctx.over(2); }
        ctx.turn(done ? -1 : turn); return true;
      },
    };
    const stop = loop(() => {
      const s = Math.min(c.W, c.H) / 8, ox = (c.W - s * 8) / 2, oy = (c.H - s * 8) / 2;
      const xy = (sq) => { let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } return [ox + x * s, oy + y * s]; };
      g.clearRect(0, 0, c.W, c.H);
      for (let sq = 0; sq < 64; sq++) { const [x, y] = xy(sq); g.fillStyle = ((sq >> 3) + (sq & 7)) % 2 ? '#7C4A1E' : '#F3DFC1'; g.fillRect(x, y, s + 0.5, s + 0.5); }
      if (last) last.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(250,204,21,.35)'; g.fillRect(x, y, s, s); });
      if (!done && turn === ctx.me && !path.length) { const must = new Set(moves.map((m) => m.p[0])); if (moves[0]?.t.length) must.forEach((sq) => { const [x, y] = xy(sq); g.strokeStyle = '#F97316'; g.lineWidth = 3; g.strokeRect(x + 2, y + 2, s - 4, s - 4); }); }
      path.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(34,197,94,.45)'; g.fillRect(x, y, s, s); });
      if (path.length) { const nx = new Set(prefix(path).map((m) => m.p[path.length]).filter((v) => v !== undefined)); nx.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(34,197,94,.75)'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.16, 0, 7); g.fill(); }); }
      for (let sq = 0; sq < 64; sq++) {
        const q = b[sq]; if (!q) continue; const [x, y] = xy(sq), cx = x + s / 2, cy = y + s / 2;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx + 1.5, cy + 3, s * 0.38, 0, 7); g.fill();
        const gr = g.createRadialGradient(cx - s * 0.1, cy - s * 0.12, 2, cx, cy, s * 0.4); gr.addColorStop(0, q.s ? '#57534E' : '#FFFFFF'); gr.addColorStop(1, q.s ? '#0C0A09' : '#D6D3D1'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, s * 0.38, 0, 7); g.fill();
        g.strokeStyle = q.s ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, s * 0.26, 0, 7); g.stroke();
        if (q.k) text(g, '♛︎', cx, cy + 1, s * 0.36, q.s ? '#FACC15' : '#B45309');
      }
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit };
  };

  // ---- Dengiz jangi (10×10; kemalar: 4,3,3,2,2,2,1,1,1,1; bir-biriga tegmaydi) ----
  MPI.battleship = (stage, ctx) => {
    const N = 10, FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    const cv = canvasIn(stage, 0.68); const { c, g } = cv;
    function randomFleet() {
      for (let tries = 0; tries < 500; tries++) {
        const occ = Array(N * N).fill(0), ships = []; let ok = true;
        for (const L of FLEET) {
          let placed = false;
          for (let k = 0; k < 200 && !placed; k++) {
            const h = Math.random() < 0.5, x = ri(h ? N - L + 1 : N), y = ri(h ? N : N - L + 1); const cells = [];
            for (let i = 0; i < L; i++) cells.push((y + (h ? 0 : i)) * N + x + (h ? i : 0));
            if (cells.every((ci) => { const cx = ci % N, cy = (ci / N) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && occ[ny * N + nx]) return false; } return true; })) { cells.forEach((ci) => (occ[ci] = 1)); ships.push(cells); placed = true; }
          }
          if (!placed) { ok = false; break; }
        }
        if (ok) return ships;
      }
      return null;
    }
    let fleet = Array.isArray(ctx.secret) ? ctx.secret : null;
    const ready = [false, false]; let turn = 0, done = false, pending = null; // pending: {s, c}
    const shots = [Array(N * N).fill(0), Array(N * N).fill(0)]; // shots[target seat] : 0 yo'q, 1 o'tmadi, 2 tegdi, 3 cho'kdi
    const sunkShips = [[], []];
    const spect = ctx.me < 0;
    if (!fleet && !spect) fleet = randomFleet();
    const panel = document.createElement('div'); panel.className = 'gm-bsbar'; stage.appendChild(panel);
    const paintPanel = () => {
      if (spect || ready[ctx.me] || done) { panel.innerHTML = ''; return; }
      panel.innerHTML = `<button class="gm-ghost" data-a="sh">🔀 ${esc(mt('shuffle'))}</button><button class="gm-solid" data-a="ok">✅ ${esc(mt('ready'))}</button>`;
    };
    panel.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'sh') { fleet = randomFleet(); snd(500, 0.04, 0.03); } if (a === 'ok') { ctx.secretSave(fleet).then(() => ctx.send({ t: 'r' })).catch(() => toast(t('net_err'))); panel.innerHTML = ''; } };
    paintPanel();
    const myCellShip = (ci) => fleet?.find((sh) => sh.includes(ci));
    function answer(ci) {
      const sh = myCellShip(ci); if (!sh) return { t: 'a', c: ci, r: 1 };
      const hitsAfter = sh.every((x) => x === ci || shots[ctx.me][x] >= 2);
      if (!hitsAfter) return { t: 'a', c: ci, r: 2 };
      const allSunk = fleet.every((s2) => s2 === sh || s2.every((x) => shots[ctx.me][x] >= 2));
      return { t: 'a', c: ci, r: 3, cells: sh, end: allSunk ? 1 : 0 };
    }
    let geo = null;
    const layout = () => { const W = c.W, H = c.H; const big = Math.min(W - 16, H * 0.58), small = Math.min(W * 0.62, H - big - 54); return { big, small, bx: (W - big) / 2, by: 22, sx: (W - small) / 2, sy: 22 + big + 30 }; };
    c.addEventListener('pointerdown', (e) => {
      if (done || spect || !ready[0] || !ready[1] || turn !== ctx.me || pending) return;
      const [x, y] = pos(c, e); const L = layout(); const s = L.big / N; const cx = Math.floor((x - L.bx) / s), cy = Math.floor((y - L.by) / s);
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) return; const ci = cy * N + cx; if (shots[1 - ctx.me][ci]) return;
      ctx.send({ t: 'f', c: ci }); snd(300, 0.1, 0.05, 'sawtooth');
    });
    const fx = [];
    const api = {
      apply(sd, m, replay) {
        if (done || !m || typeof m !== 'object') return false;
        if (m.t === 'r') { if (ready[sd]) return false; ready[sd] = true; paintPanel(); upd(); return true; }
        if (m.t === 'f') { if (!ready[0] || !ready[1] || sd !== turn || pending || !(m.c >= 0 && m.c < N * N) || shots[1 - sd][m.c]) return false; pending = { s: sd, c: m.c }; if (sd !== ctx.me && !replay && !spect) setTimeout(() => api.respond(), 350); upd(); return true; }
        if (m.t === 'a') {
          if (!pending || sd === pending.s || m.c !== pending.c) return false;
          const tgt = sd; const r = [1, 2, 3].includes(m.r) ? m.r : 1; shots[tgt][m.c] = r === 1 ? 1 : 2;
          if (r === 3 && Array.isArray(m.cells)) { m.cells.forEach((ci) => (shots[tgt][ci] = 3)); sunkShips[tgt].push(m.cells); m.cells.forEach((ci) => { const cx = ci % N, cy = (ci / N) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && !shots[tgt][ny * N + nx]) shots[tgt][ny * N + nx] = 1; } }); }
          if (!replay) { fx.push({ tgt, c: m.c, r, t: 0.6 }); snd(r === 1 ? 200 : 120, r === 1 ? 0.12 : 0.35, 0.08, r === 1 ? 'sine' : 'sawtooth'); if (r > 1) navigator.vibrate?.(r === 3 ? 90 : 30); }
          if (r === 1) turn = 1 - turn;
          pending = null;
          if (m.end) { done = true; ctx.over(1 - tgt); }
          upd(); return true;
        }
        return false;
      },
      respond() { if (pending && pending.s !== ctx.me && !done && fleet) ctx.send(answer(pending.c)); },
      ready() { if (pending && pending.s !== ctx.me) api.respond(); paintPanel(); upd(); },
    };
    function upd() { if (!ready[0] || !ready[1]) ctx.turn(-1, !spect && !ready[ctx.me] ? mt('place') : mt('wait_ready')); else ctx.turn(done ? -1 : turn); }
    const grid = (x0, y0, size, seat, mine) => {
      const s = size / N; g.fillStyle = '#0C4A6E'; rr(g, x0 - 3, y0 - 3, size + 6, size + 6, 8); g.fill();
      for (let i = 0; i < N * N; i++) {
        const x = x0 + (i % N) * s, y = y0 + ((i / N) | 0) * s; const st = shots[seat][i];
        g.fillStyle = (i + ((i / N) | 0)) % 2 ? '#0EA5E9' : '#38BDF8'; g.fillRect(x + 0.5, y + 0.5, s - 1, s - 1);
        if (mine && fleet && myCellShip(i)) { g.fillStyle = st >= 2 ? '#7F1D1D' : '#334155'; rr(g, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.2); g.fill(); }
        if (st === 3 && !mine) { g.fillStyle = '#450A0A'; rr(g, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.2); g.fill(); }
        if (st === 1) { g.fillStyle = '#E0F2FE'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.12, 0, 7); g.fill(); }
        if (st >= 2) { g.strokeStyle = '#F87171'; g.lineWidth = Math.max(2, s * 0.12); g.beginPath(); g.moveTo(x + s * 0.25, y + s * 0.25); g.lineTo(x + s * 0.75, y + s * 0.75); g.moveTo(x + s * 0.75, y + s * 0.25); g.lineTo(x + s * 0.25, y + s * 0.75); g.stroke(); }
        if (pending && pending.c === i && pending.s !== seat) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, s - 4, s - 4); }
      }
      for (const f of fx) if (f.tgt === seat) { const x = x0 + (f.c % N) * s + s / 2, y = y0 + ((f.c / N) | 0) * s + s / 2; g.globalAlpha = Math.max(0, f.t / 0.6); g.fillStyle = f.r === 1 ? '#fff' : '#F97316'; g.beginPath(); g.arc(x, y, s * (1.4 - f.t), 0, 7); g.fill(); g.globalAlpha = 1; }
    };
    const stop = loop((dt) => {
      for (let i = fx.length - 1; i >= 0; i--) { fx[i].t -= dt; if (fx[i].t <= 0) fx.splice(i, 1); }
      g.clearRect(0, 0, c.W, c.H); const L = layout();
      const me = spect ? 0 : ctx.me, op = spect ? 1 : 1 - ctx.me;
      g.font = `800 13px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(spect ? ctx.names[op] : mt('enemy'), c.W / 2, 10); grid(L.bx, L.by, L.big, op, spect);
      g.fillText(spect ? ctx.names[me] : mt('mine'), c.W / 2, L.sy - 14); grid(L.sx, L.sy, L.small, me, true);
    });
    upd();
    return { ...api, stop, resize: cv.fit };
  };

  /* ---- o'yin xonasi (server bilan bog'lanish) ---- */
  const Room = { cur: null, inst: null, moves: [], off: null };
  const sock = () => (typeof S !== 'undefined' ? S.socket : null);
  const emitA = (ev, p) => new Promise((res, rej) => { const s = sock(); if (!s) return rej(new Error('offline')); s.timeout(15000).emit(ev, p, (err, r) => (err ? rej(err) : r?.error ? rej(Object.assign(new Error(r.error), { r })) : res(r))); });
  const uname = (u) => (u ? S.users?.get(u.id)?.name || u.name || '' : '');
  function mpMeta(id) { return MPL.find((x) => x.id === id); }
  async function openRoom(roomId) {
    ensurePage(); closeRoom(true);
    let r; try { r = (await emitA('game:join', { room: roomId })).room; } catch (e) { toast(mt('not_avail')); return; }
    Page.inst?.stop?.(); Page.inst = null; Page.cur = null;
    showRoom(r);
  }
  function showRoom(r) {
    const meta = mpMeta(r.game); if (!meta) return;
    Room.cur = r; Room.moves = r.moves.slice();
    $('#gm-title').textContent = `${meta.e} ${gname(meta)}`;
    $('#gm-page').style.setProperty('--g1', meta.c[0]); $('#gm-page').style.setProperty('--g2', meta.c[1]);
    $('#gm-page').classList.remove('hidden'); $('#gm-page').classList.add('mp'); $('#gm-over').classList.add('hidden');
    $('#gm-score').parentElement.classList.add('hidden'); $('#gm-best').parentElement.classList.add('hidden');
    bindSock(); build();
  }
  function players(r) {
    const n = [uname(r.users[0]) || '…', uname(r.users[1]) || '…'];
    return n;
  }
  function build() {
    const r = Room.cur; Room.inst?.stop?.(); Room.inst = null;
    const st = $('#gm-stage'); st.innerHTML = ''; st.className = 'gm-stage';
    const names = players(r);
    const meta = mpMeta(r.game);
    $('#gm-extra').innerHTML = `<div class="mp-bar"><div class="mp-p" data-s="0">${avatar({ ...(r.users[0] || {}), online: false }, 'sm')}<b>${esc(names[0])}</b><i></i></div><span class="mp-vs">VS</span><div class="mp-p" data-s="1">${r.users[1] ? avatar({ ...r.users[1], online: false }, 'sm') : '<span class="mp-q">?</span>'}<b>${esc(names[1])}</b><i></i></div></div><div class="mp-turn" id="mp-turn"></div>`;
    $('#gm-info').innerHTML = r.seat >= 0 && r.status === 'play' ? `<button class="mp-resign" id="mp-resign">🏳️</button>` : '';
    $('#mp-resign')?.addEventListener('click', () => { if (confirm(mt('resign_q'))) emitA('game:over', { room: r.id, resign: true }).catch(() => toast(t('net_err'))); });
    if (r.status === 'wait') {
      st.innerHTML = `<div class="mp-wait"><div class="mp-spin">${meta.e}</div><h3>${esc(mt('wait'))}</h3><p>${esc(mt('wait_sub'))}</p></div>`;
      return;
    }
    let overShown = false;
    const ctx = {
      me: r.seat, names, secret: r.secret,
      send: (m) => {
        if (!Room.inst) return; const n = Room.moves.length;
        if (!Room.inst.apply(r.seat, m, false)) return;
        Room.moves.push({ s: r.seat, m });
        emitA('game:move', { room: r.id, n, m }).catch((e) => { resync(); if (e?.message !== 'sync') toast(t('net_err')); });
      },
      over: (w) => { if (r.seat >= 0) emitA('game:over', { room: r.id, w }).catch(() => {}); setTimeout(() => showResult(w), 700); },
      turn: (s, txt) => {
        $$('.mp-p').forEach((p) => p.classList.toggle('on', +p.dataset.s === s));
        const el = $('#mp-turn'); if (!el) return;
        el.textContent = txt || (s < 0 ? '' : r.seat < 0 ? mt('spectate') : s === r.seat ? mt('your') : mt('their'));
        el.classList.toggle('me', s === r.seat && s >= 0);
      },
      hint: (s) => { const el = $('#mp-turn'); if (el) { el.textContent = s; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 900); } },
      secretSave: (data) => emitA('game:secret', { room: r.id, data }),
    };
    const showResult = (w) => {
      if (overShown) return; overShown = true;
      const txt = w === 2 ? mt('draw') : r.seat < 0 ? mt('won_by').replace('{n}', names[w]) : w === r.seat ? mt('you_won') : mt('you_lost');
      const ov = $('#gm-over');
      ov.innerHTML = `<div class="gm-card"><div class="gm-big">${w === 2 ? '🤝' : w === r.seat ? '🏆' : r.seat < 0 ? '🏁' : '😔'}</div><h3>${esc(txt)}</h3>
        ${r.seat >= 0 ? `<button class="btn-primary" id="mp-again">${esc(mt('rematch'))}</button>` : ''}<div class="gm-row"><button id="mp-see">${esc(mt('watch'))}</button><button id="mp-top">🏆 ${tg('top')}</button></div></div>`;
      ov.classList.remove('hidden');
      if (w === r.seat) snd(1046, 0.4, 0.08);
      $('#mp-again')?.addEventListener('click', () => invite(r.game, r.chatId));
      $('#mp-see').onclick = () => ov.classList.add('hidden');
      $('#mp-top').onclick = () => showTopMP(r.game);
      $('#gm-info').innerHTML = '';
    };
    Room.showResult = showResult;
    requestAnimationFrame(() => {
      Room.inst = MPI[r.game](st, ctx);
      for (const mv of Room.moves) Room.inst.apply(mv.s, mv.m, true);
      Room.inst.ready?.();
      if (r.status === 'over' && r.winner != null) showResult(r.winner);
    });
  }
  async function resync() {
    const r = Room.cur; if (!r) return;
    try { const nr = (await emitA('game:join', { room: r.id })).room; Room.cur = nr; Room.moves = nr.moves.slice(); build(); } catch {}
  }
  function bindSock() {
    const s = sock(); if (!s || Room.off) return;
    const onMove = (ev) => {
      const r = Room.cur; if (!r || ev.room !== r.id || !Room.inst) return;
      if (ev.i < Room.moves.length) return;
      if (ev.i > Room.moves.length) return resync();
      Room.moves.push({ s: ev.s, m: ev.m });
      if (!Room.inst.apply(ev.s, ev.m, false)) resync();
    };
    const onState = (st) => {
      GameCards.set(st.id, st);
      const r = Room.cur; if (!r || st.id !== r.id) return;
      const wasWait = r.status === 'wait';
      Room.cur = { ...r, ...st, moves: st.moves };
      if (wasWait && st.status !== 'wait') { Room.moves = st.moves.slice(); build(); }
      else if (st.status === 'over') { $('#gm-info').innerHTML = ''; Room.showResult?.(st.winner); }
    };
    const onConn = () => { if (Room.cur) resync(); };
    s.on('game:move', onMove); s.on('game:state', onState); s.on('connect', onConn);
    Room.off = () => { s.off('game:move', onMove); s.off('game:state', onState); s.off('connect', onConn); Room.off = null; };
  }
  function closeRoom(silent) {
    Room.inst?.stop?.(); Room.inst = null; Room.cur = null; Room.off?.();
    $('#gm-page')?.classList.remove('mp');
    $('#gm-score')?.parentElement.classList.remove('hidden'); $('#gm-best')?.parentElement.classList.remove('hidden');
    if (!silent) renderLobby();
  }
  async function invite(game, chatId) {
    const go = async (cid) => {
      closeModal();
      try { const r = await emitA('game:invite', { chatId: cid, game }); toast(mt('sent')); Page.inst?.stop?.(); Page.inst = null; ensurePage(); closeRoom(true); showRoom(r.room); }
      catch (e) { toast(e.message === 'blocked' ? t('blocked_cant') || t('not_sent') : t('not_sent')); }
    };
    if (chatId) return go(chatId);
    const list = [...S.chats.values()].filter((c) => c.type !== 'channel' && !c.self).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)).slice(0, 80);
    const meta = mpMeta(game);
    modal(`<h3>${meta.e} ${esc(mt('invite'))} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="chat-pick">${list.map((c) => `<button data-cid="${c.id}">${chatAvatar(c, 'sm')}<b>${esc(chatTitle(c))}</b></button>`).join('')}</div>`);
    $('#modal-card .chat-pick').onclick = (e) => { const b = e.target.closest('[data-cid]'); if (b) go(+b.dataset.cid); };
  }
  async function showTopMP(game) {
    const meta = mpMeta(game);
    modal(`<h3>${meta.e} ${tg('top_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="gm-top" id="gm-toplist"><p class="empty-note">…</p></div>`);
    try {
      const r = await api('/api/games/top?game=w_' + game); const medal = ['🥇', '🥈', '🥉'];
      $('#gm-toplist').innerHTML = r.top.length ? r.top.map((x, i) => `<div class="gm-tr${x.user.id === S.me.id ? ' me' : ''}"><span class="gm-pos">${medal[i] || i + 1}</span>${avatar({ ...x.user, online: false }, 'sm')}<b>${esc(S.users.get(x.user.id)?.name || x.user.name || '')}</b><span class="gm-pts">${x.best} ${esc(mt('wins'))}</span></div>`).join('') : `<p class="empty-note">${esc(tg('empty_top'))}</p>`;
    } catch { $('#gm-toplist').innerHTML = `<p class="empty-note">${esc(t('net_err'))}</p>`; }
  }
  // chatdagi taklif kartochkalari holati
  const GameCards = {
    map: new Map(), q: new Set(), tm: null,
    set(id, st) { this.map.set(id, st); this.paint(id); },
    want(id) { if (this.map.has(id)) return; this.q.add(id); clearTimeout(this.tm); this.tm = setTimeout(() => this.flush(), 120); },
    async flush() { const ids = [...this.q]; this.q.clear(); if (!ids.length) return; try { const r = await emitA('game:peek', { ids }); Object.entries(r || {}).forEach(([k, v]) => this.set(k, v)); } catch {} },
    paint(id) {
      const st = this.map.get(id); if (!st) return;
      document.querySelectorAll(`[data-groom="${id}"]`).forEach((el) => {
        const me = S.me?.id, seat = st.a === me ? 0 : st.b === me ? 1 : -1;
        const s = el.querySelector('.gc-st'), b = el.querySelector('.gc-go');
        if (s) s.textContent = st.status === 'over' ? (st.winner === 2 ? mt('draw') : seat >= 0 ? (st.winner === seat ? mt('you_won') : mt('you_lost')) : mt('status_over')) : st.status === 'play' ? mt('status_play') : mt('status_wait');
        if (b) b.textContent = st.status === 'over' || (seat < 0 && st.status === 'play') ? mt('watch') : mt('play');
      });
    },
  };
  function cardHTML(m) {
    const gm = m.meta?.game || {}; const meta = mpMeta(gm.g); if (!meta) return '';
    GameCards.want(gm.room); setTimeout(() => GameCards.paint(gm.room), 0);
    return `<div class="game-card" data-groom="${esc(gm.room)}" style="--g1:${meta.c[0]};--g2:${meta.c[1]}"><span class="gc-e">${meta.e}</span><div class="gc-t"><small>${esc(mt('invited'))}</small><b>${esc(gname(meta))}</b><span class="gc-st">…</span></div><button class="gc-go">${esc(mt('play'))}</button></div>`;
  }
  async function myRooms() { try { return (await emitA('game:mine', {})).rooms || []; } catch { return []; } }

  window.BirgaMP = { list: MPL, openRoom, invite, cardHTML, GameCards, mt, gname };

  /* ---------- O'yinlar bo'limi (lobbi) ---------- */
  async function renderLobby() {
    const el = $('#games-grid'); if (!el) return;
    const tile = (m, mp) => `<button class="gm-tile${m.big ? ' big' : ''}" data-${mp ? 'mp' : 'g'}="${m.id}" style="--g1:${m.c[0]};--g2:${m.c[1]}"><span class="gm-e">${m.e}</span><b>${esc(gname(m))}</b><small data-sc="${mp ? 'w_' + m.id : m.id}">🏆 ${Page.best[mp ? 'w_' + m.id : m.id] || 0}${mp ? ' ' + esc(mt('wins')) : ''}</small>${mp ? '<span class="gm-2p">👥 2</span>' : ''}</button>`;
    el.innerHTML = `<div class="gm-act hidden" id="gm-act"></div>
      <h4 class="gm-h">👥 ${esc(mt('mp'))}</h4><p class="gm-hs">${esc(mt('mp_sub'))}</p><div class="gm-grid">${MPL.map((m) => tile(m, true)).join('')}</div>
      <h4 class="gm-h">🎮 ${esc(mt('solo'))}</h4><div class="gm-grid">${GAMES.map((m) => tile(m)).join('')}</div>`;
    el.onclick = (e) => {
      const b = e.target.closest('[data-g],[data-mp],[data-room]'); if (!b) return;
      if (b.dataset.g) startGame(b.dataset.g); else if (b.dataset.mp) invite(b.dataset.mp); else openRoom(b.dataset.room);
    };
    try { const mine = await api('/api/games/mine'); Object.assign(Page.best, mine); el.querySelectorAll('[data-sc]').forEach((x) => { const k = x.dataset.sc; x.textContent = '🏆 ' + (Page.best[k] || 0) + (k.startsWith('w_') ? ' ' + mt('wins') : ''); }); } catch {}
    const rooms = await myRooms(); const act = $('#gm-act');
    if (act && rooms.length) {
      act.innerHTML = `<h4 class="gm-h">⏳ ${esc(mt('active'))}</h4>` + rooms.map((r) => { const m = mpMeta(r.game); const op = r.users[1 - r.seat]; const myTurn = r.turn === r.seat;
        return `<button class="gm-room" data-room="${r.id}"><span class="gm-e2" style="background:linear-gradient(135deg,${m.c[0]},${m.c[1]})">${m.e}</span><span class="gm-rt"><b>${esc(gname(m))}</b><small>${op ? esc(uname(op)) : esc(mt('status_wait'))}</small></span>${myTurn ? `<i class="gm-dot"></i>` : ''}<span class="gm-go">${esc(mt('open'))} ›</span></button>`; }).join('');
      act.classList.remove('hidden');
    }
  }

  window.BirgaGames = { list: GAMES, start: startGame, renderLobby, tg, openRoom, invite, cardHTML, GameCards, mt, mp: MPL, _room: () => Room };
})();
