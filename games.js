/* Birga — O'yinlar (10 ta kichik o'yin). app.js dagi umumiy yordamchilardan foydalanadi: $, t, esc, icon, api, modal, toast. */
'use strict';
(function () {
  const L = () => (typeof LANG !== 'undefined' && ['uz', 'ru', 'en'].includes(LANG) ? LANG : '_');
  const PK = (ns) => (typeof I18N_PACK !== 'undefined' && I18N_PACK?.games?.[ns]) || null; // boshqa tillar tarjimasi (/i18n/<til>.json)
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
  const tg = (k) => (T[L()] || PK('g') || T.en)[k] || T.en[k] || T.uz[k];
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
  const gname = (g) => g.n[L()] || PK('gn')?.[g.id] || g.n.en || g.n.uz;

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
    { id: 'chess', two: 1, e: '♟️', c: ['#78350F', '#1C1917'], n: { uz: 'Shaxmat', ru: 'Шахматы', en: 'Chess' } },
    { id: 'checkers', two: 1, e: '⚪', c: ['#B91C1C', '#7F1D1D'], n: { uz: 'Shashka', ru: 'Шашки', en: 'Checkers' } },
    { id: 'battleship', e: '🚢', c: ['#0369A1', '#1E3A8A'], n: { uz: 'Dengiz jangi', ru: 'Морской бой', en: 'Battleship' } },
    { id: 'connect4', e: '🔴', c: ['#2563EB', '#7C3AED'], n: { uz: '4 qator', ru: '4 в ряд', en: 'Connect Four' } },
    { id: 'gomoku', e: '⚫', c: ['#A16207', '#713F12'], n: { uz: '5 qator', ru: 'Гомоку', en: 'Gomoku' } },
  ];
  const MT = {
    uz: { mp: 'Do‘st bilan o‘ynash', mp_sub: 'Do‘stingizni taklif qiling — navbatma-navbat jonli o‘ynaysiz', solo: 'Yakka o‘yinlar', invite: 'Kimni taklif qilasiz?', active: 'Davom etayotgan o‘yinlar',
      wait: 'Raqib kutilmoqda…', wait_sub: 'Taklif chatga yuborildi. Do‘stingiz “O‘ynash” ni bossa — o‘yin boshlanadi.', your: 'Sizning navbatingiz', their: 'Raqib o‘ylamoqda…', resign: 'Taslim bo‘lish', resign_q: 'Taslim bo‘lasizmi?',
      you_won: 'Siz yutdingiz! 🎉', you_lost: 'Siz yutqazdingiz', draw: 'Durang', won_by: '{n} yutdi', play: 'O‘ynash', watch: 'Ko‘rish', open: 'Ochish', invited: 'O‘yinga taklif', status_wait: 'Raqib kutilmoqda', status_play: 'O‘yin davom etmoqda', status_over: 'O‘yin tugadi',
      shuffle: 'Aralashtirish', ready: 'Tayyorman', wait_ready: 'Raqib kemalarini joylamoqda…', place: 'Kemalaringizni joylang', enemy: 'Raqib dengizi', mine: 'Sizning flotingiz', check: 'Shoh!', wins: 'g‘alaba', confirm: 'Tasdiqlash uchun yana bosing', sent: 'Taklif yuborildi', not_avail: 'O‘yin topilmadi', spectate: 'Siz tomoshabinsiz', rematch: 'Qayta o‘ynash', players: 'O‘yinchilar:', joined: 'kishi qo‘shildi', start_now: 'Hozir boshlash ({n} kishi)', send_inv: 'Taklif yuborish', hint_grp: 'Guruhdan {n} kishigacha qo‘shila oladi', hint_pick: 'Taklif qilinganlar: {k} / {n} — bir nechta chatni belgilang', max4: 'Ko‘pi bilan 4 kishi', their_n: '{n} yurmoqda…' },
    ru: { mp: 'Играть с другом', mp_sub: 'Пригласите друга — играйте по очереди в реальном времени', solo: 'Одиночные игры', invite: 'Кого пригласить?', active: 'Текущие партии',
      wait: 'Ожидание соперника…', wait_sub: 'Приглашение отправлено в чат. Когда друг нажмёт «Играть» — игра начнётся.', your: 'Ваш ход', their: 'Соперник думает…', resign: 'Сдаться', resign_q: 'Сдаться?',
      you_won: 'Вы победили! 🎉', you_lost: 'Вы проиграли', draw: 'Ничья', won_by: 'Победил(а) {n}', play: 'Играть', watch: 'Смотреть', open: 'Открыть', invited: 'Приглашение в игру', status_wait: 'Ожидание соперника', status_play: 'Идёт игра', status_over: 'Игра окончена',
      shuffle: 'Перемешать', ready: 'Готов', wait_ready: 'Соперник расставляет корабли…', place: 'Расставьте корабли', enemy: 'Поле соперника', mine: 'Ваш флот', check: 'Шах!', wins: 'побед', confirm: 'Нажмите ещё раз для подтверждения', sent: 'Приглашение отправлено', not_avail: 'Игра не найдена', spectate: 'Вы зритель', rematch: 'Реванш', players: 'Игроки:', joined: 'присоединились', start_now: 'Начать сейчас ({n} игр.)', send_inv: 'Отправить приглашение', hint_grp: 'Из группы могут присоединиться до {n} игроков', hint_pick: 'Приглашено: {k} / {n} — отметьте несколько чатов', max4: 'Не больше 4 игроков', their_n: 'Ходит {n}…' },
    en: { mp: 'Play with a friend', mp_sub: 'Invite a friend — take turns live', solo: 'Solo games', invite: 'Who do you invite?', active: 'Ongoing games',
      wait: 'Waiting for opponent…', wait_sub: 'Invite sent to the chat. The game starts when your friend taps “Play”.', your: 'Your turn', their: 'Opponent is thinking…', resign: 'Resign', resign_q: 'Resign this game?',
      you_won: 'You won! 🎉', you_lost: 'You lost', draw: 'Draw', won_by: '{n} won', play: 'Play', watch: 'Watch', open: 'Open', invited: 'Game invite', status_wait: 'Waiting for opponent', status_play: 'Game in progress', status_over: 'Game over',
      shuffle: 'Shuffle', ready: 'Ready', wait_ready: 'Opponent is placing ships…', place: 'Place your ships', enemy: 'Enemy waters', mine: 'Your fleet', check: 'Check!', wins: 'wins', confirm: 'Tap again to confirm', sent: 'Invite sent', not_avail: 'Game not found', spectate: 'You are watching', rematch: 'Rematch', players: 'Players:', joined: 'joined', start_now: 'Start now ({n} players)', send_inv: 'Send invite', hint_grp: 'Up to {n} players can join from the group', hint_pick: 'Invited: {k} / {n} — select several chats', max4: 'Up to 4 players', their_n: '{n} is moving…' },
  };
  const mt = (k) => (MT[L()] || PK('mt') || MT.en)[k] || MT.en[k] || MT.uz[k];
  try { const st = document.createElement('style'); st.textContent = '.mp-bar.mp-n { flex-wrap: wrap; gap: 6px; } .mp-bar.mp-n .mp-p { max-width: 48%; padding-right: 8px; border-color: color-mix(in srgb, var(--pc) 55%, transparent); }\n.mp-bar.mp-n .mp-p.on { border-color: #FDE047; } .mp-p.out { opacity: .4; filter: grayscale(1); } .mp-p.out b { text-decoration: line-through; }\n.mp-ncount { display: flex; align-items: center; gap: 8px; margin: 4px 0 6px; flex-wrap: wrap; } .mp-ncount span { font-weight: 700; font-size: 14px; }\n.mp-ncount button { border: 1.5px solid var(--line, #ccc); background: transparent; color: inherit; border-radius: 20px; padding: 7px 14px; font: 700 14px system-ui; cursor: pointer; }\n.mp-ncount button.on { background: var(--accent, #2563EB); border-color: var(--accent, #2563EB); color: #fff; }\n.mp-nhint { margin: 0 0 8px; font-size: 13px; opacity: .75; } .chat-pick.multi button { position: relative; } .chat-pick.multi .mp-chk { margin-left: auto; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line, #bbb); flex: none; }\n.chat-pick.multi button.on .mp-chk { background: var(--accent, #2563EB); border-color: var(--accent, #2563EB); box-shadow: inset 0 0 0 4px var(--card, #fff); }\n.mp-send { width: 100%; margin-top: 10px; position: sticky; bottom: 0; } .mp-cnt { font-size: 16px; } .mp-cnt b { font-size: 22px; } #mp-start { margin-top: 12px; }'; document.head.appendChild(st); } catch {}
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
    const NP = ctx.n || 2, C = NP > 2 ? 9 : 7, R = NP > 2 ? 7 : 6; const cv = canvasIn(stage, C / (R + 1)); const { c, g } = cv;
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
        const w = line(col, y); turn = ctx.next ? ctx.next(turn) : 1 - turn;
        if (w) { done = true; winLine = w; ctx.over(sd); } else if (b.every((v) => v !== -1)) { done = true; ctx.over(ctx.DRAW ?? 2); }
        ctx.turn(done ? -1 : turn); return true;
      },
      quit(s) { if (done) return; const left = ctx.active(); if (left.length < 2) return; if (turn === s) { turn = ctx.next(s); ctx.turn(turn); } },
    };
    const COL = ['#EF4444', '#FACC15', '#22C55E', '#3B82F6'], DARK = ['#B91C1C', '#CA8A04', '#15803D', '#1D4ED8'];
    const stop = loop((dt) => {
      const { s, ox, oy } = geom();
      g.clearRect(0, 0, c.W, c.H);
      if (!done && turn === ctx.me && hover >= 0 && hover < C) { g.globalAlpha = 0.6; g.fillStyle = COL[ctx.me]; g.beginPath(); g.arc(ox + hover * s + s / 2, oy - s / 2, s * 0.38, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = '#1D4ED8'; rr(g, ox - 6, oy - 6, s * C + 12, s * R + 12, 18); g.fill();
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const v = b[y * C + x]; let cy = oy + y * s + s / 2;
        if (drop && drop.col === x && drop.y === y) { drop.t = Math.min(1, drop.t + dt * 3); cy = oy - s / 2 + (cy - oy + s / 2) * drop.t * drop.t; if (drop.t >= 1) drop = null; }
        g.fillStyle = '#0B1220'; g.beginPath(); g.arc(ox + x * s + s / 2, oy + y * s + s / 2, s * 0.38, 0, 7); g.fill();
        if (v >= 0) { const gr = g.createRadialGradient(ox + x * s + s * 0.4, cy - s * 0.1, 2, ox + x * s + s / 2, cy, s * 0.4); gr.addColorStop(0, '#fff8'); gr.addColorStop(0.25, COL[v]); gr.addColorStop(1, DARK[v]); g.fillStyle = gr; g.beginPath(); g.arc(ox + x * s + s / 2, cy, s * 0.38, 0, 7); g.fill(); }
        if (y * C + x === lastI && !drop) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(ox + x * s + s / 2, cy, s * 0.16, 0, 7); g.stroke(); }
      }
      if (winLine) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; const a = winLine.reduce((m, p) => (p[0] + p[1] * 10 < m[0] + m[1] * 10 ? p : m)), z = winLine.reduce((m, p) => (p[0] + p[1] * 10 > m[0] + m[1] * 10 ? p : m)); g.beginPath(); g.moveTo(ox + a[0] * s + s / 2, oy + a[1] * s + s / 2); g.lineTo(ox + z[0] * s + s / 2, oy + z[1] * s + s / 2); g.stroke(); }
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit, mark: (sd) => COL[sd] };
  };

  // ---- 5 qator (Gomoku 15×15) ----
  MPI.gomoku = (stage, ctx) => {
    const NP = ctx.n || 2, N = NP > 2 ? 17 : 15, WINL = NP > 2 ? 4 : 5; const cv = boardCanvas(stage, N); const { c, g } = cv;
    const b = Array(N * N).fill(-1); let turn = 0, done = false, lastI = -1, ghost = -1, winLine = null;
    const SC = [['#666', '#0A0A0A'], ['#fff', '#D4D4D4'], ['#F87171', '#B91C1C'], ['#60A5FA', '#1D4ED8']];
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -2 : b[y * N + x]);
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const p = cv.cell(e); if (!p) return; const i = p[1] * N + p[0]; if (b[i] !== -1) return;
      if (ghost === i) { ghost = -1; ctx.send(i); } else { ghost = i; ctx.hint(mt('confirm')); snd(700, 0.03, 0.03); }
    });
    const api = {
      apply(sd, i, replay) {
        if (done || sd !== turn || b[i] !== -1 || !(i >= 0 && i < N * N)) return false;
        b[i] = sd; lastI = i; ghost = -1; turn = ctx.next ? ctx.next(turn) : 1 - turn; if (!replay) snd(sd ? 380 : 480, 0.06, 0.06, 'triangle');
        const x = i % N, y = (i / N) | 0;
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const L = [[x, y]]; for (const s of [1, -1]) { let k = 1; while (at(x + dx * k * s, y + dy * k * s) === sd) { L.push([x + dx * k * s, y + dy * k * s]); k++; } } if (L.length >= WINL) { winLine = L; done = true; break; } }
        if (done) ctx.over(sd); else if (b.every((v) => v !== -1)) { done = true; ctx.over(ctx.DRAW ?? 2); }
        ctx.turn(done ? -1 : turn); return true;
      },
      quit(s) { if (done) return; if (turn === s) { turn = ctx.next(s); ctx.turn(turn); } },
    };
    const stop = loop(() => {
      const s = Math.min(c.W, c.H) / N, ox = (c.W - s * N) / 2, oy = (c.H - s * N) / 2;
      g.clearRect(0, 0, c.W, c.H); g.fillStyle = '#E4B66B'; rr(g, ox - 4, oy - 4, s * N + 8, s * N + 8, 10); g.fill();
      g.strokeStyle = '#7C4A12'; g.lineWidth = 1;
      for (let i = 0; i < N; i++) { g.beginPath(); g.moveTo(ox + s / 2, oy + i * s + s / 2); g.lineTo(ox + s * N - s / 2, oy + i * s + s / 2); g.moveTo(ox + i * s + s / 2, oy + s / 2); g.lineTo(ox + i * s + s / 2, oy + s * N - s / 2); g.stroke(); }
      for (const [x, y] of (N === 15 ? [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]] : [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]])) { g.fillStyle = '#7C4A12'; g.beginPath(); g.arc(ox + x * s + s / 2, oy + y * s + s / 2, 2.5, 0, 7); g.fill(); }
      const stone = (i, v, a = 1) => { const x = ox + (i % N) * s + s / 2, y = oy + ((i / N) | 0) * s + s / 2; g.globalAlpha = a; const gr = g.createRadialGradient(x - s * 0.12, y - s * 0.12, 1, x, y, s * 0.45); gr.addColorStop(0, SC[v][0]); gr.addColorStop(1, SC[v][1]); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 0.44, 0, 7); g.fill(); g.globalAlpha = 1; };
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
    const N = 10, FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1], NP = ctx.n || 2, MULTI = NP > 2;
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
    const SEATS = Array.from({ length: NP }, (_, i) => i);
    const ready = SEATS.map(() => false); let turn = 0, done = false, pending = null; // pending: {s, c, g} g — nishon o'rni
    const shots = SEATS.map(() => Array(N * N).fill(0)); // shots[target seat] : 0 yo'q, 1 o'tmadi, 2 tegdi, 3 cho'kdi
    const sunkShips = SEATS.map(() => []);
    const dead = new Set(); // n>2: floti butunlay cho'kkanlar
    const spect = ctx.me < 0;
    const out = ctx.out || new Set();
    const alive = () => SEATS.filter((i) => !out.has(i) && !dead.has(i));
    const allReady = () => SEATS.every((i) => ready[i] || out.has(i));
    const nextAlive = (s) => { for (let k = 1; k <= NP; k++) { const q = (s + k) % NP; if (!out.has(q) && !dead.has(q)) return q; } return s; };
    const tgtOf = (sd, m) => (MULTI ? m.g : 1 - sd);
    let sel = -1; // n>2: tanlangan nishon (tomoshabin uchun — ko'rilayotgan o'rin)
    const fixSel = () => { const ok = (q) => q >= 0 && q !== ctx.me && (spect || alive().includes(q)); if (!ok(sel)) sel = (spect ? SEATS : alive()).find((q) => q !== ctx.me) ?? -1; };
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
    const TAB = MULTI ? 34 : 0;
    const layout = () => { const W = c.W, H = c.H; const big = Math.min(W - 16, H * 0.58 - TAB * 0.6), small = Math.min(W * 0.62, H - big - 54 - TAB); return { big, small, bx: (W - big) / 2, by: 22 + TAB, sx: (W - small) / 2, sy: 22 + TAB + big + 30 }; };
    const tabs = () => { const L = SEATS.filter((q) => q !== ctx.me), w = Math.min(120, (c.W - 12) / L.length); return L.map((q, k) => ({ q, x: c.W / 2 + (k - L.length / 2) * w + 3, y: 4, w: w - 6, h: 28 })); };
    c.addEventListener('pointerdown', (e) => {
      const [x, y] = pos(c, e);
      if (MULTI) { const tb = tabs().find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h); if (tb) { if (spect || alive().includes(tb.q)) { sel = tb.q; snd(600, 0.03, 0.03); } return; } }
      if (done || spect || !allReady() || turn !== ctx.me || pending) return;
      const tg = MULTI ? (fixSel(), sel) : 1 - ctx.me; if (tg < 0) return;
      const L = layout(); const s = L.big / N; const cx = Math.floor((x - L.bx) / s), cy = Math.floor((y - L.by) / s);
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) return; const ci = cy * N + cx; if (shots[tg][ci]) return;
      ctx.send(MULTI ? { t: 'f', c: ci, g: tg } : { t: 'f', c: ci }); snd(300, 0.1, 0.05, 'sawtooth');
    });
    const fx = [];
    const api = {
      apply(sd, m, replay) {
        if (done || !m || typeof m !== 'object') return false;
        if (m.t === 'r') { if (ready[sd]) return false; ready[sd] = true; paintPanel(); upd(); return true; }
        if (m.t === 'f') {
          const tg = tgtOf(sd, m);
          if (!allReady() || sd !== turn || pending || !(m.c >= 0 && m.c < N * N) || !Number.isInteger(tg) || tg < 0 || tg >= NP || tg === sd || out.has(tg) || dead.has(tg) || shots[tg][m.c]) return false;
          pending = { s: sd, c: m.c, g: tg }; if (tg === ctx.me && !replay) setTimeout(() => api.respond(), 350); if (MULTI && spect) sel = tg; upd(); return true;
        }
        if (m.t === 'a') {
          if (!pending || sd !== pending.g || m.c !== pending.c) return false;
          const tgt = sd; const r = [1, 2, 3].includes(m.r) ? m.r : 1; shots[tgt][m.c] = r === 1 ? 1 : 2;
          if (r === 3 && Array.isArray(m.cells)) { m.cells.forEach((ci) => (shots[tgt][ci] = 3)); sunkShips[tgt].push(m.cells); m.cells.forEach((ci) => { const cx = ci % N, cy = (ci / N) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && !shots[tgt][ny * N + nx]) shots[tgt][ny * N + nx] = 1; } }); }
          if (!replay) { fx.push({ tgt, c: m.c, r, t: 0.6 }); snd(r === 1 ? 200 : 120, r === 1 ? 0.12 : 0.35, 0.08, r === 1 ? 'sine' : 'sawtooth'); if (r > 1) navigator.vibrate?.(r === 3 ? 90 : 30); }
          const sh = pending.s; pending = null;
          if (!MULTI) { if (r === 1) turn = 1 - turn; if (m.end) { done = true; ctx.over(1 - tgt); } upd(); return true; }
          if (m.end) { dead.add(tgt); if (!replay) ctx.hint('💀 ' + ctx.names[tgt]); }
          const al = alive(); if (al.length <= 1) { done = true; ctx.over(al.length ? al[0] : ctx.DRAW); upd(); return true; }
          turn = r === 1 || out.has(sh) ? nextAlive(sh) : sh; // tegsa — yana otadi
          fixSel(); upd(); return true;
        }
        return false;
      },
      quit(s) {
        if (done || ctx.active().length < 2) return;
        if (pending && pending.g === s) pending = null; // nishon chiqib ketdi — otuvchi qaytadan tanlaydi
        const al = alive(); if (al.length <= 1) { done = true; ctx.over(al.length ? al[0] : ctx.DRAW); upd(); return; }
        if (turn === s && !pending) turn = nextAlive(s);
        fixSel(); upd();
      },
      respond() { if (pending && pending.g === ctx.me && !done && fleet) ctx.send(answer(pending.c)); },
      ready() { if (pending && pending.g === ctx.me) api.respond(); paintPanel(); upd(); },
    };
    function upd() { if (!allReady()) ctx.turn(-1, !spect && !ready[ctx.me] ? mt('place') : mt('wait_ready')); else ctx.turn(done ? -1 : turn); }
    const grid = (x0, y0, size, seat, mine) => {
      const s = size / N; g.fillStyle = '#0C4A6E'; rr(g, x0 - 3, y0 - 3, size + 6, size + 6, 8); g.fill();
      for (let i = 0; i < N * N; i++) {
        const x = x0 + (i % N) * s, y = y0 + ((i / N) | 0) * s; const st = shots[seat][i];
        g.fillStyle = (i + ((i / N) | 0)) % 2 ? '#0EA5E9' : '#38BDF8'; g.fillRect(x + 0.5, y + 0.5, s - 1, s - 1);
        if (mine && fleet && seat === ctx.me && myCellShip(i)) { g.fillStyle = st >= 2 ? '#7F1D1D' : '#334155'; rr(g, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.2); g.fill(); }
        if (st === 3 && !mine) { g.fillStyle = '#450A0A'; rr(g, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.2); g.fill(); }
        if (st === 1) { g.fillStyle = '#E0F2FE'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.12, 0, 7); g.fill(); }
        if (st >= 2) { g.strokeStyle = '#F87171'; g.lineWidth = Math.max(2, s * 0.12); g.beginPath(); g.moveTo(x + s * 0.25, y + s * 0.25); g.lineTo(x + s * 0.75, y + s * 0.75); g.moveTo(x + s * 0.75, y + s * 0.25); g.lineTo(x + s * 0.25, y + s * 0.75); g.stroke(); }
        if (pending && pending.c === i && pending.g === seat) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, s - 4, s - 4); }
      }
      for (const f of fx) if (f.tgt === seat) { const x = x0 + (f.c % N) * s + s / 2, y = y0 + ((f.c / N) | 0) * s + s / 2; g.globalAlpha = Math.max(0, f.t / 0.6); g.fillStyle = f.r === 1 ? '#fff' : '#F97316'; g.beginPath(); g.arc(x, y, s * (1.4 - f.t), 0, 7); g.fill(); g.globalAlpha = 1; }
    };
    const left = (q) => FLEET.length - sunkShips[q].length;
    const stop = loop((dt) => {
      for (let i = fx.length - 1; i >= 0; i--) { fx[i].t -= dt; if (fx[i].t <= 0) fx.splice(i, 1); }
      g.clearRect(0, 0, c.W, c.H); const L = layout();
      g.font = `800 13px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (!MULTI) {
        const me = spect ? 0 : ctx.me, op = spect ? 1 : 1 - ctx.me;
        g.fillText(spect ? ctx.names[op] : mt('enemy'), c.W / 2, 10); grid(L.bx, L.by, L.big, op, spect);
        g.fillText(spect ? ctx.names[me] : mt('mine'), c.W / 2, L.sy - 14); grid(L.sx, L.sy, L.small, me, true);
        return;
      }
      fixSel();
      for (const tb of tabs()) { // nishon tanlash tugmalari: rang, ism, qolgan kemalar
        const q = tb.q, gone = out.has(q) || dead.has(q), on = q === sel; g.globalAlpha = gone ? 0.4 : 1;
        g.fillStyle = on ? ctx.col[q] : 'rgba(15,23,42,.7)'; rr(g, tb.x, tb.y, tb.w, tb.h, 10); g.fill(); g.strokeStyle = ctx.col[q]; g.lineWidth = 2; g.stroke();
        if (q === turn && !done && allReady()) { g.strokeStyle = '#FDE047'; g.lineWidth = 2.5; rr(g, tb.x - 2, tb.y - 2, tb.w + 4, tb.h + 4, 12); g.stroke(); }
        const nm = String(ctx.names[q] || '').slice(0, Math.max(3, Math.floor(tb.w / 9) - 3));
        text(g, `${dead.has(q) ? '💀' : out.has(q) ? '🏳️' : '🚢' + left(q)} ${nm}`, tb.x + tb.w / 2, tb.y + tb.h / 2, 12, '#fff'); g.globalAlpha = 1;
      }
      const big = sel >= 0 ? sel : 0; const lab = spect ? ctx.names[big] : `🎯 ${ctx.names[big]}`;
      text(g, lab, c.W / 2, L.by - 12, 13, ctx.col[big]); grid(L.bx, L.by, L.big, big, spect);
      const sm = spect ? (turn !== big ? turn : nextAlive(big)) : ctx.me;
      text(g, spect ? ctx.names[sm] : `${mt('mine')} · 🚢${left(sm)}${dead.has(sm) ? ' 💀' : ''}`, c.W / 2, L.sy - 14, 13, ctx.col[sm]); grid(L.sx, L.sy, L.small, sm, true);
    });
    upd();
    return { ...api, stop, resize: cv.fit };
  };


  /* ================= v20: yangi 2 kishilik o'yinlar — jonli (futbol 4×4, Strike duel, xokkey) va navbatli (Reversi, Nuqtalar) ================= */
  MPL.push(
    { id: 'fb4', e: '⚽', c: ['#16A34A', '#1D4ED8'], rt: 1, big: 1, n: { uz: 'Futbol 4×4 (jonli)', ru: 'Футбол 4×4 (онлайн)', en: 'Football 4v4 (live)' } },
    { id: 'duel', e: '🔫', c: ['#475569', '#B45309'], rt: 1, n: { uz: 'Counter duel (jonli)', ru: 'Counter дуэль', en: 'Counter duel' } },
    { id: 'hockey', e: '🏒', c: ['#0EA5E9', '#E11D48'], rt: 1, n: { uz: 'Havo xokkeyi', ru: 'Аэрохоккей', en: 'Air hockey' } },
    { id: 'reversi', e: '⚫', c: ['#15803D', '#14532D'], n: { uz: 'Reversi', ru: 'Реверси', en: 'Reversi' } },
    { id: 'dots', e: '🔲', c: ['#F59E0B', '#B45309'], n: { uz: 'Nuqtalar va kataklar', ru: 'Точки и квадраты', en: 'Dots & Boxes' } },
  );
  const RT_T = {
    uz: { wait_rt: 'Raqib ulanmoqda…', go: 'Boshladik!', lost: 'Raqib bilan aloqa uzildi…', kills: 'Frag', first: '{n} ga birinchi yetgan yutadi', you: 'Siz', opp: 'Raqib', goal: '⚽ GOOOL!', respawn: 'Qayta tug‘ilish…', hit: 'Tegdi!', killed: 'Yo‘q qilindi!', pass: 'Navbat o‘tkazildi — yurish yo‘q' },
    ru: { wait_rt: 'Подключаем соперника…', go: 'Поехали!', lost: 'Связь с соперником потеряна…', kills: 'Фраги', first: 'Побеждает первый до {n}', you: 'Вы', opp: 'Соперник', goal: '⚽ ГОООЛ!', respawn: 'Возрождение…', hit: 'Попал!', killed: 'Убит!', pass: 'Пропуск хода — нет ходов' },
    en: { wait_rt: 'Connecting opponent…', go: 'Go!', lost: 'Connection to opponent lost…', kills: 'Frags', first: 'First to {n} wins', you: 'You', opp: 'Opponent', goal: '⚽ GOAL!', respawn: 'Respawning…', hit: 'Hit!', killed: 'Eliminated!', pass: 'Turn passed — no moves' },
  };
  const rt = (k) => (RT_T[L()] || PK('rt') || RT_T.en)[k] || RT_T.en[k] || RT_T.uz[k];
  // umumiy: jonli aloqa — raqibdan ma'lumot kelmay qolsa ogohlantirish
  function rtLink(ctx, onMsg) {
    const st = { last: 0, alive: false };
    return {
      st, recv(d, s) { st.last = performance.now(); st.alive = true; onMsg(d, s); },
      lost() { return st.alive && performance.now() - st.last > 4000; },
    };
  }

  // ---- Futbol 4×4 (jonli, 2 kishi): uy egasi (0) fizikani hisoblaydi, mehmon (1) boshqaruvini yuboradi ----
  MPI.fb4 = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.62);
    const pad = padUI(stage, [{ id: 'shoot', t: '⚽', cls: 'big' }, { id: 'pass', t: '↗️' }]);
    const FW = 68, FH = 105, GW = 18, MATCH = 180, HOST = ctx.me === 0, SPEC = ctx.me < 0, NP = ctx.n || 2, MT = ctx.me < 0 ? 0 : ctx.me % 2;
    const form = [[0, 0.95], [-0.5, 0.75], [0.5, 0.75], [0, 0.58]];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    let pl = [], ball, sc = [0, 0], time = 0, owner = null, ctrl = [null, null], ctrl2 = [null, null], kick = 0, msg = '', msgT = 0, over = false, started = false, cd = 3, endW = null;
    // jamoa = o'rin % 2; har o'rinning kiritishi alohida
    const gin = Array.from({ length: NP }, () => ({ x: 0, y: 0, sh: 0, ps: 0 })), seen = gin.map(() => ({ sh: 0, ps: 0 })); const mine = { sh: 0, ps: 0 };
    const hum = (t) => { const a = []; for (let s = t; s < NP; s += 2) if (!ctx.out?.has(s)) a.push(s); return a; };
    let HU = [hum(0), hum(1)];
    const who = (p) => (p === ctrl[p.team] ? HU[p.team][0] ?? -1 : p === ctrl2[p.team] ? HU[p.team][1] ?? -1 : -1);
    let snap = null, prev = null, snapT = 0;
    const mk = (team, i) => { const [fx, fy] = form[i]; const y = team ? 1 - fy : fy; return { team, i, gk: i === 0, hx: FW / 2 + fx * FW * 0.5, hy: y * FH, x: 0, y: 0, vx: 0, vy: 0, cd: 0, dir: team ? Math.PI / 2 : -Math.PI / 2 }; };
    const kickoff = (to) => {
      pl.forEach((p) => { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; p.cd = 0; });
      ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0, z: 0, vz: 0 }; owner = null; kick = 1;
      const s = pl.find((p) => p.team === to && p.i === 3); s.x = FW / 2; s.y = FH / 2 + (to ? -1.6 : 1.6);
    };
    pl = [0, 1, 2, 3].map((i) => mk(0, i)).concat([0, 1, 2, 3].map((i) => mk(1, i))); kickoff(0); ctrl = [pl[3], pl[7]]; ctrl2 = [pl[2], pl[6]];
    const goalY = (team) => (team ? FH + 1 : -1);
    function strike(p, tx, ty, power, lob) { const dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy) || 1; ball.vx = (dx / d) * power; ball.vy = (dy / d) * power; ball.vz = lob ? 9 : 2.5; owner = null; p.cd = 0.35; snd(240, 0.06, 0.07, 'triangle'); }
    const shootAt = (p, aim) => strike(p, FW / 2 + aim, goalY(p.team), 47, false);
    const bestMate = (p) => { let b = null, bs = -1e9; for (const m of pl) { if (m === p || m.team !== p.team || m.gk) continue; const fwd = p.team ? m.y - p.y : p.y - m.y; const press = Math.min(...pl.filter((o) => o.team !== p.team).map((o) => dist(o, m))); const s = fwd * 0.6 + press * 1.2 - Math.abs(dist(p, m) - 22) * 0.3; if (s > bs) { bs = s; b = m; } } return b; };
    const passTo = (p, m) => strike(p, m.x + m.vx * 0.25, m.y + m.vy * 0.25, Math.min(40, 18 + dist(p, m) * 0.9), dist(p, m) > 30);
    const finish = (w) => { if (over) return; over = true; endW = w; ctx.rt?.send({ t: 'end', w, sc }); setTimeout(() => ctx.over(w), 600); };
    // ---- uy egasi: simulyatsiya ----
    function sim(dt) {
      time += dt; kick = Math.max(0, kick - dt); HU = [hum(0), hum(1)];
      if (time >= MATCH && !over) finish(sc[0] === sc[1] ? ctx.DRAW : sc[0] > sc[1] ? 0 : 1);
      if (NP > 2 && !over) for (const t of [0, 1]) if (!HU[t].length) finish(1 - t); // jamoada odam qolmasa — raqib yutadi
      const inputs = gin.map((q, s) => (s === 0 ? { x: pad.x, y: pad.y, sh: mine.sh, ps: mine.ps } : s % 2 ? { x: -q.x, y: -q.y, sh: q.sh, ps: q.ps } : { ...q })); // 1-jamoa ekrani 180° burilgan
      const kd = keysDown; if (kd.has('arrowleft') || kd.has('a')) inputs[0].x = -1; if (kd.has('arrowright') || kd.has('d')) inputs[0].x = 1; if (kd.has('arrowup') || kd.has('w')) inputs[0].y = -1; if (kd.has('arrowdown') || kd.has('s')) inputs[0].y = 1;
      const press = inputs.map((q, s) => { const r = [q.sh > seen[s].sh, q.ps > seen[s].ps]; seen[s].sh = q.sh; seen[s].ps = q.ps; return r; });
      for (const t of [0, 1]) {
        const two = HU[t].length > 1, fld = pl.filter((p) => p.team === t && !p.gk);
        const pick = (cur, ex) => { const cs = fld.filter((p) => p !== ex).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; return !cur || cur === ex || (cs !== cur && dist(cs, ball) + 2 < dist(cur, ball)) ? cs : cur; };
        if (owner && owner.team === t && !owner.gk && owner !== ctrl2[t]) ctrl[t] = owner; else ctrl[t] = pick(ctrl[t], two ? ctrl2[t] : null);
        if (two) { if (!owner || owner !== ctrl2[t]) ctrl2[t] = pick(ctrl2[t], ctrl[t]); } else ctrl2[t] = null;
      }
      for (const p of pl) {
        p.cd = Math.max(0, p.cd - dt);
        let tx = p.hx, ty = p.hy, spd = 15; const hs = who(p);
        if (hs >= 0) { const inp = inputs[hs]; p.vx += (inp.x * 20 - p.vx) * Math.min(1, dt * 10); p.vy += (inp.y * 20 - p.vy) * Math.min(1, dt * 10); }
        else {
          if (p === owner && !p.gk) { tx = FW / 2; ty = p.team ? FH : 0; spd = 14; } // odamsiz jamoa: to'p bilan darvozaga
          else if (p.gk) { tx = FW / 2 + Math.max(-GW / 2, Math.min(GW / 2, (ball.x - FW / 2) * 0.6)); ty = p.team ? 3 : FH - 3; spd = 13; if (dist(p, ball) < 14 && (p.team ? ball.y < 16 : ball.y > FH - 16)) { tx = ball.x; ty = ball.y; } }
          else { const att = owner ? owner.team === p.team : false; tx = p.hx + (ball.x - FW / 2) * 0.35; ty = p.hy + (ball.y / FH - 0.5) * FH * 0.55 + (att ? (p.team ? 10 : -10) : 0); }
          const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
          const vx = d > 0.6 ? (dx / d) * Math.min(spd, d * 4) : 0, vy = d > 0.6 ? (dy / d) * Math.min(spd, d * 4) : 0;
          p.vx += (vx - p.vx) * Math.min(1, dt * 6); p.vy += (vy - p.vy) * Math.min(1, dt * 6);
        }
        p.x = Math.max(1, Math.min(FW - 1, p.x + p.vx * dt)); p.y = Math.max(-1, Math.min(FH + 1, p.y + p.vy * dt));
        if (Math.hypot(p.vx, p.vy) > 2) p.dir = Math.atan2(p.vy, p.vx);
      }
      for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { const a = pl[i], b = pl[j], d = dist(a, b); if (d < 2.4 && d > 0) { const f = (2.4 - d) / 2; a.x -= ((b.x - a.x) / d) * f; a.y -= ((b.y - a.y) / d) * f; b.x += ((b.x - a.x) / d) * f; b.y += ((b.y - a.y) / d) * f; } }
      if (owner) {
        const a = owner.dir; ball.x = owner.x + Math.cos(a) * 1.6; ball.y = owner.y + Math.sin(a) * 1.6; ball.vx = owner.vx; ball.vy = owner.vy; ball.z = 0;
        const t = owner.team, hs = who(owner), sh = hs >= 0 && press[hs][0], ps = hs >= 0 && press[hs][1];
        if (owner.gk) { if (owner.cd <= 0.05) { const m = bestMate(owner); if (m) passTo(owner, m); } }
        else if (hs < 0) { owner.hold = (owner.hold || 0) + dt; if (Math.abs(owner.y - (t ? FH : 0)) < 24) shootAt(owner, (Math.random() - 0.5) * GW * 0.6); else if (owner.hold > 1.2) { const m = bestMate(owner); if (m) passTo(owner, m); } }
        else if (sh) shootAt(owner, inputs[hs].x * GW * 0.45);
        else if (ps) { const m = bestMate(owner); if (m) passTo(owner, m); }
        for (const p of pl) if (owner && p.team !== owner.team && p.cd <= 0 && dist(p, ball) < 1.9 && Math.random() < dt * (who(p) >= 0 ? 7 : 2.5)) { owner.cd = 0.6; owner = p; p.cd = 0.3; p.hold = 0; snd(500, 0.04, 0.04); break; }
      } else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vz -= 30 * dt; ball.z = Math.max(0, ball.z + ball.vz * dt); if (ball.z === 0) ball.vz = Math.abs(ball.vz) > 4 ? -ball.vz * 0.4 : 0;
        const fr = ball.z > 0 ? 0.995 : Math.pow(0.35, dt); ball.vx *= fr; ball.vy *= fr;
        if (ball.x < 0.5 || ball.x > FW - 0.5) { ball.vx = -ball.vx * 0.7; ball.x = Math.max(0.5, Math.min(FW - 0.5, ball.x)); }
        if (ball.y < 0 || ball.y > FH) {
          if (Math.abs(ball.x - FW / 2) < GW / 2 && ball.z < 3) { const tm = ball.y < 0 ? 0 : 1; sc[tm]++; msg = rt('goal'); msgT = 1.8; snd(1046, 0.4, 0.09); kickoff(1 - tm); }
          else { ball.vy = -ball.vy * 0.6; ball.y = Math.max(0.5, Math.min(FH - 0.5, ball.y)); }
        }
        if (kick <= 0 && ball.z < 1.6) for (const p of pl) { if (p.cd > 0) continue; const d = dist(p, ball), sp = Math.hypot(ball.vx, ball.vy); if (d < (p.gk ? 2.8 : 1.8) && (sp < 34 || (p.gk && Math.random() < 0.6) || Math.random() < 0.3)) { owner = p; p.hold = 0; if (p.gk) { ball.vx = ball.vy = 0; p.cd = 0.5; } break; } }
      }
    }
    // u: har o'rin qaysi futbolchini boshqaradi (n>2)
    const useats = () => Array.from({ length: NP }, (_, s) => { const k = HU[s % 2].indexOf(s); return k === 0 ? pl.indexOf(ctrl[s % 2]) : k === 1 ? pl.indexOf(ctrl2[s % 2]) : -1; });
    const pack = () => ({ t: 's', p: pl.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.dir * 100) / 100]), b: [Math.round(ball.x * 10) / 10, Math.round(ball.y * 10) / 10, Math.round(ball.z * 10) / 10], sc, tm: Math.round(time), c: [pl.indexOf(ctrl[0]), pl.indexOf(ctrl[1])], m: msgT > 0 ? msg : '', cd: Math.max(0, Math.ceil(cd)), ...(NP > 2 ? { u: useats() } : {}) });
    const link = rtLink(ctx, (d, s) => {
      if (HOST) { if (d.t === 'i' && s > 0 && s < NP) { const q = gin[s]; q.x = +d.x || 0; q.y = +d.y || 0; q.sh = d.sh | 0; q.ps = d.ps | 0; } return; }
      if (d.t === 's') { prev = snap; snap = d; snapT = performance.now(); if (d.m && d.m !== msg) { msg = d.m; msgT = 1.8; snd(1046, 0.3, 0.07); } sc = d.sc; time = d.tm; }
      if (d.t === 'end' && !over) { over = true; endW = d.w; sc = d.sc || sc; setTimeout(() => ctx.over(d.w), 600); }
    });
    ctx.turn(-1, rt('wait_rt'));
    let sendT = 0, hiT = 0;
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (pad.take('shoot') || keysDown.has(' ')) mine.sh++; if (pad.take('pass') || keysDown.has('x')) mine.ps++;
      sendT += dt; hiT += dt;
      if (HOST) {
        if (!started && link.st.alive) { started = true; ctx.turn(-1, '⚽ ' + gname(mpMeta('fb4'))); }
        if (started) { if (cd > 0) cd -= dt; else if (!over) sim(dt); }
        if (sendT > 0.066) { sendT = 0; ctx.rt?.send(over && endW != null ? { t: 'end', w: endW, sc } : pack()); } // tugagach 'end' qayta yuboriladi (paket yo'qolsa ham)
      } else if (!SPEC) {
        let x = pad.x, y = pad.y; const kd = keysDown; if (kd.has('arrowleft') || kd.has('a')) x = -1; if (kd.has('arrowright') || kd.has('d')) x = 1; if (kd.has('arrowup') || kd.has('w')) y = -1; if (kd.has('arrowdown') || kd.has('s')) y = 1;
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, sh: mine.sh, ps: mine.ps }); }
        if (snap && !started) { started = true; ctx.turn(-1, gname(mpMeta('fb4'))); }
      }
      // ko'rinish: har kim o'z jamoasini pastda ko'radi (1-jamoa uchun maydon 180° buriladi)
      const flip = MT === 1;
      let P, B, C2, CD, U;
      if (HOST) { P = pl.map((p) => [p.x, p.y, p.dir]); B = [ball.x, ball.y, ball.z]; C2 = [pl.indexOf(ctrl[0]), pl.indexOf(ctrl[1])]; CD = Math.ceil(cd); if (NP > 2) U = useats(); }
      else if (snap) {
        const k = prev ? Math.min(1, (performance.now() - snapT) / 66) : 1, lerp = (a, b) => (prev ? a + (b - a) * k : b);
        P = snap.p.map((q, i) => [lerp(prev?.p[i][0] ?? q[0], q[0]), lerp(prev?.p[i][1] ?? q[1], q[1]), q[2]]);
        B = [lerp(prev?.b[0] ?? snap.b[0], snap.b[0]), lerp(prev?.b[1] ?? snap.b[1], snap.b[1]), snap.b[2]]; C2 = snap.c; CD = snap.cd; U = snap.u;
      }
      const k = W / (FW + 8), ox = 4 * k, oy = (H - FH * k) / 2;
      const X = (x) => ox + (flip ? FW - x : x) * k, Y = (y) => oy + (flip ? FH - y : y) * k;
      g.fillStyle = '#14532D'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#16A34A' : '#15803D'; g.fillRect(ox, oy + (FH / 10) * i * k, FW * k, (FH / 10) * k + 1); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.strokeRect(ox, oy, FW * k, FH * k);
      g.beginPath(); g.moveTo(ox, oy + (FH / 2) * k); g.lineTo(ox + FW * k, oy + (FH / 2) * k); g.stroke(); g.beginPath(); g.arc(ox + (FW / 2) * k, oy + (FH / 2) * k, 9 * k, 0, 7); g.stroke();
      for (const t of [0, 1]) { const y0 = t ? oy + (FH - 16) * k : oy; g.strokeRect(ox + (FW / 2 - 20) * k, y0, 40 * k, 16 * k); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(ox + (FW / 2 - GW / 2) * k, t ? oy + FH * k : oy - 3 * k, GW * k, 3 * k); }
      if (P) {
        P.forEach((q, i) => {
          const team = i < 4 ? 0 : 1, gk = i % 4 === 0, x = X(q[0]), y = Y(q[1]), r = 1.55 * k, myTeam = team === MT;
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 2, y + 3, r, r * 0.6, 0, 0, 7); g.fill();
          if (NP > 2 && U) { const ss = U.indexOf(i); if (ss >= 0) { g.strokeStyle = ss === ctx.me ? '#FDE047' : ctx.col?.[ss] || '#fff'; g.lineWidth = ss === ctx.me ? 3.5 : 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); text(g, (ctx.names?.[ss] || '').slice(0, 8), x, y - r - 11, 10, ss === ctx.me ? '#FDE047' : '#fff'); } }
          else if (C2 && C2[team] === i) { g.strokeStyle = myTeam ? '#FDE047' : '#FCA5A5'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); }
          g.fillStyle = gk ? (team ? '#F59E0B' : '#22D3EE') : team ? '#DC2626' : '#2563EB'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
          const dd = (flip ? Math.PI : 0) + q[2]; g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x + Math.cos(dd) * r * 0.25, y + Math.sin(dd) * r * 0.25, r * 0.5, 0, 7); g.fill();
        });
        const bx = X(B[0]), by = Y(B[1]) - B[2] * k * 0.6, br = 0.9 * k * (1 + B[2] * 0.05);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X(B[0]) + 1, Y(B[1]) + 2, br, br * 0.6, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(bx, by, br * 0.4, 0, 7); g.fill();
      }
      const myS = sc[MT], opS = sc[1 - MT];
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W / 2 - 92, 6, 184, 30, 15); g.fill();
      text(g, `${MT === 1 ? '🔴' : '🔵'} ${myS} : ${opS} ${MT === 1 ? '🔵' : '🔴'}`, W / 2 - 22, 21, 15); text(g, `${Math.min(90, Math.floor((time / MATCH) * 90))}'`, W / 2 + 62, 21, 13, '#FDE047');
      if (NP > 2) [MT, 1 - MT].forEach((t, j) => { let n = 0; for (let s = t; s < NP; s += 2) { const dx = W / 2 - 22 + (j ? 1 : -1) * (14 + n++ * 12); g.globalAlpha = ctx.out?.has(s) ? 0.3 : 1; g.fillStyle = ctx.col?.[s] || '#fff'; g.beginPath(); g.arc(dx, 43, 4.5, 0, 7); g.fill(); if (s === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } g.globalAlpha = 1; } });
      if (!started) text(g, rt('wait_rt'), W / 2, H / 2, 18);
      else if (CD > 0) text(g, String(CD), W / 2, H / 2, 64, '#FDE047');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H / 2 - 40, 34); }
      if (NP > 2 && over && endW != null) text(g, endW === ctx.DRAW ? '🤝' : `${endW ? '🔴🔴' : '🔵🔵'} 🏆`, W / 2, H / 2 + 20, 30);
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.7, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), quit: () => { HU = [hum(0), hum(1)]; }, stop, resize: fit };
  };

  // ---- Strike duel (jonli 1×1, raycasting 3D): har kim o'z harakatini hisoblaydi, tegish raqibga yuboriladi ----
  MPI.duel = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const MAP = ['################', '#......#.......#', '#.##...#..###..#', '#.#.......#....#', '#.#..##...#.##.#', '#....#.........#', '###..#..####...#', '#.......#......#', '#..##...#..##..#', '#...#......#...#', '#...#..##..#...#', '#.......##.....#', '#.###......###.#', '#...#..#.......#', '#......#...#...#', '################'];
    const N = 16, wall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || MAP[y | 0][x | 0] === '#';
    const pad = padUI(stage, [{ id: 'fire', t: '🔫', cls: 'big' }, { id: 'reload', t: '🔄' }]);
    // n>2: hamma hammaga qarshi (FFA) — har kim o'z holatini hammaga yuboradi, tegish nishonga yuboriladi
    const NP = Math.max(2, ctx.n | 0), FFA = NP > 2, COL = ctx.col || ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'];
    const WIN = 5, SPAWN = [[1.5, 1.5, 0.8], [14.5, 14.5, 3.9], [14.5, 1.5, 2.4], [1.5, 14.5, -0.86]];
    const me = Math.max(0, ctx.me);
    let P = { x: SPAWN[me][0], y: SPAWN[me][1], a: SPAWN[me][2], hp: 100, dead: 0 }, O = null, Oprev = null, OT = 0;
    const OS = {}, gone = new Set(); // FFA: boshqa o'yinchilar {cur, prev, T, fl, f}
    let frags = Array(NP).fill(0), ammo = 20, reloadT = 0, fireT = 0, flash = 0, hurt = 0, hitMk = 0, oFlash = 0, oFire = 0, fireN = 0, msg = '', msgT = 0, over = false, look = null, lookX = 0, started = false;
    c.addEventListener('pointerdown', (e) => { look = e.pointerId; lookX = e.clientX; });
    c.addEventListener('pointermove', (e) => { if (look === e.pointerId) { P.a += (e.clientX - lookX) * 0.0065; lookX = e.clientX; } });
    const lu = (e) => { if (look === e.pointerId) look = null; }; c.addEventListener('pointerup', lu); c.addEventListener('pointercancel', lu);
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 6); for (let i = 1; i < n; i++) if (wall(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false; return true; };
    const foes = () => (FFA ? Object.keys(OS).map(Number).filter((s) => !gone.has(s) && OS[s].cur && !OS[s].cur.dead).map((s) => ({ s, ...OS[s].cur })) : O && !O.dead ? [{ s: 1 - me, ...O }] : []);
    const respawn = () => { const fs = FFA ? foes() : O ? [O] : [], far = SPAWN.slice(0, 2).concat([[1.5, 14.5, 0], [14.5, 1.5, 3.1], [7.5, 7.5, 0]]).filter((s) => fs.every((o) => Math.hypot(s[0] - o.x, s[1] - o.y) > 6)); const s = far[ri(far.length)] || SPAWN[me]; Object.assign(P, { x: s[0], y: s[1], a: s[2], hp: 100, dead: 0 }); ammo = 20; reloadT = 0; };
    // FFA: frag hisoblari faqat o'sadi — max bilan birlashtiriladi; WIN ga yetgan birinchi g'olib
    const chkWin = () => { if (over) return; const w = frags.findIndex((f, s) => f >= WIN && !gone.has(s)); if (w >= 0) { over = true; ctx.rt?.send({ t: 'end', w, fr: frags }); setTimeout(() => ctx.over(w), 800); } };
    const link = rtLink(ctx, (d, s) => {
      if (FFA) {
        if (!Number.isInteger(s) || s < 0 || s >= NP || gone.has(s)) return;
        if (d.t === 'p') { const o = OS[s] || (OS[s] = { cur: null, prev: null, T: 0, fl: 0, f: 0 }); o.prev = o.cur; o.cur = d; o.T = performance.now(); if (d.f > o.f) { o.f = d.f; o.fl = 0.08; snd(160, 0.07, 0.04, 'square'); } if (Array.isArray(d.fr)) d.fr.forEach((v, i) => { if (i < NP) frags[i] = Math.max(frags[i], v | 0); }); chkWin(); }
        if (d.t === 'hit' && !P.dead && !over && ctx.me >= 0) { P.hp -= d.dmg | 0; hurt = 0.4; snd(120, 0.15, 0.07, 'sawtooth'); if (P.hp <= 0) { P.dead = 2.5; frags[s]++; ctx.rt?.send({ t: 'die', by: s }); msg = rt('killed') + ' — ' + (ctx.names?.[s] || ''); msgT = 2; chkWin(); } }
        if (d.t === 'die') { const by = d.by | 0; if (by >= 0 && by < NP) { frags[by]++; if (by === me && ctx.me >= 0) { msg = '💀 +1'; msgT = 1.5; snd(700, 0.2, 0.07); } chkWin(); } }
        if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 800); }
        return;
      }
      if (d.t === 'p') { Oprev = O; O = d; OT = performance.now(); if (d.f > oFire) { oFire = d.f; oFlash = 0.08; snd(160, 0.07, 0.04, 'square'); } frags[1 - me] = Math.max(frags[1 - me], d.k | 0); }
      if (d.t === 'hit' && !P.dead && !over) { P.hp -= d.dmg | 0; hurt = 0.4; snd(120, 0.15, 0.07, 'sawtooth'); if (P.hp <= 0) { P.dead = 2.5; ctx.rt?.send({ t: 'die' }); msg = rt('killed'); msgT = 2; } }
      if (d.t === 'die') { frags[me]++; msg = '💀 +1'; msgT = 1.5; snd(700, 0.2, 0.07); if (frags[me] >= WIN && !over) { over = true; ctx.rt?.send({ t: 'end', w: me, fr: frags }); setTimeout(() => ctx.over(me), 800); } }
      if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 800); }
    });
    function shoot() {
      if (reloadT > 0 || fireT > 0 || P.dead || over) return;
      if (ammo <= 0) { reloadT = 1.3; return; }
      ammo--; fireT = 0.16; flash = 0.06; fireN++; snd(140, 0.09, 0.09, 'square'); snd(90, 0.12, 0.06, 'sawtooth');
      let best = null;
      for (const o of foes()) {
        const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); let da = Math.atan2(dy, dx) - P.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < Math.max(0.045, 0.3 / d) && los(P.x, P.y, o.x, o.y) && (!best || d < best.d)) best = { s: o.s, d, head: Math.abs(da) < 0.12 / d };
      }
      if (best) { const dmg = best.head ? 50 : 25; if (FFA) ctx.rt?.send({ t: 'hit', dmg }, best.s); else ctx.rt?.send({ t: 'hit', dmg }); hitMk = 0.25; msg = best.head ? '🎯 ' + rt('hit') : rt('hit'); msgT = 0.5; }
      if (ammo === 0) reloadT = 1.3;
    }
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    let sendT = 0; const ZB = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      sendT += dt; if (link.st.alive && !started) { started = true; msg = rt('go'); msgT = 1.2; }
      if (P.dead) { P.dead -= dt; if (P.dead <= 0) respawn(); }
      else if (started && !over) {
        let mx = pad.x, my = pad.y; const kd = keysDown;
        if (kd.has('w') || kd.has('arrowup')) my = -1; if (kd.has('s') || kd.has('arrowdown')) my = 1; if (kd.has('a')) mx = -1; if (kd.has('d')) mx = 1;
        if (kd.has('arrowleft')) P.a -= dt * 2.4; if (kd.has('arrowright')) P.a += dt * 2.4;
        const sp = 3.1 * dt, ca = Math.cos(P.a), sa = Math.sin(P.a); const vx = (-my * ca - mx * sa) * sp, vy = (-my * sa + mx * ca) * sp;
        if (!wall(P.x + vx + Math.sign(vx) * 0.2, P.y)) P.x += vx; if (!wall(P.x, P.y + vy + Math.sign(vy) * 0.2)) P.y += vy;
        if (pad.b.fire || kd.has(' ')) shoot();
        if (pad.take('reload') && ammo < 20 && reloadT <= 0) reloadT = 1.3;
      }
      if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) ammo = 20; }
      fireT -= dt;
      if (sendT > 0.05 && ctx.me >= 0) { sendT = 0; ctx.rt?.send({ t: 'p', x: Math.round(P.x * 100) / 100, y: Math.round(P.y * 100) / 100, a: Math.round(P.a * 100) / 100, hp: Math.max(0, Math.round(P.hp)), dead: P.dead > 0 ? 1 : 0, f: fireN, k: frags[me], ...(FFA ? { fr: frags } : {}) }); }
      ctx.turn(-1, FFA ? `❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo} · ${rt('kills')} ${frags[me]}/${WIN}` : `❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo} · ${rt('you')} ${frags[me]} : ${frags[1 - me]} ${rt('opp')}`);
      // ---- render ----
      const hz = H / 2;
      let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#0EA5E9'); gr.addColorStop(1, '#BAE6FD'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
      gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#A8A29E'); gr.addColorStop(1, '#44403C'); g.fillStyle = gr; g.fillRect(0, hz, W, hz);
      const FOV = 1.05, cols = Math.ceil(W / 2), dirx = Math.cos(P.a), diry = Math.sin(P.a), plx = -diry * Math.tan(FOV / 2), ply = dirx * Math.tan(FOV / 2);
      for (let i = 0; i < cols; i++) {
        const cam = (2 * i) / cols - 1, rx = dirx + plx * cam, ry = diry + ply * cam;
        let mx = P.x | 0, my = P.y | 0; const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry); let sxs, sys, sdx, sdy, side = 0;
        if (rx < 0) { sxs = -1; sdx = (P.x - mx) * ddx; } else { sxs = 1; sdx = (mx + 1 - P.x) * ddx; }
        if (ry < 0) { sys = -1; sdy = (P.y - my) * ddy; } else { sys = 1; sdy = (my + 1 - P.y) * ddy; }
        for (let k = 0; k < 64; k++) { if (sdx < sdy) { sdx += ddx; mx += sxs; side = 0; } else { sdy += ddy; my += sys; side = 1; } if (wall(mx, my)) break; }
        const pd = side ? sdy - ddy : sdx - ddx; ZB[i] = pd;
        const lh = H / Math.max(0.05, pd), y0 = hz - lh / 2; let wx = side ? P.x + pd * rx : P.y + pd * ry; wx -= Math.floor(wx);
        const br = Math.max(0.22, 1 - pd / 14) * (side ? 0.78 : 1), crate = (mx + my) % 3 === 0;
        const base = crate ? [150, 120, 70] : ((wx * 4) | 0) % 2 === 0 ? [120, 128, 140] : [108, 116, 128];
        g.fillStyle = `rgb(${base[0] * br | 0},${base[1] * br | 0},${base[2] * br | 0})`; g.fillRect(i * 2, y0, 2.2, lh);
        g.fillStyle = `rgba(0,0,0,${0.2 * br})`; for (let r = 1; r < 4; r++) g.fillRect(i * 2, y0 + (lh / 4) * r, 2.2, Math.max(1, lh / 90));
      }
      // raqib(lar) (oraliq holat bilan silliq); FFA: uzoqdan yaqinga, o'rin rangida
      const spr = [];
      if (FFA) { for (const k in OS) { const s = +k, o = OS[s]; if (gone.has(s) || s === ctx.me || !o.cur || o.cur.dead) continue; const kk = o.prev ? Math.min(1, (performance.now() - o.T) / 50) : 1; spr.push({ x: o.prev ? o.prev.x + (o.cur.x - o.prev.x) * kk : o.cur.x, y: o.prev ? o.prev.y + (o.cur.y - o.prev.y) * kk : o.cur.y, hp: o.cur.hp, fl: o.fl > 0, col: COL[s], nm: ctx.names?.[s] || rt('opp') }); if (o.fl > 0) o.fl -= dt; } }
      else if (O && !O.dead) { const kk = Oprev ? Math.min(1, (performance.now() - OT) / 50) : 1; spr.push({ x: Oprev ? Oprev.x + (O.x - Oprev.x) * kk : O.x, y: Oprev ? Oprev.y + (O.y - Oprev.y) * kk : O.y, hp: O.hp, fl: oFlash > 0, col: ctx.me === 0 ? '#DC2626' : '#2563EB', nm: ctx.names?.[1 - me] || rt('opp') }); }
      spr.sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y));
      for (const sp of spr) {
        const dx = sp.x - P.x, dy = sp.y - P.y; const inv = 1 / (plx * diry - dirx * ply), tx = inv * (diry * dx - dirx * dy), ty = inv * (-ply * dx + plx * dy);
        if (ty > 0.2) {
          const scx = (W / 2) * (1 + tx / ty), sh = H / ty, col = Math.floor(scx / 2);
          if (col >= 0 && col < cols && ZB[col] >= ty) {
            const w = sh * 0.42, top = hz - sh * 0.38, bob = Math.sin(performance.now() / 110) * sh * 0.01, red = sp.col;
            g.fillStyle = red; rr(g, scx - w / 2, top + sh * 0.22 + bob, w, sh * 0.42, w * 0.18); g.fill();
            g.fillStyle = '#1F2937'; g.fillRect(scx - w * 0.35, top + sh * 0.62 + bob, w * 0.28, sh * 0.25); g.fillRect(scx + w * 0.07, top + sh * 0.62 + bob, w * 0.28, sh * 0.25);
            g.fillStyle = '#FCD34D'; g.beginPath(); g.arc(scx, top + sh * 0.13 + bob, w * 0.26, 0, 7); g.fill(); g.fillStyle = '#111827'; g.fillRect(scx - w * 0.28, top + sh * 0.06 + bob, w * 0.56, w * 0.12);
            g.fillStyle = '#374151'; g.fillRect(scx - w * 0.05, top + sh * 0.35 + bob, w * 0.62, w * 0.12);
            if (sp.fl) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(scx + w * 0.6, top + sh * 0.36 + bob, w * 0.16, 0, 7); g.fill(); }
            const bw = Math.max(30, w); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(scx - bw / 2, top - 10, bw, 5); g.fillStyle = '#22C55E'; g.fillRect(scx - bw / 2, top - 10, bw * Math.max(0, sp.hp) / 100, 5);
            text(g, sp.nm, scx, top - 20, 12, FFA ? sp.col : undefined);
          }
        }
      }
      if (oFlash > 0) oFlash -= dt;
      const bob = Math.sin(performance.now() / 120) * (Math.abs(pad.x) + Math.abs(pad.y) > 0.1 ? 4 : 0.8), kick = fireT > 0 ? 8 : 0, gx = W * 0.62, gy = H - 10 + bob + kick;
      g.fillStyle = '#1F2937'; g.beginPath(); g.moveTo(gx - 30, gy); g.lineTo(gx - 8, gy - 120); g.lineTo(gx + 14, gy - 120); g.lineTo(gx + 40, gy); g.fill();
      g.fillStyle = '#4B5563'; g.fillRect(gx - 4, gy - 150, 14, 40); g.fillStyle = '#92400E'; g.beginPath(); g.moveTo(gx + 10, gy); g.lineTo(gx + 26, gy - 60); g.lineTo(gx + 50, gy - 50); g.lineTo(gx + 46, gy); g.fill();
      if (flash > 0) { flash -= dt; g.fillStyle = '#FDE047'; g.beginPath(); g.arc(gx + 3, gy - 158, 18, 0, 7); g.fill(); }
      g.strokeStyle = hitMk > 0 ? '#EF4444' : '#22C55E'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 12, hz); g.lineTo(W / 2 - 4, hz); g.moveTo(W / 2 + 4, hz); g.lineTo(W / 2 + 12, hz); g.moveTo(W / 2, hz - 12); g.lineTo(W / 2, hz - 4); g.moveTo(W / 2, hz + 4); g.lineTo(W / 2, hz + 12); g.stroke();
      if (hitMk > 0) { hitMk -= dt; g.beginPath(); g.moveTo(W / 2 - 9, hz - 9); g.lineTo(W / 2 - 4, hz - 4); g.moveTo(W / 2 + 9, hz - 9); g.lineTo(W / 2 + 4, hz - 4); g.moveTo(W / 2 - 9, hz + 9); g.lineTo(W / 2 - 4, hz + 4); g.moveTo(W / 2 + 9, hz + 9); g.lineTo(W / 2 + 4, hz + 4); g.stroke(); }
      const ms = 5; g.globalAlpha = 0.75; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = MAP[y][x] === '#' ? '#1F2937' : '#E5E7EB'; g.fillRect(8 + x * ms, 8 + y * ms, ms, ms); }
      g.fillStyle = '#16A34A'; g.fillRect(8 + P.x * ms - 2, 8 + P.y * ms - 2, 4, 4); g.globalAlpha = 1;
      if (FFA) { // ixcham hisob qatori: o'rin rangidagi nuqta + frag, o'zimniki sariq halqa
        const cw = 44, bw = NP * cw + 12, bx = W / 2 - bw / 2; g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, bx, 8, bw, 28, 14); g.fill();
        for (let s = 0; s < NP; s++) { const x = bx + 6 + s * cw + 12; g.globalAlpha = gone.has(s) ? 0.35 : 1; g.fillStyle = COL[s]; g.beginPath(); g.arc(x, 22, 6, 0, 7); g.fill(); if (s === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x, 22, 8.5, 0, 7); g.stroke(); } text(g, String(frags[s]), x + 17, 22, 15); g.globalAlpha = 1; }
      } else { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W / 2 - 60, 8, 120, 28, 14); g.fill(); text(g, `${frags[me]} : ${frags[1 - me]}`, W / 2, 22, 16); }
      if (reloadT > 0) text(g, '🔄…', W / 2, hz + 40, 16, '#FDE047');
      if (hurt > 0) { hurt -= dt; g.fillStyle = `rgba(220,38,38,${hurt})`; g.fillRect(0, 0, W, H); }
      if (P.dead > 0) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, W, H); text(g, rt('respawn') + ' ' + Math.ceil(P.dead), W / 2, hz, 22); }
      if (!started) text(g, rt('wait_rt'), W / 2, hz - 50, 18);
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, hz - 60, 26); }
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.72, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), stop, resize: fit, quit: (s) => { gone.add(s); delete OS[s]; } };
  };

  // ---- Havo xokkeyi (jonli): uy egasi shaybani hisoblaydi ----
  MPI.hockey = (stage, ctx) => {
    const { c, g, fit } = canvasIn(stage, 0.6);
    const TW = 1, TH = 1.65, GOAL = 0.34, MR = 0.075, PR = 0.045, WIN = 7, HOST = ctx.me === 0, NP = ctx.n || 2, MS = Math.max(0, ctx.me), MT = MS % 2, flip = MT === 1;
    // n>2: jamoa = o'rin % 2, har kishining o'z shaybasi (to'qmoq) o'z yarmida
    const two = (t) => (t === 0 ? NP >= 3 : NP >= 4), home = (s) => ({ x: two(s % 2) ? (s < 2 ? 0.3 : 0.7) : 0.5, y: s % 2 ? 0.18 : TH - 0.18, vx: 0, vy: 0 });
    let puck = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }, m = Array.from({ length: NP }, (_, s) => home(s)), sc = [0, 0], over = false, started = false, msg = '', msgT = 0, serveT = 1, endW = null;
    let target = null, snap = null, prevS = null, snapT = 0; const gone = new Set();
    const toWorld = (px, py) => { const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2; let x = (px - ox) / s, y = (py - oy) / s; if (flip) { x = TW - x; y = TH - y; } return [x, y]; };
    const clampM = (o, seat) => { o.x = Math.max(MR, Math.min(TW - MR, o.x)); o.y = seat % 2 === 0 ? Math.max(TH / 2 + MR, Math.min(TH - MR, o.y)) : Math.max(MR, Math.min(TH / 2 - MR, o.y)); };
    const onPt = (e) => { if (ctx.me < 0) return; const [x, y] = toWorld(...pos(c, e)); target = { x, y }; };
    c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
    const reset = (towards) => { puck = { x: 0.5, y: TH / 2 + (towards === 0 ? 0.12 : -0.12), vx: 0, vy: 0 }; serveT = 0.8; };
    const finish = (w) => { if (over) return; over = true; endW = w; ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 600); };
    const link = rtLink(ctx, (d, sd) => {
      if (d.t === 'm' && (HOST || NP > 2) && sd > 0 && sd < NP && sd !== ctx.me) { const o = m[sd], nx = +d.x, ny = +d.y; o.vx = (nx - o.x) * 30; o.vy = (ny - o.y) * 30; o.x = nx; o.y = ny; clampM(o, sd); }
      if (!HOST && d.t === 's') { prevS = snap; snap = d; snapT = performance.now(); if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(880, 0.3, 0.08); msg = '🥅'; msgT = 1; } sc = d.sc; m[0].x = d.m[0]; m[0].y = d.m[1]; }
      if (d.t === 'end' && !over) { over = true; endW = d.w; setTimeout(() => ctx.over(d.w), 600); }
    });
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    let sendT = 0;
    const stop = loop((dt) => {
      const mine = m[MS];
      if (target && ctx.me >= 0) { const nx = mine.x + (target.x - mine.x) * Math.min(1, dt * 22), ny = mine.y + (target.y - mine.y) * Math.min(1, dt * 22); mine.vx = (nx - mine.x) / dt; mine.vy = (ny - mine.y) / dt; mine.x = nx; mine.y = ny; clampM(mine, MS); }
      sendT += dt; if (link.st.alive) started = true;
      if (HOST && started && !over) {
        if (NP > 2) for (const t of [0, 1]) { let any = false; for (let s = t; s < NP; s += 2) if (!gone.has(s)) any = true; if (!any) finish(1 - t); } // jamoada odam qolmasa — raqib yutadi
        if (serveT > 0) serveT -= dt;
        else for (let st = 0; st < 3; st++) {
          const h = dt / 3; puck.x += puck.vx * h; puck.y += puck.vy * h; puck.vx *= Math.pow(0.6, h); puck.vy *= Math.pow(0.6, h);
          if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx) * 0.9; snd(300, 0.03, 0.03); } if (puck.x > TW - PR) { puck.x = TW - PR; puck.vx = -Math.abs(puck.vx) * 0.9; snd(300, 0.03, 0.03); }
          const inG = Math.abs(puck.x - TW / 2) < GOAL / 2;
          if (puck.y < PR && !inG) { puck.y = PR; puck.vy = Math.abs(puck.vy) * 0.9; } if (puck.y > TH - PR && !inG) { puck.y = TH - PR; puck.vy = -Math.abs(puck.vy) * 0.9; }
          if (puck.y < -PR || puck.y > TH + PR) { const s = puck.y < 0 ? 0 : 1; sc[s]++; snd(880, 0.3, 0.08); msg = '🥅'; msgT = 1; reset(1 - s); if (sc[s] >= WIN) finish(s); break; }
          m.forEach((o, i) => { if (gone.has(i)) return; const dx = puck.x - o.x, dy = puck.y - o.y, d = Math.hypot(dx, dy); if (d < MR + PR && d > 0) { const nx = dx / d, ny = dy / d; puck.x = o.x + nx * (MR + PR); puck.y = o.y + ny * (MR + PR); const rv = (puck.vx - o.vx) * nx + (puck.vy - o.vy) * ny; if (rv < 0) { puck.vx -= 1.9 * rv * nx; puck.vy -= 1.9 * rv * ny; } const sp = Math.hypot(puck.vx, puck.vy); if (sp > 3.2) { puck.vx *= 3.2 / sp; puck.vy *= 3.2 / sp; } snd(500, 0.03, 0.05); } });
        }
        if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', p: [Math.round(puck.x * 1000) / 1000, Math.round(puck.y * 1000) / 1000], m: [Math.round(m[0].x * 1000) / 1000, Math.round(m[0].y * 1000) / 1000], sc, ...(NP > 2 ? { M: m.map((o) => [Math.round(o.x * 1000) / 1000, Math.round(o.y * 1000) / 1000]) } : {}) }); }
      } else if (HOST && over && endW != null && sendT > 0.1) { sendT = 0; ctx.rt?.send({ t: 'end', w: endW }); // 'end' qayta yuboriladi
      } else if (!HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'm', x: Math.round(mine.x * 1000) / 1000, y: Math.round(mine.y * 1000) / 1000 }); }
      if (!HOST && snap) { const k = prevS ? Math.min(1, (performance.now() - snapT) / 33) : 1; puck.x = prevS ? prevS.p[0] + (snap.p[0] - prevS.p[0]) * k : snap.p[0]; puck.y = prevS ? prevS.p[1] + (snap.p[1] - prevS.p[1]) * k : snap.p[1]; if (ctx.me < 0 && snap.M) snap.M.forEach((q, i) => { m[i].x = q[0]; m[i].y = q[1]; }); }
      // chizish
      const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2;
      const X = (x) => ox + (flip ? TW - x : x) * s, Y = (y) => oy + (flip ? TH - y : y) * s;
      g.clearRect(0, 0, c.W, c.H); g.fillStyle = '#E0F2FE'; rr(g, ox, oy, TW * s, TH * s, 26); g.fill(); g.strokeStyle = '#0EA5E9'; g.lineWidth = 5; g.stroke();
      g.strokeStyle = 'rgba(225,29,72,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox, oy + (TH / 2) * s); g.lineTo(ox + TW * s, oy + (TH / 2) * s); g.stroke(); g.beginPath(); g.arc(ox + (TW / 2) * s, oy + (TH / 2) * s, 0.14 * s, 0, 7); g.stroke();
      g.fillStyle = '#0F172A'; g.fillRect(ox + (TW / 2 - GOAL / 2) * s, oy - 4, GOAL * s, 8); g.fillRect(ox + (TW / 2 - GOAL / 2) * s, oy + TH * s - 4, GOAL * s, 8);
      const disc = (x, y, r, col, ring) => { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(X(x) + 3, Y(y) + 4, r * s, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X(x), Y(y), r * s, 0, 7); g.fill(); if (ring) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(X(x), Y(y), r * s * 0.45, 0, 7); g.fill(); } };
      disc(puck.x, puck.y, PR, '#111827');
      m.forEach((o, i) => { if (gone.has(i)) return; disc(o.x, o.y, MR, i % 2 ? '#E11D48' : '#2563EB', NP <= 2);
        if (NP > 2) { g.fillStyle = ctx.col?.[i] || '#fff'; g.beginPath(); g.arc(X(o.x), Y(o.y), MR * s * 0.42, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.stroke(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 4; g.beginPath(); g.arc(X(o.x), Y(o.y), MR * s + 4, 0, 7); g.stroke(); } } });
      const my = sc[MT], op = sc[1 - MT];
      text(g, `${my}`, c.W - 24, c.H / 2 + 26, 26, '#0F172A'); text(g, `${op}`, c.W - 24, c.H / 2 - 26, 26, '#94A3B8');
      if (NP > 2) [MT, 1 - MT].forEach((t, j) => { let n = 0; for (let sd = t; sd < NP; sd += 2) { const yy = c.H / 2 + (j ? -1 : 1) * (52 + n++ * 13); g.globalAlpha = gone.has(sd) ? 0.3 : 1; g.fillStyle = ctx.col?.[sd] || '#000'; g.beginPath(); g.arc(c.W - 24, yy, 5, 0, 7); g.fill(); if (sd === ctx.me) { g.strokeStyle = '#CA8A04'; g.lineWidth = 2; g.stroke(); } g.globalAlpha = 1; } });
      if (!started) text(g, rt('wait_rt'), c.W / 2, c.H / 2 - 40, 16, '#0F172A');
      if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, c.H / 2, 40, '#0F172A'); }
      if (NP > 2 && over && endW != null) text(g, `${endW ? '🔴🔴' : '🔵🔵'} 🏆`, c.W / 2, c.H / 2 + 50, 30, '#0F172A');
      if (link.lost() && !over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#E11D48');
    });
    if (!HOST && ctx.me >= 0) m[MS].y = MT ? 0.18 : TH - 0.18;
    return { apply: () => false, rt: (sd, d) => link.recv(d, sd), quit: (sd) => { gone.add(sd); }, stop, resize: fit };
  };

  // ---- Reversi (8×8, navbatma-navbat) ----
  MPI.reversi = (stage, ctx) => {
    const N = 8, NP = ctx.n || 2, MULTI = NP > 2; const cv = boardCanvas(stage, N, MULTI ? 8 / 9 : 1); const { c, g } = cv; // n>2: tepada hisob qatori uchun joy
    // n>2 (Rolit): markazda o'rinlar rangi (soat yo'nalishida 0,1,2,3); n=3 da 35-katak bo'sh qoladi
    const b = Array(N * N).fill(-1); if (MULTI) { [27, 28, 36, 35].slice(0, NP).forEach((k, i) => (b[k] = i)); } else { b[27] = b[36] = 1; b[28] = b[35] = 0; } let turn = 0, done = false, lastI = -1;
    const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const flips = (i, sd) => { if (b[i] !== -1) return []; const x0 = i % N, y0 = (i / N) | 0, out = []; for (const [dx, dy] of D8) { const L = []; let x = x0 + dx, y = y0 + dy; while (x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] !== -1 && b[y * N + x] !== sd) { L.push(y * N + x); x += dx; y += dy; } if (L.length && x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === sd) out.push(...L); } return out; };
    const adj = (i) => b[i] === -1 && D8.some(([dx, dy]) => { const x = (i % N) + dx, y = ((i / N) | 0) + dy; return x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] !== -1; });
    const flank = (sd) => b.map((_, i) => i).filter((i) => flips(i, sd).length);
    // Rolit: qisib olish imkoni bo'lmasa — istalgan toshga yondosh bo'sh katakka qo'yish mumkin
    const moves = (sd) => { const f = flank(sd); return f.length || !MULTI ? f : b.map((_, i) => i).filter(adj); };
    const cnt = (s) => b.filter((v) => v === s).length;
    const finish = () => {
      done = true; if (!MULTI) { const n0 = cnt(0), n1 = cnt(1); return ctx.over(n0 === n1 ? 2 : n0 > n1 ? 0 : 1); }
      const sc = Array.from({ length: NP }, (_, i) => (ctx.out?.has(i) ? -1 : cnt(i))); const mx = Math.max(...sc), top = sc.map((v, i) => (v === mx ? i : -1)).filter((i) => i >= 0); ctx.over(top.length > 1 ? ctx.DRAW : top[0]);
    };
    c.addEventListener('pointerdown', (e) => { if (done || turn !== ctx.me) return; const p = cv.cell(e); if (!p) return; const i = p[1] * N + p[0]; if (moves(ctx.me).includes(i)) ctx.send(i); });
    const api = {
      apply(sd, i, replay) {
        if (done || sd !== turn || !Number.isInteger(i) || i < 0 || i >= N * N || !moves(sd).includes(i)) return false; const f = flips(i, sd);
        b[i] = sd; f.forEach((k) => (b[k] = sd)); lastI = i; if (!replay) snd(sd ? 380 : 480, 0.06, 0.06, 'triangle');
        if (MULTI) { if (b.every((v) => v !== -1)) finish(); else turn = ctx.next(sd); }
        else if (moves(1 - sd).length) turn = 1 - sd; else if (moves(sd).length) { turn = sd; if (!replay) ctx.hint(rt('pass')); } else { finish(); }
        ctx.turn(done ? -1 : turn); return true;
      },
      quit(s) { if (done || ctx.active().length < 2) return; if (turn === s) { turn = ctx.next(s); ctx.turn(turn); } },
    };
    const stop = loop(() => {
      const s = Math.min(c.W, c.H) / N, ox = (c.W - s * N) / 2, oy = (c.H - s * N) / 2;
      g.clearRect(0, 0, c.W, c.H); g.fillStyle = '#166534'; rr(g, ox - 4, oy - 4, s * N + 8, s * N + 8, 10); g.fill();
      g.strokeStyle = '#14532D'; g.lineWidth = 1.5; for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(ox, oy + i * s); g.lineTo(ox + s * N, oy + i * s); g.moveTo(ox + i * s, oy); g.lineTo(ox + i * s, oy + s * N); g.stroke(); }
      const hint = !done && turn === ctx.me ? moves(ctx.me) : [];
      for (let i = 0; i < N * N; i++) {
        const x = ox + (i % N) * s + s / 2, y = oy + ((i / N) | 0) * s + s / 2;
        if (b[i] >= 0) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 2, y + 3, s * 0.4, 0, 7); g.fill(); g.fillStyle = MULTI ? ctx.col[b[i]] : b[i] ? '#F8FAFC' : '#111827'; g.beginPath(); g.arc(x, y, s * 0.4, 0, 7); g.fill(); if (MULTI && b[i] === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, s * 0.4 - 1, 0, 7); g.stroke(); } }
        else if (hint.includes(i)) { g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(x, y, s * 0.12, 0, 7); g.fill(); }
        if (i === lastI) { g.fillStyle = MULTI ? '#fff' : '#EF4444'; g.beginPath(); g.arc(x, y, s * 0.08, 0, 7); g.fill(); }
      }
      const ty = oy - 2 > 14 ? oy - 12 : 12;
      if (!MULTI) { const n0 = cnt(0), n1 = cnt(1); text(g, `⚫ ${n0}   ⚪ ${n1}`, c.W / 2, ty, 14); }
      else { const w = Math.min(64, (c.W - 16) / NP); for (let k = 0; k < NP; k++) { const x = c.W / 2 + (k - (NP - 1) / 2) * w; g.globalAlpha = ctx.out?.has(k) ? 0.35 : 1; g.fillStyle = ctx.col[k]; g.beginPath(); g.arc(x - 12, ty, 6, 0, 7); g.fill(); if (k === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } text(g, String(cnt(k)), x + 6, ty, 14, k === turn && !done ? '#FDE047' : '#fff'); g.globalAlpha = 1; } }
    });
    ctx.turn(0);
    return { ...api, stop, resize: cv.fit };
  };

  // ---- Nuqtalar va kataklar (5×5 katak): katak yopgan yana yuradi ----
  MPI.dots = (stage, ctx) => {
    const NP = ctx.n || 2, K = NP > 2 ? 6 : 5, D = K + 1; const cv = canvasIn(stage, 1); const { c, g } = cv;
    const H = K * D, V = D * K; const lines = Array(H + V).fill(-1), box = Array(K * K).fill(-1); let turn = 0, done = false, lastL = -1;
    // chiziq raqami: 0..H-1 gorizontal (y*K + x, y=0..K), H.. vertikal (y*D + x, y=0..K-1)
    const boxLines = (bx, by) => [by * K + bx, (by + 1) * K + bx, H + by * D + bx, H + by * D + bx + 1];
    const geom = () => { const s = Math.min(c.W, c.H) / (K + 0.8), ox = (c.W - s * K) / 2, oy = (c.H - s * K) / 2; return { s, ox, oy }; };
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const [px, py] = pos(c, e); const { s, ox, oy } = geom(); let best = -1, bd = s * 0.28;
      for (let i = 0; i < H + V; i++) { if (lines[i] !== -1) continue; let x1, y1, x2, y2; if (i < H) { const y = (i / K) | 0, x = i % K; x1 = ox + x * s; y1 = oy + y * s; x2 = x1 + s; y2 = y1; } else { const j = i - H, y = (j / D) | 0, x = j % D; x1 = ox + x * s; y1 = oy + y * s; x2 = x1; y2 = y1 + s; } const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = i; } }
      if (best >= 0) ctx.send(best);
    });
    const api = {
      apply(sd, i, replay) {
        if (done || sd !== turn || !(i >= 0 && i < H + V) || lines[i] !== -1) return false;
        lines[i] = sd; lastL = i; let got = 0;
        for (let by = 0; by < K; by++) for (let bx = 0; bx < K; bx++) if (box[by * K + bx] === -1 && boxLines(bx, by).every((l) => lines[l] !== -1)) { box[by * K + bx] = sd; got++; }
        if (!replay) snd(got ? 880 : 420, got ? 0.12 : 0.04, 0.05);
        if (!got) turn = ctx.next ? ctx.next(sd) : 1 - sd;
        if (box.every((v) => v !== -1)) finish();
        ctx.turn(done ? -1 : turn); return true;
      },
      quit(s) { if (done) return; if (ctx.active().length < 2) return; if (turn === s) { turn = ctx.next(s); ctx.turn(turn); } },
    };
    function finish() { done = true; const cnt = Array.from({ length: NP }, (_, i) => (ctx.out?.has(i) ? -1 : box.filter((v) => v === i).length)); const mx = Math.max(...cnt), top = cnt.map((v, i) => (v === mx ? i : -1)).filter((i) => i >= 0); ctx.over(top.length > 1 ? ctx.DRAW ?? 2 : top[0]); }
    const COL = ['#2563EB', '#E11D48', '#16A34A', '#D97706'], EM = ['🔵', '🔴', '🟢', '🟠'];
    const stop = loop(() => {
      const { s, ox, oy } = geom(); g.clearRect(0, 0, c.W, c.H);
      for (let by = 0; by < K; by++) for (let bx = 0; bx < K; bx++) if (box[by * K + bx] >= 0) { g.fillStyle = COL[box[by * K + bx]] + '33'; g.fillRect(ox + bx * s + 3, oy + by * s + 3, s - 6, s - 6); text(g, box[by * K + bx] === ctx.me ? '★' : '●', ox + bx * s + s / 2, oy + by * s + s / 2, s * 0.3, COL[box[by * K + bx]]); }
      g.lineCap = 'round';
      for (let i = 0; i < H + V; i++) { let x1, y1, x2, y2; if (i < H) { const y = (i / K) | 0, x = i % K; x1 = ox + x * s; y1 = oy + y * s; x2 = x1 + s; y2 = y1; } else { const j = i - H, y = (j / D) | 0, x = j % D; x1 = ox + x * s; y1 = oy + y * s; x2 = x1; y2 = y1 + s; } g.strokeStyle = lines[i] >= 0 ? COL[lines[i]] : 'rgba(148,163,184,.35)'; g.lineWidth = lines[i] >= 0 ? (i === lastL ? 7 : 5) : 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
      g.fillStyle = '#E2E8F0'; for (let y = 0; y <= K; y++) for (let x = 0; x <= K; x++) { g.beginPath(); g.arc(ox + x * s, oy + y * s, 5, 0, 7); g.fill(); }
      const cnt = Array.from({ length: NP }, (_, i) => box.filter((v) => v === i).length); text(g, NP > 2 ? cnt.map((v, i) => EM[i] + ' ' + v).join('   ') : `🔵 ${cnt[0]} : ${cnt[1]} 🔴`, c.W / 2, Math.max(12, oy - 18), 15);
    });
    ctx.turn(0);
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
  function players(r) { return Array.from({ length: r.n || 2 }, (_, i) => uname(r.users?.[i]) || '…'); }
  const PCOL = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'];
  function build() {
    const r = Room.cur; Room.inst?.stop?.(); Room.inst = null;
    const st = $('#gm-stage'); st.innerHTML = ''; st.className = 'gm-stage';
    const names = players(r);
    const meta = mpMeta(r.game);
    const pcell = (i) => `<div class="mp-p" data-s="${i}" style="--pc:${PCOL[i]}">${r.users[i] ? avatar({ ...r.users[i], online: false }, 'sm') : '<span class="mp-q">?</span>'}<b>${esc(names[i])}</b><i></i></div>`;
    const N = r.n || 2;
    $('#gm-extra').innerHTML = `<div class="mp-bar${N > 2 ? ' mp-n' : ''}">${N > 2 ? names.map((_, i) => pcell(i)).join('') : pcell(0) + '<span class="mp-vs">VS</span>' + pcell(1)}</div><div class="mp-turn" id="mp-turn"></div>`;
    (r.out || []).forEach((s) => $(`.mp-p[data-s="${s}"]`)?.classList.add('out'));
    $('#gm-info').innerHTML = r.seat >= 0 && r.status === 'play' ? `<button class="mp-resign" id="mp-resign">🏳️</button>` : '';
    $('#mp-resign')?.addEventListener('click', () => { if (confirm(mt('resign_q'))) emitA('game:over', { room: r.id, resign: true }).then((x) => { if (x?.out) { $('#gm-info').innerHTML = ''; } }).catch(() => toast(t('net_err'))); });
    if (r.status === 'wait') {
      const joined = r.users.filter(Boolean).length;
      st.innerHTML = `<div class="mp-wait"><div class="mp-spin">${meta.e}</div><h3>${esc(mt('wait'))}</h3>${N > 2 ? `<p class="mp-cnt"><b>${joined}/${N}</b> ${esc(mt('joined'))}</p>` : ''}<p>${esc(mt('wait_sub'))}</p>${N > 2 && r.seat === 0 && joined >= 2 ? `<button class="btn-primary" id="mp-start">▶ ${esc(mt('start_now').replace('{n}', joined))}</button>` : ''}</div>`;
      $('#mp-start')?.addEventListener('click', () => emitA('game:start', { room: r.id }).catch(() => toast(t('net_err'))));
      return;
    }
    let overShown = false;
    const out = new Set(r.out || []);
    const ctx = {
      me: r.seat, names, secret: r.secret, n: N, DRAW: r.draw ?? (N > 2 ? 9 : 2), out, col: PCOL,
      active: () => Array.from({ length: N }, (_, i) => i).filter((i) => !out.has(i)),
      next: (s) => { for (let k = 1; k <= N; k++) { const q = (s + k) % N; if (!out.has(q)) return q; } return s; },
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
        el.textContent = Room.turnTxt = txt || (s < 0 ? '' : r.seat < 0 ? mt('spectate') : s === r.seat ? mt('your') : N > 2 ? mt('their_n').replace('{n}', names[s]) : mt('their'));
        el.classList.toggle('me', s === r.seat && s >= 0);
      },
      hint: (s, keep) => { const el = $('#mp-turn'); if (el) { el.textContent = s; el.classList.add('flash'); clearTimeout(Room.hintT); Room.hintT = setTimeout(() => { el.classList.remove('flash'); if (!keep && Room.turnTxt != null && el.textContent === s) el.textContent = Room.turnTxt; }, 1600); } },
      secretSave: (data) => emitA('game:secret', { room: r.id, data }),
      rt: meta.rt ? { send: (d, to) => { const s = sock(); if (s && r.seat >= 0) s.volatile.emit('game:rt', { room: r.id, d, ...(Number.isInteger(to) ? { to } : {}) }); } } : null,
    };
    const showResult = (w) => {
      if (overShown) return; overShown = true;
      const D = ctx.DRAW; const txt = w === D ? mt('draw') : r.seat < 0 || N > 2 && w !== r.seat ? mt('won_by').replace('{n}', names[w]) : w === r.seat ? mt('you_won') : mt('you_lost');
      const ov = $('#gm-over');
      ov.innerHTML = `<div class="gm-card"><div class="gm-big">${w === D ? '🤝' : w === r.seat ? '🏆' : r.seat < 0 ? '🏁' : '😔'}</div><h3>${esc(txt)}</h3>
        ${r.seat >= 0 ? `<button class="btn-primary" id="mp-again">${esc(mt('rematch'))}</button>` : ''}<div class="gm-row"><button id="mp-see">${esc(mt('watch'))}</button><button id="mp-top">🏆 ${tg('top')}</button></div></div>`;
      ov.classList.remove('hidden');
      if (w === r.seat) snd(1046, 0.4, 0.08);
      $('#mp-again')?.addEventListener('click', () => invite(r.game, r.chats?.length > 1 ? r.chats : r.chatId, N));
      $('#mp-see').onclick = () => ov.classList.add('hidden');
      $('#mp-top').onclick = () => showTopMP(r.game);
      $('#gm-info').innerHTML = '';
    };
    Room.showResult = showResult;
    Room.ctx = ctx;
    const quitSeat = (s, replay) => { out.add(s); $(`.mp-p[data-s="${s}"]`)?.classList.add('out'); Room.inst?.quit?.(s, replay); if (!replay) ctx.hint('🏳️ ' + names[s]); };
    Room.quitSeat = quitSeat;
    requestAnimationFrame(() => {
      Room.inst = MPI[r.game](st, ctx);
      for (const mv of Room.moves) { if (mv.m?.quit) { quitSeat(mv.s, true); continue; } if (!meta.rt) Room.inst.apply(mv.s, mv.m, true); }
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
      if (ev.m?.quit) { Room.quitSeat?.(ev.s, false); return; }
      if (!Room.inst.apply(ev.s, ev.m, false)) resync();
    };
    const onState = (st) => {
      GameCards.set(st.id, st);
      const r = Room.cur; if (!r || st.id !== r.id) return;
      const wasWait = r.status === 'wait';
      Room.cur = { ...r, ...st, moves: st.moves };
      if (wasWait) { Room.moves = st.moves.slice(); build(); }
      else if (st.status === 'over') { $('#gm-info').innerHTML = ''; Room.showResult?.(st.winner); }
    };
    const onConn = () => { if (Room.cur && !mpMeta(Room.cur.game)?.rt) resync(); };
    const onRt = (ev) => { if (Room.cur && ev.room === Room.cur.id) Room.inst?.rt?.(ev.s, ev.d); };
    s.on('game:move', onMove); s.on('game:state', onState); s.on('connect', onConn); s.on('game:rt', onRt);
    Room.off = () => { s.off('game:move', onMove); s.off('game:state', onState); s.off('connect', onConn); s.off('game:rt', onRt); Room.off = null; };
  }
  function closeRoom(silent) {
    Room.inst?.stop?.(); Room.inst = null; Room.cur = null; Room.off?.();
    $('#gm-page')?.classList.remove('mp');
    $('#gm-score')?.parentElement.classList.remove('hidden'); $('#gm-best')?.parentElement.classList.remove('hidden');
    if (!silent) renderLobby();
  }
  async function invite(game, chatId, nPre) {
    const meta = mpMeta(game); const multi = !meta.two;
    const go = async (cids, n) => {
      closeModal();
      try { const r = await emitA('game:invite', { chats: cids, game, n }); toast(mt('sent')); Page.inst?.stop?.(); Page.inst = null; ensurePage(); closeRoom(true); showRoom(r.room); }
      catch (e) { toast(e.message === 'blocked' ? t('blocked_cant') || t('not_sent') : t('not_sent')); }
    };
    if (chatId) return go(Array.isArray(chatId) ? chatId : [chatId], nPre || 2);
    const list = [...S.chats.values()].filter((c) => c.type !== 'channel' && !c.self).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)).slice(0, 80);
    let n = 2; const pick = new Set();
    modal(`<h3>${meta.e} ${esc(mt('invite'))} <button class="icon-btn" data-close>${icon('close')}</button></h3>
      ${multi ? `<div class="mp-ncount"><span>${esc(mt('players'))}</span>${[2, 3, 4].map((k) => `<button data-n="${k}" class="${k === 2 ? 'on' : ''}">👤 ${k}</button>`).join('')}</div><p class="mp-nhint" id="mp-nhint"></p>` : ''}
      <div class="chat-pick${multi ? ' multi' : ''}">${list.map((c) => `<button data-cid="${c.id}" data-grp="${c.type === 'private' ? 0 : 1}">${chatAvatar(c, 'sm')}<b>${esc(chatTitle(c))}</b>${multi ? '<i class="mp-chk"></i>' : ''}</button>`).join('')}</div>
      ${multi ? `<button class="btn-primary mp-send" id="mp-send" disabled>${esc(mt('send_inv'))}</button>` : ''}`);
    const card = $('#modal-card');
    const paint = () => {
      card.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('on', +b.dataset.n === n));
      card.querySelectorAll('[data-cid]').forEach((b) => b.classList.toggle('on', pick.has(+b.dataset.cid)));
      const hasGrp = [...pick].some((id) => S.chats.get(id)?.type !== 'private');
      const need = n - 1, priv = [...pick].filter((id) => S.chats.get(id)?.type === 'private').length;
      const h = $('#mp-nhint'); if (h) h.textContent = hasGrp ? mt('hint_grp').replace('{n}', n) : mt('hint_pick').replace('{k}', priv).replace('{n}', need);
      const sb = $('#mp-send'); if (sb) sb.disabled = !pick.size;
    };
    card.onclick = (e) => {
      const nb = e.target.closest('[data-n]'); if (nb) { n = +nb.dataset.n; while (pick.size > n - 1) pick.delete([...pick].pop()); return paint(); }
      if (e.target.closest('#mp-send')) { const priv = [...pick].filter((id) => S.chats.get(id)?.type === 'private').length; return go([...pick], Math.max(n, 1 + priv)); }
      const b = e.target.closest('[data-cid]'); if (!b) return; const id = +b.dataset.cid;
      if (!multi) return go([id], 2);
      if (pick.has(id)) pick.delete(id); else { if (pick.size >= Math.max(1, n - 1)) { if (n < 4) n++; else return toast(mt('max4')); } pick.add(id); }
      paint();
    };
    paint();
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
        const me = S.me?.id, seat = st.pl ? st.pl.indexOf(me) : st.a === me ? 0 : st.b === me ? 1 : -1; const D = st.draw ?? 2;
        const s = el.querySelector('.gc-st'), b = el.querySelector('.gc-go');
        if (s) s.textContent = st.status === 'over' ? (st.winner === D ? mt('draw') : seat >= 0 ? (st.winner === seat ? mt('you_won') : mt('you_lost')) : mt('status_over')) : st.status === 'play' ? mt('status_play') : mt('status_wait') + (st.n > 2 ? ` · ${st.joined}/${st.n}` : '');
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
    const tile = (m, mp) => `<button class="gm-tile${m.big ? ' big' : ''}" data-${mp ? 'mp' : 'g'}="${m.id}" style="--g1:${m.c[0]};--g2:${m.c[1]}"><span class="gm-e">${m.e}</span><b>${esc(gname(m))}</b><small data-sc="${mp ? 'w_' + m.id : m.id}">🏆 ${Page.best[mp ? 'w_' + m.id : m.id] || 0}${mp ? ' ' + esc(mt('wins')) : ''}</small>${mp ? `<span class="gm-2p">👥 ${m.two ? 2 : '2–4'}</span>` : ''}</button>`;
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
      act.innerHTML = `<h4 class="gm-h">⏳ ${esc(mt('active'))}</h4>` + rooms.map((r) => { const m = mpMeta(r.game); const op = r.users.filter((u, i) => u && i !== r.seat).map(uname).join(', '); const myTurn = r.turn === r.seat;
        return `<button class="gm-room" data-room="${r.id}"><span class="gm-e2" style="background:linear-gradient(135deg,${m.c[0]},${m.c[1]})">${m.e}</span><span class="gm-rt"><b>${esc(gname(m))}</b><small>${op ? esc(op) : esc(mt('status_wait'))}</small></span>${myTurn ? `<i class="gm-dot"></i>` : ''}<span class="gm-go">${esc(mt('open'))} ›</span></button>`; }).join('');
      act.classList.remove('hidden');
    }
  }


  /* ================= Birga Poyga (jonli, 2 kishi): har kim o'z mashinasini boshqaradi, holat raqibga uzatiladi ================= */
  MPL.push({ id: 'race', e: '🏎️', c: ['#DC2626', '#111827'], rt: 1, big: 1, n: { uz: 'Birga Poyga (jonli)', ru: 'Гонки (онлайн)', en: 'Birga Racing (live)' } });
  const RACE_T = { uz: { lap: 'Davra', pos: 'O‘rin', nitro: 'Nitro', fin: '🏁 Marra!', off: 'Yo‘ldan chiqdingiz', wrong: '↩️ Teskari yo‘nalish' }, ru: { lap: 'Круг', pos: 'Место', nitro: 'Нитро', fin: '🏁 Финиш!', off: 'Вы вне трассы', wrong: '↩️ Не туда' }, en: { lap: 'Lap', pos: 'Pos', nitro: 'Nitro', fin: '🏁 Finish!', off: 'Off track', wrong: '↩️ Wrong way' } };
  const rct = (k) => (RACE_T[L()] || PK('race') || RACE_T.en)[k] || RACE_T.en[k];
  MPI.race = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const pad = padUI(stage, [{ id: 'gas', t: '⛽', cls: 'big' }, { id: 'brake', t: '🛑' }, { id: 'nitro', t: '🔥' }]);
    const LAPS = 3, WTR = 70, ME = Math.max(0, ctx.me), SPEC = ctx.me < 0, N = ctx.n > 2 ? ctx.n : 2, MULTI = N > 2;
    // trassa: silliq yopiq egri chiziq (Catmull-Rom)
    const CP = [[0, 0], [520, -40], [880, 120], [940, 420], [700, 560], [520, 420], [300, 520], [120, 760], [-260, 720], [-420, 420], [-300, 160], [-460, -120], [-260, -300]];
    const P = []; const n = CP.length;
    for (let i = 0; i < n; i++) { const p0 = CP[(i - 1 + n) % n], p1 = CP[i], p2 = CP[(i + 1) % n], p3 = CP[(i + 2) % n]; for (let k = 0; k < 40; k++) { const t2 = k / 40, t3 = t2 * t2, t4 = t3 * t2; P.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t2 + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t3 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t4), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t2 + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t3 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t4)]); } }
    const NP = P.length, S = [0]; for (let i = 1; i <= NP; i++) S.push(S[i - 1] + Math.hypot(P[i % NP][0] - P[i - 1][0], P[i % NP][1] - P[i - 1][1])); const LEN = S[NP];
    const dirAt = (i) => { const a = P[i % NP], b = P[(i + 1) % NP]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    const nearest = (x, y, hint) => { let bi = hint, bd = 1e12; for (let k = -30; k <= 30; k++) { const i = (hint + k + NP) % NP, d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i; } } if (bd > 300 * 300) for (let i = 0; i < NP; i++) { const d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i; } } return [bi, Math.sqrt(bd)]; };
    // start: 2 qatorli setka (0,1 — oldinda; 2,3 — orqada)
    const a0 = dirAt(0), side = (s, row = 0) => [P[0][0] - Math.cos(a0) * (40 + row * 62) + Math.cos(a0 + Math.PI / 2) * 22 * s, P[0][1] - Math.sin(a0) * (40 + row * 62) + Math.sin(a0 + Math.PI / 2) * 22 * s];
    const mkCar = (seat) => { const [x, y] = side(seat % 2 ? 1 : -1, seat >> 1); return { seat, x, y, a: a0, v: 0, idx: 0, lap: 0, prog: 0, nitro: 3, nT: 0, fin: 0, out: 0, skid: [], snap: null, prev: null, t: 0, heard: 0 }; };
    const cars = Array.from({ length: N }, (_, i) => mkCar(i)); for (const o of cars) { o.idx = nearest(o.x, o.y, NP - 1)[0]; o.lap = o.idx > NP / 2 ? -1 : 0; }
    const me = cars[ME], others = cars.filter((o) => o !== me), op = cars[1 - ME];
    let started = false, cd = 3.4, time = 0, over = false, msg = '', msgT = 0, wrongT = 0, sendT = 0, order = [], endT = 15, ordT = 0, endW = null;
    const COL = MULTI ? ['#2563EB', '#DC2626', '#16A34A', '#F59E0B'] : ['#2563EB', '#DC2626'];
    // ko'p kishilik: marra tartibini uy egasi (0) belgilaydi
    const addFin = (s) => { if (order.includes(s)) return; order.push(s); if (order.length === 1 && s !== ctx.me) { msg = '🏁 ' + ctx.names[s]; msgT = 2.5; } ctx.rt?.send({ t: 'ord', o: order }); };
    const finish = (w) => { if (over) return; over = true; endW = w; if (ctx.me === 0) ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 1500); };
    const link = rtLink(ctx, (d, s) => {
      const o = cars[s]; if (!o) return;
      if (d.t === 'c' && (o !== me || SPEC)) { o.prev = o.snap; o.snap = d; o.t = performance.now(); o.lap = d.l; o.prog = d.p; o.heard = 1; }
      if (!MULTI) { if (d.t === 'fin' && !over) { op.fin = d.tm || 1; if (!me.fin) { over = true; msg = rct('fin'); msgT = 3; setTimeout(() => ctx.over(1 - ME), 1500); } } return; }
      if (d.t === 'fin' || (d.t === 'c' && d.f)) { o.fin = o.fin || d.tm || 1; if (ctx.me === 0) addFin(s); }
      if (d.t === 'ord' && s === 0 && Array.isArray(d.o)) { if (!order.length && d.o.length && d.o[0] !== ctx.me) { msg = '🏁 ' + ctx.names[d.o[0]]; msgT = 2.5; } order = d.o.filter((x) => cars[x]); order.forEach((x) => { if (!cars[x].fin) cars[x].fin = 1; }); }
      if (d.t === 'end' && s === 0 && !over) finish(d.w);
    });
    ctx.turn(-1, rt('wait_rt'));
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      const allHeard = others.every((o) => o.heard || o.out || ctx.out?.has(o.seat));
      if (!started && ((MULTI ? allHeard && link.st.alive : link.st.alive) || SPEC)) { started = true; snd(440, 0.15, 0.06); ctx.turn(-1, '🏎️ ' + rct('lap') + ' × ' + LAPS); }
      if (started && cd > 0) { const p0 = Math.ceil(cd); cd -= dt; if (Math.ceil(cd) !== p0) snd(cd <= 0 ? 880 : 440, 0.15, 0.07); }
      const kd = keysDown; let steer = pad.x; if (kd.has('arrowleft') || kd.has('a')) steer = -1; if (kd.has('arrowright') || kd.has('d')) steer = 1;
      const gas = pad.b.gas || kd.has('arrowup') || kd.has('w') || (pad.on && pad.y < -0.35), brake = pad.b.brake || kd.has('arrowdown') || kd.has('s') || (pad.on && pad.y > 0.5);
      if ((pad.take('nitro') || kd.has('shift')) && me.nitro > 0 && me.nT <= 0 && started && cd <= 0) { me.nitro--; me.nT = 1.6; snd(160, 0.5, 0.06, 'sawtooth'); }
      if (started && cd <= 0 && !SPEC) {
        if (!me.fin) time += dt;
        const [idx, off] = nearest(me.x, me.y, me.idx); const onTrack = off < WTR;
        const vmax = (onTrack ? 300 : 120) * (me.nT > 0 ? 1.45 : 1); me.nT = Math.max(0, me.nT - dt);
        if (!me.fin && gas) me.v += (me.nT > 0 ? 340 : 190) * dt; else if (brake) me.v -= 320 * dt; else me.v -= 70 * dt * Math.sign(me.v);
        if (me.v > vmax) me.v -= (onTrack ? 260 : 420) * dt; me.v = Math.max(-80, Math.min(vmax + 40, me.v)); if (me.fin) me.v *= Math.pow(0.4, dt);
        const sr = steer * Math.min(1, Math.abs(me.v) / 90) * (2.7 - Math.min(1.2, Math.abs(me.v) / 300)) * Math.sign(me.v || 1); me.a += sr * dt;
        me.x += Math.cos(me.a) * me.v * dt; me.y += Math.sin(me.a) * me.v * dt;
        if (Math.abs(steer) > 0.6 && Math.abs(me.v) > 200) { me.skid.push([me.x, me.y]); if (me.skid.length > 60) me.skid.shift(); }
        if (!onTrack && off > WTR + 70) { const q = P[idx]; me.x += (q[0] - me.x) * dt * 2; me.y += (q[1] - me.y) * dt * 2; } // juda uzoqqa ketmasin
        if (me.idx > NP * 0.8 && idx < NP * 0.2) me.lap++; else if (me.idx < NP * 0.2 && idx > NP * 0.8) me.lap--;
        me.idx = idx; me.prog = me.lap * LEN + S[idx];
        const fwd = Math.cos(me.a - dirAt(idx)); wrongT = fwd < -0.3 && Math.abs(me.v) > 40 ? wrongT + dt : 0;
        if (me.lap >= LAPS && !me.fin) { me.fin = time; msg = rct('fin'); msgT = 3; snd(1046, 0.5, 0.08); ctx.rt?.send({ t: 'fin', tm: time }); if (!MULTI) { if (!op.fin) { over = true; setTimeout(() => ctx.over(ME), 1500); } } else if (ctx.me === 0) addFin(0); }
      }
      // uy egasi: hamma marraga yetsa yoki birinchidan 15 s o'tsa — tamom
      if (MULTI && ctx.me === 0 && order.length && !over) { endT -= dt; const act = cars.filter((o) => !o.out && !ctx.out?.has(o.seat)); if (endT <= 0 || act.every((o) => order.includes(o.seat))) finish(order[0]); }
      if (MULTI && ctx.me === 0 && order.length && (ordT += dt) > 0.4) { ordT = 0; ctx.rt?.send(endW != null ? { t: 'end', w: endW } : { t: 'ord', o: order }); } // paketlar yo'qolishi mumkin — qayta yuboramiz
      sendT += dt; if (!SPEC && sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'c', x: Math.round(me.x), y: Math.round(me.y), a: Math.round(me.a * 100) / 100, v: Math.round(me.v), l: me.lap, p: Math.round(me.prog), n: me.nT > 0 ? 1 : 0, ...(MULTI && me.fin ? { f: 1 } : {}) }); }
      for (const o of cars) { if ((o === me && !SPEC) || !o.snap) continue; const k = o.prev ? Math.min(1.5, (performance.now() - o.t) / 50) : 1, lp = (a, b) => (o.prev ? a + (b - a) * k : b); o.x = lp(o.prev?.x ?? o.snap.x, o.snap.x); o.y = lp(o.prev?.y ?? o.snap.y, o.snap.y); o.a = o.snap.a; o.v = o.snap.v; o.nT = o.snap.n; }
      // ---- chizish: kamera mashina orqasidan (mashina yo'nalishi bo'yicha) ----
      const zoom = Math.min(W, H) / 520 * (1 - Math.min(0.25, Math.abs(me.v) / 1400));
      g.save(); g.fillStyle = '#3F7F3A'; g.fillRect(0, 0, W, H);
      g.translate(W / 2, H * 0.66); g.scale(zoom, zoom); g.rotate(-me.a - Math.PI / 2); g.translate(-me.x, -me.y);
      const path = () => { g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); };
      g.lineJoin = 'round'; g.lineCap = 'round';
      path(); g.strokeStyle = '#E5E7EB'; g.lineWidth = WTR * 2 + 16; g.stroke(); path(); g.setLineDash([22, 22]); g.strokeStyle = '#EF4444'; g.lineWidth = WTR * 2 + 16; g.stroke(); g.setLineDash([]);
      path(); g.strokeStyle = '#374151'; g.lineWidth = WTR * 2; g.stroke(); path(); g.setLineDash([26, 30]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
      // start/finish
      g.save(); g.translate(P[0][0], P[0][1]); g.rotate(a0 + Math.PI / 2); for (let i = -7; i < 7; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(i * 10, j * 10 - 10, 10, 10); } g.restore();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.beginPath(); me.skid.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
      const car = (o, col, isMe) => {
        g.save(); g.translate(o.x, o.y); g.rotate(o.a);
        if (o.nT > 0) { g.fillStyle = 'rgba(251,146,60,.85)'; g.beginPath(); g.moveTo(-22, -6); g.lineTo(-44 - Math.random() * 14, 0); g.lineTo(-22, 6); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -20, -10, 44, 24, 7); g.fill();
        g.fillStyle = '#111'; [[-14, -13], [10, -13], [-14, 9], [10, 9]].forEach(([x, y]) => g.fillRect(x, y, 10, 5));
        g.fillStyle = col; rr(g, -22, -11, 44, 22, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, 2, -8, 10, 16, 3); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-16, -2, 14, 4);
        g.restore();
        if (!isMe) { g.save(); g.translate(o.x, o.y); g.rotate(me.a + Math.PI / 2); text(g, MULTI ? String(ctx.names[o.seat] || '').slice(0, 10) : rt('opp'), 0, -34, MULTI ? 14 : 16, '#fff'); g.restore(); }
      };
      others.forEach((o) => { if (!o.out && (!MULTI || o.heard || !started)) car(o, COL[o.seat], false); }); car(me, COL[ME], true);
      g.restore();
      // ---- HUD ----
      const rk = (o) => (order.includes(o.seat) ? -1e9 + order.indexOf(o.seat) : o.fin && !MULTI ? -1e9 + o.fin : -o.prog);
      const live = cars.filter((o) => !o.out), myPos = MULTI ? live.slice().sort((a, b) => rk(a) - rk(b)).indexOf(me) + 1 : 0;
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 8, 8, 150, 54, 12); g.fill();
      text(g, `${rct('lap')} ${Math.max(1, Math.min(LAPS, me.lap + 1))}/${LAPS}`, 16, 24, 15, '#fff', 'left'); const first = MULTI ? myPos === 1 : me.fin ? !op.fin || me.fin <= op.fin : me.prog >= op.prog;
      text(g, `${rct('pos')}: ${MULTI ? myPos : first ? '1' : '2'}/${MULTI ? live.length : 2}`, 16, 46, 15, first ? '#FDE047' : '#fff', 'left');
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W - 112, 8, 104, 54, 12); g.fill(); text(g, `${Math.round(Math.abs(me.v) * 0.6)}`, W - 60, 28, 22, '#fff'); text(g, 'km/h  🔥×' + me.nitro, W - 60, 50, 11, '#E5E7EB');
      // ko'p kishilik: o'yinchilar qatori (davra yoki marra o'rni)
      if (MULTI) { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 8, 68, N * 42 + 8, 24, 12); g.fill(); cars.forEach((o, i) => { const x = 22 + i * 42, oi = order.indexOf(i); g.globalAlpha = o.out ? 0.3 : 1; g.fillStyle = COL[i]; g.beginPath(); g.arc(x, 80, 6, 0, 7); g.fill(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } text(g, oi >= 0 ? '🏁' + (oi + 1) : String(Math.max(1, Math.min(LAPS, o.lap + 1))), x + 9, 80, 11, i === ctx.me ? '#FDE047' : '#fff', 'left'); g.globalAlpha = 1; }); }
      // mini xarita
      const mx = W - 92, my = 74, ms = 80 / 1500; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, mx - 6, my - 6, 92, 92, 10); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); P.forEach((q, i) => { const x = mx + 40 + (q[0] - 240) * ms, y = my + 40 + (q[1] - 230) * ms; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke();
      others.concat([me]).forEach((o) => { if (o.out) return; g.fillStyle = COL[o.seat]; g.beginPath(); g.arc(mx + 40 + (o.x - 240) * ms, my + 40 + (o.y - 230) * ms, 4, 0, 7); g.fill(); });
      // marra tartibi
      if (MULTI && order.length) { const h = 22 * order.length + 14; g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W / 2 - 90, H * 0.5, 180, h, 12); g.fill(); order.forEach((s, i) => { g.fillStyle = COL[s]; g.beginPath(); g.arc(W / 2 - 70, H * 0.5 + 18 + i * 22, 6, 0, 7); g.fill(); text(g, `${i + 1}. ${String(ctx.names[s] || '').slice(0, 12)}`, W / 2 - 58, H * 0.5 + 18 + i * 22, 14, s === ctx.me ? '#FDE047' : '#fff', 'left'); }); }
      if (!started) text(g, rt('wait_rt'), W / 2, H * 0.35, 18);
      else if (cd > 0) text(g, String(Math.ceil(cd)), W / 2, H * 0.35, 72, '#FDE047'); else if (cd > -0.8) text(g, rt('go'), W / 2, H * 0.35, 40, '#22C55E');
      if (wrongT > 1) text(g, rct('wrong'), W / 2, H * 0.22, 20, '#FCA5A5');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H * 0.3, 36, '#FDE047'); }
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.45, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), stop, resize: fit, quit: (s) => { if (cars[s] && s !== ctx.me) cars[s].out = 1; } };
  };


  /* ================= Yana 3 ta jonli 2 kishilik o'yin: Ping-pong, Tank jangi, Sumo ================= */
  MPL.push(
    { id: 'pong', e: '🏓', c: ['#0EA5E9', '#7C3AED'], rt: 1, n: { uz: 'Ping-pong (jonli)', ru: 'Пинг-понг (онлайн)', en: 'Ping-pong (live)' } },
    { id: 'tanks', e: '🪖', c: ['#4D7C0F', '#78350F'], rt: 1, big: 1, n: { uz: 'Tank jangi (jonli)', ru: 'Танковый бой (онлайн)', en: 'Tank battle (live)' } },
    { id: 'sumo', e: '🤼', c: ['#F59E0B', '#DC2626'], rt: 1, n: { uz: 'Sumo (jonli)', ru: 'Сумо (онлайн)', en: 'Sumo (live)' } },
  );
  // umumiy: uy egasi (0) hisoblaydi, mehmon (1) boshqaruvini yuboradi; ekranda har kim o'zini pastda ko'radi
  function hostGame(ctx, { onInput, onSnap }) {
    const HOST = ctx.me === 0; let snap = null, prev = null, snapT = 0, over = false;
    const link = rtLink(ctx, (d, s) => {
      if (HOST && d.t === 'i') onInput(d, s);
      if (!HOST && d.t === 's') { prev = snap; snap = d; snapT = performance.now(); onSnap?.(d); }
      if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 700); }
    });
    return {
      HOST, link, get snap() { return snap; },
      k(ms) { return prev ? Math.min(1.2, (performance.now() - snapT) / ms) : 1; },
      lerp(a, b, ms) { return prev ? a + (b - a) * this.k(ms) : b; }, prevS: () => prev,
      end(w) { if (over) return; over = true; ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 700); }, get over() { return over; },
    };
  }

  // ---- Ping-pong ----
  MPI.pong = (stage, ctx) => {
    if ((ctx.n || 2) > 2) { // 3–4 kishi: kvadrat stol, har kim bir tomonni himoya qiladi, jonlar tugasa tomon devorga aylanadi
      const NP = ctx.n, { c, g, fit } = canvasIn(stage, 0.82), PW = 0.26, PH = 0.03, BR = 0.022, LIVES = 5, PY = 0.94, ME = Math.max(0, ctx.me), COL = ctx.col;
      const rot = (x, y, k) => { k = ((k % 4) + 4) % 4; for (let i = 0; i < k; i++) [x, y] = [-y, x]; return [x, y]; }; // 90° burish
      const loc = (x, y, j) => { const [a, b] = rot(x - 0.5, y - 0.5, -j); return [a + 0.5, b + 0.5]; }, wld = (x, y, j) => { const [a, b] = rot(x - 0.5, y - 0.5, j); return [a + 0.5, b + 0.5]; };
      const pu = Array(NP).fill(0.5), pv = Array(NP).fill(0), lives = Array(NP).fill(LIVES), got = new Set();
      let ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 }, serve = 1.5, msg = '', msgT = 0, hits = 0, trail = [], target = null, sendT = 0, aliveT = 0, started = false;
      const alive = (j) => j < NP && lives[j] > 0 && !ctx.out?.has(j);
      const T = { uz: '❤️ {n} — oxirgi qolgan yutadi', ru: '❤️ {n} — побеждает последний', en: '❤️ {n} — last one standing wins' }[L()] || PK('x')?.pong_last || '❤️ {n} — last one standing wins';
      const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < NP) { got.add(s); const nx = Math.max(PW / 2, Math.min(1 - PW / 2, +d.u || 0.5)); pv[s] = (nx - pu[s]) * 25; pu[s] = nx; } },
        onSnap: (d) => { d.p.forEach((u, i) => { if (i !== ME || ctx.me < 0) pu[i] = u; }); if (d.l.some((v, i) => v < lives[i])) { snd(880, 0.25, 0.07); msg = d.l[ME] < lives[ME] && ctx.me >= 0 ? '💔' : '🏓'; msgT = 0.9; } d.l.forEach((v, i) => (lives[i] = v)); if (d.h > hits) snd(520, 0.04, 0.05, 'square'); hits = d.h; } });
      const doServe = () => { const al = [...Array(NP).keys()].filter(alive), j = al[ri(al.length)] ?? 0; const [vx, vy] = rot((Math.random() - 0.5) * 0.5, 0.8, j); ball = { x: 0.5, y: 0.5, vx, vy }; };
      const lose = (j) => { lives[j]--; msg = j === ME && ctx.me >= 0 ? '💔' : '🏓'; msgT = 0.9; snd(880, 0.25, 0.07); trail = []; ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 }; serve = 1;
        const al = [...Array(NP).keys()].filter(alive); if (al.length <= 1) H.end(al.length ? al[0] : ctx.DRAW); };
      const pc = (j) => j >= NP ? '#64748B' : COL[j];
      ctx.turn(-1, T.replace('{n}', LIVES));
      const stop = loop((dt) => {
        const kd = keysDown;
        if (kd.has('arrowleft') || kd.has('a')) target = Math.max(0, (target ?? pu[ME]) - dt * 1.6); if (kd.has('arrowright') || kd.has('d')) target = Math.min(1, (target ?? pu[ME]) + dt * 1.6);
        if (target != null && ctx.me >= 0 && alive(ME)) { const nx = pu[ME] + (target - pu[ME]) * Math.min(1, dt * 18); pv[ME] = (nx - pu[ME]) / dt; pu[ME] = Math.max(PW / 2, Math.min(1 - PW / 2, nx)); }
        sendT += dt; const live = H.link.st.alive; if (live) aliveT += dt;
        if (H.HOST && live && !H.over) {
          if (!started) started = aliveT > 4 || ctx.active().every((s) => s === 0 || got.has(s)); // hamma ulanguncha kutamiz
          if (!started); else if (serve > 0) { serve -= dt; if (serve <= 0) doServe(); }
          else for (let st = 0; st < 4; st++) {
            const h = dt / 4; ball.x += ball.vx * h; ball.y += ball.vy * h; trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); let lost = false;
            for (let j = 0; j < 4; j++) {
              let [lx, ly] = loc(ball.x, ball.y, j), [lvx, lvy] = rot(ball.vx, ball.vy, -j), ch = false;
              if (alive(j)) {
                if (lvy > 0 && Math.abs(ly - PY) < PH / 2 + BR && Math.abs(lx - pu[j]) < PW / 2 + BR) { const off = (lx - pu[j]) / (PW / 2), sp = Math.min(2, Math.hypot(lvx, lvy) * 1.05 + 0.02); lvy = -sp * Math.cos(off * 0.9); lvx = sp * Math.sin(off * 0.9) + pv[j] * 0.25; ly = PY - (PH / 2 + BR); hits++; ch = true; snd(520, 0.04, 0.05, 'square'); }
                else if (ly > 1.05) { lose(j); lost = true; break; }
              } else if (ly > 1 - BR && lvy > 0) { ly = 1 - BR; lvy = -lvy; if (Math.abs(lvx) < Math.abs(lvy) * 0.3) lvx = (lvx < 0 ? -1 : 1) * Math.abs(lvy) * 0.3; ch = true; } // devor: to'g'ri chiziqda qotib qolmasin
              if (ch) { [ball.x, ball.y] = wld(lx, ly, j); [ball.vx, ball.vy] = rot(lvx, lvy, j); }
            }
            if (lost) break;
          }
          if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', b: [Math.round(ball.x * 1000) / 1000, Math.round(ball.y * 1000) / 1000], p: pu.map((u) => Math.round(u * 1000) / 1000), l: lives, h: hits }); }
        } else if (!H.HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'i', u: Math.round(pu[ME] * 1000) / 1000 }); }
        if (!H.HOST && H.snap) { const pv0 = H.prevS(); ball.x = H.lerp(pv0?.b[0] ?? H.snap.b[0], H.snap.b[0], 33); ball.y = H.lerp(pv0?.b[1] ?? H.snap.b[1], H.snap.b[1], 33); trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); }
        // chizish: har kim o'z tomonini pastda ko'radi
        const top = 34, s = Math.min(c.W, c.H - top - 6), ox = (c.W - s) / 2, oy = top + (c.H - top - s) / 2, V = (x, y, j) => { const [a, b] = j == null ? loc(x, y, ME) : loc(...wld(x, y, j), ME); return [ox + a * s, oy + b * s]; };
        const gr = g.createLinearGradient(0, oy, 0, oy + s); gr.addColorStop(0, '#1E3A8A'); gr.addColorStop(1, '#1D4ED8'); g.fillStyle = '#0B1022'; g.fillRect(0, 0, c.W, c.H); g.fillStyle = gr; rr(g, ox, oy, s, s, 14); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + s, oy + s); g.moveTo(ox + s, oy); g.lineTo(ox, oy + s); g.stroke(); g.setLineDash([]);
        for (let j = 0; j < 4; j++) { const [x1, y1] = V(0, 1, j), [x2, y2] = V(1, 1, j); g.lineCap = 'round';
          if (alive(j)) { g.strokeStyle = pc(j) + '88'; g.lineWidth = 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
          else { g.strokeStyle = '#94A3B8'; g.lineWidth = 9; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } g.lineCap = 'butt'; }
        trail.forEach((q, i) => { const [x, y] = V(q[0], q[1]); g.fillStyle = `rgba(253,224,71,${i / trail.length * 0.4})`; g.beginPath(); g.arc(x, y, BR * s * (i / trail.length), 0, 7); g.fill(); });
        { const [x, y] = V(ball.x, ball.y); g.fillStyle = '#FDE047'; g.beginPath(); g.arc(x, y, BR * s, 0, 7); g.fill(); }
        for (let j = 0; j < NP; j++) { if (!alive(j)) continue; const [x, y] = V(pu[j], PY, j), hz = ((j - ME) % 2 + 2) % 2 === 0, w = (hz ? PW : PH) * s, hh = (hz ? PH : PW) * s;
          g.fillStyle = pc(j); rr(g, x - w / 2, y - hh / 2, w, hh, 7); g.fill(); if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; rr(g, x - w / 2 - 2, y - hh / 2 - 2, w + 4, hh + 4, 8); g.stroke(); } }
        // har o'rin: rangli nuqta + jonlar
        const cw = Math.min(90, c.W / NP); for (let j = 0; j < NP; j++) { const x = c.W / 2 + (j - (NP - 1) / 2) * cw; g.globalAlpha = alive(j) ? 1 : 0.4; g.fillStyle = pc(j); g.beginPath(); g.arc(x - 16, 17, 7, 0, 7); g.fill(); if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x - 16, 17, 10, 0, 7); g.stroke(); } text(g, '❤' + lives[j], x + 8, 17, 15, '#fff'); g.globalAlpha = 1; }
        if (!H.link.st.alive || (H.HOST && !started)) text(g, rt('wait_rt'), c.W / 2, oy + s / 2 - 50, 16);
        if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, oy + s / 2, 46); }
        if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, oy + s * 0.7, 14, '#FCA5A5');
      });
      const onPt = (e) => { if (ctx.me >= 0) target = (pos(c, e)[0] - (c.W - Math.min(c.W, c.H - 40)) / 2) / Math.min(c.W, c.H - 40); };
      c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
      return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (H.HOST && s < NP) { lives[s] = 0; const al = [...Array(NP).keys()].filter(alive); if (al.length <= 1 && !H.over) H.end(al.length ? al[0] : ctx.DRAW); } } };
    }
    const { c, g, fit } = canvasIn(stage, 0.6);
    const TW = 1, TH = 1.7, PW = 0.24, PH = 0.035, BR = 0.022, WIN = 7, flip = ctx.me === 1, ME = Math.max(0, ctx.me);
    const pd = [{ x: 0.5, vx: 0 }, { x: 0.5, vx: 0 }]; let ball = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }, sc = [0, 0], serve = 1.2, server = 0, msg = '', msgT = 0, hits = 0, trail = [];
    let target = null, sendT = 0;
    const toX = (px) => { const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2; let x = (px - ox) / s; return flip ? TW - x : x; };
    const onPt = (e) => { if (ctx.me >= 0) target = toX(pos(c, e)[0]); };
    c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
    const H = hostGame(ctx, { onInput: (d) => { const nx = +d.x; pd[1].vx = (nx - pd[1].x) * 25; pd[1].x = nx; }, onSnap: (d) => { if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(880, 0.25, 0.07); msg = '🏓'; msgT = 0.9; } if (d.h > hits) snd(520, 0.04, 0.05, 'square'); hits = d.h; sc = d.sc; pd[0].x = d.p0; } });
    const doServe = () => { const dir = server === 0 ? -1 : 1; ball = { x: 0.5, y: TH / 2, vx: (Math.random() - 0.5) * 0.5, vy: dir * 0.85 }; };
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const mine = pd[ME]; const kd = keysDown;
      if (kd.has('arrowleft') || kd.has('a')) target = Math.max(0, (target ?? mine.x) - dt * 1.6); if (kd.has('arrowright') || kd.has('d')) target = Math.min(1, (target ?? mine.x) + dt * 1.6);
      if (target != null && ctx.me >= 0) { const nx = mine.x + (target - mine.x) * Math.min(1, dt * 18); mine.vx = (nx - mine.x) / dt; mine.x = Math.max(PW / 2, Math.min(TW - PW / 2, nx)); }
      sendT += dt; const live = H.link.st.alive;
      if (H.HOST && live && !H.over) {
        if (serve > 0) { serve -= dt; if (serve <= 0) doServe(); }
        else for (let st = 0; st < 4; st++) {
          const h = dt / 4; ball.x += ball.vx * h; ball.y += ball.vy * h; trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift();
          if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); } if (ball.x > TW - BR) { ball.x = TW - BR; ball.vx = -Math.abs(ball.vx); }
          for (const s of [0, 1]) { const py = s === 0 ? TH - 0.09 : 0.09, p = pd[s];
            if (Math.abs(ball.y - py) < PH / 2 + BR && Math.abs(ball.x - p.x) < PW / 2 + BR && (s === 0 ? ball.vy > 0 : ball.vy < 0)) {
              const off = (ball.x - p.x) / (PW / 2); const sp = Math.min(2.4, Math.hypot(ball.vx, ball.vy) * 1.06 + 0.02);
              ball.vy = (s === 0 ? -1 : 1) * sp * Math.cos(off * 0.9); ball.vx = sp * Math.sin(off * 0.9) + p.vx * 0.25; ball.y = py + (s === 0 ? -1 : 1) * (PH / 2 + BR); hits++; snd(520, 0.04, 0.05, 'square'); } }
          if (ball.y > TH + 0.05 || ball.y < -0.05) { const w = ball.y < 0 ? 0 : 1; sc[w]++; server = 1 - w; serve = 1; msg = '🏓'; msgT = 0.9; snd(880, 0.25, 0.07); trail = []; ball = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }; if (sc[w] >= WIN) H.end(w); break; }
        }
        if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', b: [Math.round(ball.x * 1000) / 1000, Math.round(ball.y * 1000) / 1000], p0: Math.round(pd[0].x * 1000) / 1000, sc, h: hits }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(pd[1].x * 1000) / 1000 }); }
      if (!H.HOST && H.snap) { const pv = H.prevS(); ball.x = H.lerp(pv?.b[0] ?? H.snap.b[0], H.snap.b[0], 33); ball.y = H.lerp(pv?.b[1] ?? H.snap.b[1], H.snap.b[1], 33); trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); }
      const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2, X = (x) => ox + (flip ? TW - x : x) * s, Y = (y) => oy + (flip ? TH - y : y) * s;
      const gr = g.createLinearGradient(0, oy, 0, oy + TH * s); gr.addColorStop(0, '#1E3A8A'); gr.addColorStop(1, '#1D4ED8'); g.fillStyle = '#0B1022'; g.fillRect(0, 0, c.W, c.H); g.fillStyle = gr; rr(g, ox, oy, TW * s, TH * s, 14); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(ox + 4, oy + 4, TW * s - 8, TH * s - 8); g.setLineDash([10, 10]); g.beginPath(); g.moveTo(ox, oy + TH * s / 2); g.lineTo(ox + TW * s, oy + TH * s / 2); g.stroke(); g.setLineDash([]);
      trail.forEach((q, i) => { g.fillStyle = `rgba(253,224,71,${i / trail.length * 0.4})`; g.beginPath(); g.arc(X(q[0]), Y(q[1]), BR * s * (i / trail.length), 0, 7); g.fill(); });
      g.fillStyle = '#FDE047'; g.beginPath(); g.arc(X(ball.x), Y(ball.y), BR * s, 0, 7); g.fill();
      [[0, TH - 0.09, '#22D3EE'], [1, 0.09, '#F472B6']].forEach(([i, y, col]) => { g.fillStyle = col; rr(g, X(pd[i].x) - (PW / 2) * s, Y(y) - (PH / 2) * s, PW * s, PH * s, 8); g.fill(); });
      text(g, String(sc[ME]), c.W - 26, c.H / 2 + 30, 28, '#fff'); text(g, String(sc[1 - ME]), c.W - 26, c.H / 2 - 30, 28, 'rgba(255,255,255,.5)');
      if (!H.link.st.alive) text(g, rt('wait_rt'), c.W / 2, c.H / 2 - 50, 16);
      if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, c.H / 2, 46); }
      if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit };
  };

  // ---- Tank jangi: devorli maydon, o'q devordan bir marta qaytadi. 5 ta g'alaba ----
  MPI.tanks = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.75);
    const pad = padUI(stage, [{ id: 'fire', t: '💥', cls: 'big' }]);
    const N = ctx.n > 2 ? ctx.n : 2, AW = 20, AH = 15, WIN = 5, ME = Math.max(0, ctx.me), COL = N > 2 ? ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'] : ['#22C55E', '#F97316'];
    const WALLS = [[4, 3, 1, 4], [15, 8, 1, 4], [8, 7, 4, 1], [9, 2, 2, 1], [9, 12, 2, 1], [3, 11, 3, 1], [14, 3, 3, 1]];
    const wallHit = (x, y, r) => x < r || y < r || x > AW - r || y > AH - r || WALLS.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r);
    // 4 burchak: 0 past-chap, 1 tepa-o'ng, 2 tepa-chap, 3 past-o'ng
    const SP = [{ x: 2, y: AH - 2, a: -Math.PI / 4 }, { x: AW - 2, y: 2, a: (3 * Math.PI) / 4 }, { x: 2, y: 2, a: Math.PI / 4 }, { x: AW - 2, y: AH - 2, a: (-3 * Math.PI) / 4 }];
    const spawn = (i) => ({ ...SP[i] });
    const FL = (i) => i === 1 || i === 2; // tepada boshlaganlar uchun ekran 180° burilgan
    let T = Array.from({ length: N }, (_, i) => ({ ...spawn(i), hp: 3, dead: 0, cd: 0, out: 0 })), B = [], sc = Array(N).fill(0), fx = [], sendT = 0;
    const gin = Array.from({ length: N }, () => ({ x: 0, y: 0, f: 0 })), seen = Array(N).fill(0); let myF = 0;
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < N) { gin[s].x = +d.x || 0; gin[s].y = +d.y || 0; gin[s].f = d.f | 0; } }, onSnap: (d) => { if (sum(d.sc) > sum(sc)) snd(120, 0.5, 0.1, 'sawtooth'); sc = d.sc; (d.fx || []).forEach((e) => fx.push({ x: e[0], y: e[1], t: 0.5 })); } });
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
      if (pad.take('fire') || kd.has(' ')) myF++;
      sendT += dt; const newFx = [];
      if (H.HOST && H.link.st.alive && !H.over) {
        const inputs = T.map((_, i) => (i === 0 ? { x: jx, y: jy, f: myF } : FL(i) ? { x: -gin[i].x, y: -gin[i].y, f: gin[i].f } : gin[i]));
        const fire = inputs.map((p, i) => p.f > seen[i]); inputs.forEach((p, i) => (seen[i] = p.f));
        T.forEach((t, i) => {
          if (t.out) return; t.cd = Math.max(0, t.cd - dt);
          if (t.dead > 0) { t.dead -= dt; if (t.dead <= 0) Object.assign(t, spawn(i), { hp: 3 }); return; }
          const inp = inputs[i], m = Math.hypot(inp.x, inp.y);
          if (m > 0.2) { const want = Math.atan2(inp.y, inp.x); let da = ((want - t.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; t.a += Math.max(-4 * dt, Math.min(4 * dt, da)); const sp = 4.2 * Math.min(1, m) * (Math.abs(da) < 1.2 ? 1 : 0.3); const nx = t.x + Math.cos(t.a) * sp * dt, ny = t.y + Math.sin(t.a) * sp * dt; if (!wallHit(nx, t.y, 0.55)) t.x = nx; if (!wallHit(t.x, ny, 0.55)) t.y = ny; }
          if (fire[i] && t.cd <= 0) { t.cd = 0.6; B.push({ x: t.x + Math.cos(t.a) * 0.8, y: t.y + Math.sin(t.a) * 0.8, vx: Math.cos(t.a) * 11, vy: Math.sin(t.a) * 11, o: i, b: 1, life: 2.2 }); snd(200, 0.08, 0.06, 'square'); }
        });
        for (const b of B) {
          b.life -= dt; const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
          if (wallHit(nx, b.y, 0.1)) { if (b.b-- > 0) b.vx = -b.vx; else b.life = 0; } else b.x = nx;
          if (wallHit(b.x, ny, 0.1)) { if (b.b-- > 0) b.vy = -b.vy; else b.life = 0; } else b.y = ny;
          T.forEach((t, i) => { if (b.life > 0 && !t.out && t.dead <= 0 && (i !== b.o || b.b < 1) && Math.hypot(t.x - b.x, t.y - b.y) < 0.6) { b.life = 0; t.hp--; newFx.push([b.x, b.y]); snd(90, 0.15, 0.08, 'sawtooth'); if (t.hp <= 0) { t.dead = 2; newFx.push([t.x, t.y]);
            if (N === 2) { const w = i === b.o ? 1 - i : b.o; sc[w]++; if (sc[w] >= WIN) H.end(w); }
            else if (i === b.o) sc[i] = Math.max(0, sc[i] - 1); // o'zini o'ldirsa −1
            else { sc[b.o]++; if (sc[b.o] >= WIN) H.end(b.o); } } } });
        }
        B = B.filter((b) => b.life > 0); newFx.forEach((e) => fx.push({ x: e[0], y: e[1], t: 0.5 }));
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 's', T: T.map((t) => [Math.round(t.x * 100) / 100, Math.round(t.y * 100) / 100, Math.round(t.a * 100) / 100, t.hp, t.dead > 0 || t.out ? 1 : 0]), B: B.map((b) => [Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10]), sc, fx: newFx }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, f: myF }); }
      let TV = T.map((t) => [t.x, t.y, t.a, t.hp, t.dead > 0 || t.out ? 1 : 0]), BV = B.map((b) => [b.x, b.y]);
      if (!H.HOST && H.snap) { const pv = H.prevS(); TV = H.snap.T.map((q, i) => [H.lerp(pv?.T[i]?.[0] ?? q[0], q[0], 50), H.lerp(pv?.T[i]?.[1] ?? q[1], q[1], 50), q[2], q[3], q[4]]); BV = H.snap.B; }
      // chizish (tepadan boshlaganlar uchun 180° burilgan)
      const flip = ctx.me >= 0 && FL(ctx.me), s = Math.min(c.W / AW, c.H / AH), ox = (c.W - AW * s) / 2, oy = (c.H - AH * s) / 2, X = (x) => ox + (flip ? AW - x : x) * s, Y = (y) => oy + (flip ? AH - y : y) * s;
      g.fillStyle = '#1A2E05'; g.fillRect(0, 0, c.W, c.H); g.fillStyle = '#3F6212'; g.fillRect(ox, oy, AW * s, AH * s);
      g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < AW; i += 2) for (let j = (i / 2) % 2; j < AH; j += 2) g.fillRect(ox + i * s, oy + j * s, s, s);
      WALLS.forEach(([wx, wy, ww, wh]) => { const x0 = Math.min(X(wx), X(wx + ww)), y0 = Math.min(Y(wy), Y(wy + wh)); g.fillStyle = '#57534E'; g.fillRect(x0, y0, ww * s, wh * s); g.fillStyle = '#78716C'; g.fillRect(x0 + 2, y0 + 2, ww * s - 4, wh * s / 2 - 2); });
      TV.forEach((q, i) => { if (q[4]) return; if (N > 2 && i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 3; g.beginPath(); g.arc(X(q[0]), Y(q[1]), 0.85 * s, 0, 7); g.stroke(); }
        g.save(); g.translate(X(q[0]), Y(q[1])); g.rotate(q[2] + (flip ? Math.PI : 0)); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-0.55 * s + 3, -0.45 * s + 3, 1.1 * s, 0.9 * s); g.fillStyle = '#1C1917'; g.fillRect(-0.6 * s, -0.5 * s, 1.2 * s, 0.22 * s); g.fillRect(-0.6 * s, 0.28 * s, 1.2 * s, 0.22 * s); g.fillStyle = COL[i]; rr(g, -0.5 * s, -0.36 * s, 1 * s, 0.72 * s, 5); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(0, 0, 0.26 * s, 0, 7); g.fill(); g.fillStyle = '#0C0A09'; g.fillRect(0, -0.07 * s, 0.75 * s, 0.14 * s); g.restore();
        for (let k = 0; k < 3; k++) { g.fillStyle = k < q[3] ? '#22C55E' : 'rgba(255,255,255,.25)'; g.fillRect(X(q[0]) - 0.45 * s + k * 0.32 * s, Y(q[1]) - 0.85 * s, 0.26 * s, 0.1 * s); } });
      g.fillStyle = '#FDE047'; BV.forEach((b) => { g.beginPath(); g.arc(X(b[0]), Y(b[1]), 0.13 * s, 0, 7); g.fill(); });
      fx = fx.filter((e) => (e.t -= dt) > 0); fx.forEach((e) => { g.fillStyle = `rgba(251,146,60,${e.t * 2})`; g.beginPath(); g.arc(X(e.x), Y(e.y), (0.5 - e.t) * 3 * s + 0.3 * s, 0, 7); g.fill(); });
      if (N === 2) { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, c.W / 2 - 70, 6, 140, 28, 14); g.fill(); text(g, `${ME ? '🟠' : '🟢'} ${sc[ME]} : ${sc[1 - ME]} ${ME ? '🟢' : '🟠'}`, c.W / 2, 20, 15); }
      else { const w = N * 50; g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, c.W / 2 - w / 2, 6, w, 28, 14); g.fill(); sc.forEach((v, i) => { const x = c.W / 2 - w / 2 + 14 + i * 50, dim = ctx.out?.has(i); g.globalAlpha = dim ? 0.35 : 1; g.fillStyle = COL[i]; g.beginPath(); g.arc(x, 20, 7, 0, 7); g.fill(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } text(g, String(v), x + 18, 20, 15, i === ctx.me ? '#FDE047' : '#fff'); g.globalAlpha = 1; }); }
      if (!H.link.st.alive) text(g, rt('wait_rt'), c.W / 2, c.H / 2, 16); else if (ctx.me >= 0 && TV[ME]?.[4] && !ctx.out?.has(ME)) text(g, rt('respawn'), c.W / 2, c.H / 2, 18, '#FCA5A5');
      if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (T[s]) T[s].out = 1; B = B.filter((b) => b.o !== s); } };
  };

  // ---- Sumo: raqibni doiradan itarib chiqaring. 3 raund yutgan g'olib ----
  MPI.sumo = (stage, ctx) => {
    if ((ctx.n || 2) > 2) { // 3–4 kishi: hamma doirada, chiqib ketgan raunddan chiqadi, oxirgi qolgan raundni yutadi
      stage.classList.add('gm-stage-pad');
      const NP = ctx.n, { c, g, fit } = canvasIn(stage, 0.8), pad = padUI(stage, [{ id: 'dash', t: '💨', cls: 'big' }]);
      const R = 1, PR = 0.13, WIN = 3, ME = Math.max(0, ctx.me), COL = ctx.col, AN = (i) => Math.PI / 2 + (i * Math.PI * 2) / NP, VA = -(ME * Math.PI * 2) / NP; // VA: o'zimiz pastda bo'lishi uchun burish
      const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
      const start = () => Array.from({ length: NP }, (_, i) => ({ x: Math.cos(AN(i)) * 0.5, y: Math.sin(AN(i)) * 0.5, vx: 0, vy: 0, dash: 0, cd: 0, in: !ctx.out?.has(i) }));
      let P = start(), sc = Array(NP).fill(0), pause = 1.5, msg = '', msgT = 0, sendT = 0, aliveT = 0, started = false;
      const gin = Array.from({ length: NP }, () => ({ x: 0, y: 0, d: 0 })), seen = Array(NP).fill(0), got = new Set(); let myD = 0;
      const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < NP) { got.add(s); gin[s] = { x: Math.max(-1, Math.min(1, +d.x || 0)), y: Math.max(-1, Math.min(1, +d.y || 0)), d: d.d | 0 }; } },
        onSnap: (d) => { if (d.sc.reduce((a, b) => a + b, 0) > sc.reduce((a, b) => a + b, 0)) { snd(300, 0.4, 0.08, 'triangle'); msg = '💥'; msgT = 1; } sc = d.sc; } });
      ctx.turn(-1, rt('first').replace('{n}', WIN));
      const stop = loop((dt) => {
        const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
        if (pad.take('dash') || kd.has(' ')) myD++;
        [jx, jy] = rot(jx, jy, -VA); // ekran yo'nalishi → maydon yo'nalishi
        sendT += dt; if (H.link.st.alive) aliveT += dt;
        if (H.HOST && H.link.st.alive && !H.over) {
          if (!started) started = aliveT > 4 || ctx.active().every((s) => s === 0 || got.has(s));
          gin[0] = { x: jx, y: jy, d: myD }; const dsh = gin.map((q, i) => q.d > seen[i]); gin.forEach((q, i) => (seen[i] = q.d));
          if (!started); else if (pause > 0) { pause -= dt; if (pause <= 0) P = start(); }
          else {
            P.forEach((p, i) => { if (!p.in) return; const inp = ctx.out?.has(i) ? { x: 0, y: 0 } : gin[i]; p.cd = Math.max(0, p.cd - dt); p.dash = Math.max(0, p.dash - dt); p.vx += inp.x * 3.2 * dt; p.vy += inp.y * 3.2 * dt;
              if (dsh[i] && p.cd <= 0 && !ctx.out?.has(i)) { const m = Math.hypot(inp.x, inp.y) || 1; p.vx += (inp.x / m) * 1.6; p.vy += (inp.y / m) * 1.6; p.cd = 1.4; p.dash = 0.25; snd(240, 0.08, 0.06); }
              p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; });
            for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) { const a = P[i], b = P[j]; if (!a.in || !b.in) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
              if (d < PR * 2 && d > 0) { const nx = dx / d, ny = dy / d, rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rv > 0) { const ka = a.dash > 0 ? 0.6 : 1, kb = b.dash > 0 ? 0.6 : 1; const jj = rv * 1.25; a.vx -= jj * nx * ka; a.vy -= jj * ny * ka; b.vx += jj * nx * kb; b.vy += jj * ny * kb; snd(160, 0.05, 0.06); } const o = (PR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; } }
            P.forEach((p) => { if (p.in && Math.hypot(p.x, p.y) > R + PR * 0.3) { p.in = false; snd(200, 0.2, 0.06, 'triangle'); } });
            const left = P.map((p, i) => (p.in ? i : -1)).filter((i) => i >= 0);
            if (left.length <= 1) { const w = left.length ? left[0] : -1; if (w >= 0) { sc[w]++; msg = '💥'; msgT = 1; snd(300, 0.4, 0.08, 'triangle'); if (sc[w] >= WIN) H.end(w); } pause = 1.4; }
          }
          if (sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 's', P: P.map((p) => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.dash > 0 ? 1 : 0, Math.round(p.cd * 10) / 10, p.in ? 1 : 0]), sc }); }
        } else if (!H.HOST && ctx.me >= 0 && sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, d: myD }); }
        let PV = P.map((p) => [p.x, p.y, p.dash > 0 ? 1 : 0, p.cd, p.in ? 1 : 0]);
        if (!H.HOST && H.snap) { const pv = H.prevS(); PV = H.snap.P.map((q, i) => [H.lerp(pv?.P[i]?.[0] ?? q[0], q[0], 40), H.lerp(pv?.P[i]?.[1] ?? q[1], q[1], 40), q[2], q[3], q[4]]); }
        const s = Math.min(c.W, c.H) / 2.6, cx = c.W / 2, cy = c.H / 2 + 10, V = (x, y) => { const [a, b] = rot(x, y, VA); return [cx + a * s, cy + b * s]; };
        g.fillStyle = '#1C1917'; g.fillRect(0, 0, c.W, c.H);
        g.fillStyle = '#D6B98C'; g.beginPath(); g.arc(cx, cy, (R + 0.12) * s, 0, 7); g.fill(); g.fillStyle = '#E7CFA4'; g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.fill();
        g.strokeStyle = '#F8FAFC'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.stroke();
        for (let i = 0; i < NP; i++) { const [x, y] = V(Math.cos(AN(i)) * 0.5, Math.sin(AN(i)) * 0.5); g.strokeStyle = COL[i] + '66'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s * 0.7, 0, 7); g.stroke(); } // boshlang'ich joylar
        PV.forEach((q, i) => { const [x, y] = V(q[0], q[1]); g.globalAlpha = q[4] ? 1 : 0.3; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 3, y + 5, PR * s, PR * s * 0.7, 0, 0, 7); g.fill(); g.fillStyle = COL[i]; g.beginPath(); g.arc(x, y, PR * s, 0, 7); g.fill(); g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x, y, PR * s * 0.55, 0, 7); g.fill();
          if (q[2]) { g.strokeStyle = '#FDE047'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 5, 0, 7); g.stroke(); }
          if (i === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(x, y, PR * s + 12, 0, 7); g.stroke(); g.setLineDash([]); if (q[3] > 0) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 8, -Math.PI / 2, -Math.PI / 2 + (1 - q[3] / 1.4) * Math.PI * 2); g.stroke(); } }
          g.globalAlpha = 1; });
        const cw = Math.min(80, c.W / NP); for (let j = 0; j < NP; j++) { const x = cw * (j - (NP - 1) / 2) + cx; g.globalAlpha = ctx.out?.has(j) ? 0.4 : 1; g.fillStyle = COL[j]; g.beginPath(); g.arc(x - 12, 22, 8, 0, 7); g.fill(); if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x - 12, 22, 11, 0, 7); g.stroke(); } text(g, String(sc[j]), x + 10, 22, 20); g.globalAlpha = 1; }
        if (!H.link.st.alive || (H.HOST && !started)) text(g, rt('wait_rt'), cx, cy, 16, '#111');
        else if (ctx.me >= 0 && PV[ME] && !PV[ME][4]) text(g, '👀', cx, cy + R * s * 0.55, 22);
        if (msgT > 0) { msgT -= dt; text(g, msg, cx, cy, 54); }
        if (H.link.lost() && !H.over) text(g, rt('lost'), cx, c.H * 0.9, 14, '#FCA5A5');
      });
      return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (P[s]) P[s].in = false; } };
    }
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.8);
    const pad = padUI(stage, [{ id: 'dash', t: '💨', cls: 'big' }]);
    const R = 1, PR = 0.13, WIN = 3, ME = Math.max(0, ctx.me), COL = ['#2563EB', '#DC2626'];
    const start = () => [{ x: 0, y: 0.45, vx: 0, vy: 0, dash: 0, cd: 0 }, { x: 0, y: -0.45, vx: 0, vy: 0, dash: 0, cd: 0 }];
    let P = start(), sc = [0, 0], pause = 1.5, msg = '', msgT = 0, sendT = 0;
    const gin = { x: 0, y: 0, d: 0 }; let seenD = 0, myD = 0, seenD0 = 0;
    const H = hostGame(ctx, { onInput: (d) => { gin.x = +d.x || 0; gin.y = +d.y || 0; gin.d = d.d | 0; }, onSnap: (d) => { if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(300, 0.4, 0.08, 'triangle'); msg = '💥'; msgT = 1; } sc = d.sc; } });
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
      if (pad.take('dash') || kd.has(' ')) myD++;
      sendT += dt;
      if (H.HOST && H.link.st.alive && !H.over) {
        const inputs = [{ x: jx, y: jy, d: myD }, { x: -gin.x, y: -gin.y, d: gin.d }]; const dsh = [inputs[0].d > seenD0, inputs[1].d > seenD]; seenD0 = inputs[0].d; seenD = inputs[1].d;
        if (pause > 0) { pause -= dt; if (pause <= 0) P = start(); }
        else {
          P.forEach((p, i) => { const inp = inputs[i]; p.cd = Math.max(0, p.cd - dt); p.dash = Math.max(0, p.dash - dt); p.vx += inp.x * 3.2 * dt; p.vy += inp.y * 3.2 * dt;
            if (dsh[i] && p.cd <= 0) { const m = Math.hypot(inp.x, inp.y) || 1; p.vx += (inp.x / m) * 1.6; p.vy += (inp.y / m) * 1.6; p.cd = 1.4; p.dash = 0.25; snd(240, 0.08, 0.06); }
            p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; });
          const [a, b] = P, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < PR * 2 && d > 0) { const nx = dx / d, ny = dy / d, rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rv > 0) { const ka = a.dash > 0 ? 0.6 : 1, kb = b.dash > 0 ? 0.6 : 1; const j = rv * 1.25; a.vx -= j * nx * ka; a.vy -= j * ny * ka; b.vx += j * nx * kb; b.vy += j * ny * kb; snd(160, 0.05, 0.06); } const o = (PR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; }
          const out = P.map((p) => Math.hypot(p.x, p.y) > R + PR * 0.3);
          if (out[0] || out[1]) { const w = out[0] && out[1] ? -1 : out[0] ? 1 : 0; if (w >= 0) { sc[w]++; msg = '💥'; msgT = 1; snd(300, 0.4, 0.08, 'triangle'); if (sc[w] >= WIN) H.end(w); } pause = 1.4; }
        }
        if (sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 's', P: P.map((p) => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.dash > 0 ? 1 : 0, Math.round(p.cd * 10) / 10]), sc }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, d: myD }); }
      let PV = P.map((p) => [p.x, p.y, p.dash > 0 ? 1 : 0, p.cd]);
      if (!H.HOST && H.snap) { const pv = H.prevS(); PV = H.snap.P.map((q, i) => [H.lerp(pv?.P[i][0] ?? q[0], q[0], 40), H.lerp(pv?.P[i][1] ?? q[1], q[1], 40), q[2], q[3]]); }
      const flip = ctx.me === 1, s = Math.min(c.W, c.H) / 2.6, cx = c.W / 2, cy = c.H / 2, X = (x) => cx + (flip ? -x : x) * s, Y = (y) => cy + (flip ? -y : y) * s;
      g.fillStyle = '#1C1917'; g.fillRect(0, 0, c.W, c.H);
      g.fillStyle = '#D6B98C'; g.beginPath(); g.arc(cx, cy, (R + 0.12) * s, 0, 7); g.fill(); g.fillStyle = '#E7CFA4'; g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.fill();
      g.strokeStyle = '#F8FAFC'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.stroke(); g.lineWidth = 3; [[-0.12, 0.2], [0.12, 0.2]].forEach(([x]) => { g.beginPath(); g.moveTo(cx + x * s, cy - 0.12 * s); g.lineTo(cx + x * s, cy + 0.12 * s); g.stroke(); });
      PV.forEach((q, i) => { const x = X(q[0]), y = Y(q[1]); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 3, y + 5, PR * s, PR * s * 0.7, 0, 0, 7); g.fill(); g.fillStyle = COL[i]; g.beginPath(); g.arc(x, y, PR * s, 0, 7); g.fill(); g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x, y, PR * s * 0.55, 0, 7); g.fill(); if (q[2]) { g.strokeStyle = '#FDE047'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 5, 0, 7); g.stroke(); } if (i === ME && q[3] > 0) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 9, -Math.PI / 2, -Math.PI / 2 + (1 - q[3] / 1.4) * Math.PI * 2); g.stroke(); } });
      text(g, `${sc[ME]} : ${sc[1 - ME]}`, cx, 24, 22);
      if (!H.link.st.alive) text(g, rt('wait_rt'), cx, cy, 16, '#111');
      if (msgT > 0) { msgT -= dt; text(g, msg, cx, cy, 54); }
      if (H.link.lost() && !H.over) text(g, rt('lost'), cx, c.H * 0.9, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit };
  };

  window.BirgaGames = { _dicts: () => ({ g: T, mt: MT, rt: RT_T, race: RACE_T }), list: GAMES, start: startGame, renderLobby, tg, openRoom, invite, cardHTML, GameCards, mt, mp: MPL, _room: () => Room };
})();
